"use client";

import { AppThemeProvider } from "@/app/app-theme-provider";
import { QueryProvider } from "@/app/query-provider";
import { ThemeImportProvider } from "@/features/theme-import/theme-import-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <QueryProvider>
        <ThemeImportProvider>{children}</ThemeImportProvider>
      </QueryProvider>
    </AppThemeProvider>
  );
}
