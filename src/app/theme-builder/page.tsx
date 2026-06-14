import { AppShell } from "@/features/dashboard/components/app-shell";
import { ThemeBuilderPage } from "@/features/theme-builder/theme-builder-page";

export default function ThemeBuilderRoute() {
  return (
    <AppShell>
      <ThemeBuilderPage />
    </AppShell>
  );
}
