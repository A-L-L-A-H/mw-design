import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';
import {
  validateCan0011Text,
  validateCanonGuardMetadata,
  validateRocksoulCapModes,
} from './character-registry-schema.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const INK = '#0d0d0d';
const OBSIDIAN = '#141418';
const CHARCOAL = '#1d1e24';
const SLATE = '#2b2d38';
const GRAPHITE = '#23242b';
const PAPER = '#f3efe4';
const PAPER_WARM = '#e6e0d0';
const PAPER_SHADE = '#cfc7b4';
const CRIMSON = '#d1132a';
const CRIMSON_DEEP = '#9f1022';
const CYAN = '#00b8f0';
const CYAN_DEEP = '#007fa8';
const YELLOW = '#ffe031';
const YELLOW_DEEP = '#d9b514';
const MERCY_GREEN = '#16a34a';
const MERCY_GREEN_BRIGHT = '#22c55e';
const MERCY_GREEN_DEEP = '#0f5132';

const BUDGET_BYTES = Object.freeze({
  'character-sprite': 160 * 1024,
  'animation-frame': 96 * 1024,
  'animation-sheet': 280 * 1024,
  'animation-clip': 24 * 1024,
});

export const ROCKSOUL_CANON_GUARD_ENTRY = Object.freeze({
  characterId: 'rocksoul-witness',
  role: 'primary-resonance-witness',
  depictionPolicy: 'stylized-faceless',
  canonLevel: 'lore',
  autoMergeForbidden: true,
  prohibitedVariants: [
    'recognizable-face',
    'photorealistic-face',
    'sacred-figure',
    'real-person-likeness',
  ],
  capModes: [
    {
      id: 'green-mercy',
      label: 'Green Mercy Cap',
      capColor: 'green',
      paletteTokens: ['ink-black', 'paper-cream', 'mercy-green', 'signal-yellow', 'signal-cyan'],
      visualCue: 'Low-pulled emerald mercy baseball cap over shadowed faceless witness brow',
    },
    {
      id: 'black-resolve',
      label: 'Black Resolve Cap',
      capColor: 'black',
      paletteTokens: ['ink-black', 'paper-cream', 'rocksoul-crimson', 'signal-cyan', 'signal-yellow'],
      visualCue: 'Matte obsidian resolve cap with crimson chalk under-brim and cyan rim-light',
    },
  ],
  canonGuard: {
    canonLevel: 'lore',
    autoMergeForbidden: true,
    rules: ['CAN-0004', 'CAN-0005', 'CAN-0011'],
    visualRenderingMode: 'faceless-stylized',
    facelessOrStylizedOnly: true,
    photorealismForbidden: true,
    realPersonLikenessForbidden: true,
    sacredDepictionForbidden: true,
    prohibitedVariants: [
      'sacred-figure',
      'real-person-likeness',
      'photorealistic-face',
      'recognizable-face',
    ],
    rationale:
      'Faceless low-brim street-zine witness depiction under CAN-0011; strictly fictional CAN-0004 lore catalyst.',
  },
});

const CAP_MODES = Object.freeze({
  'green-mercy': {
    id: 'green-mercy',
    label: 'Green Mercy Cap',
    capMain: MERCY_GREEN,
    capBright: MERCY_GREEN_BRIGHT,
    capShade: MERCY_GREEN_DEEP,
    underBrim: YELLOW_DEEP,
    accentPrimary: MERCY_GREEN_BRIGHT,
    accentSecondary: CYAN,
    accentTertiary: YELLOW,
    tagText: 'MERCY // XII-01',
    pinColor: YELLOW,
    auraColor: CYAN,
    armbandColor: CRIMSON,
  },
  'black-resolve': {
    id: 'black-resolve',
    label: 'Black Resolve Cap',
    capMain: OBSIDIAN,
    capBright: SLATE,
    capShade: INK,
    underBrim: CRIMSON,
    accentPrimary: CRIMSON,
    accentSecondary: CYAN,
    accentTertiary: YELLOW,
    tagText: 'RESOLVE // XII-01',
    pinColor: CRIMSON,
    auraColor: CRIMSON,
    armbandColor: CRIMSON,
  },
});

const PORTRAIT_VARIANTS = Object.freeze([
  {
    slug: 'portrait',
    titleSuffix: 'idle witness portrait',
    bob: 0,
    tilt: 0,
    brimTilt: 0,
    headTurn: 0,
    handPose: 'collar',
    energyLevel: 1,
  },
  {
    slug: 'signal-lock',
    titleSuffix: 'signal lock resonance portrait',
    bob: -6,
    tilt: -2.2,
    brimTilt: -3,
    headTurn: -8,
    handPose: 'brim-touch',
    energyLevel: 2,
  },
  {
    slug: 'overdrive',
    titleSuffix: 'dual-cap resonance overdrive cut-in',
    bob: -10,
    tilt: 2.8,
    brimTilt: -5,
    headTurn: 10,
    handPose: 'surge',
    energyLevel: 3,
  },
]);

const FULLBODY_POSES = Object.freeze([
  {
    slug: 'pose-standing',
    titleSuffix: 'full-body standing sentinel pose',
    stride: 0,
    bob: 0,
    tilt: 0,
    armMode: 'pocket-guard',
  },
  {
    slug: 'pose-stride',
    titleSuffix: 'full-body kinetic street stride pose',
    stride: 1,
    bob: -8,
    tilt: -1.8,
    armMode: 'relay-walk',
  },
]);

