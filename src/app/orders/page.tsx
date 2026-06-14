import { AppShell } from "@/features/dashboard/components/app-shell";
import { OrdersPage } from "@/features/dashboard/views/orders-page";

export default function OrdersRoute() {
  return (
    <AppShell>
      <OrdersPage />
    </AppShell>
  );
}
