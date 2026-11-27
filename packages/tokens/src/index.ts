export type TokenCategory =
  | 'color'
  | 'typography'
  | 'spacing'
  | 'radius'
  | 'shadow'
  | 'motion'
  | 'layer'
  | 'effect';

export type BuiltinSkinId =
  | 'moonwitness-ink'
  | 'moonwitness-compact'
  | 'moonwitness-high-contrast'
  | 'moonwitness-riot';

export type ColorMode = 'light' | 'dark';
export type SkinDensity = 'comfortable' | 'compact';

export interface SkinSwatchPreview {
  readonly background: string;
  readonly surface: string;
  readonly foreground: string;
  readonly accent: string;
}

export interface SkinMetadata {
  readonly id: BuiltinSkinId;
  readonly label: string;
  readonly description: string;
  readonly supportedModes: readonly ColorMode[];
  readonly supportedDensities: readonly SkinDensity[];
  readonly defaultMode: ColorMode;
  readonly defaultDensity: SkinDensity;
  readonly swatch: SkinSwatchPreview;
}

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

export interface DesignTokenBundle {
  readonly schemaVersion: 'moonwitness-design-tokens/v1';
  readonly defaultSkinId: BuiltinSkinId;
  readonly skins: readonly SkinMetadata[];
  readonly tokens: readonly DesignTokenEntry[];
}

export interface TokenParityReport {
  readonly valid: boolean;
  readonly missingLightVariables: readonly string[];
  readonly missingDarkVariables: readonly string[];
  readonly hasExternalCdnFonts: boolean;
}

export const DEFAULT_SKIN_ID: BuiltinSkinId = 'moonwitness-ink';

export const BUILTIN_SKINS: readonly SkinMetadata[] = Object.freeze([
  Object.freeze({
    id: 'moonwitness-ink',
    label: 'MoonWitness Ink',
    description: 'Signature zine and manga editorial aesthetic with warm paper and bold ink.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'light',
    defaultDensity: 'comfortable',
    swatch: Object.freeze({
      background: '#f3efe4',
      surface: '#fffdf6',
      foreground: '#0d0d0d',
      accent: '#ffe031',
    }),
  }),
  Object.freeze({
    id: 'moonwitness-compact',
    label: 'MoonWitness Compact',
    description: 'Dense operational skin with crisp neutral surfaces and tighter spacing.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['compact', 'comfortable'] as const),
    defaultMode: 'light',
    defaultDensity: 'compact',
    swatch: Object.freeze({
      background: '#f0eee9',
      surface: '#ffffff',
      foreground: '#111113',
      accent: '#00b8f0',
    }),
  }),
  Object.freeze({
    id: 'moonwitness-high-contrast',
    label: 'MoonWitness High Contrast',
    description: 'Accessibility-focused skin with maximum contrast and reinforced focus borders.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'light',
    defaultDensity: 'comfortable',
    swatch: Object.freeze({
      background: '#ffffff',
      surface: '#ffffff',
      foreground: '#000000',
      accent: '#ffd000',
    }),
  }),
  Object.freeze({
    id: 'moonwitness-riot',
    label: 'MoonWitness Riot',
    description:
      'High-impact punk zine and comic skin with stark contrast, heavy ink borders, and electric neon accents.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'dark',
    defaultDensity: 'comfortable',
    swatch: Object.freeze({
      background: '#09090b',
      surface: '#121216',
      foreground: '#f5efdf',
      accent: '#ff2e88',
    }),
  }),
]);

