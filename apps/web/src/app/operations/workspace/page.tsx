import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import OperationsWorkspace from "@/features/mock-lab/routes/zustand";

export default function OperationsWorkspaceRoute() {
  return (
    <ProtectedAppShell>
      <OperationsWorkspace />
    </ProtectedAppShell>
  );
}
