import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { URL } from 'node:url';
import {
  CORE_DESIGN_TOKENS,
  exportDesignTokenBundle,
  exportTailwindThemeExtend,
  exportTokensToCssVariables,
  exportTokensToW3cJson,
  parseTokensFromCss,
} from '../dist/token-exporter.js';

test('exportDesignTokenBundle includes all 8 builtin skins and core design tokens', () => {
  const bundle = exportDesignTokenBundle();
  assert.equal(bundle.schemaVersion, 'moonwitness-design-tokens/v1');
  assert.equal(bundle.defaultSkinId, 'moonwitness-ink');
  assert.equal(bundle.skins.length, 8);
  assert.ok(bundle.tokens.length >= 25);
});

test('exportTokensToW3cJson groups tokens by category with W3C $value and $type', () => {
  const w3c = exportTokensToW3cJson();
  assert.equal(w3c.color['paper-cream'].$value, '#f3efe4');
  assert.equal(w3c.color['paper-cream'].$type, 'color');
  assert.equal(w3c.spacing['space-4'].$value, '1rem');
  assert.equal(w3c.spacing['space-4'].$type, 'dimension');
  assert.equal(w3c.motion['motion-fast'].$type, 'duration');
});

test('exportTokensToCssVariables and exportTailwindThemeExtend emit deterministic CSS & Tailwind maps', () => {
  const cssOut = exportTokensToCssVariables(CORE_DESIGN_TOKENS);
  assert.match(cssOut, /:root\s*\{/);
  assert.match(cssOut, /--mw-paper-cream:\s*#f3efe4;/);
  assert.match(cssOut, /\.dark\s*\{[\s\S]*--mw-background:\s*#0e0e10;/);

  const tw = exportTailwindThemeExtend(CORE_DESIGN_TOKENS);
  assert.equal(tw.colors['mw-paper-cream'], 'var(--mw-paper-cream)');
  assert.equal(tw.spacing['mw-space-4'], 'var(--mw-space-4)');
  assert.equal(tw.borderRadius['mw-radius-md'], 'var(--mw-radius-md)');
});

test('parseTokensFromCss extracts --mw-* custom properties from tokens.css', async () => {
  const cssSource = await readFile(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
  const rootMap = parseTokensFromCss(cssSource, ':root');
  assert.equal(rootMap['--mw-paper-cream'], '#f3efe4');
  assert.equal(rootMap['--mw-signal-blue'], '#00b8f0');
});
