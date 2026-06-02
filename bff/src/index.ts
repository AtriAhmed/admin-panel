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

type PasswordResetRequestBody = {
  loginName?: string;
  redirectUrl?: string;
};

type PasswordResetConfirmBody = {
  resetRequestId?: string;
  userId?: string;
  code?: string;
  newPassword?: string;
};

type PasskeyRegisterStartBody = {
  authenticator?: 'platform' | 'crossPlatform' | 'unspecified';
};

type PasskeyRegisterVerifyBody = {
  passkeyId?: string;
  publicKeyCredential?: Record<string, unknown>;
  passkeyName?: string;
};

type PasskeyLoginStartBody = {
  loginName?: string;
};

type PasskeyLoginVerifyBody = {
  passkeyLoginToken?: string;
  publicKeyCredential?: Record<string, unknown>;
};

type IdpProvider = 'google' | 'apple';

type IdpStartBody = {
  provider?: IdpProvider;
  redirectUrl?: string;
};

type IdpCompleteBody = {
  idpIntentId?: string;
  idpIntentToken?: string;
  provider?: IdpProvider;
  pendingLinkToken?: string;
  linkPending?: boolean;
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

type ZitadelPasswordResetResponse = {
  verificationCode?: string;
};

type ZitadelRegisterPasskeyResponse = {
  passkeyId: string;
  publicKeyCredentialCreationOptions: Record<string, unknown>;
};

type ZitadelSessionWebAuthNChallengeResponse = ZitadelCreateSessionResponse & {
  challenges?: {
    webAuthN?: {
      publicKeyCredentialRequestOptions?: Record<string, unknown>;
    };
  };
};

type PendingIdpLink = {
  idpLink: {
    idpId: string;
    userId: string;
    userName: string;
  };
  email: string | null;
  attemptedProvider: IdpProvider | null;
  requiredProvider: IdpProvider;
  createdAt: number;
};

type PendingPasskeyLogin = {
  zitadelSessionId: string;
  zitadelSessionToken: string;
  createdAt: number;
};

class AccountLinkRequiredError extends Error {
  code = 'ACCOUNT_LINK_REQUIRED' as const;

  constructor(
    message: string,
    readonly pendingLinkToken: string,
    readonly attemptedProvider: IdpProvider | null,
    readonly requiredProvider: IdpProvider,
    readonly email: string | null
  ) {
    super(message);
  }
}

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
const passkeyDomain = process.env.ZITADEL_PASSKEY_DOMAIN || process.env.PASSKEY_DOMAIN;
const idpIds: Partial<Record<IdpProvider, string | undefined>> = {
  google: process.env.ZITADEL_GOOGLE_IDP_ID,
  apple: process.env.ZITADEL_APPLE_IDP_ID,
};

const sessions = new Map<string, AppSession>();
const passwordResetRequests = new Map<string, { userId: string; createdAt: number }>();
const pendingIdpLinks = new Map<string, PendingIdpLink>();
const pendingPasskeyLogins = new Map<string, PendingPasskeyLogin>();

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

async function resolveUserIdByLoginName(loginName: string) {
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

  try {
    const sessionState = await getZitadelSession(createdSession.sessionId, createdSession.sessionToken);
    const userId = sessionState.session.factors?.user?.id;

    if (!userId) {
      throw new Error('ZITADEL did not resolve a user for that login name.');
    }

    return userId;
  } finally {
    deleteZitadelSession(createdSession.sessionId, createdSession.sessionToken).catch(() => undefined);
  }
}

async function requestZitadelPasswordReset(loginName: string, redirectUrl: string) {
  const userId = await resolveUserIdByLoginName(loginName);
  const separator = redirectUrl.includes('?') ? '&' : '?';

  await zitadelJson<ZitadelPasswordResetResponse>(`/v2/users/${encodeURIComponent(userId)}/password_reset`, {
    method: 'POST',
    body: {
      sendLink: {
        notificationType: 'NOTIFICATION_TYPE_Email',
        urlTemplate: `${redirectUrl}${separator}userID={{.UserID}}&code={{.Code}}&orgID={{.OrgID}}`,
      },
    },
  });

  const resetRequestId = nanoid(32);
  passwordResetRequests.set(resetRequestId, {
    userId,
    createdAt: Date.now(),
  });

  return resetRequestId;
}

async function confirmZitadelPasswordReset(userId: string, code: string, newPassword: string) {
  await zitadelJson(`/v2/users/${encodeURIComponent(userId)}/password`, {
    method: 'POST',
    body: {
      newPassword: {
        password: newPassword,
        changeRequired: false,
      },
      verificationCode: code,
    },
  });
}

function getPasswordResetUserId(resetRequestId: string | undefined) {
  if (!resetRequestId) {
    return null;
  }

  const request = passwordResetRequests.get(resetRequestId);

  if (!request) {
    return null;
  }

  const maxAgeMs = 15 * 60 * 1000;

  if (Date.now() - request.createdAt > maxAgeMs) {
    passwordResetRequests.delete(resetRequestId);
    return null;
  }

  return request.userId;
}

async function startZitadelPasskeyRegistration(
  userId: string,
  authenticator: PasskeyRegisterStartBody['authenticator'] = 'platform'
) {
  assertPasskeyDomain();

  return zitadelJson<ZitadelRegisterPasskeyResponse>(`/v2/users/${encodeURIComponent(userId)}/passkeys`, {
    method: 'POST',
    body: {
      authenticator: toZitadelPasskeyAuthenticator(authenticator),
      domain: passkeyDomain,
    },
  });
}

async function verifyZitadelPasskeyRegistration(
  userId: string,
  passkeyId: string,
  publicKeyCredential: Record<string, unknown>,
  passkeyName: string
) {
  await zitadelJson(`/v2/users/${encodeURIComponent(userId)}/passkeys/${encodeURIComponent(passkeyId)}`, {
    method: 'POST',
    body: {
      publicKeyCredential,
      passkeyName,
    },
  });
}

async function startZitadelPasskeyLogin(loginName: string) {
  assertPasskeyDomain();

  const createdSession = await zitadelJson<ZitadelSessionWebAuthNChallengeResponse>('/v2/sessions', {
    method: 'POST',
    body: {
      checks: {
        user: {
          loginName,
        },
      },
      challenges: {
        webAuthN: {
          domain: passkeyDomain,
          userVerificationRequirement: 'USER_VERIFICATION_REQUIREMENT_REQUIRED',
        },
      },
    },
  });

  const publicKeyCredentialRequestOptions =
    createdSession.challenges?.webAuthN?.publicKeyCredentialRequestOptions;

  if (!publicKeyCredentialRequestOptions) {
    throw new Error('ZITADEL did not return a passkey challenge for this user.');
  }

  const passkeyLoginToken = nanoid(40);
  pendingPasskeyLogins.set(passkeyLoginToken, {
    zitadelSessionId: createdSession.sessionId,
    zitadelSessionToken: createdSession.sessionToken,
    createdAt: Date.now(),
  });

  return {
    passkeyLoginToken,
    publicKeyCredentialRequestOptions,
  };
}

async function verifyZitadelPasskeyLogin(passkeyLoginToken: string, publicKeyCredential: Record<string, unknown>) {
  const pendingLogin = getPendingPasskeyLogin(passkeyLoginToken);

  if (!pendingLogin) {
    throw new Error('The passkey login request expired. Try signing in again.');
  }

  const updatedSession = await zitadelJson<ZitadelUpdateSessionResponse>(
    `/v2/sessions/${encodeURIComponent(pendingLogin.zitadelSessionId)}`,
    {
      method: 'PATCH',
      body: {
        checks: {
          webAuthN: {
            credentialAssertionData: publicKeyCredential,
          },
        },
      },
    }
  );

  const sessionState = await getZitadelSession(pendingLogin.zitadelSessionId, updatedSession.sessionToken);
  const user = sessionState.session.factors?.user;

  if (!user?.id || !user.loginName) {
    throw new Error('ZITADEL did not return a verified passkey session.');
  }

  pendingPasskeyLogins.delete(passkeyLoginToken);

  return {
    zitadelSessionId: pendingLogin.zitadelSessionId,
    zitadelSessionToken: updatedSession.sessionToken,
    user: {
      id: user.id,
      loginName: user.loginName,
      email: user.loginName.includes('@') ? user.loginName : null,
      displayName: user.displayName ?? user.loginName,
    } satisfies AuthUser,
  };
}

function getPendingPasskeyLogin(passkeyLoginToken: string) {
  const pendingLogin = pendingPasskeyLogins.get(passkeyLoginToken);

  if (!pendingLogin) {
    return null;
  }

  const maxAgeMs = 5 * 60 * 1000;

  if (Date.now() - pendingLogin.createdAt > maxAgeMs) {
    pendingPasskeyLogins.delete(passkeyLoginToken);
    deleteZitadelSession(pendingLogin.zitadelSessionId, pendingLogin.zitadelSessionToken).catch(() => undefined);
    return null;
  }

  return pendingLogin;
}

function assertPasskeyDomain() {
  if (!passkeyDomain) {
    throw new Error('ZITADEL_PASSKEY_DOMAIN is not configured.');
  }
}

function toZitadelPasskeyAuthenticator(authenticator: PasskeyRegisterStartBody['authenticator']) {
  if (authenticator === 'crossPlatform') {
    return 'PASSKEY_AUTHENTICATOR_CROSS_PLATFORM';
  }

  if (authenticator === 'unspecified') {
    return 'PASSKEY_AUTHENTICATOR_UNSPECIFIED';
  }

  return 'PASSKEY_AUTHENTICATOR_PLATFORM';
}

async function createZitadelSessionFromIdpIntent(
  idpIntentId: string,
  idpIntentToken: string,
  options: {
    provider?: IdpProvider;
    pendingLinkToken?: string;
    linkPending?: boolean;
  } = {}
) {
  const intent = await zitadelJson<ZitadelRetrieveIdpIntentResponse>(
    `/v2/idp_intents/${encodeURIComponent(idpIntentId)}`,
    {
      method: 'POST',
      body: {
        idpIntentToken,
      },
    }
  );
  const resolvedUserId = intent.userId || (await createUserFromIdpIntent(intent, options.provider));

  if (!resolvedUserId) {
    throw new Error(
      'This social login is not linked to a ZITADEL user yet, and ZITADEL did not return a usable user creation payload.'
    );
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
  const email = getIdentityEmail(intent);
  const displayName = getIdentityName(intent) || userName || email || sessionUser?.displayName;
  const user = {
    id: resolvedUserId,
    loginName: sessionUser?.loginName || email || userName || resolvedUserId,
    email: email ?? null,
    displayName: displayName ?? null,
  } satisfies AuthUser;

  if (options.linkPending && options.pendingLinkToken) {
    await linkPendingIdpLogin(resolvedUserId, user, intent, options.pendingLinkToken, options.provider);
  }

  return {
    zitadelSessionId: createdSession.sessionId,
    zitadelSessionToken: createdSession.sessionToken,
    user,
  };
}

async function createUserFromIdpIntent(intent: ZitadelRetrieveIdpIntentResponse, provider?: IdpProvider) {
  if (intent.createUser?.human) {
    const createUserBody = withFallbackHumanProfile(withOrganizationId(removeEmptyStrings(intent.createUser), intent), intent);
    const response = await createZitadelUserOrRequestLink(createUserBody, '/v2/users/new', intent, provider);

    return response.id ?? response.userId ?? null;
  }

  if (intent.addHumanUser) {
    const addHumanUserBody = withFallbackHumanProfile(removeEmptyStrings(intent.addHumanUser), intent);
    const response = await createZitadelUserOrRequestLink(addHumanUserBody, '/v2/users/human', intent, provider);

    return response.userId ?? response.id ?? null;
  }

  return null;
}

async function createZitadelUserOrRequestLink(
  body: unknown,
  path: '/v2/users/new' | '/v2/users/human',
  intent: ZitadelRetrieveIdpIntentResponse,
  provider?: IdpProvider
) {
  try {
    return await zitadelJson<ZitadelCreateUserResponse>(path, {
      method: 'POST',
      body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (/user already exists/i.test(message)) {
      throw createAccountLinkRequiredError(intent, provider);
    }

    throw error;
  }
}

function createAccountLinkRequiredError(intent: ZitadelRetrieveIdpIntentResponse, provider?: IdpProvider) {
  const idpLink = getIdpLinkFromIntent(intent);
  const attemptedProvider = provider ?? getProviderFromIdpId(idpLink?.idpId);
  const requiredProvider = attemptedProvider === 'apple' ? 'google' : 'apple';
  const pendingLinkToken = nanoid(40);
  const email = getIdentityEmail(intent);

  if (!idpLink) {
    return new Error('This email is already linked to another sign-in method. Use the original sign-in method.');
  }

  pendingIdpLinks.set(pendingLinkToken, {
    idpLink,
    email,
    attemptedProvider,
    requiredProvider,
    createdAt: Date.now(),
  });

  return new AccountLinkRequiredError(
    `This email is already linked to ${providerLabel(requiredProvider)}. Sign in with ${providerLabel(requiredProvider)} to continue.`,
    pendingLinkToken,
    attemptedProvider,
    requiredProvider,
    email
  );
}

function getIdpLinkFromIntent(intent: ZitadelRetrieveIdpIntentResponse): PendingIdpLink['idpLink'] | null {
  const idpId = intent.idpInformation?.idpId;
  const rawInformation = intent.idpInformation?.rawInformation;
  const externalUserId =
    intent.idpInformation?.userId ||
    getStringFromRecord(rawInformation, 'sub') ||
    getStringFromRecord(rawInformation, 'id');
  const userName = intent.idpInformation?.userName || getIdentityName(intent) || getIdentityEmail(intent) || externalUserId;

  if (!idpId || !externalUserId || !userName) {
    return null;
  }

  return {
    idpId,
    userId: externalUserId,
    userName,
  };
}

async function linkPendingIdpLogin(
  userId: string,
  user: AuthUser,
  authenticatedIntent: ZitadelRetrieveIdpIntentResponse,
  pendingLinkToken: string,
  provider?: IdpProvider
) {
  const pending = getPendingIdpLink(pendingLinkToken);

  if (!pending) {
    throw new Error('The account link request expired. Try signing in again.');
  }

  const authenticatedProvider = provider ?? getProviderFromIdpId(authenticatedIntent.idpInformation?.idpId);

  if (authenticatedProvider && authenticatedProvider !== pending.requiredProvider) {
    throw new Error(`Use ${providerLabel(pending.requiredProvider)} to link this account.`);
  }

  const authenticatedEmail = user.email || getIdentityEmail(authenticatedIntent) || user.loginName;

  if (pending.email && authenticatedEmail && pending.email.toLowerCase() !== authenticatedEmail.toLowerCase()) {
    throw new Error('The sign-in account does not match the account being linked.');
  }

  await zitadelJson(`/v2/users/${encodeURIComponent(userId)}/links`, {
    method: 'POST',
    body: {
      idpLink: pending.idpLink,
    },
  });
  pendingIdpLinks.delete(pendingLinkToken);
}

function getPendingIdpLink(pendingLinkToken: string) {
  const pending = pendingIdpLinks.get(pendingLinkToken);

  if (!pending) {
    return null;
  }

  const maxAgeMs = 10 * 60 * 1000;

  if (Date.now() - pending.createdAt > maxAgeMs) {
    pendingIdpLinks.delete(pendingLinkToken);
    return null;
  }

  return pending;
}

function getProviderFromIdpId(idpId: string | undefined): IdpProvider | null {
  if (!idpId) {
    return null;
  }

  if (idpIds.google === idpId) {
    return 'google';
  }

  if (idpIds.apple === idpId) {
    return 'apple';
  }

  return null;
}

function providerLabel(provider: IdpProvider) {
  return provider === 'google' ? 'Google' : 'Apple';
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
  const email = getIdentityEmail(intent);
  const fullName =
    getIdentityName(intent) ||
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

function getIdentityEmail(intent: ZitadelRetrieveIdpIntentResponse) {
  return getStringFromRecord(intent.idpInformation?.rawInformation, 'email');
}

function getIdentityName(intent: ZitadelRetrieveIdpIntentResponse) {
  const rawInformation = intent.idpInformation?.rawInformation;

  return (
    getStringFromRecord(rawInformation, 'name') ||
    getStringFromRecord(rawInformation, 'fullName') ||
    getStringFromRecord(rawInformation, 'given_name')
  );
}

function getStringFromRecord(record: Record<string, unknown> | undefined, key: string): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  for (const nestedValue of Object.values(record)) {
    if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
      const nestedMatch: string | null = getStringFromRecord(nestedValue as Record<string, unknown>, key);

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
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

app.post('/auth/password-reset/request', async (c) => {
  const body = await c.req.json<PasswordResetRequestBody>().catch(() => null);
  const loginName = body?.loginName?.trim();
  const redirectUrl = body?.redirectUrl?.trim();

  if (!loginName || !redirectUrl) {
    return c.json({ message: 'loginName and redirectUrl are required.' }, 400);
  }

  try {
    const resetRequestId = await requestZitadelPasswordReset(loginName, redirectUrl);
    return c.json({
      ok: true,
      resetRequestId,
      message: 'If that account exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.warn(error instanceof Error ? error.message : 'Could not request password reset.');
  }

  return c.json({
    ok: true,
    message: 'If that account exists, a password reset link has been sent.',
  });
});

app.post('/auth/password-reset/confirm', async (c) => {
  const body = await c.req.json<PasswordResetConfirmBody>().catch(() => null);
  const resetRequestId = body?.resetRequestId?.trim();
  const userId = body?.userId?.trim() || getPasswordResetUserId(resetRequestId);
  const code = body?.code?.trim();
  const newPassword = body?.newPassword;

  if (!userId || !code || !newPassword) {
    return c.json({ message: 'userId, code, and newPassword are required.' }, 400);
  }

  try {
    await confirmZitadelPasswordReset(userId, code, newPassword);
    if (resetRequestId) {
      passwordResetRequests.delete(resetRequestId);
    }
    return c.json({ ok: true });
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not reset password.',
      },
      400
    );
  }
});

app.post('/auth/passkeys/register/start', async (c) => {
  const session = getSession(c.req.header('Authorization'));

  if (!session) {
    return c.json({ message: 'Unauthorized.' }, 401);
  }

  const body = await c.req.json<PasskeyRegisterStartBody>().catch(() => null);

  try {
    const registration = await startZitadelPasskeyRegistration(session.user.id, body?.authenticator);

    return c.json({
      passkeyId: registration.passkeyId,
      publicKeyCredentialCreationOptions: registration.publicKeyCredentialCreationOptions,
    });
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not start passkey registration.',
      },
      400
    );
  }
});

app.post('/auth/passkeys/register/verify', async (c) => {
  const session = getSession(c.req.header('Authorization'));

  if (!session) {
    return c.json({ message: 'Unauthorized.' }, 401);
  }

  const body = await c.req.json<PasskeyRegisterVerifyBody>().catch(() => null);
  const passkeyId = body?.passkeyId?.trim();
  const publicKeyCredential = body?.publicKeyCredential;
  const passkeyName = body?.passkeyName?.trim() || 'Mobile passkey';

  if (!passkeyId || !publicKeyCredential) {
    return c.json({ message: 'passkeyId and publicKeyCredential are required.' }, 400);
  }

  try {
    await verifyZitadelPasskeyRegistration(session.user.id, passkeyId, publicKeyCredential, passkeyName);
    return c.json({ ok: true });
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not verify passkey registration.',
      },
      400
    );
  }
});

app.post('/auth/passkeys/login/start', async (c) => {
  const body = await c.req.json<PasskeyLoginStartBody>().catch(() => null);
  const loginName = body?.loginName?.trim();

  if (!loginName) {
    return c.json({ message: 'Email or username is required for passkey login.' }, 400);
  }

  try {
    const challenge = await startZitadelPasskeyLogin(loginName);
    return c.json(challenge);
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not start passkey login.',
      },
      400
    );
  }
});

