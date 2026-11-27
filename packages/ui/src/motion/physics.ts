export type MotionEasingName =
  | 'linear'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-out-expo'
  | 'ease-in-back'
  | 'ease-out-back'
  | 'ease-in-out-back'
  | 'spring'
  | 'overshoot'
  | 'bounce'
  | 'elastic'
  | 'anticipation'
  | 'steps-8'
  | 'steps-12'
  | 'steps-24';

export type MotionProfile = 'off' | 'subtle' | 'expressive' | 'cartoon';

export type LipSyncPhoneme = 'closed' | 'small' | 'wide' | 'o-shape';

export interface SpringConfig {
  readonly stiffness?: number;
  readonly damping?: number;
  readonly mass?: number;
  readonly precision?: number;
}

export interface SpringState {
  readonly value: number;
  readonly velocity: number;
  readonly settled: boolean;
}

export interface CameraShakeOffset {
  readonly x: number;
  readonly y: number;
  readonly rotateDeg: number;
}

export const MOTION_EASING_NAMES: readonly MotionEasingName[] = Object.freeze([
  'linear',
  'ease-out',
  'ease-in-out',
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
  'ease-out-expo',
  'ease-in-back',
  'ease-out-back',
  'ease-in-out-back',
  'spring',
  'overshoot',
  'bounce',
  'elastic',
  'anticipation',
  'steps-8',
  'steps-12',
  'steps-24',
]);

export const MOTION_PROFILE_SCALES: Readonly<Record<MotionProfile, number>> = Object.freeze({
  off: 0,
  subtle: 0.72,
  expressive: 1,
  cartoon: 1.25,
});

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function evaluateEasing(progress: number, easing: MotionEasingName = 'ease-out'): number {
  const t = clampUnit(progress);
  if (t === 0 || t === 1) return t;

  switch (easing) {
    case 'linear':
      return t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case 'ease-in-cubic':
      return t * t * t;
    case 'ease-out-cubic':
      return 1 - Math.pow(1 - t, 3);
    case 'ease-in-out-cubic':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'ease-out-expo':
      return 1 - Math.pow(2, -10 * t);
    case 'ease-in-back': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * t * t * t - c1 * t * t;
    }
    case 'ease-out-back':
    case 'overshoot': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    case 'ease-in-out-back':
    case 'anticipation': {
      const c1 = 1.70158;
      const c2 = c1 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
    case 'spring': {
      const decay = Math.exp(-6.5 * t);
      return 1 - decay * Math.cos(14 * t);
    }
    case 'elastic': {
      const c4 = (2 * Math.PI) / 3;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      }
      if (t < 2 / d1) {
        const u = t - 1.5 / d1;
        return n1 * u * u + 0.75;
      }
      if (t < 2.5 / d1) {
        const u = t - 2.25 / d1;
        return n1 * u * u + 0.9375;
      }
      const u = t - 2.625 / d1;
      return n1 * u * u + 0.984375;
    }
    case 'steps-8':
      return Math.floor(t * 8) / 8;
    case 'steps-12':
      return Math.floor(t * 12) / 12;
    case 'steps-24':
      return Math.floor(t * 24) / 24;
    default:
      return t;
  }
}

export function sampleEasingCurve(
  easing: MotionEasingName,
  samples = 32
): readonly { readonly t: number; readonly y: number }[] {
  const count = Math.max(2, Math.floor(samples));
  const points: { readonly t: number; readonly y: number }[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    points.push({ t, y: evaluateEasing(t, easing) });
  }
  return points;
}

export function stepSpring(
  current: number,
  target: number,
  velocity: number,
  dtSeconds: number,
  config: SpringConfig = {}
): SpringState {
  const stiffness = config.stiffness ?? 260;
  const damping = config.damping ?? 24;
  const mass = Math.max(0.1, config.mass ?? 1);
  const precision = config.precision ?? 0.002;
  const dt = Math.min(0.05, Math.max(0, dtSeconds));

  if (dt === 0) {
    const settled = Math.abs(target - current) <= precision && Math.abs(velocity) <= precision;
    return { value: settled ? target : current, velocity: settled ? 0 : velocity, settled };
  }

  const force = -stiffness * (current - target);
  const damper = -damping * velocity;
  const acceleration = (force + damper) / mass;
  const nextVelocity = velocity + acceleration * dt;
  const nextValue = current + nextVelocity * dt;

  const settled =
    Math.abs(target - nextValue) <= precision && Math.abs(nextVelocity) <= precision;

  return {
    value: settled ? target : nextValue,
    velocity: settled ? 0 : nextVelocity,
    settled,
  };
}

export function computeCameraShakeOffset(
  elapsedMs: number,
  durationMs: number,
  intensityPx = 8,
  seed = 1
): CameraShakeOffset {
  if (durationMs <= 0 || elapsedMs < 0 || elapsedMs >= durationMs || intensityPx <= 0) {
    return { x: 0, y: 0, rotateDeg: 0 };
  }
  const progress = clampUnit(elapsedMs / durationMs);
  const decay = (1 - progress) * (1 - progress);
  const phase = elapsedMs * 0.065 + seed * 3.17;
  const x = Math.round(Math.sin(phase * 1.7) * intensityPx * decay * 100) / 100;
  const y = Math.round(Math.cos(phase * 2.3) * intensityPx * 0.72 * decay * 100) / 100;
  const rotateDeg = Math.round(Math.sin(phase * 1.1) * (intensityPx * 0.18) * decay * 100) / 100;
  return {
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
    rotateDeg: Object.is(rotateDeg, -0) ? 0 : rotateDeg,
  };
}

export function computeLipSyncPhoneme(
  text: string,
  visibleChars: number,
  speaking: boolean
): LipSyncPhoneme {
  if (!speaking || visibleChars <= 0 || text.length === 0) {
    return 'closed';
  }
  const idx = Math.min(text.length - 1, Math.max(0, visibleChars - 1));
  const ch = text[idx]?.toLowerCase() ?? '';
  if (!ch || /[\s.,!?;:\-—]/.test(ch)) {
    return 'closed';
  }
  if (/[ou0]/.test(ch)) {
    return 'o-shape';
  }
  if (/[aei]/.test(ch)) {
    return 'wide';
  }
  return 'small';
}
