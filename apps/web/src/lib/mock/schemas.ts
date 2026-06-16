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

export const MockCmsPageSchema = z.object({
  id: z.string(),
  owner: z.string(),
  slug: z.string(),
  summary: z.string(),
  title: z.string(),
  status: z.enum(["draft", "published"]),
  updatedAt: z.string(),
});

export const MockCmsPagesSchema = z.array(MockCmsPageSchema);

export const CreateCmsPageSchema = z.object({
  owner: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(8),
  title: z.string().trim().min(2),
});

export type MockAnalyticsSummary = z.infer<typeof MockAnalyticsSummarySchema>;
export type MockCmsPage = z.infer<typeof MockCmsPageSchema>;
export type CreateCmsPage = z.infer<typeof CreateCmsPageSchema>;
export type MockCustomer = z.infer<typeof MockCustomerSchema>;
export type MockOrder = z.infer<typeof MockOrderSchema>;
export type MockOrderStatus = z.infer<typeof MockOrderStatusSchema>;
export type MockUser = z.infer<typeof MockUserSchema>;
