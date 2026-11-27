'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';
import { cn } from '../lib/cn.js';
import {
  clampUnit,
  type MotionEasingName,
} from '../motion/physics.js';
import {
  applyEasingPresetToKeyframes,
  buildEasingPreviewPathD,
  filterEasingPresets,
  getEasingPresetById,
  MOTION_EASING_CATEGORIES,
  MOTION_EASING_PRESETS,
  type MotionEasingApplyScope,
  type MotionEasingCategory,
  type MotionEasingPreset,
} from '../motion/easing-presets.js';
import {
  buildMotionTimelineSvgGeometry,
  DEFAULT_MOTION_TIMELINE_KEYFRAMES,
  evaluateMotionTimeline,
  normalizeKeyframes,
  type MotionTimelineKeyframe,
  type NormalizedMotionKeyframe,
} from '../motion/timeline-math.js';
import { useMotion } from '../motion/index.js';

export type MotionTimelineSpeed = 0.5 | 1 | 1.5;

const SPEED_OPTIONS: readonly MotionTimelineSpeed[] = [0.5, 1, 1.5];

export type MotionTimelineProps = Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> & {
  title?: string;
  subtitle?: string;
  keyframes?: readonly MotionTimelineKeyframe[];
  durationMs?: number;
  defaultEasing?: MotionEasingName;
  playing?: boolean;
  defaultPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  progress?: number;
  defaultProgress?: number;
  onProgressChange?: (progress: number) => void;
  loop?: boolean;
  defaultLoop?: boolean;
  speed?: MotionTimelineSpeed;
  showPreview?: boolean;
  allowEasingEdit?: boolean;
  showPresetLibrary?: boolean;
  defaultApplyScope?: MotionEasingApplyScope;
  onKeyframeSelect?: (keyframe: NormalizedMotionKeyframe, index: number) => void;
  onSegmentEasingChange?: (segmentIndex: number, easing: MotionEasingName) => void;
  onApplyEasingPreset?: (
    easing: MotionEasingName,
    scope: MotionEasingApplyScope,
    segmentIndex: number
  ) => void;
};

