import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import OperationsOverview from "@/features/mock-lab/routes/overview";

export default function OperationsRoute() {
  return (
    <ProtectedAppShell>
      <OperationsOverview />
    </ProtectedAppShell>
  );
}
