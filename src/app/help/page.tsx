import { AppShell } from "@/features/dashboard/components/app-shell";
import { HelpPage } from "@/features/dashboard/views/help-page";

export default function HelpRoute() {
  return (
    <AppShell>
      <HelpPage />
    </AppShell>
  );
}