export const MotionTimeline = forwardRef<HTMLDivElement, MotionTimelineProps>(
  function MotionTimeline(
    {
      title = 'Motion Timeline',
      subtitle,
      keyframes = DEFAULT_MOTION_TIMELINE_KEYFRAMES,
      durationMs = 1600,
      defaultEasing = 'ease-out',
      playing: controlledPlaying,
      defaultPlaying = false,
      onPlayingChange,
      progress: controlledProgress,
      defaultProgress = 0,
      onProgressChange,
      loop: controlledLoop,
      defaultLoop = true,
      speed: controlledSpeed,
      showPreview = true,
      allowEasingEdit = false,
      showPresetLibrary,
      defaultApplyScope = 'all',
      onKeyframeSelect,
      onSegmentEasingChange,
      onApplyEasingPreset,
      className,
      ...props
    },
    ref
  ) {
    const { reducedMotion, triggerSfx } = useMotion();
    const [uncontrolledPlaying, setUncontrolledPlaying] = useState(
      () => defaultPlaying && !reducedMotion
    );
    const [uncontrolledProgress, setUncontrolledProgress] = useState(() =>
      clampUnit(defaultProgress)
    );
    const [uncontrolledLoop, setUncontrolledLoop] = useState(defaultLoop);
    const [uncontrolledSpeed, setUncontrolledSpeed] = useState<MotionTimelineSpeed>(1);
    const [presetCategory, setPresetCategory] = useState<'all' | MotionEasingCategory>('all');
    const [applyScope, setApplyScope] = useState<MotionEasingApplyScope>(defaultApplyScope);
    const [localKeyframes, setLocalKeyframes] =
      useState<readonly MotionTimelineKeyframe[] | null>(null);

    useEffect(() => {
      setLocalKeyframes(null);
    }, [keyframes]);

    const isPlaying = controlledPlaying ?? uncontrolledPlaying;
    const currentProgress = clampUnit(controlledProgress ?? uncontrolledProgress);
    const isLooping = controlledLoop ?? uncontrolledLoop;
    const playbackSpeed = controlledSpeed ?? uncontrolledSpeed;
    const safeDuration = Math.max(200, durationMs);
    const presetLibraryVisible = showPresetLibrary ?? allowEasingEdit;

    const progressRef = useRef(currentProgress);
    progressRef.current = currentProgress;

    const setPlaying = useCallback(
      (next: boolean) => {
        if (controlledPlaying === undefined) {
          setUncontrolledPlaying(next);
        }
        onPlayingChange?.(next);
      },
      [controlledPlaying, onPlayingChange]
    );

    const setProgress = useCallback(
      (next: number) => {
        const clamped = clampUnit(next);
        progressRef.current = clamped;
        if (controlledProgress === undefined) {
          setUncontrolledProgress(clamped);
        }
        onProgressChange?.(clamped);
      },
      [controlledProgress, onProgressChange]
    );

    const effectiveKeyframes = localKeyframes ?? keyframes;

    const normalizedKeyframes = useMemo(
      () => normalizeKeyframes(effectiveKeyframes, defaultEasing),
      [effectiveKeyframes, defaultEasing]
    );

    useEffect(() => {
      if (!isPlaying || typeof window === 'undefined') {
        return;
      }

      if (reducedMotion || typeof window.requestAnimationFrame !== 'function') {
        const stepMs = 250;
        const intervalId = window.setInterval(() => {
          const delta = (stepMs * playbackSpeed) / safeDuration;
          let next = progressRef.current + delta;
          if (next >= 1) {
            if (isLooping) {
              next = next % 1;
            } else {
              setProgress(1);
              setPlaying(false);
              return;
            }
          }
          setProgress(next);
        }, stepMs);
        return () => window.clearInterval(intervalId);
      }

      let rafId = 0;
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = Math.min(80, Math.max(0, now - lastTime));
        lastTime = now;
        const delta = (dt * playbackSpeed) / safeDuration;
        let next = progressRef.current + delta;

        if (next >= 1) {
          if (isLooping) {
            next = next % 1;
          } else {
            setProgress(1);
            setPlaying(false);
            return;
          }
        }

        setProgress(next);
        rafId = window.requestAnimationFrame(tick);
      };

      rafId = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(rafId);
    }, [isPlaying, isLooping, playbackSpeed, safeDuration, reducedMotion, setPlaying, setProgress]);

    const evaluation = useMemo(
      () => evaluateMotionTimeline(normalizedKeyframes, currentProgress, defaultEasing),
      [normalizedKeyframes, currentProgress, defaultEasing]
    );

    const geometry = useMemo(
      () =>
        buildMotionTimelineSvgGeometry(normalizedKeyframes, currentProgress, {
          width: 800,
          height: 196,
          padX: 40,
          padY: 28,
          samplesPerSegment: 32,
          defaultEasing,
        }),
      [normalizedKeyframes, currentProgress, defaultEasing]
    );

    const elapsedMs = Math.round(currentProgress * safeDuration);
    const clampedSegIndex = Math.min(
      Math.max(0, evaluation.segmentIndex),
      Math.max(0, geometry.segmentPaths.length - 1)
    );
    const activeSegment = geometry.segmentPaths[clampedSegIndex];
    const inspectedSegment = activeSegment;

    const visiblePresets = useMemo(
      () => filterEasingPresets(presetCategory),
      [presetCategory]
    );

    const activePresetMeta = useMemo(
      () => getEasingPresetById(inspectedSegment?.easing ?? evaluation.easing),
      [inspectedSegment?.easing, evaluation.easing]
    );

    const allSegmentsShareEasing = useMemo(() => {
      if (geometry.segmentPaths.length === 0) return null;
      const first = geometry.segmentPaths[0].easing;
      return geometry.segmentPaths.every((seg) => seg.easing === first) ? first : null;
    }, [geometry.segmentPaths]);

    const handleTogglePlay = () => {
      if (!isPlaying && currentProgress >= 0.999) {
        setProgress(0);
      }
      const next = !isPlaying;
      setPlaying(next);
      triggerSfx(next ? 'drawer-whoosh' : 'click-soft');
    };

    const handleReset = () => {
      setPlaying(false);
      setProgress(0);
      triggerSfx('click-soft');
    };

    const handleJumpToKeyframe = (kf: NormalizedMotionKeyframe, idx: number) => {
      setPlaying(false);
      setProgress(kf.at);
      onKeyframeSelect?.(kf, idx);
      triggerSfx('toggle-pop');
    };

    const handleSelectEasingPreset = (preset: MotionEasingPreset) => {
      if (onApplyEasingPreset) {
        onApplyEasingPreset(preset.id, applyScope, clampedSegIndex);
      } else if (onSegmentEasingChange) {
        if (applyScope === 'all') {
          for (let i = 0; i < geometry.segmentPaths.length; i += 1) {
            onSegmentEasingChange(i, preset.id);
          }
        } else {
          onSegmentEasingChange(clampedSegIndex, preset.id);
        }
      } else {
        setLocalKeyframes((prev) =>
          applyEasingPresetToKeyframes(prev ?? normalizedKeyframes, preset.id, applyScope, clampedSegIndex)
        );
      }
      triggerSfx('toggle-pop');
    };

    const previewPuckLeft = `calc(14px + (${Math.max(-0.08, Math.min(1.08, evaluation.value)).toFixed(4)} * (100% - 56px)))`;
    const previewScale = (0.86 + Math.max(0, Math.min(1.2, evaluation.value)) * 0.24).toFixed(3);

    return (
      <div
        ref={ref}
        data-slot="motion-timeline"
        data-playing={isPlaying ? 'true' : 'false'}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-motion-timeline', className)}
        {...props}
      >
        <div className="mw-ui-motion-timeline-header">
          <div className="mw-ui-motion-timeline-heading">
            <h4 className="mw-ui-motion-timeline-title">{title}</h4>
            {subtitle ? <p className="mw-ui-motion-timeline-subtitle">{subtitle}</p> : null}
          </div>

          <div className="mw-ui-motion-timeline-controls" role="group" aria-label="Timeline playback controls">
            <button
              type="button"
              className="mw-ui-motion-timeline-play"
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Pause animation timeline' : 'Play animation timeline'}
              onClick={handleTogglePlay}
            >
              {isPlaying ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="currentColor"
                >
                  <rect x="3" y="2.5" width="3.5" height="11" rx="0.75" />
                  <rect x="9.5" y="2.5" width="3.5" height="11" rx="0.75" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="currentColor"
                >
                  <path d="M4 2.5L13.5 8L4 13.5V2.5Z" />
                </svg>
              )}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              className="mw-ui-motion-timeline-btn"
              aria-label="Reset timeline to start"
              onClick={handleReset}
            >
              Reset
            </button>

            {controlledLoop === undefined ? (
              <button
                type="button"
                className="mw-ui-motion-timeline-btn"
                data-active={isLooping ? 'true' : 'false'}
                aria-pressed={isLooping}
                onClick={() => {
                  setUncontrolledLoop((prev) => !prev);
                  triggerSfx('click-soft');
                }}
              >
                {isLooping ? 'Loop: On' : 'Loop: Off'}
              </button>
            ) : null}

            {controlledSpeed === undefined ? (
              <div className="mw-ui-motion-timeline-speeds" role="group" aria-label="Playback speed">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className="mw-ui-motion-timeline-btn"
                    data-active={playbackSpeed === rate ? 'true' : 'false'}
                    aria-pressed={playbackSpeed === rate}
                    onClick={() => setUncontrolledSpeed(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mw-ui-motion-timeline-stage">
          <svg
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            className="mw-ui-motion-timeline-svg"
            role="img"
            aria-label={`${title} easing curve visualization at ${Math.round(currentProgress * 100)}% progress`}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const x = geometry.plotLeft + tick * (geometry.plotRight - geometry.plotLeft);
              return (
                <g key={tick}>
                  <line
                    x1={x}
                    y1={geometry.plotTop}
                    x2={x}
                    y2={geometry.plotBottom}
                    className="mw-ui-motion-timeline-grid-v"
                  />
                  <text
                    x={x}
                    y={geometry.height - 6}
                    textAnchor="middle"
                    className="mw-ui-motion-timeline-axis-label"
                  >
                    {Math.round(tick * 100)}%
                  </text>
                </g>
              );
            })}

            <line
              x1={geometry.plotLeft}
              y1={geometry.oneY}
              x2={geometry.plotRight}
              y2={geometry.oneY}
              className="mw-ui-motion-timeline-grid-h"
            />
            <line
              x1={geometry.plotLeft}
              y1={(geometry.oneY + geometry.zeroY) / 2}
              x2={geometry.plotRight}
              y2={(geometry.oneY + geometry.zeroY) / 2}
              className="mw-ui-motion-timeline-grid-h"
            />
            <line
              x1={geometry.plotLeft}
              y1={geometry.zeroY}
              x2={geometry.plotRight}
              y2={geometry.zeroY}
              className="mw-ui-motion-timeline-grid-h"
            />

            <text
              x={geometry.plotLeft - 10}
              y={geometry.oneY + 3}
              textAnchor="end"
              className="mw-ui-motion-timeline-axis-label"
            >
              1.0
            </text>
            <text
              x={geometry.plotLeft - 10}
              y={geometry.zeroY + 3}
              textAnchor="end"
              className="mw-ui-motion-timeline-axis-label"
            >
              0.0
            </text>

            {geometry.areaPathD ? (
              <path d={geometry.areaPathD} className="mw-ui-motion-timeline-area" />
            ) : null}

            {geometry.segmentPaths.map((seg) => (
              <path
                key={`${seg.fromId}-${seg.toId}`}
                d={seg.d}
                data-segment-index={seg.index}
                data-active={seg.index === evaluation.segmentIndex ? 'true' : 'false'}
                className="mw-ui-motion-timeline-segment-path"
              />
            ))}

            {geometry.elapsedPathD ? (
              <path d={geometry.elapsedPathD} className="mw-ui-motion-timeline-elapsed-path" />
            ) : null}

            <line
              x1={geometry.playhead.x}
              y1={geometry.plotTop}
              x2={geometry.playhead.x}
              y2={geometry.plotBottom}
              className="mw-ui-motion-timeline-playhead-line"
            />

            {geometry.keyframeNodes.map((node, idx) => {
              const isReached = currentProgress + 0.001 >= node.at;
              const isActive = evaluation.activeKeyframe.id === node.id;
              const targetKf = normalizedKeyframes[idx];
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x.toFixed(2)}, ${node.y.toFixed(2)})`}
                  className="mw-ui-motion-timeline-node"
                  data-reached={isReached ? 'true' : 'false'}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => {
                    if (targetKf) handleJumpToKeyframe(targetKf, idx);
                  }}
                >
                  <polygon
                    points="0,-6.5 6.5,0 0,6.5 -6.5,0"
                    className="mw-ui-motion-timeline-diamond"
                  />
                  <text y="-11" textAnchor="middle" className="mw-ui-motion-timeline-node-label">
                    {node.label}
                  </text>
                </g>
              );
            })}

            <circle
              cx={geometry.playhead.x}
              cy={geometry.playhead.y}
              r="6"
              className="mw-ui-motion-timeline-playhead-dot"
            />
          </svg>

          <div className="mw-ui-motion-timeline-scrubber-row">
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(currentProgress * 1000)}
              onChange={(event) => {
                setPlaying(false);
                setProgress(Number(event.target.value) / 1000);
              }}
              aria-label="Scrub animation timeline progress"
              className="mw-ui-motion-timeline-scrubber"
            />
          </div>

          <div className="mw-ui-motion-timeline-readout" role="status" aria-live="off">
            <span>
              time: <strong>{elapsedMs}ms</strong> / {safeDuration}ms
            </span>
            <span>
              progress: <strong>{Math.round(currentProgress * 100)}%</strong>
            </span>
            <span>
              value: <strong>{evaluation.value.toFixed(2)}</strong>
            </span>
            <span>
              easing: <strong>{evaluation.easing}</strong>
            </span>
          </div>
        </div>

        {showPreview ? (
          <div className="mw-ui-motion-timeline-preview" aria-label="Live keyframe motion preview">
            <span className="mw-ui-motion-timeline-preview-label">Live Keyframe Output</span>
            <div className="mw-ui-motion-timeline-preview-track">
              {normalizedKeyframes.map((kf) => (
                <span
                  key={`tick-${kf.id}`}
                  aria-hidden="true"
                  className="mw-ui-motion-timeline-preview-tick"
                  style={{ left: `calc(14px + (${kf.value.toFixed(4)} * (100% - 56px)) + 14px)` }}
                />
              ))}
              <div
                className="mw-ui-motion-timeline-preview-puck"
                style={
                  {
                    left: previewPuckLeft,
                    transform: `translateY(-50%) scale(${previewScale})`,
                  } as CSSProperties
                }
              />
            </div>
          </div>
        ) : null}

        <div className="mw-ui-motion-timeline-keyframes" role="group" aria-label="Animation keyframes">
          {normalizedKeyframes.map((kf, idx) => {
            const isActive = evaluation.activeKeyframe.id === kf.id;
            const isLast = idx === normalizedKeyframes.length - 1;
            const kfMs = Math.round(kf.at * safeDuration);
            return (
              <button
                key={kf.id}
                type="button"
                className="mw-ui-motion-timeline-kf-card"
                data-active={isActive ? 'true' : 'false'}
                aria-pressed={isActive}
                onClick={() => handleJumpToKeyframe(kf, idx)}
              >
                <span className="mw-ui-motion-timeline-kf-head">
                  <span className="mw-ui-motion-timeline-kf-index">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="mw-ui-motion-timeline-kf-label">{kf.label}</span>
                  <span className="mw-ui-motion-timeline-kf-time">{kfMs}ms</span>
                </span>
                <span className="mw-ui-motion-timeline-kf-meta">
                  <span>val {kf.value.toFixed(2)}</span>
                  {!isLast ? (
                    <span className="mw-ui-motion-timeline-kf-easing">→ {kf.easing}</span>
                  ) : (
                    <span className="mw-ui-motion-timeline-kf-easing">end</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {presetLibraryVisible ? (
          <div
            className="mw-ui-motion-timeline-presets"
            data-slot="motion-timeline-preset-library"
          >
            <div className="mw-ui-motion-timeline-presets-head">
              <div className="mw-ui-motion-timeline-presets-meta">
                <span className="mw-ui-motion-timeline-presets-title">
                  Easing Curve Preset Library ({MOTION_EASING_PRESETS.length})
                </span>
                <span className="mw-ui-motion-timeline-presets-hint">
                  {applyScope === 'all'
                    ? 'Select a curve to update all timeline segments instantly'
                    : inspectedSegment
                      ? `Editing Segment ${inspectedSegment.index + 1} (${normalizedKeyframes[inspectedSegment.index]?.label} → ${normalizedKeyframes[inspectedSegment.index + 1]?.label})`
                      : 'Select a curve'}
                  {activePresetMeta ? ` · ${activePresetMeta.cssEquivalent}` : ''}
                </span>
              </div>

              <div
                className="mw-ui-motion-timeline-scope"
                role="group"
                aria-label="Easing preset apply scope"
              >
                <button
                  type="button"
                  className="mw-ui-motion-timeline-btn"
                  data-active={applyScope === 'all' ? 'true' : 'false'}
                  aria-pressed={applyScope === 'all'}
                  onClick={() => setApplyScope('all')}
                >
                  All Segments
                </button>
                <button
                  type="button"
                  className="mw-ui-motion-timeline-btn"
                  data-active={applyScope === 'segment' ? 'true' : 'false'}
                  aria-pressed={applyScope === 'segment'}
                  onClick={() => setApplyScope('segment')}
                >
                  Active Segment
                </button>
              </div>
            </div>

            <div
              className="mw-ui-motion-timeline-categories"
              role="group"
              aria-label="Easing preset categories"
            >
              {MOTION_EASING_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="mw-ui-motion-timeline-btn"
                  data-active={presetCategory === cat.id ? 'true' : 'false'}
                  aria-pressed={presetCategory === cat.id}
                  onClick={() => setPresetCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div
              className="mw-ui-motion-timeline-preset-grid"
              role="group"
              aria-label="Easing curve presets"
            >
              {visiblePresets.map((preset) => {
                const isSelected =
                  applyScope === 'all'
                    ? allSegmentsShareEasing === preset.id
                    : inspectedSegment?.easing === preset.id;
                const previewPath = buildEasingPreviewPathD(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="mw-ui-motion-timeline-preset-card"
                    data-active={isSelected ? 'true' : 'false'}
                    data-preset-id={preset.id}
                    aria-pressed={isSelected}
                    title={preset.description}
                    onClick={() => handleSelectEasingPreset(preset)}
                  >
                    <svg
                      viewBox="0 0 76 34"
                      aria-hidden="true"
                      className="mw-ui-motion-timeline-preset-svg"
                    >
                      <line
                        x1="6"
                        y1="10"
                        x2="70"
                        y2="10"
                        className="mw-ui-motion-timeline-preset-guide"
                      />
                      <line
                        x1="6"
                        y1="24"
                        x2="70"
                        y2="24"
                        className="mw-ui-motion-timeline-preset-guide"
                      />
                      <path d={previewPath} className="mw-ui-motion-timeline-preset-path" />
                    </svg>
                    <span className="mw-ui-motion-timeline-preset-name">{preset.label}</span>
                    <span className="mw-ui-motion-timeline-preset-id">{preset.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);
MotionTimeline.displayName = 'MotionTimeline';

export type {
  MotionEasingApplyScope,
  MotionEasingCategory,
  MotionEasingPreset,
  MotionTimelineKeyframe,
  NormalizedMotionKeyframe,
};
export {
  DEFAULT_MOTION_TIMELINE_KEYFRAMES,
  MOTION_EASING_CATEGORIES,
  MOTION_EASING_PRESETS,
};

