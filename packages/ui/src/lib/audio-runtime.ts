export type SfxName = 'success' | 'alert' | 'signal';

export const SOUND_PREFERENCE_KEY = 'mw-ui-sound-enabled';

const catalog: Record<SfxName, string> = {
  success: '/sounds/ui-success.wav',
  alert: '/sounds/ui-alert.wav',
  signal: '/sounds/ui-signal.wav',
};

type SoundStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type AudioPlayback = {
  preload: string;
  volume: number;
  ended: boolean;
  onended: ((event: Event) => unknown) | null;
  play: () => Promise<unknown>;
};

let activeAudio: AudioPlayback | null = null;
let globalAudioEnabled = false;
const audioListeners = new Set<(enabled: boolean) => void>();

export function getGlobalAudioEnabled(): boolean {
  return globalAudioEnabled;
}

export function setGlobalAudioEnabled(enabled: boolean): void {
  const next = Boolean(enabled);
  if (globalAudioEnabled === next) return;
  globalAudioEnabled = next;
  for (const listener of audioListeners) {
    try {
      listener(next);
    } catch {
      // Ignore subscriber errors so audio bus notifications stay resilient.
    }
  }
}

export function subscribeAudioPreference(listener: (enabled: boolean) => void): () => void {
  audioListeners.add(listener);
  return () => {
    audioListeners.delete(listener);
  };
}

export function readSoundPreference(storage: SoundStorage): boolean {
  try {
    return storage.getItem(SOUND_PREFERENCE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistSoundPreference(storage: SoundStorage, enabled: boolean): void {
  try {
    storage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
  } catch {
    // Preference storage may be unavailable; the in-memory control still works.
  }
}

export function playCatalogSound(
  name: SfxName,
  enabled: boolean,
  ready: boolean,
  createAudio: (source: string) => AudioPlayback
): void {
  if (!enabled || !ready) return;
  if (activeAudio && !activeAudio.ended) return;
  try {
    const audio = createAudio(catalog[name]);
    activeAudio = audio;
    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null;
    };
    audio.preload = 'none';
    audio.volume = 0.32;
    void audio.play().catch(() => {
      if (activeAudio === audio) activeAudio = null;
    });
  } catch {
    activeAudio = null;
    // Missing audio never interrupts the action.
  }
}

export type ProceduralSfxPreset =
  | 'click-soft'
  | 'toggle-pop'
  | 'drawer-whoosh'
  | 'success-chime'
  | 'error-bonk'
  | 'hit-impact'
  | 'coin-pickup'
  | 'level-up'
  | 'dialogue-blip'
  | 'boing'
  | 'zip'
  | 'splat'
  | 'rimshot'
  | 'cut-in-slash'
  | 'boss-break'
  | 'gacha-fanfare'
  | 'trophy-unlock';

export const PROCEDURAL_SFX_PRESETS: readonly ProceduralSfxPreset[] = Object.freeze([
  'click-soft',
  'toggle-pop',
  'drawer-whoosh',
  'success-chime',
  'error-bonk',
  'hit-impact',
  'coin-pickup',
  'level-up',
  'dialogue-blip',
  'boing',
  'zip',
  'splat',
  'rimshot',
  'cut-in-slash',
  'boss-break',
  'gacha-fanfare',
  'trophy-unlock',
]);

type ToneSpec = {
  readonly type: OscillatorType;
  readonly startHz: number;
  readonly endHz: number;
  readonly durationSec: number;
  readonly gain: number;
};

const PROCEDURAL_TONES: Readonly<Record<ProceduralSfxPreset, ToneSpec>> = {
  'click-soft': { type: 'triangle', startHz: 520, endHz: 320, durationSec: 0.045, gain: 0.09 },
  'toggle-pop': { type: 'sine', startHz: 380, endHz: 680, durationSec: 0.075, gain: 0.11 },
  'drawer-whoosh': { type: 'sine', startHz: 180, endHz: 420, durationSec: 0.12, gain: 0.08 },
  'success-chime': { type: 'triangle', startHz: 523, endHz: 784, durationSec: 0.18, gain: 0.12 },
  'error-bonk': { type: 'sawtooth', startHz: 180, endHz: 95, durationSec: 0.16, gain: 0.1 },
  'hit-impact': { type: 'square', startHz: 190, endHz: 55, durationSec: 0.11, gain: 0.14 },
  'coin-pickup': { type: 'square', startHz: 988, endHz: 1318, durationSec: 0.14, gain: 0.1 },
  'level-up': { type: 'triangle', startHz: 440, endHz: 880, durationSec: 0.28, gain: 0.13 },
  'dialogue-blip': { type: 'square', startHz: 460, endHz: 510, durationSec: 0.032, gain: 0.05 },
  boing: { type: 'sine', startHz: 190, endHz: 560, durationSec: 0.22, gain: 0.14 },
  zip: { type: 'sawtooth', startHz: 320, endHz: 1400, durationSec: 0.1, gain: 0.09 },
  splat: { type: 'sawtooth', startHz: 260, endHz: 70, durationSec: 0.15, gain: 0.12 },
  rimshot: { type: 'triangle', startHz: 620, endHz: 210, durationSec: 0.16, gain: 0.12 },
  'cut-in-slash': { type: 'sawtooth', startHz: 980, endHz: 140, durationSec: 0.24, gain: 0.16 },
  'boss-break': { type: 'square', startHz: 280, endHz: 42, durationSec: 0.34, gain: 0.17 },
  'gacha-fanfare': { type: 'triangle', startHz: 587, endHz: 1175, durationSec: 0.32, gain: 0.14 },
  'trophy-unlock': { type: 'triangle', startHz: 659, endHz: 1318, durationSec: 0.26, gain: 0.13 },
};

let sharedAudioCtx: AudioContext | null = null;

export function playProceduralSfx(
  preset: ProceduralSfxPreset,
  enabled: boolean,
  ready = true,
  pitchMultiplier = 1
): boolean {
  if (!enabled || !ready) return false;
  if (typeof window === 'undefined') return false;
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return false;
  const spec = PROCEDURAL_TONES[preset];
  if (!spec) return false;
  const pitch = Number.isFinite(pitchMultiplier) ? Math.min(2.2, Math.max(0.4, pitchMultiplier)) : 1;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtor();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => {});
    }
    const now = sharedAudioCtx.currentTime;
    const osc = sharedAudioCtx.createOscillator();
    const gainNode = sharedAudioCtx.createGain();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(Math.max(24, spec.startHz * pitch), now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, spec.endHz * pitch),
      now + spec.durationSec
    );
    gainNode.gain.setValueAtTime(spec.gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + spec.durationSec);
    osc.connect(gainNode);
    gainNode.connect(sharedAudioCtx.destination);
    osc.start(now);
    osc.stop(now + spec.durationSec + 0.01);
    return true;
  } catch {
    return false;
  }
}
