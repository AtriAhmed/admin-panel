"use client";

import type { ReactNode } from "react";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const storageKey = "admin-panel-imported-heroui-theme";
const styleElementId = "imported-heroui-theme";

type ImportedTheme = {
  accent: string | null;
  css: string;
  darkAccent: string | null;
  id: string;
  importedAt: string;
  name: string;
  tokenCount: number;
};

type ThemeImportContextValue = {
  activeImportedTheme: ImportedTheme | null;
  clearImportedThemes: () => void;
  deleteImportedTheme: (id: string) => void;
  importedThemes: ImportedTheme[];
  importThemeCode: (code: string) => ImportedTheme;
  importThemeFile: (file: File) => Promise<void>;
  renameImportedTheme: (id: string, name: string) => void;
  setActiveImportedTheme: (id: string) => void;
};

const ThemeImportContext = createContext<ThemeImportContextValue | null>(null);

function countCssVariables(css: string) {
  return [...css.matchAll(/--[a-zA-Z0-9-_]+\s*:/g)].length;
}

function getAccentFromBlock(body: string) {
  return body.match(/--accent\s*:\s*([^;{}]+);/)?.[1]?.trim() ?? null;
}

function readCssFromJson(contents: string) {
  try {
    const parsed = JSON.parse(contents) as unknown;

    if (typeof parsed === "string") return parsed;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;

      if (typeof record.css === "string") return record.css;
      if (typeof record.theme === "string") return record.theme;
      if (typeof record.code === "string") return record.code;
    }

    return contents;
  } catch {
    return contents;
  }
}

function normalizeSelector(selector: string) {
  const trimmedSelector = selector.trim();

  if (
    trimmedSelector === ":root" ||
    trimmedSelector === ".light" ||
    trimmedSelector === ".default" ||
    trimmedSelector === '[data-theme="light"]' ||
    trimmedSelector === '[data-theme="default"]'
  ) {
    return 'html[data-theme="imported"]';
  }

  if (trimmedSelector === ".dark" || trimmedSelector === '[data-theme="dark"]') {
    return 'html[data-theme="imported-dark"]';
  }

  if (trimmedSelector.startsWith("[data-theme=")) {
    return trimmedSelector.replace("[data-theme=", "html[data-theme=");
  }

  return null;
}

function sanitizeCssBlock(body: string) {
  const declarations = body
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      if (declaration === "color-scheme: dark" || declaration === "color-scheme: light") {
        return true;
      }

      return /^--[a-zA-Z0-9-_]+\s*:\s*[^{};]+$/.test(declaration);
    });

  return declarations.length > 0 ? `  ${declarations.join(";\n  ")};` : null;
}

function sanitizeHeroUiCss(css: string) {
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const sanitizedBlocks: string[] = [];
  const blockPattern = /([^{}]+)\{([^{}]+)\}/g;
  let accent: string | null = null;
  let darkAccent: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(cssWithoutComments)) !== null) {
    const selector = match[1].trim();
    const blockAccent = getAccentFromBlock(match[2]);
    const body = sanitizeCssBlock(match[2]);

    if (!body) continue;

    const normalizedSelectors = selector
      .split(",")
      .map(normalizeSelector)
      .filter((value): value is string => Boolean(value));

    const uniqueSelectors = [...new Set(normalizedSelectors)];

    if (uniqueSelectors.length === 0) continue;

    if (blockAccent && uniqueSelectors.includes('html[data-theme="imported"]')) {
      accent = blockAccent;
    }

    if (blockAccent && uniqueSelectors.includes('html[data-theme="imported-dark"]')) {
      darkAccent = blockAccent;
    }

    sanitizedBlocks.push(`${uniqueSelectors.join(",\n")} {\n${body}\n}`);
  }

  return {
    accent,
    css: sanitizedBlocks.join("\n\n"),
    darkAccent,
  };
}

function parseImportedTheme(contents: string, name: string): ImportedTheme {
  const { accent, css, darkAccent } = sanitizeHeroUiCss(readCssFromJson(contents));
  const tokenCount = countCssVariables(css);

  if (tokenCount === 0) {
    throw new Error("No HeroUI CSS variables were found in this theme.");
  }

  return {
    accent,
    css,
    darkAccent,
    id: crypto.randomUUID(),
    importedAt: new Date().toISOString(),
    name,
    tokenCount,
  };
}

type StoredImportedThemes = {
  activeThemeId: string | null;
  themes: ImportedTheme[];
};

