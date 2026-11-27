import tokensBundle from '@moonwitness/ui/tokens.bundle.json';

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

export const COLOR_TOKENS = [
  '--mw-background',
  '--mw-foreground',
  '--mw-surface',
  '--mw-surface-foreground',
  '--mw-popover',
  '--mw-popover-foreground',
  '--mw-primary',
  '--mw-primary-foreground',
  '--mw-secondary',
  '--mw-secondary-foreground',
  '--mw-muted',
  '--mw-muted-foreground',
  '--mw-accent',
  '--mw-accent-foreground',
  '--mw-destructive',
  '--mw-destructive-foreground',
  '--mw-success',
  '--mw-on-success',
  '--mw-warning',
  '--mw-on-warning',
  '--mw-info',
  '--mw-on-info',
  '--mw-border',
  '--mw-border-strong',
  '--mw-border-subtle',
  '--mw-focus',
  '--mw-paper',
  '--mw-paper-raised',
  '--mw-ink',
  '--mw-yellow',
  '--mw-magenta',
  '--mw-signal-blue',
  '--mw-violet',
  '--mw-chart-1',
  '--mw-chart-2',
  '--mw-chart-3',
  '--mw-chart-4',
  '--mw-chart-5',
] as const;

export const SPACING_TOKENS = [
  '--mw-space-1',
  '--mw-space-2',
  '--mw-space-3',
  '--mw-space-4',
  '--mw-space-6',
  '--mw-space-8',
  '--mw-avatar-size',
  '--mw-panel-gap-compact',
  '--mw-panel-gap-comfortable',
  '--mw-panel-padding-compact',
  '--mw-panel-padding-comfortable',
  '--mw-frame-width',
  '--mw-comic-border-width',
  '--mw-comic-gutter',
  '--mw-torn-safe-inset',
  '--mw-radius-sm',
  '--mw-radius-md',
  '--mw-radius-lg',
  '--mw-radius-full',
  '--mw-shadow-ink',
  '--mw-shadow-ink-lg',
  '--mw-shadow-comic',
] as const;

export const TYPOGRAPHY_TOKENS = [
  '--mw-font-display',
  '--mw-font-grunge',
  '--mw-font-condensed',
  '--mw-font-brush',
  '--mw-font-sans',
  '--mw-font-mono',
  '--mw-font-size-2xs',
  '--mw-font-size-xs',
  '--mw-font-size-sm',
  '--mw-font-size-md',
  '--mw-font-size-lg',
  '--mw-font-size-xl',
  '--mw-font-size-2xl',
  '--mw-line-height-tight',
  '--mw-line-height-normal',
] as const;

type TokenBundleEntry = {
  cssVariable: string;
  value: string;
  darkValue?: string;
};

const BUNDLE_TOKENS: ReadonlyMap<string, TokenBundleEntry> = new Map(
  ((tokensBundle as { tokens?: TokenBundleEntry[] }).tokens ?? []).map((entry) => [
    entry.cssVariable,
    entry,
  ])
);

const TOKEN_ALIAS_MAP: Readonly<Record<string, string>> = {
  '--mw-surface-foreground': '--mw-foreground',
  '--mw-popover': '--mw-surface',
  '--mw-popover-foreground': '--mw-foreground',
  '--mw-primary-foreground': '--mw-ink-black',
  '--mw-secondary': '--mw-background',
  '--mw-secondary-foreground': '--mw-foreground',
  '--mw-muted': '--mw-background',
  '--mw-muted-foreground': '--mw-foreground',
  '--mw-accent': '--mw-primary',
  '--mw-accent-foreground': '--mw-ink-black',
  '--mw-destructive': '--mw-error',
  '--mw-destructive-foreground': '--mw-surface',
  '--mw-on-success': '--mw-surface',
  '--mw-on-warning': '--mw-ink-black',
  '--mw-on-info': '--mw-surface',
  '--mw-border': '--mw-foreground',
  '--mw-border-strong': '--mw-foreground',
  '--mw-border-subtle': '--mw-foreground',
  '--mw-focus': '--mw-foreground',
  '--mw-paper': '--mw-background',
  '--mw-paper-raised': '--mw-surface',
  '--mw-ink': '--mw-foreground',
};

function resolveBundleFallback(token: string, isDark: boolean): string {
  const direct = BUNDLE_TOKENS.get(token);
  if (direct) return (isDark && direct.darkValue) || direct.value;
  const alias = TOKEN_ALIAS_MAP[token];
  if (alias) {
    const aliased = BUNDLE_TOKENS.get(alias);
    if (aliased) return (isDark && aliased.darkValue) || aliased.value;
  }
  return `var(${token})`;
}

function readTokenGroup(
  tokens: readonly string[],
  computed: CSSStyleDeclaration | null,
  isDark: boolean
): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const token of tokens) {
    const raw = computed?.getPropertyValue(token).trim();
    entries[token] = raw || resolveBundleFallback(token, isDark);
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
