import {
  BUILTIN_SKINS,
  DEFAULT_SKIN_ID,
  type BuiltinSkinId,
  type ColorMode,
  type SkinDensity,
  type SkinId,
  type SkinMetadata,
  type SkinSwatchPreview,
} from './themes/index.js';

export {
  BUILTIN_SKINS,
  DEFAULT_SKIN_ID,
  type BuiltinSkinId,
  type ColorMode,
  type SkinDensity,
  type SkinId,
  type SkinMetadata,
  type SkinSwatchPreview,
};

export type TokenCategory =
  | 'color'
  | 'typography'
  | 'spacing'
  | 'radius'
  | 'shadow'
  | 'motion'
  | 'layer'
  | 'effect';

export interface DesignTokenEntry {
  readonly name: string;
  readonly cssVariable: `--mw-${string}`;
  readonly value: string;
  readonly darkValue?: string;
  readonly category: TokenCategory;
}

export interface W3cDesignTokenNode {
  readonly $value: string;
  readonly $type: string;
  readonly $description?: string;
}

export interface SkinModeTokens {
  readonly light: Readonly<Record<`--mw-${string}`, string>>;
  readonly dark: Readonly<Record<`--mw-${string}`, string>>;
}

export interface DesignTokenBundle {
  readonly schemaVersion: 'moonwitness-design-tokens/v1';
  readonly defaultSkinId: BuiltinSkinId;
  readonly skins: readonly SkinMetadata[];
  readonly tokens: readonly DesignTokenEntry[];
  readonly skinTokens?: Readonly<Record<BuiltinSkinId, SkinModeTokens>>;
}

export interface TokenParityReport {
  readonly valid: boolean;
  readonly missingLightVariables: readonly string[];
  readonly missingDarkVariables: readonly string[];
  readonly hasExternalCdnFonts: boolean;
}

type TokenSeed = readonly [
  name: string,
  value: string,
  category: TokenCategory,
  darkValue?: string,
];

