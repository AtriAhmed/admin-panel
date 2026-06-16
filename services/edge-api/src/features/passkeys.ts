import type { Context, Hono } from 'hono';
import { nanoid } from 'nanoid';
import { config } from '../config.js';
import { createAppSession, getSession, pendingPasskeyLogins } from '../state.js';
import { deleteZitadelSession, getZitadelSession, zitadelJson } from '../zitadel.js';
import { isRecord } from '../utils/records.js';
import type {
  AuthUser,
  PasskeyLoginStartBody,
  PasskeyLoginVerifyBody,
  PasskeyRemoveBody,
  PasskeyRegisterStartBody,
  PasskeyRegisterVerifyBody,
  ZitadelRegisterPasskeyResponse,
  ZitadelSessionWebAuthNChallengeResponse,
  ZitadelUpdateSessionResponse,
} from '../types.js';

async function startZitadelPasskeyRegistration(
  userId: string,
  authenticator: PasskeyRegisterStartBody['authenticator'] = 'platform',
  requestedDomain?: string
) {
  const domain = resolvePasskeyDomain(requestedDomain);

  const registration = await zitadelJson<ZitadelRegisterPasskeyResponse>(
    `/v2/users/${encodeURIComponent(userId)}/passkeys`,
    {
      method: 'POST',
      body: {
        authenticator: toZitadelPasskeyAuthenticator(authenticator),
        domain,
      },
    }
  );

  logWebAuthnOptions('passkey register', registration.publicKeyCredentialCreationOptions);

  return registration;
}

function logWebAuthnOptions(label: string, options: unknown) {
  if (!isRecord(options)) {
    console.log(`[${label}] ZITADEL returned no readable WebAuthn options.`);
    return;
  }

  const publicKey = isRecord(options.publicKey) ? options.publicKey : options;
  const rp = isRecord(publicKey.rp) ? publicKey.rp : null;
  const allowCredentials = Array.isArray(publicKey.allowCredentials) ? publicKey.allowCredentials : [];
  const excludeCredentials = Array.isArray(publicKey.excludeCredentials) ? publicKey.excludeCredentials : [];

  console.log(`[${label}]`, {
    rpId: publicKey.rpId ?? rp?.id ?? null,
    rpName: rp?.name ?? null,
    userVerification: publicKey.userVerification ?? null,
    allowCredentials: allowCredentials.length,
    excludeCredentials: excludeCredentials.length,
    timeout: publicKey.timeout ?? null,
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

async function removeZitadelPasskey(userId: string, passkeyId: string) {
  await zitadelJson(`/v2/users/${encodeURIComponent(userId)}/passkeys/${encodeURIComponent(passkeyId)}`, {
    method: 'DELETE',
  });
}

async function startZitadelPasskeyLogin(loginName: string, requestedDomain?: string) {
  const domain = resolvePasskeyDomain(requestedDomain);

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
          domain,
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

  logWebAuthnOptions('passkey login', publicKeyCredentialRequestOptions);

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

function resolvePasskeyDomain(requestedDomain?: string) {
  const normalizedRequestedDomain = requestedDomain?.trim().toLowerCase();
  const defaultDomain = config.passkeyDomain?.trim().toLowerCase();
  const allowedDomains = new Set(config.passkeyAllowedDomains.map((domain) => domain.trim().toLowerCase()));

  if (!defaultDomain && !allowedDomains.size) {
    throw new Error('ZITADEL_PASSKEY_DOMAIN is not configured.');
  }

  if (!normalizedRequestedDomain) {
    const fallbackDomain = defaultDomain || [...allowedDomains][0];

    if (!fallbackDomain) {
      throw new Error('ZITADEL_PASSKEY_DOMAIN is not configured.');
    }

    return fallbackDomain;
  }

  if (!allowedDomains.has(normalizedRequestedDomain)) {
    throw new Error(`Passkey domain ${normalizedRequestedDomain} is not allowed.`);
  }

  return normalizedRequestedDomain;
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

export function registerPasskeyRoutes(app: Hono) {
  app.post('/auth/passkeys/register/start', async (c) => {
    const session = getSession(c.req.header('Authorization'));

    if (!session) {
      return c.json({ message: 'Unauthorized.' }, 401);
    }

    const body = await c.req.json<PasskeyRegisterStartBody>().catch(() => null);

    try {
      const registration = await startZitadelPasskeyRegistration(session.user.id, body?.authenticator, body?.domain);

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

  const removePasskey = async (c: Context) => {
    const session = getSession(c.req.header('Authorization'));

    if (!session) {
      return c.json({ message: 'Unauthorized.' }, 401);
    }

    const body = await c.req.json<PasskeyRemoveBody>().catch(() => null);
    const passkeyId = body?.passkeyId?.trim();

    if (!passkeyId) {
      return c.json({ message: 'passkeyId is required.' }, 400);
    }

    try {
      await removeZitadelPasskey(session.user.id, passkeyId);
      return c.json({ ok: true });
    } catch (error) {
      return c.json(
        {
          message: error instanceof Error ? error.message : 'Could not remove passkey.',
        },
        400
      );
    }
  };

  app.post('/auth/passkeys/remove', removePasskey);
  app.delete('/auth/passkeys', removePasskey);

  app.post('/auth/passkeys/login/start', async (c) => {
    const body = await c.req.json<PasskeyLoginStartBody>().catch(() => null);
    const loginName = body?.loginName?.trim();

    if (!loginName) {
      return c.json({ message: 'Email or username is required for passkey login.' }, 400);
    }

    try {
      const challenge = await startZitadelPasskeyLogin(loginName, body?.domain);
      return c.json(challenge);
    } catch (error) {
      console.warn('[passkey login start failed]', {
        loginName,
        message: error instanceof Error ? error.message : error,
      });

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
}
