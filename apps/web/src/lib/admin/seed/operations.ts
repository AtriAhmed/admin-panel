import type { OperationRequestRecord } from "@/lib/admin/repositories/types";

export const seedOperationRequests = [
  {
    owner: "Content Operations",
    slug: "operations-home",
    status: "published",
    summary: "Daily operating guidance for the commerce support desk.",
    title: "Operations home",
  },
  {
    owner: "Customer Experience",
    slug: "shipping-delay-banner",
    status: "draft",
    summary: "Short alert copy for delayed regional shipments.",
    title: "Shipping delay banner",
  },
  {
    owner: "Policy Team",
    slug: "refund-policy",
    status: "published",
    summary: "Current customer-facing refund policy content.",
    title: "Refund policy",
  },
] satisfies Array<Omit<OperationRequestRecord, "id" | "updatedAt">>;

