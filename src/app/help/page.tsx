import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { HelpPage } from "@/features/dashboard/views/help-page";

export default function HelpRoute() {
  return (
    <ProtectedAppShell>
      <HelpPage />
    </ProtectedAppShell>
  );
}