app.post('/auth/passkeys/login/verify', async (c) => {
  const body = await c.req.json<PasskeyLoginVerifyBody>().catch(() => null);
  const passkeyLoginToken = body?.passkeyLoginToken?.trim();
  const publicKeyCredential = body?.publicKeyCredential;

  if (!passkeyLoginToken || !publicKeyCredential) {
    return c.json({ message: 'passkeyLoginToken and publicKeyCredential are required.' }, 400);
  }

  try {
    const { user, zitadelSessionId, zitadelSessionToken } = await verifyZitadelPasskeyLogin(
      passkeyLoginToken,
      publicKeyCredential
    );
    return c.json(createAppSession(user, zitadelSessionId, zitadelSessionToken));
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : 'Could not complete passkey login.',
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
  const provider = body?.provider;
  const pendingLinkToken = body?.pendingLinkToken?.trim();
  const linkPending = body?.linkPending === true;

  if (!idpIntentId || !idpIntentToken) {
    return c.json({ message: 'idpIntentId and idpIntentToken are required.' }, 400);
  }

  try {
    const { user, zitadelSessionId, zitadelSessionToken } = await createZitadelSessionFromIdpIntent(
      idpIntentId,
      idpIntentToken,
      {
        provider,
        pendingLinkToken,
        linkPending,
      }
    );

    return c.json(createAppSession(user, zitadelSessionId, zitadelSessionToken));
  } catch (error) {
    if (error instanceof AccountLinkRequiredError) {
      return c.json(
        {
          code: error.code,
          message: error.message,
          pendingLinkToken: error.pendingLinkToken,
          attemptedProvider: error.attemptedProvider,
          requiredProvider: error.requiredProvider,
          email: error.email,
        },
        409
      );
    }

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
