# MoonWitness Production Blueprint — Centralized W3C DTCG Token Engine & Anti-Mainstream Neo-Manga FX Suite

Transform MoonWitness into a production-ready, anti-mainstream visual system by centralizing every color, typographic, motion, FX, shader, and Genre DNA parameter inside a dedicated W3C DTCG design-token package (`@moonwitness/design-token`) and powering five research-backed anime/game interaction engines across the UI library and interactive catalog.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All four core architectural decisions were confirmed during Phase 1 alignment. Review the consolidated scope and phased rollout below before approving execution.

- **Confirmed Decision 1 — Full SSOT Design-Token Package**: A dedicated workspace package (`@moonwitness/design-token`) becomes the single source of truth using W3C DTCG JSON (`$value`, `$type`, `$description`) across all six domains: Color, Typography, Spacing/Shape, Motion/Physics, FX/Rumble/Impact, SVG Shaders, and Genre DNA. Existing `@moonwitness/ui` token exports will re-export from this centralized package to maintain 100% backward compatibility with zero breaking changes.
- **Confirmed Decision 2 — Full 5-Pillar Anti-Mainstream Feature Set**: All five research-driven capabilities are included in full production scope:
  1. Inline SVG Procedural Shader Filters (`ink-bleed`, `chromatic-rgb`, `halftone-dither`, `heat-haze`, `xerox-grain`)
  2. Sakuga Smear & Stepped Framerate Motion (`on-ones 24fps`, `on-twos 12fps`, `on-threes 8fps` + velocity-coupled directional smear)
  3. Tactile Click-FX & Reticle Lock-On (*Blue Archive* / *Persona*-inspired click shockwaves + snapping corner brackets)
  4. Inertial Spring Tilt & Velocity Cursor Trail (pointer-momentum card tilt + cel-ink cursor ribbon)
  5. Live W3C DTCG Token Studio & Diff Exporter (real-time override editor, baseline diff inspector, multi-format export)
- **Confirmed Decision 3 — Signature Visual DNA**: **Neo-Manga Riot + Tactical Anime HUD** — sharp high-contrast ink boundaries, angular corner reticles, halftone print texture, crisp tabular telemetry, and bold accent discipline rather than generic soft SaaS templates.
- **Confirmed Decision 4 — End-to-End Phased Rollout**: Execute sequentially in three verified stages: **Phase A (Centralized Token SSOT)** → **Phase B (Anti-Mainstream Shader, Sakuga & Tactile Physics Engine)** → **Phase C (Production Catalog Studio & Full QA Verification)**.

> [!NOTE]
> **Recommended Default for Tactile Click-FX & Cursor Trail Scope**: Both effects default to **opt-in / scoped to the interactive stage** on initial load with a single toolbar toggle to enable **Full-Catalog Live Mode**, preventing unwanted pointer interference while browsing forms or reading documentation, and automatically disabling under `prefers-reduced-motion` or coarse touch pointers.

---

## 1. Overview & Core Concept

### What It Does
Most UI libraries look identical because they copy soft corporate SaaS conventions and scatter hardcoded CSS values across components. This upgrade establishes an unmistakable, production-grade **Neo-Manga Riot + Tactical Anime HUD** platform grounded in real computer-graphics research and trending open-source token standards:

- **Centralized W3C DTCG Token Authority (`@moonwitness/design-token`)**: Every design decision—from WCAG-verified surface pairs and brush/condensed/mono font scales to spring stiffness, 24fps impact-frame cadences, Rumble & Shake curves, and SVG turbulence frequencies—lives in one versioned W3C DTCG schema that compiles deterministically into CSS Custom Properties, Tailwind v4 `@theme` presets, typed TypeScript token maps, and W3C JSON bundles.
- **Paper-Backed & Anti-Mainstream Visual Engines (Tiru → Modifikasi → Beda)**:
  - Inspired by **SIGGRAPH *SMEAR: Stylized Motion Exaggeration*** and *Spider-Verse* animation timing: an art-directable **Sakuga Engine** that shifts UI and character motion between smooth 60fps, anime 24fps (`on-ones`), punchy 12fps (`on-twos`), and comic 8fps (`on-threes`) with directional velocity smear trails.
  - Inspired by **zero-WebGL analog decay shaders**: reusable **Inline SVG Procedural Filter Shaders** (`feTurbulence`, `feDisplacementMap`, `feColorMatrix`) producing real-time risograph ink bleed, chromatic RGB lens splits, manga halftone dithering, heat distortion, and xerox grain at 60fps on CPU without heavy GPU contexts.
  - Inspired by ***Blue Archive* (`ba-click-fx`) & *Persona / Guilty Gear Strive* HUD ergonomics**: a **Tactile Feedback Layer** delivering radial click-burst rings at pointer coordinates, mechanical corner-bracket **Reticle Lock-On** tracking focused or hovered targets, **Inertial Spring Tilt** reacting to pointer velocity, and a decaying cel-ink **Velocity Cursor Trail**.
- **Production Catalog Workbench**: Upgrades the catalog with a **Live W3C DTCG Token Studio** (edit any token live, inspect exact diffs vs. baseline, export W3C JSON / CSS / Tailwind v4 / TS) and unifies the **FX Lab** with Shader Controls, Sakuga Cadence, Rumble & Shake Presets, and Tactile Micro-Interaction previews.

### Target Audience / Persona
Frontend engineers, indie game UI developers, interactive web studios, and design-system architects building expressive web apps, game HUDs, anime/manga storytelling interfaces, and kinetic brand experiences who want **zero-bloat production engineering** (strict accessibility, bundle budgets, and standardized tokens) without sacrificing raw visual personality.

### Key Value
Eliminates token drift across packages, replaces generic templates with tactile, living anime/game craft, and gives teams a live visual token editor + copyable JSX/token exports ready for real production apps.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Centralized Token Live Editing & Diff Export (Token Studio)**:
   - User opens the **W3C DTCG Token Studio** section in the catalog.
   - Browses tokens across 6 domain tabs (`Color`, `Typography`, `Spacing & Shape`, `Motion & Physics`, `FX & Rumble`, `Shaders & DNA`) with instant search filtering.
   - Tweaks a token (e.g., primary accent, ink frame thickness, spring stiffness, stepped FPS, chromatic offset, or halftone scale) → sees the live preview stage and active catalog surfaces update immediately.
   - Switches to the **Diff View** to inspect only modified tokens against the centralized baseline, resets single tokens or all overrides, and exports production-ready **W3C DTCG JSON**, **CSS Variables**, **Tailwind v4 `@theme`**, or **TypeScript** with one click.

2. **Anti-Mainstream FX & Shader Direction (Upgraded FX Lab)**:
   - User enters the **FX Lab** camera preview featuring a selectable character from the 30-character registry.
   - Triggers **Rumble & Shake Presets** directly from the in-preview camera dock (`Jab`, `Whiplash`, `Slam`, `Charge`, `Roar`, `Rumble`) or the categorized 8-preset waveform library with optional continuous sustained rumble.
   - Layers **Inline SVG Shaders** (`Ink Bleed`, `Chromatic RGB`, `Halftone Dither`, `Heat Haze`, `Xerox Grain`) with live intensity/scale sliders directly onto the camera stage or UI cards.
   - Switches **Sakuga Cadence** (`Smooth 60fps`, `On-Ones 24fps`, `On-Twos 12fps`, `On-Threes 8fps`) and triggers directional **Velocity Smear** sweeps + `0.25x` slow-motion frame study.
   - Copies the exact synchronized JSX + token reference snippet for immediate drop-in use.

3. **Tactile Click-FX, Reticle Lock-On & Inertial Physics Playground**:
   - User interacts with the **Tactile Arena** (or toggles Full-Catalog Live Mode): clicking anywhere emits a crisp cel-ink shockwave & spark ring; hovering or keyboard-focusing target cards snaps an animated 4-corner **Tactical Reticle** onto the active bounds; moving across cards drives damped **Inertial Spring Tilt** and optional **Velocity Cursor Trail**.
   - Enabling **Reduced Motion** cleanly collapses transforms, trails, shaders, and shakes to high-contrast static states while preserving full functional clarity.