const CORE_TOKEN_SEEDS: readonly TokenSeed[] = [
  ['paper-cream', '#f3efe4', 'color'],
  ['ink-black', '#0d0d0d', 'color'],
  ['ink-panel', '#17171a', 'color'],
  ['paper', '#f3efe4', 'color', '#0e0e10'],
  ['paper-raised', '#fffdf6', 'color', '#17171a'],
  ['ink', '#0d0d0d', 'color', '#f3efe4'],
  ['ink-soft', '#3a3a36', 'color', '#c9c5b8'],
  ['ink-faint', '#59574e', 'color', '#9b988f'],
  ['color-ink-muted', '#59574e', 'color', '#9b988f'],
  ['signal-blue', '#00b8f0', 'color'],
  ['cyan', '#00b8f0', 'color'],
  ['night', '#0d0d0d', 'color'],
  ['night-soft', '#121216', 'color'],
  ['night-raised', '#17171a', 'color'],
  ['night-blue', '#092c49', 'color'],
  ['night-magenta', '#421027', 'color'],
  ['night-outline', 'color-mix(in srgb, var(--mw-paper-cream) 22%, transparent)', 'color'],
  ['paper-highlight', '#e3dfd4', 'color'],
  ['paper-muted', '#cbc7bd', 'color'],
  ['moon', '#b6cad7', 'color'],
  ['yellow', '#ffe031', 'color'],
  ['magenta', '#ff2e88', 'color'],
  ['violet', '#c084fc', 'color'],
  ['yellow-readable', '#705900', 'color', '#ffe031'],
  ['magenta-readable', '#b20f55', 'color', '#ff2e88'],
  ['cyan-readable', '#00749a', 'color', '#00b8f0'],
  ['violet-readable', '#6d28d9', 'color', '#c084fc'],
  ['on-accent', '#0d0d0d', 'color'],
  ['on-magenta', '#0d0d0d', 'color'],
  ['on-violet', '#0d0d0d', 'color'],
  ['halftone-dot', 'rgb(13 13 13 / 13%)', 'color', 'rgb(243 239 228 / 9%)'],
  ['highlight', '#ffffff', 'color'],
  ['background', '#f3efe4', 'color', '#0e0e10'],
  ['foreground', '#0d0d0d', 'color', '#f3efe4'],
  ['surface', '#fffdf6', 'color', '#17171a'],
  ['surface-foreground', '#0d0d0d', 'color', '#f3efe4'],
  ['popover', '#fffdf6', 'color', '#17171a'],
  ['popover-foreground', '#0d0d0d', 'color', '#f3efe4'],
  ['primary', '#ffe031', 'color', '#ffe031'],
  ['primary-foreground', '#0d0d0d', 'color'],
  ['secondary', '#f3efe4', 'color', '#0e0e10'],
  ['secondary-foreground', '#0d0d0d', 'color', '#f3efe4'],
  ['muted', '#e7e2d4', 'color', '#232327'],
  ['muted-foreground', '#3a3a36', 'color', '#c9c5b8'],
  ['accent', '#ffe031', 'color'],
  ['accent-foreground', '#0d0d0d', 'color'],
  ['error', '#b42318', 'color', '#fda29b'],
  ['on-error', '#fffdf6', 'color', '#0d0d0d'],
  ['destructive', '#b42318', 'color', '#fda29b'],
  ['destructive-foreground', '#fffdf6', 'color', '#0d0d0d'],
  ['border', '#0d0d0d', 'color', '#f3efe4'],
  ['border-strong', '#0d0d0d', 'color', '#f3efe4'],
  ['border-subtle', 'color-mix(in srgb, var(--mw-ink) 35%, var(--mw-paper))', 'color'],
  ['input', '#0d0d0d', 'color', '#f3efe4'],
  ['focus', '#0d0d0d', 'color', '#f3efe4'],
  ['backdrop', 'rgb(13 13 13 / 50%)', 'color'],
  ['success', '#166534', 'color'],
  ['on-success', '#fffdf6', 'color'],
  ['warning', '#facc15', 'color'],
  ['on-warning', '#0d0d0d', 'color'],
  ['warning-readable', '#705900', 'color', '#facc15'],
  ['success-readable', '#166534', 'color', '#86efac'],
  ['info', '#175cd3', 'color'],
  ['on-info', '#fffdf6', 'color'],
  ['chart-1', '#476a2a', 'color'],
  ['chart-2', '#ff2e88', 'color'],
  ['chart-3', '#176b87', 'color'],
  ['chart-4', '#936a22', 'color'],
  ['chart-5', '#76519b', 'color'],
  ['brand-crimson', '#D1132A', 'color'],
  ['signal-crimson', '#9F1022', 'color'],
  ['font-display', "'Anton', 'MoonWitness Grunge', Impact, 'Arial Narrow', sans-serif", 'typography'],
  ['font-grunge', "'MoonWitness Grunge', 'Road Rage', Impact, 'Arial Narrow', sans-serif", 'typography'],
  ['font-condensed', "'MoonWitness Grunge', 'Road Rage', Impact, 'Arial Narrow', sans-serif", 'typography'],
  ['font-brush', "'Road Rage', 'MoonWitness Grunge', Impact, 'Arial Narrow', sans-serif", 'typography'],
  ['font-sans', "'Space Grotesk', ui-sans-serif, system-ui, sans-serif", 'typography'],
  ['font-mono', "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace", 'typography'],
  ['font-size-2xs', '0.75rem', 'typography'],
  ['font-size-xs', '0.75rem', 'typography'],
  ['font-size-sm', '0.875rem', 'typography'],
  ['font-size-md', '1rem', 'typography'],
  ['font-size-lg', '1.125rem', 'typography'],
  ['font-size-xl', '1.25rem', 'typography'],
  ['font-size-2xl', '1.5rem', 'typography'],
  ['line-height-tight', '1.2', 'typography'],
  ['line-height-normal', '1.5', 'typography'],
  ['avatar-size', '2.5rem', 'spacing'],
  ['space-1', '0.25rem', 'spacing'],
  ['space-2', '0.5rem', 'spacing'],
  ['space-3', '0.75rem', 'spacing'],
  ['space-4', '1rem', 'spacing'],
  ['space-6', '1.5rem', 'spacing'],
  ['space-8', '2rem', 'spacing'],
  ['panel-gap-compact', '0.375rem', 'spacing'],
  ['panel-gap-comfortable', '0.75rem', 'spacing'],
  ['panel-padding-compact', '0.625rem', 'spacing'],
  ['panel-padding-comfortable', '1rem', 'spacing'],
  ['frame-width', '2px', 'spacing'],
  ['torn-safe-inset', '0.75rem', 'spacing'],
  ['decorative-rotation', '1.5deg', 'effect'],
  ['radius-sm', '0.125rem', 'radius'],
  ['radius-md', '0.25rem', 'radius'],
  ['radius-lg', '0.5rem', 'radius'],
  ['radius-full', '9999px', 'radius'],
  ['shadow-ink', '3px 3px 0 0 var(--mw-ink)', 'shadow'],
  ['shadow-ink-lg', '6px 6px 0 0 var(--mw-ink)', 'shadow'],
  ['comic-border-width', '2px', 'spacing'],
  ['comic-gutter', '0.75rem', 'spacing'],
  ['shadow-comic', '4px 4px 0 0 var(--mw-ink)', 'shadow'],
  ['dna-skew', '-8deg', 'effect'],
  ['dna-halftone-size', '7px', 'effect'],
  ['dna-halftone-opacity', '0.16', 'effect'],
  ['dna-cel-highlight', 'rgb(255 255 255 / 38%)', 'color'],
  ['dna-border-heavy', '3px', 'spacing'],
  ['dna-speedline-opacity', '0.22', 'effect'],
  ['dna-chromatic-x', '3px', 'effect'],
  ['anime-skin', '#fad7bf', 'color'],
  ['anime-skin-shade', '#deb094', 'color'],
  ['anime-skin-highlight', '#fff0e5', 'color'],
  ['motion-pop', '180ms', 'motion'],
  ['motion-fast', '120ms', 'motion'],
  ['motion-normal', '160ms', 'motion'],
  ['motion-slow', '220ms', 'motion'],
  ['motion-delay', '200ms', 'motion'],
  ['motion-draw', '700ms', 'motion'],
  ['motion-effect', '1200ms', 'motion'],
  ['motion-pulse', '1600ms', 'motion'],
  ['motion-progress', '1400ms', 'motion'],
  ['motion-spin', '800ms', 'motion'],
  ['motion-anime-snap', '180ms', 'motion'],
  ['motion-anime-slash', '360ms', 'motion'],
  ['motion-anime-burst', '480ms', 'motion'],
  ['motion-grunge-jitter', '900ms', 'motion'],
  ['shadow-anime-impact', '4px 4px 0 0 var(--mw-ink), 7px 7px 0 0 var(--mw-magenta)', 'shadow'],
  ['grunge-grain-opacity', '0.14', 'effect'],
  [
    'grunge-clip-rough',
    'polygon(0.5% 1.8%, 9% 0%, 21% 1.6%, 35% 0.2%, 49% 1.5%, 64% 0%, 79% 1.4%, 92% 0.2%, 99.6% 1.2%, 100% 19%, 98.8% 38%, 100% 59%, 99% 81%, 99.7% 99%, 84% 100%, 67% 98.6%, 48% 100%, 31% 98.8%, 14% 100%, 0.4% 98.7%, 1% 77%, 0% 54%, 1.1% 29%)',
    'effect',
  ],
  [
    'grunge-clip-jagged',
    'polygon(0% 8%, 7% 0%, 16% 6%, 28% 0%, 42% 5%, 56% 0%, 71% 6%, 85% 0%, 96% 4%, 100% 14%, 98% 35%, 100% 58%, 97% 84%, 100% 96%, 89% 100%, 74% 95%, 58% 100%, 41% 96%, 23% 100%, 8% 95%, 0% 99%, 2% 72%, 0% 45%)',
    'effect',
  ],
  [
    'grunge-clip-tape',
    'polygon(1.2% 6%, 14% 0%, 31% 4%, 52% 0%, 73% 5%, 90% 0%, 99.2% 7%, 98.4% 48%, 100% 92%, 86% 100%, 66% 95%, 44% 100%, 22% 96%, 0.8% 99%, 1.6% 54%)',
    'effect',
  ],
  [
    'grunge-clip-torn-card',
    'polygon(0.8% 1.4%, 11% 0%, 24% 1.1%, 39% 0%, 56% 1.2%, 72% 0%, 87% 1%, 99.3% 0.4%, 100% 17%, 99.1% 39%, 100% 62%, 99.2% 83%, 99.6% 99%, 85% 100%, 68% 98.8%, 49% 100%, 29% 98.9%, 12% 100%, 0.5% 98.8%, 1% 76%, 0% 51%, 0.9% 25%)',
    'effect',
  ],
  [
    'grunge-clip-brush-btn',
    'polygon(0.4% 14%, 9% 2%, 22% 10%, 37% 0%, 54% 8%, 71% 1%, 87% 7%, 100% 0%, 96% 32%, 100% 60%, 94% 96%, 76% 89%, 57% 100%, 35% 91%, 15% 100%, 0% 95%, 4% 62%, 0% 36%)',
    'effect',
  ],
  [
    'chalk-mask',
    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 100\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M0.5 0.5L28 0.2 58 0.8 92 0.2 128 0.8 166 0.2 199.5 0.5 199.2 26 199.8 54 199.2 80 199.5 99.5 164 99.2 126 99.8 88 99.2 48 99.8 14 99.2 0.5 99.5 0.8 70 0.2 40 0.8 14Z\' fill=\'none\' stroke=\'%23000\' stroke-width=\'2.2\' vector-effect=\'non-scaling-stroke\' stroke-dasharray=\'26 3 10 2 34 4\'/%3E%3Cpath d=\'M2 1.2L52 0.8M78 0.8L128 1.2M154 0.8L196 1.2M4 98.8L62 99.2M100 98.8L148 99.2M172 99.2L198 98.6M1.2 22L0.8 56M198.8 28L199.2 66\' fill=\'none\' stroke=\'%23000\' stroke-width=\'2.2\' vector-effect=\'non-scaling-stroke\' stroke-dasharray=\'9 4 4 5\'/%3E%3C/svg%3E")',
    'effect',
  ],
  [
    'grunge-clip-notched',
    'polygon(0.6% 0%, 99.4% 0%, 100% 4%, 99.6% 96%, 99% 100%, 0.8% 100%, 0% 95%, 0.4% 5%)',
    'effect',
  ],
  ['grunge-radius-hand', '3px 1px 4px 1px / 1px 4px 2px 3px', 'radius'],
  ['motion-ease', 'cubic-bezier(0.2, 0.8, 0.2, 1)', 'motion'],
  ['motion-ease-emphasis', 'cubic-bezier(0.34, 1.56, 0.64, 1)', 'motion'],
  ['layer-base', '0', 'layer'],
  ['layer-raised', '10', 'layer'],
  ['layer-sticky', '20', 'layer'],
  ['layer-overlay', '40', 'layer'],
  ['layer-dialog', '50', 'layer'],
  ['layer-popover', '55', 'layer'],
  ['layer-toast', '60', 'layer'],
  ['motion-scale', '1', 'motion'],
];

