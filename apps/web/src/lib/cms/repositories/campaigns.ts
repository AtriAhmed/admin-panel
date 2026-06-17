import { getPayloadCms } from "@/lib/cms/payload";
import { seedCampaigns } from "@/lib/cms/seed/campaigns";
import type {
  CampaignBriefRecord,
  CreateCampaignBriefRecord,
  PayloadCampaignBriefDocument,
  UpdateCampaignBriefRecord,
} from "@/lib/cms/types";

const collection = "campaign-briefs";

async function ensureSeeded() {
  const payload = await getPayloadCms();
  const existing = await payload.count({ collection });

  if (existing.totalDocs > 0) {
    return;
  }

  await Promise.all(
    seedCampaigns.map((data) =>
      payload.create({
        collection,
        data,
      }),
    ),
  );
}

export async function listCampaigns(): Promise<CampaignBriefRecord[]> {
  await ensureSeeded();

  const payload = await getPayloadCms();
  const result = await payload.find({
    collection,
    limit: 20,
    sort: "launchDate",
  });

  return result.docs.map(normalizeCampaign);
}

export async function createCampaign(
  data: CreateCampaignBriefRecord,
): Promise<CampaignBriefRecord> {
  await ensureSeeded();

  const payload = await getPayloadCms();
  const campaign = await payload.create({
    collection,
    data: {
      ...data,
      status: "planned",
    },
  });

  return normalizeCampaign(campaign);
}

export async function updateCampaign(
  id: string,
  data: UpdateCampaignBriefRecord,
): Promise<CampaignBriefRecord> {
  await ensureSeeded();

  const payload = await getPayloadCms();
  const campaign = await payload.update({
    collection,
    data,
    id,
  });

  return normalizeCampaign(campaign);
}

export async function deleteCampaign(id: string): Promise<{ id: string }> {
  const payload = await getPayloadCms();

  await payload.delete({
    collection,
    id,
  });

  return { id };
}

function normalizeCampaign(doc: unknown): CampaignBriefRecord {
  const campaign = doc as PayloadCampaignBriefDocument;

  return {
    budget: campaign.budget,
    channel: campaign.channel,
    id: String(campaign.id),
    launchDate: campaign.launchDate,
    name: campaign.name,
    owner: campaign.owner,
    status: campaign.status,
    summary: campaign.summary,
    updatedAt: campaign.updatedAt ?? new Date().toISOString(),
  };
}
