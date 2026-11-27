'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Badge } from '../components/badge.js';
import { Button } from '../components/button.js';
import {
  getBossCharacters,
  getCharacterById,
  getPlayableCharacters,
  rollGachaCharacter,
} from '../lib/character-registry.js';
import { MotionStage, ScreenFXOverlay, useMotion } from '../motion/index.js';
import {
  AchievementToast,
  ActionHotbar,
  BossHealthBar,
  ComboCounter,
  DialogueBox,
  FloatingCombatText,
  InputPromptBadge,
  LootRevealCard,
  PauseMenuOverlay,
  RadialMenu,
  StatGauge,
  TacticalRadar,
  TurnOrderStrip,
  type CombatTextEvent,
  type HotbarSlotItem,
  type RadarBlip,
  type TurnOrderEntry,
} from '../game/index.js';
import {
  AnimeCutIn,
  CartoonRig,
  EpisodeTitleCard,
  SmearFrame,
  StoryboardPlayer,
  VisualNovelStage,
  type StoryboardBeat,
  type VisualNovelLine,
} from '../cartoon/index.js';
import { KatanaIcon } from '../icons/katana.js';
import { CriticalStarIcon } from '../icons/critical-star.js';
import { PotionFlaskIcon } from '../icons/potion-flask.js';
import { ShieldCrestIcon } from '../icons/shield-crest.js';

const PLAYABLE_HEROES = getPlayableCharacters();
const ECLIPSE_BOSSES = getBossCharacters();

const RADAR_BLIPS: readonly RadarBlip[] = [
  { id: 'b1', label: 'Boss', x: 0.45, y: -0.42, kind: 'boss' },
  { id: 'b2', label: 'Ally', x: -0.35, y: 0.25, kind: 'ally' },
  { id: 'b3', label: 'Relic', x: 0.12, y: 0.56, kind: 'objective' },
  { id: 'b4', label: 'Drone', x: -0.52, y: -0.3, kind: 'enemy' },
];

