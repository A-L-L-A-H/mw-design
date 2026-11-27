'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SkinDensity, SkinId } from './types.js';

export const DEFAULT_THEME_STORAGE_KEY = 'mw-ui-theme';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface ThemeState {
  mode: ThemeMode;
  skin: SkinId;
  density: SkinDensity;
}

export interface ThemeContextValue extends ThemeState {
  setMode: (mode: ThemeMode) => void;
  setSkin: (skin: SkinId) => void;
  setDensity: (density: SkinDensity) => void;
  toggleDark: () => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultSkin?: SkinId;
  defaultDensity?: SkinDensity;
  storageKey?: string;
  targetElement?: HTMLElement | null;
}

const DEFAULT_THEME_STATE: ThemeState = {
  mode: 'light',
  skin: 'moonwitness-ink',
  density: 'comfortable',
};

export function applyThemeState(
  state: ThemeState,
  root: HTMLElement | null = typeof document !== 'undefined' ? document.documentElement : null
): void {
  if (!root) return;
  root.dataset.theme = state.mode;
  root.dataset.skin = state.skin;
  root.dataset.density = state.density;
  root.classList.toggle('dark', state.mode === 'dark');
  root.classList.toggle('high-contrast', state.mode === 'high-contrast');
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(storageKey: string | undefined, fallback: ThemeState): ThemeState {
  if (!storageKey || typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    const mode: ThemeMode =
      parsed.mode === 'light' || parsed.mode === 'dark' || parsed.mode === 'high-contrast'
        ? parsed.mode
        : fallback.mode;
    const density: SkinDensity =
      parsed.density === 'compact' || parsed.density === 'comfortable'
        ? parsed.density
        : fallback.density;
    const skin: SkinId = typeof parsed.skin === 'string' && parsed.skin ? parsed.skin : fallback.skin;
    return { mode, skin, density };
  } catch {
    return fallback;
  }
}

export function ThemeProvider({
  children,
  defaultMode = DEFAULT_THEME_STATE.mode,
  defaultSkin = DEFAULT_THEME_STATE.skin,
  defaultDensity = DEFAULT_THEME_STATE.density,
  storageKey,
  targetElement,
}: ThemeProviderProps) {
  const [state, setState] = useState<ThemeState>(() =>
    readStoredTheme(storageKey, {
      mode: defaultMode,
      skin: defaultSkin,
      density: defaultDensity,
    })
  );

  useEffect(() => {
    const root = targetElement ?? (typeof document !== 'undefined' ? document.documentElement : null);
    applyThemeState(state, root);
    if (storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Ignore storage quota / private mode failures.
      }
    }
  }, [state, storageKey, targetElement]);

  const setMode = useCallback((mode: ThemeMode) => {
    setState((current) => ({ ...current, mode }));
  }, []);

  const setSkin = useCallback((skin: SkinId) => {
    setState((current) => ({ ...current, skin }));
  }, []);

  const setDensity = useCallback((density: SkinDensity) => {
    setState((current) => ({ ...current, density }));
  }, []);

  const toggleDark = useCallback(() => {
    setState((current) => ({ ...current, mode: current.mode === 'dark' ? 'light' : 'dark' }));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setMode,
      setSkin,
      setDensity,
      toggleDark,
    }),
    [state, setMode, setSkin, setDensity, toggleDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
}
