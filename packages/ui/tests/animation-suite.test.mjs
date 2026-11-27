import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { URL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  MOTION_EASING_NAMES,
  MOTION_PROFILE_SCALES,
  computeCameraShakeOffset,
  computeLipSyncPhoneme,
  evaluateEasing,
  sampleEasingCurve,
  stepSpring,
} from '../dist/motion/physics.js';
import {
  AnimatedNumber,
  KineticText,
  MarqueeRibbon,
  MotionProvider,
  MotionStage,
  ScrollReveal,
  StaggerGroup,
  StateMorphButton,
  PROCEDURAL_SFX_PRESETS,
  playProceduralSfx,
} from '../dist/motion/index.js';
import {
  ActionHotbar,
  ComboCounter,
  DialogueBox,
  FloatingCombatText,
  GameTitleScreen,
  InputPromptBadge,
  InventoryGrid,
  PauseMenuOverlay,
  RadialMenu,
  StatGauge,
  resolveComboTier,
} from '../dist/game/index.js';
import {
  CartoonRig,
  ImpactFlash,
  OnomatopoeiaSFX,
  SmearFrame,
  StoryboardPlayer,
} from '../dist/cartoon/index.js';
import {
  AppCommandTemplate,
  CartoonStudioTemplate,
  GameBattleTemplate,
  WebLandingTemplate,
} from '../dist/templates/index.js';
import { BUILTIN_SKINS, themeRegistry } from '../dist/themes/index.js';

const tokensCss = await readFile(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function extractCssBlock(selectorPattern) {
  const match = tokensCss.match(new RegExp(`${selectorPattern}\\s*\\{([^}]+)\\}`, 'u'));
  return match ? match[1] : '';
}

function readVarFromBlock(block, token) {
  const match = block.match(new RegExp(`--mw-${token}:\\s*([^;]+);`, 'u'));
  return match ? match[1].trim() : undefined;
}

function resolveSkinToken(token, skinId, dark) {
  const rootBlock = extractCssBlock(':root');
  const darkBlock = extractCssBlock('\\.dark');
  const skinBlock = extractCssBlock(`\\[data-skin='${skinId}'\\]`);
  const skinDarkBlock = extractCssBlock(`\\[data-skin='${skinId}'\\]\\.dark`);

  const chain = dark
    ? [skinDarkBlock, skinBlock, darkBlock, rootBlock]
    : [skinBlock, rootBlock];

  let value;
  for (const block of chain) {
    const candidate = readVarFromBlock(block, token);
    if (candidate) {
      value = candidate;
      break;
    }
  }
  if (!value) return undefined;
  const ref = value.match(/^var\(--mw-([\w-]+)\)$/u);
  return ref ? resolveSkinToken(ref[1], skinId, dark) : value;
}

function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/iu, `Expected hex color, got ${hex}`);
  const channels = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

test('motion physics evaluates all 18 easing curves deterministically with exact endpoints', () => {
  assert.equal(MOTION_EASING_NAMES.length, 18);
  for (const name of MOTION_EASING_NAMES) {
    assert.equal(evaluateEasing(0, name), 0, `${name} at t=0 must be 0`);
    assert.equal(evaluateEasing(1, name), 1, `${name} at t=1 must be 1`);
    const samples = sampleEasingCurve(name, 32);
    assert.equal(samples.length, 33);
    assert.equal(samples[0].t, 0);
    assert.equal(samples[32].t, 1);
    assert.equal(typeof samples[16].y, 'number');
  }
  assert.ok(evaluateEasing(0.75, 'overshoot') > 1, 'overshoot should exceed 1 before settling');
  assert.ok(evaluateEasing(0.15, 'anticipation') < 0, 'anticipation should pull back below 0');
  assert.ok(
    evaluateEasing(0.15, 'ease-in-out-back') < 0,
    'ease-in-out-back should pull back below 0 early'
  );
  assert.ok(
    evaluateEasing(0.85, 'ease-in-out-back') > 1,
    'ease-in-out-back should overshoot above 1 late'
  );
  assert.ok(evaluateEasing(0.75, 'ease-out-back') > 1, 'ease-out-back should overshoot above 1');
  assert.equal(evaluateEasing(0.15, 'steps-8'), 0.125);
  assert.equal(MOTION_PROFILE_SCALES.off, 0);
  assert.ok(MOTION_PROFILE_SCALES.cartoon > MOTION_PROFILE_SCALES.expressive);
});

