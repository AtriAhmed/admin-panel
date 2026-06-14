"use client";

import { ThemeProvider, useTheme as useNextTheme } from "next-themes";
import { useCallback, useEffect, useMemo } from "react";

const storageKey = "admin-panel-theme-v2";

export const appThemes = ["light", "dark", "glass-light", "glass-dark", "mouve-light", "mouve-dark"];

type AppThemeContextValue = {
  resolvedTheme?: string;
  setTheme: (theme: string) => void;
  theme?: string;
  themes: string[];
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      disableTransitionOnChange
      enableColorScheme={false}
      enableSystem={false}
      storageKey={storageKey}
      themes={appThemes}
    >
      <AppThemeColorScheme />
      {children}
    </ThemeProvider>
  );
}

function AppThemeColorScheme() {
  const { resolvedTheme, theme } = useNextTheme();
  const activeTheme = resolvedTheme ?? theme ?? "light";

  useEffect(() => {
    document.documentElement.style.colorScheme = activeTheme.includes("dark") ? "dark" : "light";
  }, [activeTheme]);

  return null;
}

export function useTheme(): AppThemeContextValue {
  const nextTheme = useNextTheme();
  const { resolvedTheme, setTheme: setNextTheme, theme } = nextTheme;

  const setTheme = useCallback((themeName: string) => {
    if (!appThemes.includes(themeName)) return;

    setNextTheme(themeName);
  }, [setNextTheme]);

  return useMemo(
    () => ({
      resolvedTheme,
      setTheme,
      theme,
      themes: appThemes,
    }),
    [resolvedTheme, setTheme, theme],
  );
}
