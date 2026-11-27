import { describe, expect, it } from 'bun:test';

import {
  BUILTIN_SKINS,
  CORE_DESIGN_TOKENS,
  DEFAULT_SKIN_ID,
  exportDesignTokenBundle,
  exportTailwindThemeExtend,
  exportTokensToCssVariables,
  exportTokensToW3cJson,
  getCssVariableRef,
  hasExternalCdnFontImport,
  parseTokensFromCss,
  verifyTokenParity,
} from '../src/index.js';

describe('@moonwitness/design-tokens', () => {
  it('exports CSS variables with 100% light/dark token parity and zero CDN font imports', () => {
    const css = exportTokensToCssVariables();
    const report = verifyTokenParity(css);
    expect(report.valid).toBe(true);
    expect(report.missingLightVariables).toEqual([]);
    expect(report.missingDarkVariables).toEqual([]);
    expect(report.hasExternalCdnFonts).toBe(false);

    const parsedLight = parseTokensFromCss(css, ':root');
    const parsedDark = parseTokensFromCss(css, '.dark');
    expect(Object.keys(parsedLight).length).toBe(CORE_DESIGN_TOKENS.length);
    expect(parsedDark['--mw-background']).toBe('#0e0e10');
  });

  it('detects external CDN font imports and missing CSS variables', () => {
    const cssWithCdn = `@import url('https://fonts.googleapis.com/css2?family=Anton');\n${exportTokensToCssVariables()}`;
    expect(hasExternalCdnFontImport(cssWithCdn)).toBe(true);
    expect(verifyTokenParity(cssWithCdn).valid).toBe(false);

    const emptyReport = verifyTokenParity(':root {}');
    expect(emptyReport.valid).toBe(false);
    expect(emptyReport.missingLightVariables.length).toBe(CORE_DESIGN_TOKENS.length);
  });

  it('exports W3C JSON, Tailwind theme extend, and DesignTokenBundle', () => {
    const bundle = exportDesignTokenBundle();
    expect(bundle.schemaVersion).toBe('moonwitness-design-tokens/v1');
    expect(bundle.defaultSkinId).toBe(DEFAULT_SKIN_ID);
    expect(bundle.skins.length).toBe(BUILTIN_SKINS.length);

    const w3c = exportTokensToW3cJson();
    expect(w3c.color?.['paper-cream']?.$value).toBe('#f3efe4');
    expect(w3c.color?.['paper-cream']?.$type).toBe('color');
    expect(w3c.typography?.['font-mono']?.$type).toBe('fontFamily');

    const tw = exportTailwindThemeExtend();
    expect(tw.colors['mw-primary']).toBe('var(--mw-primary)');
    expect(tw.spacing['mw-space-4']).toBe('var(--mw-space-4)');
    expect(tw.borderRadius['mw-radius-md']).toBe('var(--mw-radius-md)');
    expect(getCssVariableRef('primary')).toBe('var(--mw-primary)');
    expect(getCssVariableRef('--mw-primary')).toBe('var(--mw-primary)');
  });
});
