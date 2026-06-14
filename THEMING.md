# Theming Implementation

This project implements theming in two layers:

1. App-level theme switching with `next-themes`.
2. A custom HeroUI-style theme builder that writes design tokens as CSS variables.

The implementation follows HeroUI's theming direction: themes are driven from root-level attributes and CSS variables, so components consume tokens instead of hardcoded values.

## App-Level Theme Switching

The app-level provider lives in `src/app/app-theme-provider.tsx`.

We use `next-themes` to control the root `data-theme` attribute:

```tsx
<ThemeProvider
  attribute="data-theme"
  defaultTheme="light"
  disableTransitionOnChange
  enableColorScheme={false}
  enableSystem={false}
  storageKey="admin-panel-theme-v2"
  themes={appThemes}
>
```

The supported app themes are:

```ts
["light", "dark", "glass-light", "glass-dark", "mouve-light", "mouve-dark"]
```

This means the active theme is applied like this:

```html
<html data-theme="light">
<html data-theme="dark">
<html data-theme="glass-light">
<html data-theme="mouve-dark">
```

HeroUI and HeroUI Pro styles can then react to that attribute.

We keep a small local wrapper around `next-themes` so the rest of the app imports from one stable place:

```ts
import { useTheme } from "@/app/app-theme-provider";
```

That wrapper validates theme names before calling `next-themes`' `setTheme`.

## Why `enableColorScheme` Is Disabled

`next-themes` knows how to infer browser `color-scheme` for plain `light` and `dark` themes, but our app also has custom theme names like `glass-dark` and `mouve-dark`.

Because of that, we disable the built-in color scheme behavior:

```tsx
enableColorScheme={false}
```

Then we set it ourselves:

```ts
document.documentElement.style.colorScheme = activeTheme.includes("dark")
  ? "dark"
  : "light";
```

This keeps browser-native UI, form controls, and dark-mode behavior aligned with custom theme names.

## HeroUI And HeroUI Pro CSS

Global HeroUI styles are imported in `src/app/globals.css`:

```css
@import "tailwindcss";
@import "@heroui/styles";
@import "@heroui-pro/react/css";
@import "@heroui-pro/react/themes/glass";
@import "@heroui-pro/react/themes/mouve";
```

The base HeroUI and HeroUI Pro CSS provides the default design tokens and component styling.

The `glass` and `mouve` theme CSS files are imported because those are real HeroUI Pro themes we want to support at runtime.

## Theme Builder Provider

The custom theme builder state lives in `src/features/theme-builder/theme-store.tsx`.

The builder stores editable design values in this shape:

```ts
type ThemeBuilderState = {
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
```

These are not separate CSS files. They are live runtime tokens.

When a user changes a color, slider, preset, or font, the builder updates this state. A `useEffect` then applies the values to `document.documentElement` as CSS variables.

## Runtime CSS Variables

The builder writes variables such as:

```ts
root.style.setProperty("--accent", theme.accent);
root.style.setProperty("--success", theme.success);
root.style.setProperty("--warning", theme.warning);
root.style.setProperty("--danger", theme.danger);
root.style.setProperty("--focus", theme.accent);
root.style.setProperty("--radius", `${theme.generalRadius}rem`);
root.style.setProperty("--field-radius", `${theme.formsRadius}rem`);
root.style.setProperty("--spacing", `${0.25 * theme.spacing}rem`);
root.style.setProperty("--app-font-family", fontStacks[theme.fontFamily]);
root.style.setProperty("--app-line-height", `${theme.lineHeight + 0.35}`);
root.style.setProperty("--app-letter-spacing", `${theme.letterSpacing}em`);
root.style.setProperty("font-size", `${16 * theme.fontSize}px`);
```

This allows the dashboard and theme builder preview to update immediately without rebuilding CSS.

## Tailwind Token Mapping

In `src/app/globals.css`, Tailwind tokens are mapped to our CSS variables:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--app-font-family, Inter, ui-sans-serif, system-ui, sans-serif);
  --text-xs--line-height: var(--app-line-height, 1.35);
  --text-sm--line-height: var(--app-line-height, 1.35);
  --text-base--line-height: var(--app-line-height, 1.35);
}
```

The body also consumes the typography tokens:

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--app-font-family, Inter, ui-sans-serif, system-ui, sans-serif);
  letter-spacing: var(--app-letter-spacing, 0);
  line-height: var(--app-line-height, 1.35);
}
```

This means normal Tailwind classes and HeroUI-style variables both respond to the builder.

## Structural Themes Versus Builder Tokens

There is an important distinction:

- `next-themes` controls the structural app theme through `data-theme`.
- The builder controls editable design tokens like accent color, radius, spacing, and typography.

For light custom themes, the builder also generates soft background and surface colors from the accent/base values:

```ts
root.style.setProperty(
  "--background",
  `color-mix(in oklab, white ${100 - backgroundTint}%, ${theme.accent})`,
);
```

For imported or dark structural themes, we intentionally do not override those structural variables:

