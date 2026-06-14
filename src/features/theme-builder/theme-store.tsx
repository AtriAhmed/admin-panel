"use client";

import type { ReactNode } from "react";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { useTheme } from "@/app/app-theme-provider";

export type ThemeBuilderState = {
  accent: string;
  base: number;
  danger: string;
  fontFamily: string;
  fontSize: number;
  formsRadius: number;
  generalRadius: number;
  letterSpacing: number;
  lineHeight: number;
  spacing: number;
  success: string;
  themePreset: string;
  vibrantPalette: boolean;
  warning: string;
};

type ThemeBuilderContextValue = {
  canRedo: boolean;
  canUndo: boolean;
  redoTheme: () => void;
  resetTheme: () => void;
  theme: ThemeBuilderState;
  undoTheme: () => void;
  updateTheme: (patch: Partial<ThemeBuilderState>) => void;
};

const storageKey = "admin-panel-custom-theme-style";

export const defaultThemeBuilderState: ThemeBuilderState = {
  accent: "#7DD3FC",
  base: 0.55,
  danger: "#FF383C",
  fontFamily: "Inter",
  fontSize: 1,
  formsRadius: 0.75,
  generalRadius: 0.5,
  letterSpacing: 0,
  lineHeight: 1,
  spacing: 1,
  success: "#17C964",
  themePreset: "Default",
  vibrantPalette: false,
  warning: "#F5A524",
};

export const fontStacks: Record<string, string> = {
  Anton: "var(--font-anton), Impact, sans-serif",
  "Bricolage Grotesque": "var(--font-bricolage-grotesque), system-ui, sans-serif",
  "DM Sans": "var(--font-dm-sans), system-ui, sans-serif",
  Figtree: "var(--font-figtree), system-ui, sans-serif",
  Fraunces: "var(--font-fraunces), Georgia, serif",
  Fredoka: "var(--font-fredoka), system-ui, sans-serif",
  Geist: "var(--font-geist), system-ui, sans-serif",
  "Hanken Grotesk": "var(--font-hanken-grotesk), system-ui, sans-serif",
  Inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  "Instrument Sans": "var(--font-instrument-sans), system-ui, sans-serif",
  "Public Sans": "var(--font-public-sans), system-ui, sans-serif",
  "Varela Round": "var(--font-varela-round), system-ui, sans-serif",
};

const ThemeBuilderContext = createContext<ThemeBuilderContextValue | null>(null);

type ThemeHistoryState = {
  future: ThemeBuilderState[];
  hasLoadedStoredTheme: boolean;
  past: ThemeBuilderState[];
  theme: ThemeBuilderState;
};

type ThemeHistoryAction =
  | { type: "load"; theme: ThemeBuilderState }
  | { type: "redo" }
  | { type: "undo" }
  | { patch: Partial<ThemeBuilderState>; type: "update" };

const maxHistoryLength = 50;

function pushHistory(history: ThemeBuilderState[], theme: ThemeBuilderState) {
  return [...history, theme].slice(-maxHistoryLength);
}

function hasThemeChanges(theme: ThemeBuilderState, patch: Partial<ThemeBuilderState>) {
  return Object.entries(patch).some(([key, value]) => {
    return theme[key as keyof ThemeBuilderState] !== value;
  });
}

