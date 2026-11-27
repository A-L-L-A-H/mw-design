import type { CartoonRigMood, CartoonRigPose, OnomatopoeiaTone } from '@moonwitness/ui/cartoon';
import type { ProceduralSfxPreset, ScreenFXKind } from '@moonwitness/ui/motion';

export type ShakePattern =
  | 'quake'
  | 'horizontal'
  | 'vertical'
  | 'tremor'
  | 'whiplash'
  | 'rumble';

export type RumbleShakeCategory = 'all' | 'impact' | 'sustained' | 'cinematic';

export type FlashFrameMode = 'impact-bw' | 'whiteout' | 'invert-negative' | 'chromatic-split';

export type ParticleBurstKind = 'sparks' | 'sakura' | 'volt' | 'stars' | 'ink';

export type StageBackdropMode = 'arena-dark' | 'manga-halftone' | 'speedlines';

export type AnimeFxComboId =
  | 'heavy-finisher'
  | 'parry-counter'
  | 'electric-awakening'
  | 'manga-slam';

export interface ShakeFrame {
  readonly x: number;
  readonly y: number;
  readonly rotateDeg: number;
}

export interface RumbleShakePreset {
  readonly id: string;
  readonly name: string;
  readonly shortLabel: string;
  readonly category: Exclude<RumbleShakeCategory, 'all'>;
  readonly pattern: ShakePattern;
  readonly intensityPx: number;
  readonly durationMs: number;
  readonly frequency: number;
  readonly hitstopMs: number;
  readonly sustained?: boolean;
  readonly description: string;
  readonly sfx: ProceduralSfxPreset;
}

export interface FlashPhase {
  readonly active: boolean;
  readonly frameIndex: number;
  readonly polarity: 'dark' | 'light' | 'none';
}

export interface FxParticle {
  readonly id: string;
  readonly kind: ParticleBurstKind;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly size: number;
  readonly rotation: number;
  readonly vr: number;
  readonly age: number;
  readonly lifeSec: number;
  readonly gravity: number;
  readonly drag: number;
  readonly swayFreq: number;
  readonly swayAmp: number;
  readonly toneIndex: 0 | 1 | 2;
}

export interface AnimeFxComboPreset {
  readonly id: AnimeFxComboId;
  readonly label: string;
  readonly subtitle: string;
  readonly shakePattern: ShakePattern;
  readonly shakeIntensity: number;
  readonly hitstopMs: number;
  readonly flashMode: FlashFrameMode;
  readonly flashFrames: number;
  readonly burstKind: ParticleBurstKind;
  readonly burstCount: number;
  readonly screenFx: ScreenFXKind;
  readonly onomatopoeia: string;
  readonly onomatopoeiaTone: OnomatopoeiaTone;
  readonly pose: CartoonRigPose;
  readonly mood: CartoonRigMood;
  readonly sfx: ProceduralSfxPreset;
}

export interface FxSnippetConfig {
  readonly characterId: string;
  readonly shakePattern: ShakePattern;
  readonly shakeIntensity: number;
  readonly shakeDurationMs?: number;
  readonly shakePresetId?: string | null;
  readonly hitstopMs: number;
  readonly flashMode: FlashFrameMode;
  readonly flashFrames: number;
  readonly burstKind: ParticleBurstKind;
  readonly burstCount: number;
  readonly reducedMotion: boolean;
}

export const SHAKE_PATTERN_OPTIONS: ReadonlyArray<{
  readonly id: ShakePattern;
  readonly label: string;
  readonly description: string;
}> = [
  { id: 'quake', label: 'Impact Quake', description: 'Omnidirectional shock with camera tilt' },
  { id: 'horizontal', label: 'Side Punch', description: 'Lateral knockback recoil along X-axis' },
  { id: 'vertical', label: 'Ground Slam', description: 'Heavy vertical drop and rebound bounce' },
  { id: 'whiplash', label: 'Diagonal Whip', description: 'Angled slash kick with pronounced roll' },
  { id: 'tremor', label: 'Power Tremor', description: 'High-frequency energy charge vibration' },
  { id: 'rumble', label: 'Seismic Rumble', description: 'Deep multi-harmonic rolling earthquake' },
];

