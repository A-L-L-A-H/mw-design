'use client';

import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn.js';
import { useReducedMotion } from '../lib/use-reduced-motion.js';
import {
  getGlobalAudioEnabled,
  playProceduralSfx,
  PROCEDURAL_SFX_PRESETS,
  setGlobalAudioEnabled,
  subscribeAudioPreference,
  type ProceduralSfxPreset,
} from '../lib/audio-runtime.js';
import {
  clampUnit,
  computeCameraShakeOffset,
  computeLipSyncPhoneme,
  evaluateEasing,
  MOTION_EASING_NAMES,
  MOTION_PROFILE_SCALES,
  sampleEasingCurve,
  stepSpring,
  type CameraShakeOffset,
  type LipSyncPhoneme,
  type MotionEasingName,
  type MotionProfile,
  type SpringConfig,
  type SpringState,
} from './physics.js';

export {
  clampUnit,
  computeCameraShakeOffset,
  computeLipSyncPhoneme,
  evaluateEasing,
  MOTION_EASING_NAMES,
  MOTION_PROFILE_SCALES,
  playProceduralSfx,
  PROCEDURAL_SFX_PRESETS,
  sampleEasingCurve,
  stepSpring,
  type CameraShakeOffset,
  type LipSyncPhoneme,
  type MotionEasingName,
  type MotionProfile,
  type ProceduralSfxPreset,
  type SpringConfig,
  type SpringState,
};

export interface MotionContextValue {
  readonly profile: MotionProfile;
  readonly effectiveProfile: MotionProfile;
  readonly reducedMotion: boolean;
  readonly sfxEnabled: boolean;
  readonly setProfile: (profile: MotionProfile) => void;
  readonly setSfxEnabled: (enabled: boolean) => void;
  readonly triggerSfx: (preset: ProceduralSfxPreset, pitchMultiplier?: number) => boolean;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export interface MotionProviderProps {
  readonly profile?: MotionProfile;
  readonly defaultProfile?: MotionProfile;
  readonly sfxEnabled?: boolean;
  readonly defaultSfxEnabled?: boolean;
  readonly reducedMotion?: boolean;
  readonly syncDocumentAttribute?: boolean;
  readonly children: ReactNode;
}

export function MotionProvider({
  profile: controlledProfile,
  defaultProfile = 'expressive',
  sfxEnabled: controlledSfxEnabled,
  defaultSfxEnabled = false,
  reducedMotion,
  syncDocumentAttribute = true,
  children,
}: MotionProviderProps) {
  const systemReduced = useReducedMotion(reducedMotion);
  const [uncontrolledProfile, setUncontrolledProfile] = useState<MotionProfile>(defaultProfile);
  const [uncontrolledSfxEnabled, setUncontrolledSfxEnabled] = useState<boolean>(
    () => defaultSfxEnabled || getGlobalAudioEnabled()
  );

  const profile = controlledProfile ?? uncontrolledProfile;
  const sfxEnabled = controlledSfxEnabled ?? uncontrolledSfxEnabled;
  const effectiveProfile: MotionProfile = systemReduced ? 'off' : profile;

  useEffect(() => {
    if (defaultSfxEnabled) setGlobalAudioEnabled(true);
    return subscribeAudioPreference((next) => setUncontrolledSfxEnabled(next));
  }, [defaultSfxEnabled]);

  useEffect(() => {
    if (!syncDocumentAttribute || typeof document === 'undefined') return;
    document.documentElement.dataset.motionProfile = effectiveProfile;
  }, [effectiveProfile, syncDocumentAttribute]);

  const setSfxEnabled = useCallback((enabled: boolean) => {
    setUncontrolledSfxEnabled(enabled);
    setGlobalAudioEnabled(enabled);
  }, []);

  const triggerSfx = useCallback(
    (preset: ProceduralSfxPreset, pitchMultiplier?: number) =>
      playProceduralSfx(preset, sfxEnabled, true, pitchMultiplier),
    [sfxEnabled]
  );

  const value = useMemo<MotionContextValue>(
    () => ({
      profile,
      effectiveProfile,
      reducedMotion: effectiveProfile === 'off',
      sfxEnabled,
      setProfile: setUncontrolledProfile,
      setSfxEnabled,
      triggerSfx,
    }),
    [profile, effectiveProfile, sfxEnabled, setSfxEnabled, triggerSfx]
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  const systemReduced = useReducedMotion();
  if (ctx) return ctx;
  const effectiveProfile: MotionProfile = systemReduced ? 'off' : 'expressive';
  return {
    profile: effectiveProfile,
    effectiveProfile,
    reducedMotion: systemReduced,
    sfxEnabled: false,
    setProfile: () => {},
    setSfxEnabled: () => {},
    triggerSfx: () => false,
  };
}

export function useSpringValue(target: number, config?: SpringConfig): number {
  const { reducedMotion } = useMotion();
  const [value, setValue] = useState<number>(target);
  const stateRef = useRef<SpringState>({ value: target, velocity: 0, settled: true });

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
      stateRef.current = { value: target, velocity: 0, settled: true };
      setValue(target);
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const next = stepSpring(stateRef.current.value, target, stateRef.current.velocity, dt, config);
      stateRef.current = next;
      setValue(next.value);
      if (!next.settled) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, reducedMotion, config?.stiffness, config?.damping, config?.mass, config?.precision]);

