'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createSpriteSequenceAdapter } from '../lib/character-adapter.js';
import { cn } from '../lib/cn.js';
import {
  createScenePlaybackController,
  type ScenePlaybackController,
  type ScenePlaybackSnapshot,
} from '../lib/scene-playback.js';
import { getActiveSceneHarness } from '../lib/scene-test-harness.js';
import { useReducedMotion } from '../lib/use-reduced-motion.js';

export interface SpriteClipMetadata {
  readonly id: string;
  readonly frames: readonly string[];
  readonly fps?: number;
  readonly durationMs?: number;
  readonly loop?: boolean;
  readonly pingPong?: boolean;
  readonly fallbackAsset: string;
  readonly width: number;
  readonly height: number;
}

/** One image holding every frame in a grid; frames swap by background offset, never by src. */
export interface SpriteSheetAtlas {
  readonly src: string;
  readonly columns: number;
  readonly rows: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameCount?: number;
}

export interface SpritePlayerProps {
  readonly clip: SpriteClipMetadata;
  readonly spriteSheet?: SpriteSheetAtlas;
  readonly label?: string;
  readonly scale?: number;
  readonly playing?: boolean;
  readonly paused?: boolean;
  readonly pinnedFrame?: number;
  readonly reducedMotion?: boolean;
  readonly pauseOffscreen?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly frameStyle?: CSSProperties;
  readonly onFrameChange?: (frameIndex: number) => void;
}

const DEFAULT_SPRITE_FPS = 12;
const spriteAdapter = createSpriteSequenceAdapter();

const isPositiveInt = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

export function isValidSpriteSheet(atlas: SpriteSheetAtlas | undefined): atlas is SpriteSheetAtlas {
  return (
    atlas !== undefined &&
    atlas.src.length > 0 &&
    isPositiveInt(atlas.columns) &&
    isPositiveInt(atlas.rows) &&
    Number.isFinite(atlas.frameWidth) &&
    atlas.frameWidth > 0 &&
    Number.isFinite(atlas.frameHeight) &&
    atlas.frameHeight > 0
  );
}

export function resolveSpriteSheetFrameCount(atlas: SpriteSheetAtlas): number {
  const cells = atlas.columns * atlas.rows;
  return isPositiveInt(atlas.frameCount) && atlas.frameCount <= cells ? atlas.frameCount : cells;
}

/** Background offset (in %) that shows grid cell `frameIndex`, filling rows left to right. */
export function computeSpriteSheetOffset(
  frameIndex: number,
  atlas: Pick<SpriteSheetAtlas, 'columns' | 'rows'>
): { readonly x: number; readonly y: number } {
  const column = frameIndex % atlas.columns;
  const row = Math.floor(frameIndex / atlas.columns) % atlas.rows;
  return {
    x: atlas.columns > 1 ? (column / (atlas.columns - 1)) * 100 : 0,
    y: atlas.rows > 1 ? (row / (atlas.rows - 1)) * 100 : 0,
  };
}

function SpriteSheetFrame({
  atlas,
  frameIndex,
  label,
  style,
}: {
  readonly atlas: SpriteSheetAtlas;
  readonly frameIndex: number;
  readonly label: string;
  readonly style?: CSSProperties;
}) {
  const offset = computeSpriteSheetOffset(frameIndex, atlas);
  return (
    <div
      className="mw-ui-sprite-player-frame"
      role="img"
      aria-label={label}
      data-sprite-atlas="true"
      style={{
        ...style,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${JSON.stringify(atlas.src)})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
        backgroundPosition: `${offset.x}% ${offset.y}%`,
      }}
    />
  );
}

function resolveClipCycleDurationMs(
  clip: Pick<SpriteClipMetadata, 'frames' | 'fps' | 'durationMs' | 'pingPong'>
): number {
  const count = clip.frames.length;
  if (count === 0) return 0;
  const fps =
    typeof clip.fps === 'number' && Number.isFinite(clip.fps) && clip.fps > 0
      ? clip.fps
      : DEFAULT_SPRITE_FPS;
  const baseDurationMs =
    typeof clip.durationMs === 'number' && Number.isFinite(clip.durationMs) && clip.durationMs > 0
      ? clip.durationMs
      : (count / fps) * 1000;

  if (clip.pingPong && count >= 2) {
    const frameDurationMs = baseDurationMs / count;
    return frameDurationMs * (2 * (count - 1));
  }
  return baseDurationMs;
}

export function computeSpriteFrameIndex(
  clip: Pick<SpriteClipMetadata, 'frames' | 'fps' | 'durationMs' | 'loop' | 'pingPong'>,
  timeMs: number,
  options?: {
    readonly reducedMotion?: boolean;
    readonly pinnedFrame?: number;
  }
): number {
  const resolved = spriteAdapter.resolveFrame(
    {
      id: 'sprite-clip',
      format: 'sprite-sequence',
      frames: clip.frames,
      fps: clip.fps,
      durationMs: clip.durationMs,
      loop: clip.loop,
      pingPong: clip.pingPong,
      fallbackAsset: clip.frames[0] ?? '',
    },
    timeMs,
    {
      reducedMotion: options?.reducedMotion,
      pinnedFrame: options?.pinnedFrame,
    }
  );
  return resolved.frameIndex;
}