/** Canonical MoonWitness design tokens aligned with `tokens.css` plus ROCKSOUL crimson accents. */
export const CORE_DESIGN_TOKENS: readonly DesignTokenEntry[] = Object.freeze(
  CORE_TOKEN_SEEDS.map(([name, value, category, darkValue]) =>
    Object.freeze({
      name,
      cssVariable: `--mw-${name}` as const,
      value,
      ...(darkValue !== undefined ? { darkValue } : {}),
      category,
    })
  )
);

function freezeSkinMode(
  light: Record<`--mw-${string}`, string>,
  dark: Record<`--mw-${string}`, string>
): SkinModeTokens {
  return Object.freeze({
    light: Object.freeze(light),
    dark: Object.freeze(dark),
  });
}

/** Per-skin light and dark CSS variable overrides for all 8 built-in skins. */
export const BUILTIN_SKIN_TOKENS: Readonly<Record<BuiltinSkinId, SkinModeTokens>> = Object.freeze({
  'moonwitness-ink': freezeSkinMode(
    {},
    {
      '--mw-yellow-readable': 'var(--mw-yellow)',
      '--mw-magenta-readable': 'var(--mw-magenta)',
      '--mw-cyan-readable': 'var(--mw-signal-blue)',
      '--mw-violet-readable': 'var(--mw-violet)',
      '--mw-paper': '#0e0e10',
      '--mw-paper-raised': '#17171a',
      '--mw-ink': '#f3efe4',
      '--mw-ink-soft': '#c9c5b8',
      '--mw-ink-faint': '#9b988f',
      '--mw-halftone-dot': 'rgb(243 239 228 / 9%)',
      '--mw-muted': '#232327',
      '--mw-error': '#fda29b',
      '--mw-on-error': '#0d0d0d',
      '--mw-focus': 'var(--mw-ink)',
      '--mw-warning-readable': 'var(--mw-warning)',
      '--mw-success-readable': '#86efac',
    }
  ),
  'moonwitness-compact': freezeSkinMode(
    {
      '--mw-paper': '#f0eee9',
      '--mw-paper-raised': '#ffffff',
      '--mw-ink': '#111113',
      '--mw-ink-soft': '#37373c',
      '--mw-ink-faint': '#5e5e66',
      '--mw-muted': '#e3e1db',
      '--mw-primary': 'var(--mw-signal-blue)',
      '--mw-accent': 'var(--mw-signal-blue)',
      '--mw-radius-sm': '0.125rem',
      '--mw-radius-md': '0.1875rem',
      '--mw-radius-lg': '0.375rem',
      '--mw-shadow-ink': '2px 2px 0 0 var(--mw-ink)',
      '--mw-shadow-ink-lg': '4px 4px 0 0 var(--mw-ink)',
    },
    {
      '--mw-paper': '#0c0d10',
      '--mw-paper-raised': '#15171c',
      '--mw-ink': '#f0f2f5',
      '--mw-ink-soft': '#c2c6cf',
      '--mw-ink-faint': '#9197a3',
      '--mw-muted': '#20232b',
    }
  ),
  'moonwitness-high-contrast': freezeSkinMode(
    {
      '--mw-paper': '#ffffff',
      '--mw-paper-raised': '#ffffff',
      '--mw-ink': '#000000',
      '--mw-ink-soft': '#1a1a1a',
      '--mw-ink-faint': '#333333',
      '--mw-muted': '#ebebeb',
      '--mw-yellow': '#ffd000',
      '--mw-on-accent': '#000000',
      '--mw-error': '#990000',
      '--mw-on-error': '#ffffff',
      '--mw-success': '#005a1f',
      '--mw-on-success': '#ffffff',
      '--mw-info': '#003c8f',
      '--mw-on-info': '#ffffff',
      '--mw-yellow-readable': '#5c4800',
      '--mw-magenta-readable': '#990044',
      '--mw-cyan-readable': '#005b7a',
      '--mw-violet-readable': '#4c1d95',
      '--mw-frame-width': '3px',
    },
    {
      '--mw-paper': '#000000',
      '--mw-paper-raised': '#0a0a0a',
      '--mw-ink': '#ffffff',
      '--mw-ink-soft': '#e6e6e6',
      '--mw-ink-faint': '#cccccc',
      '--mw-muted': '#1c1c1c',
      '--mw-yellow': '#ffe600',
      '--mw-focus': 'var(--mw-yellow)',
      '--mw-error': '#ff8a80',
      '--mw-on-error': '#000000',
      '--mw-yellow-readable': 'var(--mw-yellow)',
      '--mw-magenta-readable': '#ff66a8',
      '--mw-cyan-readable': '#33d1ff',
      '--mw-violet-readable': '#d8b4fe',
    }
  ),
  'moonwitness-riot': freezeSkinMode(
    {
      '--mw-paper': '#f5efdf',
      '--mw-paper-raised': '#fff9eb',
      '--mw-ink': '#0a0a0c',
      '--mw-ink-soft': '#2d2d2a',
      '--mw-ink-faint': '#2d2d2a',
      '--mw-muted': '#e4dcc8',
      '--mw-primary': '#ffe031',
      '--mw-primary-foreground': '#0a0a0c',
      '--mw-accent': '#ff2e88',
      '--mw-accent-foreground': '#0a0a0c',
      '--mw-on-accent': '#0a0a0c',
      '--mw-on-magenta': '#0a0a0c',
      '--mw-on-violet': '#0a0a0c',
      '--mw-focus': '#a60e4f',
      '--mw-magenta-readable': '#a60e4f',
      '--mw-cyan-readable': '#006e92',
      '--mw-yellow-readable': '#6b5500',
      '--mw-violet-readable': '#6322cf',
      '--mw-frame-width': '3px',
      '--mw-shadow-ink': '4px 4px 0 0 #0a0a0c',
      '--mw-shadow-ink-lg': '7px 7px 0 0 #0a0a0c',
      '--mw-shadow-comic': '4px 4px 0 0 #0a0a0c',
      '--mw-shadow-anime-impact': '4px 4px 0 0 #0a0a0c, 8px 8px 0 0 #ff2e88',
      '--mw-halftone-dot': 'rgb(10 10 12 / 18%)',
      '--mw-grunge-grain-opacity': '0.2',
      '--mw-dna-skew': '-10deg',
      '--mw-dna-halftone-size': '6px',
      '--mw-dna-halftone-opacity': '0.24',
      '--mw-dna-border-heavy': '3px',
      '--mw-dna-chromatic-x': '4px',
    },
    {
      '--mw-paper': '#09090b',
      '--mw-paper-raised': '#121216',
      '--mw-ink': '#f5efdf',
      '--mw-ink-soft': '#cfcabd',
      '--mw-ink-faint': '#cfcabd',
      '--mw-muted': '#1e1e24',
      '--mw-primary': '#ff2e88',
      '--mw-primary-foreground': '#0a0a0c',
      '--mw-accent': '#ffe031',
      '--mw-accent-foreground': '#0a0a0c',
      '--mw-focus': '#ffe031',
      '--mw-error': '#fda29b',
      '--mw-on-error': '#0a0a0c',
      '--mw-magenta-readable': '#ff4d99',
      '--mw-cyan-readable': '#00b8f0',
      '--mw-yellow-readable': '#ffe031',
      '--mw-violet-readable': '#c084fc',
      '--mw-shadow-ink': '4px 4px 0 0 #000000',
      '--mw-shadow-ink-lg': '7px 7px 0 0 #ff2e88',
      '--mw-shadow-comic': '4px 4px 0 0 #000000',
      '--mw-shadow-anime-impact': '4px 4px 0 0 #000000, 8px 8px 0 0 #00b8f0',
      '--mw-halftone-dot': 'rgb(245 239 223 / 14%)',
      '--mw-grunge-grain-opacity': '0.22',
    }
  ),
  'cartoon-pop': freezeSkinMode(
    {
      '--mw-paper': '#fff8e7',
      '--mw-paper-raised': '#ffffff',
      '--mw-ink': '#14132a',
      '--mw-ink-soft': '#323055',
      '--mw-ink-faint': '#4c4973',
      '--mw-muted': '#f4e7c6',
      '--mw-primary': '#ffd43b',
      '--mw-primary-foreground': '#14132a',
      '--mw-accent': '#ff5c5c',
      '--mw-accent-foreground': '#14132a',
      '--mw-on-accent': '#14132a',
      '--mw-on-magenta': '#14132a',
      '--mw-focus': '#1d4ed8',
      '--mw-magenta-readable': '#b41759',
      '--mw-cyan-readable': '#00668c',
      '--mw-yellow-readable': '#6b4f00',
      '--mw-violet-readable': '#5b21b6',
      '--mw-radius-sm': '0.45rem',
      '--mw-radius-md': '0.75rem',
      '--mw-radius-lg': '1.15rem',
      '--mw-frame-width': '3px',
      '--mw-shadow-ink': '4px 4px 0 0 #14132a',
      '--mw-shadow-ink-lg': '7px 7px 0 0 #14132a',
      '--mw-shadow-comic': '4px 4px 0 0 #14132a',
      '--mw-dna-skew': '-6deg',
      '--mw-dna-halftone-size': '8px',
      '--mw-dna-halftone-opacity': '0.2',
      '--mw-dna-border-heavy': '3px',
    },
    {
      '--mw-paper': '#141326',
      '--mw-paper-raised': '#1e1c38',
      '--mw-ink': '#fff8e7',
      '--mw-ink-soft': '#d9d4eb',
      '--mw-ink-faint': '#b3accf',
      '--mw-muted': '#2a274d',
      '--mw-primary': '#ffd43b',
      '--mw-primary-foreground': '#14132a',
      '--mw-accent': '#ff70a6',
      '--mw-accent-foreground': '#14132a',
      '--mw-focus': '#ffd43b',
      '--mw-magenta-readable': '#ff70a6',
      '--mw-cyan-readable': '#38d9ff',
      '--mw-yellow-readable': '#ffd43b',
      '--mw-violet-readable': '#d0bfff',
      '--mw-shadow-ink': '4px 4px 0 0 #070611',
      '--mw-shadow-ink-lg': '7px 7px 0 0 #070611',
    }
  ),
  'arcade-neon': freezeSkinMode(
    {
      '--mw-paper': '#eef4fb',
      '--mw-paper-raised': '#ffffff',
      '--mw-ink': '#0a1020',
      '--mw-ink-soft': '#283552',
      '--mw-ink-faint': '#425274',
      '--mw-muted': '#dce6f5',
      '--mw-primary': '#00d4ff',
      '--mw-primary-foreground': '#0a1020',
      '--mw-accent': '#ff2e93',
      '--mw-accent-foreground': '#0a1020',
      '--mw-on-accent': '#0a1020',
      '--mw-focus': '#005b99',
      '--mw-magenta-readable': '#a60e5b',
      '--mw-cyan-readable': '#005f80',
      '--mw-yellow-readable': '#685000',
      '--mw-violet-readable': '#5b21b6',
      '--mw-radius-sm': '0.125rem',
      '--mw-radius-md': '0.25rem',
      '--mw-radius-lg': '0.375rem',
      '--mw-frame-width': '2px',
      '--mw-shadow-ink': '3px 3px 0 0 #0a1020',
      '--mw-shadow-ink-lg': '6px 6px 0 0 #0a1020',
    },
    {
      '--mw-paper': '#080b14',
      '--mw-paper-raised': '#111728',
      '--mw-ink': '#eef6ff',
      '--mw-ink-soft': '#b8cae6',
      '--mw-ink-faint': '#90a6c7',
      '--mw-muted': '#1b243d',
      '--mw-primary': '#00e5ff',
      '--mw-primary-foreground': '#080b14',
      '--mw-accent': '#ff3b9a',
      '--mw-accent-foreground': '#080b14',
      '--mw-on-accent': '#080b14',
      '--mw-focus': '#00e5ff',
      '--mw-magenta-readable': '#ff6bb5',
      '--mw-cyan-readable': '#33ebff',
      '--mw-yellow-readable': '#ffe64d',
      '--mw-violet-readable': '#c8a2ff',
      '--mw-shadow-ink': '3px 3px 0 0 #00e5ff',
      '--mw-shadow-ink-lg': '5px 5px 0 0 #ff3b9a',
      '--mw-dna-skew': '-12deg',
      '--mw-dna-halftone-opacity': '0.14',
      '--mw-dna-speedline-opacity': '0.3',
      '--mw-dna-chromatic-x': '4px',
    }
  ),
  'clean-motion': freezeSkinMode(
    {
      '--mw-paper': '#f8fafc',
      '--mw-paper-raised': '#ffffff',
      '--mw-ink': '#0f172a',
      '--mw-ink-soft': '#334155',
      '--mw-ink-faint': '#475569',
      '--mw-muted': '#e2e8f0',
      '--mw-primary': '#2563eb',
      '--mw-primary-foreground': '#ffffff',
      '--mw-accent': '#0ea5e9',
      '--mw-accent-foreground': '#0f172a',
      '--mw-on-accent': '#0f172a',
      '--mw-focus': '#1d4ed8',
      '--mw-magenta-readable': '#9d174d',
      '--mw-cyan-readable': '#0369a1',
      '--mw-yellow-readable': '#713f12',
      '--mw-violet-readable': '#5b21b6',
      '--mw-radius-sm': '0.375rem',
      '--mw-radius-md': '0.625rem',
      '--mw-radius-lg': '0.875rem',
      '--mw-frame-width': '1px',
      '--mw-shadow-ink': '0 2px 8px rgb(15 23 42 / 10%)',
      '--mw-shadow-ink-lg': '0 10px 24px rgb(15 23 42 / 14%)',
      '--mw-shadow-comic': '0 4px 12px rgb(15 23 42 / 10%)',
    },
    {
      '--mw-paper': '#0b1120',
      '--mw-paper-raised': '#111827',
      '--mw-ink': '#f8fafc',
      '--mw-ink-soft': '#cbd5e1',
      '--mw-ink-faint': '#94a3b8',
      '--mw-muted': '#1e293b',
      '--mw-primary': '#60a5fa',
      '--mw-primary-foreground': '#0b1120',
      '--mw-accent': '#38bdf8',
      '--mw-accent-foreground': '#0b1120',
      '--mw-on-accent': '#0b1120',
      '--mw-focus': '#60a5fa',
      '--mw-magenta-readable': '#f472b6',
      '--mw-cyan-readable': '#38bdf8',
      '--mw-yellow-readable': '#fde047',
      '--mw-violet-readable': '#c4b5fd',
      '--mw-shadow-ink': '0 2px 10px rgb(0 0 0 / 45%)',
      '--mw-shadow-ink-lg': '0 12px 28px rgb(0 0 0 / 55%)',
    }
  ),
  'cozy-rpg': freezeSkinMode(
    {
      '--mw-paper': '#f6eedc',
      '--mw-paper-raised': '#fdf9ef',
      '--mw-ink': '#261b12',
      '--mw-ink-soft': '#4d3927',
      '--mw-ink-faint': '#624a35',
      '--mw-muted': '#e9dcc0',
      '--mw-primary': '#f59e0b',
      '--mw-primary-foreground': '#261b12',
      '--mw-accent': '#10b981',
      '--mw-accent-foreground': '#14221b',
      '--mw-on-accent': '#261b12',
      '--mw-focus': '#9a3412',
      '--mw-magenta-readable': '#9f1239',
      '--mw-cyan-readable': '#0f6277',
      '--mw-yellow-readable': '#713f12',
      '--mw-violet-readable': '#5b21b6',
      '--mw-radius-sm': '0.25rem',
      '--mw-radius-md': '0.5rem',
      '--mw-radius-lg': '0.75rem',
      '--mw-frame-width': '2px',
      '--mw-shadow-ink': '3px 3px 0 0 #3f2d1d',
      '--mw-shadow-ink-lg': '6px 6px 0 0 #3f2d1d',
    },
    {
      '--mw-paper': '#1b1510',
      '--mw-paper-raised': '#261e17',
      '--mw-ink': '#f7efe0',
      '--mw-ink-soft': '#d9cbb2',
      '--mw-ink-faint': '#b6a488',
      '--mw-muted': '#352a20',
      '--mw-primary': '#fbbf24',
      '--mw-primary-foreground': '#1b1510',
      '--mw-accent': '#34d399',
      '--mw-accent-foreground': '#0c1f17',
      '--mw-on-accent': '#1b1510',
      '--mw-focus': '#fbbf24',
      '--mw-magenta-readable': '#fb7185',
      '--mw-cyan-readable': '#5eead4',
      '--mw-yellow-readable': '#fcd34d',
      '--mw-violet-readable': '#d8b4fe',
      '--mw-shadow-ink': '3px 3px 0 0 #0a0705',
      '--mw-shadow-ink-lg': '6px 6px 0 0 #0a0705',
    }
  ),
});

