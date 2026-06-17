import { z } from "zod";

export const CampaignChannelSchema = z.enum([
  "email",
  "paid-search",
  "social",
  "retail-media",
]);

export const CampaignStatusSchema = z.enum(["planned", "live", "paused"]);

export const CampaignSchema = z.object({
  budget: z.number(),
  channel: CampaignChannelSchema,
  id: z.string(),
  launchDate: z.string(),
  name: z.string(),
  owner: z.string(),
  status: CampaignStatusSchema,
  summary: z.string(),
  updatedAt: z.string(),
});

export const CampaignsSchema = z.array(CampaignSchema);

export const CreateCampaignSchema = z.object({
  budget: z.coerce.number().min(0, {
    message: "Budget must be at least 0.",
  }),
  channel: CampaignChannelSchema,
  launchDate: z.string().min(1, {
    message: "Launch date is required.",
  }),
  name: z.string().trim().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  owner: z.string().trim().min(2, {
    message: "Owner must be at least 2 characters.",
  }),
  summary: z.string().trim().min(8, {
    message: "Summary must be at least 8 characters.",
  }),
});

export const UpdateCampaignSchema = CreateCampaignSchema.extend({
  status: CampaignStatusSchema,
});

export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignChannel = z.infer<typeof CampaignChannelSchema>;
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaign = z.infer<typeof UpdateCampaignSchema>;