export function GameBattleTemplate() {
  const { triggerSfx } = useMotion();
  const [heroId, setHeroId] = useState(PLAYABLE_HEROES[0]?.id ?? 'kuro-signal');
  const [bossId, setBossId] = useState(ECLIPSE_BOSSES[0]?.id ?? 'lord-null');

  const hero = getCharacterById(heroId) ?? PLAYABLE_HEROES[0]!;
  const boss = getCharacterById(bossId) ?? ECLIPSE_BOSSES[0]!;

  const [hp, setHp] = useState(92);
  const [mp, setMp] = useState(80);
  const [xp, setXp] = useState(45);
  const [bossHp, setBossHp] = useState(boss.stats.hp);
  const [stagger, setStagger] = useState(35);
  const [combo, setCombo] = useState(6);
  const [paused, setPaused] = useState(false);
  const [flashFx, setFlashFx] = useState(false);
  const [speedlinesFx, setSpeedlinesFx] = useState(false);
  const [shakeSeed, setShakeSeed] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [hitstopMs, setHitstopMs] = useState(0);
  const [heroPose, setHeroPose] = useState<'idle' | 'attack' | 'victory' | 'hurt'>('idle');
  const [cutInOpen, setCutInOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [lootCharacterId, setLootCharacterId] = useState<string | null>(null);
  const [lootRevealed, setLootRevealed] = useState(false);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [radialAction, setRadialAction] = useState('slash');
  const [events, setEvents] = useState<CombatTextEvent[]>([]);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    setBossHp(boss.stats.hp);
    setStagger(25);
    setLootCharacterId(null);
    setLootRevealed(false);
  }, [boss.id, boss.stats.hp]);

  useEffect(() => {
    const activeIds = Object.keys(cooldowns).filter((k) => (cooldowns[k] ?? 0) > 0);
    if (activeIds.length === 0) return;
    const timer = window.setInterval(() => {
      setCooldowns((prev) => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          const updated = Math.max(0, Math.round((v - 0.2) * 10) / 10);
          if (updated > 0) next[k] = updated;
        }
        return next;
      });
    }, 200);
    return () => window.clearInterval(timer);
  }, [cooldowns]);

  const spawnCombatText = useCallback((text: string, tone: CombatTextEvent['tone']) => {
    const id = Date.now() + Math.random();
    const xPercent = 30 + Math.round(Math.random() * 38);
    setEvents((prev) => [...prev.slice(-4), { id, text, tone, xPercent, yPercent: 28 }]);
    window.setTimeout(() => {
      setEvents((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  }, []);

  const triggerShake = useCallback((intensity: number, hitstop: number) => {
    setShakeIntensity(intensity);
    setHitstopMs(hitstop);
    setShakeSeed((s) => s + 1);
  }, []);

  const strikeBoss = useCallback(
    (damage: number, staggerGain: number, crit = false) => {
      const brokenBonus = stagger >= 100 ? 1.4 : 1;
      const finalDamage = Math.round(damage * brokenBonus);
      triggerSfx(crit ? 'level-up' : 'hit-impact', hero.voicePitch);
      setHeroPose('attack');
      window.setTimeout(() => setHeroPose('idle'), 260);
      setCombo((c) => c + (crit ? 4 : 2));
      setXp((x) => Math.min(100, x + (crit ? 16 : 9)));
      setStagger((s) => Math.min(100, s + staggerGain));
      setFlashFx(true);
      setSpeedlinesFx(crit);
      triggerShake(crit ? 9 : 4.5, crit ? 90 : 40);
      window.setTimeout(() => {
        setFlashFx(false);
        setSpeedlinesFx(false);
      }, 240);
      spawnCombatText(crit ? `-${finalDamage} CRIT!` : `-${finalDamage}`, crit ? 'crit' : 'damage');
      setBossHp((prev) => {
        const next = Math.max(0, prev - finalDamage);
        if (next === 0 && prev > 0) {
          setHeroPose('victory');
          setTrophyOpen(true);
          setLootCharacterId(rollGachaCharacter(Date.now()).id);
          setLootRevealed(false);
        }
        return next;
      });
    },
    [hero.voicePitch, stagger, triggerSfx, triggerShake, spawnCombatText]
  );

  const triggerTakeHit = useCallback(
    (damage: number) => {
      triggerSfx('error-bonk');
      setHeroPose('hurt');
      window.setTimeout(() => setHeroPose('idle'), 260);
      setHp((prev) => Math.max(0, prev - damage));
      triggerShake(6, 55);
      spawnCombatText(`-${damage} HIT`, 'damage');
    },
    [triggerSfx, triggerShake, spawnCombatText]
  );

  const triggerHeal = useCallback(() => {
    triggerSfx('success-chime');
    setHp((prev) => Math.min(100, prev + 24));
    setMp((prev) => Math.max(0, prev - 15));
    spawnCombatText('+24 HEAL', 'heal');
  }, [triggerSfx, spawnCombatText]);

  const triggerUltimate = useCallback(() => {
    setCutInOpen(true);
    strikeBoss(hero.ultimate.power * 2, 45, true);
    window.setTimeout(() => setCutInOpen(false), 1850);
  }, [hero.ultimate.power, strikeBoss]);

  const resetBattle = useCallback(() => {
    triggerSfx('coin-pickup');
    setHp(100);
    setMp(100);
    setBossHp(boss.stats.hp);
    setStagger(0);
    setCombo(0);
    setHeroPose('idle');
    setLootCharacterId(null);
    setLootRevealed(false);
    setTrophyOpen(false);
    setPaused(false);
    spawnCombatText('RESET!', 'status');
  }, [boss.stats.hp, spawnCombatText, triggerSfx]);

  const hotbarItems: HotbarSlotItem[] = [
    {
      id: 'slash',
      label: 'Slash',
      hotkey: '1',
      icon: <KatanaIcon size={18} aria-hidden="true" />,
      rarity: 'common',
      cooldownProgress: (cooldowns.slash ?? 0) / 1.4,
      cooldownSeconds: cooldowns.slash,
    },
    {
      id: 'nova',
      label: 'Nova Crit',
      hotkey: '2',
      icon: <CriticalStarIcon size={18} aria-hidden="true" />,
      rarity: 'legendary',
      cooldownProgress: (cooldowns.nova ?? 0) / 2.2,
      cooldownSeconds: cooldowns.nova,
    },
    {
      id: 'med',
      label: 'Med Pulse',
      hotkey: '3',
      icon: <PotionFlaskIcon size={18} aria-hidden="true" />,
      rarity: 'rare',
      count: 3,
      cooldownProgress: (cooldowns.med ?? 0) / 1.6,
      cooldownSeconds: cooldowns.med,
    },
    {
      id: 'guard',
      label: 'Reset Arena',
      hotkey: '4',
      icon: <ShieldCrestIcon size={18} aria-hidden="true" />,
      rarity: 'epic',
    },
  ];

  const handleHotbar = useCallback(
    (item: HotbarSlotItem) => {
      if (item.id === 'slash') {
        setCooldowns((c) => ({ ...c, slash: 1.4 }));
        strikeBoss(28, 22, false);
      } else if (item.id === 'nova') {
        setCooldowns((c) => ({ ...c, nova: 2.2 }));
        strikeBoss(54, 38, true);
      } else if (item.id === 'med') {
        setCooldowns((c) => ({ ...c, med: 1.6 }));
        triggerHeal();
      } else {
        resetBattle();
      }
    },
    [resetBattle, strikeBoss, triggerHeal]
  );

  const handleArenaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (event.key === '1') handleHotbar(hotbarItems[0]!);
      else if (event.key === '2') handleHotbar(hotbarItems[1]!);
      else if (event.key === '3') handleHotbar(hotbarItems[2]!);
      else if (event.key === '4') handleHotbar(hotbarItems[3]!);
      else if (event.key.toLowerCase() === 'u') triggerUltimate();
      else if (event.key === 'Escape') setPaused((p) => !p);
    },
    [handleHotbar, hotbarItems, triggerUltimate]
  );

  const turnEntries: TurnOrderEntry[] = useMemo(
    () => [
      { id: 't1', characterId: hero.id, team: 'ally', actionValue: 0 },
      { id: 't2', characterId: 'vesper-ink', team: 'ally', actionValue: 14 },
      { id: 't3', characterId: boss.id, team: 'enemy', actionValue: 22 },
      { id: 't4', characterId: 'akira-pulse', team: 'ally', actionValue: 31 },
    ],
    [hero.id, boss.id]
  );

  const activeDialogueChar = dialogueStep % 2 === 0 ? hero : boss;
  const activeDialogueText =
    activeDialogueChar.dialogueLines[dialogueStep % activeDialogueChar.dialogueLines.length] ??
    activeDialogueChar.ultimate.quote;

  return (
    <MotionStage
      tabIndex={0}
      onKeyDown={handleArenaKeyDown}
      shakeIntensity={shakeIntensity}
      shakeSeed={shakeSeed}
      hitstopMs={hitstopMs}
      className="mw-ui-template-shell mw-ui-template-game"
      data-testid="template-game-battle"
    >
      <ScreenFXOverlay effect="flash" active={flashFx} />
      <ScreenFXOverlay effect="speedlines-burst" active={speedlinesFx} />
      <ScreenFXOverlay effect="vignette" active={hp > 0 && hp <= 25} />
      <FloatingCombatText events={events} />

      <PauseMenuOverlay open={paused} onResume={() => setPaused(false)} onRestart={resetBattle}>
        <p className="mw-ui-template-hero-lead">
          Battle paused. Press Esc or Resume to return with keyboard hotkeys (1-4, U).
        </p>
      </PauseMenuOverlay>

      <div className="mw-ui-template-battle-bar">
        <div className="mw-ui-template-battle-pickers">
          <label>
            HERO{' '}
            <select
              aria-label="Select battle hero"
              className="mw-ui-template-battle-select"
              value={hero.id}
              onChange={(e) => setHeroId(e.target.value)}
            >
              {PLAYABLE_HEROES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.faction})
                </option>
              ))}
            </select>
          </label>
          <label>
            BOSS{' '}
            <select
              aria-label="Select raid boss"
              className="mw-ui-template-battle-select"
              value={boss.id}
              onChange={(e) => setBossId(e.target.value)}
            >
              {ECLIPSE_BOSSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.stats.hp} HP)
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mw-ui-template-actions">
          <Button size="sm" variant="default" onClick={triggerUltimate}>
            Ultimate Cut-In (U)
          </Button>
          <Button size="sm" variant="destructive" onClick={() => triggerTakeHit(22)}>
            Take Hit (-22)
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPaused(true)}>
            Pause HUD
          </Button>
        </div>
      </div>

      <BossHealthBar
        characterId={boss.id}
        hp={bossHp}
        maxHp={boss.stats.hp}
        phases={3}
        stagger={stagger}
        broken={stagger >= 100}
      />

      <TurnOrderStrip entries={turnEntries} activeId="t1" />

      <AnimeCutIn
        active={cutInOpen}
        characterId={hero.id}
        onDismiss={() => setCutInOpen(false)}
      />

      <AchievementToast
        open={trophyOpen}
        title={`${boss.name} Vanquished!`}
        description="Multi-phase Eclipse boss cleared. Reveal your mythic summon reward below."
        points={350}
        rarity="mythic"
        onDismiss={() => setTrophyOpen(false)}
      />

      <div className="mw-ui-template-game-top">
        <div className="mw-ui-template-game-gauges">
          <StatGauge label={`${hero.name.toUpperCase()} HP`} value={hp} max={100} tone="hp" variant="arcade-skew" />
          <StatGauge label="ENERGY MP" value={mp} max={100} tone="mp" variant="segmented" segments={8} />
          <StatGauge label="SYNC XP" value={xp} max={100} tone="xp" variant="straight" />
        </div>
        <div className="mw-ui-template-game-right">
          <ComboCounter count={combo} decayProgress={Math.min(1, 0.35 + combo * 0.06)} />
          <TacticalRadar zoneLabel="ROOFTOP ARENA" blips={RADAR_BLIPS} />
        </div>
      </div>

      <div className="mw-ui-template-battle-stage">
        <div className="mw-ui-template-battle-fighter">
          <CartoonRig
            characterId={hero.id}
            pose={heroPose}
            emote={hp <= 25 ? 'sweatdrop' : combo >= 10 ? 'sparkle' : undefined}
            size="md"
          />
          <div>
            <Badge size="sm" variant="primary">
              {hero.codename} · {hero.element.toUpperCase()}
            </Badge>
            <p className="mw-ui-template-hero-lead">
              <strong>{hero.name}</strong> — {hero.title}
            </p>
          </div>
        </div>
        {lootCharacterId ? (
          <LootRevealCard
            characterId={lootCharacterId}
            revealed={lootRevealed}
            onRevealChange={setLootRevealed}
          />
        ) : (
          <div className="mw-ui-template-game-radial-wrap">
            <RadialMenu
              activeId={radialAction}
              options={[
                { id: 'slash', label: 'Strike', badge: 'ATK' },
                { id: 'guard', label: 'Guard', badge: 'DEF' },
                { id: 'dash', label: 'Ultimate', badge: 'ULT' },
                { id: 'item', label: 'Heal', badge: 'MED' },
              ]}
              onSelect={(opt) => {
                setRadialAction(opt.id);
                if (opt.id === 'slash') strikeBoss(30, 20, false);
                else if (opt.id === 'dash') triggerUltimate();
                else if (opt.id === 'item') triggerHeal();
                else spawnCombatText('GUARD UP!', 'status');
              }}
            />
            <div className="mw-ui-template-prompts">
              <InputPromptBadge input="1-4" platform="keyboard" actionLabel="Skills" />
              <InputPromptBadge input="U" platform="keyboard" actionLabel="Ultimate" />
              <InputPromptBadge input="A" platform="xbox" actionLabel="Strike" />
              <InputPromptBadge input="✕" platform="playstation" actionLabel="Advance" />
            </div>
          </div>
        )}
      </div>

      <ActionHotbar items={hotbarItems} onActivate={handleHotbar} />

      <DialogueBox
        characterId={activeDialogueChar.id}
        text={activeDialogueText}
        instant={false}
        choices={[
          { id: 'strike', label: `Launch ${hero.ultimate.name}`, hint: 'Cut-In' },
          { id: 'heal', label: 'Cast Field Med (+24 HP)', hint: '-15 MP' },
        ]}
        onChoiceSelect={(choice) => {
          if (choice.id === 'strike') triggerUltimate();
          else triggerHeal();
          setDialogueStep((s) => s + 1);
        }}
        onAdvance={() => setDialogueStep((s) => s + 1)}
      />
    </MotionStage>
  );
}