const EXTERNAL_FONT_CDN_PATTERN =
  /https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|cdn\.jsdelivr\.net\/.*font)/iu;

const TOKEN_BY_VAR = new Map(CORE_DESIGN_TOKENS.map((entry) => [entry.cssVariable, entry]));

interface CssRuleBlock {
  readonly selectors: readonly string[];
  readonly body: string;
}

function splitTopLevelSelectors(prelude: string): readonly string[] {
  return prelude
    .split(',')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractCssRuleBlocks(cssSource: string): readonly CssRuleBlock[] {
  const blocks: CssRuleBlock[] = [];
  let index = 0;
  let depth = 0;
  let prelude = '';
  let bodyStart = -1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;
  let skipAtRuleBlock = false;

  while (index < cssSource.length) {
    const ch = cssSource[index];
    const next = cssSource[index + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && ch === '/' && next === '*') {
      inComment = true;
      index += 2;
      continue;
    }

    if (!inDoubleQuote && ch === "'" && cssSource[index - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      if (depth === 0) prelude += ch;
      index += 1;
      continue;
    }

    if (!inSingleQuote && ch === '"' && cssSource[index - 1] !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      if (depth === 0) prelude += ch;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === '{') {
        if (depth === 0) {
          skipAtRuleBlock = prelude.replace(/\s+/g, ' ').trim().startsWith('@');
          bodyStart = index + 1;
        }
        depth += 1;
        index += 1;
        continue;
      }

      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          if (!skipAtRuleBlock) {
            blocks.push({
              selectors: splitTopLevelSelectors(prelude),
              body: cssSource.slice(bodyStart, index),
            });
          }
          prelude = '';
          skipAtRuleBlock = false;
        }
        index += 1;
        continue;
      }

      if (depth === 0 && ch === ';') {
        prelude = '';
        index += 1;
        continue;
      }
    }

    if (depth === 0) {
      prelude += ch;
    }
    index += 1;
  }

  return blocks;
}

