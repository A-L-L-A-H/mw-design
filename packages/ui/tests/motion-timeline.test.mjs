import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  applyEasingPresetToKeyframes,
  buildEasingPreviewPathD,
  buildMotionTimelineSvgGeometry,
  DEFAULT_MOTION_TIMELINE_KEYFRAMES,
  evaluateMotionTimeline,
  filterEasingPresets,
  getEasingPresetById,
  MOTION_EASING_CATEGORIES,
  MOTION_EASING_PRESETS,
  MotionTimeline,
  normalizeKeyframes,
} from '../dist/motion/index.js';
import { MotionTimeline as ComponentMotionTimeline } from '../dist/components/motion-timeline.js';
import {
  MOTION_EASING_PRESETS as RootEasingPresets,
  MotionTimeline as RootMotionTimeline,
} from '../dist/index.js';

test('MotionTimeline and easing preset library are exported identically from root, motion, and component subpaths', () => {
  assert.equal(MotionTimeline, ComponentMotionTimeline);
  assert.equal(MotionTimeline, RootMotionTimeline);
  assert.equal(MOTION_EASING_PRESETS, RootEasingPresets);
  assert.ok(DEFAULT_MOTION_TIMELINE_KEYFRAMES.length >= 3);
  assert.equal(MOTION_EASING_PRESETS.length, 18);
  assert.ok(MOTION_EASING_CATEGORIES.length >= 5);
});

test('easing preset library filters categories, looks up metadata, and generates valid mini SVG paths', () => {
  assert.equal(filterEasingPresets('all').length, MOTION_EASING_PRESETS.length);
  const backPresets = filterEasingPresets('back');
  assert.ok(backPresets.some((p) => p.id === 'ease-in-out-back'));
  assert.ok(backPresets.every((p) => p.category === 'back'));

  const physicsPresets = filterEasingPresets('physics');
  assert.ok(physicsPresets.some((p) => p.id === 'elastic'));
  assert.ok(physicsPresets.some((p) => p.id === 'spring'));

  const elasticMeta = getEasingPresetById('elastic');
  assert.ok(elasticMeta);
  assert.equal(elasticMeta.label, 'Elastic');

  for (const preset of MOTION_EASING_PRESETS) {
    const pathD = buildEasingPreviewPathD(preset.id);
    assert.match(pathD, /^M\s[\d.-]+\s[\d.-]+(\sL\s[\d.-]+\s[\d.-]+)+$/u);
  }
});

test('applyEasingPresetToKeyframes updates all segments or a single targeted segment immutably', () => {
  const updatedAll = applyEasingPresetToKeyframes(
    DEFAULT_MOTION_TIMELINE_KEYFRAMES,
    'ease-in-out-back',
    'all'
  );
  assert.equal(updatedAll.length, DEFAULT_MOTION_TIMELINE_KEYFRAMES.length);
  for (let i = 0; i < updatedAll.length - 1; i += 1) {
    assert.equal(updatedAll[i].easing, 'ease-in-out-back');
  }
  assert.equal(DEFAULT_MOTION_TIMELINE_KEYFRAMES[0].easing, 'anticipation');

  const updatedOne = applyEasingPresetToKeyframes(
    DEFAULT_MOTION_TIMELINE_KEYFRAMES,
    'elastic',
    'segment',
    1
  );
  assert.equal(updatedOne[0].easing, DEFAULT_MOTION_TIMELINE_KEYFRAMES[0].easing);
  assert.equal(updatedOne[1].easing, 'elastic');
  assert.equal(updatedOne[2].easing, DEFAULT_MOTION_TIMELINE_KEYFRAMES[2].easing);
});

test('normalizeKeyframes sorts, clamps, deduplicates, and synthesizes missing endpoints', () => {
  const normalized = normalizeKeyframes([
    { id: 'mid-2', label: 'Late', at: 0.75, value: 0.9, easing: 'bounce' },
    { id: 'mid-1', label: 'Early', at: 0.25, value: 0.2, easing: 'overshoot' },
    { id: 'dup', label: 'Early Override', at: 0.25, value: 0.4, easing: 'elastic' },
  ]);

  assert.equal(normalized[0].at, 0);
  assert.equal(normalized[normalized.length - 1].at, 1);
  assert.equal(normalized.length, 4);
  assert.equal(normalized[1].id, 'dup');
  assert.equal(normalized[1].value, 0.4);
  assert.equal(normalized[1].easing, 'elastic');
});

