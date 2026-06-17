import type { CampaignRecord } from "@/lib/admin/repositories/types";

export const seedCampaigns = [
  {
    budget: 24000,
    channel: "email",
    launchDate: "2026-07-01T09:00:00.000Z",
    name: "Summer retention push",
    owner: "Lifecycle Team",
    status: "planned",
    summary: "Target repeat buyers with seasonal bundles and loyalty credits.",
  },
  {
    budget: 58000,
    channel: "paid-search",
    launchDate: "2026-06-24T09:00:00.000Z",
    name: "High-intent acquisition",
    owner: "Growth Marketing",
    status: "live",
    summary: "Capture category demand from high-intent commercial keywords.",
  },
  {
    budget: 18500,
    channel: "social",
    launchDate: "2026-07-08T09:00:00.000Z",
    name: "Creator launch kit",
    owner: "Brand Team",
    status: "planned",
    summary: "Coordinate creator assets for the new arrival campaign.",
  },
] satisfies Array<Omit<CampaignRecord, "id" | "updatedAt">>;

