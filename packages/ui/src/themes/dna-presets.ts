import type { BuiltinSkinId, SkinDensity } from './types.js';
import type { ThemeMode } from './provider.js';
import type { MotionProfile } from '../motion/physics.js';

export type GenreDnaPresetId =
  | 'signal-riot-zine'
  | 'shonen-anime'
  | 'arcade-fighter'
  | 'cozy-jrpg'
  | 'saturday-cartoon';

export interface GenreDnaPreset {
  readonly id: GenreDnaPresetId;
  readonly label: string;
  readonly badge: string;
  readonly description: string;
  readonly skin: BuiltinSkinId;
  readonly mode: ThemeMode;
  readonly density: SkinDensity;
  readonly motionProfile: MotionProfile;
  readonly dnaAttribute: GenreDnaPresetId;
}

export const GENRE_DNA_PRESETS: readonly GenreDnaPreset[] = Object.freeze([
  Object.freeze({
    id: 'signal-riot-zine',
    label: 'Signal Riot Zine',
    badge: 'ZINE',
    description: 'Razor ink borders, Ben-Day halftone, electric magenta & canary punch.',
    skin: 'moonwitness-riot',
    mode: 'dark',
    density: 'comfortable',
    motionProfile: 'expressive',
    dnaAttribute: 'signal-riot-zine',
  }),
  Object.freeze({
    id: 'shonen-anime',
    label: 'Shonen Anime',
    badge: 'ANIME',
    description: 'Manga ink paper, kinetic diagonal cut-ins, speedlines, and 12fps snaps.',
    skin: 'moonwitness-ink',
    mode: 'light',
    density: 'comfortable',
    motionProfile: 'cartoon',
    dnaAttribute: 'shonen-anime',
  }),
  Object.freeze({
    id: 'arcade-fighter',
    label: 'Arcade Fighter',
    badge: 'ARCADE',
    description: 'Obsidian cyber-cabinet HUD, skewed combo meters, scanlines, and chromatic hit.',
    skin: 'arcade-neon',
    mode: 'dark',
    density: 'compact',
    motionProfile: 'expressive',
    dnaAttribute: 'arcade-fighter',
  }),
  Object.freeze({
    id: 'cozy-jrpg',
    label: 'Cozy JRPG',
    badge: 'JRPG',
    description: 'Warm storybook parchment, gilded quest crests, and gentle dialogue cadence.',
    skin: 'cozy-rpg',
    mode: 'light',
    density: 'comfortable',
    motionProfile: 'subtle',
    dnaAttribute: 'cozy-jrpg',
  }),
  Object.freeze({
    id: 'saturday-cartoon',
    label: 'Saturday Cartoon',
    badge: 'TOON',
    description: 'Chunky cel-shaded ink outlines, squash-stretch springs, and starburst SFX.',
    skin: 'cartoon-pop',
    mode: 'light',
    density: 'comfortable',
    motionProfile: 'cartoon',
    dnaAttribute: 'saturday-cartoon',
  }),
]);

export function getGenreDnaPresetById(id?: string | null): GenreDnaPreset | undefined {
  if (!id) return undefined;
  return GENRE_DNA_PRESETS.find((preset) => preset.id === id);
}

export function applyGenreDnaAttribute(
  presetId: GenreDnaPresetId | null,
  root: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
  if (!root) return;
  if (!presetId) {
    delete root.dataset.dna;
    return;
  }
  root.dataset.dna = presetId;
}