const ANIMATION_CLIPS = Object.freeze([
  {
    id: 'rocksoul-green-mercy-idle',
    capMode: 'green-mercy',
    style: 'cel',
    durationMs: 160,
    direction: 'forward',
    description: 'Four-frame stepped cel-ink idle & signal pulse animation for ROCKSOUL in Green Mercy Cap mode.',
    frames: [
      { bob: 0, tilt: 0, brimTilt: 0, headTurn: 0, handPose: 'collar', energyLevel: 1, pulsePhase: 0 },
      { bob: -5, tilt: -1.4, brimTilt: -2, headTurn: -4, handPose: 'collar', energyLevel: 2, pulsePhase: 1 },
      { bob: -8, tilt: 0.8, brimTilt: -3, headTurn: 4, handPose: 'brim-touch', energyLevel: 2, pulsePhase: 2 },
      { bob: -3, tilt: 1.5, brimTilt: -1, headTurn: 2, handPose: 'collar', energyLevel: 1, pulsePhase: 3 },
    ],
  },
  {
    id: 'rocksoul-green-mercy-sketch',
    capMode: 'green-mercy',
    style: 'rough-pencil',
    durationMs: 160,
    direction: 'forward',
    description: 'Four-frame rough-pencil sketchbook animation for ROCKSOUL in Green Mercy Cap mode.',
    frames: [
      { bob: 0, tilt: 0, brimTilt: 0, headTurn: 0, handPose: 'collar', energyLevel: 1, pulsePhase: 0 },
      { bob: -6, tilt: -1.8, brimTilt: -2.5, headTurn: -6, handPose: 'brim-touch', energyLevel: 2, pulsePhase: 1 },
      { bob: -9, tilt: 1.2, brimTilt: -4, headTurn: 5, handPose: 'brim-touch', energyLevel: 3, pulsePhase: 2 },
      { bob: -4, tilt: 0.6, brimTilt: -1.5, headTurn: 1, handPose: 'collar', energyLevel: 1, pulsePhase: 3 },
    ],
  },
  {
    id: 'rocksoul-black-resolve-idle',
    capMode: 'black-resolve',
    style: 'cel',
    durationMs: 150,
    direction: 'forward',
    description: 'Four-frame stepped cel-ink resolve stance animation for ROCKSOUL in Black Resolve Cap mode.',
    frames: [
      { bob: 0, tilt: 0, brimTilt: -1, headTurn: 0, handPose: 'collar', energyLevel: 1, pulsePhase: 0 },
      { bob: -6, tilt: 1.8, brimTilt: -3, headTurn: 6, handPose: 'brim-touch', energyLevel: 2, pulsePhase: 1 },
      { bob: -10, tilt: -2.2, brimTilt: -5, headTurn: -6, handPose: 'surge', energyLevel: 3, pulsePhase: 2 },
      { bob: -4, tilt: -0.8, brimTilt: -2, headTurn: -2, handPose: 'collar', energyLevel: 2, pulsePhase: 3 },
    ],
  },
  {
    id: 'rocksoul-black-resolve-sketch',
    capMode: 'black-resolve',
    style: 'rough-pencil',
    durationMs: 150,
    direction: 'forward',
    description: 'Four-frame rough-pencil charcoal animation for ROCKSOUL in Black Resolve Cap mode.',
    frames: [
      { bob: 0, tilt: 0, brimTilt: -1, headTurn: 0, handPose: 'collar', energyLevel: 1, pulsePhase: 0 },
      { bob: -5, tilt: 2.0, brimTilt: -3, headTurn: 7, handPose: 'brim-touch', energyLevel: 2, pulsePhase: 1 },
      { bob: -11, tilt: -2.5, brimTilt: -5, headTurn: -8, handPose: 'surge', energyLevel: 3, pulsePhase: 2 },
      { bob: -3, tilt: 0.9, brimTilt: -2, headTurn: 3, handPose: 'collar', energyLevel: 2, pulsePhase: 3 },
    ],
  },
  {
    id: 'rocksoul-resonance-overdrive',
    capMode: 'dual-shift',
    style: 'cel',
    durationMs: 140,
    direction: 'forward',
    description: 'Four-frame dual-cap resonance shift (Green Mercy to Black Resolve overdrive) with 2x2 atlas.',
    frames: [
      { capOverride: 'green-mercy', bob: 0, tilt: -1.5, brimTilt: -2, headTurn: -5, handPose: 'brim-touch', energyLevel: 2, pulsePhase: 0 },
      { capOverride: 'green-mercy', bob: -8, tilt: 2.2, brimTilt: -4, headTurn: 6, handPose: 'surge', energyLevel: 3, pulsePhase: 1 },
      { capOverride: 'black-resolve', bob: -12, tilt: -2.8, brimTilt: -6, headTurn: -8, handPose: 'surge', energyLevel: 3, pulsePhase: 2 },
      { capOverride: 'black-resolve', bob: -4, tilt: 1.2, brimTilt: -3, headTurn: 4, handPose: 'brim-touch', energyLevel: 2, pulsePhase: 3 },
    ],
  },
]);

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n) => Math.round(n * 10) / 10;

function starPath(cx, cy, outerR, innerR, points = 4) {
  const coords = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    coords.push(
      `${i === 0 ? 'M' : 'L'} ${f1(cx + Math.cos(angle) * radius)} ${f1(cy + Math.sin(angle) * radius)}`
    );
  }
  return `${coords.join(' ')} Z`;
}

function halftoneBlock(cols, rows, startX, startY, step, radius, color, opacity = 0.28) {
  const dots = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = f1(startX + c * step + (r % 2 === 1 ? step * 0.5 : 0));
      const cy = f1(startY + r * step);
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}"/>`);
    }
  }
  return dots.join('');
}

function halftoneBlockSeeded(cols, rows, startX, startY, step, radius, color, opacity, seed) {
  const rng = createRng(seed);
  const dots = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const jitterX = (rng() - 0.5) * 2;
      const jitterY = (rng() - 0.5) * 2;
      const cx = f1(startX + c * step + (r % 2 === 1 ? step * 0.5 : 0) + jitterX);
      const cy = f1(startY + r * step + jitterY);
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}"/>`);
    }
  }
  return dots.join('');
}

