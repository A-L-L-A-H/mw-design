import type { SpriteClipMetadata } from '../components/sprite-player.js';

export type CharacterId = 'kuro-signal' | 'vesper-ink' | 'walter-white';

// mw-ww ("Walter White") expressions — calm, polite, absurdly serious about sweeping.
export const WALTER_EXPRESSIONS = [
  'calm',
  'sweeping',
  'gloating',
  'victorious',
] as const;

export type WalterExpression = (typeof WALTER_EXPRESSIONS)[number];

export const KURO_EXPRESSIONS = [
  'happy',
  'excited',
  'laughing',
  'angry',
  'confused',
  'thinking',
  'surprised',
  'sad',
  'crying',
  'sleepy',
  'curious',
  'celebrating',
  'embarrassed',
  'determined',
  'victory',
  'disappointed',
] as const;

export type KuroExpression = (typeof KURO_EXPRESSIONS)[number];

export const KURO_POSES = [
  'standing',
  'sitting',
  'walking',
  'running',
  'jumping',
  'waving',
  'pointing',
  'reading',
  'gaming',
  'working',
  'holding-objects',
  'celebrating',
] as const;

export type KuroPose = (typeof KURO_POSES)[number];

export const STATE_ILLUSTRATIONS = [
  'empty-dashboard',
  'no-search-results',
  'no-notifications',
  'empty-collection',
  'no-favorites',
  'no-messages',
  'no-activity',
  'first-time',
  'loading',
  'success',
  'error',
  'offline',
  'network-disconnected',
  'maintenance',
  'access-denied',
  'not-found',
  'unexpected-failure',
  'welcome',
  'onboarding',
  'discover',
  'explore',
  'profile',
  'achievement',
  'completion',
  'celebration',
] as const;

export type StateIllustrationSlug = (typeof STATE_ILLUSTRATIONS)[number];

export const STICKER_ASSETS = [
  'speech-bubble-shout',
  'speech-bubble-thought',
  'comic-boom',
  'lightning-bolt',
  'riot-star',
  'street-flame',
  'pixel-heart',
  'hand-arrow',
  'paint-splash',
  'motion-burst',
  'torn-tape-x',
  'graffiti-crown',
] as const;

export type StickerSlug = (typeof STICKER_ASSETS)[number];

export const GAME_ASSETS = [
  'avatar-kuro',
  'avatar-vesper',
  'avatar-frame-riot',
  'badge-signal-scout',
  'badge-archive-keeper',
  'badge-story-architect',
  'badge-zero-drift',
  'rank-rookie',
  'rank-vanguard',
  'rank-legend',
  'quest-banner',
  'reward-crate',
  'level-up-burst',
] as const;

export type GameAssetSlug = (typeof GAME_ASSETS)[number];

export const BACKGROUND_ASSETS = [
  'riot-street-alley',
  'riot-arcade-workbench',
  'halftone-paper-light',
  'halftone-ink-dark',
] as const;

export type BackgroundSlug = (typeof BACKGROUND_ASSETS)[number];

export type BrandMarkVariant = 'lockup' | 'symbol' | 'wordmark';
export type BrandMarkTone = 'dark' | 'light' | 'mono-dark' | 'mono-light';

export const KURO_CLIP_IDS = [
  'idle',
  'blink',
  'wave',
  'celebrate',
  'think',
  'loading',
  'success',
  'error',
] as const;

export type KuroClipId = (typeof KURO_CLIP_IDS)[number];

export const RIOT_ALLEY_SCENE_PATH = 'scenes/riot-alley-scene.json';
export const MOON_CITY_SCENE_PATH = 'scenes/moon-city-scene.json';

export const SCENE_PATHS = {
  'riot-alley': RIOT_ALLEY_SCENE_PATH,
  'moon-city': MOON_CITY_SCENE_PATH,
} as const;

export type SceneId = keyof typeof SCENE_PATHS;

