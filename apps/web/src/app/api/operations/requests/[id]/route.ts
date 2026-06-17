import { NextResponse } from "next/server";

import { UpdateOperationRequestSchema } from "@/lib/admin/schemas/operations";
import { createContentSlug } from "@/lib/admin/slug";
import {
  deleteOperationRequest,
  updateOperationRequest,
} from "@/lib/admin/repositories/operation-requests";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as unknown;
  const requestBody =
    body && typeof body === "object"
      ? {
          ...body,
          slug:
            "slug" in body && typeof body.slug === "string"
              ? createContentSlug(body.slug)
              : undefined,
      }
      : body;
  const parsed = UpdateOperationRequestSchema.safeParse(requestBody);

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
    const page = await updateOperationRequest(id, parsed.data);

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not update the operation request.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const result = await deleteOperationRequest(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not delete the operation request.",
      },
      { status: 500 },
    );
  }
}
