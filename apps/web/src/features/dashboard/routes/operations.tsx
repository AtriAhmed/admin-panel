import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { OperationsPage } from "@/features/dashboard/views/operations-page";

export default function OperationsRoute() {
  return (
    <ProtectedAppShell>
      <OperationsPage />
    </ProtectedAppShell>
  );
}
