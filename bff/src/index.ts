import { serve } from '@hono/node-server';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { nanoid } from 'nanoid';

type AuthUser = {
  id: string;
  loginName: string;
  displayName?: string | null;
  email?: string | null;
};

type AppSession = {
  token: string;
  user: AuthUser;
  zitadelSessionId: string;
  zitadelSessionToken: string;
  createdAt: string;
};

type LoginBody = {
  loginName?: string;
  password?: string;
};

type IdpProvider = 'google' | 'apple';

type IdpStartBody = {
  provider?: IdpProvider;
  redirectUrl?: string;
};

type IdpCompleteBody = {
  idpIntentId?: string;
  idpIntentToken?: string;
  userId?: string;
};

type ZitadelCreateSessionResponse = {
  sessionId: string;
  sessionToken: string;
};

type ZitadelCreateIdpIntentResponse = {
  authUrl: string;
};

type ZitadelRetrieveIdpIntentResponse = {
  details?: {
    resourceOwner?: string;
  };
  idpInformation?: {
    idpId?: string;
    userId?: string;
    userName?: string;
    rawInformation?: Record<string, unknown>;
  };
  userId?: string;
  addHumanUser?: Record<string, unknown>;
  createUser?: {
    organizationId?: string;
    userId?: string;
    username?: string;
    metadata?: unknown[];
    human?: Record<string, unknown>;
  };
};

type ZitadelCreateUserResponse = {
  id?: string;
  userId?: string;
};

type ZitadelUpdateSessionResponse = {
  sessionToken: string;
};

type ZitadelGetSessionResponse = {
  session: {
    id: string;
    factors?: {
      user?: {
        id?: string;
        loginName?: string;
        displayName?: string;
      };
      password?: {
        verifiedAt?: string;
      };
    };
  };
};

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');

    process.env[key] ??= value;
  }
}

loadDotEnv();

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '0.0.0.0';
const zitadelApiBase = (process.env.ZITADEL_API_BASE ?? 'https://ahmeds-auth-qaw8wn.eu1.zitadel.cloud')
  .trim()
  .replace(/\/$/, '');
const zitadelServiceToken = process.env.ZITADEL_SERVICE_TOKEN;
const zitadelOrganizationId = process.env.ZITADEL_ORGANIZATION_ID;
const idpIds: Partial<Record<IdpProvider, string | undefined>> = {
  google: process.env.ZITADEL_GOOGLE_IDP_ID,
  apple: process.env.ZITADEL_APPLE_IDP_ID,
};

const sessions = new Map<string, AppSession>();

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
}

function getSession(authorization: string | undefined): AppSession | null {
  const token = getBearerToken(authorization);

  if (!token) {
    return null;
  }

  return sessions.get(token) ?? null;
}

async function createZitadelSession(loginName: string, password: string) {
  const createdSession = await zitadelJson<ZitadelCreateSessionResponse>('/v2/sessions', {
    method: 'POST',
    body: {
      checks: {
        user: {
          loginName,
        },
      },
    },
  });

  const updatedSession = await zitadelJson<ZitadelUpdateSessionResponse>(
    `/v2/sessions/${encodeURIComponent(createdSession.sessionId)}`,
    {
      method: 'PATCH',
      body: {
        checks: {
          password: {
            password,
          },
        },
      },
    }
  );

  const sessionToken = updatedSession.sessionToken;
  const sessionState = await getZitadelSession(createdSession.sessionId, sessionToken);
  const user = sessionState.session.factors?.user;
  const passwordFactor = sessionState.session.factors?.password;

  if (!user?.id || !user.loginName || !passwordFactor?.verifiedAt) {
    throw new Error('ZITADEL did not return a fully verified password session.');
  }

  return {
    zitadelSessionId: createdSession.sessionId,
    zitadelSessionToken: sessionToken,
    user: {
      id: user.id,
      loginName: user.loginName,
      email: user.loginName.includes('@') ? user.loginName : null,
      displayName: user.displayName ?? user.loginName,
    } satisfies AuthUser,
  };
}

