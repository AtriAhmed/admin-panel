import { randomUUID } from "node:crypto";

import { adminDb } from "@/lib/admin/db/client";
import type {
  CampaignRecord,
  CreateCampaignRecord,
  UpdateCampaignRecord,
} from "@/lib/admin/repositories/types";
import { seedCampaigns } from "@/lib/admin/seed/campaigns";

type CampaignRow = {
  budget: number;
  channel: CampaignRecord["channel"];
  id: string;
  launch_date: string;
  name: string;
  owner: string;
  status: CampaignRecord["status"];
  summary: string;
  updated_at: string;
};

async function ensureSchema() {
  await adminDb.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      budget REAL NOT NULL,
      channel TEXT NOT NULL CHECK (channel IN ('email', 'paid-search', 'social', 'retail-media')),
      launch_date TEXT NOT NULL,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('planned', 'live', 'paused')),
      summary TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

async function ensureSeeded() {
  await ensureSchema();

  const existing = await adminDb.execute("SELECT COUNT(*) AS count FROM campaigns");
  const count = Number(existing.rows[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  for (const campaign of seedCampaigns) {
    const now = new Date().toISOString();

    await adminDb.execute({
      args: [
        randomUUID(),
        campaign.budget,
        campaign.channel,
        campaign.launchDate,
        campaign.name,
        campaign.owner,
        campaign.status,
        campaign.summary,
        now,
      ],
      sql: `
        INSERT INTO campaigns
          (id, budget, channel, launch_date, name, owner, status, summary, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    });
  }
}

export async function listCampaigns(): Promise<CampaignRecord[]> {
  await ensureSeeded();

  const result = await adminDb.execute(`
    SELECT id, budget, channel, launch_date, name, owner, status, summary, updated_at
    FROM campaigns
    ORDER BY launch_date ASC
    LIMIT 20
  `);

  return result.rows.map(normalizeCampaign);
}

export async function createCampaign(
  data: CreateCampaignRecord,
): Promise<CampaignRecord> {
  await ensureSeeded();

  const id = randomUUID();
  const updatedAt = new Date().toISOString();

  await adminDb.execute({
    args: [
      id,
      data.budget,
      data.channel,
      data.launchDate,
      data.name,
      data.owner,
      "planned",
      data.summary,
      updatedAt,
    ],
    sql: `
      INSERT INTO campaigns
        (id, budget, channel, launch_date, name, owner, status, summary, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  });

  return {
    ...data,
    id,
    status: "planned",
    updatedAt,
  };
}

export async function updateCampaign(
  id: string,
  data: UpdateCampaignRecord,
): Promise<CampaignRecord> {
  await ensureSeeded();

  const updatedAt = new Date().toISOString();
  const result = await adminDb.execute({
    args: [
      data.budget,
      data.channel,
      data.launchDate,
      data.name,
      data.owner,
      data.status,
      data.summary,
      updatedAt,
      id,
    ],
    sql: `
      UPDATE campaigns
      SET budget = ?, channel = ?, launch_date = ?, name = ?, owner = ?, status = ?, summary = ?, updated_at = ?
      WHERE id = ?
      RETURNING id, budget, channel, launch_date, name, owner, status, summary, updated_at
    `,
  });

  if (!result.rows[0]) {
    throw new Error("Campaign not found.");
  }

  return normalizeCampaign(result.rows[0]);
}

export async function deleteCampaign(id: string): Promise<{ id: string }> {
  await ensureSeeded();

  const result = await adminDb.execute({
    args: [id],
    sql: "DELETE FROM campaigns WHERE id = ?",
  });

  if (result.rowsAffected === 0) {
    throw new Error("Campaign not found.");
  }

  return { id };
}

function normalizeCampaign(row: unknown): CampaignRecord {
  const campaign = row as CampaignRow;

  return {
    budget: Number(campaign.budget),
    channel: campaign.channel,
    id: campaign.id,
    launchDate: campaign.launch_date,
    name: campaign.name,
    owner: campaign.owner,
    status: campaign.status,
    summary: campaign.summary,
    updatedAt: campaign.updated_at,
  };
}

