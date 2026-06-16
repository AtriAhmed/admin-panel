import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { DashboardPage } from "@/features/dashboard/views/dashboard-page";

export default function Home() {
  return (
    <ProtectedAppShell>
      <DashboardPage />
    </ProtectedAppShell>
  );
}