function normalizeCssValue(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^polygon\(\s+/, 'polygon(')
    .replace(/\s+\)$/, ')');
}

function resolveW3cType(entry: Pick<DesignTokenEntry, 'name' | 'value' | 'category'>): string {
  switch (entry.category) {
    case 'color':
      return 'color';
    case 'spacing':
      return 'dimension';
    case 'radius':
      return entry.name === 'grunge-radius-hand' ? 'string' : 'dimension';
    case 'motion':
      if (entry.value.endsWith('ms') || entry.value.endsWith('s')) return 'duration';
      if (entry.value.startsWith('cubic-bezier(')) return 'cubicBezier';
      return 'number';
    case 'typography':
      if (entry.name.startsWith('font-size-')) return 'dimension';
      if (entry.name.startsWith('line-height-')) return 'number';
      return 'fontFamily';
    default:
      return 'string';
  }
}

/** Extract `--mw-*` custom property declarations from all matching top-level CSS rule blocks. */
export function parseTokensFromCss(cssSource: string, selector = ':root'): Record<string, string> {
  const normalizedTarget = selector.replace(/\s+/g, ' ').trim();
  const result: Record<string, string> = {};

  for (const block of extractCssRuleBlocks(cssSource)) {
    if (!block.selectors.includes(normalizedTarget)) continue;
    for (const match of block.body.matchAll(/(--mw-[\w-]+)\s*:\s*([^;]+);/gu)) {
      const varName = match[1]?.trim();
      const varValue = match[2] ? normalizeCssValue(match[2]) : '';
      if (varName && varValue) {
        result[varName] = varValue;
      }
    }
  }

  return result;
}

