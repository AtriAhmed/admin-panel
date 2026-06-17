import { NextResponse } from "next/server";

import { createCampaign, listCampaigns } from "@/lib/admin/repositories/campaigns";
import { CreateCampaignSchema } from "@/lib/admin/schemas/campaigns";

export async function GET() {
  try {
    const campaigns = await listCampaigns();

    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not load campaigns.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = CreateCampaignSchema.safeParse(body);

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
    const campaign = await createCampaign(parsed.data);

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not create campaign.",
      },
      { status: 500 },
    );
  }
}
