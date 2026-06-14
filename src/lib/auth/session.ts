import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  adminSessionCookieName,
  bffFetch,
  isAdminAllowed,
  parseBffJsonResponse,
  type AuthUser,
} from "./bff";

type MeResponse = {
  user: AuthUser;
};

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const data = await bffFetch("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => parseBffJsonResponse<MeResponse>(response));

    if (!isAdminAllowed(data.user)) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return admin;
}
