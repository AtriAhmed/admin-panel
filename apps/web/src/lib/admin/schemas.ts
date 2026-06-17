import { z } from "zod";

export const MockUserSchema = z.object({
  id: z.string(),
  loginName: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.string(),
});

export const MockOrderStatusSchema = z.enum(["Paid", "Pending", "Refunded", "Failed"]);

export const MockOrderSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  status: MockOrderStatusSchema,
  total: z.number(),
  currency: z.string(),
  date: z.string(),
});

export const MockOrdersSchema = z.array(MockOrderSchema);

export const MockAnalyticsSummarySchema = z.object({
  revenue: z.number(),
  orders: z.number(),
  conversionRate: z.number(),
  openTickets: z.number(),
  period: z.string(),
});

export const MockCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  segment: z.string(),
  lifetimeValue: z.number(),
});

export const MockCustomersSchema = z.array(MockCustomerSchema);

export const OperationRequestSchema = z.object({
  id: z.string(),
  owner: z.string(),
  slug: z.string(),
  summary: z.string(),
  title: z.string(),
  status: z.enum(["draft", "published"]),
  updatedAt: z.string(),
});

export const OperationRequestsSchema = z.array(OperationRequestSchema);

export const CreateOperationRequestSchema = z.object({
  owner: z.string().trim().min(2, {
    message: "Owner must be at least 2 characters.",
  }),
  slug: z
    .string()
    .trim()
    .min(2, {
      message: "Slug must be at least 2 characters.",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug may only contain lowercase letters, numbers, and hyphens.",
    }),
  summary: z.string().trim().min(8, {
    message: "Summary must be at least 8 characters.",
  }),
  title: z.string().trim().min(2, {
    message: "Title must be at least 2 characters.",
  }),
});

export const UpdateOperationRequestSchema = CreateOperationRequestSchema.extend({
  status: OperationRequestSchema.shape.status,
});

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

export type MockAnalyticsSummary = z.infer<typeof MockAnalyticsSummarySchema>;
export type OperationRequest = z.infer<typeof OperationRequestSchema>;
export type CreateOperationRequest = z.infer<typeof CreateOperationRequestSchema>;
export type UpdateOperationRequest = z.infer<typeof UpdateOperationRequestSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignChannel = z.infer<typeof CampaignChannelSchema>;
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaign = z.infer<typeof UpdateCampaignSchema>;
export type MockCustomer = z.infer<typeof MockCustomerSchema>;
export type MockOrder = z.infer<typeof MockOrderSchema>;
export type MockOrderStatus = z.infer<typeof MockOrderStatusSchema>;
export type MockUser = z.infer<typeof MockUserSchema>;
