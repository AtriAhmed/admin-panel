import { NextResponse } from "next/server";

import { bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

type PasswordResetRequestBody = {
  loginName?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PasswordResetRequestBody | null;
  const loginName = body?.loginName?.trim();

  if (!loginName) {
    return NextResponse.json(
      { message: "Email or username is required." },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const redirectUrl = `${url.origin}/login`;

  try {
    const data = await bffFetch("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ loginName, redirectUrl }),
    }).then((response) =>
      parseBffJsonResponse<{ message?: string; resetRequestId?: string }>(response),
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not request a password reset.",
      },
      { status: 400 },
    );
  }
}
