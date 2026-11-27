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
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn.js';
import { getCharacterById } from '../lib/character-registry.js';
import { AnimeCharacterSvg } from '../cartoon/anime-avatar.js';
import { clampUnit, useMotion } from '../motion/index.js';
export {
  AchievementBadge,
  QuestCard,
  RewardPanel,
  type AchievementBadgeProps,
  type QuestCardProps,
  type QuestStatus,
  type RewardBadgeEntry,
  type RewardPanelProps,
} from '../components/quest-card.js';
export {
  AchievementToast,
  BossHealthBar,
  LootRevealCard,
  TurnOrderStrip,
  type AchievementToastProps,
  type BossHealthBarProps,
  type LootRarity,
  type LootRevealCardProps,
  type TurnOrderEntry,
  type TurnOrderStripProps,
} from './boss-hud.js';
export {
  SkillTreeGraph,
  TacticalRadar,
  type RadarBlip,
  type SkillNodeState,
  type SkillTreeGraphProps,
  type SkillTreeNode,
  type TacticalRadarProps,
} from './tactical.js';

export type StatGaugeTone = 'hp' | 'mp' | 'xp' | 'shield' | 'stamina';
export type StatGaugeVariant = 'straight' | 'arcade-skew' | 'segmented';

export type StatGaugeProps = ComponentPropsWithoutRef<'div'> & {
  label: string;
  value: number;
  max: number;
  tone?: StatGaugeTone;
  variant?: StatGaugeVariant;
  segments?: number;
  lowThreshold?: number;
  showNumbers?: boolean;
  trailDelayMs?: number;
};

