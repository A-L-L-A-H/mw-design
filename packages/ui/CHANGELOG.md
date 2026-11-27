# Changelog

All notable changes to `@moonwitness/ui` are documented in this file.

## 1.0.0-rc.1

### Security & SSR
- Added `sanitizeUrl()` helper (`@moonwitness/ui` and `@moonwitness/ui/lib/sanitize-url`) blocking unsafe URL schemes (`javascript:`, `data:`, `vbscript:`, control characters, and protocol-relative URLs) in `Breadcrumbs` and `UpdateBanner`.
- Added SSR document guard in `ToastHost` so server rendering never throws when `document` is undefined.
- Synchronized `ThemeProvider` and `createSkinInitScript()` around `DEFAULT_THEME_STORAGE_KEY` (`'mw-ui-theme'`), supporting `light`, `dark`, and `high-contrast` modes, `data-theme`, `data-skin`, `data-density`, `.dark`, `.high-contrast`, and legacy key fallback.

### Standalone CSS & React Compatibility
- Migrated all remaining Tailwind-dependent overlays and controls (`Dialog`, `Sheet`, `Popover`, `Tooltip`, `Select`, `DropdownMenu`, `Command`, `Label`, `MetricTile`, `ModePicker`, `LogConsole`, `UpdateBanner`, `SoundToggle`) to pure scoped `.mw-ui-*` rules in `@moonwitness/ui/components.css`. Consumers no longer need Tailwind CSS to render any component.
- Added `'use client'` directives across all interactive and Radix-backed components for seamless React Server Components (Next.js App Router) adoption.
- Added `forwardRef` and `displayName` support across migrated controls and overlays.
- Expanded root barrel (`@moonwitness/ui`) to export all core primitives, overlays, form controls, theme utilities, and `sanitizeUrl`, while keeping optional peer-dependency modules (`Command` / `cmdk` and `ToastHost` / `sonner`) isolated to dedicated subpaths.
