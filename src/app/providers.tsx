"use client";

import { AppThemeProvider } from "@/app/app-theme-provider";
import { ThemeImportProvider } from "@/features/theme-import/theme-import-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <ThemeImportProvider>{children}</ThemeImportProvider>
    </AppThemeProvider>
  );
}