export const RUMBLE_SHAKE_CATEGORIES: ReadonlyArray<{
  readonly id: RumbleShakeCategory;
  readonly label: string;
}> = [
  { id: 'all', label: 'All Presets' },
  { id: 'impact', label: 'Impact' },
  { id: 'sustained', label: 'Sustained' },
  { id: 'cinematic', label: 'Cinematic' },
];

export const RUMBLE_SHAKE_PRESETS: readonly RumbleShakePreset[] = [
  {
    id: 'subtle-footstep',
    name: 'Subtle Footstep',
    shortLabel: 'Footstep',
    category: 'cinematic',
    pattern: 'vertical',
    intensityPx: 5,
    durationMs: 220,
    frequency: 0.9,
    hitstopMs: 0,
    description: 'Light vertical micro-thud for landings, steps, or UI taps.',
    sfx: 'click-soft',
  },
  {
    id: 'quick-jab',
    name: 'Quick Jab',
    shortLabel: 'Jab',
    category: 'impact',
    pattern: 'horizontal',
    intensityPx: 10,
    durationMs: 240,
    frequency: 1.25,
    hitstopMs: 30,
    description: 'Fast lateral hit recoil for combo starters and light punches.',
    sfx: 'toggle-pop',
  },
  {
    id: 'katana-whiplash',
    name: 'Katana Whiplash',
    shortLabel: 'Whiplash',
    category: 'impact',
    pattern: 'whiplash',
    intensityPx: 16,
    durationMs: 340,
    frequency: 1.15,
    hitstopMs: 75,
    description: 'Diagonal anime slash snap with sharp angular camera kick.',
    sfx: 'impact-hit',
  },
  {
    id: 'seismic-slam',
    name: 'Seismic Slam',
    shortLabel: 'Slam',
    category: 'impact',
    pattern: 'vertical',
    intensityPx: 24,
    durationMs: 480,
    frequency: 1.0,
    hitstopMs: 120,
    description: 'Heavy vertical crater slam with deep rebound decay.',
    sfx: 'impact-hit',
  },
  {
    id: 'railgun-recoil',
    name: 'Railgun Recoil',
    shortLabel: 'Recoil',
    category: 'cinematic',
    pattern: 'horizontal',
    intensityPx: 22,
    durationMs: 420,
    frequency: 1.35,
    hitstopMs: 90,
    description: 'Explosive beam kickback throwing the camera horizontally.',
    sfx: 'impact-hit',
  },
  {
    id: 'power-charge',
    name: 'Power-Up Rumble',
    shortLabel: 'Charge',
    category: 'sustained',
    pattern: 'tremor',
    intensityPx: 9,
    durationMs: 1100,
    frequency: 1.75,
    hitstopMs: 0,
    sustained: true,
    description: 'High-frequency aura-charge vibration that can loop continuously.',
    sfx: 'toggle-pop',
  },
  {
    id: 'boss-roar',
    name: 'Boss Roar Quake',
    shortLabel: 'Roar',
    category: 'cinematic',
    pattern: 'quake',
    intensityPx: 20,
    durationMs: 720,
    frequency: 1.1,
    hitstopMs: 60,
    description: 'Prolonged omnidirectional shockwave with heavy rotational roll.',
    sfx: 'impact-hit',
  },
  {
    id: 'tectonic-rumble',
    name: 'Tectonic Rumble',
    shortLabel: 'Rumble',
    category: 'sustained',
    pattern: 'rumble',
    intensityPx: 14,
    durationMs: 1400,
    frequency: 0.85,
    hitstopMs: 0,
    sustained: true,
    description: 'Low-frequency multi-harmonic tremor for collapsing arenas.',
    sfx: 'impact-hit',
  },
];

export const CAMERA_QUICK_PRESET_IDS = [
  'quick-jab',
  'katana-whiplash',
  'seismic-slam',
  'power-charge',
  'boss-roar',
  'tectonic-rumble',
] as const;

