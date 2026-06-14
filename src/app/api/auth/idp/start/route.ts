import { NextResponse } from "next/server";

import { bffFetch, parseBffJsonResponse } from "@/lib/auth/bff";

type Provider = "google" | "apple";

type IdpStartResponse = {
  authUrl: string;
};

function isProvider(value: string | null): value is Provider {
  return value === "google" || value === "apple";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");

  if (!isProvider(provider)) {
    return NextResponse.redirect(new URL("/login?error=unsupported_provider", url));
  }

  try {
    const callbackUrl = new URL("/api/auth/idp/callback", url.origin);
    callbackUrl.searchParams.set("provider", provider);

    const data = await bffFetch("/auth/idp/start", {
      method: "POST",
      body: JSON.stringify({
        provider,
        redirectUrl: callbackUrl.toString(),
      }),
    }).then((response) => parseBffJsonResponse<IdpStartResponse>(response));

    return NextResponse.redirect(data.authUrl);
  } catch (error) {
    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Could not start social login.",
    );

    return NextResponse.redirect(loginUrl);
  }
}
