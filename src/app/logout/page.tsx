import { AppShell } from "@/features/dashboard/components/app-shell";
import { LogoutPage } from "@/features/dashboard/views/logout-page";

export default function LogoutRoute() {
  return (
    <AppShell>
      <LogoutPage />
    </AppShell>
  );
}
