import { NextResponse } from "next/server";

import { bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

type LoginStartBody = {
  loginName?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginStartBody | null;
  const loginName = body?.loginName?.trim();

  if (!loginName) {
    return NextResponse.json(
      { message: "Email or username is required for passkey sign-in." },
      { status: 400 },
    );
  }

  const url = new URL(request.url);

  try {
    const data = await bffFetch("/auth/passkeys/login/start", {
      method: "POST",
      body: JSON.stringify({
        domain: url.hostname,
        loginName,
      }),
    }).then((response) =>
      parseBffJsonResponse<{
        passkeyLoginToken: string;
        publicKeyCredentialRequestOptions: Record<string, unknown>;
      }>(response),
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not start passkey sign-in.",
      },
      { status: 400 },
    );
  }
}