### Visual Identity & Theme
- **Aesthetic Direction**: **Neo-Manga Riot + Tactical Anime HUD** — unapologetic 2px–3px solid ink frames, asymmetric angular brackets, risograph halftone texture layers, hard offset ink shadows, and zero soft generic glassmorphism or pill-badge clutter.
- **Color Palette & Mood (60-30-10 Token Discipline)**:
  - *60% Dominant Neutral Canvas*: Paper Cream / Deep Obsidian Ink via `--mw-background` & `--mw-surface` across Light, Dark, and High-Contrast modes.
  - *30% Structural Surfaces*: Elevated panels, hairline dividers, and halftone grids via `--mw-surface-elevated`, `--mw-border`, and `--mw-border-strong`.
  - *10% High-Intent Signal Accents*: Concentrated at primary triggers, active reticles, and peak FX states via `--mw-primary`, `--mw-magenta`, `--mw-cyan`, and `--mw-yellow` — always paired with WCAG AA verified foreground tokens and explicit text/icon cues (never color-only state signaling).
- **Typography & Hierarchy**:
  - Preserves MoonWitness's characterful display stack (`MoonWitness Grunge` / condensed display for punchy headers), geometric sans body copy (`15px–16px`, `1.5` line-height), and strict `JetBrains Mono` with `font-variant-numeric: tabular-nums` on every token value, camera coordinate (`X / Y / ROT`), shader frequency, and frame-rate readout.
- **Component Styling & Spatial Math**:
  - Single-elevation flat architectural surfaces separated by whitespace and crisp token borders (no nested card-within-card bloat, no thick left accent stripes, no static pill enclosures around metadata—unboxed typographic separators `·` everywhere).
  - Desktop baseline at `1440px` with full-bleed responsive grids that cleanly collapse down to `390px` mobile without horizontal scroll and maintain `>= 44px` touch targets.

### Interactive Feedback & Motion
- **Routine micro-feedback** settles in `<= 200ms` via compositor-only `transform` and `opacity` (zero layout-thrashing animations).
- **Sakuga stepped motion** and **in-stage camera shakes** run inside bounded, self-terminating `requestAnimationFrame` loops that idle at 0% CPU when no FX is active.
- **Complete State Coverage**: Every interactive studio panel includes populated defaults, filtered empty states with one-click reset, active/modified diff states, keyboard focus rings (`focus-visible`), and strict `prefers-reduced-motion` fallbacks.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Dedicated `@moonwitness/design-token` Workspace Package (W3C DTCG SSOT)**
  - *Chosen Approach*: Extract and unify all 6 token domains into a standalone workspace package emitting W3C DTCG JSON, CSS Custom Properties, Tailwind v4 `@theme`, and typed TS constants; wire `@moonwitness/ui` and `apps/ui-catalog` to consume it as their single authority while preserving legacy `@moonwitness/ui` export paths.
  - *Why*: Guarantees zero drift between CSS variables, JS physics/shader parameters, Rumble & Shake presets, and catalog exporters—and allows external apps or Figma pipelines to consume tokens independently of React components.
  - *Alternatives Considered*: Keeping tokens inside `@moonwitness/ui` was rejected because it couples design language updates to UI component releases and leaves FX/shader parameters scattered in app code.

- **Decision 2 — Inline SVG Procedural Shaders vs. WebGL Fragment Shaders**
  - *Chosen Approach*: Implement `ink-bleed`, `chromatic-rgb`, `halftone-dither`, `heat-haze`, and `xerox-grain` via parameterized inline SVG `<filter>` primitives driven by centralized shader tokens.
  - *Why*: Works directly on live, accessible, selectable HTML/React DOM elements (buttons, cards, typography, character rigs), requires zero WebGL context overhead or SwiftShader CPU stalls, and stays well within strict gzip bundle budgets.
  - *Alternatives Considered*: Full WebGL/Three.js post-processing was rejected because it cannot wrap arbitrary HTML/Radix UI primitives without rasterization hacks and degrades performance on software-rendered devices.

