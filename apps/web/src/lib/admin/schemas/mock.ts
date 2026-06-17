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

export type MockAnalyticsSummary = z.infer<typeof MockAnalyticsSummarySchema>;
export type MockCustomer = z.infer<typeof MockCustomerSchema>;
export type MockOrder = z.infer<typeof MockOrderSchema>;
export type MockOrderStatus = z.infer<typeof MockOrderStatusSchema>;
export type MockUser = z.infer<typeof MockUserSchema>;
