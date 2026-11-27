import { clampUnit, evaluateEasing, type MotionEasingName } from './physics.js';

export interface MotionTimelineKeyframe {
  readonly id: string;
  readonly label: string;
  readonly at: number;
  readonly value: number;
  readonly easing?: MotionEasingName;
}

export interface NormalizedMotionKeyframe {
  readonly id: string;
  readonly label: string;
  readonly at: number;
  readonly value: number;
  readonly easing: MotionEasingName;
}

export interface MotionTimelineEvaluation {
  readonly progress: number;
  readonly value: number;
  readonly segmentIndex: number;
  readonly segmentProgress: number;
  readonly easing: MotionEasingName;
  readonly activeKeyframe: NormalizedMotionKeyframe;
  readonly nextKeyframe: NormalizedMotionKeyframe;
}

export interface MotionTimelineSvgOptions {
  readonly width?: number;
  readonly height?: number;
  readonly padX?: number;
  readonly padY?: number;
  readonly samplesPerSegment?: number;
  readonly defaultEasing?: MotionEasingName;
}

export interface MotionTimelineSvgNode {
  readonly id: string;
  readonly label: string;
  readonly at: number;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly easing: MotionEasingName;
}

export interface MotionTimelineSvgSegment {
  readonly index: number;
  readonly fromId: string;
  readonly toId: string;
  readonly fromAt: number;
  readonly toAt: number;
  readonly easing: MotionEasingName;
  readonly d: string;
  readonly midX: number;
  readonly midY: number;
}

export interface MotionTimelineSvgGeometry {
  readonly width: number;
  readonly height: number;
  readonly padX: number;
  readonly padY: number;
  readonly plotTop: number;
  readonly plotBottom: number;
  readonly plotLeft: number;
  readonly plotRight: number;
  readonly zeroY: number;
  readonly oneY: number;
  readonly fullPathD: string;
  readonly elapsedPathD: string;
  readonly areaPathD: string;
  readonly segmentPaths: readonly MotionTimelineSvgSegment[];
  readonly keyframeNodes: readonly MotionTimelineSvgNode[];
  readonly playhead: { readonly x: number; readonly y: number; readonly value: number };
}

export const DEFAULT_MOTION_TIMELINE_KEYFRAMES: readonly MotionTimelineKeyframe[] = Object.freeze([
  { id: 'kf-start', label: 'Start', at: 0, value: 0, easing: 'anticipation' },
  { id: 'kf-peak', label: 'Launch', at: 0.38, value: 0.88, easing: 'overshoot' },
  { id: 'kf-settle', label: 'Hold', at: 0.72, value: 0.64, easing: 'bounce' },
  { id: 'kf-end', label: 'Rest', at: 1, value: 1, easing: 'ease-out' },
]);

export function normalizeKeyframes(
  keyframes?: readonly MotionTimelineKeyframe[],
  defaultEasing: MotionEasingName = 'ease-out'
): readonly NormalizedMotionKeyframe[] {
  const source =
    keyframes && keyframes.length >= 2 ? keyframes : DEFAULT_MOTION_TIMELINE_KEYFRAMES;

  const cleaned: NormalizedMotionKeyframe[] = source
    .map((kf, index) => ({
      id: kf.id || `kf-${index}`,
      label: kf.label || `KF ${index + 1}`,
      at: clampUnit(kf.at),
      value: clampUnit(kf.value),
      easing: kf.easing ?? defaultEasing,
    }))
    .sort((a, b) => a.at - b.at);

  const deduped: NormalizedMotionKeyframe[] = [];
  for (const kf of cleaned) {
    const prev = deduped[deduped.length - 1];
    if (prev && Math.abs(prev.at - kf.at) < 0.0001) {
      deduped[deduped.length - 1] = kf;
    } else {
      deduped.push(kf);
    }
  }

  if (deduped.length === 0) {
    return DEFAULT_MOTION_TIMELINE_KEYFRAMES.map((kf) => ({
      ...kf,
      easing: kf.easing ?? defaultEasing,
    }));
  }

  if (deduped[0].at > 0) {
    deduped.unshift({
      id: 'kf-auto-start',
      label: 'Start',
      at: 0,
      value: deduped[0].value,
      easing: defaultEasing,
    });
  }

  const last = deduped[deduped.length - 1];
  if (last.at < 1) {
    deduped.push({
      id: 'kf-auto-end',
      label: 'End',
      at: 1,
      value: last.value,
      easing: defaultEasing,
    });
  }

  return deduped;
}

export function evaluateMotionTimeline(
  keyframes: readonly MotionTimelineKeyframe[] | undefined,
  progress: number,
  defaultEasing: MotionEasingName = 'ease-out'
): MotionTimelineEvaluation {
  const normalized = normalizeKeyframes(keyframes, defaultEasing);
  const t = clampUnit(progress);

  let segmentIndex = normalized.length - 2;
  for (let i = 0; i < normalized.length - 1; i += 1) {
    const isLastSegment = i === normalized.length - 2;
    if (t >= normalized[i].at && (t < normalized[i + 1].at || isLastSegment)) {
      segmentIndex = i;
      break;
    }
  }

  const from = normalized[segmentIndex];
  const to = normalized[Math.min(normalized.length - 1, segmentIndex + 1)];
  const span = Math.max(0.0001, to.at - from.at);
  const segmentProgress = clampUnit((t - from.at) / span);
  const easing = from.easing ?? defaultEasing;
  const eased = evaluateEasing(segmentProgress, easing);
  const value = from.value + (to.value - from.value) * eased;

  return {
    progress: t,
    value,
    segmentIndex,
    segmentProgress,
    easing,
    activeKeyframe: segmentProgress >= 0.999 ? to : from,
    nextKeyframe: to,
  };
}