export const StatGauge = forwardRef<HTMLDivElement, StatGaugeProps>(function StatGauge(
  {
    label,
    value,
    max,
    tone = 'hp',
    variant = 'straight',
    segments = 10,
    lowThreshold = 0.25,
    showNumbers = true,
    trailDelayMs = 260,
    className,
    ...props
  },
  ref
) {
  const { reducedMotion } = useMotion();
  const safeMax = Math.max(1, max);
  const clamped = Math.min(safeMax, Math.max(0, value));
  const ratio = clampUnit(clamped / safeMax);
  const [trailRatio, setTrailRatio] = useState(ratio);
  const [hitFlash, setHitFlash] = useState(false);
  const prevRef = useRef(clamped);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = clamped;
    if (clamped < prev && !reducedMotion) {
      setHitFlash(true);
      const flashTimer = window.setTimeout(() => setHitFlash(false), 180);
      const trailTimer = window.setTimeout(() => setTrailRatio(ratio), trailDelayMs);
      return () => {
        window.clearTimeout(flashTimer);
        window.clearTimeout(trailTimer);
      };
    }
    setTrailRatio(ratio);
    return undefined;
  }, [clamped, ratio, reducedMotion, trailDelayMs]);

  const isCritical = ratio > 0 && ratio <= lowThreshold;

  return (
    <div
      ref={ref}
      data-slot="stat-gauge"
      data-tone={tone}
      data-variant={variant}
      data-critical={isCritical ? 'true' : 'false'}
      data-hit={hitFlash ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn('mw-ui-game-gauge', className)}
      {...props}
    >
      <div className="mw-ui-game-gauge-header">
        <span className="mw-ui-game-gauge-label">{label}</span>
        {showNumbers ? (
          <span className="mw-ui-game-gauge-numbers">
            {Math.round(clamped)} / {Math.round(safeMax)}
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(clamped)}
        className="mw-ui-game-gauge-track"
      >
        <div
          className="mw-ui-game-gauge-trail"
          style={{ width: `${Math.round(trailRatio * 1000) / 10}%` }}
        />
        <div
          className="mw-ui-game-gauge-fill"
          style={{ width: `${Math.round(ratio * 1000) / 10}%` }}
        />
        {variant === 'segmented' ? (
          <div className="mw-ui-game-gauge-segments" aria-hidden="true">
            {Array.from({ length: Math.max(2, segments) }).map((_, idx) => (
              <span key={idx} className="mw-ui-game-gauge-segment" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
});
StatGauge.displayName = 'StatGauge';

export interface DialogueChoice {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly disabled?: boolean;
}

export type DialogueBoxProps = ComponentPropsWithoutRef<'section'> & {
  characterId?: string;
  speaker?: string;
  roleTitle?: string;
  text: string;
  portrait?: ReactNode;
  charsPerSec?: number;
  instant?: boolean;
  choices?: readonly DialogueChoice[];
  onChoiceSelect?: (choice: DialogueChoice) => void;
  onAdvance?: () => void;
  onTypingProgress?: (visibleChars: number, isTyping: boolean) => void;
  advanceLabel?: string;
};

export const DialogueBox = forwardRef<HTMLElement, DialogueBoxProps>(function DialogueBox(
  {
    characterId,
    speaker,
    roleTitle,
    text,
    portrait,
    charsPerSec = 42,
    instant = false,
    choices,
    onChoiceSelect,
    onAdvance,
    onTypingProgress,
    advanceLabel = 'Continue',
    className,
    ...props
  },
  ref
) {
  const { reducedMotion, triggerSfx } = useMotion();
  const profile = getCharacterById(characterId);
  const resolvedSpeaker = speaker ?? profile?.name ?? 'Speaker';
  const resolvedRole = roleTitle ?? profile?.title;
  const skipTyping = instant || reducedMotion || charsPerSec <= 0;
  const [visibleChars, setVisibleChars] = useState(skipTyping ? text.length : 0);
  const [autoMode, setAutoMode] = useState(false);

  const isTyping = visibleChars < text.length;

  useEffect(() => {
    setVisibleChars(skipTyping ? text.length : 0);
  }, [text, skipTyping]);

  useEffect(() => {
    onTypingProgress?.(visibleChars, visibleChars < text.length);
  }, [visibleChars, text.length, onTypingProgress]);

  useEffect(() => {
    if (!isTyping) return;
    const stepMs = Math.max(12, Math.round(1000 / Math.max(1, charsPerSec)));
    const timer = window.setTimeout(() => {
      setVisibleChars((prev) => {
        const next = Math.min(text.length, prev + 1);
        if (next % 3 === 0) triggerSfx('dialogue-blip', profile?.voicePitch ?? 1);
        return next;
      });
    }, stepMs);
    return () => window.clearTimeout(timer);
  }, [isTyping, visibleChars, text.length, charsPerSec, profile?.voicePitch, triggerSfx]);

  useEffect(() => {
    if (!autoMode || isTyping || !onAdvance || (choices && choices.length > 0)) return;
    const timer = window.setTimeout(() => onAdvance(), 1400);
    return () => window.clearTimeout(timer);
  }, [autoMode, isTyping, onAdvance, choices]);

  const handlePrimaryAction = useCallback(() => {
    if (isTyping) {
      setVisibleChars(text.length);
      return;
    }
    triggerSfx('click-soft');
    onAdvance?.();
  }, [isTyping, text.length, onAdvance, triggerSfx]);

  const resolvedPortrait =
    portrait ??
    (characterId ? (
      <AnimeCharacterSvg
        characterId={characterId}
        mood={profile?.defaultMood ?? 'neutral'}
        phoneme={isTyping ? 'wide' : 'closed'}
      />
    ) : null);

  return (
    <section
      ref={ref}
      aria-label={`Dialogue from ${resolvedSpeaker}`}
      data-slot="dialogue-box"
      data-typing={isTyping ? 'true' : 'false'}
      className={cn('mw-ui-game-dialogue', className)}
      {...props}
    >
      {resolvedPortrait ? <div className="mw-ui-game-dialogue-portrait">{resolvedPortrait}</div> : null}
      <div className="mw-ui-game-dialogue-body">
        <div className="mw-ui-game-dialogue-head">
          <div className="mw-ui-game-dialogue-speaker-wrap">
            <span className="mw-ui-game-dialogue-speaker">{resolvedSpeaker}</span>
            {resolvedRole ? <span className="mw-ui-game-dialogue-role">{resolvedRole}</span> : null}
          </div>
          <div className="mw-ui-game-dialogue-controls">
            <button
              type="button"
              className="mw-ui-game-mini-btn"
              aria-pressed={autoMode}
              onClick={() => setAutoMode((prev) => !prev)}
            >
              Auto {autoMode ? 'ON' : 'OFF'}
            </button>
            {isTyping ? (
              <button
                type="button"
                className="mw-ui-game-mini-btn"
                onClick={() => setVisibleChars(text.length)}
              >
                Skip
              </button>
            ) : null}
          </div>
        </div>

        <p className="mw-ui-game-dialogue-text" aria-live="polite">
          {text.slice(0, visibleChars)}
          {isTyping ? <span aria-hidden="true" className="mw-ui-game-dialogue-caret" /> : null}
        </p>

        {!isTyping && choices && choices.length > 0 ? (
          <div className="mw-ui-game-dialogue-choices" role="group" aria-label="Dialogue choices">
            {choices.map((choice, idx) => (
              <button
                key={choice.id}
                type="button"
                disabled={choice.disabled}
                className="mw-ui-game-choice-btn"
                onClick={() => {
                  triggerSfx('toggle-pop');
                  onChoiceSelect?.(choice);
                }}
              >
                <span className="mw-ui-game-choice-index">{idx + 1}</span>
                <span>{choice.label}</span>
                {choice.hint ? <small className="mw-ui-game-choice-hint">{choice.hint}</small> : null}
              </button>
            ))}
          </div>
        ) : onAdvance ? (
          <div className="mw-ui-game-dialogue-footer">
            <button type="button" className="mw-ui-game-advance-btn" onClick={handlePrimaryAction}>
              <span>{isTyping ? 'Reveal' : advanceLabel}</span>
              <span aria-hidden="true" className="mw-ui-game-advance-arrow">
                ▸
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
});
DialogueBox.displayName = 'DialogueBox';

export interface CombatTextEvent {
  readonly id: string | number;
  readonly text: string;
  readonly tone?: 'damage' | 'crit' | 'heal' | 'status';
  readonly xPercent?: number;
  readonly yPercent?: number;
}

export type FloatingCombatTextProps = ComponentPropsWithoutRef<'div'> & {
  events: readonly CombatTextEvent[];
};

export const FloatingCombatText = forwardRef<HTMLDivElement, FloatingCombatTextProps>(
  function FloatingCombatText({ events, className, ...props }, ref) {
    const { reducedMotion } = useMotion();
    return (
      <div
        ref={ref}
        aria-live="polite"
        data-slot="floating-combat-text"
        data-reduced-motion={reducedMotion ? 'true' : 'false'}
        className={cn('mw-ui-game-combat-layer', className)}
        {...props}
      >
        {events.map((evt) => (
          <span
            key={evt.id}
            data-tone={evt.tone ?? 'damage'}
            className="mw-ui-game-combat-pop"
            style={
              {
                left: `${evt.xPercent ?? 50}%`,
                top: `${evt.yPercent ?? 40}%`,
              } as CSSProperties
            }
          >
            {evt.text}
          </span>
        ))}
      </div>
    );
  }
);
FloatingCombatText.displayName = 'FloatingCombatText';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface HotbarSlotItem {
  readonly id: string;
  readonly label: string;
  readonly hotkey?: string;
  readonly icon?: ReactNode;
  readonly count?: number;
  readonly rarity?: ItemRarity;
  readonly cooldownProgress?: number; // 0 = ready, 1 = just triggered
  readonly cooldownSeconds?: number;
  readonly active?: boolean;
  readonly disabled?: boolean;
}

export type InventoryGridProps = ComponentPropsWithoutRef<'div'> & {
  items: readonly HotbarSlotItem[];
  columns?: number;
  onActivate?: (item: HotbarSlotItem) => void;
  ariaLabel?: string;
};

export const InventoryGrid = forwardRef<HTMLDivElement, InventoryGridProps>(function InventoryGrid(
  { items, columns = 4, onActivate, ariaLabel = 'Inventory slots', className, style, ...props },
  ref
) {
  const { triggerSfx } = useMotion();
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      data-slot="inventory-grid"
      className={cn('mw-ui-game-inventory', className)}
      style={{ ...style, '--mw-grid-cols': String(Math.max(1, columns)) } as CSSProperties}
      {...props}
    >
      {items.map((item) => {
        const cooling = (item.cooldownProgress ?? 0) > 0;
        const pct = Math.round(clampUnit(item.cooldownProgress ?? 0) * 100);
        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled || cooling}
            data-rarity={item.rarity ?? 'common'}
            data-active={item.active ? 'true' : 'false'}
            data-cooling={cooling ? 'true' : 'false'}
            aria-label={`${item.label}${item.hotkey ? ` (Key ${item.hotkey})` : ''}${
              cooling && item.cooldownSeconds ? `, ${item.cooldownSeconds.toFixed(1)}s cooldown` : ''
            }`}
            className="mw-ui-game-slot"
            onClick={() => {
              triggerSfx('click-soft');
              onActivate?.(item);
            }}
          >
            {item.hotkey ? <span className="mw-ui-game-slot-key">{item.hotkey}</span> : null}
            <span className="mw-ui-game-slot-icon" aria-hidden="true">
              {item.icon ?? item.label.slice(0, 2).toUpperCase()}
            </span>
            <span className="mw-ui-game-slot-label">{item.label}</span>
            {typeof item.count === 'number' ? (
              <span className="mw-ui-game-slot-count">×{item.count}</span>
            ) : null}
            {cooling ? (
              <span
                aria-hidden="true"
                className="mw-ui-game-slot-cooldown"
                style={{ height: `${pct}%` }}
              >
                {item.cooldownSeconds ? `${item.cooldownSeconds.toFixed(1)}s` : null}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
});
InventoryGrid.displayName = 'InventoryGrid';

export const ActionHotbar = forwardRef<HTMLDivElement, InventoryGridProps>(function ActionHotbar(
  { items, columns, ariaLabel = 'Action hotbar', className, ...props },
  ref
) {
  return (
    <InventoryGrid
      ref={ref}
      items={items}
      columns={columns ?? items.length}
      ariaLabel={ariaLabel}
      className={cn('mw-ui-game-hotbar', className)}
      {...props}
    />
  );
});
ActionHotbar.displayName = 'ActionHotbar';

export type ComboCounterProps = ComponentPropsWithoutRef<'div'> & {
  count: number;
  label?: string;
  decayProgress?: number; // 0..1 remaining time
};

export function resolveComboTier(count: number): 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' {
  if (count >= 25) return 'SSS';
  if (count >= 16) return 'SS';
  if (count >= 10) return 'S';
  if (count >= 6) return 'A';
  if (count >= 3) return 'B';
  return 'C';
}

export const ComboCounter = forwardRef<HTMLDivElement, ComboCounterProps>(function ComboCounter(
  { count, label = 'CHAIN', decayProgress = 1, className, ...props },
  ref
) {
  const tier = resolveComboTier(count);
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-slot="combo-counter"
      data-tier={tier}
      data-active={count > 0 ? 'true' : 'false'}
      className={cn('mw-ui-game-combo', className)}
      {...props}
    >
      <div className="mw-ui-game-combo-top">
        <span className="mw-ui-game-combo-tier">{tier}</span>
        <span key={count} className="mw-ui-game-combo-count">
          ×{count}
        </span>
        <span className="mw-ui-game-combo-label">{label}</span>
      </div>
      <div className="mw-ui-game-combo-bar" aria-hidden="true">
        <div
          className="mw-ui-game-combo-fill"
          style={{ width: `${Math.round(clampUnit(decayProgress) * 100)}%` }}
        />
      </div>
    </div>
  );
});
ComboCounter.displayName = 'ComboCounter';

export interface RadialMenuOption {
  readonly id: string;
  readonly label: string;
  readonly badge?: string;
}

export type RadialMenuProps = Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'> & {
  options: readonly RadialMenuOption[];
  activeId?: string;
  onSelect?: (option: RadialMenuOption) => void;
  centerLabel?: string;
};

export const RadialMenu = forwardRef<HTMLDivElement, RadialMenuProps>(function RadialMenu(
  { options, activeId, onSelect, centerLabel = 'ACT', className, ...props },
  ref
) {
  const { triggerSfx } = useMotion();
  const radius = 64;
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Radial quick actions"
      data-slot="radial-menu"
      className={cn('mw-ui-game-radial', className)}
      {...props}
    >
      <span className="mw-ui-game-radial-center">{centerLabel}</span>
      {options.map((opt, idx) => {
        const angle = (idx / Math.max(1, options.length)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius);
        const isSelected = activeId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isSelected}
            data-active={isSelected ? 'true' : 'false'}
            className="mw-ui-game-radial-btn"
            style={{ transform: `translate(${x}px, ${y}px)` }}
            onClick={() => {
              triggerSfx('toggle-pop');
              onSelect?.(opt);
            }}
          >
            <span>{opt.label}</span>
            {opt.badge ? <small>{opt.badge}</small> : null}
          </button>
        );
      })}
    </div>
  );
});
RadialMenu.displayName = 'RadialMenu';

export type InputPromptPlatform = 'keyboard' | 'xbox' | 'playstation';

export type InputPromptBadgeProps = ComponentPropsWithoutRef<'kbd'> & {
  input: string;
  platform?: InputPromptPlatform;
  actionLabel?: string;
};

export const InputPromptBadge = forwardRef<HTMLElement, InputPromptBadgeProps>(
  function InputPromptBadge({ input, platform = 'keyboard', actionLabel, className, ...props }, ref) {
    return (
      <kbd
        ref={ref}
        data-slot="input-prompt-badge"
        data-platform={platform}
        className={cn('mw-ui-game-prompt', className)}
        {...props}
      >
        <span className="mw-ui-game-prompt-key">{input}</span>
        {actionLabel ? <span className="mw-ui-game-prompt-action">{actionLabel}</span> : null}
      </kbd>
    );
  }
);
InputPromptBadge.displayName = 'InputPromptBadge';

export interface GamepadNavOptions {
  readonly itemCount: number;
  readonly initialIndex?: number;
  readonly enabled?: boolean;
  readonly onConfirm?: (index: number) => void;
}

export function useGamepadNavigation({
  itemCount,
  initialIndex = 0,
  enabled = true,
  onConfirm,
}: GamepadNavOptions) {
  const [activeIndex, setActiveIndex] = useState(
    itemCount > 0 ? Math.min(itemCount - 1, Math.max(0, initialIndex)) : 0
  );

  const move = useCallback(
    (delta: number) => {
      if (itemCount <= 0) return;
      setActiveIndex((prev) => (prev + delta + itemCount) % itemCount);
    },
    [itemCount]
  );

  const handleKeyDown = useCallback(
    (event: { key: string; preventDefault?: () => void }) => {
      if (!enabled || itemCount <= 0) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 's' || event.key === 'd') {
        event.preventDefault?.();
        move(1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'w' || event.key === 'a') {
        event.preventDefault?.();
        move(-1);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault?.();
        onConfirm?.(activeIndex);
      }
    },
    [enabled, itemCount, move, onConfirm, activeIndex]
  );

  return useMemo(
    () => ({ activeIndex, setActiveIndex, move, handleKeyDown }),
    [activeIndex, move, handleKeyDown]
  );
}

export type GameTitleScreenProps = ComponentPropsWithoutRef<'section'> & {
  title: string;
  subtitle?: string;
  menuItems: readonly { readonly id: string; readonly label: string }[];
  onSelectItem: (id: string) => void;
  footerPrompt?: string;
};

export const GameTitleScreen = forwardRef<HTMLElement, GameTitleScreenProps>(
  function GameTitleScreen(
    { title, subtitle, menuItems, onSelectItem, footerPrompt = 'PRESS ENTER OR CLICK TO START', className, ...props },
    ref
  ) {
    const { triggerSfx } = useMotion();
    const nav = useGamepadNavigation({
      itemCount: menuItems.length,
      onConfirm: (idx) => {
        const item = menuItems[idx];
        if (item) {
          triggerSfx('level-up');
          onSelectItem(item.id);
        }
      },
    });

    return (
      <section
        ref={ref}
        tabIndex={0}
        onKeyDown={nav.handleKeyDown}
        data-slot="game-title-screen"
        className={cn('mw-ui-game-title-screen', className)}
        {...props}
      >
        <div className="mw-ui-game-title-head">
          <h3 className="mw-ui-game-title-heading">{title}</h3>
          {subtitle ? <p className="mw-ui-game-title-sub">{subtitle}</p> : null}
        </div>
        <div className="mw-ui-game-title-menu" role="menu" aria-label={`${title} menu`}>
          {menuItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-active={nav.activeIndex === idx ? 'true' : 'false'}
              className="mw-ui-game-title-btn"
              onMouseEnter={() => nav.setActiveIndex(idx)}
              onClick={() => {
                nav.setActiveIndex(idx);
                triggerSfx('level-up');
                onSelectItem(item.id);
              }}
            >
              <span aria-hidden="true" className="mw-ui-game-title-cursor">
                ▶
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <p className="mw-ui-game-title-footer">{footerPrompt}</p>
      </section>
    );
  }
);
GameTitleScreen.displayName = 'GameTitleScreen';

export type PauseMenuOverlayProps = ComponentPropsWithoutRef<'div'> & {
  open: boolean;
  title?: string;
  onResume: () => void;
  onRestart?: () => void;
  children?: ReactNode;
};

export const PauseMenuOverlay = forwardRef<HTMLDivElement, PauseMenuOverlayProps>(
  function PauseMenuOverlay({ open, title = 'PAUSED', onResume, onRestart, children, className, ...props }, ref) {
    if (!open) return null;
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-slot="pause-menu-overlay"
        className={cn('mw-ui-game-pause', className)}
        {...props}
      >
        <div className="mw-ui-game-pause-card">
          <h4 className="mw-ui-game-pause-title">{title}</h4>
          {children}
          <div className="mw-ui-game-pause-actions">
            <button type="button" className="mw-ui-button" data-variant="default" onClick={onResume}>
              Resume
            </button>
            {onRestart ? (
              <button type="button" className="mw-ui-button" data-variant="outline" onClick={onRestart}>
                Restart
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);
PauseMenuOverlay.displayName = 'PauseMenuOverlay';
