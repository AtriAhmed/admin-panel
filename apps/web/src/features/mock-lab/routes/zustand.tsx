"use client";

import { useShallow } from "zustand/shallow";

import { MockLabLayout } from "../mock-lab-layout";
import { MockPanel } from "../mock-lab-shared";
import { useMockLabStore } from "../mock-lab-store";

const orderIds = ["ord_1001", "ord_1002", "ord_1003"];
const statuses = ["All", "Paid", "Pending", "Refunded", "Failed"] as const;

export default function ZustandLabRoute() {
  const { density, selectedOrderId, setDensity, setSelectedOrderId, setStatusFilter, statusFilter } =
    useMockLabStore(
      useShallow((state) => ({
        density: state.density,
        selectedOrderId: state.selectedOrderId,
        setDensity: state.setDensity,
        setSelectedOrderId: state.setSelectedOrderId,
        setStatusFilter: state.setStatusFilter,
        statusFilter: state.statusFilter,
      })),
    );

  return (
    <MockLabLayout>
      <div className="grid gap-4 lg:grid-cols-2">
        <MockPanel eyebrow="Workspace" title="Queue Preferences">
          <div className="flex flex-col gap-4 text-sm">
            <label className="flex flex-col gap-2">
              <span className="font-medium">Focused order</span>
              <select
                className="rounded-md border border-divider bg-content1 px-3 py-2"
                onChange={(event) => setSelectedOrderId(event.target.value)}
                value={selectedOrderId}
              >
                {orderIds.map((orderId) => (
                  <option key={orderId} value={orderId}>
                    {orderId}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-medium">Queue filter</span>
              <select
                className="rounded-md border border-divider bg-content1 px-3 py-2"
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
                value={statusFilter}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              {(["compact", "comfortable"] as const).map((value) => (
                <button
                  className={`rounded-md border px-3 py-2 font-medium ${
                    density === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-divider bg-content2"
                  }`}
                  key={value}
                  onClick={() => setDensity(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </MockPanel>
        <MockPanel eyebrow="Preview" title="Current View">
          <div className="grid gap-3 text-sm">
            <div className="rounded-md bg-content2 p-3">
              <span className="text-muted">Focused order</span>
              <p className="mt-1 font-semibold">{selectedOrderId}</p>
            </div>
            <div className="rounded-md bg-content2 p-3">
              <span className="text-muted">Queue filter</span>
              <p className="mt-1 font-semibold">{statusFilter}</p>
            </div>
            <div className="rounded-md bg-content2 p-3">
              <span className="text-muted">Density</span>
              <p className="mt-1 font-semibold capitalize">{density}</p>
            </div>
          </div>
        </MockPanel>
      </div>
    </MockLabLayout>
  );
}