export const FLASH_MODE_OPTIONS: ReadonlyArray<{
  readonly id: FlashFrameMode;
  readonly label: string;
  readonly description: string;
}> = [
  { id: 'impact-bw', label: 'B&W Impact Frame', description: '24fps alternating ink/paper flash' },
  { id: 'whiteout', label: 'Whiteout Flash', description: 'Peak-energy exposure bloom' },
  { id: 'invert-negative', label: 'Invert Negative', description: 'High-contrast silhouette inversion' },
  { id: 'chromatic-split', label: 'Chromatic Split', description: 'Cyan/magenta lens aberration pulse' },
];

export const PARTICLE_BURST_OPTIONS: ReadonlyArray<{
  readonly id: ParticleBurstKind;
  readonly label: string;
  readonly description: string;
}> = [
  { id: 'sparks', label: 'Impact Sparks', description: 'High-velocity radial embers & streaks' },
  { id: 'sakura', label: 'Sakura Petals', description: 'Drifting cel-shaded blossoms with sway' },
  { id: 'volt', label: 'Volt Arcs', description: 'Sharp electric shards snapping outward' },
  { id: 'stars', label: 'Starburst Shards', description: 'Spinning 4-point anime hit stars' },
  { id: 'ink', label: 'Ink Splatter', description: 'Heavy manga droplets with gravity arc' },
];

export const FX_COMBO_PRESETS: readonly AnimeFxComboPreset[] = [
  {
    id: 'heavy-finisher',
    label: 'Heavy Finisher',
    subtitle: 'Quake shake + 4f B&W impact + radial sparks + 95ms hitstop',
    shakePattern: 'quake',
    shakeIntensity: 18,
    hitstopMs: 95,
    flashMode: 'impact-bw',
    flashFrames: 4,
    burstKind: 'sparks',
    burstCount: 28,
    screenFx: 'speedlines-burst',
    onomatopoeia: 'BOOM!!',
    onomatopoeiaTone: 'impact',
    pose: 'attack',
    mood: 'fierce',
    sfx: 'impact-hit',
  },
  {
    id: 'parry-counter',
    label: 'Parry Counter',
    subtitle: 'Side punch recoil + whiteout flash + spinning hit stars',
    shakePattern: 'horizontal',
    shakeIntensity: 14,
    hitstopMs: 120,
    flashMode: 'whiteout',
    flashFrames: 3,
    burstKind: 'stars',
    burstCount: 22,
    screenFx: 'flash',
    onomatopoeia: 'CLANG!',
    onomatopoeiaTone: 'speed',
    pose: 'victory',
    mood: 'excited',
    sfx: 'success-chime',
  },
  {
    id: 'electric-awakening',
    label: 'Volt Awakening',
    subtitle: 'Power tremor + chromatic RGB split + jagged volt arcs',
    shakePattern: 'tremor',
    shakeIntensity: 11,
    hitstopMs: 60,
    flashMode: 'chromatic-split',
    flashFrames: 5,
    burstKind: 'volt',
    burstCount: 26,
    screenFx: 'chromatic-pulse',
    onomatopoeia: 'BZZZT!',
    onomatopoeiaTone: 'electric',
    pose: 'attack',
    mood: 'fierce',
    sfx: 'toggle-pop',
  },
  {
    id: 'manga-slam',
    label: 'Manga Ink Slam',
    subtitle: 'Ground slam + negative invert frame + ink splatter burst',
    shakePattern: 'vertical',
    shakeIntensity: 22,
    hitstopMs: 110,
    flashMode: 'invert-negative',
    flashFrames: 3,
    burstKind: 'ink',
    burstCount: 24,
    screenFx: 'speedlines-burst',
    onomatopoeia: 'DOOM!',
    onomatopoeiaTone: 'comic',
    pose: 'hurt',
    mood: 'shocked',
    sfx: 'impact-hit',
  },
];

export const FX_LAB_CHARACTER_IDS = [
  'kuro-signal',
  'vesper-neon',
  'akira-volt',
  'nova-flare',
  'lord-null',
] as const;

export const MAX_ACTIVE_PARTICLES = 72;

