import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { OrdersPage } from "@/features/dashboard/views/orders-page";

export default function OrdersRoute() {
  return (
    <ProtectedAppShell>
      <OrdersPage />
    </ProtectedAppShell>
  );
}