/** Export the complete MoonWitness design token bundle covering all 8 built-in skins. */
export function exportDesignTokenBundle(
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): DesignTokenBundle {
  return {
    schemaVersion: 'moonwitness-design-tokens/v1',
    defaultSkinId: DEFAULT_SKIN_ID,
    skins: BUILTIN_SKINS,
    tokens,
    skinTokens: BUILTIN_SKIN_TOKENS,
  };
}

/** Export tokens grouped by category in W3C DTCG format (`$value`, `$type`, `$description`). */
export function exportTokensToW3cJson(
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): Record<string, Record<string, W3cDesignTokenNode>> {
  const grouped: Record<string, Record<string, W3cDesignTokenNode>> = {};
  for (const entry of tokens) {
    const group = grouped[entry.category] ?? {};
    grouped[entry.category] = group;
    group[entry.name] = {
      $value: entry.value,
      $type: resolveW3cType(entry),
      ...(entry.darkValue ? { $description: `dark: ${entry.darkValue}` } : {}),
    };
  }
  return grouped;
}

/** Export per-skin overrides for all 8 built-in skins in W3C DTCG format. */
export function exportSkinTokensToW3cJson(): Record<
  BuiltinSkinId,
  Record<string, W3cDesignTokenNode>
> {
  const out = {} as Record<BuiltinSkinId, Record<string, W3cDesignTokenNode>>;

  for (const skin of BUILTIN_SKINS) {
    const id = skin.id as BuiltinSkinId;
    const overrides = BUILTIN_SKIN_TOKENS[id];
    const group: Record<string, W3cDesignTokenNode> = {
      'swatch-background': { $value: skin.swatch.background, $type: 'color' },
      'swatch-surface': { $value: skin.swatch.surface, $type: 'color' },
      'swatch-foreground': { $value: skin.swatch.foreground, $type: 'color' },
      'swatch-accent': { $value: skin.swatch.accent, $type: 'color' },
    };

    const overrideVars = new Set<`--mw-${string}`>([
      ...(Object.keys(overrides.light) as `--mw-${string}`[]),
      ...(Object.keys(overrides.dark) as `--mw-${string}`[]),
    ]);

    for (const cssVar of overrideVars) {
      const baseToken = TOKEN_BY_VAR.get(cssVar);
      const name = baseToken?.name ?? cssVar.slice(5);
      const lightValue = overrides.light[cssVar] ?? baseToken?.value;
      const darkValue = overrides.dark[cssVar];
      if (!lightValue) continue;
      group[name] = {
        $value: lightValue,
        $type: resolveW3cType({
          name,
          value: lightValue,
          category: baseToken?.category ?? 'color',
        }),
        ...(darkValue ? { $description: `dark: ${darkValue}` } : {}),
      };
    }

    out[id] = group;
  }

  return out;
}

