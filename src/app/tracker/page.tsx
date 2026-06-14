import { AppShell } from "@/features/dashboard/components/app-shell";
import { TrackerPage } from "@/features/dashboard/views/tracker-page";

export default function TrackerRoute() {
  return (
    <AppShell>
      <TrackerPage />
    </AppShell>
  );
}
