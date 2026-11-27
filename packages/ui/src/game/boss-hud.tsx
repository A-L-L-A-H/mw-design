'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { cn } from '../lib/cn.js';
import { getCharacterById } from '../lib/character-registry.js';
import { BossSkullIcon } from '../icons/boss-skull.js';
import { TrophyCrownIcon } from '../icons/trophy-crown.js';
import { AnimeCharacterSvg } from '../cartoon/anime-avatar.js';
import { clampUnit, useMotion } from '../motion/index.js';

export type BossHealthBarProps = ComponentPropsWithoutRef<'section'> & {
  characterId?: string;
  name?: string;
  title?: string;
  hp: number;
  maxHp: number;
  phases?: number;
  stagger?: number; // 0..100
  broken?: boolean;
};

export const BossHealthBar = forwardRef<HTMLElement, BossHealthBarProps>(function BossHealthBar(
  {
    characterId = 'lord-null',
    name,
    title,
    hp,
    maxHp,
    phases = 3,
    stagger = 0,
    broken = false,
    className,
    ...props
  },
  ref
) {
  const { reducedMotion, triggerSfx } = useMotion();
  const profile = getCharacterById(characterId);
  const safeMax = Math.max(1, maxHp);
  const clampedHp = Math.min(safeMax, Math.max(0, hp));
  const safePhases = Math.max(1, Math.min(5, Math.round(phases)));
  const phaseSize = safeMax / safePhases;
  const remainingPhases = clampedHp <= 0 ? 0 : Math.ceil(clampedHp / phaseSize);
  const currentPhaseHp =
    clampedHp <= 0 ? 0 : clampedHp - (remainingPhases - 1) * phaseSize;
  const currentPhaseRatio = clampUnit(currentPhaseHp / phaseSize);
  const staggerPct = Math.round(clampUnit(stagger / 100) * 100);

  const [phaseBreakFlash, setPhaseBreakFlash] = useState(false);
  const prevPhaseRef = useRef(remainingPhases);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = remainingPhases;
    if (remainingPhases < prev && !reducedMotion) {
      setPhaseBreakFlash(true);
      triggerSfx('boss-break');
      const timer = window.setTimeout(() => setPhaseBreakFlash(false), 360);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [remainingPhases, reducedMotion, triggerSfx]);

  const resolvedName = name ?? profile?.name ?? 'ECLIPSE OVERLORD';
  const resolvedTitle = title ?? profile?.title ?? 'Multi-Phase Raid Boss';

  return (
    <section
      ref={ref}
      aria-label={`${resolvedName} boss status`}
      data-slot="boss-health-bar"
      data-phase={remainingPhases}
      data-broken={broken ? 'true' : 'false'}
      data-phase-flash={phaseBreakFlash ? 'true' : 'false'}
      className={cn('mw-ui-boss-hud', className)}
      {...props}
    >
      <div className="mw-ui-boss-hud-portrait">
        <AnimeCharacterSvg
          characterId={characterId}
          mood={clampedHp <= 0 ? 'ko' : broken ? 'surprised' : 'angry'}
          phoneme={phaseBreakFlash ? 'wide' : 'closed'}
        />
      </div>
      <div className="mw-ui-boss-hud-main">
        <div className="mw-ui-boss-hud-head">
          <div className="mw-ui-boss-hud-ident">
            <BossSkullIcon size={16} aria-hidden="true" />
            <strong className="mw-ui-boss-hud-name">{resolvedName}</strong>
            <span className="mw-ui-boss-hud-title">{resolvedTitle}</span>
          </div>
          <div className="mw-ui-boss-hud-phases" aria-label={`Phase ${remainingPhases} of ${safePhases}`}>
            {Array.from({ length: safePhases }).map((_, idx) => (
              <span
                key={idx}
                className="mw-ui-boss-phase-pip"
                data-filled={idx < remainingPhases ? 'true' : 'false'}
              />
            ))}
            <span className="mw-ui-boss-hp-readout">
              {Math.round(clampedHp)} / {Math.round(safeMax)}
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={`${resolvedName} HP`}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={Math.round(clampedHp)}
          className="mw-ui-boss-hp-track"
        >
          {remainingPhases > 1 ? <div className="mw-ui-boss-hp-underlay" aria-hidden="true" /> : null}
          <div
            className="mw-ui-boss-hp-fill"
            style={{ width: `${Math.round(currentPhaseRatio * 1000) / 10}%` }}
          />
        </div>

        <div className="mw-ui-boss-stagger-row">
          <span className="mw-ui-boss-stagger-label">
            {broken ? 'STAGGER BREAK!' : 'STAGGER'}
          </span>
          <div className="mw-ui-boss-stagger-track" aria-hidden="true">
            <div className="mw-ui-boss-stagger-fill" style={{ width: `${staggerPct}%` }} />
          </div>
          <span className="mw-ui-boss-stagger-pct">{staggerPct}%</span>
        </div>
      </div>
    </section>
  );
});
BossHealthBar.displayName = 'BossHealthBar';

export interface TurnOrderEntry {
  readonly id: string;
  readonly characterId: string;
  readonly team: 'ally' | 'enemy';
  readonly actionValue: number;
  readonly label?: string;
}

export type TurnOrderStripProps = ComponentPropsWithoutRef<'div'> & {
  entries: readonly TurnOrderEntry[];
  activeId?: string;
  onSelectEntry?: (entry: TurnOrderEntry) => void;
};

