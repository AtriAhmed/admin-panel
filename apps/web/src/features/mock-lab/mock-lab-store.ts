"use client";

import { create } from "zustand";

import type { MockOrderStatus } from "@/lib/mock/schemas";

type MockLabDensity = "compact" | "comfortable";

type MockLabState = {
  density: MockLabDensity;
  selectedOrderId: string;
  statusFilter: MockOrderStatus | "All";
  setDensity: (density: MockLabDensity) => void;
  setSelectedOrderId: (selectedOrderId: string) => void;
  setStatusFilter: (statusFilter: MockLabState["statusFilter"]) => void;
};

export const useMockLabStore = create<MockLabState>((set) => ({
  density: "comfortable",
  selectedOrderId: "ord_1001",
  statusFilter: "All",
  setDensity: (density) => set({ density }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
