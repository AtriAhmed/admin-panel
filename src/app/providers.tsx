"use client";

import { AppThemeProvider } from "@/app/app-theme-provider";
import { ThemeBuilderProvider } from "@/features/theme-builder/theme-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <ThemeBuilderProvider>{children}</ThemeBuilderProvider>
    </AppThemeProvider>
  );
}
