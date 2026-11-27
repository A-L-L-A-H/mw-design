'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { cn } from '../lib/cn.js';
import { getCharacterById, type CharacterMood } from '../lib/character-registry.js';
import { computeLipSyncPhoneme, useMotion } from '../motion/index.js';
import { AnimeCharacterSvg } from './anime-avatar.js';

export type AnimeEmoteKind = 'sweatdrop' | 'anger' | 'shock' | 'sparkle' | 'question' | 'exclaim';

export type AnimeEmoteBubbleProps = ComponentPropsWithoutRef<'span'> & {
  kind: AnimeEmoteKind;
  active?: boolean;
};

export const AnimeEmoteBubble = forwardRef<HTMLSpanElement, AnimeEmoteBubbleProps>(
  function AnimeEmoteBubble({ kind, active = true, className, ...props }, ref) {
    const { reducedMotion } = useMotion();
    if (!active) return null;
    return (
      <span
        ref={ref}
        aria-hidden="true"
        data-slot="anime-emote-bubble"
        data-kind={kind}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-anime-emote', className)}
        {...props}
      >
        <svg viewBox="0 0 28 28" className="mw-ui-anime-emote-svg" aria-hidden="true">
          {kind === 'sweatdrop' ? (
            <>
              <path d="M 14 3 C 18 9 22 14 22 19 A 8 8 0 0 1 6 19 C 6 14 10 9 14 3 Z" className="mw-ui-anime-emote-fill" />
              <path d="M 11 17 C 11 19.5 12.2 21 14 21.5" fill="none" className="mw-ui-anime-emote-glint" />
            </>
          ) : kind === 'anger' ? (
            <path d="M 10 4 V 9 A 2 2 0 0 1 8 11 H 3 M 18 4 V 9 A 2 2 0 0 0 20 11 H 25 M 10 24 V 19 A 2 2 0 0 0 8 17 H 3 M 18 24 V 19 A 2 2 0 0 1 20 17 H 25" fill="none" className="mw-ui-anime-emote-stroke" />
          ) : kind === 'shock' ? (
            <path d="M 6 3 L 10 12 L 6 14 L 10 25 M 14 3 V 18 M 14 22 V 25 M 22 3 L 18 12 L 22 14 L 18 25" fill="none" className="mw-ui-anime-emote-stroke" />
          ) : kind === 'sparkle' ? (
            <>
              <path d="M 14 2 L 17 11 L 26 14 L 17 17 L 14 26 L 11 17 L 2 14 L 11 11 Z" className="mw-ui-anime-emote-fill" />
              <circle cx="22" cy="6" r="2" className="mw-ui-anime-emote-fill" />
            </>
          ) : kind === 'question' ? (
            <>
              <path d="M 9 10 C 9 6 19 6 19 10.5 C 19 13.5 14 14 14 17.5" fill="none" className="mw-ui-anime-emote-stroke" />
              <circle cx="14" cy="22.5" r="2" className="mw-ui-anime-emote-fill" />
            </>
          ) : (
            <>
              <path d="M 14 4 V 17" fill="none" className="mw-ui-anime-emote-stroke" />
              <circle cx="14" cy="22.5" r="2.2" className="mw-ui-anime-emote-fill" />
            </>
          )}
        </svg>
      </span>
    );
  }
);
AnimeEmoteBubble.displayName = 'AnimeEmoteBubble';

export type AnimeCutInProps = ComponentPropsWithoutRef<'div'> & {
  active: boolean;
  characterId?: string;
  title?: string;
  subtitle?: string;
  jpCallout?: string;
  tone?: 'primary' | 'magenta' | 'cyan' | 'error';
  onDismiss?: () => void;
};