export function SpritePlayer({
  clip: sourceClip,
  spriteSheet,
  label,
  scale = 1,
  playing = true,
  paused = false,
  pinnedFrame,
  reducedMotion,
  pauseOffscreen = true,
  className,
  style,
  frameStyle,
  onFrameChange,
}: SpritePlayerProps) {
  const harness = getActiveSceneHarness();
  const atlas = isValidSpriteSheet(spriteSheet) ? spriteSheet : undefined;
  const atlasSrc = atlas?.src;
  const atlasFrameCount = atlas ? resolveSpriteSheetFrameCount(atlas) : 0;
  const clip = useMemo<SpriteClipMetadata>(
    () =>
      atlasSrc === undefined
        ? sourceClip
        : { ...sourceClip, frames: Array.from({ length: atlasFrameCount }, () => atlasSrc) },
    [sourceClip, atlasSrc, atlasFrameCount]
  );
  const effectiveReducedMotion = useReducedMotion(reducedMotion);
  const effectivePinnedFrame = pinnedFrame ?? harness?.fixedFrame;
  const effectivePaused = Boolean(paused || harness?.paused === true);
  const fixedTimeMs = harness?.fixedTimeMs;
  const shouldPlay =
    !effectiveReducedMotion &&
    effectivePinnedFrame === undefined &&
    fixedTimeMs === undefined &&
    playing &&
    !effectivePaused &&
    clip.frames.length > 1;

  const clipSignature = useMemo(
    () =>
      [
        clip.id,
        clip.fallbackAsset,
        String(clip.fps ?? ''),
        String(clip.durationMs ?? ''),
        String(clip.loop ?? ''),
        String(clip.pingPong ?? ''),
        clip.frames.join('|'),
      ].join('::'),
    [clip.id, clip.fallbackAsset, clip.fps, clip.durationMs, clip.loop, clip.pingPong, clip.frames]
  );

  const cycleDurationMs = useMemo(() => resolveClipCycleDurationMs(clip), [clip]);

  const [snapshot, setSnapshot] = useState<ScenePlaybackSnapshot>(() => ({
    timeMs: fixedTimeMs ?? 0,
    durationMs: cycleDurationMs > 0 ? cycleDurationMs : null,
    progress: 0,
    requestedPlaying: shouldPlay,
    effectiveState: effectiveReducedMotion ? 'static' : shouldPlay ? 'playing' : 'paused',
    reducedMotion: effectiveReducedMotion,
    visible: true,
    documentHidden: false,
    disposed: false,
    activeHandleCount: 0,
  }));

  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const controllerRef = useRef<ScenePlaybackController | null>(null);
  const lastReportedFrameRef = useRef<number | null>(null);

  const containerRef = useCallback((element: HTMLDivElement | null) => {
    setContainerElement(element);
  }, []);

  useEffect(() => {
    const controller = createScenePlaybackController({
      durationMs: cycleDurationMs > 0 ? cycleDurationMs : undefined,
      loop: clip.loop !== false || Boolean(clip.pingPong),
      initialTimeMs: fixedTimeMs ?? 0,
      autoPlay: shouldPlay,
      reducedMotion: effectiveReducedMotion,
      pauseOffscreen,
    });
    controllerRef.current = controller;
    setSnapshot(controller.getSnapshot());

    const unsubscribe = controller.subscribe(setSnapshot);
    const detachObservers = controller.attachObservers(containerElement);

    return () => {
      unsubscribe();
      detachObservers();
      controller.dispose();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [
    clipSignature,
    clip.loop,
    clip.pingPong,
    cycleDurationMs,
    pauseOffscreen,
    containerElement,
    fixedTimeMs,
    effectiveReducedMotion,
    shouldPlay,
  ]);

  const effectiveTimeMs = fixedTimeMs ?? snapshot.timeMs;
  const isReduced = effectiveReducedMotion || snapshot.reducedMotion;

  const resolved = spriteAdapter.resolveFrame(
    {
      id: clip.id,
      format: 'sprite-sequence',
      frames: clip.frames,
      fps: clip.fps,
      durationMs: clip.durationMs,
      loop: clip.loop,
      pingPong: clip.pingPong,
      fallbackAsset: clip.fallbackAsset,
    },
    effectiveTimeMs,
    {
      reducedMotion: isReduced,
      pinnedFrame: effectivePinnedFrame,
    }
  );

  useEffect(() => {
    if (lastReportedFrameRef.current !== resolved.frameIndex) {
      lastReportedFrameRef.current = resolved.frameIndex;
      onFrameChange?.(resolved.frameIndex);
    }
  }, [resolved.frameIndex, onFrameChange]);

  const spriteState =
    isReduced || clip.frames.length === 0
      ? 'static'
      : effectivePinnedFrame !== undefined
        ? 'pinned'
        : resolved.completed
          ? 'completed'
          : shouldPlay && snapshot.effectiveState === 'playing'
            ? 'playing'
            : 'paused';

  const effectiveScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scaledWidth = Math.max(1, Math.round(clip.width * effectiveScale));
  const scaledHeight = Math.max(1, Math.round(clip.height * effectiveScale));

  return (
    <div
      ref={containerRef}
      className={cn('mw-ui-sprite-player', className)}
      data-sprite-clip={clip.id}
      data-sprite-frame={String(resolved.frameIndex)}
      data-sprite-state={spriteState}
      style={{
        display: 'inline-block',
        width: `min(100%, ${scaledWidth}px)`,
        maxWidth: '100%',
        aspectRatio: atlas
          ? `${atlas.frameWidth} / ${atlas.frameHeight}`
          : `${scaledWidth} / ${scaledHeight}`,
        ...style,
      }}
    >
      {atlas ? (
        <SpriteSheetFrame
          atlas={atlas}
          frameIndex={resolved.frameIndex}
          label={label ?? `${clip.id} sprite frame`}
          style={frameStyle}
        />
      ) : (
      <img
        className="mw-ui-sprite-player-frame"
        src={resolved.asset}
        alt={label ?? `${clip.id} sprite frame`}
        width={scaledWidth}
        height={scaledHeight}
        decoding="async"
        style={{
          ...frameStyle,
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      )}
    </div>
  );
}
