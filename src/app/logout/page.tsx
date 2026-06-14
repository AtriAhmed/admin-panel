import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { LogoutPage } from "@/features/dashboard/views/logout-page";

export default function LogoutRoute() {
  return (
    <ProtectedAppShell>
      <LogoutPage />
    </ProtectedAppShell>
  );
}
