import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { TrackerPage } from "@/features/dashboard/views/tracker-page";

export default function TrackerRoute() {
  return (
    <ProtectedAppShell>
      <TrackerPage />
    </ProtectedAppShell>
  );
}
