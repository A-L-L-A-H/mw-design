import { sampleEasingCurve, type MotionEasingName } from './physics.js';
import type { MotionTimelineKeyframe } from './timeline-math.js';

export type MotionEasingCategory = 'standard' | 'back' | 'physics' | 'stepped';

export type MotionEasingApplyScope = 'all' | 'segment';

export interface MotionEasingPreset {
  readonly id: MotionEasingName;
  readonly label: string;
  readonly category: MotionEasingCategory;
  readonly description: string;
  readonly cssEquivalent: string;
  readonly recommendedDurationMs: number;
}

export const MOTION_EASING_CATEGORIES: ReadonlyArray<{
  readonly id: 'all' | MotionEasingCategory;
  readonly label: string;
}> = Object.freeze([
  { id: 'all', label: 'All Curves' },
  { id: 'standard', label: 'Standard' },
  { id: 'back', label: 'Back & Overshoot' },
  { id: 'physics', label: 'Physics' },
  { id: 'stepped', label: 'Stepped / Cel' },
]);

export const MOTION_EASING_PRESETS: readonly MotionEasingPreset[] = Object.freeze([
  {
    id: 'ease-in-out-back',
    label: 'Ease In-Out Back',
    category: 'back',
    description: 'Pulls back cleanly before launching into a snappy overshoot settle.',
    cssEquivalent: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    recommendedDurationMs: 680,
  },
  {
    id: 'ease-out-back',
    label: 'Ease Out Back',
    category: 'back',
    description: 'Fast pop-in that overshoots target before locking into place.',
    cssEquivalent: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    recommendedDurationMs: 480,
  },
  {
    id: 'ease-in-back',
    label: 'Ease In Back',
    category: 'back',
    description: 'Cartoon wind-up pullback before accelerating off stage.',
    cssEquivalent: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
    recommendedDurationMs: 420,
  },
  {
    id: 'elastic',
    label: 'Elastic',
    category: 'physics',
    description: 'High-energy rubber oscillation for badges, hit pops, and toys.',
    cssEquivalent: 'linear(0, 1.15, 0.94, 1.02, 1)',
    recommendedDurationMs: 820,
  },
  {
    id: 'spring',
    label: 'Spring',
    category: 'physics',
    description: 'Damped harmonic spring with crisp organic momentum.',
    cssEquivalent: 'linear(0, 0.62, 1.08, 0.97, 1)',
    recommendedDurationMs: 640,
  },
  {
    id: 'bounce',
    label: 'Bounce',
    category: 'physics',
    description: 'Gravity drop with decaying physical floor rebounds.',
    cssEquivalent: 'linear(0, 0.75, 1, 0.88, 1, 0.96, 1)',
    recommendedDurationMs: 760,
  },
  {
    id: 'ease-out-expo',
    label: 'Ease Out Expo',
    category: 'standard',
    description: 'Explosive instant snap followed by a silky exponential glide.',
    cssEquivalent: 'cubic-bezier(0.16, 1, 0.3, 1)',
    recommendedDurationMs: 420,
  },
  {
    id: 'ease-in-out-cubic',
    label: 'Ease In-Out Cubic',
    category: 'standard',
    description: 'Balanced cinematic acceleration and deceleration for modals and panes.',
    cssEquivalent: 'cubic-bezier(0.65, 0, 0.35, 1)',
    recommendedDurationMs: 520,
  },
  {
    id: 'ease-out-cubic',
    label: 'Ease Out Cubic',
    category: 'standard',
    description: 'Crisp UI entrance curve with confident deceleration.',
    cssEquivalent: 'cubic-bezier(0.33, 1, 0.68, 1)',
    recommendedDurationMs: 360,
  },
  {
    id: 'ease-in-cubic',
    label: 'Ease In Cubic',
    category: 'standard',
    description: 'Accelerating exit curve for dismissing panels and cards.',
    cssEquivalent: 'cubic-bezier(0.32, 0, 0.67, 0)',
    recommendedDurationMs: 320,
  },
  {
    id: 'ease-out',
    label: 'Ease Out Quad',
    category: 'standard',
    description: 'Lightweight quadratic settle for everyday micro-interactions.',
    cssEquivalent: 'cubic-bezier(0.5, 1, 0.89, 1)',
    recommendedDurationMs: 280,
  },
  {
    id: 'ease-in-out',
    label: 'Ease In-Out Quad',
    category: 'standard',
    description: 'Smooth symmetric transition for state toggles and tabs.',
    cssEquivalent: 'cubic-bezier(0.45, 0, 0.55, 1)',
    recommendedDurationMs: 340,
  },
  {
    id: 'linear',
    label: 'Linear',
    category: 'standard',
    description: 'Constant velocity for marquees, spinners, and progress ticks.',
    cssEquivalent: 'linear',
    recommendedDurationMs: 400,
  },
  {
    id: 'overshoot',
    label: 'Overshoot',
    category: 'back',
    description: 'Expressive overshoot punch tuned for comic cards and HUD pops.',
    cssEquivalent: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    recommendedDurationMs: 520,
  },
  {
    id: 'anticipation',
    label: 'Anticipation',
    category: 'back',
    description: 'Classic squash-and-launch anticipation before apex arrival.',
    cssEquivalent: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    recommendedDurationMs: 640,
  },
  {
    id: 'steps-8',
    label: 'Steps 8fps',
    category: 'stepped',
    description: 'Chunky retro arcade / anime hold-frame cadence.',
    cssEquivalent: 'steps(8, end)',
    recommendedDurationMs: 640,
  },
  {
    id: 'steps-12',
    label: 'Steps 12fps',
    category: 'stepped',
    description: 'Hand-drawn cartoon "on twos" stepped cel animation.',
    cssEquivalent: 'steps(12, end)',
    recommendedDurationMs: 720,
  },
  {
    id: 'steps-24',
    label: 'Steps 24fps',
    category: 'stepped',
    description: 'Cinema 24fps discrete frame cadence.',
    cssEquivalent: 'steps(24, end)',
    recommendedDurationMs: 800,
  },
]);

