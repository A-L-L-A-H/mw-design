# mw-design — Design system packages and static catalog for MoonWitness interfaces.

**Repository:** [`A-L-L-A-H/mw-design`](https://github.com/A-L-L-A-H/mw-design) · **Stack:** TypeScript · Bun · React

## What it does

Contains @moonwitness/ui, @moonwitness/assets, and the static ui-catalog application.

## Quick start

```bash
bun install
bun run build
bun run catalog:build
```

## Verify

```bash
bun run test
bun run typecheck
```

## Configuration

- **Port:** 8080
- **Key configuration:** UI catalog container

```bash
docker build -t mw-design .
docker run -p 8080:8080 mw-design
```

## Notes

The catalog is served at / and brand assets at /assets/.
