import { AppShell } from "@/features/dashboard/components/app-shell";
import { AnalyticsPage } from "@/features/dashboard/views/analytics-page";

export default function AnalyticsRoute() {
  return (
    <AppShell>
      <AnalyticsPage />
    </AppShell>
  );
}
