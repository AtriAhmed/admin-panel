"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mockApi } from "@/lib/mock/client";
import { mockQueryKeys } from "@/lib/mock/query-keys";

import { MockLabLayout } from "../mock-lab-layout";
import { MockOrderList, MockPanel, OperationsEmptyState } from "../mock-lab-shared";
import { useMockLabStore } from "../mock-lab-store";

export default function TanStackLabRoute() {
  const queryClient = useQueryClient();
  const selectedOrderId = useMockLabStore((state) => state.selectedOrderId);
  const setSelectedOrderId = useMockLabStore((state) => state.setSelectedOrderId);

  const orders = useQuery({
    queryFn: mockApi.orders,
    queryKey: mockQueryKeys.orders,
  });

  const selectedOrder = useQuery({
    enabled: Boolean(selectedOrderId),
    queryFn: () => mockApi.order(selectedOrderId),
    queryKey: mockQueryKeys.order(selectedOrderId),
  });

  const markPaid = useMutation({
    mutationFn: () => mockApi.updateOrderStatus(selectedOrderId, "Paid"),
    onSuccess: (order) => {
      queryClient.setQueryData(mockQueryKeys.order(order.id), order);
      queryClient.invalidateQueries({ queryKey: mockQueryKeys.orders });
    },
  });

  return (
    <MockLabLayout>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <MockPanel eyebrow="Fulfillment" title="Order Queue">
          {orders.error ? (
            <OperationsEmptyState message={orders.error.message} />
          ) : orders.isLoading ? (
            <OperationsEmptyState message="Loading order queue..." />
          ) : orders.data ? (
            <MockOrderList
              onSelect={setSelectedOrderId}
              orders={orders.data}
              selectedOrderId={selectedOrderId}
            />
          ) : null}
        </MockPanel>
        <MockPanel eyebrow="Action Required" title="Order Review">
          {selectedOrder.error ? (
            <OperationsEmptyState message={selectedOrder.error.message} />
          ) : selectedOrder.isLoading ? (
            <OperationsEmptyState message="Loading selected order..." />
          ) : selectedOrder.data ? (
            <div className="flex flex-col gap-4 text-sm">
              <dl className="grid gap-2">
                <div>
                  <dt className="text-muted">Order</dt>
                  <dd className="font-semibold">{selectedOrder.data.orderId}</dd>
                </div>
                <div>
                  <dt className="text-muted">Customer</dt>
                  <dd className="font-semibold">{selectedOrder.data.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Status</dt>
                  <dd className="font-semibold">{selectedOrder.data.status}</dd>
                </div>
              </dl>
              <button
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={markPaid.isPending}
                onClick={() => markPaid.mutate()}
                type="button"
              >
                {markPaid.isPending ? "Saving..." : "Approve payment"}
              </button>
              {markPaid.error ? (
                <p className="text-danger">{markPaid.error.message}</p>
              ) : null}
            </div>
          ) : null}
        </MockPanel>
      </div>
    </MockLabLayout>
  );
}
