export type TokenCategory = 'colors' | 'spacing' | 'typography';
export type TokenExportFormat = 'css' | 'json';

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

const FALLBACK_VALUES: Record<string, string> = {
  '--mw-background': '#f3efe4',
  '--mw-foreground': '#0d0d0d',
  '--mw-surface': '#fffdf6',
  '--mw-surface-foreground': '#0d0d0d',
  '--mw-popover': '#fffdf6',
  '--mw-popover-foreground': '#0d0d0d',
  '--mw-primary': '#ffe031',
  '--mw-primary-foreground': '#0d0d0d',
  '--mw-secondary': '#f3efe4',
  '--mw-secondary-foreground': '#0d0d0d',
  '--mw-muted': '#e7e2d4',
  '--mw-muted-foreground': '#3a3a36',
  '--mw-accent': '#ffe031',
  '--mw-accent-foreground': '#0d0d0d',
  '--mw-destructive': '#b42318',
  '--mw-destructive-foreground': '#fffdf6',
  '--mw-success': '#166534',
  '--mw-on-success': '#fffdf6',
  '--mw-warning': '#facc15',
  '--mw-on-warning': '#0d0d0d',
  '--mw-info': '#175cd3',
  '--mw-on-info': '#fffdf6',
  '--mw-border': '#0d0d0d',
  '--mw-border-strong': '#0d0d0d',
  '--mw-border-subtle': '#a4a096',
  '--mw-focus': '#0d0d0d',
  '--mw-paper': '#f3efe4',
  '--mw-paper-raised': '#fffdf6',
  '--mw-ink': '#0d0d0d',
  '--mw-yellow': '#ffe031',
  '--mw-magenta': '#ff2e88',
  '--mw-signal-blue': '#00b8f0',
  '--mw-violet': '#c084fc',
  '--mw-chart-1': '#476a2a',
  '--mw-chart-2': '#ff2e88',
  '--mw-chart-3': '#176b87',
  '--mw-chart-4': '#936a22',
  '--mw-chart-5': '#76519b',
  '--mw-space-1': '0.25rem',
  '--mw-space-2': '0.5rem',
  '--mw-space-3': '0.75rem',
  '--mw-space-4': '1rem',
  '--mw-space-6': '1.5rem',
  '--mw-space-8': '2rem',
  '--mw-avatar-size': '2.5rem',
  '--mw-panel-gap-compact': '0.375rem',
  '--mw-panel-gap-comfortable': '0.75rem',
  '--mw-panel-padding-compact': '0.625rem',
  '--mw-panel-padding-comfortable': '1rem',
  '--mw-frame-width': '2px',
  '--mw-comic-border-width': '2px',
  '--mw-comic-gutter': '0.75rem',
  '--mw-torn-safe-inset': '0.75rem',
  '--mw-radius-sm': '0.125rem',
  '--mw-radius-md': '0.25rem',
  '--mw-radius-lg': '0.5rem',
  '--mw-radius-full': '9999px',
  '--mw-shadow-ink': '3px 3px 0 0 #0d0d0d',
  '--mw-shadow-ink-lg': '6px 6px 0 0 #0d0d0d',
  '--mw-shadow-comic': '4px 4px 0 0 #0d0d0d',
  '--mw-font-display': "'Anton', 'MoonWitness Grunge', Impact, 'Arial Narrow', sans-serif",
  '--mw-font-grunge': "'MoonWitness Grunge', 'Road Rage', Impact, 'Arial Narrow', sans-serif",
  '--mw-font-condensed': "'MoonWitness Grunge', 'Road Rage', Impact, 'Arial Narrow', sans-serif",
  '--mw-font-brush': "'Road Rage', 'MoonWitness Grunge', Impact, 'Arial Narrow', sans-serif",
  '--mw-font-sans': "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  '--mw-font-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  '--mw-font-size-2xs': '0.75rem',
  '--mw-font-size-xs': '0.75rem',
  '--mw-font-size-sm': '0.875rem',
  '--mw-font-size-md': '1rem',
  '--mw-font-size-lg': '1.125rem',
  '--mw-font-size-xl': '1.25rem',
  '--mw-font-size-2xl': '1.5rem',
  '--mw-line-height-tight': '1.2',
  '--mw-line-height-normal': '1.5',
};

function readTokenGroup(
  tokens: readonly string[],
  computed: CSSStyleDeclaration | null
): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const token of tokens) {
    const raw = computed?.getPropertyValue(token).trim();
    entries[token] = raw || FALLBACK_VALUES[token] || '';
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

  return {
    meta: { theme, skin, density },
    colors: readTokenGroup(COLOR_TOKENS, computed),
    spacing: readTokenGroup(SPACING_TOKENS, computed),
    typography: readTokenGroup(TYPOGRAPHY_TOKENS, computed),
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

export function buildTokenExportFilename(
  snapshot: ActiveDesignTokenSnapshot,
  format: TokenExportFormat
): string {
  const sanitize = (part: string) => part.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return `moonwitness-tokens-${sanitize(snapshot.meta.skin)}-${sanitize(snapshot.meta.theme)}-${sanitize(snapshot.meta.density)}.${format}`;
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