const SAMPLE_STORYBOARD: readonly StoryboardBeat[] = [
  {
    id: 'beat-1',
    label: 'Entrance',
    durationMs: 2600,
    characterId: 'kuro-signal',
    speaker: 'Kuro',
    line: 'Hold tight! Launching the MoonWitness cel-shaded anime & cartoon cutscene engine!',
    mood: 'happy',
    emote: 'sparkle',
    sfxWord: 'WHOOSH!',
    sfxTone: 'speed',
    audioCue: 'zip',
    cameraZoom: 1,
    cameraX: 0,
  },
  {
    id: 'beat-2',
    label: 'Impact',
    durationMs: 2400,
    characterId: 'pip-bounce',
    speaker: 'Pip',
    line: 'BOOM! Spiky starburst SFX, eye blinks, lip-sync phonemes, and squash-stretch all synced!',
    mood: 'surprised',
    emote: 'shock',
    sfxWord: 'BOOM!',
    sfxTone: 'impact',
    audioCue: 'boing',
    cameraZoom: 1.08,
    cameraX: -8,
    impactFlash: true,
  },
  {
    id: 'beat-3',
    label: 'Finale',
    durationMs: 2600,
    characterId: 'aria-lumina',
    speaker: 'Aria',
    line: 'Every character in our 30-character registry plugs directly into rigs, cut-ins, and VN stages.',
    mood: 'determined',
    emote: 'exclaim',
    sfxWord: 'ZAP!',
    sfxTone: 'electric',
    audioCue: 'rimshot',
    cameraZoom: 1.03,
    cameraX: 6,
  },
];

