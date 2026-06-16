"use client";

import useSWR from "swr";

import { mockApi } from "@/lib/mock/client";

import { MockLabLayout } from "../mock-lab-layout";
import { MockOrderList, MockPanel, OperationsEmptyState } from "../mock-lab-shared";

export default function SwrLabRoute() {
  const orders = useSWR("mock/orders", mockApi.orders);
  const analytics = useSWR("mock/analytics-summary", mockApi.analyticsSummary);

  return (
    <MockLabLayout>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <MockPanel eyebrow="Performance" title="Sales Pulse">
          {analytics.error ? (
            <OperationsEmptyState message={analytics.error.message} />
          ) : analytics.isLoading ? (
            <OperationsEmptyState message="Loading performance data..." />
          ) : analytics.data ? (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted">Revenue</dt>
                <dd className="text-xl font-semibold">
                  {new Intl.NumberFormat("en-US", {
                    currency: "USD",
                    style: "currency",
                  }).format(analytics.data.revenue)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Orders</dt>
                <dd className="text-xl font-semibold tabular-nums">{analytics.data.orders}</dd>
              </div>
              <div>
                <dt className="text-muted">Conversion</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {analytics.data.conversionRate}%
                </dd>
              </div>
            </dl>
          ) : null}
        </MockPanel>
        <MockPanel eyebrow="Operations" title="Order Flow">
          {orders.error ? (
            <OperationsEmptyState message={orders.error.message} />
          ) : orders.isLoading ? (
            <OperationsEmptyState message="Loading orders..." />
          ) : orders.data ? (
            <MockOrderList orders={orders.data} />
          ) : null}
        </MockPanel>
      </div>
    </MockLabLayout>
  );
}