/** Emit deterministic `:root` and `.dark` CSS custom property declarations. */
export function exportTokensToCssVariables(
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): string {
  const lightLines: string[] = [':root {'];
  const darkLines: string[] = ['.dark {'];
  for (const entry of tokens) {
    lightLines.push(`  ${entry.cssVariable}: ${entry.value};`);
    if (entry.darkValue) {
      darkLines.push(`  ${entry.cssVariable}: ${entry.darkValue};`);
    }
  }
  lightLines.push('}');
  darkLines.push('}');
  return `${lightLines.join('\n')}\n\n${darkLines.join('\n')}\n`;
}

/** Emit `[data-skin]` and `[data-skin].dark` CSS override blocks for all built-in skins. */
export function exportSkinsToCssVariables(): string {
  const blocks: string[] = [];
  for (const skin of BUILTIN_SKINS) {
    const id = skin.id as BuiltinSkinId;
    if (id === DEFAULT_SKIN_ID) continue;
    const { light, dark } = BUILTIN_SKIN_TOKENS[id];
    const lightEntries = Object.entries(light);
    if (lightEntries.length > 0) {
      blocks.push(
        `[data-skin='${id}'] {\n${lightEntries.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`
      );
    }
    const darkEntries = Object.entries(dark);
    if (darkEntries.length > 0) {
      blocks.push(
        `[data-skin='${id}'].dark {\n${darkEntries.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`
      );
    }
  }
  return `${blocks.join('\n\n')}\n`;
}

