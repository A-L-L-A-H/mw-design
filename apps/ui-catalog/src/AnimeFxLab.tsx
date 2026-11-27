import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Button, CopyButton, getCharacterById } from '@moonwitness/ui';
import {
  CartoonRig,
  ImpactFlash,
  OnomatopoeiaSFX,
  SmearFrame,
  type CartoonRigMood,
  type CartoonRigPose,
  type OnomatopoeiaTone,
} from '@moonwitness/ui/cartoon';
import {
  MotionProvider,
  ScreenFXOverlay,
  playProceduralSfx,
  type ScreenFXKind,
} from '@moonwitness/ui/motion';
import { SpeedLines } from '@moonwitness/ui/components/effects';
import {
  CAMERA_QUICK_PRESET_IDS,
  FLASH_MODE_OPTIONS,
  FX_COMBO_PRESETS,
  FX_LAB_CHARACTER_IDS,
  MAX_ACTIVE_PARTICLES,
  PARTICLE_BURST_OPTIONS,
  RUMBLE_SHAKE_CATEGORIES,
  RUMBLE_SHAKE_PRESETS,
  SHAKE_PATTERN_OPTIONS,
  buildFxSnippet,
  buildShakeWaveformPoints,
  computeFlashFramePhase,
  computeShakeFrame,
  filterRumbleShakePresets,
  generateParticleBurst,
  getRumbleShakePresetById,
  stepParticles,
  type AnimeFxComboPreset,
  type FlashFrameMode,
  type FlashPhase,
  type FxParticle,
  type ParticleBurstKind,
  type RumbleShakeCategory,
  type RumbleShakePreset,
  type ShakeFrame,
  type ShakePattern,
  type StageBackdropMode,
} from './fxLabEngine.js';

const STAGE_VIEWBOX_WIDTH = 640;
const STAGE_VIEWBOX_HEIGHT = 320;
const DEFAULT_SHAKE_DURATION_MS = 380;
const DEFAULT_FRAME_DURATION_MS = 42;

const BACKDROP_OPTIONS: ReadonlyArray<{ readonly id: StageBackdropMode; readonly label: string }> = [
  { id: 'arena-dark', label: 'Dark Arena' },
  { id: 'manga-halftone', label: 'Manga Halftone' },
  { id: 'speedlines', label: 'Action Speedlines' },
];

function renderParticleShape(particle: FxParticle) {
  const progress = Math.min(1, particle.age / Math.max(0.05, particle.lifeSec));
  const opacity = Math.max(0, 1 - Math.pow(progress, 1.5));
  const scale =
    particle.kind === 'sakura'
      ? 0.85 + Math.sin(progress * Math.PI) * 0.25
      : Math.max(0.18, 1 - progress * 0.65);

  const toneClass = `anime-fx-particle-tone-${particle.toneIndex}`;
  const transform = `translate(${particle.x.toFixed(1)} ${particle.y.toFixed(1)}) rotate(${particle.rotation.toFixed(1)}) scale(${scale.toFixed(2)})`;
  const s = particle.size;

  if (particle.kind === 'sakura') {
    return (
      <g key={particle.id} transform={transform} opacity={opacity} className={toneClass}>
        <path
          d={`M 0 ${-s} C ${s * 0.85} ${-s * 0.45}, ${s * 0.75} ${s * 0.65}, 0 ${s} C ${-s * 0.75} ${s * 0.65}, ${-s * 0.85} ${-s * 0.45}, 0 ${-s} Z`}
          className="anime-fx-particle-sakura"
        />
      </g>
    );
  }

  if (particle.kind === 'volt') {
    return (
      <g key={particle.id} transform={transform} opacity={opacity} className={toneClass}>
        <polyline
          points={`${-s},0 ${-s * 0.25},${-s * 0.48} ${s * 0.15},${s * 0.36} ${s},0`}
          className="anime-fx-particle-volt"
        />
      </g>
    );
  }

  if (particle.kind === 'stars') {
    const inner = s * 0.32;
    return (
      <g key={particle.id} transform={transform} opacity={opacity} className={toneClass}>
        <polygon
          points={`0,${-s} ${inner},${-inner} ${s},0 ${inner},${inner} 0,${s} ${-inner},${inner} ${-s},0 ${-inner},${-inner}`}
          className="anime-fx-particle-star"
        />
      </g>
    );
  }

  if (particle.kind === 'ink') {
    return (
      <g key={particle.id} transform={transform} opacity={opacity} className={toneClass}>
        <circle cx="0" cy="0" r={s * 0.52} className="anime-fx-particle-ink" />
        <ellipse
          cx={s * 0.45}
          cy={-s * 0.2}
          rx={s * 0.32}
          ry={s * 0.18}
          className="anime-fx-particle-ink"
        />
      </g>
    );
  }

  return (
    <g key={particle.id} transform={transform} opacity={opacity} className={toneClass}>
      <polygon
        points={`${s * 1.35},0 0,${s * 0.36} ${-s * 1.15},0 0,${-s * 0.36}`}
        className="anime-fx-particle-spark"
      />
    </g>
  );
}

