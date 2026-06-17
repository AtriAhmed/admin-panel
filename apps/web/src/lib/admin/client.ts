import type { ZodType } from "zod";

import {
  CampaignSchema,
  CampaignsSchema,
  type CreateCampaign,
  type UpdateCampaign,
} from "./schemas/campaigns";
import {
  OperationRequestsSchema,
  OperationRequestSchema,
  type CreateOperationRequest,
  type UpdateOperationRequest,
} from "./schemas/operations";
import {
  MockAnalyticsSummarySchema,
  MockCustomersSchema,
  MockOrdersSchema,
  MockOrderSchema,
  MockUserSchema,
  type MockOrderStatus,
} from "./schemas/mock";
import { DeleteRecordResultSchema } from "./schemas/shared";

async function parseAdminResponse<T>(response: Response, schema: ZodType<T>) {
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `Admin request failed with status ${response.status}.`;
    const field =
      data && typeof data === "object" && "field" in data
        ? String((data as { field?: string }).field)
        : undefined;
    const error = new Error(message) as Error & { field?: string };

    if (field) {
      error.field = field;
    }

    throw error;
  }

  return schema.parse(data);
}

async function getJson<T>(path: string, schema: ZodType<T>) {
  return fetch(path, {
    cache: "no-store",
  }).then((response) => parseAdminResponse(response, schema));
}

async function getMock<T>(path: string, schema: ZodType<T>) {
  return getJson(`/api/mock${path}`, schema);
}

export const adminApi = {
  analyticsSummary: () => getMock("/analytics/summary", MockAnalyticsSummarySchema),
  campaigns: () => getJson("/api/campaigns", CampaignsSchema),
  createCampaign: (data: CreateCampaign) =>
    fetch("/api/campaigns", {
      body: JSON.stringify(data),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => parseAdminResponse(response, CampaignSchema)),
  createOperationRequest: (data: CreateOperationRequest) =>
    fetch("/api/operations/requests", {
      body: JSON.stringify(data),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => parseAdminResponse(response, OperationRequestSchema)),
  customers: () => getMock("/customers", MockCustomersSchema),
  currentUser: () => getMock("/users/me", MockUserSchema),
  deleteCampaign: (id: string) =>
    fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
      cache: "no-store",
      method: "DELETE",
    }).then((response) => parseAdminResponse(response, DeleteRecordResultSchema)),
  deleteOperationRequest: (id: string) =>
    fetch(`/api/operations/requests/${encodeURIComponent(id)}`, {
      cache: "no-store",
      method: "DELETE",
    }).then((response) => parseAdminResponse(response, DeleteRecordResultSchema)),
  order: (id: string) => getMock(`/orders/${encodeURIComponent(id)}`, MockOrderSchema),
  orders: () => getMock("/orders", MockOrdersSchema),
  updateCampaign: (id: string, data: UpdateCampaign) =>
    fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
      body: JSON.stringify(data),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }).then((response) => parseAdminResponse(response, CampaignSchema)),
  operationRequests: () =>
    getJson("/api/operations/requests", OperationRequestsSchema),
  updateOperationRequest: (id: string, data: UpdateOperationRequest) =>
    fetch(`/api/operations/requests/${encodeURIComponent(id)}`, {
      body: JSON.stringify(data),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }).then((response) => parseAdminResponse(response, OperationRequestSchema)),
  updateOrderStatus: (id: string, status: MockOrderStatus) =>
    fetch(`/api/mock/orders/${encodeURIComponent(id)}`, {
      body: JSON.stringify({ status }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }).then((response) => parseAdminResponse(response, MockOrderSchema)),
};