function roundCoord(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
}

export function buildMotionTimelineSvgGeometry(
  keyframes: readonly MotionTimelineKeyframe[] | undefined,
  progress: number,
  options: MotionTimelineSvgOptions = {}
): MotionTimelineSvgGeometry {
  const width = options.width ?? 800;
  const height = options.height ?? 196;
  const padX = options.padX ?? 40;
  const padY = options.padY ?? 28;
  const samplesPerSegment = Math.max(8, Math.floor(options.samplesPerSegment ?? 28));
  const defaultEasing = options.defaultEasing ?? 'ease-out';

  const normalized = normalizeKeyframes(keyframes, defaultEasing);
  const clampedProgress = clampUnit(progress);

  const plotLeft = padX;
  const plotRight = width - padX;
  const plotTop = padY;
  const plotBottom = height - padY;
  const plotW = Math.max(1, plotRight - plotLeft);
  const plotH = Math.max(1, plotBottom - plotTop);

  // Reserve 16% headroom at top & bottom of plot area so overshoot (>1) & anticipation (<0) never clip
  const minVal = -0.22;
  const maxVal = 1.22;
  const valSpan = maxVal - minVal;

  const toX = (t: number) => plotLeft + clampUnit(t) * plotW;
  const toY = (v: number) => {
    const clampedV = Math.max(minVal, Math.min(maxVal, v));
    const norm = (clampedV - minVal) / valSpan;
    return plotBottom - norm * plotH;
  };

  const zeroY = toY(0);
  const oneY = toY(1);

  const fullPoints: { t: number; x: number; y: number }[] = [];
  const segmentPaths: MotionTimelineSvgSegment[] = [];

  for (let i = 0; i < normalized.length - 1; i += 1) {
    const from = normalized[i];
    const to = normalized[i + 1];
    const easing = from.easing ?? defaultEasing;
    const segCoords: { t: number; x: number; y: number }[] = [];

    for (let s = 0; s <= samplesPerSegment; s += 1) {
      const localT = s / samplesPerSegment;
      const globalT = from.at + (to.at - from.at) * localT;
      const eased = evaluateEasing(localT, easing);
      const val = from.value + (to.value - from.value) * eased;
      const pt = { t: globalT, x: toX(globalT), y: toY(val) };
      segCoords.push(pt);
      if (i === 0 || s > 0) {
        fullPoints.push(pt);
      }
    }

    const segD = segCoords
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${roundCoord(pt.x)} ${roundCoord(pt.y)}`)
      .join(' ');

    const midPt = segCoords[Math.floor(segCoords.length / 2)] ?? segCoords[0];

    segmentPaths.push({
      index: i,
      fromId: from.id,
      toId: to.id,
      fromAt: from.at,
      toAt: to.at,
      easing,
      d: segD,
      midX: midPt.x,
      midY: midPt.y,
    });
  }

  const fullPathD = fullPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${roundCoord(pt.x)} ${roundCoord(pt.y)}`)
    .join(' ');

  const evalNow = evaluateMotionTimeline(normalized, clampedProgress, defaultEasing);
  const playhead = {
    x: toX(clampedProgress),
    y: toY(evalNow.value),
    value: evalNow.value,
  };

  const elapsedPts: { x: number; y: number }[] = [];
  for (const pt of fullPoints) {
    if (pt.t <= clampedProgress) {
      elapsedPts.push({ x: pt.x, y: pt.y });
    } else {
      break;
    }
  }
  const lastElapsed = elapsedPts[elapsedPts.length - 1];
  if (
    !lastElapsed ||
    Math.abs(lastElapsed.x - playhead.x) > 0.25 ||
    Math.abs(lastElapsed.y - playhead.y) > 0.25
  ) {
    elapsedPts.push({ x: playhead.x, y: playhead.y });
  }

  const elapsedPathD = elapsedPts
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${roundCoord(pt.x)} ${roundCoord(pt.y)}`)
    .join(' ');

  const areaPathD =
    elapsedPts.length >= 2
      ? `${elapsedPathD} L ${roundCoord(playhead.x)} ${roundCoord(zeroY)} L ${roundCoord(elapsedPts[0].x)} ${roundCoord(zeroY)} Z`
      : '';

  const keyframeNodes: MotionTimelineSvgNode[] = normalized.map((kf) => ({
    id: kf.id,
    label: kf.label,
    at: kf.at,
    value: kf.value,
    x: toX(kf.at),
    y: toY(kf.value),
    easing: kf.easing,
  }));

  return {
    width,
    height,
    padX,
    padY,
    plotTop,
    plotBottom,
    plotLeft,
    plotRight,
    zeroY,
    oneY,
    fullPathD,
    elapsedPathD,
    areaPathD,
    segmentPaths,
    keyframeNodes,
    playhead,
  };
}