function themeHistoryReducer(
  state: ThemeHistoryState,
  action: ThemeHistoryAction,
): ThemeHistoryState {
  switch (action.type) {
    case "load":
      return {
        future: [],
        hasLoadedStoredTheme: true,
        past: [],
        theme: action.theme,
      };
    case "redo": {
      const nextTheme = state.future[0];

      if (!nextTheme) return state;

      return {
        ...state,
        future: state.future.slice(1),
        past: pushHistory(state.past, state.theme),
        theme: nextTheme,
      };
    }
    case "undo": {
      const previousTheme = state.past.at(-1);

      if (!previousTheme) return state;

      return {
        ...state,
        future: [state.theme, ...state.future],
        past: state.past.slice(0, -1),
        theme: previousTheme,
      };
    }
    case "update": {
      if (!hasThemeChanges(state.theme, action.patch)) return state;

      return {
        ...state,
        future: [],
        past: pushHistory(state.past, state.theme),
        theme: {
          ...state.theme,
          themePreset: action.patch.themePreset ?? "Custom",
          ...action.patch,
        },
      };
    }
    default:
      return state;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

function clearStructuralThemeVariables(root: HTMLElement) {
  root.style.removeProperty("--accent-foreground");
  root.style.removeProperty("--background");
  root.style.removeProperty("--surface");
  root.style.removeProperty("--surface-secondary");
  root.style.removeProperty("--surface-shadow");
}

function applyTheme(theme: ThemeBuilderState, activeTheme?: string) {
  const root = document.documentElement;
  const resolvedTheme = activeTheme ?? root.getAttribute("data-theme") ?? "";
  const usesImportedStructuralTheme =
    resolvedTheme.includes("dark") ||
    resolvedTheme.startsWith("glass-") ||
    resolvedTheme.startsWith("mouve-");
  const baseTint = clamp(theme.base, 0, 1);
  const surfaceTint = baseTint * 8;
  const backgroundTint = baseTint * 14;

  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--warning", theme.warning);
  root.style.setProperty("--danger", theme.danger);
  root.style.setProperty("--focus", theme.accent);
  root.style.setProperty("--chart-1", `color-mix(in oklab, ${theme.accent} 45%, white)`);
  root.style.setProperty("--chart-2", `color-mix(in oklab, ${theme.accent} 70%, #0f1720)`);
  root.style.setProperty("--chart-3", theme.accent);
  root.style.setProperty("--chart-4", `color-mix(in oklab, ${theme.accent} 65%, white)`);
  root.style.setProperty("--chart-5", `color-mix(in oklab, ${theme.accent} 35%, #0f1720)`);

  if (usesImportedStructuralTheme) {
    clearStructuralThemeVariables(root);
  } else {
    root.style.setProperty("--accent-foreground", "#0f1720");
    root.style.setProperty(
      "--background",
      `color-mix(in oklab, white ${100 - backgroundTint}%, ${theme.accent})`,
    );
    root.style.setProperty(
      "--surface",
      `color-mix(in oklab, white ${100 - surfaceTint}%, ${theme.accent})`,
    );
    root.style.setProperty(
      "--surface-secondary",
      `color-mix(in oklab, white ${94 - surfaceTint}%, ${theme.accent})`,
    );
    root.style.setProperty("--surface-shadow", `0 14px 34px -22px ${withAlpha(theme.accent, 0.5)}, 0 1px 2px rgb(15 23 42 / 0.14)`);
  }

  root.style.setProperty("--radius", `${theme.generalRadius}rem`);
  root.style.setProperty("--field-radius", `${theme.formsRadius}rem`);
  root.style.setProperty("--spacing", `${0.25 * theme.spacing}rem`);
  root.style.setProperty("--app-font-family", fontStacks[theme.fontFamily] ?? fontStacks.Inter);
  root.style.setProperty("--app-line-height", `${theme.lineHeight + 0.35}`);
  root.style.setProperty("--app-letter-spacing", `${theme.letterSpacing}em`);
  root.style.setProperty("font-size", `${16 * theme.fontSize}px`);

  if (theme.vibrantPalette) {
    root.setAttribute("data-vibrant-palette", "true");
  } else {
    root.removeAttribute("data-vibrant-palette");
  }
}

function loadInitialTheme(): ThemeBuilderState {
  if (typeof window === "undefined") return defaultThemeBuilderState;

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) return defaultThemeBuilderState;

    return { ...defaultThemeBuilderState, ...JSON.parse(raw) };
  } catch {
    return defaultThemeBuilderState;
  }
}

export function ThemeBuilderProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(themeHistoryReducer, {
    future: [],
    hasLoadedStoredTheme: false,
    past: [],
    theme: defaultThemeBuilderState,
  });
  const { resolvedTheme, theme: activeTheme } = useTheme();
  const { future, hasLoadedStoredTheme, past, theme } = history;

  useEffect(() => {
    dispatch({ theme: loadInitialTheme(), type: "load" });
  }, []);

  useEffect(() => {
    applyTheme(theme, resolvedTheme ?? activeTheme);

    if (hasLoadedStoredTheme) {
      window.localStorage.setItem(storageKey, JSON.stringify(theme));
    }
  }, [activeTheme, hasLoadedStoredTheme, resolvedTheme, theme]);

  const updateTheme = useCallback((patch: Partial<ThemeBuilderState>) => {
    dispatch({ patch, type: "update" });
  }, []);

  const undoTheme = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);

  const redoTheme = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);

  const resetTheme = useCallback(() => {
    dispatch({ patch: defaultThemeBuilderState, type: "update" });
  }, []);

  const value = useMemo(
    () => ({
      canRedo: future.length > 0,
      canUndo: past.length > 0,
      redoTheme,
      resetTheme,
      theme,
      undoTheme,
      updateTheme,
    }),
    [future.length, past.length, redoTheme, resetTheme, theme, undoTheme, updateTheme],
  );

  return (
    <ThemeBuilderContext.Provider value={value}>
      {children}
    </ThemeBuilderContext.Provider>
  );
}

export function useThemeBuilder() {
  const context = useContext(ThemeBuilderContext);

  if (!context) {
    throw new Error("useThemeBuilder must be used inside ThemeBuilderProvider");
  }

  return context;
}