- **Decision 3 — Scoped-by-Default Tactile Click-FX & Cursor Trail with Global Opt-In**
  - *Chosen Approach*: Render `TactileFxProvider` so click bursts, reticle lock-on, and cursor trails work immediately inside interactive studio arenas and offer a clean toggle to extend across the entire catalog, with automatic suspension for `prefers-reduced-motion` and touch-only devices.
  - *Why*: Maximizes "living anime/game" tactility while preserving frictionless accessibility and reading comfort for users inspecting dense documentation tables.
  - *Alternatives Considered*: Forced always-on global cursor trails were rejected because they can distract keyboard/accessibility users and conflict with WCAG motion safety.

- **Decision 4 — Deterministic Pure Physics & Shader Engines**
  - *Chosen Approach*: Isolate all spring tilt integration, stepped-framerate quantization, velocity smear vectors, Rumble & Shake waveforms, particle burst physics, and W3C DTCG token diffing into pure TypeScript modules tested with `node:test` and Vitest.
  - *Why*: Prevents flaky animation regressions, guarantees reproducible diffs and bundle outputs, and keeps React components lean and purely declarative.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                  @moonwitness/design-token (W3C DTCG SSOT)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐  │
│  │ Color, Type, │ │ Motion &     │ │ FX, Rumble &  │ │ SVG Shaders &    │  │
│  │ Space, Shape │ │ Sakuga FPS   │ │ Impact Frames │ │ Genre DNA Presets│  │
│  └──────┬───────┘ └──────┬───────┘ └───────┬───────┘ └────────┬─────────┘  │
│         └────────────────┴────────┬────────┴──────────────────┘            │
│                                   ▼                                        │
│                     Deterministic Token Compiler                           │
│     [tokens.w3c.json] · [tokens.css] · [tailwind.css] · [typed JS/TS]      │
└───────────────────┬───────────────────────────────────┬────────────────────┘
                    │                                   │
                    ▼                                   ▼