export const EDITORIAL_ILLUSTRATIONS = [
  'auth-login-desktop',
  'auth-login-mobile',
  'board-masthead',
  'editorial-archive',
  'editorial-knowledge',
  'editorial-people',
  'editorial-rain',
  'editorial-signal',
  'editorial-stories',
  'home-hero-desktop',
  'home-hero-mobile',
  'moon-city-orbit',
  'story-workbench-masthead',
] as const;

export type EditorialIllustrationSlug = (typeof EDITORIAL_ILLUSTRATIONS)[number];

export const LEGACY_STATE_ILLUSTRATIONS = [
  'access-denied',
  'empty',
  'no-activity',
  'no-results',
  'not-found',
  'offline',
  'onboarding',
  'orbit-pattern',
] as const;

export type LegacyStateIllustrationSlug = (typeof LEGACY_STATE_ILLUSTRATIONS)[number];
export type LegacyStateTone = 'dark' | 'light';

export const MATERIAL_ASSETS = [
  'brush-strip-long',
  'brush-strip-short',
  'doodle-arrow',
  'doodle-bolt',
  'doodle-crown',
  'doodle-smiley',
  'doodle-star',
  'folded-corner',
  'ink-splatter-md',
  'ink-splatter-sm',
  'motif-cross-out',
  'motif-eye-target',
  'motif-globe-grid',
  'motif-moon-phases',
  'motif-orbit',
  'motif-underline',
  'paper-note',
  'scuffed-border',
  'stamp-outline',
  'tape-strip',
  'tile-halftone',
  'tile-scratch',
  'tile-speckle',
  'torn-corner-bl',
  'torn-corner-br',
  'torn-corner-tl',
  'torn-corner-tr',
  'torn-edge-bottom',
  'torn-edge-left',
  'torn-edge-right',
  'torn-edge-top',
] as const;

export type MaterialSlug = (typeof MATERIAL_ASSETS)[number];

export const SOUND_ASSETS = [
  'ambience-archive-quiet',
  'ambience-moon-city-night',
  'ambience-street-rain',
  'ambience-underground-hum',
  'ui-alert',
  'ui-signal',
  'ui-success',
] as const;

export type SoundSlug = (typeof SOUND_ASSETS)[number];

export const CREW_CLIP_IDS = ['idle', 'walk', 'turn', 'hair-move'] as const;

export type CrewClipId = (typeof CREW_CLIP_IDS)[number];

export interface UniverseAssetLookupOptions {
  readonly basePath?: string;
  readonly format?: 'webp' | 'png';
}

export interface CharacterClipLookupOptions {
  readonly basePath?: string;
  readonly fps?: number;
  readonly durationMs?: number;
  readonly loop?: boolean;
  readonly pingPong?: boolean;
  readonly width?: number;
  readonly height?: number;
}

export interface ResolvedUniverseImage {
  readonly path: string;
  readonly fallbackPath: string;
  readonly src: string;
  readonly fallbackSrc: string;
  readonly alt: string;
}

export interface ResolvedUniverseSound {
  readonly path: string;
  readonly src: string;
  readonly label: string;
  readonly format: 'wav';
}

export interface ResolvedCharacterClip extends SpriteClipMetadata {
  readonly characterId: 'kuro-signal';
  readonly clipId: KuroClipId;
  readonly framePaths: readonly string[];
  readonly fallbackPath: string;
}

export interface ResolvedCrewClip extends SpriteClipMetadata {
  readonly characterId: 'crew-01';
  readonly clipId: CrewClipId;
  readonly framePaths: readonly string[];
  readonly fallbackPath: string;
}

const RIOT_DIR = 'illustrations/riot-universe';
const WORDS = (slug: string) => slug.replaceAll('-', ' ');