```ts
const usesImportedStructuralTheme =
  resolvedTheme.includes("dark") ||
  resolvedTheme.startsWith("glass-") ||
  resolvedTheme.startsWith("mouve-");
```

When this is true, we clear our structural overrides and let HeroUI Pro's theme CSS handle contrast:

```ts
root.style.removeProperty("--background");
root.style.removeProperty("--surface");
root.style.removeProperty("--surface-secondary");
root.style.removeProperty("--surface-shadow");
root.style.removeProperty("--accent-foreground");
```

This avoids the common bug where a light custom background or foreground token makes dark theme text unreadable.

## Presets

Theme presets are defined in `src/features/theme-builder/theme-builder-page.tsx`.

Examples include:

- Default
- Sky
- Lavender
- Mint
- Netflix
- Uber
- Spotify
- Coinbase
- Airbnb
- Discord
- Rabbit
- Brutalism
- Mouve
- Glass

Each preset can update two things:

1. The app-level theme through `next-themes`.
2. The builder tokens.

For example, a preset can switch the app theme to `mouve-light` and also set accent, radius, font, spacing, and other builder values.

## Typography

Fonts are loaded with `next/font/google` in `src/app/layout.tsx`.

Each font is registered as a CSS variable, for example:

```ts
const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});
```

The builder maps font names to those variables:

```ts
export const fontStacks = {
  Inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  Fraunces: "var(--font-fraunces), Georgia, serif",
  Anton: "var(--font-anton), Impact, sans-serif",
};
```

When the user selects a font, we update:

```ts
--app-font-family
```

Because `--font-sans` and `body` use that variable, the selected font applies across the UI.

## Sliders And Steps

The theme builder uses real range inputs styled to look like the HeroUI builder controls.

Some sliders use fixed step arrays:

```ts
const baseSteps = [0, 0.3, 0.5, 0.8, 1, 1.3, 1.5];
const radiusSteps = [0, 0.1, 0.25, 0.5, 0.75, 1];
```

Other sliders use numeric min/max/step values:

- Line height: `0.8` to `1.5`, step `0.1`
- Letter spacing: `-0.05` to `0.1`, step `0.01`
- Spacing: `0.6` to `1.4`, step `0.1`
- Font size: `0.6` to `1.4`, step `0.1`

The input covers the full slider row, so dragging works from any point on the control.

## Vibrant Palette

The vibrant palette switch sets a root data attribute:

```ts
root.setAttribute("data-vibrant-palette", "true");
```

When disabled, the attribute is removed.

This follows the same idea as HeroUI's token-driven styling: a root-level switch changes how soft semantic colors are rendered. In our UI, this affects elements like the sidebar "New" chip by making soft foreground colors more saturated.

## Persistence

There are two localStorage keys:

```ts
admin-panel-theme-v2
admin-panel-custom-theme-style
```

`admin-panel-theme-v2` is owned by `next-themes` and stores the active app theme.

`admin-panel-custom-theme-style` stores the builder token values.

This separation is intentional:

- Switching from `light` to `glass-light` is app theme state.
- Changing accent color or radius is builder state.

## Undo And Redo

Theme builder history is implemented with a reducer in `theme-store.tsx`.

The reducer keeps:

```ts
past: ThemeBuilderState[];
theme: ThemeBuilderState;
future: ThemeBuilderState[];
```

Undo moves the current theme into `future` and restores the last item from `past`.

Redo moves the current theme into `past` and restores the first item from `future`.

Normal updates clear the redo stack.

The reducer also ignores no-op updates:

```ts
if (!hasThemeChanges(state.theme, action.patch)) return state;
```

That prevents repeated identical input events from creating infinite update loops or unnecessary history entries.

## Import And Export

The Code button shows the current builder state as JSON.

The Import button accepts a JSON file and applies it back into the builder state.

This makes the current theme portable even before we add a backend persistence layer.

## What We Followed

We followed HeroUI's theming model in these ways:

- Root-level theme selection through `data-theme`.
- CSS variables as the source of design tokens.
- Components consuming tokens instead of hardcoded values.
- Imported HeroUI Pro theme CSS for official themes like `glass` and `mouve`.
- Runtime token overrides for custom builder values.

The HeroUI Pro `template-dashboard` itself does not use `next-themes`; it only imports HeroUI styles and renders a static dashboard. Our project needed actual runtime theme switching and theme creation, so we added `next-themes` plus a custom builder layer.

## Summary

The final architecture is:

```txt
next-themes
  -> controls html[data-theme]
  -> persists selected app theme

HeroUI / HeroUI Pro CSS
  -> provides default component tokens and official theme CSS

ThemeBuilderProvider
  -> stores custom theme tokens
  -> applies CSS variables to documentElement
  -> persists custom builder state
  -> supports undo, redo, reset, import, export, presets, and randomize

globals.css
  -> maps CSS variables into Tailwind and body styles
```

This gives us HeroUI-compatible theme switching plus a custom runtime theme builder tailored to the admin panel.