  return value;
}

export type MotionPreset =
  | 'pop-in'
  | 'slam-drop'
  | 'ink-wipe'
  | 'squash-bounce'
  | 'slide-snap'
  | 'comic-flip';

export type MotionPresenceProps = ComponentPropsWithoutRef<'div'> & {
  present: boolean;
  preset?: MotionPreset;
  exitMs?: number;
};

export const MotionPresence = forwardRef<HTMLDivElement, MotionPresenceProps>(
  function MotionPresence(
    { present, preset = 'pop-in', exitMs = 180, className, children, ...props },
    ref
  ) {
    const { reducedMotion } = useMotion();
    const [mounted, setMounted] = useState(present);
    const [state, setState] = useState<'entering' | 'entered' | 'exiting'>(
      present ? 'entered' : 'exiting'
    );

    useEffect(() => {
      if (present) {
        setMounted(true);
        setState('entered');
        return;
      }
      if (reducedMotion || exitMs <= 0) {
        setMounted(false);
        return;
      }
      setState('exiting');
      const timer = window.setTimeout(() => setMounted(false), exitMs);
      return () => window.clearTimeout(timer);
    }, [present, reducedMotion, exitMs]);

    if (!mounted) return null;

    return (
      <div
        ref={ref}
        data-slot="motion-presence"
        data-preset={preset}
        data-presence-state={state}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-motion-presence', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MotionPresence.displayName = 'MotionPresence';

export type MotionStageProps = ComponentPropsWithoutRef<'div'> & {
  preset?: MotionPreset;
  delayMs?: number;
  replayKey?: string | number;
  shakeIntensity?: number;
  shakeSeed?: number;
  hitstopMs?: number;
};

export const MotionStage = forwardRef<HTMLDivElement, MotionStageProps>(function MotionStage(
  {
    preset = 'pop-in',
    delayMs = 0,
    replayKey,
    shakeIntensity = 0,
    shakeSeed = 0,
    hitstopMs = 0,
    className,
    style,
    children,
    ...props
  },
  ref
) {
  const { reducedMotion, effectiveProfile } = useMotion();
  const [shakeOffset, setShakeOffset] = useState<CameraShakeOffset>({ x: 0, y: 0, rotateDeg: 0 });
  const [hitstopActive, setHitstopActive] = useState(false);

  useEffect(() => {
    if (reducedMotion || shakeIntensity <= 0 || shakeSeed <= 0) {
      setShakeOffset({ x: 0, y: 0, rotateDeg: 0 });
      return;
    }
    let rafId = 0;
    let frame = 0;
    const totalFrames = 14;
    const tick = () => {
      const progress = clampUnit(frame / totalFrames);
      setShakeOffset(computeCameraShakeOffset(progress, shakeIntensity, shakeSeed + frame));
      frame += 1;
      if (frame <= totalFrames) {
        rafId = requestAnimationFrame(tick);
      } else {
        setShakeOffset({ x: 0, y: 0, rotateDeg: 0 });
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion, shakeIntensity, shakeSeed]);

  useEffect(() => {
    if (reducedMotion || hitstopMs <= 0 || shakeSeed <= 0) {
      setHitstopActive(false);
      return;
    }
    setHitstopActive(true);
    const timer = window.setTimeout(() => setHitstopActive(false), Math.min(260, hitstopMs));
    return () => window.clearTimeout(timer);
  }, [reducedMotion, hitstopMs, shakeSeed]);

  const hasShake = !reducedMotion && (shakeOffset.x !== 0 || shakeOffset.y !== 0 || shakeOffset.rotateDeg !== 0);
  const mergedStyle = {
    ...style,
    '--mw-motion-delay-offset': `${Math.max(0, delayMs)}ms`,
    ...(hasShake
      ? {
          transform: `translate3d(${shakeOffset.x.toFixed(2)}px, ${shakeOffset.y.toFixed(2)}px, 0) rotate(${shakeOffset.rotateDeg.toFixed(2)}deg)`,
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      key={replayKey}
      ref={ref}
      data-slot="motion-stage"
      data-preset={preset}
      data-motion-profile={effectiveProfile}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-shaking={hasShake ? 'true' : 'false'}
      data-hitstop={hitstopActive ? 'true' : 'false'}
      className={cn('mw-ui-motion-stage', className)}
      style={mergedStyle}
      {...props}
    >
      {children}
    </div>
  );
});
MotionStage.displayName = 'MotionStage';

export type StaggerGroupProps = ComponentPropsWithoutRef<'div'> & {
  preset?: MotionPreset;
  staggerMs?: number;
  initialDelayMs?: number;
};

export const StaggerGroup = forwardRef<HTMLDivElement, StaggerGroupProps>(function StaggerGroup(
  { preset = 'pop-in', staggerMs = 55, initialDelayMs = 0, className, children, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  return (
    <div
      ref={ref}
      data-slot="stagger-group"
      data-preset={preset}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-stagger-group', className)}
      {...props}
    >
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        const delay = reducedMotion ? 0 : initialDelayMs + index * staggerMs;
        return (
          <div
            className="mw-ui-stagger-item"
            data-preset={preset}
            style={{ '--mw-motion-delay-offset': `${delay}ms` } as CSSProperties}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
});
StaggerGroup.displayName = 'StaggerGroup';

export type ScrollRevealProps = ComponentPropsWithoutRef<'div'> & {
  preset?: MotionPreset;
  once?: boolean;
  threshold?: number;
};

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(function ScrollReveal(
  { preset = 'slide-snap', once = true, threshold = 0.15, className, children, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  const localRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    reducedMotion || typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const node = localRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, reducedMotion]);

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="scroll-reveal"
      data-preset={preset}
      data-visible={visible ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-scroll-reveal', className)}
      {...props}
    >
      {children}
    </div>
  );
});
ScrollReveal.displayName = 'ScrollReveal';

export type KineticTextVariant =
  | 'brush-reveal'
  | 'stamp-drop'
  | 'wave-bounce'
  | 'glitch-snap'
  | 'typewriter';

export type KineticTextProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  text: string;
  variant?: KineticTextVariant;
  splitBy?: 'word' | 'char';
  staggerMs?: number;
};

export const KineticText = forwardRef<HTMLSpanElement, KineticTextProps>(function KineticText(
  { text, variant = 'stamp-drop', splitBy = 'word', staggerMs = 45, className, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  const segments = useMemo(
    () => (splitBy === 'char' ? Array.from(text) : text.split(/(\s+)/)),
    [text, splitBy]
  );

  return (
    <span
      ref={ref}
      data-slot="kinetic-text"
      data-variant={variant}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-label={text}
      className={cn('mw-ui-kinetic-text', className)}
      {...props}
    >
      {segments.map((seg, idx) => (
        <span
          key={`${idx}-${seg}`}
          aria-hidden="true"
          className="mw-ui-kinetic-segment"
          style={
            {
              '--mw-motion-delay-offset': reducedMotion ? '0ms' : `${idx * staggerMs}ms`,
            } as CSSProperties
          }
        >
          {seg === ' ' ? '\u00A0' : seg}
        </span>
      ))}
    </span>
  );
});
KineticText.displayName = 'KineticText';

export type AnimatedNumberProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: (value: number) => string;
};

export const AnimatedNumber = forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  function AnimatedNumber(
    { value, durationMs = 360, decimals = 0, prefix = '', suffix = '', format, className, ...props },
    ref
  ) {
    const { reducedMotion } = useMotion();
    const [display, setDisplay] = useState(value);
    const prevRef = useRef(value);

    useEffect(() => {
      const from = prevRef.current;
      prevRef.current = value;
      if (
        reducedMotion ||
        durationMs <= 0 ||
        from === value ||
        typeof window === 'undefined' ||
        typeof requestAnimationFrame !== 'function'
      ) {
        setDisplay(value);
        return;
      }
      let rafId = 0;
      const start = performance.now();
      const step = (now: number) => {
        const progress = clampUnit((now - start) / durationMs);
        const eased = evaluateEasing(progress, 'ease-out');
        setDisplay(from + (value - from) * eased);
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setDisplay(value);
        }
      };
      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    }, [value, durationMs, reducedMotion]);

    const formatted = format
      ? format(display)
      : `${prefix}${display.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`;

    return (
      <span
        ref={ref}
        data-slot="animated-number"
        data-value={value}
        className={cn('mw-ui-animated-number', className)}
        {...props}
      >
        {formatted}
      </span>
    );
  }
);
AnimatedNumber.displayName = 'AnimatedNumber';

export type MarqueeRibbonProps = ComponentPropsWithoutRef<'div'> & {
  items: readonly string[];
  speedSec?: number;
  reverse?: boolean;
  tone?: 'ink' | 'accent' | 'paper';
};

export const MarqueeRibbon = forwardRef<HTMLDivElement, MarqueeRibbonProps>(function MarqueeRibbon(
  { items, speedSec = 22, reverse = false, tone = 'ink', className, style, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  return (
    <div
      ref={ref}
      data-slot="marquee-ribbon"
      data-tone={tone}
      data-reverse={reverse ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-marquee', className)}
      style={{ ...style, '--mw-marquee-duration': `${Math.max(4, speedSec)}s` } as CSSProperties}
      {...props}
    >
      <div className="mw-ui-marquee-track">
        {items.map((item, idx) => (
          <span key={`a-${idx}`} className="mw-ui-marquee-item">
            {item}
          </span>
        ))}
        {!reducedMotion
          ? items.map((item, idx) => (
              <span key={`b-${idx}`} aria-hidden="true" className="mw-ui-marquee-item">
                {item}
              </span>
            ))
          : null}
      </div>
    </div>
  );
});
MarqueeRibbon.displayName = 'MarqueeRibbon';

export type PageTransitionVariant =
  | 'ink-wipe'
  | 'iris-circle'
  | 'curtain-split'
  | 'halftone-dissolve';

export type PageTransitionCurtainProps = ComponentPropsWithoutRef<'div'> & {
  active: boolean;
  variant?: PageTransitionVariant;
  label?: string;
};

export const PageTransitionCurtain = forwardRef<HTMLDivElement, PageTransitionCurtainProps>(
  function PageTransitionCurtain(
    { active, variant = 'ink-wipe', label, className, ...props },
    ref
  ) {
    const { reducedMotion } = useMotion();
    return (
      <div
        ref={ref}
        aria-hidden={!active}
        data-slot="page-transition-curtain"
        data-active={active ? 'true' : 'false'}
        data-variant={variant}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-page-curtain', className)}
        {...props}
      >
        {label ? <span className="mw-ui-page-curtain-label">{label}</span> : null}
      </div>
    );
  }
);
PageTransitionCurtain.displayName = 'PageTransitionCurtain';

export type ScreenFXKind =
  | 'flash'
  | 'vignette'
  | 'scanlines'
  | 'speedlines-burst'
  | 'chromatic-pulse';

export type ScreenFXOverlayProps = ComponentPropsWithoutRef<'div'> & {
  effect: ScreenFXKind;
  active?: boolean;
};

export const ScreenFXOverlay = forwardRef<HTMLDivElement, ScreenFXOverlayProps>(
  function ScreenFXOverlay({ effect, active = true, className, ...props }, ref) {
    const { reducedMotion } = useMotion();
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-slot="screen-fx-overlay"
        data-effect={effect}
        data-active={active ? 'true' : 'false'}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-screen-fx', className)}
        {...props}
      />
    );
  }
);
ScreenFXOverlay.displayName = 'ScreenFXOverlay';

export type MorphButtonStatus = 'idle' | 'loading' | 'success' | 'error';

export type StateMorphButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  status: MorphButtonStatus;
  idleLabel: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  sfxPreset?: ProceduralSfxPreset;
};

export const StateMorphButton = forwardRef<HTMLButtonElement, StateMorphButtonProps>(
  function StateMorphButton(
    {
      status,
      idleLabel,
      loadingLabel = 'Working…',
      successLabel = 'Done',
      errorLabel = 'Retry',
      sfxPreset = 'toggle-pop',
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) {
    const { triggerSfx } = useMotion();
    const label =
      status === 'loading'
        ? loadingLabel
        : status === 'success'
          ? successLabel
          : status === 'error'
            ? errorLabel
            : idleLabel;

    return (
      <button
        ref={ref}
        type="button"
        data-slot="state-morph-button"
        data-status={status}
        aria-busy={status === 'loading' || undefined}
        disabled={disabled || status === 'loading'}
        className={cn('mw-ui-button mw-ui-morph-button', className)}
        onClick={(event) => {
          triggerSfx(sfxPreset);
          onClick?.(event);
        }}
        {...props}
      >
        {status === 'loading' ? (
          <span aria-hidden="true" className="mw-ui-morph-spinner" />
        ) : status === 'success' ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mw-ui-morph-check"
          >
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        ) : status === 'error' ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        ) : null}
        <span>{label}</span>
      </button>
    );
  }
);
StateMorphButton.displayName = 'StateMorphButton';

export {
  buildMotionTimelineSvgGeometry,
  DEFAULT_MOTION_TIMELINE_KEYFRAMES,
  evaluateMotionTimeline,
  normalizeKeyframes,
  type MotionTimelineEvaluation,
  type MotionTimelineKeyframe,
  type MotionTimelineSvgGeometry,
  type MotionTimelineSvgNode,
  type MotionTimelineSvgOptions,
  type MotionTimelineSvgSegment,
  type NormalizedMotionKeyframe,
} from './timeline-math.js';

export {
  applyEasingPresetToKeyframes,
  buildEasingPreviewPathD,
  filterEasingPresets,
  getEasingPresetById,
  MOTION_EASING_CATEGORIES,
  MOTION_EASING_PRESETS,
  type MotionEasingApplyScope,
  type MotionEasingCategory,
  type MotionEasingPreset,
} from './easing-presets.js';

export {
  MotionTimeline,
  type MotionTimelineProps,
  type MotionTimelineSpeed,
} from '../components/motion-timeline.js';

