import { describe, expect, it } from 'bun:test';

import { RIOT_PALETTE, RIOT_TAILWIND_THEME_PRESET } from '../src/riot-palette.js';

describe('RIOT palette exports', () => {
  it('matches the light and dark RIOT skin values', () => {
    expect(RIOT_PALETTE.light.primary).toBe('#ffe031');
    expect(RIOT_PALETTE.light.accent).toBe('#ff2e88');
    expect(RIOT_PALETTE.dark.paper).toBe('#09090b');
    expect(RIOT_PALETTE.dark.primary).toBe('#ff2e88');
    expect(RIOT_PALETTE.dark.accent).toBe('#ffe031');
  });

  it('provides a Tailwind v4 theme preset backed by runtime tokens', () => {
    expect(RIOT_TAILWIND_THEME_PRESET.colors['riot-primary']).toBe('var(--mw-primary)');
    expect(RIOT_TAILWIND_THEME_PRESET.boxShadow['riot-anime-impact']).toBe(
      'var(--mw-shadow-anime-impact)',
    );
  });
});
