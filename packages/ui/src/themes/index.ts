import {
  isSkinMetadata,
  type BuiltinSkinId,
  type ColorMode,
  type SkinDensity,
  type SkinId,
  type SkinMetadata,
  type ThemeRegistry,
  type UserThemePreferences,
} from './types.js';

export type {
  BuiltinSkinId,
  ColorMode,
  SkinDensity,
  SkinId,
  SkinMetadata,
  SkinSwatchPreview,
  ThemeRegistry,
  UserThemePreferences,
} from './types.js';
export {
  DEFAULT_THEME_STORAGE_KEY,
  ThemeProvider,
  useTheme,
  applyThemeState,
  type ThemeContextValue,
  type ThemeMode,
  type ThemeProviderProps,
  type ThemeState,
} from './provider.js';
export {
  GENRE_DNA_PRESETS,
  getGenreDnaPresetById,
  applyGenreDnaAttribute,
  type GenreDnaPreset,
  type GenreDnaPresetId,
} from './dna-presets.js';

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
  Object.freeze({
    id: 'cartoon-pop',
    label: 'Cartoon Pop',
    description:
      'Cel-shaded Saturday-morning cartoon palette with chunky ink outlines, rounded corners, and playful punch.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'light',
    defaultDensity: 'comfortable',
    swatch: Object.freeze({
      background: '#fff8e7',
      surface: '#ffffff',
      foreground: '#14132a',
      accent: '#ff5c5c',
    }),
  }),
  Object.freeze({
    id: 'arcade-neon',
    label: 'Arcade Neon',
    description:
      'High-contrast game HUD and cyber-arcade aesthetic with deep obsidian surfaces and electric cyan/magenta accents.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'dark',
    defaultDensity: 'compact',
    swatch: Object.freeze({
      background: '#080b14',
      surface: '#111728',
      foreground: '#eef6ff',
      accent: '#00e5ff',
    }),
  }),
  Object.freeze({
    id: 'clean-motion',
    label: 'Clean Motion',
    description:
      'Refined modern web and SaaS product skin with crisp neutral elevation, smooth radii, and tactile micro-motion.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'light',
    defaultDensity: 'comfortable',
    swatch: Object.freeze({
      background: '#f8fafc',
      surface: '#ffffff',
      foreground: '#0f172a',
      accent: '#2563eb',
    }),
  }),
  Object.freeze({
    id: 'cozy-rpg',
    label: 'Cozy RPG',
    description:
      'Warm storybook parchment and forest-gold journal aesthetic crafted for RPG menus, quests, and dialogue.',
    supportedModes: Object.freeze(['light', 'dark'] as const),
    supportedDensities: Object.freeze(['comfortable', 'compact'] as const),
    defaultMode: 'light',
    defaultDensity: 'comfortable',
    swatch: Object.freeze({
      background: '#f6eedc',
      surface: '#fdf9ef',
      foreground: '#261b12',
      accent: '#d97706',
    }),
  }),
]);

function validateSkinMetadata(skin: SkinMetadata): void {
  if (!isSkinMetadata(skin)) {
    throw new Error('Invalid skin metadata.');
  }
}

export function createThemeRegistry(
  initialSkins: readonly SkinMetadata[] = BUILTIN_SKINS,
  defaultSkinId: SkinId = DEFAULT_SKIN_ID
): ThemeRegistry {
  const skins = new Map<string, SkinMetadata>();

  const register = (skin: SkinMetadata): void => {
    validateSkinMetadata(skin);
    if (skins.has(skin.id)) {
      throw new Error(`Duplicate skin id "${skin.id}" cannot be registered twice.`);
    }
    skins.set(skin.id, Object.freeze({ ...skin }));
  };

  for (const skin of initialSkins) {
    register(skin);
  }

  if (!skins.has(defaultSkinId)) {
    throw new Error(`Default skin "${defaultSkinId}" is not registered.`);
  }

  const get = (id: string): SkinMetadata | undefined => skins.get(id);

  const resolve = (id?: string | null): SkinMetadata => {
    if (typeof id === 'string' && skins.has(id)) {
      return skins.get(id)!;
    }
    return skins.get(defaultSkinId)!;
  };

  const list = (): readonly SkinMetadata[] => Array.from(skins.values());

  const has = (id: string): boolean => skins.has(id);

  const isModeSupported = (skinId: string, mode: ColorMode): boolean =>
    resolve(skinId).supportedModes.includes(mode);

  const isDensitySupported = (skinId: string, density: SkinDensity): boolean =>
    resolve(skinId).supportedDensities.includes(density);

  const normalizePreferences = (
    preferences?: Partial<UserThemePreferences> | null
  ): UserThemePreferences => {
    const resolvedSkin = resolve(preferences?.skin);
    const mode =
      preferences?.theme_mode && resolvedSkin.supportedModes.includes(preferences.theme_mode)
        ? preferences.theme_mode
        : resolvedSkin.defaultMode;
    const density =
      preferences?.density && resolvedSkin.supportedDensities.includes(preferences.density)
        ? preferences.density
        : resolvedSkin.defaultDensity;
    return {
      skin: resolvedSkin.id,
      theme_mode: mode,
      density,
    };
  };

  return {
    defaultSkinId,
    register,
    get,
    resolve,
    list,
    has,
    isModeSupported,
    isDensitySupported,
    normalizePreferences,
  };
}

export const themeRegistry: ThemeRegistry = createThemeRegistry(BUILTIN_SKINS, DEFAULT_SKIN_ID);

export interface SkinInitScriptOptions {
  storageKey?: string;
}

export function createSkinInitScript(options: SkinInitScriptOptions = {}): string {
  const skinIds = JSON.stringify(themeRegistry.list().map((skin) => skin.id));
  const primaryKey = JSON.stringify(options.storageKey ?? 'mw-ui-theme');
  return `(function(){try{var raw=localStorage.getItem(${primaryKey})||localStorage.getItem('mw-board-preferences');var p=raw?JSON.parse(raw):null;var k=p&&typeof p.skin==='string'?p.skin:'${DEFAULT_SKIN_ID}';var allowed=${skinIds};if(allowed.indexOf(k)===-1)k='${DEFAULT_SKIN_ID}';var d=p&&p.density==='compact'?'compact':'comfortable';var rawMode=p&&(p.mode||p.theme);var m=(rawMode==='dark'||rawMode==='light'||rawMode==='high-contrast')?rawMode:(localStorage.getItem('mw-theme')==='dark'?'dark':'light');var r=document.documentElement;r.dataset.skin=k;r.dataset.density=d;r.dataset.theme=m;r.classList.toggle('dark',m==='dark');r.classList.toggle('high-contrast',m==='high-contrast');}catch(e){}})();`;
}
