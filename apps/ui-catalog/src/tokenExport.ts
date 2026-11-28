import { CORE_DESIGN_TOKENS, type DesignTokenEntry } from '@moonwitness/ui/token-exporter';

export type TokenCategory = 'colors' | 'spacing' | 'typography';
export type TokenExportFormat = 'css' | 'json' | 'tailwind';

export interface ActiveDesignTokenSnapshot {
  meta: {
    theme: string;
    skin: string;
    density: string;
  };
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
}

const TOKENS_BY_CATEGORY = (...categories: readonly DesignTokenEntry['category'][]) =>
  CORE_DESIGN_TOKENS.filter((entry) => categories.includes(entry.category));

/** Token groups are derived from the canonical `@moonwitness/ui` exporter so they cannot drift from it. */
export const COLOR_TOKENS: readonly string[] = TOKENS_BY_CATEGORY('color').map((t) => t.cssVariable);
export const SPACING_TOKENS: readonly string[] = TOKENS_BY_CATEGORY('spacing', 'radius', 'shadow').map(
  (t) => t.cssVariable
);
export const TYPOGRAPHY_TOKENS: readonly string[] = TOKENS_BY_CATEGORY('typography').map((t) => t.cssVariable);

const CANONICAL_TOKENS: ReadonlyMap<string, DesignTokenEntry> = new Map(
  CORE_DESIGN_TOKENS.map((entry) => [entry.cssVariable, entry])
);

function resolveCanonicalValue(token: string, isDark: boolean): string {
  const entry = CANONICAL_TOKENS.get(token);
  if (!entry) return `var(${token})`;
  return (isDark && entry.darkValue) || entry.value;
}

function readTokenGroup(
  tokens: readonly string[],
  computed: CSSStyleDeclaration | null,
  isDark: boolean
): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const token of tokens) {
    const raw = computed?.getPropertyValue(token).trim();
    entries[token] = raw || resolveCanonicalValue(token, isDark);
  }
  return entries;
}

export function collectActiveDesignTokens(
  root: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): ActiveDesignTokenSnapshot {
  const computed = root && typeof window !== 'undefined' ? window.getComputedStyle(root) : null;
  const theme =
    root?.dataset.theme ||
    (root?.classList.contains('high-contrast')
      ? 'high-contrast'
      : root?.classList.contains('dark')
        ? 'dark'
        : 'light');
  const skin = root?.dataset.skin || 'moonwitness-ink';
  const density = root?.dataset.density || 'comfortable';

  const isDark = theme === 'dark' || theme === 'high-contrast';
  return {
    meta: { theme, skin, density },
    colors: readTokenGroup(COLOR_TOKENS, computed, isDark),
    spacing: readTokenGroup(SPACING_TOKENS, computed, isDark),
    typography: readTokenGroup(TYPOGRAPHY_TOKENS, computed, isDark),
  };
}

export function formatTokensAsCss(
  snapshot: ActiveDesignTokenSnapshot,
  categories: readonly TokenCategory[] = ['colors', 'spacing', 'typography']
): string {
  const activeSet = new Set(categories);
  const blocks: string[] = [
    `/* MoonWitness Design Tokens — theme: ${snapshot.meta.theme}, skin: ${snapshot.meta.skin}, density: ${snapshot.meta.density} */`,
    ':root {',
  ];

  const appendGroup = (heading: string, tokens: Record<string, string>) => {
    blocks.push(`  /* ${heading} */`);
    for (const [name, value] of Object.entries(tokens)) {
      blocks.push(`  ${name}: ${value};`);
    }
    blocks.push('');
  };

  if (activeSet.has('colors')) appendGroup('Colors', snapshot.colors);
  if (activeSet.has('spacing')) appendGroup('Spacing, Radii & Shadows', snapshot.spacing);
  if (activeSet.has('typography')) appendGroup('Typography', snapshot.typography);

  if (blocks[blocks.length - 1] === '') {
    blocks.pop();
  }
  blocks.push('}');
  return `${blocks.join('\n')}\n`;
}

export function formatTokensAsJson(
  snapshot: ActiveDesignTokenSnapshot,
  categories: readonly TokenCategory[] = ['colors', 'spacing', 'typography']
): string {
  const activeSet = new Set(categories);
  const payload: Record<string, unknown> = {
    meta: { ...snapshot.meta },
  };
  if (activeSet.has('colors')) payload.colors = snapshot.colors;
  if (activeSet.has('spacing')) payload.spacing = snapshot.spacing;
  if (activeSet.has('typography')) payload.typography = snapshot.typography;
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function formatTokensAsTailwindTheme(
  snapshot: ActiveDesignTokenSnapshot,
  categories: readonly TokenCategory[] = ['colors', 'spacing', 'typography']
): string {
  const activeSet = new Set(categories);
  const lines: string[] = [
    `/* MoonWitness Tailwind v4 @theme — theme: ${snapshot.meta.theme}, skin: ${snapshot.meta.skin}, density: ${snapshot.meta.density} */`,
    '@theme {',
  ];
  if (activeSet.has('colors')) {
    for (const [name, value] of Object.entries(snapshot.colors)) {
      const key = name.replace(/^--mw-/, '');
      lines.push(`  --color-mw-${key}: ${value};`);
    }
  }
  if (activeSet.has('spacing')) {
    for (const [name, value] of Object.entries(snapshot.spacing)) {
      const key = name.replace(/^--mw-/, '');
      if (key.startsWith('radius-')) {
        lines.push(`  --radius-mw-${key.slice(7)}: ${value};`);
      } else if (key.startsWith('shadow-')) {
        lines.push(`  --shadow-mw-${key.slice(7)}: ${value};`);
      } else {
        lines.push(`  --spacing-mw-${key}: ${value};`);
      }
    }
  }
  if (activeSet.has('typography')) {
    for (const [name, value] of Object.entries(snapshot.typography)) {
      const key = name.replace(/^--mw-/, '');
      if (key.startsWith('font-size-')) {
        lines.push(`  --text-mw-${key.slice(10)}: ${value};`);
      } else if (key.startsWith('font-')) {
        lines.push(`  --font-mw-${key.slice(5)}: ${value};`);
      } else {
        lines.push(`  --leading-mw-${key}: ${value};`);
      }
    }
  }
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

export function buildTokenExportFilename(
  snapshot: ActiveDesignTokenSnapshot,
  format: TokenExportFormat
): string {
  const sanitize = (part: string) => part.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const ext = format === 'tailwind' ? 'tailwind.css' : format;
  return `moonwitness-tokens-${sanitize(snapshot.meta.skin)}-${sanitize(snapshot.meta.theme)}-${sanitize(snapshot.meta.density)}.${ext}`;
}

export function downloadTokenFile(content: string, filename: string, mimeType: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
