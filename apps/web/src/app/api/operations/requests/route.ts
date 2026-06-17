import { NextResponse } from "next/server";

import { CreateOperationRequestSchema } from "@/lib/admin/schemas";
import { createContentSlug } from "@/lib/admin/slug";
import {
  createOperationRequest,
  listOperationRequests,
} from "@/lib/cms/repositories/operation-requests";

export async function GET() {
  try {
    const pages = await listOperationRequests();

    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not load operation requests.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const payload =
    body && typeof body === "object"
      ? {
          ...body,
          slug:
            "slug" in body && typeof body.slug === "string"
              ? createContentSlug(body.slug)
              : undefined,
        }
      : body;
  const parsed = CreateOperationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] ? String(issue.path[0]) : undefined;

    return NextResponse.json(
      {
        message: issue?.message ?? "Please complete the content request fields.",
        field,
      },
      { status: 400 },
    );
  }

  try {
    const page = await createOperationRequest(parsed.data);

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not create the operation request.",
      },
      { status: 500 },
    );
  }
}
