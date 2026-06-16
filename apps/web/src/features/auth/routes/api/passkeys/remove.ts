import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminSessionCookieName, bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

type RemovePasskeyBody = {
  passkeyId?: string;
};

async function removePasskey(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RemovePasskeyBody | null;
  const passkeyId = body?.passkeyId?.trim();

  if (!passkeyId) {
    return NextResponse.json({ message: "passkeyId is required." }, { status: 400 });
  }

  try {
    await bffFetch("/auth/passkeys/remove", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ passkeyId }),
    }).then((response) => parseBffJsonResponse<{ ok: true }>(response));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Could not remove passkey.",
      },
      { status: 400 },
    );
  }
}

export const DELETE = removePasskey;
export const POST = removePasskey;
