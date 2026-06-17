import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { CampaignsPage } from "@/features/dashboard/views/campaigns-page";

export default function CampaignsRoute() {
  return (
    <ProtectedAppShell>
      <CampaignsPage />
    </ProtectedAppShell>
  );
}