export function AnimeFxLab() {
  const [characterId, setCharacterId] =
    useState<(typeof FX_LAB_CHARACTER_IDS)[number]>('kuro-signal');
  const [backdrop, setBackdrop] = useState<StageBackdropMode>('arena-dark');
  const [slowMo, setSlowMo] = useState(false);
  const [reducedMotionPreview, setReducedMotionPreview] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(false);

  // Rumble & Shake preset library + parameters
  const [rumbleCategory, setRumbleCategory] = useState<RumbleShakeCategory>('all');
  const [activeShakePresetId, setActiveShakePresetId] = useState<string | null>('katana-whiplash');
  const [loopSustained, setLoopSustained] = useState(false);
  const [isContinuousRumble, setIsContinuousRumble] = useState(false);
  const [shakePattern, setShakePattern] = useState<ShakePattern>('whiplash');
  const [shakeIntensity, setShakeIntensity] = useState(16);
  const [shakeDurationMs, setShakeDurationMs] = useState(340);
  const [shakeFrequency, setShakeFrequency] = useState(1.15);
  const [hitstopMs, setHitstopMs] = useState(75);

  // Flash / impact frame parameters
  const [flashMode, setFlashMode] = useState<FlashFrameMode>('impact-bw');
  const [flashFrames, setFlashFrames] = useState(4);

  // Particle burst parameters
  const [burstKind, setBurstKind] = useState<ParticleBurstKind>('sparks');
  const [burstCount, setBurstCount] = useState(24);

  // Live animated runtime state
  const [shakeFrame, setShakeFrame] = useState<ShakeFrame>({ x: 0, y: 0, rotateDeg: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const [hitstopActive, setHitstopActive] = useState(false);
  const [flashPhase, setFlashPhase] = useState<FlashPhase>({
    active: false,
    frameIndex: -1,
    polarity: 'none',
  });
  const [activeScreenFx, setActiveScreenFx] = useState<ScreenFXKind | null>(null);
  const [particles, setParticles] = useState<FxParticle[]>([]);
  const [rigPose, setRigPose] = useState<CartoonRigPose>('idle');
  const [rigMood, setRigMood] = useState<CartoonRigMood>('happy');
  const [squashTick, setSquashTick] = useState(0);
  const [smearActive, setSmearActive] = useState(false);
  const [sfxCallout, setSfxCallout] = useState<{
    id: number;
    text: string;
    tone: OnomatopoeiaTone;
  } | null>(null);
  const [lastActionLabel, setLastActionLabel] = useState('Ready — trigger a preset or click stage');
  const [triggerCount, setTriggerCount] = useState(0);
  const [burstOrigin, setBurstOrigin] = useState<{ x: number; y: number }>({
    x: STAGE_VIEWBOX_WIDTH / 2,
    y: STAGE_VIEWBOX_HEIGHT / 2,
  });

  const seedRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const shakeRunRef = useRef<{
    active: boolean;
    elapsedMs: number;
    durationMs: number;
    pattern: ShakePattern;
    intensity: number;
    frequency: number;
    continuous: boolean;
    seed: number;
  }>({
    active: false,
    elapsedMs: 0,
    durationMs: DEFAULT_SHAKE_DURATION_MS,
    pattern: 'quake',
    intensity: 0,
    frequency: 1,
    continuous: false,
    seed: 1,
  });
  const flashRunRef = useRef<{
    active: boolean;
    elapsedMs: number;
    frameCount: number;
  }>({
    active: false,
    elapsedMs: 0,
    frameCount: 4,
  });
  const particlesRef = useRef<FxParticle[]>([]);
  const timeScaleRef = useRef(1);
  const reducedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const systemReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectiveReduced = reducedMotionPreview || systemReducedMotion;
  const timeScale = slowMo ? 0.25 : 1;

  timeScaleRef.current = timeScale;
  reducedRef.current = effectiveReduced;

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((entry) => entry !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearScheduledTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameTimeRef.current = 0;
  }, []);

  const stopRumble = useCallback(() => {
    shakeRunRef.current.active = false;
    shakeRunRef.current.continuous = false;
    setIsContinuousRumble(false);
    setIsShaking(false);
    setShakeFrame({ x: 0, y: 0, rotateDeg: 0 });
    setLastActionLabel('Camera rumble stopped');
  }, []);

  const ensureLoopRunning = useCallback(() => {
    if (rafRef.current !== null || typeof window === 'undefined') return;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const rawDtMs = Math.min(48, Math.max(1, now - lastFrameTimeRef.current));
      lastFrameTimeRef.current = now;
      const scale = timeScaleRef.current;
      const scaledDtMs = rawDtMs * scale;
      let keepRunning = false;

      if (shakeRunRef.current.active) {
        shakeRunRef.current.elapsedMs += scaledDtMs;
        const progress =
          shakeRunRef.current.elapsedMs / Math.max(120, shakeRunRef.current.durationMs);
        if ((!shakeRunRef.current.continuous && progress >= 1) || reducedRef.current) {
          shakeRunRef.current.active = false;
          shakeRunRef.current.continuous = false;
          setShakeFrame({ x: 0, y: 0, rotateDeg: 0 });
          setIsShaking(false);
          setIsContinuousRumble(false);
        } else {
          setShakeFrame(
            computeShakeFrame(
              progress,
              shakeRunRef.current.pattern,
              shakeRunRef.current.intensity,
              shakeRunRef.current.seed,
              {
                frequency: shakeRunRef.current.frequency,
                continuous: shakeRunRef.current.continuous,
              }
            )
          );
          keepRunning = true;
        }
      }

      if (flashRunRef.current.active) {
        flashRunRef.current.elapsedMs += scaledDtMs;
        const phase = computeFlashFramePhase(
          flashRunRef.current.elapsedMs,
          flashRunRef.current.frameCount,
          DEFAULT_FRAME_DURATION_MS
        );
        if (!phase.active || reducedRef.current) {
          flashRunRef.current.active = false;
          setFlashPhase({ active: false, frameIndex: -1, polarity: 'none' });
        } else {
          setFlashPhase(phase);
          keepRunning = true;
        }
      }

      if (particlesRef.current.length > 0) {
        const nextParticles = stepParticles(particlesRef.current, rawDtMs / 1000, scale);
        particlesRef.current = nextParticles;
        setParticles(nextParticles);
        if (nextParticles.length > 0) {
          keepRunning = true;
        }
      }

      if (keepRunning) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        lastFrameTimeRef.current = 0;
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      stopLoop();
      clearScheduledTimers();
    };
  }, [stopLoop, clearScheduledTimers]);

  const pulseCharacterPose = useCallback(
    (pose: CartoonRigPose, mood: CartoonRigMood, withSmear: boolean) => {
      setRigPose(pose);
      setRigMood(mood);
      setSquashTick((n) => n + 1);
      if (withSmear && !effectiveReduced) {
        setSmearActive(true);
        scheduleTimer(() => setSmearActive(false), Math.round(240 / timeScale));
      }
      scheduleTimer(() => setRigPose('idle'), Math.round(520 / timeScale));
    },
    [effectiveReduced, scheduleTimer, timeScale]
  );

  const triggerShake = useCallback(
    (options?: {
      pattern?: ShakePattern;
      intensity?: number;
      hitstop?: number;
      durationMs?: number;
      frequency?: number;
      continuous?: boolean;
      presetLabel?: string;
      presetId?: string | null;
      sfx?: RumbleShakePreset['sfx'];
    }) => {
      const pattern = options?.pattern ?? shakePattern;
      const intensity = options?.intensity ?? shakeIntensity;
      const freezeMs = options?.hitstop ?? hitstopMs;
      const duration = options?.durationMs ?? shakeDurationMs;
      const frequency = options?.frequency ?? shakeFrequency;
      const continuous = Boolean(options?.continuous);

      if (options?.presetId !== undefined) {
        setActiveShakePresetId(options.presetId);
      }

      seedRef.current += 1;
      setTriggerCount((c) => c + 1);
      const labelPrefix = options?.presetLabel ? `Rumble Preset · ${options.presetLabel}` : `Screen Shake · ${pattern}`;
      setLastActionLabel(
        `${labelPrefix} (${intensity}px, ${continuous ? 'looping' : `${duration}ms`}${freezeMs > 0 ? `, ${freezeMs}ms hitstop` : ''})`
      );

      if (sfxEnabled) playProceduralSfx(options?.sfx ?? 'hit-impact', true, true);
      pulseCharacterPose(intensity >= 16 ? 'hurt' : 'attack', intensity >= 16 ? 'surprised' : 'determined', intensity >= 12);

      if (effectiveReduced) {
        shakeRunRef.current.active = false;
        shakeRunRef.current.continuous = false;
        setShakeFrame({ x: 0, y: 0, rotateDeg: 0 });
        setIsShaking(false);
        setIsContinuousRumble(false);
        return;
      }

      const startShake = () => {
        shakeRunRef.current = {
          active: true,
          elapsedMs: 0,
          durationMs: duration,
          pattern,
          intensity,
          frequency,
          continuous,
          seed: seedRef.current,
        };
        setIsShaking(true);
        setIsContinuousRumble(continuous);
        ensureLoopRunning();
      };

      if (freezeMs > 0 && !continuous) {
        setHitstopActive(true);
        scheduleTimer(() => {
          setHitstopActive(false);
          startShake();
        }, Math.round(freezeMs / timeScale));
      } else {
        setHitstopActive(false);
        startShake();
      }
    },
    [
      shakePattern,
      shakeIntensity,
      hitstopMs,
      shakeDurationMs,
      shakeFrequency,
      sfxEnabled,
      pulseCharacterPose,
      effectiveReduced,
      ensureLoopRunning,
      scheduleTimer,
      timeScale,
    ]
  );

  const triggerRumblePreset = useCallback(
    (preset: RumbleShakePreset) => {
      setShakePattern(preset.pattern);
      setShakeIntensity(preset.intensityPx);
      setShakeDurationMs(preset.durationMs);
      setShakeFrequency(preset.frequency);
      setHitstopMs(preset.hitstopMs);
      setActiveShakePresetId(preset.id);

      triggerShake({
        pattern: preset.pattern,
        intensity: preset.intensityPx,
        hitstop: preset.hitstopMs,
        durationMs: preset.durationMs,
        frequency: preset.frequency,
        continuous: Boolean(preset.sustained && loopSustained),
        presetLabel: preset.name,
        presetId: preset.id,
        sfx: preset.sfx,
      });
    },
    [loopSustained, triggerShake]
  );

  const triggerFlash = useCallback(
    (modeOverride?: FlashFrameMode, framesOverride?: number) => {
      const mode = modeOverride ?? flashMode;
      const frames = framesOverride ?? flashFrames;
      setTriggerCount((c) => c + 1);
      setLastActionLabel(`Flash Frame · ${mode} (${frames}f @ 24fps)`);
      if (sfxEnabled) playProceduralSfx('toggle-pop', true, true);

      const overlayMap: Record<FlashFrameMode, ScreenFXKind> = {
        'impact-bw': 'speedlines-burst',
        whiteout: 'flash',
        'invert-negative': 'vignette',
        'chromatic-split': 'chromatic-pulse',
      };
      setActiveScreenFx(overlayMap[mode]);
      scheduleTimer(() => setActiveScreenFx(null), Math.round(420 / timeScale));

      if (effectiveReduced) {
        setFlashPhase({ active: false, frameIndex: -1, polarity: 'none' });
        return;
      }

      flashRunRef.current = {
        active: true,
        elapsedMs: 0,
        frameCount: frames,
      };
      setFlashPhase({ active: true, frameIndex: 0, polarity: 'dark' });
      ensureLoopRunning();
    },
    [flashMode, flashFrames, sfxEnabled, scheduleTimer, timeScale, effectiveReduced, ensureLoopRunning]
  );

  const triggerParticleBurst = useCallback(
    (
      kindOverride?: ParticleBurstKind,
      countOverride?: number,
      originOverride?: { x: number; y: number }
    ) => {
      const kind = kindOverride ?? burstKind;
      const count = countOverride ?? burstCount;
      const origin = originOverride ?? {
        x: STAGE_VIEWBOX_WIDTH / 2,
        y: STAGE_VIEWBOX_HEIGHT / 2,
      };
      seedRef.current += 1;
      setBurstOrigin(origin);
      setTriggerCount((c) => c + 1);
      setLastActionLabel(`Particle Burst · ${kind} (${count} particles)`);
      if (sfxEnabled) playProceduralSfx('boing', true, true);
      pulseCharacterPose('attack', 'happy', false);

      const spawned = generateParticleBurst({
        kind,
        count,
        originX: origin.x,
        originY: origin.y,
        seed: seedRef.current,
      });

      if (effectiveReduced) {
        const staticSnapshot = stepParticles(spawned, 0.04, 1);
        particlesRef.current = staticSnapshot;
        setParticles(staticSnapshot);
        scheduleTimer(() => {
          particlesRef.current = [];
          setParticles([]);
        }, 600);
        return;
      }

      const merged = [...particlesRef.current, ...spawned].slice(-MAX_ACTIVE_PARTICLES);
      particlesRef.current = merged;
      setParticles(merged);
      ensureLoopRunning();
    },
    [burstKind, burstCount, sfxEnabled, pulseCharacterPose, effectiveReduced, scheduleTimer, ensureLoopRunning]
  );

  const triggerCombo = useCallback(
    (preset: AnimeFxComboPreset) => {
      setShakePattern(preset.shakePattern);
      setShakeIntensity(preset.shakeIntensity);
      setShakeDurationMs(DEFAULT_SHAKE_DURATION_MS + 60);
      setShakeFrequency(1.1);
      setHitstopMs(preset.hitstopMs);
      setActiveShakePresetId(null);
      setFlashMode(preset.flashMode);
      setFlashFrames(preset.flashFrames);
      setBurstKind(preset.burstKind);
      setBurstCount(preset.burstCount);

      seedRef.current += 1;
      const calloutId = seedRef.current;
      setSfxCallout({ id: calloutId, text: preset.onomatopoeia, tone: preset.onomatopoeiaTone });
      scheduleTimer(() => {
        setSfxCallout((curr) => (curr?.id === calloutId ? null : curr));
      }, Math.round(900 / timeScale));

      setActiveScreenFx(preset.screenFx);
      scheduleTimer(() => setActiveScreenFx(null), Math.round(520 / timeScale));

      pulseCharacterPose(preset.pose, preset.mood, true);
      if (sfxEnabled) playProceduralSfx(preset.sfx, true, true);

      setTriggerCount((c) => c + 1);
      setLastActionLabel(`Combo · ${preset.label} (${preset.subtitle})`);

      const origin = { x: STAGE_VIEWBOX_WIDTH / 2, y: STAGE_VIEWBOX_HEIGHT / 2 };
      setBurstOrigin(origin);
      const spawned = generateParticleBurst({
        kind: preset.burstKind,
        count: preset.burstCount,
        originX: origin.x,
        originY: origin.y,
        seed: seedRef.current,
      });

      if (effectiveReduced) {
        const staticSnapshot = stepParticles(spawned, 0.04, 1);
        particlesRef.current = staticSnapshot;
        setParticles(staticSnapshot);
        scheduleTimer(() => {
          particlesRef.current = [];
          setParticles([]);
        }, 700);
        return;
      }

      const merged = [...particlesRef.current, ...spawned].slice(-MAX_ACTIVE_PARTICLES);
      particlesRef.current = merged;
      setParticles(merged);

      flashRunRef.current = {
        active: true,
        elapsedMs: 0,
        frameCount: preset.flashFrames,
      };
      setFlashPhase({ active: true, frameIndex: 0, polarity: 'dark' });

      const startShake = () => {
        shakeRunRef.current = {
          active: true,
          elapsedMs: 0,
          durationMs: DEFAULT_SHAKE_DURATION_MS + 60,
          pattern: preset.shakePattern,
          intensity: preset.shakeIntensity,
          frequency: 1.1,
          continuous: false,
          seed: seedRef.current,
        };
        setIsShaking(true);
        setIsContinuousRumble(false);
        ensureLoopRunning();
      };

      if (preset.hitstopMs > 0) {
        setHitstopActive(true);
        scheduleTimer(() => {
          setHitstopActive(false);
          startShake();
        }, Math.round(preset.hitstopMs / timeScale));
      } else {
        startShake();
      }
      ensureLoopRunning();
    },
    [effectiveReduced, ensureLoopRunning, pulseCharacterPose, scheduleTimer, sfxEnabled, timeScale]
  );

  const handleStageClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const relX =
        rect.width > 0
          ? ((event.clientX - rect.left) / rect.width) * STAGE_VIEWBOX_WIDTH
          : STAGE_VIEWBOX_WIDTH / 2;
      const relY =
        rect.height > 0
          ? ((event.clientY - rect.top) / rect.height) * STAGE_VIEWBOX_HEIGHT
          : STAGE_VIEWBOX_HEIGHT / 2;

      triggerParticleBurst(burstKind, burstCount, {
        x: Math.max(24, Math.min(STAGE_VIEWBOX_WIDTH - 24, relX)),
        y: Math.max(24, Math.min(STAGE_VIEWBOX_HEIGHT - 24, relY)),
      });
      if (!effectiveReduced) {
        seedRef.current += 1;
        shakeRunRef.current = {
          active: true,
          elapsedMs: 0,
          durationMs: 240,
          pattern: shakePattern,
          intensity: Math.max(6, Math.round(shakeIntensity * 0.65)),
          frequency: shakeFrequency,
          continuous: false,
          seed: seedRef.current,
        };
        setIsShaking(true);
        setIsContinuousRumble(false);
        ensureLoopRunning();
      }
    },
    [
      burstKind,
      burstCount,
      effectiveReduced,
      ensureLoopRunning,
      shakeFrequency,
      shakeIntensity,
      shakePattern,
      triggerParticleBurst,
    ]
  );

  const handleReset = useCallback(() => {
    stopLoop();
    clearScheduledTimers();
    shakeRunRef.current.active = false;
    shakeRunRef.current.continuous = false;
    flashRunRef.current.active = false;
    particlesRef.current = [];
    setShakeFrame({ x: 0, y: 0, rotateDeg: 0 });
    setIsShaking(false);
    setIsContinuousRumble(false);
    setHitstopActive(false);
    setFlashPhase({ active: false, frameIndex: -1, polarity: 'none' });
    setActiveScreenFx(null);
    setParticles([]);
    setRigPose('idle');
    setRigMood('happy');
    setSmearActive(false);
    setSfxCallout(null);
    setTriggerCount(0);
    setLastActionLabel('Stage reset — ready for next trigger');
  }, [clearScheduledTimers, stopLoop]);

  const activeCharacter = useMemo(() => getCharacterById(characterId), [characterId]);

  const filteredRumblePresets = useMemo(
    () => filterRumbleShakePresets(rumbleCategory),
    [rumbleCategory]
  );

  const cameraQuickPresets = useMemo(
    () =>
      CAMERA_QUICK_PRESET_IDS.map((id) => getRumbleShakePresetById(id)).filter(
        (preset): preset is RumbleShakePreset => preset !== null
      ),
    []
  );

  const presetWaveforms = useMemo(
    () =>
      Object.fromEntries(
        RUMBLE_SHAKE_PRESETS.map((preset) => [
          preset.id,
          buildShakeWaveformPoints(
            preset.pattern,
            preset.intensityPx,
            preset.frequency,
            Boolean(preset.sustained)
          ),
        ])
      ),
    []
  );

  const snippet = useMemo(
    () =>
      buildFxSnippet({
        characterId,
        shakePattern,
        shakeIntensity,
        shakeDurationMs,
        shakePresetId: activeShakePresetId,
        hitstopMs,
        flashMode,
        flashFrames,
        burstKind,
        burstCount,
        reducedMotion: effectiveReduced,
      }),
    [
      characterId,
      shakePattern,
      shakeIntensity,
      shakeDurationMs,
      activeShakePresetId,
      hitstopMs,
      flashMode,
      flashFrames,
      burstKind,
      burstCount,
      effectiveReduced,
    ]
  );

  const stageTransformStyle =
    isShaking && !effectiveReduced
      ? {
          transform: `translate3d(${shakeFrame.x.toFixed(2)}px, ${shakeFrame.y.toFixed(2)}px, 0) rotate(${shakeFrame.rotateDeg.toFixed(2)}deg)`,
        }
      : undefined;

  return (
    <MotionProvider
      profile={effectiveReduced ? 'off' : 'expressive'}
      sfxEnabled={sfxEnabled}
      syncDocumentAttribute={false}
    >
      <div className="anime-fx-lab" data-testid="anime-fx-lab">
        <div className="anime-fx-lab-topbar">
          <div className="anime-fx-lab-context-controls">
            <div className="anime-fx-control-group" role="group" aria-label="Stage character">
              {FX_LAB_CHARACTER_IDS.map((id) => {
                const profile = getCharacterById(id);
                const active = characterId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className="catalog-playground-option"
                    data-active={active ? 'true' : 'false'}
                    aria-pressed={active}
                    onClick={() => setCharacterId(id)}
                  >
                    {profile?.name ?? id}
                  </button>
                );
              })}
            </div>

            <div className="anime-fx-control-group" role="group" aria-label="Stage backdrop">
              {BACKDROP_OPTIONS.map((option) => {
                const active = backdrop === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="catalog-playground-option"
                    data-active={active ? 'true' : 'false'}
                    aria-pressed={active}
                    onClick={() => setBackdrop(option.id)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="anime-fx-lab-mode-toggles">
            <button
              type="button"
              className="catalog-playground-option"
              data-active={slowMo ? 'true' : 'false'}
              aria-pressed={slowMo}
              onClick={() => setSlowMo((prev) => !prev)}
            >
              {slowMo ? 'Speed: 0.25x' : 'Speed: 1x'}
            </button>
            <button
              type="button"
              className="catalog-playground-option"
              data-active={reducedMotionPreview ? 'true' : 'false'}
              aria-pressed={reducedMotionPreview}
              onClick={() => setReducedMotionPreview((prev) => !prev)}
            >
              {reducedMotionPreview ? 'Reduced Motion: On' : 'Reduced Motion: Off'}
            </button>
            <button
              type="button"
              className="catalog-playground-option"
              data-active={sfxEnabled ? 'true' : 'false'}
              aria-pressed={sfxEnabled}
              onClick={() => {
                const next = !sfxEnabled;
                setSfxEnabled(next);
                if (next) playProceduralSfx('success-chime', true, true);
              }}
            >
              {sfxEnabled ? 'SFX: On' : 'SFX: Off'}
            </button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset Stage
            </Button>
          </div>
        </div>

        <div className="anime-fx-stage-shell">
          <div className="anime-fx-camera-viewport">
            <div
              className="anime-fx-stage-camera"
              data-testid="anime-fx-stage"
              data-backdrop={backdrop}
              data-shaking={isShaking ? 'true' : 'false'}
              data-continuous-rumble={isContinuousRumble ? 'true' : 'false'}
              data-shake-pattern={shakePattern}
              data-active-shake-preset={activeShakePresetId ?? 'custom'}
              data-hitstop={hitstopActive ? 'true' : 'false'}
              data-flash-active={flashPhase.active ? 'true' : 'false'}
              data-flash-mode={flashMode}
              data-flash-polarity={flashPhase.polarity}
              data-particle-count={particles.length}
              data-reduced-motion={effectiveReduced ? 'true' : 'false'}
              style={stageTransformStyle}
            >
              {backdrop === 'speedlines' ? (
                <div className="anime-fx-stage-speedlines" aria-hidden="true">
                  <SpeedLines count={28} />
                </div>
              ) : null}

              <button
                type="button"
                className="anime-fx-stage-hit-area"
                onClick={handleStageClick}
                aria-label={`Fire ${burstKind} particle burst on stage`}
              >
                <span className="anime-fx-stage-hint">Click stage to burst</span>
              </button>

              <div className="anime-fx-stage-subject" aria-hidden="true">
                <SmearFrame active={smearActive} direction="right">
                  <CartoonRig
                    characterId={characterId}
                    name={activeCharacter?.name}
                    mood={rigMood}
                    pose={rigPose}
                    size="lg"
                    squashTrigger={squashTick}
                    breathing={!hitstopActive}
                  />
                </SmearFrame>
                <div className="anime-fx-stage-subject-caption">
                  <strong>{activeCharacter?.name ?? 'Kuro'}</strong>
                  <span>{activeCharacter?.title ?? 'Ink Striker'}</span>
                </div>
              </div>

              {sfxCallout ? (
                <div className="anime-fx-stage-callout" aria-hidden="true">
                  <OnomatopoeiaSFX
                    key={sfxCallout.id}
                    text={sfxCallout.text}
                    tone={sfxCallout.tone}
                    tiltDeg={-9}
                  />
                </div>
              ) : null}

              <svg
                className="anime-fx-particle-canvas"
                viewBox={`0 0 ${STAGE_VIEWBOX_WIDTH} ${STAGE_VIEWBOX_HEIGHT}`}
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
                data-testid="anime-fx-particles-svg"
              >
                {particles.length > 0 ? (
                  <circle
                    cx={burstOrigin.x}
                    cy={burstOrigin.y}
                    r={Math.min(72, 18 + (particles[0]?.age ?? 0) * 180)}
                    className="anime-fx-shockwave-ring"
                    opacity={Math.max(0, 0.85 - (particles[0]?.age ?? 0) * 2.8)}
                  />
                ) : null}
                {particles.map(renderParticleShape)}
              </svg>

              <ImpactFlash active={flashPhase.active && flashMode === 'whiteout'} />

              {activeScreenFx ? <ScreenFXOverlay effect={activeScreenFx} active /> : null}

              {flashPhase.active ? (
                <div
                  aria-hidden="true"
                  className="anime-fx-impact-frame-layer"
                  data-mode={flashMode}
                  data-polarity={flashPhase.polarity}
                  data-testid="anime-fx-impact-overlay"
                >
                  {flashMode === 'impact-bw' ? (
                    <svg
                      viewBox="0 0 640 320"
                      preserveAspectRatio="none"
                      className="anime-fx-impact-rays"
                    >
                      <polygon points="320,160 0,0 115,0" />
                      <polygon points="320,160 250,0 385,0" />
                      <polygon points="320,160 525,0 640,0" />
                      <polygon points="320,160 640,95 640,220" />
                      <polygon points="320,160 640,320 510,320" />
                      <polygon points="320,160 390,320 255,320" />
                      <polygon points="320,160 120,320 0,320" />
                      <polygon points="320,160 0,225 0,100" />
                    </svg>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="anime-fx-camera-hud-top" aria-hidden="true">
              <span>CAM PREVIEW</span>
              <span>
                X {shakeFrame.x.toFixed(1)} · Y {shakeFrame.y.toFixed(1)} · ROT{' '}
                {shakeFrame.rotateDeg.toFixed(1)}°
              </span>
            </div>

            <div
              className="anime-fx-camera-dock"
              role="group"
              aria-label="Quick camera shake triggers"
              data-testid="camera-shake-dock"
            >
              <span className="anime-fx-camera-dock-label">Shake:</span>
              {cameraQuickPresets.map((preset) => {
                const active = activeShakePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="anime-fx-camera-dock-btn"
                    data-active={active ? 'true' : 'false'}
                    aria-label={`Trigger ${preset.name} in camera preview`}
                    onClick={() => triggerRumblePreset(preset)}
                  >
                    {preset.shortLabel}
                  </button>
                );
              })}
              {isContinuousRumble ? (
                <button
                  type="button"
                  className="anime-fx-camera-dock-btn anime-fx-camera-dock-stop"
                  onClick={stopRumble}
                >
                  Stop Rumble
                </button>
              ) : null}
            </div>
          </div>

          <div
            className="anime-fx-telemetry"
            role="status"
            aria-live="polite"
            data-testid="anime-fx-status"
          >
            <span className="anime-fx-telemetry-event">{lastActionLabel}</span>
            <span className="anime-fx-telemetry-metrics">
              <span>Triggers: {triggerCount}</span>
              <span aria-hidden="true">·</span>
              <span>Active particles: {particles.length}</span>
              <span aria-hidden="true">·</span>
              <span>
                Offset: {shakeFrame.x.toFixed(1)}, {shakeFrame.y.toFixed(1)}px
              </span>
              <span aria-hidden="true">·</span>
              <span>Playback: {slowMo ? '0.25x' : '1.0x'}</span>
            </span>
          </div>
        </div>

        <section
          className="anime-fx-rumble-library"
          aria-labelledby="rumble-shake-library-heading"
          data-testid="rumble-shake-library"
        >
          <div className="anime-fx-rumble-head">
            <div>
              <h3 id="rumble-shake-library-heading">Rumble &amp; Shake Preset Library</h3>
              <p>
                Trigger calibrated screen-shake intensities, axes, and seismic loops directly inside
                the camera preview above.
              </p>
            </div>
            <div className="anime-fx-rumble-controls">
              <div
                className="anime-fx-control-group"
                role="group"
                aria-label="Filter Rumble & Shake presets"
              >
                {RUMBLE_SHAKE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="catalog-playground-option"
                    data-active={rumbleCategory === category.id ? 'true' : 'false'}
                    aria-pressed={rumbleCategory === category.id}
                    onClick={() => setRumbleCategory(category.id)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="catalog-playground-option"
                data-active={loopSustained ? 'true' : 'false'}
                aria-pressed={loopSustained}
                onClick={() => {
                  const next = !loopSustained;
                  setLoopSustained(next);
                  if (!next && isContinuousRumble) stopRumble();
                }}
              >
                {loopSustained ? 'Loop Sustained: On' : 'Loop Sustained: Off'}
              </button>
              {isContinuousRumble ? (
                <Button size="sm" variant="destructive" onClick={stopRumble}>
                  Stop Rumble
                </Button>
              ) : null}
            </div>
          </div>

          <div className="anime-fx-rumble-grid">
            {filteredRumblePresets.map((preset) => {
              const active = activeShakePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className="anime-fx-rumble-card"
                  data-active={active ? 'true' : 'false'}
                  data-preset-id={preset.id}
                  aria-pressed={active}
                  onClick={() => triggerRumblePreset(preset)}
                >
                  <div className="anime-fx-rumble-card-top">
                    <span className="anime-fx-rumble-name">{preset.name}</span>
                    <span className="anime-fx-rumble-cat">{preset.category}</span>
                  </div>
                  <svg
                    viewBox="0 0 120 28"
                    className="anime-fx-rumble-wave"
                    aria-hidden="true"
                  >
                    <line x1="0" y1="14" x2="120" y2="14" className="anime-fx-rumble-wave-axis" />
                    <polyline
                      points={presetWaveforms[preset.id]}
                      className="anime-fx-rumble-wave-line"
                    />
                  </svg>
                  <span className="anime-fx-rumble-meta">
                    {preset.intensityPx}px · {preset.durationMs}ms · {preset.pattern}
                    {preset.hitstopMs > 0 ? ` · ${preset.hitstopMs}ms stop` : ''}
                  </span>
                  <span className="anime-fx-rumble-desc">{preset.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="anime-fx-combos" role="group" aria-label="Choreographed anime FX combos">
          <div className="anime-fx-combos-head">
            <h3>Choreographed Anime Combos</h3>
            <p>
              Trigger layered camera shake, hitstop freeze, 24fps impact frames, and particle bursts
              together.
            </p>
          </div>
          <div className="anime-fx-combos-grid">
            {FX_COMBO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="anime-fx-combo-card"
                onClick={() => triggerCombo(preset)}
              >
                <span className="anime-fx-combo-title">{preset.label}</span>
                <span className="anime-fx-combo-sub">{preset.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="anime-fx-workbench">
          <section className="anime-fx-panel" aria-labelledby="fx-shake-heading">
            <div className="anime-fx-panel-head">
              <div>
                <h3 id="fx-shake-heading">Screen Shake &amp; Hitstop</h3>
                <p>Damped camera impulse with optional freeze-frame pause before impact recoil.</p>
              </div>
              <Button size="sm" variant="default" onClick={() => triggerShake({ presetId: null })}>
                Trigger Screen Shake
              </Button>
            </div>

            <div className="anime-fx-control-group" role="group" aria-label="Shake pattern">
              {SHAKE_PATTERN_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="catalog-playground-option"
                  data-active={shakePattern === option.id ? 'true' : 'false'}
                  aria-pressed={shakePattern === option.id}
                  title={option.description}
                  onClick={() => {
                    setShakePattern(option.id);
                    triggerShake({
                      pattern: option.id,
                      intensity: shakeIntensity,
                      hitstop: hitstopMs,
                      presetId: null,
                    });
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="anime-fx-sliders">
              <label className="anime-fx-slider-row">
                <span>Intensity: {shakeIntensity}px</span>
                <input
                  type="range"
                  min={4}
                  max={28}
                  step={2}
                  value={shakeIntensity}
                  onChange={(event) => {
                    setShakeIntensity(Number(event.target.value));
                    setActiveShakePresetId(null);
                  }}
                  aria-label="Screen shake intensity in pixels"
                />
              </label>
              <label className="anime-fx-slider-row">
                <span>Duration: {shakeDurationMs}ms</span>
                <input
                  type="range"
                  min={180}
                  max={1400}
                  step={40}
                  value={shakeDurationMs}
                  onChange={(event) => {
                    setShakeDurationMs(Number(event.target.value));
                    setActiveShakePresetId(null);
                  }}
                  aria-label="Screen shake duration in milliseconds"
                />
              </label>
              <label className="anime-fx-slider-row">
                <span>Hitstop freeze: {hitstopMs}ms</span>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={15}
                  value={hitstopMs}
                  onChange={(event) => {
                    setHitstopMs(Number(event.target.value));
                    setActiveShakePresetId(null);
                  }}
                  aria-label="Hitstop freeze duration in milliseconds"
                />
              </label>
            </div>
          </section>

          <section className="anime-fx-panel" aria-labelledby="fx-flash-heading">
            <div className="anime-fx-panel-head">
              <div>
                <h3 id="fx-flash-heading">Flash &amp; Impact Frames</h3>
                <p>
                  24fps cel impact silhouettes, whiteout blooms, negative inversion, and RGB split.
                </p>
              </div>
              <Button size="sm" variant="magenta" onClick={() => triggerFlash()}>
                Trigger Flash Frame
              </Button>
            </div>

            <div className="anime-fx-control-group" role="group" aria-label="Flash frame mode">
              {FLASH_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="catalog-playground-option"
                  data-active={flashMode === option.id ? 'true' : 'false'}
                  aria-pressed={flashMode === option.id}
                  title={option.description}
                  onClick={() => {
                    setFlashMode(option.id);
                    triggerFlash(option.id, flashFrames);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="anime-fx-sliders">
              <label className="anime-fx-slider-row">
                <span>Frame count: {flashFrames} frames (24fps)</span>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={flashFrames}
                  onChange={(event) => setFlashFrames(Number(event.target.value))}
                  aria-label="Impact flash frame count"
                />
              </label>
            </div>
          </section>

          <section className="anime-fx-panel" aria-labelledby="fx-burst-heading">
            <div className="anime-fx-panel-head">
              <div>
                <h3 id="fx-burst-heading">Particle Bursts</h3>
                <p>
                  Bounded radial physics emitters for hit sparks, drifting petals, volt arcs, stars,
                  and ink.
                </p>
              </div>
              <Button size="sm" variant="default" onClick={() => triggerParticleBurst()}>
                Trigger Particle Burst
              </Button>
            </div>

            <div className="anime-fx-control-group" role="group" aria-label="Particle burst style">
              {PARTICLE_BURST_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="catalog-playground-option"
                  data-active={burstKind === option.id ? 'true' : 'false'}
                  aria-pressed={burstKind === option.id}
                  title={option.description}
                  onClick={() => {
                    setBurstKind(option.id);
                    triggerParticleBurst(option.id, burstCount);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="anime-fx-sliders">
              <label className="anime-fx-slider-row">
                <span>Burst density: {burstCount} particles</span>
                <input
                  type="range"
                  min={8}
                  max={40}
                  step={4}
                  value={burstCount}
                  onChange={(event) => setBurstCount(Number(event.target.value))}
                  aria-label="Particle burst count"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="anime-fx-code-panel">
          <div className="anime-fx-code-head">
            <span>Composition JSX</span>
            <CopyButton value={snippet} label="Copy FX JSX" />
          </div>
          <pre className="anime-fx-code-block" data-testid="anime-fx-jsx-output">
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    </MotionProvider>
  );
}
