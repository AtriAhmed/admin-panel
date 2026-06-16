import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminSessionCookieName, bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    const data = await bffFetch("/auth/passkeys/register/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        authenticator: "platform",
        domain: url.hostname,
      }),
    }).then((response) =>
      parseBffJsonResponse<{
        passkeyId: string;
        publicKeyCredentialCreationOptions: Record<string, unknown>;
      }>(response),
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not start passkey registration.",
      },
      { status: 400 },
    );
  }
}