export const AnimeCutIn = forwardRef<HTMLDivElement, AnimeCutInProps>(function AnimeCutIn(
  {
    active,
    characterId = 'kuro-signal',
    title,
    subtitle,
    jpCallout,
    tone = 'primary',
    onDismiss,
    className,
    ...props
  },
  ref
) {
  const { reducedMotion, triggerSfx } = useMotion();
  const profile = getCharacterById(characterId);

  useEffect(() => {
    if (active) {
      triggerSfx('cut-in-slash', profile?.voicePitch ?? 1);
    }
  }, [active, profile?.voicePitch, triggerSfx]);

  if (!active) return null;

  const resolvedTitle = title ?? profile?.ultimate.name ?? 'OVERDRIVE SLASH';
  const resolvedJp = jpCallout ?? profile?.ultimate.jpCallout ?? '必殺・オーバードライブ！';
  const resolvedSub =
    subtitle ?? (profile ? `${profile.name} · ${profile.ultimate.quote}` : 'FULL LIMIT BREAK');

  return (
    <div
      ref={ref}
      role="status"
      aria-live="assertive"
      data-slot="anime-cut-in"
      data-tone={tone}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-anime-cutin', className)}
      {...props}
    >
      <div className="mw-ui-anime-cutin-speedlines" aria-hidden="true" />
      <div className="mw-ui-anime-cutin-strip">
        <div className="mw-ui-anime-cutin-portrait">
          <AnimeCharacterSvg
            characterId={characterId}
            mood="determined"
            phoneme="wide"
          />
        </div>
        <div className="mw-ui-anime-cutin-copy">
          <span className="mw-ui-anime-cutin-jp">{resolvedJp}</span>
          <strong className="mw-ui-anime-cutin-title">{resolvedTitle}</strong>
          <span className="mw-ui-anime-cutin-sub">{resolvedSub}</span>
        </div>
        {onDismiss ? (
          <button
            type="button"
            className="mw-ui-game-mini-btn mw-ui-anime-cutin-close"
            onClick={onDismiss}
          >
            OK
          </button>
        ) : null}
      </div>
    </div>
  );
});
AnimeCutIn.displayName = 'AnimeCutIn';

export interface VisualNovelLine {
  readonly id: string;
  readonly speakerId: string;
  readonly position: 'left' | 'center' | 'right';
  readonly mood?: CharacterMood;
  readonly emote?: AnimeEmoteKind;
  readonly text: string;
  readonly choices?: readonly { readonly id: string; readonly label: string }[];
}

export type VisualNovelStageProps = ComponentPropsWithoutRef<'section'> & {
  sceneTitle?: string;
  castIds: readonly string[];
  lines: readonly VisualNovelLine[];
  onChoiceSelect?: (choiceId: string, lineId: string) => void;
};