test('evaluateMotionTimeline interpolates accurately across multi-segment easing curves', () => {
  const keyframes = [
    { id: 'a', label: 'Start', at: 0, value: 0, easing: 'linear' },
    { id: 'b', label: 'Peak', at: 0.5, value: 1, easing: 'overshoot' },
    { id: 'c', label: 'Settle', at: 1, value: 0.5, easing: 'ease-out' },
  ];

  const start = evaluateMotionTimeline(keyframes, 0);
  assert.equal(start.value, 0);
  assert.equal(start.segmentIndex, 0);
  assert.equal(start.easing, 'linear');

  const quarter = evaluateMotionTimeline(keyframes, 0.25);
  assert.ok(Math.abs(quarter.value - 0.5) < 0.001);
  assert.equal(quarter.segmentIndex, 0);

  const mid = evaluateMotionTimeline(keyframes, 0.5);
  assert.ok(Math.abs(mid.value - 1) < 0.001);
  assert.equal(mid.segmentIndex, 1);
  assert.equal(mid.easing, 'overshoot');
  assert.equal(mid.activeKeyframe.id, 'b');

  const seg2 = evaluateMotionTimeline(keyframes, 0.75);
  assert.equal(seg2.segmentIndex, 1);
  assert.equal(seg2.easing, 'overshoot');

  const end = evaluateMotionTimeline(keyframes, 1.5);
  assert.equal(end.progress, 1);
  assert.ok(Math.abs(end.value - 0.5) < 0.001);
});

test('buildMotionTimelineSvgGeometry generates valid SVG path commands, segments, and playhead coordinates', () => {
  const geom = buildMotionTimelineSvgGeometry(DEFAULT_MOTION_TIMELINE_KEYFRAMES, 0.5, {
    width: 640,
    height: 196,
    samplesPerSegment: 16,
  });

  assert.equal(geom.keyframeNodes.length, DEFAULT_MOTION_TIMELINE_KEYFRAMES.length);
  assert.equal(geom.segmentPaths.length, DEFAULT_MOTION_TIMELINE_KEYFRAMES.length - 1);
  assert.match(geom.fullPathD, /^M\s[\d.-]+\s[\d.-]+(\sL\s[\d.-]+\s[\d.-]+)+$/u);
  assert.match(geom.elapsedPathD, /^M\s[\d.-]+\s[\d.-]+(\sL\s[\d.-]+\s[\d.-]+)+$/u);
  assert.match(geom.areaPathD, /Z$/u);

  for (let i = 1; i < geom.keyframeNodes.length; i += 1) {
    assert.ok(geom.keyframeNodes[i].x > geom.keyframeNodes[i - 1].x);
  }
  assert.ok(geom.playhead.x >= geom.plotLeft && geom.playhead.x <= geom.plotRight);
  assert.ok(geom.playhead.y >= geom.plotTop && geom.playhead.y <= geom.plotBottom);
});

test('MotionTimeline renders accessible SVG curves, preset library, keyframe controls, and play/pause trigger via SSR', () => {
  const html = renderToStaticMarkup(
    React.createElement(MotionTimeline, {
      title: 'Boss Intro Sequence',
      durationMs: 1400,
      defaultProgress: 0.35,
      showPresetLibrary: true,
    })
  );

  assert.match(html, /data-slot="motion-timeline"/);
  assert.match(html, /data-slot="motion-timeline-preset-library"/);
  assert.match(html, /data-preset-id="ease-in-out-back"/);
  assert.match(html, /data-preset-id="elastic"/);
  assert.match(html, /Boss Intro Sequence/);
  assert.match(html, /<svg/);
  assert.match(html, /<path/);
  assert.match(html, /Play animation timeline/);
  assert.match(html, /Scrub animation timeline progress/);
  assert.match(html, /anticipation/);
});
