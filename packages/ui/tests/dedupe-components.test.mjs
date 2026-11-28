import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '../dist/index.js';
import { SpeechBubble as EffectsBubble } from '../dist/components/effects.js';
import { SpeechBubble as CanonicalBubble } from '../dist/components/speech-bubble.js';

test('barrel exports the canonical SpeechBubble and keeps the effects one as an alias', () => {
  assert.equal(ui.SpeechBubble, CanonicalBubble);
  assert.equal(ui.EffectsSpeechBubble, EffectsBubble);
  assert.notEqual(ui.EffectsSpeechBubble, ui.SpeechBubble);
});

test('effects SpeechBubble renders through the canonical markup', () => {
  const html = renderToStaticMarkup(React.createElement(EffectsBubble, { className: 'x' }, 'Hi'));
  assert.match(html, /class="mw-ui-speech-bubble [^"]*x"/u);
  assert.match(html, /data-variant="speech"/u);
  assert.match(html, /data-tail="bottom"/u);
});

test('deprecated manga components stay exported', () => {
  for (const name of ['MangaPanel', 'InkFrame', 'ComicPanel', 'MangaFrame']) {
    assert.ok(['function', 'object'].includes(typeof ui[name]) && ui[name] !== null, name);
  }
});

test('effects source documents the deprecations', async () => {
  const src = await readFile(new URL('../src/components/effects.tsx', import.meta.url), 'utf8');
  assert.equal((src.match(/@deprecated/gu) ?? []).length >= 3, true);
});
