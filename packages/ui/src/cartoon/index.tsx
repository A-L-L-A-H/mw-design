'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn.js';
import { getCharacterById, type CharacterMood } from '../lib/character-registry.js';
import {
  computeLipSyncPhoneme,
  useMotion,
  type LipSyncPhoneme,
  type ProceduralSfxPreset,
} from '../motion/index.js';
import { AnimeCharacterSvg } from './anime-avatar.js';
import {
  AnimeCutIn,
  AnimeEmoteBubble,
  EpisodeTitleCard,
  VisualNovelStage,
  type AnimeCutInProps,
  type AnimeEmoteBubbleProps,
  type AnimeEmoteKind,
  type EpisodeTitleCardProps,
  type VisualNovelLine,
  type VisualNovelStageProps,
} from './anime-stage.js';

export {
  AnimeCharacterSvg,
  AnimeCutIn,
  AnimeEmoteBubble,
  EpisodeTitleCard,
  VisualNovelStage,
  type AnimeCutInProps,
  type AnimeEmoteBubbleProps,
  type AnimeEmoteKind,
  type EpisodeTitleCardProps,
  type VisualNovelLine,
  type VisualNovelStageProps,
};

export function useLipSync(text: string, visibleChars: number, speaking: boolean): LipSyncPhoneme {
  return useMemo(
    () => computeLipSyncPhoneme(text, visibleChars, speaking),
    [text, visibleChars, speaking]
  );
}

export type CartoonRigMood = CharacterMood;
export type CartoonRigPose = 'idle' | 'attack' | 'victory' | 'hurt';
export type CartoonRigSize = 'sm' | 'md' | 'lg';

export type CartoonRigProps = ComponentPropsWithoutRef<'div'> & {
  characterId?: string;
  name?: string;
  mood?: CartoonRigMood;
  pose?: CartoonRigPose;
  size?: CartoonRigSize;
  emote?: AnimeEmoteKind;
  phoneme?: LipSyncPhoneme;
  breathing?: boolean;
  blink?: boolean;
  bounceWalk?: boolean;
  squashTrigger?: number;
  children?: ReactNode;
};