export const VisualNovelStage = forwardRef<HTMLElement, VisualNovelStageProps>(
  function VisualNovelStage(
    { sceneTitle = 'ACT 01 · SIGNAL TOWER', castIds, lines, onChoiceSelect, className, ...props },
    ref
  ) {
    const { reducedMotion, triggerSfx } = useMotion();
    const [index, setIndex] = useState(0);
    const [visibleChars, setVisibleChars] = useState(0);
    const [backlogOpen, setBacklogOpen] = useState(false);

    const safeIndex = Math.min(Math.max(0, index), Math.max(0, lines.length - 1));
    const current = lines[safeIndex];
    const speaker = getCharacterById(current?.speakerId);

    useEffect(() => {
      if (!current) return;
      setVisibleChars(reducedMotion ? current.text.length : 0);
    }, [current, reducedMotion]);

    useEffect(() => {
      if (!current || reducedMotion || visibleChars >= current.text.length) return;
      const timer = window.setTimeout(() => {
        setVisibleChars((c) => {
          const next = Math.min(current.text.length, c + 2);
          if (next % 6 === 0) triggerSfx('dialogue-blip', speaker?.voicePitch ?? 1);
          return next;
        });
      }, 28);
      return () => window.clearTimeout(timer);
    }, [current, visibleChars, reducedMotion, speaker?.voicePitch, triggerSfx]);

    const handleAdvance = useCallback(() => {
      if (!current) return;
      if (visibleChars < current.text.length) {
        setVisibleChars(current.text.length);
        return;
      }
      triggerSfx('click-soft');
      setIndex((prev) => (prev + 1) % Math.max(1, lines.length));
    }, [current, visibleChars, lines.length, triggerSfx]);

    const stageCast = useMemo(() => {
      const slots: readonly ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
      return castIds.slice(0, 3).map((id, idx) => ({
        id,
        slot: slots[idx] ?? 'center',
        profile: getCharacterById(id),
      }));
    }, [castIds]);

    if (!current) return null;

    const isSpeaking = visibleChars < current.text.length;
    const phoneme = computeLipSyncPhoneme(current.text, visibleChars, isSpeaking);

    return (
      <section
        ref={ref}
        aria-label={sceneTitle}
        data-slot="visual-novel-stage"
        className={cn('mw-ui-vn-stage', className)}
        {...props}
      >
        <div className="mw-ui-vn-topbar">
          <span className="mw-ui-vn-scene-tag">{sceneTitle}</span>
          <div className="mw-ui-vn-topbar-actions">
            <span className="mw-ui-vn-progress">
              {safeIndex + 1} / {lines.length}
            </span>
            <button
              type="button"
              className="mw-ui-game-mini-btn"
              aria-pressed={backlogOpen}
              onClick={() => setBacklogOpen((prev) => !prev)}
            >
              {backlogOpen ? 'Close Log' : 'Backlog'}
            </button>
          </div>
        </div>

        <div className="mw-ui-vn-backdrop">
          <div className="mw-ui-vn-cast">
            {stageCast.map(({ id, slot, profile }) => {
              const active = id === current.speakerId;
              const charMood = active ? (current.mood ?? profile?.defaultMood ?? 'neutral') : 'neutral';
              return (
                <div
                  key={id}
                  data-slot-pos={slot}
                  data-speaking={active ? 'true' : 'false'}
                  className="mw-ui-vn-actor"
                >
                  {active && current.emote ? <AnimeEmoteBubble kind={current.emote} /> : null}
                  <AnimeCharacterSvg
                    characterId={id}
                    mood={charMood}
                    phoneme={active ? phoneme : 'closed'}
                  />
                  <span className="mw-ui-vn-actor-tag">{profile?.name ?? id}</span>
                </div>
              );
            })}
          </div>
        </div>

        {backlogOpen ? (
          <div className="mw-ui-vn-backlog" role="region" aria-label="Dialogue backlog">
            {lines.slice(0, safeIndex + 1).map((entry) => {
              const who = getCharacterById(entry.speakerId);
              return (
                <p key={entry.id} className="mw-ui-vn-backlog-line">
                  <strong>{who?.name ?? entry.speakerId}:</strong> {entry.text}
                </p>
              );
            })}
          </div>
        ) : null}

        <div className="mw-ui-vn-dialogue-panel">
          <div className="mw-ui-vn-nameplate">
            <span>{speaker?.name ?? current.speakerId}</span>
            {speaker ? <small>{speaker.title}</small> : null}
          </div>
          <p className="mw-ui-vn-text" aria-live="polite">
            {current.text.slice(0, visibleChars)}
          </p>
          {current.choices && current.choices.length > 0 && !isSpeaking ? (
            <div className="mw-ui-vn-choices" role="group" aria-label="Story choices">
              {current.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="mw-ui-game-choice-btn"
                  onClick={() => {
                    triggerSfx('toggle-pop');
                    onChoiceSelect?.(choice.id, current.id);
                    setIndex((prev) => (prev + 1) % lines.length);
                  }}
                >
                  <span>{choice.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mw-ui-vn-footer">
              <button type="button" className="mw-ui-game-advance-btn" onClick={handleAdvance}>
                <span>{isSpeaking ? 'Reveal' : 'Next Line'}</span>
                <span aria-hidden="true">▸</span>
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }
);
VisualNovelStage.displayName = 'VisualNovelStage';

export type EpisodeTitleCardProps = ComponentPropsWithoutRef<'div'> & {
  episodeLabel: string;
  title: string;
  jpSubtitle?: string;
  accent?: 'primary' | 'magenta' | 'cyan';
  replayKey?: number;
};

export const EpisodeTitleCard = forwardRef<HTMLDivElement, EpisodeTitleCardProps>(
  function EpisodeTitleCard(
    { episodeLabel, title, jpSubtitle, accent = 'primary', replayKey = 0, className, ...props },
    ref
  ) {
    const { reducedMotion } = useMotion();
    return (
      <div
        key={replayKey}
        ref={ref}
        data-slot="episode-title-card"
        data-accent={accent}
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-episode-card', className)}
        {...props}
      >
        <div className="mw-ui-episode-card-bar">
          <span className="mw-ui-episode-card-ep">{episodeLabel}</span>
          {jpSubtitle ? <span className="mw-ui-episode-card-jp">{jpSubtitle}</span> : null}
        </div>
        <h3 className="mw-ui-episode-card-title">{title}</h3>
      </div>
    );
  }
);
EpisodeTitleCard.displayName = 'EpisodeTitleCard';
