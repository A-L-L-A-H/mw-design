import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CHARACTER_FACTIONS,
  CHARACTER_REGISTRY,
  DnaIcon,
  GENRE_DNA_PRESETS,
  filterCharacters,
  getBossCharacters,
  getCharacterById,
  getGenreDnaPresetById,
  getPlayableCharacters,
  rollGachaCharacter,
} from '../dist/index.js';
import {
  getGlobalAudioEnabled,
  setGlobalAudioEnabled,
  subscribeAudioPreference,
} from '../dist/lib/audio-runtime.js';
import * as AllIcons from '../dist/icons/index.js';
import {
  AnimeCutIn,
  AnimeEmoteBubble,
  CartoonRig,
  EpisodeTitleCard,
  OnomatopoeiaSFX,
  VisualNovelStage,
} from '../dist/cartoon/index.js';
import {
  AchievementBadge,
  AchievementToast,
  BossHealthBar,
  ComboCounter,
  DialogueBox,
  LootRevealCard,
  QuestCard,
  RewardPanel,
  SkillTreeGraph,
  StatGauge,
  TacticalRadar,
  TurnOrderStrip,
} from '../dist/game/index.js';
import { MotionProvider, MotionStage } from '../dist/motion/index.js';

const COMPONENTS_CSS = readFileSync(
  resolve(import.meta.dirname, '..', 'src', 'styles', 'components.css'),
  'utf8'
);

test('Phase 8: CHARACTER_REGISTRY exports 30 unique characters across 6 factions x 5', () => {
  assert.equal(CHARACTER_REGISTRY.length, 30);
  assert.equal(CHARACTER_FACTIONS.length, 6);

  const ids = new Set(CHARACTER_REGISTRY.map((c) => c.id));
  assert.equal(ids.size, 30);

  for (const faction of CHARACTER_FACTIONS) {
    const members = filterCharacters({ faction: faction.id });
    assert.equal(members.length, 5, `Faction ${faction.id} must have exactly 5 characters`);
  }

  assert.equal(getPlayableCharacters().length, 25);
  assert.equal(getBossCharacters().length, 5);

  const kuro = getCharacterById('kuro-signal');
  assert.ok(kuro);
  assert.equal(kuro.name, 'Kuro');
  assert.ok(kuro.ultimate.jpCallout.length > 0);

  const rolled = rollGachaCharacter(42);
  assert.ok(getCharacterById(rolled.id));
});

test('Phase 7: 120 typed icons exported including 32 custom anime/game icons and DnaIcon treatments', () => {
  const iconKeys = Object.keys(AllIcons).filter((key) => key.endsWith('Icon'));
  assert.equal(iconKeys.length, 120);

  const requiredCustomIcons = [
    'KatanaIcon',
    'ShurikenIcon',
    'ShieldCrestIcon',
    'HeartHpIcon',
    'ManaCrystalIcon',
    'BossSkullIcon',
    'PotionFlaskIcon',
    'LootChestIcon',
    'TrophyCrownIcon',
    'QuestScrollIcon',
    'ElementFireIcon',
    'ElementIceIcon',
    'ElementVoltIcon',
    'ElementVoidIcon',
    'ElementWindIcon',
    'ElementSolarIcon',
    'ComboFlameIcon',
    'CriticalStarIcon',
    'AnimeSweatdropIcon',
    'AnimeAngerIcon',
    'AnimeShockIcon',
    'AnimeSparkleIcon',
    'SpeechBurstIcon',
    'ImpactSlashIcon',
    'ClapperboardIcon',
    'KeyframeDiamondIcon',
    'GamepadIcon',
    'DpadIcon',
    'RadarPingIcon',
    'GachaTicketIcon',
    'SkillNodeIcon',
    'MechaHelmIcon',
  ];

  for (const iconName of requiredCustomIcons) {
    assert.ok(AllIcons[iconName], `Expected ${iconName} export`);
  }

  const html = renderToStaticMarkup(
    React.createElement(
      DnaIcon,
      {
        treatment: 'cel-ink',
        tone: 'magenta',
        label: 'Katana slash',
      },
      React.createElement(AllIcons.KatanaIcon, { size: 22 })
    )
  );
  assert.match(html, /data-treatment="cel-ink"/);
  assert.match(html, /data-tone="magenta"/);
  assert.match(html, /<svg/);
});

test('Phase 2 & 3: GENRE_DNA_PRESETS (5 presets) and unified global audio bus', () => {
  assert.equal(GENRE_DNA_PRESETS.length, 5);
  assert.equal(getGenreDnaPresetById('shonen-anime')?.skin, 'moonwitness-ink');
  assert.equal(getGenreDnaPresetById('arcade-fighter')?.skin, 'arcade-neon');

  let observed = null;
  const unsub = subscribeAudioPreference((enabled) => {
    observed = enabled;
  });
  setGlobalAudioEnabled(true);
  assert.equal(getGlobalAudioEnabled(), true);
  assert.equal(observed, true);
  setGlobalAudioEnabled(false);
  assert.equal(getGlobalAudioEnabled(), false);
  unsub();
});

