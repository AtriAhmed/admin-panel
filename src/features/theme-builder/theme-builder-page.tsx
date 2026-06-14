"use client";

import {
  ArrowRotateLeft,
  ArrowUturnCcwLeft,
  ArrowUturnCcwRight,
  Arrows3RotateLeft,
  Code,
  Check,
  FileArrowUp,
  LayoutHeaderCursor,
  Link,
  Moon,
  Palette,
  Plus,
  Shuffle,
  Sun,
  Xmark,
} from "@gravity-ui/icons";
import { Button, Card, Switch } from "@heroui/react";
import { BarChart, LineChart, NumberValue, TrendChip } from "@heroui-pro/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "@/app/app-theme-provider";
import { Bell, Calendar, ChevronDown, EllipsisVertical, Magnifier, PersonPlus } from "@gravity-ui/icons";

import { IconButton } from "@/components/ui/icon-button";

import { defaultThemeBuilderState, fontStacks, useThemeBuilder } from "./theme-store";

type ThemeNumberKey =
  | "base"
  | "lineHeight"
  | "letterSpacing"
  | "spacing"
  | "fontSize"
  | "generalRadius"
  | "formsRadius";

type ThemeColorKey = "accent" | "success" | "warning" | "danger";

const baseSteps = [0, 0.3, 0.5, 0.8, 1, 1.3, 1.5];
const radiusSteps = [0, 0.1, 0.25, 0.5, 0.75, 1];

type ThemePreset = {
  appTheme: string;
  swatch: string;
  value: string;
  label: string;
  theme: Partial<ReturnType<typeof useThemeBuilder>["theme"]>;
};

const fonts = [
  "Inter",
  "Anton",
  "Figtree",
  "Hanken Grotesk",
  "Geist",
  "DM Sans",
  "Public Sans",
  "Bricolage Grotesque",
  "Varela Round",
  "Instrument Sans",
  "Fredoka",
  "Fraunces",
];

const chartData = [
  { month: "Aug", organic: 11000, paid: 7800, sales: 30 },
  { month: "Sep", organic: 12800, paid: 6000, sales: 52 },
  { month: "Oct", organic: 9800, paid: 11200, sales: 34 },
  { month: "Nov", organic: 15100, paid: 16200, sales: 45 },
  { month: "Dec", organic: 8200, paid: 7200, sales: 33 },
];

