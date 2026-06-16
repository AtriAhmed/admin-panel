import type { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { config } from '../config.js';
import { createAppSession, pendingIdpLinks } from '../state.js';
import { getZitadelSession, zitadelJson } from '../zitadel.js';
import {
  getMutableRecord,
  getNonEmptyString,
  getStringFromRecord,
  removeEmptyStrings,
  titleCase,
} from '../utils/records.js';
import {
  AccountLinkRequiredError,
  type AuthUser,
  type IdpCompleteBody,
  type IdpProvider,
  type IdpStartBody,
  type PendingIdpLink,
  type ZitadelCreateIdpIntentResponse,
  type ZitadelCreateSessionResponse,
  type ZitadelCreateUserResponse,
  type ZitadelRetrieveIdpIntentResponse,
} from '../types.js';

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
    const createUserBody = withFallbackHumanProfile(
      withOrganizationId(removeEmptyStrings(intent.createUser), intent),
      intent
    );
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
  const userName =
    intent.idpInformation?.userName || getIdentityName(intent) || getIdentityEmail(intent) || externalUserId;

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

  if (config.idpIds.google === idpId) {
    return 'google';
  }

  if (config.idpIds.apple === idpId) {
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

  const organizationId = config.zitadelOrganizationId || intent.details?.resourceOwner;

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
  const email = getIdentityEmail(intent);
  const fullName = getIdentityName(intent) || intent.idpInformation?.userName || email || 'Apple User';
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

export function registerSocialRoutes(app: Hono) {
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

    const idpId = config.idpIds[provider];

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
}
