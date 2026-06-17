"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AdminUiState {
  hasHydrated: boolean;
  isSidebarOpen: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setSidebarOpen: (isSidebarOpen: boolean) => void;
}

export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      isSidebarOpen: true,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
    }),
    {
      name: "admin-panel-ui-preferences",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