┌────────────────────────────────────────┐  ┌────────────────────────────────┐
│       @moonwitness/ui (Runtime)        │  │  apps/ui-catalog (Workbench)   │
│  ┌──────────────────────────────────┐  │  │  ┌──────────────────────────┐  │
│  │ ShaderDefs & ShaderSurface       │  │  │  │ Live W3C DTCG Token      │  │
│  │ (Ink Bleed, RGB, Halftone, Haze) │  │  │  │ Studio + Baseline Diff   │  │
│  ├──────────────────────────────────┤  │  │  │ + Multi-Format Exporter  │  │
│  │ SakugaMotion & VelocitySmear     │  │  │  ├──────────────────────────┤  │
│  │ (60 / 24 / 12 / 8 fps stepped)   │  │  │  │ Upgraded Anime FX Lab    │  │
│  ├──────────────────────────────────┤  │  │  │ · Camera Preview + Dock  │  │
│  │ TactileFxLayer                   │  │  │  │ · Rumble & Shake Library │  │
│  │ · ClickBurst (Blue Archive FX)   │  │  │  │ · SVG Shaders + Sakuga   │  │
│  │ · ReticleLockOn (HUD Brackets)   │  │  │  │ · Flash & Particle Burst │  │
│  │ · InertialTiltCard & CursorTrail │  │  │  ├──────────────────────────┤  │
│  └──────────────────────────────────┘  │  │  │ Tactile Arena + Global   │  │
│  + Legacy Token Exports (100% Compat)  │  │  │ Mode Toggle + Copy JSX   │  │
└────────────────────────────────────────┘  └────────────────────────────────┘
```

### Data Model & State

- **W3C DTCG Token Tree (`DesignTokenTree`)**: Hierarchical token groups adhering to `$value`, `$type`, and `$description`, normalized into flat lookup records (`tokenPath → { cssVar, domain, type, baselineValue, description }`) for O(1) resolution and live diffing.
- **Live Override Store (`TokenStudioState`)**: Client-side map of `Record<tokenPath, string>` applied dynamically to `:root` (or scoped preview container) CSS custom properties, paired with pure `computeTokenDiff(baseline, overrides)` returning exact changed entries and formatted export bundles.
- **Shader & Sakuga Runtime State**:
  - Active shader preset (`none | ink-bleed | chromatic-rgb | halftone-dither | heat-haze | xerox-grain`), normalized intensity (`0..1`), and turbulence scale bound to SVG filter primitives via unique instance IDs (safe for multiple instances on one page).
  - Active Sakuga cadence (`60 | 24 | 12 | 8` fps) quantizing animation progress via deterministic step functions and driving directional smear stretch vectors from instantaneous velocity.
- **Tactile & Camera FX Runtime State**:
  - Camera shake state machine (`active`, `presetId`, `pattern`, `intensityPx`, `durationMs`, `frequency`, `continuous`, `hitstopMs`) + bounded radial particle pool (`<= 72` particles) + click burst pool (`<= 6` concurrent rings) + pointer-tracked reticle target rect (`x, y, width, height, locked`) + spring-damped card tilt state (`rx, ry, velocity`).

### Interactive Component & State Mapping

| Interactive Control / Flow | State Mutation | Rendered Visual & Accessibility Outcome |
| :--- | :--- | :--- |
| **Token Studio domain tab & search** | Updates `activeDomain` & `query`, filters flat DTCG token registry | Renders matching token rows with live color/metric preview or clear empty state with reset action |
| **Token value input / reset** | Mutates `overrides[tokenPath]`, syncs CSS var, recalculates `diffEntries` | Live preview updates immediately; diff count increments; single-token & Reset All restore exact baseline |
| **Token export selector & copy/download** | Formats `baseline + overrides` into W3C JSON, CSS, Tailwind v4, or TS | Displays formatted code block with clipboard copy confirmation and downloadable file trigger |
| **In-preview Camera Shake Dock & Rumble Library** | Loads preset physics (`pattern`, `intensityPx`, `durationMs`, `frequency`, `hitstopMs`) and starts RAF camera loop (or continuous loop) | Camera preview displaces on X/Y/ROT with live tabular HUD readout; `Stop Rumble` halts sustained loops immediately |
| **SVG Shader preset & intensity controls** | Updates active `<filter>` primitive attributes (`baseFrequency`, `scale`, RGB channel offset) | Applies live ink-bleed, chromatic aberration, halftone, heat-haze, or xerox texture directly over stage/cards without WebGL lag |
| **Sakuga Framerate & Velocity Smear controls** | Sets target cadence (`60 / 24 / 12 / 8` fps) and triggers directional motion sweep | Quantizes frame updates visibly into authentic anime `on-twos` / `on-threes` cadence with directional smear echo |
| **Tactile Arena / Global Mode toggles** | Activates `ClickBurst`, `ReticleLockOn`, `InertialTiltCard`, and `CursorTrail` listeners | Clicks spawn radial bursts; hover/focus snaps corner HUD brackets; pointer velocity tilts cards; all gracefully bypass under `reducedMotion` |

### Verification & Production Readiness Gates
1. **Unit & Parity Tests**: Deterministic `node:test` suites covering W3C DTCG schema validity, CSS/Tailwind/TS compiler output parity, token diff math, Rumble & Shake + particle physics, Sakuga step quantization, and spring tilt math.
2. **Integration & Repo Hygiene**: Full `@moonwitness/ui` tests, `ui-catalog` Vitest integration tests, `npm run lint` (zero Tailwind leakage, `'use client'`, URL sanitization, token hygiene, export parity), and `npm run verify:pack` bundle budget enforcement.
3. **Browser Visual & Motion Critique**: Real Chromium verification via `playwright-cli` inspecting desktop (`1440×900`) and mobile (`390×844`) across Light & Dark themes, active shader/rumble/tactile states, short motion capture, and zero console errors.
