#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const uiRoot = join(root, 'packages/ui');
const uiPkg = JSON.parse(readFileSync(join(uiRoot, 'package.json'), 'utf8'));

const errors = [];

// 1. Verify every concrete export target in packages/ui/package.json exists on disk
for (const [subpath, target] of Object.entries(uiPkg.exports ?? {})) {
  if (subpath.includes('*')) continue;
  const files = typeof target === 'string' ? [target] : Object.values(target);
  for (const rel of files) {
    if (typeof rel !== 'string' || rel.includes('*')) continue;
    const abs = join(uiRoot, rel);
    if (!existsSync(abs)) {
      errors.push(`Missing export target for "${subpath}": ${rel}`);
    }
  }
}

// 2. Enforce gzipped bundle-size budgets per core & domain entry point
const BUDGETS_KB = [
  { file: 'dist/index.js', maxGzipKb: 16 },
  { file: 'dist/motion/physics.js', maxGzipKb: 6 },
  { file: 'dist/motion/index.js', maxGzipKb: 14 },
  { file: 'dist/game/index.js', maxGzipKb: 16 },
  { file: 'dist/cartoon/index.js', maxGzipKb: 14 },
  { file: 'dist/templates/index.js', maxGzipKb: 18 },
  { file: 'src/styles/components.css', maxGzipKb: 38 },
  { file: 'dist/tokens.w3c.json', maxGzipKb: 8 },
  { file: 'dist/tailwind-preset.css', maxGzipKb: 4 },
];

const report = [];
for (const { file, maxGzipKb } of BUDGETS_KB) {
  const abs = join(uiRoot, file);
  if (!existsSync(abs)) {
    errors.push(`Missing budgeted artifact: ${file}`);
    continue;
  }
  const gzipBytes = gzipSync(readFileSync(abs)).length;
  const gzipKb = Math.round((gzipBytes / 1024) * 100) / 100;
  report.push(`${file}: ${gzipKb} KB gzip (budget <= ${maxGzipKb} KB)`);
  if (gzipKb > maxGzipKb) {
    errors.push(`Budget exceeded for ${file}: ${gzipKb} KB > ${maxGzipKb} KB`);
  }
}

// 3. Dry-run npm pack to ensure tarball manifest contains dist, styles, tokens, and docs
try {
  const packJson = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: uiRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(packJson);
  const packedFiles = new Set((parsed[0]?.files ?? []).map((entry) => entry.path));
  for (const required of [
    'dist/index.js',
    'dist/motion/index.js',
    'dist/game/index.js',
    'dist/cartoon/index.js',
    'dist/templates/index.js',
    'dist/tokens.w3c.json',
    'dist/tailwind-preset.css',
    'src/styles/tokens.css',
    'src/styles/components.css',
    'README.md',
    'CHANGELOG.md',
  ]) {
    if (!packedFiles.has(required)) {
      errors.push(`npm pack tarball is missing required file: ${required}`);
    }
  }
} catch (err) {
  errors.push(`npm pack --dry-run failed: ${err instanceof Error ? err.message : String(err)}`);
}

if (errors.length > 0) {
  console.error(`Consumer pack & budget verification failed (${errors.length} issue(s)):`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log('Consumer pack & bundle budget verification passed:');
for (const line of report) console.log(`  ✓ ${line}`);