async function createZitadelSessionFromIdpIntent(idpIntentId: string, idpIntentToken: string, userId?: string) {
  const intent = await zitadelJson<ZitadelRetrieveIdpIntentResponse>(
    `/v2/idp_intents/${encodeURIComponent(idpIntentId)}`,
    {
      method: 'POST',
      body: {
        idpIntentToken,
      },
    }
  );
  const resolvedUserId = userId || intent.userId || (await createUserFromIdpIntent(intent));

  if (!resolvedUserId) {
    throw new Error('This social login is not linked to a ZITADEL user yet, and ZITADEL did not return a user creation payload.');
  }

  const createdSession = await zitadelJson<ZitadelCreateSessionResponse>('/v2/sessions', {
    method: 'POST',
    body: {
      checks: {
        user: {
          userId: resolvedUserId,
        },
        idpIntent: {
          idpIntentId,
          idpIntentToken,
        },
      },
    },
  });

  const sessionState = await getZitadelSession(createdSession.sessionId, createdSession.sessionToken);
  const sessionUser = sessionState.session.factors?.user;
  const userName = intent.idpInformation?.userName;
  const rawInformation = intent.idpInformation?.rawInformation;
  const email = getStringFromRecord(rawInformation, 'email');
  const displayName = getStringFromRecord(rawInformation, 'name') || userName || email || sessionUser?.displayName;

  return {
    zitadelSessionId: createdSession.sessionId,
    zitadelSessionToken: createdSession.sessionToken,
    user: {
      id: resolvedUserId,
      loginName: sessionUser?.loginName || email || userName || resolvedUserId,
      email: email ?? null,
      displayName: displayName ?? null,
    } satisfies AuthUser,
  };
}

async function createUserFromIdpIntent(intent: ZitadelRetrieveIdpIntentResponse) {
  if (intent.createUser?.human) {
    const createUserBody = withFallbackHumanProfile(withOrganizationId(removeEmptyStrings(intent.createUser), intent), intent);
    const response = await zitadelJson<ZitadelCreateUserResponse>('/v2/users/new', {
      method: 'POST',
      body: createUserBody,
    });

    return response.id ?? response.userId ?? intent.createUser.userId ?? null;
  }

  if (intent.addHumanUser) {
    const addHumanUserBody = withFallbackHumanProfile(removeEmptyStrings(intent.addHumanUser), intent);
    const response = await zitadelJson<ZitadelCreateUserResponse>('/v2/users/human', {
      method: 'POST',
      body: addHumanUserBody,
    });

    return response.userId ?? response.id ?? getStringFromRecord(intent.addHumanUser, 'userId');
  }

  return null;
}

function withOrganizationId<T extends { organizationId?: string }>(body: T, intent: ZitadelRetrieveIdpIntentResponse): T {
  if (body.organizationId) {
    return body;
  }

  const organizationId = zitadelOrganizationId || intent.details?.resourceOwner;

  return organizationId ? { ...body, organizationId } : body;
}

function withFallbackHumanProfile<T>(body: T, intent: ZitadelRetrieveIdpIntentResponse): T {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const fallback = getFallbackProfile(intent);
  const bodyRecord = body as Record<string, unknown>;
  const human = getMutableRecord(bodyRecord.human) ?? bodyRecord;
  const profile = getMutableRecord(human.profile) ?? {};

  profile.givenName = getNonEmptyString(profile.givenName) ?? fallback.givenName;
  profile.familyName = getNonEmptyString(profile.familyName) ?? fallback.familyName;
  profile.displayName = getNonEmptyString(profile.displayName) ?? fallback.displayName;
  human.profile = profile;

  if (bodyRecord.human && typeof bodyRecord.human === 'object') {
    bodyRecord.human = human;
  }

  return body;
}

function getFallbackProfile(intent: ZitadelRetrieveIdpIntentResponse) {
  const rawInformation = intent.idpInformation?.rawInformation;
  const email = getStringFromRecord(rawInformation, 'email');
  const fullName =
    getStringFromRecord(rawInformation, 'name') ||
    getStringFromRecord(rawInformation, 'fullName') ||
    intent.idpInformation?.userName ||
    email ||
    'Apple User';
  const [givenName, ...familyNameParts] = fullName
    .replace(/@.*/, '')
    .split(/[.\s_-]+/)
    .filter(Boolean);
  const displayName = titleCase(fullName.replace(/@.*/, '').replace(/[._-]+/g, ' '));

  return {
    givenName: titleCase(givenName || 'Apple'),
    familyName: titleCase(familyNameParts.join(' ') || 'User'),
    displayName: displayName || 'Apple User',
  };
}

function getMutableRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : null;
}

function getNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function removeEmptyStrings<T>(value: T): T {
  if (typeof value === 'string') {
    return value.trim() ? value : undefined as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => removeEmptyStrings(item)).filter((item) => item !== undefined) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => typeof entryValue !== 'string' || entryValue.trim() !== '')
      .map(([key, entryValue]) => [key, removeEmptyStrings(entryValue)])
      .filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

