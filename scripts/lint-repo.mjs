#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const uiRoot = join(root, 'packages/ui');
const componentsDir = join(uiRoot, 'src/components');
const componentsCssPath = join(uiRoot, 'src/styles/components.css');
const uiPkgPath = join(uiRoot, 'package.json');

const errors = [];

const uiPkg = JSON.parse(readFileSync(uiPkgPath, 'utf8'));
const exportKeys = new Set(Object.keys(uiPkg.exports ?? {}));
const componentFiles = readdirSync(componentsDir)
  .filter((file) => file.endsWith('.tsx'))
  .sort();

const TAILWIND_LEAK_PATTERN =
  /\b(bg-\[|text-\[|border-\[|flex-col|items-center|justify-between|gap-[0-9]|px-[0-9]|py-[0-9]|rounded-(?:md|lg|xl|sm|full)|shadow-(?:md|lg|sm|xl)|z-50|w-full|h-full)\b/;

const INTERACTIVE_PATTERN =
  /\b(useState|useEffect|useRef|useCallback|useMemo|useId|useContext|useLayoutEffect|createContext|onClick|onChange|onKeyDown|onSubmit|onFocus|onBlur)\b|from\s+['"]radix-ui['"]/;

const UNSAFE_CODE_PATTERN = /\b(dangerouslySetInnerHTML|eval\s*\(|new\s+Function\s*\()/;
const HEX_COLOR_PATTERN = /#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b/i;

for (const file of componentFiles) {
  const fullPath = join(componentsDir, file);
  const src = readFileSync(fullPath, 'utf8');
  const slug = file.replace(/\.tsx$/, '');
  const expectedExport = `./components/${slug}`;

  if (!exportKeys.has(expectedExport)) {
    errors.push(`Missing package.json export "${expectedExport}" for src/components/${file}`);
  }

  if (INTERACTIVE_PATTERN.test(src) && !/^['"]use client['"];?/m.test(src)) {
    errors.push(`Interactive component src/components/${file} is missing top-level 'use client' directive`);
  }

  const twMatch = src.match(TAILWIND_LEAK_PATTERN);
  if (twMatch) {
    errors.push(`Tailwind utility class "${twMatch[0]}" leaked into src/components/${file}`);
  }

  const unsafeMatch = src.match(UNSAFE_CODE_PATTERN);
  if (unsafeMatch) {
    errors.push(`Unsafe pattern "${unsafeMatch[0]}" found in src/components/${file}`);
  }

  const hexMatch = src.match(HEX_COLOR_PATTERN);
  if (hexMatch) {
    errors.push(`Hardcoded hex color "${hexMatch[0]}" found in src/components/${file}`);
  }
}

for (const linkFile of ['breadcrumbs.tsx', 'update-banner.tsx']) {
  const src = readFileSync(join(componentsDir, linkFile), 'utf8');
  if (!src.includes('sanitizeUrl')) {
    errors.push(`Dynamic link component src/components/${linkFile} must sanitize URLs with sanitizeUrl()`);
  }
}

const componentsCss = readFileSync(componentsCssPath, 'utf8');
if (!componentsCss.trimStart().startsWith('@layer components {')) {
  errors.push('packages/ui/src/styles/components.css must begin with "@layer components {"');
}

const strippedCss = componentsCss
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/url\(\s*["']?data:[^)]*["']?\s*\)/gi, '');

const cssHexMatch = strippedCss.match(/(?:^|[^\w-])#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\w-])/i);
if (cssHexMatch) {
  errors.push(`Hardcoded hex color "${cssHexMatch[0].trim()}" found in packages/ui/src/styles/components.css`);
}

if (errors.length > 0) {
  console.error(`Lint failed with ${errors.length} issue(s):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `Lint passed (${componentFiles.length} UI components checked: 'use client', zero Tailwind leakage, URL sanitization, token hygiene, exports parity).`
);
