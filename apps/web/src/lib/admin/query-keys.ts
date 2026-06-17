export const adminQueryKeys = {
  analyticsSummary: ["mock", "analytics-summary"] as const,
  campaigns: ["payload", "campaigns"] as const,
  operationRequests: ["payload", "operation-requests"] as const,
  customers: ["mock", "customers"] as const,
  currentUser: ["mock", "current-user"] as const,
  order: (id: string) => ["mock", "orders", id] as const,
  orders: ["mock", "orders"] as const,
};
