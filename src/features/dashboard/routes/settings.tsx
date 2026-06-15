import { AppShell } from "@/features/dashboard/components/app-shell";
import { SettingsPage } from "@/features/dashboard/views/settings-page";
import { requireAdmin } from "@/lib/auth/session";

export default async function SettingsRoute() {
  const admin = await requireAdmin();

  return (
    <AppShell user={admin}>
      <SettingsPage userId={admin.id} />
    </AppShell>
  );
}