const buildImage = (
  path: string,
  alt: string,
  basePath = '',
  fallbackPath = path
): ResolvedUniverseImage => {
  const src = resolveUniverseAsset(path, basePath);
  return {
    path,
    fallbackPath,
    src,
    fallbackSrc: fallbackPath === path ? src : resolveUniverseAsset(fallbackPath, basePath),
    alt,
  };
};

/** Resolve a canonical asset path against an optional app basePath (defaults to root '/'). */
export function resolveUniverseAsset(path: string, basePath = ''): string {
  if (/^(?:https?:|data:|blob:)/iu.test(path)) return path;
  let start = 0;
  while (start < path.length && path.charCodeAt(start) === 47) start++;
  const clean = start > 0 ? path.slice(start) : path;
  if (!basePath) return `/${clean}`;
  let end = basePath.length;
  while (end > 0 && basePath.charCodeAt(end - 1) === 47) end--;
  return `${end < basePath.length ? basePath.slice(0, end) : basePath}/${clean}`;
}

/** Resolve a character portrait asset (.webp primary with .png fallback). */
export function getCharacterPortrait(
  characterId: CharacterId,
  expression: KuroExpression | WalterExpression = 'determined',
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  if (characterId === 'walter-white') {
    const walterExpression: WalterExpression = (WALTER_EXPRESSIONS as readonly string[]).includes(expression)
      ? (expression as WalterExpression)
      : 'calm';
    const stem = `${RIOT_DIR}/characters/walter-white-expression-${walterExpression}`;
    const fallback = `${stem}.png`;
    return buildImage(
      opts.format === 'png' ? fallback : `${stem}.webp`,
      `Walter White (${WORDS(walterExpression)})`,
      opts.basePath,
      fallback
    );
  }
  const isVesper = characterId === 'vesper-ink';
  const stem = `${RIOT_DIR}/characters/${isVesper ? 'vesper-ink-portrait' : `kuro-signal-expression-${expression}`}`;
  const fallback = `${stem}.png`;
  return buildImage(
    opts.format === 'png' ? fallback : `${stem}.webp`,
    isVesper ? 'Vesper Ink character portrait' : `Kuro Signal (${WORDS(expression)})`,
    opts.basePath,
    fallback
  );
}

/** Resolve a character full-body pose asset (.webp primary with .png fallback). */
export function getCharacterPose(
  characterId: CharacterId,
  pose: KuroPose = 'standing',
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  if (characterId === 'vesper-ink') return getCharacterPortrait('vesper-ink', 'determined', opts);
  if (characterId === 'walter-white') return getCharacterPortrait('walter-white', 'sweeping', opts);
  const stem = `${RIOT_DIR}/characters/kuro-signal-pose-${pose}`;
  const fallback = `${stem}.png`;
  return buildImage(
    opts.format === 'png' ? fallback : `${stem}.webp`,
    `Kuro Signal ${WORDS(pose)} pose`,
    opts.basePath,
    fallback
  );
}

/** Resolve a state illustration asset (.webp). */
export function getStateIllustration(
  state: StateIllustrationSlug,
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(
    `${RIOT_DIR}/states/state-${state}.webp`,
    `${WORDS(state)} state illustration`,
    opts.basePath
  );
}

/** Resolve a sticker asset (.png). */
export function getStickerAsset(
  sticker: StickerSlug,
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(
    `${RIOT_DIR}/stickers/sticker-${sticker}.png`,
    `${WORDS(sticker)} sticker`,
    opts.basePath
  );
}

/** Resolve a game badge, rank, avatar, or reward asset (.png). */
export function getBadgeAsset(
  badge: GameAssetSlug,
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(`${RIOT_DIR}/game/${badge}.png`, `${WORDS(badge)} badge`, opts.basePath);
}

/** Resolve a background texture or scene backdrop asset (.webp). */
export function getBackgroundAsset(
  bg: BackgroundSlug,
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(
    `${RIOT_DIR}/backgrounds/bg-${bg}.webp`,
    `${WORDS(bg)} background`,
    opts.basePath
  );
}