function createSeededRng(seed: number): () => number {
  let state = (Math.floor(seed) >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function clampFxNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function filterRumbleShakePresets(
  category: RumbleShakeCategory
): readonly RumbleShakePreset[] {
  if (category === 'all') return RUMBLE_SHAKE_PRESETS;
  return RUMBLE_SHAKE_PRESETS.filter((preset) => preset.category === category);
}

export function getRumbleShakePresetById(id: string | null | undefined): RumbleShakePreset | null {
  if (!id) return null;
  return RUMBLE_SHAKE_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function computeShakeFrame(
  progress: number,
  pattern: ShakePattern,
  intensityPx: number,
  seed = 1,
  options?: { readonly frequency?: number; readonly continuous?: boolean }
): ShakeFrame {
  const amp = clampFxNumber(intensityPx, 0, 36);
  const continuous = Boolean(options?.continuous);
  const freq = clampFxNumber(options?.frequency ?? 1, 0.4, 2.5);
  const t = continuous ? Math.max(0, progress) : clampFxNumber(progress, 0, 1);

  if ((!continuous && t >= 1) || amp <= 0) {
    return { x: 0, y: 0, rotateDeg: 0 };
  }

  const decay = continuous ? 1 : Math.pow(1 - t, 1.75);
  const baseCycles = pattern === 'tremor' ? 24 : pattern === 'rumble' ? 10 : 12;
  const phase = t * Math.PI * baseCycles * freq + seed * 1.37;

  if (pattern === 'horizontal') {
    const x = Math.sin(phase) * amp * decay;
    const y = Math.cos(phase * 1.7) * amp * 0.16 * decay;
    const rotateDeg = Math.sin(phase) * (amp / 10) * decay;
    return { x, y, rotateDeg };
  }

  if (pattern === 'vertical') {
    const x = Math.cos(phase * 1.3) * amp * 0.14 * decay;
    const y = Math.sin(phase) * amp * decay;
    const rotateDeg = Math.sin(phase * 0.8) * (amp / 14) * decay;
    return { x, y, rotateDeg };
  }

  if (pattern === 'whiplash') {
    const whipDecay = continuous ? 1 : Math.pow(1 - t, 2.1);
    const impulse = Math.sin(phase * 0.9) * amp * whipDecay;
    const x = impulse * 0.92;
    const y = -impulse * 0.72 + Math.cos(phase * 1.8) * amp * 0.18 * whipDecay;
    const rotateDeg = Math.sin(phase * 0.9) * (amp / 3.8) * whipDecay;
    return { x, y, rotateDeg };
  }

  if (pattern === 'tremor') {
    const tremorDecay = continuous ? 1 : Math.pow(1 - t, 0.85);
    const x = Math.sin(phase * 1.55) * amp * 0.65 * tremorDecay;
    const y = Math.cos(phase * 1.95) * amp * 0.65 * tremorDecay;
    const rotateDeg = Math.sin(phase * 1.25) * (amp / 16) * tremorDecay;
    return { x, y, rotateDeg };
  }

  if (pattern === 'rumble') {
    const rumbleDecay = continuous ? 1 : Math.pow(1 - t, 0.65);
    const lowX = Math.sin(phase * 0.65) * 0.65 + Math.sin(phase * 1.9) * 0.35;
    const lowY = Math.cos(phase * 0.52) * 0.6 + Math.sin(phase * 2.25) * 0.4;
    const x = lowX * amp * 0.85 * rumbleDecay;
    const y = lowY * amp * 0.9 * rumbleDecay;
    const rotateDeg = Math.sin(phase * 0.6) * (amp / 7.5) * rumbleDecay;
    return { x, y, rotateDeg };
  }

  // Default: omnidirectional quake
  const x = Math.sin(phase * 1.15) * amp * decay;
  const y = Math.cos(phase * 1.65) * amp * 0.85 * decay;
  const rotateDeg = Math.sin(phase * 0.95) * (amp / 6.5) * decay;
  return { x, y, rotateDeg };
}

export function buildShakeWaveformPoints(
  pattern: ShakePattern,
  intensityPx: number,
  frequency = 1,
  continuous = false,
  steps = 28
): string {
  const width = 120;
  const height = 28;
  const midY = height / 2;
  const maxAmp = Math.max(1, intensityPx);
  const count = Math.max(8, Math.min(64, Math.round(steps)));
  const points: string[] = [];

  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const frame = computeShakeFrame(t, pattern, intensityPx, 2, { frequency, continuous });
    const primary =
      pattern === 'vertical'
        ? frame.y
        : pattern === 'horizontal'
          ? frame.x
          : (frame.x * 0.65 + frame.y * 0.65);
    const normalized = clampFxNumber(primary / maxAmp, -1, 1);
    const px = (t * width).toFixed(1);
    const py = (midY - normalized * (height * 0.42)).toFixed(1);
    points.push(`${px},${py}`);
  }

  return points.join(' ');
}

export function computeFlashFramePhase(
  elapsedMs: number,
  frameCount: number,
  frameDurationMs = 42
): FlashPhase {
  const totalFrames = Math.round(clampFxNumber(frameCount, 1, 8));
  const safeFrameMs = Math.max(16, frameDurationMs);
  if (elapsedMs < 0) {
    return { active: false, frameIndex: -1, polarity: 'none' };
  }
  const frameIndex = Math.floor(elapsedMs / safeFrameMs);
  if (frameIndex >= totalFrames) {
    return { active: false, frameIndex: -1, polarity: 'none' };
  }
  return {
    active: true,
    frameIndex,
    polarity: frameIndex % 2 === 0 ? 'dark' : 'light',
  };
}

export function generateParticleBurst(options: {
  readonly kind: ParticleBurstKind;
  readonly count: number;
  readonly originX: number;
  readonly originY: number;
  readonly spreadSpeed?: number;
  readonly seed?: number;
}): FxParticle[] {
  const count = Math.round(clampFxNumber(options.count, 6, 44));
  const spreadSpeed = clampFxNumber(options.spreadSpeed ?? 1, 0.4, 2.2);
  const seed = options.seed ?? 1;
  const rng = createSeededRng(seed * 7919 + count * 31);
  const particles: FxParticle[] = [];

  for (let i = 0; i < count; i += 1) {
    const baseAngle = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.42;
    const toneIndex = (i % 3) as 0 | 1 | 2;

    if (options.kind === 'sakura') {
      const speed = (65 + rng() * 125) * spreadSpeed;
      particles.push({
        id: `p-${seed}-${i}`,
        kind: 'sakura',
        x: options.originX + (rng() - 0.5) * 24,
        y: options.originY + (rng() - 0.5) * 18,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed - 48,
        size: 8 + rng() * 6,
        rotation: rng() * 360,
        vr: (rng() - 0.5) * 260,
        age: 0,
        lifeSec: 1.05 + rng() * 0.55,
        gravity: 95,
        drag: 0.96,
        swayFreq: 4.5 + rng() * 3.5,
        swayAmp: 36 + rng() * 24,
        toneIndex,
      });
      continue;
    }

    if (options.kind === 'volt') {
      const speed = (180 + rng() * 220) * spreadSpeed;
      particles.push({
        id: `p-${seed}-${i}`,
        kind: 'volt',
        x: options.originX,
        y: options.originY,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed,
        size: 11 + rng() * 8,
        rotation: (baseAngle * 180) / Math.PI,
        vr: (rng() - 0.5) * 120,
        age: 0,
        lifeSec: 0.38 + rng() * 0.24,
        gravity: 0,
        drag: 0.9,
        swayFreq: 18,
        swayAmp: 12,
        toneIndex,
      });
      continue;
    }

    if (options.kind === 'ink') {
      const speed = (110 + rng() * 190) * spreadSpeed;
      particles.push({
        id: `p-${seed}-${i}`,
        kind: 'ink',
        x: options.originX,
        y: options.originY,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed - 70,
        size: 7 + rng() * 9,
        rotation: rng() * 360,
        vr: (rng() - 0.5) * 180,
        age: 0,
        lifeSec: 0.72 + rng() * 0.36,
        gravity: 460,
        drag: 0.95,
        swayFreq: 0,
        swayAmp: 0,
        toneIndex,
      });
      continue;
    }

    if (options.kind === 'stars') {
      const speed = (120 + rng() * 180) * spreadSpeed;
      particles.push({
        id: `p-${seed}-${i}`,
        kind: 'stars',
        x: options.originX,
        y: options.originY,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed - 35,
        size: 10 + rng() * 8,
        rotation: rng() * 360,
        vr: (rng() > 0.5 ? 1 : -1) * (180 + rng() * 240),
        age: 0,
        lifeSec: 0.68 + rng() * 0.34,
        gravity: 170,
        drag: 0.94,
        swayFreq: 0,
        swayAmp: 0,
        toneIndex,
      });
      continue;
    }

    // Default: high-velocity impact sparks
    const speed = (170 + rng() * 240) * spreadSpeed;
    particles.push({
      id: `p-${seed}-${i}`,
      kind: 'sparks',
      x: options.originX,
      y: options.originY,
      vx: Math.cos(baseAngle) * speed,
      vy: Math.sin(baseAngle) * speed - 20,
      size: 9 + rng() * 7,
      rotation: (baseAngle * 180) / Math.PI,
      vr: 0,
      age: 0,
      lifeSec: 0.48 + rng() * 0.28,
      gravity: 240,
      drag: 0.92,
      swayFreq: 0,
      swayAmp: 0,
      toneIndex,
    });
  }

  return particles;
}

export function stepParticles(
  particles: readonly FxParticle[],
  dtSec: number,
  timeScale = 1
): FxParticle[] {
  const safeDt = clampFxNumber(dtSec, 0, 0.05) * clampFxNumber(timeScale, 0.1, 2);
  if (safeDt <= 0 || particles.length === 0) return [...particles];

  const next: FxParticle[] = [];
  const dragSteps = safeDt * 60;

  for (const particle of particles) {
    const age = particle.age + safeDt;
    if (age >= particle.lifeSec) continue;

    const dragFactor = Math.pow(particle.drag, dragSteps);
    const vx = particle.vx * dragFactor;
    const vy = (particle.vy + particle.gravity * safeDt) * dragFactor;
    const swayOffset =
      particle.swayAmp > 0
        ? Math.sin(age * particle.swayFreq) * particle.swayAmp * safeDt
        : 0;
    const x = particle.x + vx * safeDt + swayOffset;
    const y = particle.y + vy * safeDt;
    const rotation =
      particle.kind === 'sparks'
        ? (Math.atan2(vy, vx) * 180) / Math.PI
        : particle.rotation + particle.vr * safeDt;

    next.push({
      ...particle,
      x,
      y,
      vx,
      vy,
      rotation,
      age,
    });
  }

  return next.slice(-MAX_ACTIVE_PARTICLES);
}

export function buildFxSnippet(config: FxSnippetConfig): string {
  const screenFxMap: Record<FlashFrameMode, ScreenFXKind> = {
    'impact-bw': 'speedlines-burst',
    whiteout: 'flash',
    'invert-negative': 'vignette',
    'chromatic-split': 'chromatic-pulse',
  };
  const effect = screenFxMap[config.flashMode];
  const presetComment = config.shakePresetId
    ? ` {/* Rumble & Shake preset: ${config.shakePresetId} (${config.shakeDurationMs ?? 380}ms) */}`
    : '';
  return [
    `import { MotionStage, ScreenFXOverlay } from '@moonwitness/ui/motion';`,
    `import { CartoonRig, ImpactFlash, OnomatopoeiaSFX } from '@moonwitness/ui/cartoon';`,
    ``,
    `<MotionStage`,
    `  shakeIntensity={${config.reducedMotion ? 0 : config.shakeIntensity}}`,
    `  shakeSeed={burstTick}`,
    `  hitstopMs={${config.reducedMotion ? 0 : config.hitstopMs}}`,
    `  data-shake-pattern="${config.shakePattern}"${presetComment}`,
    `>`,
    `  <ScreenFXOverlay effect="${effect}" active={fxActive} />`,
    `  <ImpactFlash active={flashActive} /> {/* ${config.flashMode} · ${config.flashFrames}f @ 24fps */}`,
    `  <CartoonRig characterId="${config.characterId}" pose="attack" squashTrigger={burstTick} />`,
    `  {/* Burst: ${config.burstKind} (${config.burstCount} particles) */}`,
    `  <OnomatopoeiaSFX text="BOOM!!" tone="impact" />`,
    `</MotionStage>`,
  ].join('\n');
}
