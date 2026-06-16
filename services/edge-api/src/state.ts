import { nanoid } from 'nanoid';
import type { AppSession, AuthUser, PendingIdpLink, PendingPasskeyLogin } from './types.js';

export const sessions = new Map<string, AppSession>();
export const passwordResetRequests = new Map<string, { userId: string; createdAt: number }>();
export const pendingIdpLinks = new Map<string, PendingIdpLink>();
export const pendingPasskeyLogins = new Map<string, PendingPasskeyLogin>();

export function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
}

export function getSession(authorization: string | undefined): AppSession | null {
  const token = getBearerToken(authorization);

  if (!token) {
    return null;
  }

  return sessions.get(token) ?? null;
}

export function createAppSession(user: AuthUser, zitadelSessionId: string, zitadelSessionToken: string) {
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