export function getEasingPresetById(id: MotionEasingName): MotionEasingPreset | undefined {
  return MOTION_EASING_PRESETS.find((preset) => preset.id === id);
}

export function filterEasingPresets(
  category: 'all' | MotionEasingCategory = 'all',
  query = ''
): readonly MotionEasingPreset[] {
  const normalizedQuery = query.trim().toLowerCase();
  return MOTION_EASING_PRESETS.filter((preset) => {
    if (category !== 'all' && preset.category !== category) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      preset.id.toLowerCase().includes(normalizedQuery) ||
      preset.label.toLowerCase().includes(normalizedQuery) ||
      preset.description.toLowerCase().includes(normalizedQuery) ||
      preset.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function applyEasingPresetToKeyframes(
  keyframes: readonly MotionTimelineKeyframe[],
  easing: MotionEasingName,
  scope: MotionEasingApplyScope = 'all',
  segmentIndex = 0
): readonly MotionTimelineKeyframe[] {
  if (keyframes.length === 0) return keyframes;
  const lastEditableIndex = Math.max(0, keyframes.length - 2);
  const targetIndex = Math.min(Math.max(0, Math.floor(segmentIndex)), lastEditableIndex);

  return keyframes.map((kf, idx) => {
    if (idx > lastEditableIndex) return kf;
    if (scope === 'all' || idx === targetIndex) {
      return { ...kf, easing };
    }
    return kf;
  });
}

function roundCoord(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
}

export function buildEasingPreviewPathD(
  easing: MotionEasingName,
  width = 76,
  height = 34,
  padX = 6,
  padY = 6,
  samples = 24
): string {
  const pts = sampleEasingCurve(easing, samples);
  const plotW = Math.max(1, width - padX * 2);
  const plotH = Math.max(1, height - padY * 2);
  const minVal = -0.25;
  const maxVal = 1.25;
  const span = maxVal - minVal;

  return pts
    .map((pt, idx) => {
      const x = padX + pt.t * plotW;
      const clampedY = Math.max(minVal, Math.min(maxVal, pt.y));
      const y = height - padY - ((clampedY - minVal) / span) * plotH;
      return `${idx === 0 ? 'M' : 'L'} ${roundCoord(x)} ${roundCoord(y)}`;
    })
    .join(' ');
}