test('spring physics converges smoothly to target and camera shake damps to zero', () => {
  let state = { value: 0, velocity: 0, settled: false };
  for (let i = 0; i < 180; i += 1) {
    state = stepSpring(state.value, 100, state.velocity, 1 / 60, {
      stiffness: 220,
      damping: 24,
      mass: 1,
    });
    if (state.settled) break;
  }
  assert.equal(state.settled, true);
  assert.ok(Math.abs(state.value - 100) < 0.05);

  const shakeMid = computeCameraShakeOffset(120, 400, 10, 1);
  const shakeEnd = computeCameraShakeOffset(400, 400, 10, 1);
  assert.equal(shakeEnd.x, 0);
  assert.equal(shakeEnd.y, 0);
  assert.ok(Math.hypot(shakeMid.x, shakeMid.y) > 0);
});

test('lip sync maps vowels and consonants deterministically and procedural SFX is SSR-safe', () => {
  assert.equal(computeLipSyncPhoneme('cat', 2, true), 'wide');
  assert.equal(computeLipSyncPhoneme('pop', 2, true), 'o-shape');
  assert.equal(computeLipSyncPhoneme('boom', 4, true), 'small');
  assert.equal(computeLipSyncPhoneme('hi!', 3, true), 'closed');
  assert.equal(computeLipSyncPhoneme('hello', 2, false), 'closed');
  assert.ok(PROCEDURAL_SFX_PRESETS.length >= 13);
  assert.equal(playProceduralSfx('boing', true, true), false);
});

test('all 8 skins (including cartoon-pop, arcade-neon, clean-motion, cozy-rpg) meet WCAG AA contrast in light and dark modes', () => {
  assert.equal(BUILTIN_SKINS.length, 8);
  for (const id of ['cartoon-pop', 'arcade-neon', 'clean-motion', 'cozy-rpg']) {
    assert.equal(themeRegistry.has(id), true, `Expected ${id} to be registered in themeRegistry`);
  }

  const pairs = [
    ['foreground', 'background'],
    ['surface-foreground', 'surface'],
    ['muted-foreground', 'muted'],
    ['primary-foreground', 'primary'],
  ];

  for (const skinId of ['cartoon-pop', 'arcade-neon', 'clean-motion', 'cozy-rpg']) {
    for (const dark of [false, true]) {
      for (const [fgName, bgName] of pairs) {
        const fg = resolveSkinToken(fgName, skinId, dark);
        const bg = resolveSkinToken(bgName, skinId, dark);
        assert.ok(fg && bg, `Missing ${fgName}/${bgName} for ${skinId} (dark=${dark})`);
        const ratio = contrastRatio(fg, bg);
        assert.ok(
          ratio >= 4.5,
          `${skinId} (dark=${dark}) ${fgName} (${fg}) on ${bgName} (${bg}) contrast ${ratio.toFixed(2)} < 4.5`
        );
      }
    }
  }
});

