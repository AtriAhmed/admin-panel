import { NextResponse } from "next/server";

import { bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

type PasswordResetConfirmBody = {
  code?: string;
  newPassword?: string;
  resetRequestId?: string;
  userId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PasswordResetConfirmBody | null;

  try {
    await bffFetch("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({
        code: body?.code?.trim(),
        newPassword: body?.newPassword,
        resetRequestId: body?.resetRequestId?.trim(),
        userId: body?.userId?.trim(),
      }),
    }).then((response) => parseBffJsonResponse<{ ok: true }>(response));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not reset the password.",
      },
      { status: 400 },
    );
  }
}
