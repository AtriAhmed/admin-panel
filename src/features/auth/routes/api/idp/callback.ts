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

type Provider = "google" | "apple";

type CallbackParams = {
  error?: string;
  idpIntentId?: string;
  idpIntentToken?: string;
  provider?: Provider;
};

function parseCallbackParams(url: URL): CallbackParams {
  const params = new URLSearchParams(url.search);

  if (url.hash) {
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash.startsWith("?") ? hash.slice(1) : hash);

    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  const provider = params.get("provider");

  return {
    error:
      getFirstParam(params, ["error_description", "errorDescription", "error"]) ??
      getFirstParam(params, ["message"]) ??
      undefined,
    idpIntentId:
      getFirstParam(params, [
        "idpIntentId",
        "idp_intent_id",
        "idpIntentID",
        "intentId",
        "intent_id",
        "id",
      ]) ?? undefined,
    idpIntentToken:
      getFirstParam(params, [
        "idpIntentToken",
        "idp_intent_token",
        "idpToken",
        "idp_token",
        "token",
      ]) ?? undefined,
    provider: provider === "google" || provider === "apple" ? provider : undefined,
  };
}

function getFirstParam(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);

    if (value) {
      return value;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callback = parseCallbackParams(url);
  const loginUrl = new URL("/login", url);

  if (callback.error) {
    loginUrl.searchParams.set("error", callback.error);
    return NextResponse.redirect(loginUrl);
  }

  if (!callback.idpIntentId || !callback.idpIntentToken) {
    loginUrl.searchParams.set(
      "error",
      "ZITADEL did not return the expected social login callback parameters.",
    );
    return NextResponse.redirect(loginUrl);
  }

  try {
    const data = await bffFetch("/auth/idp/complete", {
      method: "POST",
      body: JSON.stringify({
        idpIntentId: callback.idpIntentId,
        idpIntentToken: callback.idpIntentToken,
        provider: callback.provider,
      }),
    }).then((response) => parseBffJsonResponse<LoginResponse>(response));

    if (!isAdminAllowed(data.user)) {
      loginUrl.searchParams.set(
        "error",
        "This account is not allowed to access the admin panel.",
      );
      return NextResponse.redirect(loginUrl);
    }

    const cookieStore = await cookies();
    cookieStore.set(adminSessionCookieName, data.sessionToken, getSessionCookieOptions());

    return NextResponse.redirect(new URL("/", url));
  } catch (error) {
    loginUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Could not complete social login.",
    );

    return NextResponse.redirect(loginUrl);
  }
}
