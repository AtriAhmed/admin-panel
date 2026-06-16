import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import OperationsFulfillment from "@/features/mock-lab/routes/tanstack";

export default function OperationsFulfillmentRoute() {
  return (
    <ProtectedAppShell>
      <OperationsFulfillment />
    </ProtectedAppShell>
  );
}
