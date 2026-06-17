import { NextResponse } from "next/server";

import { UpdateOperationRequestSchema } from "@/lib/admin/schemas";
import { createContentSlug } from "@/lib/admin/slug";
import { updateOperationRequest } from "@/lib/cms/repositories/operation-requests";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
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
  const parsed = UpdateOperationRequestSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const fieldPath = issue?.path.length ? issue.path.join(".") : "";

    return NextResponse.json(
      {
        message:
          fieldPath && issue?.message
            ? `${fieldPath}: ${issue.message}`
            : issue?.message ?? "Please complete the content request fields.",
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
