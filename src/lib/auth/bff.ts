export type AuthUser = {
  id: string;
  loginName: string;
  displayName?: string | null;
  email?: string | null;
};

export type LoginResponse = {
  sessionToken: string;
  user: AuthUser;
};

export const adminSessionCookieName = "admin_bff_session";

const fallbackBffUrl = "http://localhost:8787";

export function getBffBaseUrl() {
  return (
    process.env.ADMIN_AUTH_BFF_URL ??
    process.env.BFF_URL ??
    process.env.NEXT_PUBLIC_BFF_URL ??
    fallbackBffUrl
  ).replace(/\/$/, "");
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function parseBffJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | ({ message?: string; error?: string; error_description?: string } & T)
    | null;

  if (!response.ok) {
    throw new Error(
      data?.message ??
        data?.error_description ??
        data?.error ??
        `Authentication request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

export async function bffFetch(path: string, init?: RequestInit) {
  return fetch(`${getBffBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function isAdminAllowed(user: AuthUser) {
  const allowed = process.env.ADMIN_AUTH_ALLOWED_EMAILS;

  if (!allowed?.trim()) {
    return true;
  }

  const identifiers = new Set(
    [user.email, user.loginName, user.id]
      .filter(Boolean)
      .map((value) => value!.trim().toLowerCase()),
  );

  return allowed
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .some((value) => identifiers.has(value));
}
