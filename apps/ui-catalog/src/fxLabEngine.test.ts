import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMERA_QUICK_PRESET_IDS,
  FX_COMBO_PRESETS,
  MAX_ACTIVE_PARTICLES,
  RUMBLE_SHAKE_PRESETS,
  buildFxSnippet,
  buildShakeWaveformPoints,
  computeFlashFramePhase,
  computeShakeFrame,
  filterRumbleShakePresets,
  generateParticleBurst,
  getRumbleShakePresetById,
  stepParticles,
} from './fxLabEngine';

test('computeShakeFrame decays cleanly to zero, respects axes, and supports whiplash/rumble/continuous', () => {
  const settled = computeShakeFrame(1, 'quake', 20, 3);
  assert.deepEqual(settled, { x: 0, y: 0, rotateDeg: 0 });

  const zeroIntensity = computeShakeFrame(0.2, 'quake', 0, 3);
  assert.deepEqual(zeroIntensity, { x: 0, y: 0, rotateDeg: 0 });

  const horizontal = computeShakeFrame(0.18, 'horizontal', 20, 1);
  assert.ok(Math.abs(horizontal.x) > Math.abs(horizontal.y), 'horizontal shake emphasizes X axis');

  const vertical = computeShakeFrame(0.18, 'vertical', 20, 1);
  assert.ok(Math.abs(vertical.y) > Math.abs(vertical.x), 'vertical shake emphasizes Y axis');

  const whiplash = computeShakeFrame(0.15, 'whiplash', 18, 2);
  assert.ok(Math.abs(whiplash.rotateDeg) > 0.5, 'whiplash applies noticeable rotational snap');

  const rumble = computeShakeFrame(0.3, 'rumble', 16, 2);
  assert.ok(Math.hypot(rumble.x, rumble.y) > 0, 'rumble produces non-zero displacement');

  const continuousLate = computeShakeFrame(4.2, 'tremor', 10, 2, { continuous: true });
  assert.ok(
    Math.hypot(continuousLate.x, continuousLate.y) > 0,
    'continuous rumble stays active past progress=1'
  );

  const early = computeShakeFrame(0.1, 'quake', 20, 2);
  const late = computeShakeFrame(0.85, 'quake', 20, 2);
  assert.ok(Math.hypot(early.x, early.y) > Math.hypot(late.x, late.y));
});

test('Rumble & Shake preset library filters cleanly and builds SVG waveform paths', () => {
  assert.equal(RUMBLE_SHAKE_PRESETS.length, 8);
  assert.equal(filterRumbleShakePresets('all').length, 8);
  assert.equal(filterRumbleShakePresets('impact').length, 3);
  assert.equal(filterRumbleShakePresets('sustained').length, 2);
  assert.equal(filterRumbleShakePresets('cinematic').length, 3);

  for (const quickId of CAMERA_QUICK_PRESET_IDS) {
    assert.ok(getRumbleShakePresetById(quickId), `quick preset ${quickId} exists`);
  }

  const preset = getRumbleShakePresetById('katana-whiplash');
  assert.ok(preset);
  const waveform = buildShakeWaveformPoints(preset.pattern, preset.intensityPx, preset.frequency);
  const pairs = waveform.split(' ');
  assert.equal(pairs.length, 29);
  assert.ok(pairs[0]?.startsWith('0.0,'));
});

test('computeFlashFramePhase alternates dark and light 24fps impact frames then clears', () => {
  const f0 = computeFlashFramePhase(10, 4, 42);
  assert.deepEqual(f0, { active: true, frameIndex: 0, polarity: 'dark' });

  const f1 = computeFlashFramePhase(50, 4, 42);
  assert.deepEqual(f1, { active: true, frameIndex: 1, polarity: 'light' });

  const f2 = computeFlashFramePhase(90, 4, 42);
  assert.deepEqual(f2, { active: true, frameIndex: 2, polarity: 'dark' });

  const done = computeFlashFramePhase(200, 4, 42);
  assert.deepEqual(done, { active: false, frameIndex: -1, polarity: 'none' });
});

test('generateParticleBurst is deterministic, bounded, and steps cleanly until expiry', () => {
  const burstA = generateParticleBurst({
    kind: 'sparks',
    count: 24,
    originX: 280,
    originY: 160,
    seed: 7,
  });
  const burstB = generateParticleBurst({
    kind: 'sparks',
    count: 24,
    originX: 280,
    originY: 160,
    seed: 7,
  });
  assert.equal(burstA.length, 24);
  assert.deepEqual(burstA, burstB);

  const clamped = generateParticleBurst({
    kind: 'sakura',
    count: 999,
    originX: 100,
    originY: 100,
    seed: 2,
  });
  assert.equal(clamped.length, 44);

  let current = burstA;
  const moved = stepParticles(current, 0.016, 1);
  assert.equal(moved.length, 24);
  assert.notEqual(moved[0]?.x, burstA[0]?.x);

  for (let i = 0; i < 60; i += 1) {
    current = stepParticles(current, 0.03, 1);
  }
  assert.equal(current.length, 0);

  const slowStep = stepParticles(burstA, 0.016, 0.25);
  assert.ok((slowStep[0]?.age ?? 1) < (moved[0]?.age ?? 0));

  const hugePool = [
    ...generateParticleBurst({ kind: 'stars', count: 44, originX: 100, originY: 100, seed: 1 }),
    ...generateParticleBurst({ kind: 'ink', count: 44, originX: 100, originY: 100, seed: 2 }),
  ];
  assert.ok(stepParticles(hugePool, 0.016, 1).length <= MAX_ACTIVE_PARTICLES);
});

test('FX combo presets and snippet builder reflect active configuration and shake preset', () => {
  assert.equal(FX_COMBO_PRESETS.length, 4);
  for (const preset of FX_COMBO_PRESETS) {
    assert.ok(preset.shakeIntensity > 0);
    assert.ok(preset.burstCount >= 12);
    assert.ok(preset.onomatopoeia.length > 0);
  }

  const snippet = buildFxSnippet({
    characterId: 'kuro-signal',
    shakePattern: 'whiplash',
    shakeIntensity: 16,
    shakeDurationMs: 340,
    shakePresetId: 'katana-whiplash',
    hitstopMs: 75,
    flashMode: 'impact-bw',
    flashFrames: 4,
    burstKind: 'sparks',
    burstCount: 28,
    reducedMotion: false,
  });
  assert.match(snippet, /shakeIntensity=\{16\}/);
  assert.match(snippet, /hitstopMs=\{75\}/);
  assert.match(snippet, /katana-whiplash/);
  assert.match(snippet, /characterId="kuro-signal"/);

  const reducedSnippet = buildFxSnippet({
    characterId: 'vesper-neon',
    shakePattern: 'horizontal',
    shakeIntensity: 16,
    hitstopMs: 80,
    flashMode: 'whiteout',
    flashFrames: 3,
    burstKind: 'sakura',
    burstCount: 20,
    reducedMotion: true,
  });
  assert.match(reducedSnippet, /shakeIntensity=\{0\}/);
  assert.match(reducedSnippet, /hitstopMs=\{0\}/);
});
