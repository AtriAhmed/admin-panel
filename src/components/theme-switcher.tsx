"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/app/app-theme-provider";

const themeOptions = [
  { value: "light", label: "Default Light", swatch: "bg-sky-500" },
  { value: "dark", label: "Default Dark", swatch: "bg-zinc-800" },
  { value: "glass-light", label: "Glass Light", swatch: "bg-sky-200" },
  { value: "glass-dark", label: "Glass Dark", swatch: "bg-slate-700" },
  { value: "mouve-light", label: "Mouve Light", swatch: "bg-fuchsia-200" },
  { value: "mouve-dark", label: "Mouve Dark", swatch: "bg-purple-700" },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTheme = mounted ? theme ?? "light" : "light";

  return (
    <div
      aria-label="Theme"
      className="inline-flex rounded-[calc(var(--radius)*2)] border border-[color:var(--border)] bg-[color:var(--surface)] p-1 shadow-[var(--surface-shadow)]"
    >
      {themeOptions.map((option) => {
        const isSelected = selectedTheme === option.value;

        return (
          <button
            aria-pressed={isSelected}
            className={[
              "flex h-9 items-center gap-2 rounded-[calc(var(--radius)*1.5)] px-3 text-sm font-medium transition",
              isSelected
                ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                : "text-[color:var(--muted)] hover:bg-[color:var(--default)] hover:text-[color:var(--foreground)]",
            ].join(" ")}
            key={option.value}
            onClick={() => setTheme(option.value)}
            title={option.label}
            type="button"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${option.swatch}`}
            />
            {compact ? null : <span className="hidden sm:inline">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
