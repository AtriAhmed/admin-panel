import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const mockApiBaseUrl = (
  process.env.MOCK_API_URL ??
  process.env.NEXT_PUBLIC_MOCK_API_URL ??
  "http://127.0.0.1:4010"
).replace(/\/$/, "");

async function proxyMockRequest(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${mockApiBaseUrl}/${path.join("/")}`);
  targetUrl.search = incomingUrl.search;

  try {
    const response = await fetch(targetUrl, {
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      method: request.method,
    });

    const body = await response.text();

    return new NextResponse(body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Mock API is not reachable. Start it with npm run mock:admin.",
      },
      { status: 502 },
    );
  }
}

export const GET = proxyMockRequest;
export const PATCH = proxyMockRequest;