const SAMPLE_VN_LINES: readonly VisualNovelLine[] = [
  {
    id: 'vn-1',
    speakerId: 'kuro-signal',
    position: 'left',
    mood: 'determined',
    emote: 'exclaim',
    text: 'Lord Null just breached the rooftop broadcast relay. Ready for a synchronized Anime Cut-In?',
  },
  {
    id: 'vn-2',
    speakerId: 'vesper-ink',
    position: 'center',
    mood: 'neutral',
    emote: 'sparkle',
    text: 'I already locked the stagger curve. Give me the call and we shatter all three boss bars.',
    choices: [
      { id: 'rush', label: 'Full Rush — Trigger Overdrive Cut-In!' },
      { id: 'sync', label: 'Wait for Akira to boost our ATB Speed' },
    ],
  },
  {
    id: 'vn-3',
    speakerId: 'akira-pulse',
    position: 'right',
    mood: 'happy',
    emote: 'sparkle',
    text: 'Unified audio bus at 100%! Every character speaks at their own signature voice pitch.',
  },
];

export function CartoonStudioTemplate() {
  const { triggerSfx } = useMotion();
  const [smearActive, setSmearActive] = useState(false);
  const [cutInPreview, setCutInPreview] = useState(false);
  const [episodeReplay, setEpisodeReplay] = useState(0);

  const triggerSmear = () => {
    setSmearActive(true);
    triggerSfx('zip');
    window.setTimeout(() => setSmearActive(false), 420);
  };

  return (
    <div className="mw-ui-template-shell" data-testid="template-cartoon-studio">
      <div className="mw-ui-template-app-bar">
        <div>
          <Badge variant="primary" size="sm">
            ANIME &amp; 2D CARTOON CUTSCENE STUDIO
          </Badge>
          <h3 className="mw-ui-template-section-title">Episode Card, Visual Novel Stage &amp; Storyboard</h3>
        </div>
        <div className="mw-ui-template-actions">
          <Button size="sm" variant="default" onClick={() => setCutInPreview((v) => !v)}>
            {cutInPreview ? 'Hide Cut-In' : 'Trigger Anime Cut-In'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEpisodeReplay((n) => n + 1)}>
            Replay Title Card
          </Button>
          <Button size="sm" variant="outline" onClick={triggerSmear}>
            Smear Burst
          </Button>
        </div>
      </div>

      <EpisodeTitleCard
        episodeLabel="EPISODE 01"
        jpSubtitle="第1話・シグナル暴走"
        title="SIGNAL OVERDRIVE: MOONWITNESS AWAKENS"
        replayKey={episodeReplay}
      />

      <AnimeCutIn
        active={cutInPreview}
        characterId="kuro-signal"
        onDismiss={() => setCutInPreview(false)}
      />

      <VisualNovelStage
        sceneTitle="SCENE 01 · SIGNAL TOWER ROOFTOP"
        castIds={['kuro-signal', 'vesper-ink', 'akira-pulse']}
        lines={SAMPLE_VN_LINES}
      />

      <SmearFrame active={smearActive} direction="right">
        <StoryboardPlayer title="EP-01 · Signal Drop" beats={SAMPLE_STORYBOARD} />
      </SmearFrame>
    </div>
  );
}