/** Emit Tailwind theme extension maps referencing `--mw-*` custom properties. */
export function exportTailwindThemeExtend(
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
} {
  const colors: Record<string, string> = {};
  const spacing: Record<string, string> = {};
  const borderRadius: Record<string, string> = {};

  for (const entry of tokens) {
    const varRef = `var(${entry.cssVariable})`;
    if (entry.category === 'color') {
      colors[`mw-${entry.name}`] = varRef;
    } else if (entry.category === 'spacing') {
      spacing[`mw-${entry.name}`] = varRef;
    } else if (entry.category === 'radius') {
      borderRadius[`mw-${entry.name}`] = varRef;
    }
  }

  return { colors, spacing, borderRadius };
}

/** Return true if a stylesheet references an external font CDN URL. */
export function hasExternalCdnFontImport(cssSource: string): boolean {
  return EXTERNAL_FONT_CDN_PATTERN.test(cssSource);
}

/** Return a `var(--mw-...)` CSS custom property reference for a token name. */
export function getCssVariableRef(tokenName: string): string {
  return tokenName.startsWith('--mw-') ? `var(${tokenName})` : `var(--mw-${tokenName})`;
}

/** Verify `:root` and `.dark` token parity and absence of external CDN font imports. */
export function verifyTokenParity(
  cssSource: string,
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): TokenParityReport {
  const lightVars = parseTokensFromCss(cssSource, ':root');
  const darkVars = parseTokensFromCss(cssSource, '.dark');
  const missingLightVariables: string[] = [];
  const missingDarkVariables: string[] = [];

  for (const entry of tokens) {
    if (lightVars[entry.cssVariable] !== entry.value) {
      missingLightVariables.push(entry.cssVariable);
    }
    if (entry.darkValue && darkVars[entry.cssVariable] !== entry.darkValue) {
      missingDarkVariables.push(entry.cssVariable);
    }
  }

  const hasExternalCdnFonts = hasExternalCdnFontImport(cssSource);
  return {
    valid:
      missingLightVariables.length === 0 &&
      missingDarkVariables.length === 0 &&
      !hasExternalCdnFonts,
    missingLightVariables,
    missingDarkVariables,
    hasExternalCdnFonts,
  };
}
