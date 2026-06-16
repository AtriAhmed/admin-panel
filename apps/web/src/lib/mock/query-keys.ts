export const mockQueryKeys = {
  analyticsSummary: ["mock", "analytics-summary"] as const,
  cmsPages: ["payload", "cms-pages"] as const,
  customers: ["mock", "customers"] as const,
  currentUser: ["mock", "current-user"] as const,
  order: (id: string) => ["mock", "orders", id] as const,
  orders: ["mock", "orders"] as const,
};
