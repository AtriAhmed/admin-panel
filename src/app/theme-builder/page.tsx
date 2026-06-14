import { ProtectedAppShell } from "@/features/dashboard/components/protected-app-shell";
import { ThemeBuilderPage } from "@/features/theme-builder/theme-builder-page";

export default function ThemeBuilderRoute() {
  return (
    <ProtectedAppShell>
      <ThemeBuilderPage />
    </ProtectedAppShell>
  );
}
