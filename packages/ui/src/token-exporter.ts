import { BUILTIN_SKINS, DEFAULT_SKIN_ID, type SkinMetadata } from './themes/index.js';

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

export interface DesignTokenBundle {
  readonly schemaVersion: 'moonwitness-design-tokens/v1';
  readonly defaultSkinId: string;
  readonly skins: readonly SkinMetadata[];
  readonly tokens: readonly DesignTokenEntry[];
}

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
  {
    name: 'success',
    cssVariable: '--mw-success',
    value: '#166534',
    category: 'color',
  },
  {
    name: 'warning',
    cssVariable: '--mw-warning',
    value: '#facc15',
    category: 'color',
  },
  {
    name: 'error',
    cssVariable: '--mw-error',
    value: '#b42318',
    darkValue: '#f97066',
    category: 'color',
  },
  {
    name: 'info',
    cssVariable: '--mw-info',
    value: '#175cd3',
    category: 'color',
  },
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

export function parseTokensFromCss(
  cssSource: string,
  selector = ':root'
): Record<string, string> {
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