test('Phase 4: Anime Suite SSR renders cel-shaded CartoonRig, EmoteBubble, CutIn, VNStage, EpisodeTitleCard', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MotionProvider,
      null,
      React.createElement(CartoonRig, {
        characterId: 'kuro-signal',
        mood: 'determined',
        emote: 'sparkle',
        pose: 'attack',
      }),
      React.createElement(AnimeEmoteBubble, { kind: 'sweatdrop' }),
      React.createElement(AnimeCutIn, { active: true, characterId: 'kuro-signal' }),
      React.createElement(EpisodeTitleCard, {
        episodeLabel: 'EP 01',
        title: 'SIGNAL OVERDRIVE',
      }),
      React.createElement(OnomatopoeiaSFX, { text: 'DOOM!', tone: 'impact' }),
      React.createElement(VisualNovelStage, {
        castIds: ['kuro-signal', 'vesper-ink'],
        lines: [
          {
            id: 'l1',
            speakerId: 'kuro-signal',
            position: 'left',
            text: 'Ready to strike!',
          },
        ],
      })
    )
  );

  assert.match(html, /data-character-id="kuro-signal"/);
  assert.match(html, /mw-ui-cartoon-puppet-svg/);
  assert.match(html, /data-slot="anime-emote-bubble"/);
  assert.match(html, /mw-ui-anime-cutin/);
  assert.match(html, /mw-ui-episode-card/);
  assert.match(html, /mw-ui-cartoon-sfx-burst/);
  assert.match(html, /mw-ui-vn-stage/);
});

test('Phase 5: Game HUD Suite SSR renders BossHealthBar, TurnOrderStrip, LootRevealCard, AchievementToast, TacticalRadar, SkillTreeGraph, and re-exports', () => {
  assert.ok(QuestCard);
  assert.ok(AchievementBadge);
  assert.ok(RewardPanel);

  const html = renderToStaticMarkup(
    React.createElement(
      MotionProvider,
      null,
      React.createElement(
        MotionStage,
        { shakeIntensity: 6, hitstopMs: 40 },
        React.createElement(BossHealthBar, {
          characterId: 'lord-null',
          hp: 260,
          maxHp: 380,
          phases: 3,
          stagger: 80,
        }),
        React.createElement(TurnOrderStrip, {
          entries: [
            { id: 't1', characterId: 'kuro-signal', team: 'ally', actionValue: 0 },
            { id: 't2', characterId: 'lord-null', team: 'enemy', actionValue: 18 },
          ],
          activeId: 't1',
        }),
        React.createElement(LootRevealCard, { characterId: 'aria-lumina', revealed: true }),
        React.createElement(AchievementToast, {
          open: true,
          title: 'Boss Defeated',
          points: 200,
          rarity: 'legendary',
        }),
        React.createElement(TacticalRadar, {
          blips: [{ id: 'b1', label: 'Boss', x: 0.4, y: -0.3, kind: 'boss' }],
        }),
        React.createElement(SkillTreeGraph, {
          availablePoints: 3,
          nodes: [
            { id: 'n1', label: 'Core', summary: 'Root', cost: 1, x: 50, y: 20, state: 'unlocked' },
            { id: 'n2', label: 'Slash', summary: 'Atk', cost: 1, x: 50, y: 70, requires: ['n1'], state: 'available' },
          ],
        }),
        React.createElement(StatGauge, {
          label: 'HP',
          value: 20,
          max: 100,
          tone: 'hp',
          variant: 'arcade-skew',
        }),
        React.createElement(ComboCounter, { count: 25 }),
        React.createElement(DialogueBox, {
          characterId: 'kuro-signal',
          text: 'Testing auto character dialogue.',
          instant: true,
        })
      )
    )
  );

  assert.match(html, /data-slot="boss-health-bar"/);
  assert.match(html, /data-slot="turn-order-strip"/);
  assert.match(html, /data-slot="loot-reveal-card"/);
  assert.match(html, /data-slot="achievement-toast"/);
  assert.match(html, /data-slot="tactical-radar"/);
  assert.match(html, /data-slot="skill-tree-graph"/);
  assert.match(html, /data-variant="arcade-skew"/);
  assert.match(html, /data-critical="true"/);
  assert.match(html, /data-tier="SSS"/);
  assert.match(html, /Kuro/);
});

test('Phase 1: components.css wires all previously dead visual hooks', () => {
  const requiredSelectors = [
    "[data-effect='flash']",
    "[data-effect='speedlines-burst']",
    "[data-effect='chromatic-pulse']",
    "[data-variant='iris-circle']",
    "[data-variant='arcade-skew']",
    "[data-critical='true']",
    "[data-hit='true']",
    "[data-tier='SSS']",
    "[data-platform='xbox']",
    "[data-platform='playstation']",
    "[data-blink='true']",
    '--mw-sfx-tilt',
  ];
  for (const selector of requiredSelectors) {
    assert.ok(
      COMPONENTS_CSS.includes(selector),
      `Expected components.css to contain hook ${selector}`
    );
  }
});
