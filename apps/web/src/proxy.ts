import { NextResponse, type NextRequest } from "next/server";

const PAYLOAD_AUTH_COOKIE = "payload-token";
const PAYLOAD_ADMIN_HOME = "/cms/collections/operation-requests";

function redirectToPayloadLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/cms/login";
  loginUrl.searchParams.set("redirect", PAYLOAD_ADMIN_HOME);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(PAYLOAD_AUTH_COOKIE);

  return response;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/cms") {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(PAYLOAD_AUTH_COOKIE);

  if (!authCookie) {
    return redirectToPayloadLogin(request);
  }

  const accountUrl = request.nextUrl.clone();
  accountUrl.pathname = "/payload-api/users/me";
  accountUrl.search = "";

  try {
    const accountResponse = await fetch(accountUrl, {
      headers: {
        cookie: `${PAYLOAD_AUTH_COOKIE}=${authCookie.value}`,
      },
    });
    const account = (await accountResponse.json()) as { user?: unknown };

    if (account.user) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = PAYLOAD_ADMIN_HOME;
      adminUrl.search = "";

      return NextResponse.redirect(adminUrl);
    }
  } catch {
    return redirectToPayloadLogin(request);
  }

  return redirectToPayloadLogin(request);
}

export const config = {
  matcher: "/cms",
};
