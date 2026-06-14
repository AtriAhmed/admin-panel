import { AppShell } from "@/features/dashboard/components/app-shell";
import { DashboardPage } from "@/features/dashboard/views/dashboard-page";

export default function Home() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
