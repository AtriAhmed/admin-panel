"use client";

import { Check, Pencil, TrashBin } from "@gravity-ui/icons";
import { Button, Input, Modal } from "@heroui/react";
import { useRef, useState } from "react";

import { useTheme } from "@/app/app-theme-provider";
import { useThemeImport } from "@/features/theme-import/theme-import-provider";

type ThemeOption = {
  appTheme?: string;
  importedThemeId?: string;
  label: string;
  swatch?: string;
  swatchColor?: string;
  value: string;
};

const baseThemeOptions = [
  { value: "light", label: "Default", swatch: "bg-gradient-to-br from-sky-300 to-blue-600" },
  { value: "dark", label: "Default Dark", swatch: "bg-gradient-to-br from-zinc-400 to-zinc-950" },
  { value: "glass-light", label: "Glass", swatch: "bg-gradient-to-br from-sky-200 to-indigo-500" },
  { value: "glass-dark", label: "Glass Dark", swatch: "bg-gradient-to-br from-slate-500 to-slate-950" },
  { value: "mouve-light", label: "Mouve", swatch: "bg-gradient-to-br from-fuchsia-300 to-purple-700" },
  { value: "mouve-dark", label: "Mouve Dark", swatch: "bg-gradient-to-br from-purple-400 to-purple-950" },
] satisfies ThemeOption[];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const {
    activeImportedTheme,
    clearImportedThemes,
    deleteImportedTheme,
    importedThemes,
    importThemeCode,
    importThemeFile,
    renameImportedTheme,
    setActiveImportedTheme,
  } = useThemeImport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isThemeListOpen, setIsThemeListOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCode, setImportedCode] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [renameThemeId, setRenameThemeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const selectedTheme = theme ?? "light";
  const importedThemeOptions = importedThemes.flatMap((importedTheme, index) => {
    const label = importedTheme.name === "Pasted HeroUI theme"
      ? `Imported ${index + 1}`
      : importedTheme.name;

    return [
      {
        appTheme: "imported",
        importedThemeId: importedTheme.id,
        value: `imported:${importedTheme.id}`,
        label,
        swatch: importedTheme.accent ? undefined : "bg-gradient-to-br from-emerald-300 to-teal-700",
        swatchColor: importedTheme.accent ?? undefined,
      },
      {
        appTheme: "imported-dark",
        importedThemeId: importedTheme.id,
        value: `imported-dark:${importedTheme.id}`,
        label: `${label} Dark`,
        swatch: (importedTheme.darkAccent ?? importedTheme.accent)
          ? undefined
          : "bg-gradient-to-br from-emerald-500 to-slate-950",
        swatchColor: importedTheme.darkAccent ?? importedTheme.accent ?? undefined,
      },
    ] satisfies ThemeOption[];
  });
  const themeOptions: ThemeOption[] = [...baseThemeOptions, ...importedThemeOptions];
  const selectedOptionValue =
    selectedTheme === "imported" && activeImportedTheme
      ? `imported:${activeImportedTheme.id}`
      : selectedTheme === "imported-dark" && activeImportedTheme
        ? `imported-dark:${activeImportedTheme.id}`
        : selectedTheme;
  const selectedThemeOption =
    themeOptions.find((option) => option.value === selectedOptionValue) ?? themeOptions[0];

  async function handleImportFile(file: File) {
    setImportError(null);
    setIsImporting(true);

    try {
      await importThemeFile(file);
      setTheme("imported");
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "Could not import this theme file.");
    } finally {
      setIsImporting(false);
    }
  }

  function handlePasteImport() {
    setImportError(null);

    try {
      importThemeCode(importedCode);
      setTheme("imported");
      setImportedCode("");
      setIsPasteOpen(false);
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "Could not import this theme code.");
    }
  }

  function handleRenameImportedTheme(themeId: string, currentName: string) {
    setRenameThemeId(themeId);
    setRenameValue(currentName);
    setIsThemeListOpen(false);
  }

  function submitRename() {
    if (!renameThemeId) return;

    renameImportedTheme(renameThemeId, renameValue);
    setRenameThemeId(null);
    setRenameValue("");
  }

  function handleDeleteImportedTheme(themeId: string) {
    const nextTheme = importedThemes.find((importedTheme) => importedTheme.id !== themeId);

    deleteImportedTheme(themeId);

    if (
      activeImportedTheme?.id === themeId &&
      (selectedTheme === "imported" || selectedTheme === "imported-dark")
    ) {
      if (nextTheme) {
        setActiveImportedTheme(nextTheme.id);
      } else {
        setTheme("light");
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full max-w-md">
        <button
          aria-expanded={isThemeListOpen}
          aria-haspopup="listbox"
          className="flex h-12 w-full items-center justify-between rounded-[calc(var(--radius)*2)] bg-[color:var(--surface)] px-4 text-left shadow-[var(--surface-shadow)] transition hover:bg-[color:var(--default)]"
          onClick={() => setIsThemeListOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span className="text-base font-medium text-[color:var(--foreground)]">Theme</span>
          <span className="flex min-w-0 items-center gap-2 text-base text-[color:var(--muted)]">
            <span className="truncate">{selectedThemeOption.label}</span>
            <span
              aria-hidden="true"
              className={`size-4 shrink-0 rounded-full ${selectedThemeOption.swatch ?? ""}`}
              style={
                selectedThemeOption.swatchColor
                  ? { backgroundColor: selectedThemeOption.swatchColor }
                  : undefined
              }
            />
          </span>
        </button>

        {isThemeListOpen ? (
          <div
            className="absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-96 w-full overflow-auto rounded-[calc(var(--radius)*3)] bg-[color:var(--surface)] p-3 shadow-2xl"
            role="listbox"
          >
            {themeOptions.map((option) => {
              const isSelected = selectedOptionValue === option.value;

              return (
                <div
                  className="flex h-12 w-full items-center gap-1 rounded-[calc(var(--radius)*1.5)] transition hover:bg-[color:var(--default)]"
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                >
                <button
                  className="flex min-w-0 flex-1 items-center gap-4 self-stretch px-3 text-left text-base text-[color:var(--foreground)]"
                  onClick={() => {
                    if (option.importedThemeId) {
                      setActiveImportedTheme(option.importedThemeId);
                    }

                    setTheme(option.appTheme ?? option.value);
                    setIsThemeListOpen(false);
                  }}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`size-5 shrink-0 rounded-full ${option.swatch ?? ""}`}
                    style={
                      option.swatchColor ? { backgroundColor: option.swatchColor } : undefined
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? <Check className="size-4 shrink-0 text-[color:var(--foreground)]" /> : null}
                </button>
                  {option.importedThemeId ? (
                    <div className="flex shrink-0 items-center gap-1 pr-2">
                      <button
                        aria-label={`Rename ${option.label}`}
                        className="flex size-7 items-center justify-center rounded-full text-[color:var(--muted)] transition hover:bg-[color:var(--default)] hover:text-[color:var(--foreground)]"
                        onClick={() => handleRenameImportedTheme(option.importedThemeId!, option.label.replace(/ Dark$/, ""))}
                        type="button"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        aria-label={`Delete ${option.label}`}
                        className="flex size-7 items-center justify-center rounded-full text-[color:var(--danger)] transition hover:bg-[color:var(--danger-soft)]"
                        onClick={() => handleDeleteImportedTheme(option.importedThemeId!)}
                        type="button"
                      >
                        <TrashBin className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {compact ? null : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              accept=".css,.json,application/json,text/css,text/plain"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) void handleImportFile(file);

                event.target.value = "";
              }}
              type="file"
            />
            <button
              className="h-9 rounded-[calc(var(--radius)*1.5)] bg-[color:var(--default)] px-3 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--default-hover)]"
              onClick={() => {
                setImportError(null);
                setIsPasteOpen((isOpen) => !isOpen);
              }}
              type="button"
            >
              Paste HeroUI theme
            </button>
            <button
              className="h-9 rounded-[calc(var(--radius)*1.5)] bg-[color:var(--default)] px-3 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--default-hover)]"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {isImporting ? "Importing..." : "Import file"}
            </button>
            {importedThemes.length > 0 ? (
              <button
                className="h-9 rounded-[calc(var(--radius)*1.5)] px-3 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--default)] hover:text-[color:var(--foreground)]"
                onClick={() => {
                  clearImportedThemes();

                  if (selectedTheme === "imported" || selectedTheme === "imported-dark") {
                    setTheme("light");
                  }
                }}
                type="button"
              >
                Clear imported theme
              </button>
            ) : null}
          </div>
          {isPasteOpen ? (
            <div className="flex max-w-3xl flex-col gap-2">
              <textarea
                className="min-h-56 rounded-[calc(var(--radius)*1.5)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3 font-mono text-xs text-[color:var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]"
                onChange={(event) => setImportedCode(event.target.value)}
                placeholder="Paste the CSS output from the HeroUI theme builder here..."
                value={importedCode}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="h-9 rounded-[calc(var(--radius)*1.5)] bg-[color:var(--accent)] px-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-hover)]"
                  disabled={!importedCode.trim()}
                  onClick={handlePasteImport}
                  type="button"
                >
                  Apply pasted theme
                </button>
                <button
                  className="h-9 rounded-[calc(var(--radius)*1.5)] px-3 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--default)] hover:text-[color:var(--foreground)]"
                  onClick={() => {
                    setImportedCode("");
                    setIsPasteOpen(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {importedThemes.length > 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              Imported {importedThemes.length} theme{importedThemes.length === 1 ? "" : "s"}.
            </p>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Paste the CSS output from the HeroUI theme builder, or import it as a CSS/JSON file.
            </p>
          )}
          {importError ? (
            <p className="text-sm text-[color:var(--danger)]">{importError}</p>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={Boolean(renameThemeId)}
        onOpenChange={(isOpen) => {
          if (isOpen) return;

          setRenameThemeId(null);
          setRenameValue("");
        }}
      >
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitRename();
                }}
              >
                <Modal.Header>
                  <Modal.Heading>Rename theme</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <Input
                    autoFocus
                    fullWidth
                    aria-label="Theme name"
                    onChange={(event) => setRenameValue(event.target.value)}
                    placeholder="Theme name"
                    value={renameValue}
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    onPress={() => {
                      setRenameThemeId(null);
                      setRenameValue("");
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button isDisabled={!renameValue.trim()} type="submit">
                    Save
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