const themePresets: ThemePreset[] = [
  {
    appTheme: "light",
    label: "Default",
    swatch: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    value: "Default",
    theme: defaultThemeBuilderState,
  },
  {
    appTheme: "light",
    label: "Sky",
    swatch: "linear-gradient(135deg, #7DD3FC, #0EA5E9)",
    value: "Sky",
    theme: {
      accent: "#7DD3FC",
      base: 0.55,
      fontFamily: "Inter",
      formsRadius: 0.75,
      generalRadius: 0.5,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "light",
    label: "Lavender",
    swatch: "linear-gradient(135deg, #E879F9, #A855F7)",
    value: "Lavender",
    theme: {
      accent: "#C084FC",
      base: 0.55,
      fontFamily: "Inter",
      formsRadius: 0.75,
      generalRadius: 0.5,
      letterSpacing: 0.02,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "light",
    label: "Mint",
    swatch: "linear-gradient(135deg, #6EE7B7, #10B981)",
    value: "Mint",
    theme: {
      accent: "#5EEAD4",
      base: 0.5,
      fontFamily: "Instrument Sans",
      formsRadius: 0.75,
      generalRadius: 0.6,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "light",
    label: "Netflix",
    swatch: "linear-gradient(135deg, #FB7185, #EF4444)",
    value: "Netflix",
    theme: {
      accent: "#EF4444",
      base: 0.4,
      fontFamily: "Anton",
      formsRadius: 0.35,
      generalRadius: 0.35,
      letterSpacing: 0,
      lineHeight: 0.95,
      spacing: 0.9,
    },
  },
  {
    appTheme: "light",
    label: "Uber",
    swatch: "linear-gradient(135deg, #A3A3A3, #111827)",
    value: "Uber",
    theme: {
      accent: "#111827",
      base: 0.35,
      fontFamily: "Geist",
      formsRadius: 0.35,
      generalRadius: 0.25,
      letterSpacing: 0,
      lineHeight: 0.95,
      spacing: 0.9,
    },
  },
  {
    appTheme: "light",
    label: "Spotify",
    swatch: "linear-gradient(135deg, #6EE7B7, #22C55E)",
    value: "Spotify",
    theme: {
      accent: "#22C55E",
      base: 0.42,
      fontFamily: "DM Sans",
      formsRadius: 1,
      generalRadius: 0.9,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 0.95,
    },
  },
  {
    appTheme: "light",
    label: "Coinbase",
    swatch: "linear-gradient(135deg, #60A5FA, #2563EB)",
    value: "Coinbase",
    theme: {
      accent: "#2563EB",
      base: 0.45,
      fontFamily: "Inter",
      formsRadius: 0.75,
      generalRadius: 0.55,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "light",
    label: "Airbnb",
    swatch: "linear-gradient(135deg, #FDA4AF, #FF5A5F)",
    value: "Airbnb",
    theme: {
      accent: "#FF5A5F",
      base: 0.45,
      fontFamily: "Public Sans",
      formsRadius: 0.9,
      generalRadius: 0.9,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "light",
    label: "Discord",
    swatch: "linear-gradient(135deg, #818CF8, #5865F2)",
    value: "Discord",
    theme: {
      accent: "#5865F2",
      base: 0.48,
      fontFamily: "Fredoka",
      formsRadius: 0.8,
      generalRadius: 0.7,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "light",
    label: "Rabbit",
    swatch: "linear-gradient(135deg, #FCD34D, #F97316)",
    value: "Rabbit",
    theme: {
      accent: "#F97316",
      base: 0.4,
      fontFamily: "Varela Round",
      formsRadius: 0.6,
      generalRadius: 0.45,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 0.95,
    },
  },
  {
    appTheme: "light",
    label: "Brutalism",
    swatch: "linear-gradient(135deg, #D4D4D4, #737373)",
    value: "Brutalism",
    theme: {
      accent: "#171717",
      base: 0.25,
      fontFamily: "Bricolage Grotesque",
      formsRadius: 0,
      generalRadius: 0,
      letterSpacing: 0,
      lineHeight: 0.9,
      spacing: 0.85,
    },
  },
  {
    appTheme: "mouve-light",
    label: "Mouve",
    swatch: "linear-gradient(135deg, #F0ABFC, #D946EF)",
    value: "Mouve",
    theme: {
      accent: "#D946EF",
      base: 0.55,
      fontFamily: "Inter",
      formsRadius: 0.75,
      generalRadius: 0.5,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
  {
    appTheme: "glass-light",
    label: "Glass",
    swatch: "linear-gradient(135deg, #BAE6FD, #818CF8)",
    value: "Glass",
    theme: {
      accent: "#60A5FA",
      base: 0.55,
      fontFamily: "Inter",
      formsRadius: 0.75,
      generalRadius: 0.75,
      letterSpacing: 0,
      lineHeight: 1,
      spacing: 1,
    },
  },
];

export function ThemeBuilderPage() {
  const { setTheme, theme: selectedAppTheme } = useTheme();
  const {
    canRedo,
    canUndo,
    redoTheme,
    resetTheme,
    theme,
    undoTheme,
    updateTheme,
  } = useThemeBuilder();
  const [activeColor, setActiveColor] = useState<ThemeColorKey | null>(null);
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const appTheme = selectedAppTheme ?? "light";

  const codeOutput = useMemo(
    () => JSON.stringify(theme, null, 2),
    [theme],
  );

  function handleReset() {
    setTheme("light");
    resetTheme();
  }

  function handlePresetSelect(preset: ThemePreset) {
    setTheme(preset.appTheme);
    updateTheme({
      ...preset.theme,
      themePreset: preset.value,
    });
    setThemePickerOpen(false);
  }

  function handleRandomize() {
    const accents = ["#7DD3FC", "#C084FC", "#5EEAD4", "#EF4444", "#22C55E", "#2563EB", "#FF5A5F", "#5865F2", "#F97316"];
    const accent = accents[Math.floor(Math.random() * accents.length)];
    const fontFamily = fonts[Math.floor(Math.random() * fonts.length)];

    setTheme("light");
    updateTheme({
      accent,
      base: randomStep(baseSteps),
      fontFamily,
      fontSize: randomInRange(0.6, 1.4, 0.1),
      formsRadius: randomStep(radiusSteps),
      generalRadius: randomStep(radiusSteps),
      letterSpacing: randomInRange(-0.05, 0.1, 0.01),
      lineHeight: randomInRange(0.8, 1.5, 0.1),
      spacing: randomInRange(0.6, 1.4, 0.1),
      themePreset: "Custom",
    });
  }

  function handleDarkPreview() {
    if (appTheme.includes("dark")) {
      setTheme(appTheme.replace("dark", "light"));
      return;
    }

    if (appTheme.includes("glass")) {
      setTheme("glass-dark");
      return;
    }

    if (appTheme.includes("mouve")) {
      setTheme("mouve-dark");
      return;
    }

    setTheme("dark");
  }

  async function handleImportFile(file: File) {
    try {
      const importedTheme = JSON.parse(await file.text()) as Partial<typeof theme>;

      updateTheme({
        ...importedTheme,
        themePreset: importedTheme.themePreset ?? "Custom",
      });
    } catch {
      window.alert("Could not import this theme file. Please use a valid JSON export.");
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const commandKey = event.metaKey || event.ctrlKey;

      if (!commandKey) return;

      const key = event.key.toLowerCase();

      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redoTheme();
        return;
      }

      if (key === "z") {
        event.preventDefault();
        undoTheme();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        handleReset();
        return;
      }

      if (key === "j") {
        event.preventDefault();
        handleRandomize();
        return;
      }

      if (key === "d") {
        event.preventDefault();
        handleDarkPreview();
        return;
      }

      if (key === "/") {
        event.preventDefault();
        setCodePanelOpen((isOpen) => !isOpen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="grid min-h-[calc(100svh-4rem)] grid-cols-1 bg-[color:var(--background)] xl:grid-cols-[minmax(0,1fr)_276px]">
      <section className="relative overflow-hidden border-r border-[color:var(--separator)] bg-[color:var(--background)]">
        <BuilderToolbar
          appTheme={appTheme}
          canRedo={canRedo}
          canUndo={canUndo}
          codePanelOpen={codePanelOpen}
          onCodeToggle={() => setCodePanelOpen((isOpen) => !isOpen)}
          onDarkPreview={handleDarkPreview}
          onImportClick={() => importInputRef.current?.click()}
          onRandomize={handleRandomize}
          onRedo={redoTheme}
          onReset={handleReset}
          onUndo={undoTheme}
        />
        <input
          ref={importInputRef}
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) void handleImportFile(file);

            event.target.value = "";
          }}
          type="file"
        />
        <div className="h-[calc(100svh-8.5rem)] overflow-auto bg-[color:var(--background)] p-6">
          <PreviewCanvas />
        </div>

        {codePanelOpen ? (
          <CodePanel
            code={codeOutput}
            onClose={() => setCodePanelOpen(false)}
          />
        ) : null}
        {activeColor ? (
          <ColorPopover
            colorKey={activeColor}
            onClose={() => setActiveColor(null)}
          />
        ) : null}
        {fontPickerOpen ? (
          <FontPicker onClose={() => setFontPickerOpen(false)} />
        ) : null}
      </section>

      <aside className="bg-[#f4f4f5] px-3 py-2">
        <div className="mb-3 grid grid-cols-[1fr_1fr_1px_1fr] rounded-full bg-[#e9e9eb] p-0.5 text-center text-xs font-medium text-muted">
          <button className="rounded-full bg-white px-4 py-2 text-foreground shadow-sm" type="button">
            Style
          </button>
          <button className="px-4 py-2" type="button">
            Variables
          </button>
          <div className="my-2 bg-[#cfcfd3]" />
          <button className="px-4 py-2" type="button">
            Agent
          </button>
        </div>

        <div className="space-y-5">
          <ThemePresetSelect
            isOpen={themePickerOpen}
            onOpenChange={setThemePickerOpen}
            onSelect={handlePresetSelect}
            selectedPreset={theme.themePreset}
          />

          <ControlGroup title="Color">
            <ColorRow colorKey="accent" label="Accent" onOpen={setActiveColor} />
            <MeterRow label="Base" max={1.5} min={0} stateKey="base" step={0.01} values={baseSteps} />
            <ColorRow colorKey="success" label="Success" onOpen={setActiveColor} />
            <ColorRow colorKey="warning" label="Warning" onOpen={setActiveColor} />
            <ColorRow colorKey="danger" label="Danger" onOpen={setActiveColor} />
            <div className="flex h-9 items-center justify-between rounded-xl bg-white px-3">
              <span className="text-xs font-medium">Vibrant palette</span>
              <Switch
                isSelected={theme.vibrantPalette}
                onChange={(isSelected) => updateTheme({ vibrantPalette: isSelected })}
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          </ControlGroup>

          <ControlGroup title="Typography">
            <button
              className="flex h-9 w-full items-center justify-between rounded-xl bg-white px-3 text-left"
              onClick={() => setFontPickerOpen(true)}
              type="button"
            >
              <span className="text-xs font-medium">Font Family</span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                {theme.fontFamily}
                <span className="text-xs font-semibold text-foreground">Ag</span>
              </span>
            </button>
            <MeterRow label="Line Height" max={1.5} min={0.8} step={0.1} stateKey="lineHeight" />
            <MeterRow label="Letter Spacing" max={0.1} min={-0.05} step={0.01} stateKey="letterSpacing" />
          </ControlGroup>

          <ControlGroup title="Density">
            <MeterRow label="Spacing" max={1.4} min={0.6} step={0.1} stateKey="spacing" />
            <MeterRow label="Font Size" max={1.4} min={0.6} step={0.1} stateKey="fontSize" />
          </ControlGroup>

          <ControlGroup title="Corners">
            <MeterRow label="General Radius" max={1} min={0} stateKey="generalRadius" step={0.01} values={radiusSteps} />
            <MeterRow label="Forms Radius" max={1} min={0} stateKey="formsRadius" step={0.01} values={radiusSteps} />
          </ControlGroup>

          <details className="rounded-xl bg-white p-3 text-xs">
            <summary className="cursor-pointer font-medium">Generated theme JSON</summary>
            <pre className="mt-3 overflow-auto rounded-xl bg-[#f4f4f5] p-3 text-xs leading-5">
              {codeOutput}
            </pre>
          </details>
        </div>
      </aside>
    </div>
  );
}

function randomInRange(min: number, max: number, step: number) {
  const steps = Math.round((max - min) / step);

  return Math.round((min + Math.floor(Math.random() * (steps + 1)) * step) * 100) / 100;
}

function randomStep(values: number[]) {
  return values[Math.floor(Math.random() * values.length)];
}

function BuilderToolbar({
  appTheme,
  canRedo,
  canUndo,
  codePanelOpen,
  onCodeToggle,
  onDarkPreview,
  onImportClick,
  onRandomize,
  onRedo,
  onReset,
  onUndo,
}: {
  appTheme: string;
  canRedo: boolean;
  canUndo: boolean;
  codePanelOpen: boolean;
  onCodeToggle: () => void;
  onDarkPreview: () => void;
  onImportClick: () => void;
  onRandomize: () => void;
  onRedo: () => void;
  onReset: () => void;
  onUndo: () => void;
}) {
  const isDarkPreview = appTheme.includes("dark");

  return (
    <div className="flex h-[4.5rem] items-center justify-between border-b border-[color:var(--separator)] bg-[color:var(--surface)] px-5">
      <div className="flex items-center gap-0.5">
        <ToolbarIconButton
          disabled={!canUndo}
          label="Undo"
          onClick={onUndo}
          shortcut="⌘ Z"
          tooltipAlign="start"
        >
          <ArrowUturnCcwLeft className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={!canRedo}
          label="Redo"
          onClick={onRedo}
          shortcut="⇧ ⌘ Z"
        >
          <ArrowUturnCcwRight className="size-4" />
        </ToolbarIconButton>
        <div className="mx-1.5 h-4 w-px bg-[color:var(--border)]" />
        <ToolbarIconButton label="Reset" onClick={onReset} shortcut="⌘ R">
          <ArrowRotateLeft className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton label="Randomize" onClick={onRandomize} shortcut="⌘ J">
          <Shuffle className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          label={isDarkPreview ? "Light mode" : "Dark mode"}
          onClick={onDarkPreview}
          shortcut="⌘ D"
        >
          {isDarkPreview ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </ToolbarIconButton>
        <ToolbarIconButton disabled label="Inspect">
          <LayoutHeaderCursor className="size-4 text-muted" />
        </ToolbarIconButton>
        <ToolbarIconButton label="Command" onClick={onCodeToggle} shortcut="⌘ /">
          <span className="text-base leading-none">⌘</span>
        </ToolbarIconButton>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="h-8 rounded-full px-4 text-sm"
          onPress={onImportClick}
          size="sm"
          variant="secondary"
        >
          <FileArrowUp className="size-4" />
          Import
        </Button>
        <Button
          className={[
            "h-8 rounded-full px-4 text-sm",
            codePanelOpen ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]" : "",
          ].join(" ")}
          onPress={onCodeToggle}
          size="sm"
        >
          <Code className="size-4" />
          Code
        </Button>
      </div>
    </div>
  );
}

function ToolbarIconButton({
  children,
  disabled = false,
  label,
  onClick,
  shortcut,
  tooltipAlign = "center",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  shortcut?: string;
  tooltipAlign?: "center" | "start";
}) {
  const tooltipPosition =
    tooltipAlign === "start"
      ? "left-0 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0"
      : "left-1/2 -translate-x-1/2 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0";

  return (
    <span className="group relative inline-flex">
      <button
        aria-label={label}
        className={[
          "flex size-8 items-center justify-center rounded-full text-foreground transition",
          disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-[color:var(--default)] active:scale-95",
        ].join(" ")}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
      <span
        className={[
          "pointer-events-none absolute top-full z-50 mt-2 flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-3 py-2 text-sm text-foreground opacity-0 shadow-2xl transition group-hover:opacity-100 group-focus-within:opacity-100",
          tooltipPosition,
        ].join(" ")}
      >
        {label}
        {shortcut ? (
          <span className="rounded-md bg-[#f1f1f3] px-1.5 py-0.5 text-xs text-muted">
            {shortcut}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function CodePanel({ code, onClose }: { code: string; onClose: () => void }) {
  return (
    <div className="absolute right-5 top-16 z-20 w-[360px] rounded-2xl bg-white p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Theme code</h2>
        <button onClick={onClose} type="button">
          <Xmark className="size-4 text-muted" />
        </button>
      </div>
      <pre className="max-h-[360px] overflow-auto rounded-xl bg-[#f4f4f5] p-3 text-xs leading-5">
        {code}
      </pre>
      <Button
        className="mt-3 h-8 w-full rounded-full text-sm"
        onPress={() => void navigator.clipboard.writeText(code)}
        size="sm"
        variant="secondary"
      >
        Copy code
      </Button>
    </div>
  );
}

function PreviewCanvas() {
  return (
    <div className="mx-auto max-w-5xl rounded-[2rem] bg-[color:var(--background)] p-8">
      <div className="mb-10 flex justify-end gap-3">
        <IconButton label="Search" variant="tertiary">
          <Magnifier className="size-5" />
        </IconButton>
        <IconButton label="Notifications" variant="tertiary">
          <Bell className="size-5" />
        </IconButton>
        <Button>
          <PersonPlus className="size-4" />
          Invite
        </Button>
      </div>

      <div className="mb-10 flex justify-end gap-3">
        <IconButton label="Refresh" variant="tertiary">
          <Arrows3RotateLeft className="size-5" />
        </IconButton>
        <Button variant="secondary">
          <Calendar className="size-4" />
          Monthly
          <ChevronDown className="size-4" />
        </Button>
        <Button>Download</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          ["Revenue", 228441, "3.3%"],
          ["Sales", 458, "3.3%"],
          ["Profit", 203133, "4.1%"],
        ].map(([label, value, trend]) => (
          <Card className="rounded-2xl" key={label}>
            <Card.Header>
              <Card.Title className="text-muted text-base">{label}</Card.Title>
            </Card.Header>
            <Card.Content className="flex items-end justify-between gap-3">
              <NumberValue
                className="text-foreground text-3xl font-semibold tabular-nums"
                currency={typeof value === "number" && value > 1000 ? "USD" : undefined}
                maximumFractionDigits={0}
                style={typeof value === "number" && value > 1000 ? "currency" : "decimal"}
                value={Number(value)}
              />
              <TrendChip trend="up">{trend}</TrendChip>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Sales Performance</Card.Title>
            <Button size="sm" variant="secondary">
              Last 2 weeks
              <ChevronDown className="size-4" />
            </Button>
          </Card.Header>
          <Card.Content>
            <BarChart data={[...chartData]} height={180}>
              <BarChart.Grid vertical={false} />
              <BarChart.XAxis dataKey="month" />
              <BarChart.YAxis width={30} />
              <BarChart.Bar dataKey="sales" fill="var(--chart-3)" radius={[24, 24, 24, 24]} />
            </BarChart>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Traffic Source</Card.Title>
            <IconButton label="More options" size="sm" variant="tertiary">
              <EllipsisVertical className="size-4" />
            </IconButton>
          </Card.Header>
          <Card.Content>
            <LineChart data={[...chartData]} height={180}>
              <LineChart.Grid vertical={false} />
              <LineChart.XAxis dataKey="month" />
              <LineChart.YAxis width={30} />
              <LineChart.Line dataKey="organic" dot={false} stroke="var(--chart-2)" strokeWidth={2} />
              <LineChart.Line dataKey="paid" dot={false} stroke="var(--chart-4)" strokeWidth={2} />
            </LineChart>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function ControlGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h2 className="mb-2 px-0 text-xs font-semibold text-muted">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-9 items-center justify-between rounded-xl bg-white px-3">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted">{value}</span>
    </div>
  );
}

function ThemePresetSelect({
  isOpen,
  onOpenChange,
  onSelect,
  selectedPreset,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (preset: ThemePreset) => void;
  selectedPreset: string;
}) {
  const selected = themePresets.find((preset) => preset.value === selectedPreset);

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        className="flex h-9 w-full items-center justify-between rounded-xl bg-white px-3 text-left"
        onClick={() => onOpenChange(!isOpen)}
        type="button"
      >
        <span className="text-xs font-medium">Theme</span>
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
          {selectedPreset}
          {selected ? (
            <span
              aria-hidden="true"
              className="size-5 rounded-full"
              style={{ background: selected.swatch }}
            />
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-11 z-30 rounded-2xl bg-white p-2 shadow-2xl">
          <div className="max-h-[450px] overflow-y-auto py-1">
            {themePresets.map((preset) => {
              const isSelected = preset.value === selectedPreset;

              return (
                <button
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-[#f4f4f5]"
                  key={preset.value}
                  onClick={() => onSelect(preset)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="size-5 shrink-0 rounded-full"
                    style={{ background: preset.swatch }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {preset.label}
                  </span>
                  {isSelected ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ColorRow({
  colorKey,
  label,
  onOpen,
}: {
  colorKey: ThemeColorKey;
  label: string;
  onOpen: (key: ThemeColorKey) => void;
}) {
  const { theme, updateTheme } = useThemeBuilder();
  const color = theme[colorKey];

  return (
    <button
      className="flex h-9 w-full items-center justify-between rounded-xl bg-white px-3 text-left"
      onClick={() => onOpen(colorKey)}
      type="button"
    >
      <span className="text-xs font-medium">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
        {color.toUpperCase()}
        <input
          aria-label={`${label} color`}
          className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
          onChange={(event) => updateTheme({ [colorKey]: event.target.value })}
          onClick={(event) => event.stopPropagation()}
          type="color"
          value={color}
        />
      </span>
    </button>
  );
}

function MeterRow({
  label,
  max,
  min,
  stateKey,
  step,
  values,
}: {
  label: string;
  max: number;
  min: number;
  stateKey: ThemeNumberKey;
  step: number;
  values?: number[];
}) {
  const { theme, updateTheme } = useThemeBuilder();
  const value = theme[stateKey];
  const steppedIndex = values ? getClosestStepIndex(values, value) : -1;
  const steppedValue = values ? values[steppedIndex] : value;
  const percent = ((steppedValue - min) / (max - min)) * 100;
  const boundedPercent = Math.min(100, Math.max(0, percent));

  return (
    <label className="group relative grid h-9 cursor-ew-resize grid-cols-[1fr_5.5rem] overflow-hidden rounded-xl bg-white">
      <span
        className="absolute inset-y-0 left-0 bg-[#e8e8ea] transition-[width] duration-150"
        style={{ width: `${boundedPercent}%` }}
      />
      <span
        className="absolute top-1/2 z-10 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#73737c] opacity-0 transition-[height,opacity,width] group-hover:opacity-100 group-focus-within:h-6 group-focus-within:w-1 group-focus-within:opacity-100 group-active:h-6 group-active:w-1 group-active:opacity-100"
        style={{ left: `${boundedPercent}%` }}
      />
      <span className="relative z-10 flex items-center px-3 text-xs font-medium">
        {label}
      </span>
      <span className="relative z-10 flex items-center justify-end px-3 text-xs text-muted">
        {steppedValue.toFixed(2).replace(".", ",")}
      </span>
      <input
        aria-label={label}
        className="absolute inset-0 z-20 cursor-ew-resize opacity-0"
        max={values ? values.length - 1 : max}
        min={values ? 0 : min}
        onChange={(event) => {
          const nextValue = values
            ? values[Number(event.target.value)]
            : Number(event.target.value);

          updateTheme({ [stateKey]: nextValue });
        }}
        step={values ? 1 : step}
        type="range"
        value={values ? steppedIndex : value}
      />
    </label>
  );
}

function getClosestStepIndex(values: number[], value: number) {
  return values.reduce((closestIndex, option, index) => {
    const currentDistance = Math.abs(option - value);
    const closestDistance = Math.abs(values[closestIndex] - value);

    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);
}

function ColorPopover({
  colorKey,
  onClose,
}: {
  colorKey: ThemeColorKey;
  onClose: () => void;
}) {
  const { theme, updateTheme } = useThemeBuilder();
  const color = theme[colorKey];

  return (
    <div className="absolute right-5 top-16 z-20 w-[248px] rounded-2xl bg-white px-2 py-3 shadow-2xl">
      <div className="mx-auto flex w-[232px] flex-col gap-2.5">
        <div className="flex items-center justify-between pr-1">
          <div className="flex items-center gap-1.5">
            <Palette className="size-3" />
            <span className="text-xs font-medium capitalize">{colorKey}</span>
          </div>
          <button onClick={onClose} type="button">
            <Xmark className="size-4 text-muted" />
          </button>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-1">
            <div className="h-[72px] rounded-lg border bg-[color:var(--accent)]" style={{ backgroundColor: color }} />
            <div className="h-[72px] rounded-lg border bg-[color:var(--accent)]" style={{ backgroundColor: color }} />
          </div>
          <button
            aria-label="Unlink light and dark modes"
            className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-[color:var(--separator)] bg-[color:var(--default)]"
            type="button"
          >
            <Link className="size-3.5" />
          </button>
        </div>
        <div className="flex justify-around text-center text-xs">
          <span className="rounded-xl bg-[#eee] px-2 py-0.5 font-medium">Light</span>
          <span className="px-2 py-0.5 text-muted">Dark</span>
        </div>
        <div className="grid grid-cols-[1fr_4rem] gap-1 pt-2">
          <label className="flex h-9 items-center gap-2 rounded-xl bg-[#e8e8ea] px-3">
            <input
              aria-label={`${colorKey} color`}
              className="h-4 w-4 rounded-full"
              onChange={(event) => updateTheme({ [colorKey]: event.target.value })}
              type="color"
              value={color}
            />
            <span className="truncate text-sm">{color.toUpperCase()}</span>
          </label>
          <div className="flex h-9 items-center justify-center rounded-xl bg-[#e8e8ea] text-sm">
            100%
          </div>
        </div>
        <Button className="h-9 w-full rounded-3xl border border-[color:var(--separator)] bg-white text-sm" variant="secondary">
          <Plus className="size-4" />
          Mix color
        </Button>
      </div>
    </div>
  );
}

function FontPicker({ onClose }: { onClose: () => void }) {
  const { theme, updateTheme } = useThemeBuilder();

  return (
    <div className="absolute right-5 top-28 z-20 w-[520px] max-w-[calc(100%-2.5rem)] rounded-[1.75rem] bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Suggested</h2>
        <button onClick={onClose} type="button">
          <Xmark className="size-5 text-muted" />
        </button>
      </div>
      <div className="grid max-h-[30rem] grid-cols-3 gap-3 overflow-auto pr-1">
        {fonts.map((font) => {
          const selected = theme.fontFamily === font;

          return (
            <button
              className={[
                "flex h-[108px] min-w-0 flex-col items-center justify-center rounded-2xl border bg-white px-2 text-center transition hover:border-[#b8b8c0]",
                selected ? "border-[#73737c] shadow-sm" : "border-[#e5e5e8]",
              ].join(" ")}
              key={font}
              onClick={() => {
                updateTheme({ fontFamily: font });
                onClose();
              }}
              type="button"
            >
              <span
                className="text-3xl font-semibold text-foreground"
                style={{ fontFamily: fontStacks[font] ?? fontStacks.Inter }}
              >
                Ag
              </span>
              <span className="mt-2 max-w-full truncate text-sm text-muted">{font}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