export const TurnOrderStrip = forwardRef<HTMLDivElement, TurnOrderStripProps>(
  function TurnOrderStrip({ entries, activeId, onSelectEntry, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="list"
        aria-label="Turn order queue"
        data-slot="turn-order-strip"
        className={cn('mw-ui-turn-strip', className)}
        {...props}
      >
        <span className="mw-ui-turn-strip-tag">ATB ORDER</span>
        <div className="mw-ui-turn-strip-list">
          {entries.map((entry, idx) => {
            const profile = getCharacterById(entry.characterId);
            const isActive = activeId ? entry.id === activeId : idx === 0;
            return (
              <button
                key={entry.id}
                type="button"
                role="listitem"
                data-team={entry.team}
                data-active={isActive ? 'true' : 'false'}
                className="mw-ui-turn-node"
                onClick={() => onSelectEntry?.(entry)}
              >
                <span className="mw-ui-turn-avatar">
                  <AnimeCharacterSvg
                    characterId={entry.characterId}
                    mood={isActive ? 'determined' : 'neutral'}
                    phoneme="closed"
                  />
                </span>
                <span className="mw-ui-turn-meta">
                  <strong>{entry.label ?? profile?.name ?? entry.characterId}</strong>
                  <small>AV {entry.actionValue}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
TurnOrderStrip.displayName = 'TurnOrderStrip';

export type LootRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type LootRevealCardProps = ComponentPropsWithoutRef<'div'> & {
  characterId?: string;
  title?: string;
  subtitle?: string;
  rarity?: LootRarity;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealChange?: (revealed: boolean) => void;
};

export const LootRevealCard = forwardRef<HTMLDivElement, LootRevealCardProps>(
  function LootRevealCard(
    {
      characterId = 'kuro-signal',
      title,
      subtitle,
      rarity,
      revealed: controlledRevealed,
      defaultRevealed = false,
      onRevealChange,
      className,
      ...props
    },
    ref
  ) {
    const { triggerSfx } = useMotion();
    const [uncontrolledRevealed, setUncontrolledRevealed] = useState(defaultRevealed);
    const revealed = controlledRevealed ?? uncontrolledRevealed;
    const profile = getCharacterById(characterId);
    const resolvedRarity: LootRarity = rarity ?? profile?.rarity ?? 'legendary';
    const resolvedTitle = title ?? profile?.name ?? 'MYTHIC RELIC';
    const resolvedSub = subtitle ?? (profile ? `${profile.title} · ${profile.element.toUpperCase()}` : 'RARE DROP');

    const handleToggle = () => {
      const next = !revealed;
      setUncontrolledRevealed(next);
      onRevealChange?.(next);
      if (next) triggerSfx('gacha-fanfare');
    };

    return (
      <div
        ref={ref}
        data-slot="loot-reveal-card"
        data-rarity={resolvedRarity}
        data-revealed={revealed ? 'true' : 'false'}
        className={cn('mw-ui-loot-card', className)}
        {...props}
      >
        <button
          type="button"
          className="mw-ui-loot-card-trigger"
          aria-pressed={revealed}
          onClick={handleToggle}
        >
          {!revealed ? (
            <span className="mw-ui-loot-card-back">
              <span className="mw-ui-loot-card-rarity">{resolvedRarity.toUpperCase()}</span>
              <strong className="mw-ui-loot-card-seal">SUMMON CAPSULE</strong>
              <small>Click to reveal drop</small>
            </span>
          ) : (
            <span className="mw-ui-loot-card-front">
              <span className="mw-ui-loot-card-foil" aria-hidden="true" />
              <span className="mw-ui-loot-card-rarity">{resolvedRarity.toUpperCase()}</span>
              <span className="mw-ui-loot-card-art">
                <AnimeCharacterSvg
                  characterId={characterId}
                  mood="happy"
                  phoneme="closed"
                />
              </span>
              <strong className="mw-ui-loot-card-name">{resolvedTitle}</strong>
              <small className="mw-ui-loot-card-sub">{resolvedSub}</small>
              {profile ? (
                <span className="mw-ui-loot-card-stats">
                  <span>ATK {profile.stats.atk}</span>
                  <span>SPD {profile.stats.spd}</span>
                </span>
              ) : null}
            </span>
          )}
        </button>
      </div>
    );
  }
);
LootRevealCard.displayName = 'LootRevealCard';

export type AchievementToastProps = ComponentPropsWithoutRef<'div'> & {
  open: boolean;
  title: string;
  description: string;
  points?: number;
  rarity?: LootRarity;
  onDismiss?: () => void;
};

export const AchievementToast = forwardRef<HTMLDivElement, AchievementToastProps>(
  function AchievementToast(
    { open, title, description, points = 150, rarity = 'legendary', onDismiss, className, ...props },
    ref
  ) {
    const { triggerSfx } = useMotion();

    useEffect(() => {
      if (open) triggerSfx('trophy-unlock');
    }, [open, triggerSfx]);

    if (!open) return null;

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        data-slot="achievement-toast"
        data-rarity={rarity}
        className={cn('mw-ui-trophy-toast', className)}
        {...props}
      >
        <span className="mw-ui-trophy-toast-icon" aria-hidden="true">
          <TrophyCrownIcon size={20} aria-hidden="true" />
        </span>
        <div className="mw-ui-trophy-toast-copy">
          <span className="mw-ui-trophy-toast-eyebrow">ACHIEVEMENT UNLOCKED · +{points} XP</span>
          <strong>{title}</strong>
          <small>{description}</small>
        </div>
        {onDismiss ? (
          <button type="button" className="mw-ui-game-mini-btn" onClick={onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    );
  }
);
AchievementToast.displayName = 'AchievementToast';