/** Resolve a canonical MoonWitness brand mark (.svg). */
export function getBrandMarkAsset(
  variant: BrandMarkVariant = 'lockup',
  tone: BrandMarkTone = 'dark',
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  const path = `brand/moonwitness-${variant}-${tone}.svg`;
  const alt = variant === 'symbol' ? 'MoonWitness crown symbol' : 'MoonWitness';
  return buildImage(path, alt, opts.basePath);
}

/** Resolve an editorial masthead, hero, or storytelling illustration (.webp). */
export function getEditorialIllustration(
  slug: EditorialIllustrationSlug,
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(
    `illustrations/${slug}.webp`,
    `${WORDS(slug)} illustration`,
    opts.basePath
  );
}

/** Resolve a dark/light monochrome vector state illustration (.svg). */
export function getLegacyStateIllustration(
  slug: LegacyStateIllustrationSlug,
  tone: LegacyStateTone = 'dark',
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(
    `illustrations/${slug}-${tone}.svg`,
    `${WORDS(slug)} (${tone}) illustration`,
    opts.basePath
  );
}

/** Resolve a MoonWitness surface material, torn edge, doodle, or halftone tile (.svg). */
export function getMaterialAsset(
  material: MaterialSlug,
  opts: UniverseAssetLookupOptions = {}
): ResolvedUniverseImage {
  return buildImage(
    `materials/${material}.svg`,
    `${WORDS(material)} material`,
    opts.basePath
  );
}

/** Resolve a MoonWitness UI sound cue or ambient audio loop (.wav). */
export function getSoundAsset(
  sound: SoundSlug,
  opts: Pick<UniverseAssetLookupOptions, 'basePath'> = {}
): ResolvedUniverseSound {
  const path = `sounds/${sound}.wav`;
  return {
    path,
    src: resolveUniverseAsset(path, opts.basePath),
    label: `${WORDS(sound)} audio`,
    format: 'wav',
  };
}

/** Resolve a 4-frame sprite clip descriptor compatible with SpritePlayer. */
export function getCharacterClip(
  clipId: KuroClipId,
  opts: CharacterClipLookupOptions = {}
): ResolvedCharacterClip {
  const id = `kuro-signal-${clipId}`;
  const framePaths = ['01', '02', '03', '04'].map((f) => `animation/${id}/${id}-frame-${f}.png`);
  const frames = framePaths.map((p) => resolveUniverseAsset(p, opts.basePath));
  return {
    id,
    characterId: 'kuro-signal',
    clipId,
    framePaths,
    frames,
    fallbackPath: framePaths[0],
    fallbackAsset: frames[0],
    fps: opts.fps ?? 8,
    durationMs: opts.durationMs,
    loop: opts.loop ?? true,
    pingPong: opts.pingPong ?? true,
    width: opts.width ?? 512,
    height: opts.height ?? 512,
  };
}

/** Resolve a 4-frame vector animation clip for Crew 01 compatible with SpritePlayer. */
export function getCrewClip(
  clipId: CrewClipId,
  opts: CharacterClipLookupOptions = {}
): ResolvedCrewClip {
  const dir = clipId === 'hair-move' ? 'crew-01-hair' : `crew-01-${clipId}`;
  const stem = `crew-01-${clipId}`;
  const framePaths = ['01', '02', '03', '04'].map((f) => `animation/${dir}/${stem}-frame-${f}.svg`);
  const frames = framePaths.map((p) => resolveUniverseAsset(p, opts.basePath));
  return {
    id: stem,
    characterId: 'crew-01',
    clipId,
    framePaths,
    frames,
    fallbackPath: framePaths[0],
    fallbackAsset: frames[0],
    fps: opts.fps ?? 6,
    durationMs: opts.durationMs,
    loop: opts.loop ?? true,
    pingPong: opts.pingPong ?? true,
    width: opts.width ?? 256,
    height: opts.height ?? 384,
  };
}
