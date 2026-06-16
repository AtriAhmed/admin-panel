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

type LoginVerifyBody = {
  passkeyLoginToken?: string;
  publicKeyCredential?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginVerifyBody | null;

  try {
    const data = await bffFetch("/auth/passkeys/login/verify", {
      method: "POST",
      body: JSON.stringify({
        passkeyLoginToken: body?.passkeyLoginToken?.trim(),
        publicKeyCredential: body?.publicKeyCredential,
      }),
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
        message:
          error instanceof Error ? error.message : "Could not complete passkey sign-in.",
      },
      { status: 401 },
    );
  }
}