export const CartoonRig = forwardRef<HTMLDivElement, CartoonRigProps>(function CartoonRig(
  {
    characterId,
    name,
    mood,
    pose = 'idle',
    size = 'md',
    emote,
    phoneme = 'closed',
    breathing = true,
    blink = true,
    bounceWalk = false,
    squashTrigger = 0,
    className,
    children,
    ...props
  },
  ref
) {
  const { reducedMotion } = useMotion();
  const [squashing, setSquashing] = useState(false);
  const profile = getCharacterById(characterId);
  const resolvedName = name ?? profile?.name ?? 'Character';
  const resolvedMood: CartoonRigMood = mood ?? profile?.defaultMood ?? 'neutral';

  useEffect(() => {
    if (squashTrigger <= 0 || reducedMotion) return;
    setSquashing(true);
    const timer = window.setTimeout(() => setSquashing(false), 320);
    return () => window.clearTimeout(timer);
  }, [squashTrigger, reducedMotion]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${resolvedName} (${resolvedMood}, mouth ${phoneme})`}
      data-slot="cartoon-rig"
      data-character-id={characterId}
      data-mood={resolvedMood}
      data-pose={pose}
      data-size={size}
      data-phoneme={phoneme}
      data-breathing={breathing && !reducedMotion ? 'true' : 'false'}
      data-blink={blink && !reducedMotion ? 'true' : 'false'}
      data-bounce-walk={bounceWalk && !reducedMotion ? 'true' : 'false'}
      data-squashing={squashing ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-cartoon-rig', className)}
      {...props}
    >
      {emote ? <AnimeEmoteBubble kind={emote} /> : null}
      <div className="mw-ui-cartoon-rig-body">
        {children ?? (
          <AnimeCharacterSvg
            characterId={characterId}
            mood={resolvedMood}
            phoneme={phoneme}
          />
        )}
      </div>
    </div>
  );
});
CartoonRig.displayName = 'CartoonRig';

export type OnomatopoeiaTone = 'impact' | 'electric' | 'speed' | 'comic';

export type OnomatopoeiaSFXProps = ComponentPropsWithoutRef<'div'> & {
  text: string;
  tone?: OnomatopoeiaTone;
  tiltDeg?: number;
  burst?: boolean;
};

export const OnomatopoeiaSFX = forwardRef<HTMLDivElement, OnomatopoeiaSFXProps>(
  function OnomatopoeiaSFX(
    { text, tone = 'impact', tiltDeg = -8, burst = true, className, style, ...props },
    ref
  ) {
    const { reducedMotion } = useMotion();
    return (
      <div
        ref={ref}
        data-slot="onomatopoeia-sfx"
        data-tone={tone}
        data-burst={burst ? 'true' : 'false'}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-cartoon-sfx', className)}
        style={{ ...style, '--mw-sfx-tilt': `${tiltDeg}deg` } as CSSProperties}
        {...props}
      >
        {burst ? (
          <svg
            viewBox="0 0 180 84"
            preserveAspectRatio="none"
            className="mw-ui-cartoon-sfx-burst"
            aria-hidden="true"
          >
            <polygon points="10,20 42,26 56,4 82,22 114,4 126,24 168,14 152,42 176,62 134,58 122,80 92,62 60,80 50,58 8,66 28,42" />
          </svg>
        ) : null}
        <span className="mw-ui-cartoon-sfx-word">{text}</span>
      </div>
    );
  }
);
OnomatopoeiaSFX.displayName = 'OnomatopoeiaSFX';

export type SmearFrameProps = ComponentPropsWithoutRef<'div'> & {
  active: boolean;
  direction?: 'left' | 'right' | 'up';
};

export const SmearFrame = forwardRef<HTMLDivElement, SmearFrameProps>(function SmearFrame(
  { active, direction = 'right', className, children, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  return (
    <div
      ref={ref}
      data-slot="smear-frame"
      data-active={active && !reducedMotion ? 'true' : 'false'}
      data-direction={direction}
      className={cn('mw-ui-cartoon-smear', className)}
      {...props}
    >
      {children}
    </div>
  );
});
SmearFrame.displayName = 'SmearFrame';

export type ImpactFlashProps = ComponentPropsWithoutRef<'div'> & {
  active: boolean;
};

export const ImpactFlash = forwardRef<HTMLDivElement, ImpactFlashProps>(function ImpactFlash(
  { active, className, ...props },
  ref
) {
  const { reducedMotion } = useMotion();
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="impact-flash"
      data-active={active && !reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-cartoon-impact-flash', className)}
      {...props}
    />
  );
});
ImpactFlash.displayName = 'ImpactFlash';

export interface StoryboardBeat {
  readonly id: string;
  readonly label: string;
  readonly durationMs: number;
  readonly characterId?: string;
  readonly speaker: string;
  readonly line: string;
  readonly mood: CartoonRigMood;
  readonly emote?: AnimeEmoteKind;
  readonly sfxWord?: string;
  readonly sfxTone?: OnomatopoeiaTone;
  readonly audioCue?: ProceduralSfxPreset;
  readonly cameraZoom?: number;
  readonly cameraX?: number;
  readonly impactFlash?: boolean;
}

export type TimelineScrubberUIProps = ComponentPropsWithoutRef<'div'> & {
  beats: readonly StoryboardBeat[];
  activeIndex: number;
  playing: boolean;
  speed: number;
  onSelectBeat: (index: number) => void;
  onTogglePlay: () => void;
  onStep: (delta: number) => void;
  onSpeedChange: (speed: number) => void;
};

export const TimelineScrubberUI = forwardRef<HTMLDivElement, TimelineScrubberUIProps>(
  function TimelineScrubberUI(
    {
      beats,
      activeIndex,
      playing,
      speed,
      onSelectBeat,
      onTogglePlay,
      onStep,
      onSpeedChange,
      className,
      ...props
    },
    ref
  ) {
    const totalMs = beats.reduce((sum, b) => sum + b.durationMs, 0);
    return (
      <div
        ref={ref}
        data-slot="timeline-scrubber"
        className={cn('mw-ui-cartoon-timeline', className)}
        {...props}
      >
        <div className="mw-ui-cartoon-timeline-bar">
          <div className="mw-ui-cartoon-timeline-controls">
            <button type="button" className="mw-ui-game-mini-btn" onClick={() => onStep(-1)}>
              Prev
            </button>
            <button type="button" className="mw-ui-game-mini-btn" onClick={onTogglePlay}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="mw-ui-game-mini-btn" onClick={() => onStep(1)}>
              Next
            </button>
          </div>
          <div className="mw-ui-cartoon-timeline-speeds" role="group" aria-label="Playback speed">
            {[0.5, 1, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                aria-pressed={speed === spd}
                className="mw-ui-game-mini-btn"
                onClick={() => onSpeedChange(spd)}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
        <div className="mw-ui-cartoon-tracks" role="tablist" aria-label="Storyboard beats">
          {beats.map((beat, idx) => {
            const widthPct = totalMs > 0 ? Math.max(14, (beat.durationMs / totalMs) * 100) : 33;
            const active = idx === activeIndex;
            return (
              <button
                key={beat.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? 'true' : 'false'}
                className="mw-ui-cartoon-track-beat"
                style={{ flexBasis: `${widthPct}%` }}
                onClick={() => onSelectBeat(idx)}
              >
                <span className="mw-ui-cartoon-track-index">0{idx + 1}</span>
                <span className="mw-ui-cartoon-track-label">{beat.label}</span>
                <small>{(beat.durationMs / 1000).toFixed(1)}s</small>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
TimelineScrubberUI.displayName = 'TimelineScrubberUI';

export type StoryboardPlayerProps = ComponentPropsWithoutRef<'section'> & {
  title: string;
  beats: readonly StoryboardBeat[];
  autoPlay?: boolean;
  onExportJson?: (json: string) => void;
};

export const StoryboardPlayer = forwardRef<HTMLElement, StoryboardPlayerProps>(
  function StoryboardPlayer({ title, beats, autoPlay = false, onExportJson, className, ...props }, ref) {
    const { reducedMotion, triggerSfx } = useMotion();
    const [activeIndex, setActiveIndex] = useState(0);
    const [playing, setPlaying] = useState(autoPlay);
    const [speed, setSpeed] = useState(1);
    const [squashTick, setSquashTick] = useState(0);
    const [visibleChars, setVisibleChars] = useState(0);
    const [exported, setExported] = useState(false);

    const safeIndex = Math.min(Math.max(0, activeIndex), Math.max(0, beats.length - 1));
    const current = beats[safeIndex];
    const currentProfile = getCharacterById(current?.characterId);

    useEffect(() => {
      if (!current) return;
      setSquashTick((n) => n + 1);
      setVisibleChars(reducedMotion ? current.line.length : 0);
      if (current.audioCue) {
        triggerSfx(current.audioCue, currentProfile?.voicePitch ?? 1);
      }
    }, [safeIndex, current, currentProfile?.voicePitch, reducedMotion, triggerSfx]);

    useEffect(() => {
      if (!current || reducedMotion || visibleChars >= current.line.length) return;
      const timer = window.setTimeout(() => {
        setVisibleChars((c) => Math.min(current.line.length, c + 2));
      }, Math.max(16, Math.round(38 / speed)));
      return () => window.clearTimeout(timer);
    }, [current, visibleChars, reducedMotion, speed]);

    useEffect(() => {
      if (!playing || !current || beats.length <= 1) return;
      const timer = window.setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % beats.length);
      }, Math.max(400, Math.round(current.durationMs / speed)));
      return () => window.clearTimeout(timer);
    }, [playing, current, beats.length, speed, safeIndex]);

    const stepBeat = useCallback(
      (delta: number) => {
        if (beats.length === 0) return;
        setActiveIndex((prev) => (prev + delta + beats.length) % beats.length);
      },
      [beats.length]
    );

    const phoneme = useLipSync(
      current?.line ?? '',
      visibleChars,
      Boolean(current && visibleChars < current.line.length)
    );

    const handleExport = useCallback(() => {
      const json = JSON.stringify({ title, beats }, null, 2);
      onExportJson?.(json);
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(json).catch(() => {});
      }
      setExported(true);
      window.setTimeout(() => setExported(false), 1800);
    }, [title, beats, onExportJson]);

    if (!current) return null;

    const stageTransform = reducedMotion
      ? undefined
      : {
          transform: `scale(${current.cameraZoom ?? 1}) translateX(${current.cameraX ?? 0}px)`,
        };

    return (
      <section
        ref={ref}
        aria-label={title}
        data-slot="storyboard-player"
        data-beat-index={safeIndex}
        className={cn('mw-ui-cartoon-player', className)}
        {...props}
      >
        <div className="mw-ui-cartoon-player-head">
          <div className="mw-ui-cartoon-player-meta">
            <span className="mw-ui-cartoon-player-badge">
              BEAT 0{safeIndex + 1} / 0{beats.length}
            </span>
            <strong className="mw-ui-cartoon-player-title">{title}</strong>
          </div>
          <button type="button" className="mw-ui-game-mini-btn" onClick={handleExport}>
            {exported ? 'Copied JSON' : 'Export Storyboard JSON'}
          </button>
        </div>

        <div className="mw-ui-cartoon-stage">
          <ImpactFlash active={Boolean(current.impactFlash)} />
          <div className="mw-ui-cartoon-stage-camera" style={stageTransform}>
            <CartoonRig
              characterId={current.characterId}
              name={current.speaker}
              mood={current.mood}
              emote={current.emote}
              phoneme={phoneme}
              bounceWalk={playing}
              squashTrigger={squashTick}
            />
            {current.sfxWord ? (
              <OnomatopoeiaSFX
                key={`${current.id}-${squashTick}`}
                text={current.sfxWord}
                tone={current.sfxTone ?? 'impact'}
              />
            ) : null}
          </div>
          <div className="mw-ui-cartoon-caption" aria-live="polite">
            <span className="mw-ui-cartoon-caption-speaker">{current.speaker}:</span>{' '}
            <span>{current.line.slice(0, visibleChars)}</span>
          </div>
        </div>

        <TimelineScrubberUI
          beats={beats}
          activeIndex={safeIndex}
          playing={playing}
          speed={speed}
          onSelectBeat={(idx) => setActiveIndex(idx)}
          onTogglePlay={() => setPlaying((p) => !p)}
          onStep={stepBeat}
          onSpeedChange={setSpeed}
        />
      </section>
    );
  }
);
StoryboardPlayer.displayName = 'StoryboardPlayer';