export const CORE_DESIGN_TOKENS: readonly DesignTokenEntry[] = Object.freeze([
  { name: 'paper-cream', cssVariable: '--mw-paper-cream', value: '#f3efe4', category: 'color' },
  { name: 'ink-black', cssVariable: '--mw-ink-black', value: '#0d0d0d', category: 'color' },
  { name: 'ink-panel', cssVariable: '--mw-ink-panel', value: '#17171a', category: 'color' },
  { name: 'signal-blue', cssVariable: '--mw-signal-blue', value: '#00b8f0', category: 'color' },
  { name: 'yellow', cssVariable: '--mw-yellow', value: '#ffe031', category: 'color' },
  { name: 'magenta', cssVariable: '--mw-magenta', value: '#ff2e88', category: 'color' },
  { name: 'violet', cssVariable: '--mw-violet', value: '#c084fc', category: 'color' },
  {
    name: 'background',
    cssVariable: '--mw-background',
    value: '#f3efe4',
    darkValue: '#0e0e10',
    category: 'color',
  },
  {
    name: 'foreground',
    cssVariable: '--mw-foreground',
    value: '#0d0d0d',
    darkValue: '#f3efe4',
    category: 'color',
  },
  {
    name: 'surface',
    cssVariable: '--mw-surface',
    value: '#fffdf6',
    darkValue: '#17171a',
    category: 'color',
  },
  {
    name: 'primary',
    cssVariable: '--mw-primary',
    value: '#ffe031',
    darkValue: '#ffe031',
    category: 'color',
  },
  { name: 'success', cssVariable: '--mw-success', value: '#166534', category: 'color' },
  { name: 'warning', cssVariable: '--mw-warning', value: '#facc15', category: 'color' },
  {
    name: 'error',
    cssVariable: '--mw-error',
    value: '#b42318',
    darkValue: '#f97066',
    category: 'color',
  },
  { name: 'info', cssVariable: '--mw-info', value: '#175cd3', category: 'color' },
  {
    name: 'font-display',
    cssVariable: '--mw-font-display',
    value: "'Anton', 'MoonWitness Grunge', Impact, 'Arial Narrow', sans-serif",
    category: 'typography',
  },
  {
    name: 'font-sans',
    cssVariable: '--mw-font-sans',
    value: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    category: 'typography',
  },
  {
    name: 'font-mono',
    cssVariable: '--mw-font-mono',
    value: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    category: 'typography',
  },
  { name: 'space-1', cssVariable: '--mw-space-1', value: '0.25rem', category: 'spacing' },
  { name: 'space-2', cssVariable: '--mw-space-2', value: '0.5rem', category: 'spacing' },
  { name: 'space-3', cssVariable: '--mw-space-3', value: '0.75rem', category: 'spacing' },
  { name: 'space-4', cssVariable: '--mw-space-4', value: '1rem', category: 'spacing' },
  { name: 'space-6', cssVariable: '--mw-space-6', value: '1.5rem', category: 'spacing' },
  { name: 'space-8', cssVariable: '--mw-space-8', value: '2rem', category: 'spacing' },
  { name: 'radius-sm', cssVariable: '--mw-radius-sm', value: '0.125rem', category: 'radius' },
  { name: 'radius-md', cssVariable: '--mw-radius-md', value: '0.25rem', category: 'radius' },
  { name: 'radius-lg', cssVariable: '--mw-radius-lg', value: '0.5rem', category: 'radius' },
  {
    name: 'shadow-ink',
    cssVariable: '--mw-shadow-ink',
    value: '3px 3px 0 0 var(--mw-ink)',
    category: 'shadow',
  },
  { name: 'motion-fast', cssVariable: '--mw-motion-fast', value: '120ms', category: 'motion' },
  { name: 'motion-normal', cssVariable: '--mw-motion-normal', value: '180ms', category: 'motion' },
  { name: 'layer-base', cssVariable: '--mw-layer-base', value: '0', category: 'layer' },
  { name: 'layer-dialog', cssVariable: '--mw-layer-dialog', value: '50', category: 'layer' },
  { name: 'layer-toast', cssVariable: '--mw-layer-toast', value: '70', category: 'layer' },
]);

const EXTERNAL_FONT_CDN_PATTERN =
  /https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|cdn\.jsdelivr\.net\/.*font)/iu;

export function parseTokensFromCss(cssSource: string, selector = ':root'): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockMatch = cssSource.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 'u'));
  if (!blockMatch || !blockMatch[1]) {
    return {};
  }
  const result: Record<string, string> = {};
  const matches = blockMatch[1].matchAll(/(--mw-[\w-]+)\s*:\s*([^;]+);/gu);
  for (const match of matches) {
    const varName = match[1]?.trim();
    const varValue = match[2]?.trim();
    if (varName && varValue) {
      result[varName] = varValue;
    }
  }
  return result;
}

export function exportDesignTokenBundle(
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): DesignTokenBundle {
  return {
    schemaVersion: 'moonwitness-design-tokens/v1',
    defaultSkinId: DEFAULT_SKIN_ID,
    skins: BUILTIN_SKINS,
    tokens,
  };
}

export function exportTokensToW3cJson(
  tokens: readonly DesignTokenEntry[] = CORE_DESIGN_TOKENS
): Record<string, Record<string, W3cDesignTokenNode>> {
  const grouped: Record<string, Record<string, W3cDesignTokenNode>> = {};
  for (const entry of tokens) {
    const group = grouped[entry.category] ?? {};
    grouped[entry.category] = group;
    const w3cType =
      entry.category === 'color'
        ? 'color'
        : entry.category === 'spacing' || entry.category === 'radius'
          ? 'dimension'
          : entry.category === 'motion'
            ? 'duration'
            : entry.category === 'typography'
              ? 'fontFamily'
              : 'string';
    group[entry.name] = {
      $value: entry.value,
      $type: w3cType,
      ...(entry.darkValue ? { $description: `dark: ${entry.darkValue}` } : {}),
    };
  }
  return grouped;
}

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

export function hasExternalCdnFontImport(cssSource: string): boolean {
  return EXTERNAL_FONT_CDN_PATTERN.test(cssSource);
}

export function getCssVariableRef(tokenName: string): string {
  return tokenName.startsWith('--mw-') ? `var(${tokenName})` : `var(--mw-${tokenName})`;
}

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
