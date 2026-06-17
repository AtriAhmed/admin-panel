import { NextResponse } from "next/server";

import { deleteCampaign, updateCampaign } from "@/lib/admin/repositories/campaigns";
import { UpdateCampaignSchema } from "@/lib/admin/schemas/campaigns";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = UpdateCampaignSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] ? String(issue.path[0]) : undefined;

    return NextResponse.json(
      {
        message: issue?.message ?? "Please complete the campaign fields.",
        field,
      },
      { status: 400 },
    );
  }

  try {
    const campaign = await updateCampaign(id, parsed.data);

    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not update campaign.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const result = await deleteCampaign(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not delete campaign.",
      },
      { status: 500 },
    );
  }
}
