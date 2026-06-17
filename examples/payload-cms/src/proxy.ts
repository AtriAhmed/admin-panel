import { NextResponse, type NextRequest } from "next/server";

const PAYLOAD_CMS_HOME = "/cms/collections/testimonials";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  url.pathname = PAYLOAD_CMS_HOME;
  url.search = "";

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/cms", "/cms/"],
};

