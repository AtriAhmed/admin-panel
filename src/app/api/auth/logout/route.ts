import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminSessionCookieName, bffFetch } from "@/lib/auth/bff";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (token) {
    await bffFetch("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => undefined);
  }

  cookieStore.delete(adminSessionCookieName);

  return NextResponse.json({ ok: true });
}