function pencilHatchRegion(x, y, w, h, step, angleDeg, color, opacity, seed) {
  const rng = createRng(seed);
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const lines = [];
  const span = Math.hypot(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (let off = -span * 0.55; off <= span * 0.55; off += step) {
    const px = cx - dy * off;
    const py = cy + dx * off;
    const len = span * 0.48;
    const x1 = Math.max(x, Math.min(x + w, px - dx * len));
    const y1 = Math.max(y, Math.min(y + h, py - dy * len));
    const x2 = Math.max(x, Math.min(x + w, px + dx * len));
    const y2 = Math.max(y, Math.min(y + h, py + dy * len));
    if (Math.hypot(x2 - x1, y2 - y1) < 6) continue;
    const mx = (x1 + x2) / 2 + (rng() - 0.5) * 3.2;
    const my = (y1 + y2) / 2 + (rng() - 0.5) * 3.2;
    const sw = f1(1.1 + rng() * 1.1);
    lines.push(
      `<path d="M ${f1(x1)} ${f1(y1)} Q ${f1(mx)} ${f1(my)} ${f1(x2)} ${f1(y2)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${opacity}" stroke-linecap="round"/>`
    );
  }
  return lines.join('');
}

function buildRoughSketchOverlay(width, height, modeConfig, seed) {
  const rng = createRng(seed);
  const strokes = [];
  // Construction crosshairs and perspective guide arcs kept strictly inside character core [90..width-90, 70..height-70]
  const cx = width / 2;
  const cy = height / 2;
  strokes.push(
    `<circle cx="${cx}" cy="${f1(cy - 34)}" r="158" fill="none" stroke="${GRAPHITE}" stroke-width="1.6" stroke-opacity="0.45" stroke-dasharray="10 6 4 6"/>`,
    `<circle cx="${cx}" cy="${f1(cy - 34)}" r="164" fill="none" stroke="${CRIMSON}" stroke-width="1.3" stroke-opacity="0.4" stroke-dasharray="18 8"/>`,
    `<path d="M ${cx - 170} ${f1(cy - 34)} H ${cx + 170} M ${cx} ${84} V ${height - 76}" stroke="${CYAN_DEEP}" stroke-width="1.3" stroke-opacity="0.38" stroke-dasharray="7 5"/>`
  );
  for (let i = 0; i < 14; i += 1) {
    const x1 = 104 + rng() * (width - 208);
    const y1 = 96 + rng() * (height - 192);
    const x2 = x1 + (rng() - 0.5) * 68;
    const y2 = y1 - 14 - rng() * 44;
    const col = i % 3 === 0 ? CRIMSON : i % 3 === 1 ? GRAPHITE : CYAN_DEEP;
    strokes.push(
      `<path d="M ${f1(x1)} ${f1(y1)} L ${f1(x2)} ${f1(y2)}" stroke="${col}" stroke-width="${f1(1.3 + rng() * 1.1)}" stroke-opacity="0.58" stroke-linecap="round"/>`
    );
  }
  return strokes.join('');
}

/**
 * Renders the 512x512 portrait / animation frame SVG for ROCKSOUL.
 * Center (256, 256) is guaranteed 100% opaque (alpha=255), and all 4 corners
 * stay 100% transparent (alpha=0).
 */
function buildRocksoulPortraitSvg({
  capModeId,
  style,
  bob = 0,
  tilt = 0,
  brimTilt = 0,
  headTurn = 0,
  handPose = 'collar',
  energyLevel = 1,
  pulsePhase = 0,
  seed = 101,
}) {
  const mode = CAP_MODES[capModeId];
  const isSketch = style === 'rough-pencil';
  const yOff = f1(bob);
  const hx = f1(headTurn);

  const jacketMain = isSketch ? PAPER : CHARCOAL;
  const jacketShade = isSketch ? PAPER_WARM : OBSIDIAN;
  const jacketDeep = isSketch ? PAPER_SHADE : INK;
  const capFill = isSketch ? PAPER : mode.capMain;
  const capShadeFill = isSketch ? PAPER_WARM : mode.capShade;
  const capHighlightFill = isSketch ? PAPER : mode.capBright;
  const lineMain = isSketch ? GRAPHITE : INK;
  const outerRim = isSketch ? PAPER : CYAN;

  const waveShift = (pulsePhase % 4) * 6;
  const auraRadius = 176 + energyLevel * 8 + (pulsePhase % 2) * 5;

  const sketchHatchTorso = isSketch
    ? pencilHatchRegion(130, 250, 252, 210, 9, 38, GRAPHITE, 0.55, seed + 11) +
      pencilHatchRegion(140, 260, 120, 195, 11, -42, CRIMSON_DEEP, 0.36, seed + 23)
    : '';

  const sketchHatchCap = isSketch
    ? pencilHatchRegion(148, 86, 216, 110, 8, 32, mode.capMain, 0.62, seed + 37) +
      pencilHatchRegion(152, 102, 190, 84, 12, -35, GRAPHITE, 0.48, seed + 49)
    : '';

  const handLayer =
    handPose === 'brim-touch'
      ? `
        <g transform="translate(${f1(hx * 0.4)} ${yOff})">
          <path d="M 102 426 L 128 242 L 182 192 L 204 218 L 166 266 L 154 446 Z" fill="${jacketShade}" stroke="${lineMain}" stroke-width="7" stroke-linejoin="round"/>
          <path d="M 164 186 L 216 172 L 224 202 L 176 218 Z" fill="${INK}" stroke="${PAPER}" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M 180 180 L 214 172 M 182 192 L 218 184" stroke="${mode.accentSecondary}" stroke-width="3.5" stroke-linecap="round"/>
        </g>
      `
      : handPose === 'surge'
        ? `
          <g transform="translate(${f1(hx * 0.5)} ${yOff})">
            <path d="M 88 398 L 116 264 L 168 246 L 182 286 L 146 312 L 138 446 Z" fill="${jacketShade}" stroke="${lineMain}" stroke-width="7" stroke-linejoin="round"/>
            <circle cx="152" cy="242" r="26" fill="${INK}" stroke="${mode.accentPrimary}" stroke-width="5"/>
            <path d="${starPath(152, 242, 22, 7, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>
          </g>
        `
        : `
          <g transform="translate(0 ${yOff})">
            <path d="M 118 452 L 144 332 L 194 316 L 206 352 L 174 456 Z" fill="${jacketShade}" stroke="${lineMain}" stroke-width="6.5" stroke-linejoin="round"/>
            <rect x="158" y="310" width="44" height="32" rx="7" fill="${INK}" stroke="${PAPER}" stroke-width="3"/>
          </g>
        `;

  const energyBursts =
    energyLevel >= 2
      ? `
        <path d="${starPath(94, 134 - waveShift, 22 + energyLevel * 2, 7, 4)}" fill="${mode.accentTertiary}" stroke="${INK}" stroke-width="3.5"/>
        <path d="${starPath(422, 122 + waveShift, 24 + energyLevel * 2, 8, 4)}" fill="${mode.accentPrimary}" stroke="${INK}" stroke-width="3.5"/>
        <path d="M 68 228 L 108 240 M 62 268 L 102 264 M 412 222 L 452 208 M 416 262 L 456 258" stroke="${mode.accentSecondary}" stroke-width="5" stroke-linecap="round"/>
      `
      : `
        <path d="${starPath(414, 132, 18, 6, 4)}" fill="${mode.accentTertiary}" stroke="${INK}" stroke-width="3.5"/>
        <circle cx="102" cy="156" r="8" fill="${mode.accentSecondary}" stroke="${INK}" stroke-width="3"/>
      `;

  const overdriveArcs =
    energyLevel >= 3
      ? `
        <path d="M 74 176 L 114 198 L 96 214 L 136 238" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 438 168 L 398 194 L 418 212 L 378 238" fill="none" stroke="${CYAN}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      `
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <!-- Dual-surface contrast halo & street-zine backing disc (interior opaque, corners alpha=0) -->
    <g transform="translate(0 ${yOff}) rotate(${tilt} 256 268)">
      <circle cx="256" cy="246" r="${auraRadius}" fill="${INK}" stroke="${outerRim}" stroke-width="6"/>
      <circle cx="256" cy="246" r="${auraRadius - 12}" fill="${isSketch ? PAPER_WARM : OBSIDIAN}" stroke="${mode.accentPrimary}" stroke-width="3.5" stroke-dasharray="${isSketch ? '14 6 5 6' : '24 8'}"/>
      ${isSketch ? halftoneBlock(11, 7, 132, 126, 24, 3.2, mode.auraColor, 0.25) : halftoneBlockSeeded(11, 7, 132, 126, 24, 3.2, mode.auraColor, 0.32, seed)}

      <!-- Street-zine callout stamp bar behind shoulders -->
      <g transform="rotate(-4 256 196)">
        <rect x="82" y="176" width="348" height="36" rx="6" fill="${mode.accentPrimary}" stroke="${INK}" stroke-width="4.5"/>
        <path d="M 94 186 H 416 M 94 202 H 416" stroke="${INK}" stroke-width="2" stroke-opacity="0.35"/>
      </g>

      <!-- High-collar Witness Parka & Torso (Strictly Opaque over (256, 256)) -->
      <path d="M 92 472 C 96 322 146 254 256 254 C 366 254 416 322 420 472 Z" fill="${PAPER}" stroke="${PAPER}" stroke-width="12" stroke-linejoin="round"/>
      <path d="M 92 472 C 96 322 146 254 256 254 C 366 254 416 322 420 472 Z" fill="${jacketMain}" stroke="${lineMain}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 92 472 C 96 336 142 264 236 256 L 228 472 Z" fill="${jacketShade}"/>
      ${sketchHatchTorso}

      <!-- Crimson ROCKSOUL Armband & Cassette Telemetry Strap -->
      <path d="M 344 334 L 408 352 L 414 396 L 340 378 Z" fill="${mode.armbandColor}" stroke="${lineMain}" stroke-width="5.5" stroke-linejoin="round"/>
      <path d="M 352 354 L 402 368 M 350 368 L 398 380" stroke="${YELLOW}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M 176 266 L 324 468" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
      <path d="M 176 266 L 324 468" stroke="${mode.accentSecondary}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 10"/>

      <!-- Chest Resonance Receiver Unit -->
      <rect x="218" y="334" width="84" height="60" rx="8" fill="${INK}" stroke="${PAPER}" stroke-width="4"/>
      <rect x="228" y="344" width="64" height="22" rx="4" fill="${OBSIDIAN}" stroke="${mode.accentSecondary}" stroke-width="2.5"/>
      <path d="M 234 355 L 246 355 L 252 347 L 260 363 L 268 350 L 274 355 L 286 355" fill="none" stroke="${YELLOW}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="242" cy="380" r="5.5" fill="${mode.accentPrimary}"/>
      <circle cx="260" cy="380" r="5.5" fill="${YELLOW}"/>
      <circle cx="278" cy="380" r="5.5" fill="${CYAN}"/>

      <!-- High Witness Utility Collar & Hood Cowl (Covers Center (256, 256)) -->
      <path d="M 152 292 L 174 218 Q 256 244 338 218 L 360 292 Q 256 332 152 292 Z" fill="${jacketDeep}" stroke="${lineMain}" stroke-width="7.5" stroke-linejoin="round"/>
      <path d="M 168 278 Q 256 310 344 278" fill="none" stroke="${mode.accentPrimary}" stroke-width="5" stroke-linecap="round"/>
      <line x1="256" y1="246" x2="256" y2="470" stroke="${lineMain}" stroke-width="6"/>

      <!-- Head & Faceless Shadowed Witness Void (CAN-0004 / CAN-0011 Aniconic Faceless Design) -->
      <g transform="translate(${hx} 0) rotate(${brimTilt} 256 178)">
        <!-- Outer Hood / Side Acoustic Pods -->
        <rect x="134" y="156" width="24" height="54" rx="10" fill="${INK}" stroke="${mode.accentSecondary}" stroke-width="4"/>
        <rect x="354" y="156" width="24" height="54" rx="10" fill="${INK}" stroke="${mode.accentSecondary}" stroke-width="4"/>

        <!-- Faceless Shadowed Head Silhouette (Strictly Opaque #0d0d0d Core) -->
        <path d="M 164 156 C 164 102 348 102 348 156 L 340 236 C 314 268 198 268 172 236 Z" fill="${INK}" stroke="${lineMain}" stroke-width="7" stroke-linejoin="round"/>
        <!-- Subtle Stylised Chin/Collar Shadow Contour & Glowing Resonance Slit (No Human Facial Features) -->
        <path d="M 184 198 Q 256 218 328 198" fill="none" stroke="${mode.accentSecondary}" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M 214 212 Q 256 224 298 212" fill="none" stroke="${mode.accentPrimary}" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="${256 + (pulsePhase - 1.5) * 8}" cy="204" r="5" fill="${YELLOW}"/>

        <!-- Baseball Cap Crown Dome (Green Mercy or Black Resolve) -->
        <path d="M 152 158 C 150 76 362 76 360 158 Z" fill="${capFill}" stroke="${lineMain}" stroke-width="8" stroke-linejoin="round"/>
        <path d="M 152 158 C 154 90 232 82 256 82 L 244 158 Z" fill="${capShadeFill}"/>
        <path d="M 258 92 C 304 94 342 114 348 148" fill="none" stroke="${capHighlightFill}" stroke-width="8" stroke-linecap="round"/>
        ${sketchHatchCap}

        <!-- Cap Top Button & Panel Seam -->
        <path d="M 256 80 V 154 M 198 94 Q 214 124 210 154 M 314 94 Q 298 124 302 154" fill="none" stroke="${lineMain}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="256" cy="78" rx="12" ry="6" fill="${mode.pinColor}" stroke="${lineMain}" stroke-width="4"/>

        <!-- MoonWitness Crown Enamel Badge on Cap Front -->
        <g transform="translate(256 124)">
          <rect x="-34" y="-18" width="68" height="32" rx="6" fill="${INK}" stroke="${mode.pinColor}" stroke-width="3.5"/>
          <polygon points="-20,8 -16,-8 -6,1 0,-11 6,1 16,-8 20,8" fill="${YELLOW}" stroke="${INK}" stroke-width="2"/>
        </g>

        <!-- Low-Pulled Cap Visor Brim & Under-Brim Chalk Edge -->
        <path d="M 134 156 Q 256 130 378 156 Q 394 184 358 194 Q 256 168 154 194 Q 118 184 134 156 Z" fill="${mode.underBrim}" stroke="${lineMain}" stroke-width="7.5" stroke-linejoin="round"/>
        <path d="M 138 154 Q 256 126 374 154 Q 368 176 348 180 Q 256 154 164 180 Q 144 176 138 154 Z" fill="${capFill}" stroke="${lineMain}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M 158 160 Q 256 138 354 160" fill="none" stroke="${mode.accentTertiary}" stroke-width="3.5" stroke-linecap="round"/>
      </g>

      ${handLayer}
      ${energyBursts}
      ${overdriveArcs}
      ${isSketch ? buildRoughSketchOverlay(512, 512, mode, seed) : ''}
    </g>
  </svg>`;
}

/**
 * Renders the 512x768 full-body standing/stride SVG for ROCKSOUL.
 * Center (256, 384) is guaranteed 100% opaque (alpha=255), and all 4 corners
 * stay 100% transparent (alpha=0).
 */
function buildRocksoulFullbodySvg({
  capModeId,
  style,
  stride = 0,
  bob = 0,
  tilt = 0,
  seed = 303,
}) {
  const mode = CAP_MODES[capModeId];
  const isSketch = style === 'rough-pencil';
  const jacketMain = isSketch ? PAPER : CHARCOAL;
  const jacketShade = isSketch ? PAPER_WARM : OBSIDIAN;
  const pantFill = isSketch ? PAPER_WARM : OBSIDIAN;
  const capFill = isSketch ? PAPER : mode.capMain;
  const lineMain = isSketch ? GRAPHITE : INK;
  const outerRim = isSketch ? PAPER : CYAN;

  const leftLegX = stride ? 192 : 210;
  const rightLegX = stride ? 318 : 302;
  const leftFootY = stride ? 706 : 714;
  const rightFootY = stride ? 722 : 714;

  const hatchCoat = isSketch
    ? pencilHatchRegion(146, 236, 220, 270, 9, 40, GRAPHITE, 0.55, seed + 17) +
      pencilHatchRegion(168, 490, 176, 180, 10, -38, GRAPHITE, 0.5, seed + 29) +
      pencilHatchRegion(152, 82, 206, 92, 8, 30, mode.capMain, 0.62, seed + 41)
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 768" width="512" height="768">
    <g transform="translate(0 ${f1(bob)}) rotate(${tilt} 256 384)">
      <!-- Mid-body zine aura & ground shadow -->
      <ellipse cx="256" cy="728" rx="146" ry="22" fill="${INK}" stroke="${mode.accentSecondary}" stroke-width="3"/>
      <circle cx="256" cy="356" r="196" fill="${INK}" stroke="${outerRim}" stroke-width="6"/>
      <circle cx="256" cy="356" r="184" fill="${isSketch ? PAPER_WARM : OBSIDIAN}" stroke="${mode.accentPrimary}" stroke-width="3.5" stroke-dasharray="18 8"/>
      ${isSketch ? halftoneBlock(11, 10, 134, 210, 24, 3.2, mode.auraColor, 0.3) : halftoneBlockSeeded(11, 10, 134, 210, 24, 3.2, mode.auraColor, 0.3, seed)}

      <!-- Legs & Heavy Street Boots -->
      <path d="M 192 486 L 252 486 L ${leftLegX + 28} 676 L ${leftLegX - 30} 676 Z" fill="${pantFill}" stroke="${lineMain}" stroke-width="7.5" stroke-linejoin="round"/>
      <path d="M 260 486 L 320 486 L ${rightLegX + 30} 676 L ${rightLegX - 28} 676 Z" fill="${pantFill}" stroke="${lineMain}" stroke-width="7.5" stroke-linejoin="round"/>
      <path d="M ${leftLegX - 38} 668 L ${leftLegX + 34} 668 L ${leftLegX + 42} ${leftFootY} L ${leftLegX - 42} ${leftFootY} Z" fill="${INK}" stroke="${lineMain}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M ${rightLegX - 34} 668 L ${rightLegX + 38} 668 L ${rightLegX + 44} ${rightFootY} L ${rightLegX - 38} ${rightFootY} Z" fill="${INK}" stroke="${lineMain}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M ${leftLegX - 38} ${leftFootY - 6} H ${leftLegX + 38}" stroke="${YELLOW}" stroke-width="6" stroke-linecap="round"/>
      <path d="M ${rightLegX - 34} ${rightFootY - 6} H ${rightLegX + 40}" stroke="${mode.accentPrimary}" stroke-width="6" stroke-linecap="round"/>

      <!-- Full Witness Trench Parka (Strictly Opaque across center (256, 384)) -->
      <path d="M 122 518 L 146 232 Q 256 204 366 232 L 390 518 Q 256 544 122 518 Z" fill="${PAPER}" stroke="${PAPER}" stroke-width="10" stroke-linejoin="round"/>
      <path d="M 122 518 L 146 232 Q 256 204 366 232 L 390 518 Q 256 544 122 518 Z" fill="${jacketMain}" stroke="${lineMain}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 122 518 L 146 232 L 248 220 L 240 528 Z" fill="${jacketShade}"/>
      ${hatchCoat}

      <!-- Arms & Crimson Chalk Armband -->
      <path d="M 144 244 L 96 382 L 136 456 L 172 434 L 148 368 L 172 268 Z" fill="${jacketShade}" stroke="${lineMain}" stroke-width="7.5" stroke-linejoin="round"/>
      <path d="M 368 244 L 416 376 L 378 456 L 342 434 L 364 364 L 340 268 Z" fill="${jacketMain}" stroke="${lineMain}" stroke-width="7.5" stroke-linejoin="round"/>
      <path d="M 362 312 L 406 326 L 412 362 L 360 348 Z" fill="${mode.armbandColor}" stroke="${lineMain}" stroke-width="5"/>

      <!-- Center Seam, Strap & Telemetry Box (Covers (256, 384)) -->
      <line x1="256" y1="226" x2="256" y2="528" stroke="${lineMain}" stroke-width="6.5"/>
      <path d="M 184 236 L 332 486" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
      <path d="M 184 236 L 332 486" stroke="${mode.accentSecondary}" stroke-width="4.5" stroke-dasharray="14 9" stroke-linecap="round"/>
      <rect x="214" y="346" width="84" height="72" rx="8" fill="${INK}" stroke="${PAPER}" stroke-width="4"/>
      <path d="M 226 372 L 242 372 L 250 358 L 262 386 L 270 366 L 286 372" fill="none" stroke="${YELLOW}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="238" cy="400" r="5" fill="${mode.accentPrimary}"/>
      <circle cx="256" cy="400" r="5" fill="${YELLOW}"/>
      <circle cx="274" cy="400" r="5" fill="${CYAN}"/>

      <!-- Faceless Hooded Head & Low-Pulled Cap -->
      <path d="M 164 238 L 182 178 Q 256 204 330 178 L 348 238 Q 256 266 164 238 Z" fill="${INK}" stroke="${lineMain}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M 178 134 C 178 92 334 92 334 134 L 328 202 C 304 226 208 226 184 202 Z" fill="${INK}" stroke="${lineMain}" stroke-width="7"/>
      <path d="M 198 172 Q 256 188 314 172" fill="none" stroke="${mode.accentSecondary}" stroke-width="5" stroke-linecap="round"/>

      <!-- Cap Dome & Visor -->
      <path d="M 168 138 C 166 72 346 72 344 138 Z" fill="${capFill}" stroke="${lineMain}" stroke-width="7.5"/>
      <rect x="228" y="96" width="56" height="26" rx="5" fill="${INK}" stroke="${mode.pinColor}" stroke-width="3"/>
      <polygon points="240,117 244,104 251,111 256,101 261,111 268,104 272,117" fill="${YELLOW}"/>
      <path d="M 150 136 Q 256 114 362 136 Q 374 158 344 166 Q 256 144 168 166 Q 138 158 150 136 Z" fill="${mode.underBrim}" stroke="${lineMain}" stroke-width="6.5"/>
      <path d="M 154 134 Q 256 110 358 134 Q 350 152 334 156 Q 256 134 178 156 Q 162 152 154 134 Z" fill="${capFill}" stroke="${lineMain}" stroke-width="5.5"/>

      <path d="${starPath(106, 174, 20, 7, 4)}" fill="${mode.accentTertiary}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(408, 162, 22, 7, 4)}" fill="${mode.accentPrimary}" stroke="${INK}" stroke-width="3.5"/>
      ${isSketch ? buildRoughSketchOverlay(512, 768, mode, seed) : ''}
    </g>
  </svg>`;
}

async function renderPngAndWebp(svgString, width, height) {
  const svgBuf = Buffer.from(svgString, 'utf8');
  const pngBuf = await sharp(svgBuf)
    .resize(width, height)
    .ensureAlpha()
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toBuffer();
  const webpBuf = await sharp(svgBuf)
    .resize(width, height)
    .ensureAlpha()
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toBuffer();
  return { pngBuf, webpBuf };
}

async function assertAlphaCutoutFile(fullPath, expectedWidth, expectedHeight, budgetBytes) {
  assert.ok(existsSync(fullPath), `Missing expected asset file: ${fullPath}`);
  const fileStat = await stat(fullPath);
  assert.ok(fileStat.size > 0, `Empty asset file: ${fullPath}`);
  assert.ok(
    fileStat.size <= budgetBytes,
    `${fullPath} size ${fileStat.size} exceeds budget ${budgetBytes}`
  );

  const fileBytes = await readFile(fullPath);
  const sha256 = createHash('sha256').update(fileBytes).digest('hex');

  const { data, info } = await sharp(fileBytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(info.width, expectedWidth, `${fullPath} width must be ${expectedWidth}`);
  assert.equal(info.height, expectedHeight, `${fullPath} height must be ${expectedHeight}`);

  const corners = [
    0,
    (info.width - 1) * 4,
    (info.height - 1) * info.width * 4,
    ((info.height - 1) * info.width + (info.width - 1)) * 4,
  ];
  for (const offset of corners) {
    assert.equal(data[offset + 3], 0, `${fullPath} exterior corner alpha must be 0`);
  }

  const cx = Math.floor(info.width / 2);
  const cy = Math.floor(info.height / 2);
  const centerOffset = (cy * info.width + cx) * 4;
  assert.equal(
    data[centerOffset + 3],
    255,
    `${fullPath} center pixel (${cx},${cy}) alpha must be 255`
  );

  return { size: fileStat.size, sha256 };
}

async function assertAtlasSheetFile(fullPath, budgetBytes) {
  assert.ok(existsSync(fullPath), `Missing expected atlas sheet: ${fullPath}`);
  const fileStat = await stat(fullPath);
  assert.ok(fileStat.size > 0 && fileStat.size <= budgetBytes, `${fullPath} exceeds budget`);
  const fileBytes = await readFile(fullPath);
  const sha256 = createHash('sha256').update(fileBytes).digest('hex');

  const { data, info } = await sharp(fileBytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(info.width, 1024, `${fullPath} atlas width must be 1024`);
  assert.equal(info.height, 1024, `${fullPath} atlas height must be 1024`);

  const corners = [
    0,
    1023 * 4,
    1023 * 1024 * 4,
    (1023 * 1024 + 1023) * 4,
  ];
  for (const offset of corners) {
    assert.equal(data[offset + 3], 0, `${fullPath} atlas corner alpha must be 0`);
  }

  for (const [qx, qy] of [
    [256, 256],
    [768, 256],
    [256, 768],
    [768, 768],
  ]) {
    const offset = (qy * 1024 + qx) * 4;
    assert.equal(
      data[offset + 3],
      255,
      `${fullPath} quadrant center (${qx},${qy}) alpha must be 255`
    );
  }

  return { size: fileStat.size, sha256 };
}

export async function generateRocksoulCast({ checkOnly = false } = {}) {
  // Validate canonical ROCKSOUL CAN-0004 & CAN-0011 guard metadata upfront
  validateCanonGuardMetadata(
    ROCKSOUL_CANON_GUARD_ENTRY,
    'generate-rocksoul-cast.mjs',
    'ROCKSOUL_CANON_GUARD_ENTRY',
    { requireGuards: true }
  );
  validateRocksoulCapModes(
    ROCKSOUL_CANON_GUARD_ENTRY,
    'generate-rocksoul-cast.mjs',
    'ROCKSOUL_CANON_GUARD_ENTRY'
  );

  const illustrationsDir = resolve(packageRoot, 'illustrations/rocksoul-universe/rocksoul');
  if (!checkOnly) {
    await mkdir(illustrationsDir, { recursive: true });
  }

  const manifestEntries = [];
  const digests = new Map();
  let seedCounter = 1001;

  // 1. Portraits & Expressions (2 capModes x 2 styles x 3 variants = 12 PNG + 12 WebP)
  for (const capModeId of ['green-mercy', 'black-resolve']) {
    for (const style of ['cel', 'rough-pencil']) {
      for (const variant of PORTRAIT_VARIANTS) {
        seedCounter += 19;
        const baseName = `rocksoul-${capModeId}-${variant.slug}-${style}`;
        const title = `ROCKSOUL ${CAP_MODES[capModeId].label} ${variant.titleSuffix} (${style})`;
        validateCan0011Text(title, 'generate-rocksoul-cast.mjs', baseName);

        const pngRel = `illustrations/rocksoul-universe/rocksoul/${baseName}.png`;
        const webpRel = `illustrations/rocksoul-universe/rocksoul/${baseName}.webp`;

        if (!checkOnly) {
          const svg = buildRocksoulPortraitSvg({
            capModeId,
            style,
            bob: variant.bob,
            tilt: variant.tilt,
            brimTilt: variant.brimTilt,
            headTurn: variant.headTurn,
            handPose: variant.handPose,
            energyLevel: variant.energyLevel,
            pulsePhase: seedCounter % 4,
            seed: seedCounter,
          });
          const { pngBuf, webpBuf } = await renderPngAndWebp(svg, 512, 512);
          await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
          await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
        }

        for (const [relPath, format] of [
          [pngRel, 'png'],
          [webpRel, 'webp'],
        ]) {
          const checked = await assertAlphaCutoutFile(
            resolve(packageRoot, relPath),
            512,
            512,
            BUDGET_BYTES['character-sprite']
          );
          assert.ok(
            !digests.has(checked.sha256),
            `Duplicate SHA-256 detected between ${relPath} and ${digests.get(checked.sha256)}`
          );
          digests.set(checked.sha256, relPath);
          manifestEntries.push({
            path: relPath,
            kind: 'character-sprite',
            variant: baseName,
            subject: 'rocksoul-witness',
            format,
            width: 512,
            height: 512,
            pack: 'rocksoul-universe',
            domain: 'visual-universe',
            status: 'review',
            canonLevel: 'lore',
            autoMergeForbidden: true,
            capMode: capModeId,
            artStyle: style,
            license: 'ISC',
            source: 'packages/assets/scripts/generate-rocksoul-cast.mjs',
          });
        }
      }

      // 2. Full-Body Poses (2 capModes x 2 styles x 2 poses = 8 PNG + 8 WebP)
      for (const pose of FULLBODY_POSES) {
        seedCounter += 29;
        const baseName = `rocksoul-${capModeId}-${pose.slug}-${style}`;
        const title = `ROCKSOUL ${CAP_MODES[capModeId].label} ${pose.titleSuffix} (${style})`;
        validateCan0011Text(title, 'generate-rocksoul-cast.mjs', baseName);

        const pngRel = `illustrations/rocksoul-universe/rocksoul/${baseName}.png`;
        const webpRel = `illustrations/rocksoul-universe/rocksoul/${baseName}.webp`;

        if (!checkOnly) {
          const svg = buildRocksoulFullbodySvg({
            capModeId,
            style,
            stride: pose.stride,
            bob: pose.bob,
            tilt: pose.tilt,
            seed: seedCounter,
          });
          const { pngBuf, webpBuf } = await renderPngAndWebp(svg, 512, 768);
          await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
          await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
        }

        for (const [relPath, format] of [
          [pngRel, 'png'],
          [webpRel, 'webp'],
        ]) {
          const checked = await assertAlphaCutoutFile(
            resolve(packageRoot, relPath),
            512,
            768,
            BUDGET_BYTES['character-sprite']
          );
          assert.ok(
            !digests.has(checked.sha256),
            `Duplicate SHA-256 detected between ${relPath} and ${digests.get(checked.sha256)}`
          );
          digests.set(checked.sha256, relPath);
          manifestEntries.push({
            path: relPath,
            kind: 'character-sprite',
            variant: baseName,
            subject: 'rocksoul-witness',
            format,
            width: 512,
            height: 768,
            pack: 'rocksoul-universe',
            domain: 'visual-universe',
            status: 'review',
            canonLevel: 'lore',
            autoMergeForbidden: true,
            capMode: capModeId,
            artStyle: style,
            license: 'ISC',
            source: 'packages/assets/scripts/generate-rocksoul-cast.mjs',
          });
        }
      }
    }
  }

  // 3. Animation Clips & 2x2 1024x1024 Sprite Atlases (5 clips x (4 frames + 1 sheet + 1 clip.json) = 30 files)
  for (const clipSpec of ANIMATION_CLIPS) {
    const dirRel = `animation/${clipSpec.id}`;
    const dirFull = resolve(packageRoot, dirRel);
    if (!checkOnly) {
      await mkdir(dirFull, { recursive: true });
    }

    const sheetRel = `${dirRel}/${clipSpec.id}-sheet.png`;
    const clipRel = `${dirRel}/${clipSpec.id}-clip.json`;
    const frameBuffers = [];
    const frameEntries = [];

    for (let i = 0; i < 4; i += 1) {
      const frameOffset = ANIMATION_CLIPS.indexOf(clipSpec) * 4 + i;
      const frameSeed = (seedCounter << 8) ^ (frameOffset + 1);
      seedCounter += 37;
      const frameNum = String(i + 1).padStart(2, '0');
      const frameRel = `${dirRel}/${clipSpec.id}-frame-${frameNum}.png`;
      const frameCfg = clipSpec.frames[i];
      const activeCapMode = frameCfg.capOverride ?? clipSpec.capMode;

      if (!checkOnly) {
        const svg = buildRocksoulPortraitSvg({
          capModeId: activeCapMode,
          style: clipSpec.style,
          bob: frameCfg.bob,
          tilt: frameCfg.tilt,
          brimTilt: frameCfg.brimTilt,
          headTurn: frameCfg.headTurn,
          handPose: frameCfg.handPose,
          energyLevel: frameCfg.energyLevel,
          pulsePhase: (frameCfg.pulsePhase + frameOffset) % 4,
          seed: frameSeed,
        });
        const { pngBuf } = await renderPngAndWebp(svg, 512, 512);
        await atomicWrite(resolve(packageRoot, frameRel), pngBuf);
        frameBuffers.push(pngBuf);
      }

      const checkedFrame = await assertAlphaCutoutFile(
        resolve(packageRoot, frameRel),
        512,
        512,
        BUDGET_BYTES['animation-frame']
      );
      assert.ok(
        !digests.has(checkedFrame.sha256),
        `Duplicate SHA-256 detected on animation frame ${frameRel}`
      );
      digests.set(checkedFrame.sha256, frameRel);

      frameEntries.push({ asset: frameRel, durationMs: clipSpec.durationMs });
      manifestEntries.push({
        path: frameRel,
        kind: 'animation-frame',
        variant: `${clipSpec.id}-frame-${frameNum}`,
        subject: 'rocksoul-witness',
        format: 'png',
        width: 512,
        height: 512,
        pack: 'rocksoul-universe',
        domain: 'visual-universe',
        status: 'review',
        canonLevel: 'lore',
        autoMergeForbidden: true,
        capMode: activeCapMode,
        artStyle: clipSpec.style,
        license: 'ISC',
        source: 'packages/assets/scripts/generate-rocksoul-cast.mjs',
      });
    }

    if (!checkOnly) {
      const sheetBuf = await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          { input: frameBuffers[0], left: 0, top: 0 },
          { input: frameBuffers[1], left: 512, top: 0 },
          { input: frameBuffers[2], left: 0, top: 512 },
          { input: frameBuffers[3], left: 512, top: 512 },
        ])
        .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
        .toBuffer();
      await atomicWrite(resolve(packageRoot, sheetRel), sheetBuf);
    }

    const checkedSheet = await assertAtlasSheetFile(
      resolve(packageRoot, sheetRel),
      BUDGET_BYTES['animation-sheet']
    );
    assert.ok(
      !digests.has(checkedSheet.sha256),
      `Duplicate SHA-256 detected on atlas sheet ${sheetRel}`
    );
    digests.set(checkedSheet.sha256, sheetRel);

    manifestEntries.push({
      path: sheetRel,
      kind: 'animation-sheet',
      variant: `${clipSpec.id}-sheet`,
      subject: 'rocksoul-witness',
      format: 'png',
      width: 1024,
      height: 1024,
      pack: 'rocksoul-universe',
      domain: 'visual-universe',
      status: 'review',
      canonLevel: 'lore',
      autoMergeForbidden: true,
      capMode: clipSpec.capMode,
      artStyle: clipSpec.style,
      license: 'ISC',
      source: 'packages/assets/scripts/generate-rocksoul-cast.mjs',
    });

    const clipDoc = {
      schemaVersion: 1,
      clipId: clipSpec.id,
      characterId: 'rocksoul-witness',
      pack: 'rocksoul-universe',
      domain: 'visual-universe',
      capMode: clipSpec.capMode,
      artStyle: clipSpec.style,
      canonLevel: 'lore',
      autoMergeForbidden: true,
      canonGuard: ROCKSOUL_CANON_GUARD_ENTRY.canonGuard,
      description: clipSpec.description,
      clip: {
        id: clipSpec.id,
        loop: true,
        direction: clipSpec.direction,
        pivot: { x: 0.5, y: 0.88 },
        frames: frameEntries,
      },
      spriteSheet: {
        atlas: sheetRel,
        frameWidth: 512,
        frameHeight: 512,
        frameCount: 4,
        frameDurationMs: clipSpec.durationMs,
        columns: 2,
        rows: 2,
        loop: true,
        direction: clipSpec.direction,
        pivot: { x: 0.5, y: 0.88 },
      },
      reducedMotionFallback: frameEntries[0].asset,
      license: 'ISC',
      status: 'review',
    };

    if (!checkOnly) {
      await atomicWrite(resolve(packageRoot, clipRel), `${JSON.stringify(clipDoc, null, 2)}\n`);
    }

    const clipFull = resolve(packageRoot, clipRel);
    assert.ok(existsSync(clipFull), `Missing clip JSON: ${clipFull}`);
    const clipStat = await stat(clipFull);
    assert.ok(clipStat.size <= BUDGET_BYTES['animation-clip'], `${clipRel} exceeds clip budget`);
    const parsedClip = JSON.parse(await readFile(clipFull, 'utf8'));
    assert.equal(parsedClip.characterId, 'rocksoul-witness');
    assert.equal(parsedClip.canonLevel, 'lore');
    assert.equal(parsedClip.autoMergeForbidden, true);
    assert.equal(parsedClip.spriteSheet.columns, 2);
    assert.equal(parsedClip.spriteSheet.rows, 2);
    assert.equal(parsedClip.spriteSheet.frameWidth, 512);
    assert.equal(parsedClip.spriteSheet.frameHeight, 512);

    manifestEntries.push({
      path: clipRel,
      kind: 'animation-clip',
      variant: `${clipSpec.id}-clip`,
      subject: 'rocksoul-witness',
      format: 'json',
      pack: 'rocksoul-universe',
      domain: 'visual-universe',
      status: 'review',
      canonLevel: 'lore',
      autoMergeForbidden: true,
      capMode: clipSpec.capMode,
      artStyle: clipSpec.style,
      license: 'ISC',
      source: 'packages/assets/scripts/generate-rocksoul-cast.mjs',
      spriteSheet: clipDoc.spriteSheet,
    });
  }

  return manifestEntries;
}

const MANIFEST_PATH = resolve(packageRoot, 'manifest.json');
const OWNED_PREFIXES = ['illustrations/rocksoul-universe/rocksoul/', 'animation/rocksoul-'];

/** Register generated ROCKSOUL pack assets in manifest.json, replacing only paths this generator owns. */
export async function registerRocksoulCast(entries) {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const ownedPaths = new Set([
    ...manifest.assets.map(({ path }) => path).filter((p) => OWNED_PREFIXES.some((x) => p.startsWith(x))),
    ...entries.map(({ path }) => path),
  ]);
  manifest.assets = replaceGeneratedAssets(manifest.assets, entries, ownedPaths);
  await atomicWrite(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}
`);
}

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = argv.includes('--check');
  const entries = await generateRocksoulCast({ checkOnly });
  if (!checkOnly) {
    await registerRocksoulCast(entries);
  }
  stdout.write(
    `${checkOnly ? 'Verified' : 'Generated'} ${entries.length} ROCKSOUL Witness pack assets (green-mercy & black-resolve, cel & rough-pencil, 2x2 atlases).\n`
  );
}