function getStringFromRecord(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];

  return typeof value === 'string' && value.trim() ? value : null;
}

function createAppSession(user: AuthUser, zitadelSessionId: string, zitadelSessionToken: string) {
  const token = nanoid(48);
  const session: AppSession = {
    token,
    user,
    zitadelSessionId,
    zitadelSessionToken,
    createdAt: new Date().toISOString(),
  };

  sessions.set(token, session);

  return {
    sessionToken: token,
    user,
  };
}

async function getZitadelSession(sessionId: string, sessionToken: string) {
  const searchParams = new URLSearchParams({ sessionToken });

  return zitadelJson<ZitadelGetSessionResponse>(
    `/v2/sessions/${encodeURIComponent(sessionId)}?${searchParams.toString()}`
  );
}

async function deleteZitadelSession(sessionId: string, sessionToken: string) {
  await zitadelJson(`/v2/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    body: {
      sessionToken,
    },
  });
}

async function zitadelJson<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  if (!zitadelServiceToken) {
    throw new Error('ZITADEL_SERVICE_TOKEN is not configured.');
  }

  const response = await fetch(`${zitadelApiBase}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${zitadelServiceToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await response.text();
  const data = body ? JSON.parse(body) : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error_description ||
      data?.error ||
      `ZITADEL request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data as T;
}

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'zitadel-custom-auth-bff',
  })
);

app.post('/auth/login', async (c) => {
  const body = await c.req.json<LoginBody>().catch(() => null);
  const loginName = body?.loginName?.trim();
  const password = body?.password;

  if (!loginName || !password) {
    return c.json({ message: 'loginName and password are required.' }, 400);
  }

  try {
    const { user, zitadelSessionId, zitadelSessionToken } = await createZitadelSession(loginName, password);
    return c.json(createAppSession(user, zitadelSessionId, zitadelSessionToken));
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Login failed.',
      },
      401
    );
  }
});

app.post('/auth/idp/start', async (c) => {
  const body = await c.req.json<IdpStartBody>().catch(() => null);
  const provider = body?.provider;
  const redirectUrl = body?.redirectUrl?.trim();

  if (provider !== 'google' && provider !== 'apple') {
    return c.json({ message: 'provider must be google or apple.' }, 400);
  }

  if (!redirectUrl) {
    return c.json({ message: 'redirectUrl is required.' }, 400);
  }

  const idpId = idpIds[provider];

  if (!idpId) {
    return c.json({ message: `${provider} IDP is not configured in the BFF environment.` }, 500);
  }

  try {
    const intent = await zitadelJson<ZitadelCreateIdpIntentResponse>('/v2/idp_intents', {
      method: 'POST',
      body: {
        idpId,
        urls: {
          successUrl: redirectUrl,
          failureUrl: redirectUrl,
        },
      },
    });

    return c.json({ authUrl: intent.authUrl });
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not start social login.',
      },
      500
    );
  }
});

app.post('/auth/idp/complete', async (c) => {
  const body = await c.req.json<IdpCompleteBody>().catch(() => null);
  const idpIntentId = body?.idpIntentId?.trim();
  const idpIntentToken = body?.idpIntentToken?.trim();
  const userId = body?.userId?.trim();

  if (!idpIntentId || !idpIntentToken) {
    return c.json({ message: 'idpIntentId and idpIntentToken are required.' }, 400);
  }

  try {
    const { user, zitadelSessionId, zitadelSessionToken } = await createZitadelSessionFromIdpIntent(
      idpIntentId,
      idpIntentToken,
      userId
    );

    return c.json(createAppSession(user, zitadelSessionId, zitadelSessionToken));
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not complete social login.',
      },
      401
    );
  }
});

app.get('/auth/me', (c) => {
  const session = getSession(c.req.header('Authorization'));

  if (!session) {
    return c.json({ message: 'Unauthorized.' }, 401);
  }

  return c.json({ user: session.user });
});

app.post('/auth/logout', (c) => {
  const token = getBearerToken(c.req.header('Authorization'));

  if (token) {
    const session = sessions.get(token);
    sessions.delete(token);

    if (session) {
      deleteZitadelSession(session.zitadelSessionId, session.zitadelSessionToken).catch((error) => {
        console.warn(error instanceof Error ? error.message : 'Could not terminate ZITADEL session.');
      });
    }
  }

  return c.json({ ok: true });
});

serve(
  {
    fetch: app.fetch,
    hostname: host,
    port,
  },
  (info) => {
    console.log(`BFF listening on http://${info.address}:${info.port}`);
  }
);
