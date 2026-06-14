import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/session";

import { AppShell } from "./app-shell";

export async function ProtectedAppShell({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return <AppShell user={admin}>{children}</AppShell>;
}
