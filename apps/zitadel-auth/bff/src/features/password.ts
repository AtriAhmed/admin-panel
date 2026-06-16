import type { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { createAppSession, passwordResetRequests } from '../state.js';
import { deleteZitadelSession, getZitadelSession, zitadelJson } from '../zitadel.js';
import type {
  AuthUser,
  LoginBody,
  PasswordResetConfirmBody,
  PasswordResetRequestBody,
  ZitadelCreateSessionResponse,
  ZitadelPasswordResetResponse,
  ZitadelUpdateSessionResponse,
} from '../types.js';

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

export function registerPasswordRoutes(app: Hono) {
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
}
