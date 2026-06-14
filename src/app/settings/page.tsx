import { AppShell } from "@/features/dashboard/components/app-shell";
import { SettingsPage } from "@/features/dashboard/views/settings-page";

export default function SettingsRoute() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
