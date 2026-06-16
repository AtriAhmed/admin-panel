import type { ZodType } from "zod";

import {
  MockAnalyticsSummarySchema,
  MockCmsPagesSchema,
  MockCmsPageSchema,
  MockCustomersSchema,
  MockOrdersSchema,
  MockOrderSchema,
  MockUserSchema,
  type CreateCmsPage,
  type MockOrderStatus,
} from "./schemas";

async function parseMockResponse<T>(response: Response, schema: ZodType<T>) {
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `Mock request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return schema.parse(data);
}

async function getJson<T>(path: string, schema: ZodType<T>) {
  return fetch(path, {
    cache: "no-store",
  }).then((response) => parseMockResponse(response, schema));
}

async function getMock<T>(path: string, schema: ZodType<T>) {
  return getJson(`/api/mock${path}`, schema);
}

export const mockApi = {
  analyticsSummary: () => getMock("/analytics/summary", MockAnalyticsSummarySchema),
  createCmsPage: (data: CreateCmsPage) =>
    fetch("/api/cms/pages", {
      body: JSON.stringify(data),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => parseMockResponse(response, MockCmsPageSchema)),
  cmsPages: () => getJson("/api/cms/pages", MockCmsPagesSchema),
  customers: () => getMock("/customers", MockCustomersSchema),
  currentUser: () => getMock("/users/me", MockUserSchema),
  order: (id: string) => getMock(`/orders/${encodeURIComponent(id)}`, MockOrderSchema),
  orders: () => getMock("/orders", MockOrdersSchema),
  updateOrderStatus: (id: string, status: MockOrderStatus) =>
    fetch(`/api/mock/orders/${encodeURIComponent(id)}`, {
      body: JSON.stringify({ status }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }).then((response) => parseMockResponse(response, MockOrderSchema)),
};
