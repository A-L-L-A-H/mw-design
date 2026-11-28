import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '../dist/index.js';
import { CharacterBadge } from '../dist/components/character-badge.js';

const render = (props) => renderToStaticMarkup(React.createElement(CharacterBadge, props));

test('CharacterBadge renders a playable registry character with its faction', () => {
  const profile = ui.CHARACTER_REGISTRY[0];
  const faction = ui.CHARACTER_FACTIONS.find((entry) => entry.id === profile.faction);
  const html = render({ characterId: profile.id });
  assert.match(html, new RegExp(`data-character="${profile.id}"`, 'u'));
  assert.ok(html.includes(profile.name), 'shows the character name');
  assert.ok(html.includes(faction.label), 'shows the faction label');
  assert.doesNotMatch(html, /data-canon=/u);
  assert.doesNotMatch(html, /style=/u);
});

test('CharacterBadge marks lore characters with canon level and their lore group', () => {
  const lore = ui.ROCKSOUL_LORE_ROSTER[0];
  const group = ui.ROCKSOUL_LORE_FACTIONS.find((entry) => entry.id === lore.loreGroup);
  const html = render({ characterId: lore.id, size: 'sm' });
  assert.match(html, /data-canon="lore"/u);
  assert.match(html, /data-size="sm"/u);
  assert.ok(html.includes(group.label), 'shows the lore group label');
  assert.ok(html.includes(lore.displayName.replace(/&/gu, '&amp;')), 'shows the display name');
});

test('CharacterBadge can hide the group and renders nothing for unknown ids', () => {
  const profile = ui.CHARACTER_REGISTRY[0];
  const faction = ui.CHARACTER_FACTIONS.find((entry) => entry.id === profile.faction);
  assert.ok(!render({ characterId: profile.id, showGroup: false }).includes(faction.label));
  assert.equal(render({ characterId: 'not-a-real-character' }), '');
});

test('lore registry helpers are exported from the root barrel and stay guarded', () => {
  for (const name of ['getLoreCharacterById', 'getMoonWitnessXiiCast', 'getExtendedLoreCast', 'filterLoreCharacters']) {
    assert.equal(typeof ui[name], 'function', `${name} should be exported`);
  }
  assert.equal(ui.ROCKSOUL_LORE_ROSTER.length, ui.MOONWITNESS_XII_CAST_IDS.length + ui.EXTENDED_LORE_CAST_IDS.length);
  for (const character of ui.ROCKSOUL_LORE_ROSTER) {
    assert.equal(character.canonLevel, 'lore');
    assert.equal(character.autoMergeForbidden, true);
  }
});

test('CharacterBadge has a package subpath and a hex-free stylesheet rule', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok('./components/character-badge' in pkg.exports);
  const css = await readFile(new URL('../src/styles/visual-universe.css', import.meta.url), 'utf8');
  assert.match(css, /\.mw-ui-character-badge\b/u);
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//gu, ''), /#[\da-f]{3,8}\b/iu);
});
