import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  adminSessionCookieName,
  bffFetch,
  getSessionCookieOptions,
  isAdminAllowed,
  parseBffJsonResponse,
  type LoginResponse,
} from "@/lib/auth/bff";

type LoginBody = {
  loginName?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const loginName = body?.loginName?.trim();
  const password = body?.password;

  if (!loginName || !password) {
    return NextResponse.json(
      { message: "Email or username and password are required." },
      { status: 400 },
    );
  }

  try {
    const data = await bffFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ loginName, password }),
    }).then((response) => parseBffJsonResponse<LoginResponse>(response));

    if (!isAdminAllowed(data.user)) {
      return NextResponse.json(
        { message: "This account is not allowed to access the admin panel." },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(adminSessionCookieName, data.sessionToken, getSessionCookieOptions());

    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Could not sign in.",
      },
      { status: 401 },
    );
  }
}
