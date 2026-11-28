/** Typed RIOT skin palette mirrored from packages/ui/src/styles/tokens.css. */
export interface RiotPalette {
  readonly paper: string;
  readonly paperRaised: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly inkFaint: string;
  readonly muted: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly accent: string;
  readonly accentForeground: string;
  readonly focus: string;
  readonly magentaReadable: string;
  readonly cyanReadable: string;
  readonly yellowReadable: string;
  readonly violetReadable: string;
  readonly shadowInk: string;
  readonly shadowInkLarge: string;
  readonly shadowComic: string;
  readonly shadowAnimeImpact: string;
}

export const RIOT_PALETTE = {
  light: {
    paper: '#f5efdf',
    paperRaised: '#fff9eb',
    ink: '#0a0a0c',
    inkSoft: '#2d2d2a',
    inkFaint: '#2d2d2a',
    muted: '#e4dcc8',
    primary: '#ffe031',
    primaryForeground: '#0a0a0c',
    accent: '#ff2e88',
    accentForeground: '#0a0a0c',
    focus: '#a60e4f',
    magentaReadable: '#a60e4f',
    cyanReadable: '#006e92',
    yellowReadable: '#6b5500',
    violetReadable: '#6322cf',
    shadowInk: '4px 4px 0 0 #0a0a0c',
    shadowInkLarge: '7px 7px 0 0 #0a0a0c',
    shadowComic: '4px 4px 0 0 #0a0a0c',
    shadowAnimeImpact: '4px 4px 0 0 #0a0a0c, 8px 8px 0 0 #ff2e88',
  },
  dark: {
    paper: '#09090b',
    paperRaised: '#121216',
    ink: '#f5efdf',
    inkSoft: '#cfcabd',
    inkFaint: '#cfcabd',
    muted: '#1e1e24',
    primary: '#ff2e88',
    primaryForeground: '#0a0a0c',
    accent: '#ffe031',
    accentForeground: '#0a0a0c',
    focus: '#ffe031',
    magentaReadable: '#ff4d99',
    cyanReadable: '#00b8f0',
    yellowReadable: '#ffe031',
    violetReadable: '#c084fc',
    shadowInk: '4px 4px 0 0 #000000',
    shadowInkLarge: '7px 7px 0 0 #ff2e88',
    shadowComic: '4px 4px 0 0 #000000',
    shadowAnimeImpact: '4px 4px 0 0 #000000, 8px 8px 0 0 #00b8f0',
  },
} as const satisfies Record<'light' | 'dark', RiotPalette>;

export type RiotColorMode = keyof typeof RIOT_PALETTE;

/** Tailwind v4 @theme declarations for the RIOT palette, using runtime CSS tokens. */
export const RIOT_TAILWIND_THEME_PRESET = {
  colors: {
    'riot-paper': 'var(--mw-paper)',
    'riot-paper-raised': 'var(--mw-paper-raised)',
    'riot-ink': 'var(--mw-ink)',
    'riot-ink-soft': 'var(--mw-ink-soft)',
    'riot-muted': 'var(--mw-muted)',
    'riot-primary': 'var(--mw-primary)',
    'riot-accent': 'var(--mw-accent)',
    'riot-focus': 'var(--mw-focus)',
  },
  spacing: {
    'riot-frame': 'var(--mw-frame-width)',
    'riot-halftone': 'var(--mw-dna-halftone-size)',
  },
  boxShadow: {
    'riot-ink': 'var(--mw-shadow-ink)',
    'riot-ink-lg': 'var(--mw-shadow-ink-lg)',
    'riot-comic': 'var(--mw-shadow-comic)',
    'riot-anime-impact': 'var(--mw-shadow-anime-impact)',
  },
} as const;

export type RiotTailwindThemePreset = typeof RIOT_TAILWIND_THEME_PRESET;
