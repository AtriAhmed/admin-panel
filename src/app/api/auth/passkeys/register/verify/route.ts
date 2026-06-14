import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminSessionCookieName, bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

type RegisterVerifyBody = {
  passkeyId?: string;
  passkeyName?: string;
  publicKeyCredential?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RegisterVerifyBody | null;

  try {
    await bffFetch("/auth/passkeys/register/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        passkeyId: body?.passkeyId?.trim(),
        passkeyName: body?.passkeyName?.trim() || "Admin web passkey",
        publicKeyCredential: body?.publicKeyCredential,
      }),
    }).then((response) => parseBffJsonResponse<{ ok: true }>(response));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not verify passkey registration.",
      },
      { status: 400 },
    );
  }
}
