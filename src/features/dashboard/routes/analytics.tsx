import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { AnalyticsPage } from "@/features/dashboard/views/analytics-page";

export default function AnalyticsRoute() {
  return (
    <ProtectedAppShell>
      <AnalyticsPage />
    </ProtectedAppShell>
  );
}