function loadImportedThemes(): StoredImportedThemes {
  try {
    const rawTheme = window.localStorage.getItem(storageKey);

    if (!rawTheme) {
      return { activeThemeId: null, themes: [] };
    }

    const parsedTheme = JSON.parse(rawTheme) as Partial<ImportedTheme> | Partial<StoredImportedThemes>;

    if ("themes" in parsedTheme && Array.isArray(parsedTheme.themes)) {
      const themes = parsedTheme.themes.filter((theme): theme is ImportedTheme => {
        return Boolean(theme?.id && theme.css && theme.tokenCount);
      });

      return {
        activeThemeId: parsedTheme.activeThemeId ?? themes[0]?.id ?? null,
        themes,
      };
    }

    if ("css" in parsedTheme && parsedTheme.css && parsedTheme.tokenCount) {
      const migratedTheme = {
        ...parsedTheme,
        id: parsedTheme.id ?? crypto.randomUUID(),
      } as ImportedTheme;

      return {
        activeThemeId: migratedTheme.id,
        themes: [migratedTheme],
      };
    }

    return { activeThemeId: null, themes: [] };
  } catch {
    return { activeThemeId: null, themes: [] };
  }
}

function createImportedThemeCss(theme: ImportedTheme) {
  return theme.css;
}

function applyImportedTheme(theme: ImportedTheme | null) {
  document.getElementById(styleElementId)?.remove();

  if (!theme) return;

  const style = document.createElement("style");

  style.id = styleElementId;
  style.textContent = createImportedThemeCss(theme);
  document.head.appendChild(style);
}

export function ThemeImportProvider({ children }: { children: ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [importedThemes, setImportedThemes] = useState<ImportedTheme[]>([]);
  const activeImportedTheme =
    importedThemes.find((theme) => theme.id === activeThemeId) ?? importedThemes[0] ?? null;

  useEffect(() => {
    const storedThemes = loadImportedThemes();

    setImportedThemes(storedThemes.themes);
    setActiveThemeId(storedThemes.activeThemeId);
  }, []);

  useEffect(() => {
    applyImportedTheme(activeImportedTheme);

    try {
      if (importedThemes.length > 0) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            activeThemeId: activeImportedTheme?.id ?? null,
            themes: importedThemes,
          }),
        );
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore unavailable storage.
    }
  }, [activeImportedTheme, importedThemes]);

  const importThemeFile = useCallback(async (file: File) => {
    const imported = parseImportedTheme(await file.text(), file.name);

    setImportedThemes((themes) => [...themes, imported]);
    setActiveThemeId(imported.id);
  }, []);

  const importThemeCode = useCallback((code: string) => {
    const imported = parseImportedTheme(code, "Pasted HeroUI theme");

    setImportedThemes((themes) => [...themes, imported]);
    setActiveThemeId(imported.id);

    return imported;
  }, []);

  const clearImportedThemes = useCallback(() => {
    setImportedThemes([]);
    setActiveThemeId(null);
  }, []);

  const deleteImportedTheme = useCallback((id: string) => {
    setImportedThemes((themes) => {
      const nextThemes = themes.filter((theme) => theme.id !== id);

      setActiveThemeId((currentId) => {
        if (currentId !== id) return currentId;

        return nextThemes[0]?.id ?? null;
      });

      return nextThemes;
    });
  }, []);

  const renameImportedTheme = useCallback((id: string, name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    setImportedThemes((themes) => {
      return themes.map((theme) => {
        if (theme.id !== id) return theme;

        return {
          ...theme,
          name: trimmedName,
        };
      });
    });
  }, []);

  const setActiveImportedTheme = useCallback((id: string) => {
    setActiveThemeId(id);
  }, []);

  const value = useMemo(
    () => ({
      activeImportedTheme,
      clearImportedThemes,
      deleteImportedTheme,
      importedThemes,
      importThemeCode,
      importThemeFile,
      renameImportedTheme,
      setActiveImportedTheme,
    }),
    [
      activeImportedTheme,
      clearImportedThemes,
      deleteImportedTheme,
      importedThemes,
      importThemeCode,
      importThemeFile,
      renameImportedTheme,
      setActiveImportedTheme,
    ],
  );

  return (
    <ThemeImportContext.Provider value={value}>
      {children}
    </ThemeImportContext.Provider>
  );
}

export function useThemeImport() {
  const context = useContext(ThemeImportContext);

  if (!context) {
    throw new Error("useThemeImport must be used inside ThemeImportProvider");
  }

  return context;
}
