# MoonWitness Design System (`mw-design`)

Standalone monorepo for the MoonWitness Design System:

- `packages/ui` (`@moonwitness/ui`): Design tokens, typed icons, accessible React primitives, and theme registry.
- `packages/assets` (`@moonwitness/assets`): Framework-independent brand assets, fonts, icons, illustrations, materials, sounds, and scenes.
- `apps/ui-catalog` (`@moonwitness/ui-catalog`): Interactive static UI catalog and asset diagnostics app.

## Quickstart

```bash
bun install
bun run build
bun run catalog:build
```

## Docker

```bash
docker build -t mw-design .
docker run -p 8080:8080 mw-design
```

Serves `apps/ui-catalog` at `/` and `packages/assets` static CDN at `/assets/`.
