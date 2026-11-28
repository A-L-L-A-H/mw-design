# Changelog

All notable changes to `mw-design` (`@moonwitness/ui`, `@moonwitness/assets`, `@moonwitness/design-tokens`, and `ui-catalog`) are documented in this file.

## 1.0.0-rc.1 (v1.0.0 Release Candidate)

### Character & PNG Asset Packs (`@moonwitness/assets`)
- Shipped high-contrast Kuro Signal PNG masters, expression portraits, and sprite-sheet animation clips (`kuro-signal-*`).
- Added the RockSoul cast (`rocksoul-black-resolve`, `rocksoul-green-mercy`, `rocksoul-resonance-overdrive`) in cel and sketch variants plus Extended Lore cast assets and canon metadata.
- Added street zine stickers (`illustrations/stickers-pack/`), 24 feathered UI state vignette cutouts in PNG + WebP (`illustrations/ui-state-pack/`), and 16 telemetry PNG badges (`illustrations/telemetry-pack/`, `ink` and `rough-pencil` variants).
- Added generated PNG proof contact sheets (`brand/rendered/contact-sheet-*.png`) and manifest/license provenance validation.

### UI Components & Visual Universe (`@moonwitness/ui`)
- Added sprite-sheet atlas playback (`SpriteSheetAtlas`) to `SpritePlayer` and reduced-motion profile support to `LayeredScene`.
- Added `RiotSticker`, `SketchAnnotation`, `CharacterBadge`, and lore character registry exports (`CHARACTER_REGISTRY`, `MOONWITNESS_XII_CAST_IDS`, `ROCKSOUL_LORE_ROSTER`, `EXTENDED_LORE_CAST_IDS`, and canon guards) with dedicated scoped CSS in `@moonwitness/ui/styles/visual-universe.css`.
- Deduplicated `SpeechBubble` (canonical `speech-bubble.tsx`, deprecated `EffectsSpeechBubble` wrapper) and marked overlapping `MangaPanel`/`InkFrame` exports deprecated without breaking existing import paths.
- Ported shared console primitives (`MonoBadge`, `ComicSticker`, `StatTile`, `StageHeroBanner`, `SectionCard`, `CopyableSnippet`, `ToastStack`) under `@moonwitness/ui/components/xv-primitives` and `@moonwitness/ui/styles/xv-primitives.css`.

### Single-Source Tokens & Centralization (`@moonwitness/design-tokens`, `ui-catalog`)
- Consolidated `ui-catalog` token export onto `CORE_DESIGN_TOKENS` from `@moonwitness/ui/token-exporter`.
- Exported typed RIOT light/dark palettes and `RIOT_TAILWIND_THEME_PRESET` via `@moonwitness/design-tokens/riot-palette`.
- Built Character Universe Studio in `apps/ui-catalog` with live atlas playback, registry badges, stickers, and sketch annotations.
- Established `mw-design` as the sole UI, asset, and design-token owner across the MoonWitness workspace (`workspace.json` `uiOwner: "mw-design"` and `scripts/drift.py` enforcement).