test('motion, game, cartoon, and template modules render cleanly via SSR without browser globals', () => {
  assert.equal(resolveComboTier(2), 'C');
  assert.equal(resolveComboTier(12), 'S');
  assert.equal(resolveComboTier(28), 'SSS');

  const motionHtml = renderToStaticMarkup(
    React.createElement(
      MotionProvider,
      { defaultProfile: 'cartoon' },
      React.createElement(
        MotionStage,
        null,
        React.createElement(KineticText, { text: 'Hello Motion' }),
        React.createElement(AnimatedNumber, { value: 120, suffix: '%' }),
        React.createElement(ScrollReveal, null, 'Revealed'),
        React.createElement(StaggerGroup, null, React.createElement('span', null, 'Item')),
        React.createElement(MarqueeRibbon, { items: ['A', 'B'] }),
        React.createElement(StateMorphButton, { status: 'idle' }, 'Run')
      )
    )
  );
  assert.match(motionHtml, /Hello/);
  assert.match(motionHtml, /120%/);

  const gameHtml = renderToStaticMarkup(
    React.createElement(
      'div',
      null,
      React.createElement(StatGauge, { label: 'HP', value: 80, max: 100, tone: 'hp' }),
      React.createElement(DialogueBox, {
        speaker: 'Nova',
        text: 'Ready for launch.',
        choices: [{ id: 'go', label: 'Engage' }],
      }),
      React.createElement(FloatingCombatText, {
        events: [{ id: 1, text: '-42', tone: 'crit' }],
      }),
      React.createElement(InventoryGrid, {
        items: [{ id: 'potion', label: 'Potion', count: 3 }],
      }),
      React.createElement(ActionHotbar, {
        items: [{ id: 'slash', label: 'Slash', hotkey: '1' }],
      }),
      React.createElement(ComboCounter, { count: 14 }),
      React.createElement(RadialMenu, {
        options: [
          { id: 'atk', label: 'Attack' },
          { id: 'def', label: 'Guard' },
        ],
      }),
      React.createElement(InputPromptBadge, { input: 'E', actionLabel: 'Interact' }),
      React.createElement(GameTitleScreen, {
        title: 'Starfall',
        menuItems: [{ id: 'start', label: 'New Game' }],
        onSelectItem: () => {},
      }),
      React.createElement(PauseMenuOverlay, { open: true, onResume: () => {} })
    )
  );
  assert.match(gameHtml, /Starfall/);
  assert.match(gameHtml, /PAUSED/);

  const cartoonHtml = renderToStaticMarkup(
    React.createElement(
      'div',
      null,
      React.createElement(CartoonRig, { name: 'Pip', mood: 'happy', phoneme: 'wide' }),
      React.createElement(OnomatopoeiaSFX, { text: 'POW!', tone: 'impact' }),
      React.createElement(SmearFrame, { active: true }, 'Dash'),
      React.createElement(ImpactFlash, { active: true }),
      React.createElement(StoryboardPlayer, {
        title: 'Test Short',
        beats: [
          {
            id: 'b1',
            label: 'Intro',
            durationMs: 1200,
            speaker: 'Pip',
            line: 'Action!',
            mood: 'happy',
          },
        ],
      })
    )
  );
  assert.match(cartoonHtml, /POW!/);
  assert.match(cartoonHtml, /Test Short/);

  for (const Template of [
    WebLandingTemplate,
    AppCommandTemplate,
    GameBattleTemplate,
    CartoonStudioTemplate,
  ]) {
    const html = renderToStaticMarkup(React.createElement(Template));
    assert.ok(html.length > 200, `Expected non-empty SSR markup for ${Template.name}`);
  }
});

test('build generates W3C DTCG tokens, token bundle JSON, and Tailwind v4 @theme preset', async () => {
  const w3c = JSON.parse(await readFile(new URL('../dist/tokens.w3c.json', import.meta.url), 'utf8'));
  const bundle = JSON.parse(await readFile(new URL('../dist/tokens.bundle.json', import.meta.url), 'utf8'));
  const twPreset = await readFile(new URL('../dist/tailwind-preset.css', import.meta.url), 'utf8');

  assert.ok(Object.keys(w3c.color).length > 10);
  assert.ok(Object.keys(w3c.motion).length >= 2);
  assert.equal(bundle.skins.length, 8);
  assert.match(twPreset, /@theme\s*\{/u);
  assert.match(twPreset, /--color-mw-primary:/u);
});
