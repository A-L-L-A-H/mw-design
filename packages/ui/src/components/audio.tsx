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
import { Button } from './button.js';
import { VolumeIcon } from '../icons/volume.js';
import { VolumeOffIcon } from '../icons/volume-off.js';
import {
  getGlobalAudioEnabled,
  persistSoundPreference,
  playCatalogSound,
  readSoundPreference,
  setGlobalAudioEnabled,
  subscribeAudioPreference,
  type SfxName,
} from '../lib/audio-runtime.js';

export type { SfxName } from '../lib/audio-runtime.js';

type SfxContextValue = {
  enabled: boolean;
  ready: boolean;
  setEnabled: (value: boolean) => void;
  play: (name: SfxName) => void;
};
const SfxContext = createContext<SfxContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => getGlobalAudioEnabled());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = readSoundPreference(window.localStorage);
      setEnabledState(stored);
      setGlobalAudioEnabled(stored);
    } catch {
      setEnabledState(false);
      setGlobalAudioEnabled(false);
    }
    const unsubscribe = subscribeAudioPreference((next) => setEnabledState(next));
    const activate = () => setReady(true);
    window.addEventListener('pointerdown', activate, { once: true, passive: true });
    window.addEventListener('keydown', activate, { once: true });
    return () => {
      unsubscribe();
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
    };
  }, []);
  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    setGlobalAudioEnabled(value);
    try {
      persistSoundPreference(window.localStorage, value);
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);
  const play = useCallback(
    (name: SfxName) => {
      if (!enabled || !ready || typeof window === 'undefined') return;
      playCatalogSound(name, enabled, ready, (source) => new Audio(source));
    },
    [enabled, ready]
  );
  const value = useMemo(
    () => ({ enabled, ready, setEnabled, play }),
    [enabled, ready, setEnabled, play]
  );
  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>;
}

export function useSfx() {
  const value = useContext(SfxContext);
  if (!value) throw new Error('useSfx must be used within SoundProvider.');
  return value;
}

export function SoundToggle() {
  const { enabled, setEnabled } = useSfx();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mw-ui-sound-toggle"
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute interface sounds' : 'Enable interface sounds'}
      onClick={() => setEnabled(!enabled)}
    >
      {enabled ? (
        <>
          <VolumeIcon className="mw-ui-sound-toggle-icon" aria-hidden="true" />
          <span className="mw-ui-sound-toggle-label">Sound on</span>
        </>
      ) : (
        <>
          <VolumeOffIcon className="mw-ui-sound-toggle-icon" aria-hidden="true" />
          <span className="mw-ui-sound-toggle-label">Sound off</span>
        </>
      )}
    </Button>
  );
}
