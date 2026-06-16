import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import OperationsInsights from "@/features/mock-lab/routes/swr";

export default function OperationsInsightsRoute() {
  return (
    <ProtectedAppShell>
      <OperationsInsights />
    </ProtectedAppShell>
  );
}
