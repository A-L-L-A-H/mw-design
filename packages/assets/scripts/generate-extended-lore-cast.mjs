import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';
import { RUNTIME_BUDGET_BYTES } from './asset-qa.mjs';
import {
  assertCan0004NoAliasAutoMerge,
  validateCan0011Text,
  validateCanonGuardMetadata,
} from './character-registry-schema.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_SPRITE_BYTES = RUNTIME_BUDGET_BYTES['character-sprite'];

const PALETTE = Object.freeze({
  ink: '#0d0d0d',
  charcoal: '#17171c',
  graphite: '#282a35',
  slate: '#3b4052',
  ash: '#555b70',
  paper: '#f3efe4',
  paperBright: '#fffdf6',
  paperShade: '#ded8c8',
  porcelain: '#f6f1e7',
  porcelainShade: '#d0c8b8',
  crimson: '#d1132a',
  crimsonDark: '#8c0c1c',
  yellow: '#ffe031',
  yellowShade: '#cca608',
  magenta: '#ff2e88',
  magentaDark: '#b3165b',
  cyan: '#00b8f0',
  cyanDark: '#00789e',
  cobalt: '#2563eb',
  cobaltDark: '#173896',
  violet: '#c084fc',
  violetDark: '#6d28d9',
  mercyGreen: '#22c55e',
  greenDark: '#15803d',
  copper: '#d97706',
  copperDark: '#92400e',
});

const f1 = (value) => Math.round(value * 10) / 10;

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = (rng, min, max) => min + rng() * (max - min);

function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

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

function halftoneDots(cols, rows, startX, startY, step, radius, color, opacity = 0.28) {
  const dots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = f1(startX + col * step + (row % 2 === 1 ? step / 2 : 0));
      const cy = f1(startY + row * step);
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}"/>`);
    }
  }
  return dots.join('');
}

function sketchSegment(p1, p2, rng, jitter = 1.6) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const mx = (x1 + x2) / 2 + rnd(rng, -jitter, jitter);
  const my = (y1 + y2) / 2 + rnd(rng, -jitter, jitter);
  return `M${f1(x1)} ${f1(y1)}Q${f1(mx)} ${f1(my)} ${f1(x2)} ${f1(y2)}`;
}

function sketchPolyEdge(p1, p2, rng, overshoot = 5) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const sx = x1 - ux * overshoot;
  const sy = y1 - uy * overshoot;
  const ex = x2 + ux * overshoot;
  const ey = y2 + uy * overshoot;
  const parts = [`M${f1(sx)} ${f1(sy)}`];
  const segs = 5;
  for (let i = 1; i <= segs; i += 1) {
    const t = i / segs;
    const j = i === segs ? 0 : rnd(rng, -1.7, 1.7);
    parts.push(`L${f1(sx + (ex - sx) * t - uy * j)} ${f1(sy + (ey - sy) * t + ux * j)}`);
  }
  return parts.join('');
}

function sketchLoop(points, rng, { color = PALETTE.ink, width = 2.6, overshoot = 5, closed = true } = {}) {
  const out = [];
  const count = closed ? points.length : points.length - 1;
  for (let i = 0; i < count; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const d1 = sketchPolyEdge(p1, p2, rng, overshoot);
    const d2 = sketchSegment(p1, p2, rng, 1.9);
    out.push(
      `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-opacity="0.92"/>`,
      `<path d="${d2}" fill="none" stroke="${color}" stroke-width="${f1(width * 0.62)}" stroke-linecap="round" stroke-opacity="0.58"/>`
    );
  }
  return out.join('');
}

function buildCrosshatchClip(clipId, clipShapeSvg, x, y, w, h, rng, { step = 9, color = PALETTE.graphite } = {}) {
  const lines = [];
  for (let offset = -h; offset <= w + h; offset += step) {
    const x1 = x + offset;
    const y1 = y;
    const x2 = x + offset - h * 0.72;
    const y2 = y + h;
    const dash = rng() > 0.45 ? ` stroke-dasharray="${f1(rnd(rng, 10, 24))} ${f1(rnd(rng, 3, 7))}"` : '';
    lines.push(
      `<path d="${sketchSegment([x1, y1], [x2, y2], rng, 1.4)}" stroke="${color}" stroke-width="${f1(rnd(rng, 1.0, 1.8))}" stroke-opacity="${f1(rnd(rng, 0.25, 0.55))}"${dash}/>`
    );
  }
  for (let offset = -h; offset <= w + h; offset += step * 1.45) {
    const x1 = x + offset;
    const y1 = y + h;
    const x2 = x + offset - h * 0.68;
    const y2 = y;
    lines.push(
      `<path d="${sketchSegment([x1, y1], [x2, y2], rng, 1.3)}" stroke="${color}" stroke-width="1.1" stroke-opacity="0.22"/>`
    );
  }
  return `<defs><clipPath id="${clipId}">${clipShapeSvg}</clipPath></defs><g clip-path="url(#${clipId})" fill="none" stroke-linecap="round">${lines.join('')}</g>`;
}

function waveRibbon(x1, y1, x2, y2, amp, cycles, color, width = 3.5, opacity = 0.9) {
  const steps = cycles * 8;
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI * 2 * cycles) * amp;
    pts.push(`${i === 0 ? 'M' : 'L'}${f1(x)} ${f1(y)}`);
  }
  return `<path d="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${opacity}"/>`;
}

function sparkArc(points, color, width = 4, outerInk = true) {
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f1(x)} ${f1(y)}`).join(' ');
  const inkPass = outerInk
    ? `<path d="${d}" fill="none" stroke="${PALETTE.ink}" stroke-width="${width + 4}" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';
  return `${inkPass}<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function buildSvgDoc(width, height, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
}

function buildRoughPencilBackdrop({
  idPrefix,
  w,
  h,
  silhouetteSvg,
  accentA,
  accentB,
  seed,
  outlinePts = [],
  detailFn,
}) {
  const rng = createRng(seed);
  const clipId = `${idPrefix}-hatch`;
  const backingShadow = `<g transform="translate(5 6)" fill="${PALETTE.ink}">${silhouetteSvg.replaceAll(/fill="[^"]*"/gu, `fill="${PALETTE.ink}"`)}</g>`;
  const paperCutout = `<g fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="5.5" stroke-linejoin="round">${silhouetteSvg}</g>`;
  const innerShade = `<g fill="${PALETTE.paperShade}" fill-opacity="0.58" transform="translate(8 6)">${silhouetteSvg}</g>`;
  const crosshatch = buildCrosshatchClip(clipId, silhouetteSvg, 28, 28, w - 56, h - 56, rng, {
    step: 10,
    color: PALETTE.graphite,
  });
  const sketchContour = outlinePts.length
    ? sketchLoop(outlinePts, rng, { color: PALETTE.ink, width: 2.8, overshoot: 6 })
    : '';
  const details = detailFn(rng, accentA, accentB);
  return `${backingShadow}${paperCutout}${innerShade}${crosshatch}${details}${sketchContour}`;
}

/** Draw modular 4-cell battery construct (CAN-0011 strictly non-humanoid capacitor ensemble). */
function renderFourlah(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isRelay = variant.endsWith('relay');
  const isAction = variant.endsWith('action');
  const rng = createRng(hashSeed(`fourlah-${variant}`));

  if (isRelay) {
    const coreBox = '<rect x="196" y="196" width="120" height="120" rx="14"/>';
    const cells = [
      { x: 66, y: 82, accent: PALETTE.yellow, bars: 1 },
      { x: 342, y: 82, accent: PALETTE.cyan, bars: 2 },
      { x: 66, y: 294, accent: PALETTE.crimson, bars: 3 },
      { x: 342, y: 294, accent: PALETTE.yellow, bars: 4 },
    ];
    const cellSilhouettes = cells
      .map(
        (c) =>
          `<rect x="${c.x}" y="${c.y}" width="104" height="136" rx="12"/><rect x="${c.x + 28}" y="${c.y - 16}" width="48" height="18" rx="4"/>`
      )
      .join('');
    const busbars =
      `<path d="M 170 150 L 214 214 M 342 150 L 298 214 M 170 362 L 214 298 M 342 362 L 298 298" stroke="${PALETTE.copper}" stroke-width="18" stroke-linecap="round"/>` +
      `<path d="M 170 150 L 214 214 M 342 150 L 298 214 M 170 362 L 214 298 M 342 362 L 298 298" stroke="${PALETTE.ink}" stroke-width="6" stroke-dasharray="12 10" stroke-linecap="round"/>`;

    if (isPencil) {
      const sil = `${coreBox}${cellSilhouettes}<rect x="150" y="140" width="212" height="232" rx="22"/>`;
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.yellow,
        accentB: PALETTE.cyan,
        seed: hashSeed('fourlah-pencil-relay'),
        outlinePts: [
          [196, 196],
          [316, 196],
          [316, 316],
          [196, 316],
        ],
        detailFn: (r) => {
          const cellDrawings = cells
            .map((c, idx) => {
              const col = idx % 2 === 0 ? PALETTE.crimson : PALETTE.cyan;
              const bars = Array.from({ length: c.bars }, (_, b) =>
                `<rect x="${c.x + 18}" y="${c.y + 98 - b * 20}" width="68" height="12" rx="2" fill="${c.accent}" fill-opacity="0.72" stroke="${PALETTE.ink}" stroke-width="2"/>`
              ).join('');
              return (
                sketchLoop(
                  [
                    [c.x, c.y],
                    [c.x + 104, c.y],
                    [c.x + 104, c.y + 136],
                    [c.x, c.y + 136],
                  ],
                  r,
                  { color: PALETTE.ink, width: 2.5, overshoot: 5 }
                ) +
                `<rect x="${c.x + 28}" y="${c.y - 16}" width="48" height="18" rx="4" fill="${PALETTE.copper}" fill-opacity="0.65" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
                bars +
                `<path d="${sketchSegment([c.x + 12, c.y + 16], [c.x + 92, c.y + 16], r, 1)}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`
              );
            })
            .join('');
          const core =
            `<circle cx="256" cy="256" r="42" fill="${PALETTE.paperBright}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
            `<rect x="224" y="246" width="64" height="20" rx="8" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
            sparkArc([[160, 150], [218, 224], [294, 224], [352, 150]], PALETTE.crimson, 3.2) +
            sparkArc([[160, 362], [218, 288], [294, 288], [352, 362]], PALETTE.yellow, 3.2);
          return `${busbars}${cellDrawings}${core}`;
        },
      });
    }

    const celCells = cells
      .map((c) => {
        const bars = Array.from({ length: c.bars }, (_, b) =>
          `<rect x="${c.x + 18}" y="${c.y + 98 - b * 20}" width="68" height="13" rx="2" fill="${c.accent}" stroke="${PALETTE.ink}" stroke-width="2.5"/>`
        ).join('');
        return (
          `<rect x="${c.x + 28}" y="${c.y - 18}" width="48" height="22" rx="4" fill="${PALETTE.copper}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
          `<rect x="${c.x}" y="${c.y}" width="104" height="136" rx="12" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
          `<rect x="${c.x + 6}" y="${c.y + 6}" width="32" height="124" rx="8" fill="${PALETTE.slate}"/>` +
          `<path d="M${c.x + 12} ${c.y + 18}H${c.x + 92}" stroke="${PALETTE.yellow}" stroke-width="6" stroke-dasharray="10 6"/>` +
          bars
        );
      })
      .join('');
    return (
      busbars +
      celCells +
      `<rect x="192" y="192" width="128" height="128" rx="16" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
      `<rect x="200" y="200" width="112" height="44" rx="10" fill="${PALETTE.slate}"/>` +
      `<circle cx="256" cy="256" r="40" fill="${PALETTE.ink}" stroke="${PALETTE.yellow}" stroke-width="5"/>` +
      `<rect x="220" y="247" width="72" height="18" rx="9" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="2.5"/>` +
      sparkArc([[150, 120], [186, 178], [220, 212]], PALETTE.cyan, 4) +
      sparkArc([[362, 392], [326, 334], [292, 300]], PALETTE.yellow, 4) +
      `<path d="${starPath(256, 148, 18, 6, 4)}" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3.5"/>`
    );
  }

  if (isAction) {
    const bodySil =
      '<rect x="116" y="102" width="66" height="168" rx="12"/>' +
      '<rect x="330" y="102" width="66" height="168" rx="12"/>' +
      '<rect x="150" y="210" width="212" height="236" rx="20"/>' +
      '<rect x="188" y="114" width="136" height="114" rx="16"/>' +
      '<rect x="88" y="246" width="68" height="196" rx="14"/>' +
      '<rect x="356" y="246" width="68" height="196" rx="14"/>' +
      '<rect x="158" y="440" width="84" height="260" rx="14"/>' +
      '<rect x="270" y="440" width="84" height="260" rx="14"/>';
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: bodySil,
        accentA: PALETTE.yellow,
        accentB: PALETTE.cyan,
        seed: hashSeed('fourlah-pencil-action'),
        outlinePts: [
          [150, 210],
          [362, 210],
          [362, 446],
          [150, 446],
        ],
        detailFn: (r) =>
          `<rect x="196" y="128" width="120" height="86" rx="12" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
          `<rect x="214" y="160" width="84" height="18" rx="9" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
          `<circle cx="256" cy="332" r="52" fill="${PALETTE.paperBright}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          `<circle cx="256" cy="332" r="26" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
          `<path d="${sketchSegment([124, 150], [188, 224], r, 2)}" stroke="${PALETTE.crimson}" stroke-width="5" stroke-linecap="round"/>` +
          `<path d="${sketchSegment([388, 150], [324, 224], r, 2)}" stroke="${PALETTE.crimson}" stroke-width="5" stroke-linecap="round"/>` +
          sparkArc([[76, 300], [110, 260], [150, 286]], PALETTE.cyan, 4) +
          sparkArc([[436, 300], [402, 260], [362, 286]], PALETTE.yellow, 4) +
          sketchLoop([[160, 560], [240, 560], [240, 696], [156, 696]], r, { width: 2.6 }) +
          sketchLoop([[272, 560], [356, 560], [356, 696], [272, 696]], r, { width: 2.6 }),
      });
    }
    return (
      `<path d="M 148 106 C 148 56 184 56 208 118 M 364 106 C 364 56 328 56 304 118" fill="none" stroke="${PALETTE.copper}" stroke-width="14" stroke-linecap="round"/>` +
      `<rect x="116" y="102" width="66" height="168" rx="12" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="330" y="102" width="66" height="168" rx="12" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="128" y="124" width="42" height="22" rx="3" fill="${PALETTE.yellow}"/>` +
      `<rect x="342" y="124" width="42" height="22" rx="3" fill="${PALETTE.cyan}"/>` +
      `<rect x="150" y="210" width="212" height="236" rx="20" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
      `<polygon points="154,214 256,214 236,442 154,442" fill="${PALETTE.graphite}"/>` +
      `<rect x="188" y="114" width="136" height="114" rx="16" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
      `<rect x="206" y="156" width="100" height="22" rx="11" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="3"/>` +
      `<rect x="178" y="232" width="156" height="22" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
      `<circle cx="256" cy="336" r="52" fill="${PALETTE.ink}" stroke="${PALETTE.yellow}" stroke-width="5"/>` +
      `<circle cx="256" cy="336" r="32" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="3"/>` +
      `<rect x="88" y="246" width="68" height="196" rx="14" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="356" y="246" width="68" height="196" rx="14" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="158" y="440" width="84" height="260" rx="14" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="270" y="440" width="84" height="260" rx="14" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="148" y="640" width="100" height="64" rx="10" fill="${PALETTE.crimson}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="264" y="640" width="100" height="64" rx="10" fill="${PALETTE.crimson}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      sparkArc([[56, 200], [116, 180], [88, 250]], PALETTE.yellow, 5) +
      sparkArc([[456, 200], [396, 180], [424, 250]], PALETTE.cyan, 5)
    );
  }

  // Portrait (512x512)
  const portSil =
    '<rect x="74" y="96" width="80" height="190" rx="14"/>' +
    '<rect x="358" y="96" width="80" height="190" rx="14"/>' +
    '<rect x="134" y="206" width="244" height="236" rx="24"/>' +
    '<rect x="168" y="92" width="176" height="136" rx="20"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: portSil,
      accentA: PALETTE.yellow,
      accentB: PALETTE.cyan,
      seed: hashSeed('fourlah-pencil-portrait'),
      outlinePts: [
        [168, 92],
        [344, 92],
        [378, 206],
        [378, 442],
        [134, 442],
        [134, 206],
      ],
      detailFn: (r) =>
        `<path d="M 134 116 C 110 50 162 46 188 106 M 378 116 C 402 50 350 46 324 106" fill="none" stroke="${PALETTE.copper}" stroke-width="9" stroke-linecap="round"/>` +
        `<rect x="184" y="140" width="144" height="30" rx="14" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
        `<rect x="198" y="148" width="116" height="14" rx="7" fill="${PALETTE.cyan}"/>` +
        `<circle cx="256" cy="316" r="64" fill="${PALETTE.paperBright}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
        `<circle cx="256" cy="316" r="34" fill="${PALETTE.yellow}" fill-opacity="0.85" stroke="${PALETTE.ink}" stroke-width="3"/>` +
        [0, 1, 2, 3].map((i) => {
          const bx = 176 + i * 44;
          return `<rect x="${bx}" y="394" width="28" height="28" rx="4" fill="${i % 2 === 0 ? PALETTE.yellow : PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>`;
        }).join('') +
        `<path d="${sketchSegment([84, 150], [150, 210], r, 2)}" stroke="${PALETTE.crimson}" stroke-width="4.5" stroke-linecap="round"/>` +
        sparkArc([[42, 240], [88, 206], [70, 276]], PALETTE.cyan, 4),
    });
  }
  return (
    `<path d="M 134 116 C 110 46 164 44 190 104 M 378 116 C 402 46 348 44 322 104" fill="none" stroke="${PALETTE.ink}" stroke-width="18" stroke-linecap="round"/>` +
    `<path d="M 134 116 C 110 46 164 44 190 104 M 378 116 C 402 46 348 44 322 104" fill="none" stroke="${PALETTE.copper}" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="74" y="96" width="80" height="190" rx="14" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
    `<rect x="358" y="96" width="80" height="190" rx="14" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
    `<rect x="90" y="122" width="48" height="26" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
    `<rect x="374" y="122" width="48" height="26" rx="4" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
    `<rect x="134" y="206" width="244" height="236" rx="24" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
    `<polygon points="140,212 240,212 216,436 140,436" fill="${PALETTE.graphite}"/>` +
    `<rect x="168" y="92" width="176" height="136" rx="20" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
    `<rect x="184" y="138" width="144" height="32" rx="16" fill="${PALETTE.ink}" stroke="${PALETTE.paper}" stroke-width="3"/>` +
    `<rect x="196" y="147" width="120" height="14" rx="7" fill="${PALETTE.cyan}"/>` +
    `<circle cx="256" cy="314" r="64" fill="${PALETTE.ink}" stroke="${PALETTE.yellow}" stroke-width="6"/>` +
    `<circle cx="256" cy="314" r="38" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
    `<circle cx="256" cy="314" r="18" fill="${PALETTE.cyan}"/>` +
    [0, 1, 2, 3].map((i) => {
      const bx = 176 + i * 44;
      const fill = i === 0 ? PALETTE.yellow : i === 1 ? PALETTE.cyan : i === 2 ? PALETTE.crimson : PALETTE.yellow;
      return `<rect x="${bx}" y="394" width="28" height="28" rx="4" fill="${fill}" stroke="${PALETTE.paper}" stroke-width="2.5"/>`;
    }).join('') +
    halftoneDots(4, 3, 152, 224, 14, 2, PALETTE.yellow, 0.32) +
    sparkArc([[40, 290], [82, 240], [118, 286]], PALETTE.cyan, 4.5) +
    sparkArc([[472, 290], [430, 240], [394, 286]], PALETTE.crimson, 4.5)
  );
}

function renderTheShadow(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  if (isAction) {
    const sil =
      '<path d="M 256 64 C 216 64 190 96 190 144 L 182 194 L 116 244 L 78 552 L 154 512 L 170 698 L 236 654 L 266 716 L 324 644 L 382 694 L 368 486 L 434 522 L 392 244 L 330 194 L 322 144 C 322 96 296 64 256 64 Z"/>';
    const tapeBandolier =
      `<path d="M 184 226 L 344 438" stroke="${PALETTE.paper}" stroke-width="24" stroke-linecap="round"/>` +
      `<path d="M 184 226 L 344 438" stroke="${PALETTE.ink}" stroke-width="18" stroke-linecap="round"/>` +
      `<rect x="210" y="266" width="38" height="24" rx="3" transform="rotate(52 229 278)" fill="${PALETTE.violet}" stroke="${PALETTE.paper}" stroke-width="2.5"/>` +
      `<rect x="266" y="340" width="38" height="24" rx="3" transform="rotate(52 285 352)" fill="${PALETTE.violet}" stroke="${PALETTE.paper}" stroke-width="2.5"/>`;
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.violet,
        accentB: PALETTE.paper,
        seed: hashSeed('shadow-pencil-action'),
        outlinePts: [
          [256, 64],
          [322, 144],
          [392, 244],
          [434, 522],
          [382, 694],
          [266, 716],
          [170, 698],
          [78, 552],
          [116, 244],
          [190, 144],
        ],
        detailFn: (r) =>
          `<path d="M 210 112 C 232 92 280 92 302 112 L 296 178 L 216 178 Z" fill="${PALETTE.ink}"/>` +
          `<rect x="224" y="132" width="64" height="12" rx="6" fill="${PALETTE.violet}"/>` +
          tapeBandolier +
          waveRibbon(64, 590, 444, 560, 18, 3, PALETTE.violet, 4) +
          `<path d="${sketchSegment([256, 210], [256, 620], r, 3)}" stroke="${PALETTE.violet}" stroke-width="3" stroke-dasharray="14 8"/>`,
      });
    }
    return (
      `<path d="M 256 64 C 216 64 190 96 190 144 L 182 194 L 116 244 L 78 552 L 154 512 L 170 698 L 236 654 L 266 716 L 324 644 L 382 694 L 368 486 L 434 522 L 392 244 L 330 194 L 322 144 C 322 96 296 64 256 64 Z" fill="${PALETTE.ink}" stroke="${PALETTE.violet}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M 256 68 C 224 68 198 98 198 144 L 122 246 L 92 528 L 160 494 L 176 672 L 230 634 L 238 220 Z" fill="${PALETTE.charcoal}"/>` +
      `<path d="M 212 108 C 236 90 276 90 300 108 L 294 176 L 218 176 Z" fill="#050507" stroke="${PALETTE.paper}" stroke-width="2.5"/>` +
      `<rect x="224" y="132" width="64" height="11" rx="5.5" fill="${PALETTE.violet}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
      tapeBandolier +
      waveRibbon(70, 586, 442, 540, 20, 3, PALETTE.violet, 4.5) +
      halftoneDots(5, 4, 290, 240, 14, 2, PALETTE.violet, 0.25)
    );
  }

  const sil =
    '<path d="M 256 58 C 194 58 158 106 158 182 L 96 254 L 78 446 L 434 446 L 416 254 L 354 182 C 354 106 318 58 256 58 Z"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.violet,
      accentB: PALETTE.paper,
      seed: hashSeed('shadow-pencil-portrait'),
      outlinePts: [
        [256, 58],
        [354, 182],
        [416, 254],
        [434, 446],
        [78, 446],
        [96, 254],
        [158, 182],
      ],
      detailFn: () =>
        `<path d="M 192 106 C 228 84 284 84 320 106 L 310 218 L 202 218 Z" fill="${PALETTE.ink}"/>` +
        `<rect x="212" y="152" width="88" height="14" rx="7" fill="${PALETTE.violet}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
        `<path d="M 146 276 L 354 416" stroke="${PALETTE.ink}" stroke-width="18" stroke-linecap="round"/>` +
        `<rect x="208" y="308" width="48" height="30" rx="4" transform="rotate(34 232 323)" fill="${PALETTE.violet}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
        waveRibbon(68, 404, 444, 386, 12, 3, PALETTE.violet, 3.5),
    });
  }
  return (
    `<path d="M 256 58 C 194 58 158 106 158 182 L 96 254 L 78 446 L 434 446 L 416 254 L 354 182 C 354 106 318 58 256 58 Z" fill="${PALETTE.ink}" stroke="${PALETTE.violet}" stroke-width="5.5" stroke-linejoin="round"/>` +
    `<path d="M 256 64 C 204 64 168 110 168 182 L 106 258 L 90 436 L 230 436 L 246 218 Z" fill="${PALETTE.charcoal}"/>` +
    `<path d="M 192 106 C 228 84 284 84 320 106 L 310 218 L 202 218 Z" fill="#050507" stroke="${PALETTE.paper}" stroke-width="3"/>` +
    `<rect x="212" y="152" width="88" height="14" rx="7" fill="${PALETTE.violet}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
    `<path d="M 142 274 L 360 422" stroke="${PALETTE.paper}" stroke-width="22" stroke-linecap="round"/>` +
    `<path d="M 142 274 L 360 422" stroke="${PALETTE.ink}" stroke-width="16" stroke-linecap="round"/>` +
    `<rect x="212" y="314" width="52" height="32" rx="4" transform="rotate(34 238 330)" fill="${PALETTE.violet}" stroke="${PALETTE.paper}" stroke-width="2.5"/>` +
    waveRibbon(66, 404, 446, 382, 14, 3, PALETTE.violet, 4) +
    halftoneDots(4, 3, 300, 260, 15, 2.2, PALETTE.violet, 0.28)
  );
}

function renderBabyDoll(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  if (isAction) {
    const sil =
      '<circle cx="152" cy="144" r="56"/><circle cx="360" cy="144" r="56"/>' +
      '<circle cx="256" cy="166" r="88"/>' +
      '<polygon points="186,256 326,256 376,512 136,512"/>' +
      '<rect x="116" y="268" width="44" height="170" rx="14" transform="rotate(14 138 353)"/>' +
      '<rect x="352" y="268" width="44" height="170" rx="14" transform="rotate(-14 374 353)"/>' +
      '<rect x="184" y="510" width="52" height="186" rx="12"/><rect x="276" y="510" width="52" height="186" rx="12"/>';
    const windupKey =
      `<circle cx="406" cy="238" r="24" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
      `<circle cx="406" cy="238" r="9" fill="${PALETTE.ink}"/>` +
      `<circle cx="406" cy="298" r="24" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
      `<circle cx="406" cy="298" r="9" fill="${PALETTE.ink}"/>` +
      `<rect x="336" y="258" width="56" height="20" rx="6" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="5"/>`;
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.magenta,
        accentB: PALETTE.yellow,
        seed: hashSeed('babydoll-pencil-action'),
        outlinePts: [
          [186, 256],
          [326, 256],
          [376, 512],
          [136, 512],
        ],
        detailFn: () =>
          windupKey +
          `<circle cx="256" cy="166" r="78" fill="${PALETTE.porcelain}" stroke="${PALETTE.ink}" stroke-width="4.5"/>` +
          `<path d="M 226 98 L 246 146 L 234 176 L 254 226" fill="none" stroke="${PALETTE.ink}" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="${starPath(292, 178, 12, 4, 4)}" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
          `<polygon points="204,264 256,288 308,264 294,296 256,282 218,296" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
          `<rect x="208" y="340" width="96" height="148" rx="6" fill="${PALETTE.ink}" fill-opacity="0.86"/>` +
          `<path d="M 218 400 L 294 400" stroke="${PALETTE.magenta}" stroke-width="6" stroke-dasharray="10 6"/>`,
      });
    }
    return (
      windupKey +
      `<circle cx="152" cy="144" r="54" fill="${PALETTE.ink}" stroke="${PALETTE.magenta}" stroke-width="5"/>` +
      `<circle cx="360" cy="144" r="54" fill="${PALETTE.ink}" stroke="${PALETTE.magenta}" stroke-width="5"/>` +
      `<rect x="116" y="268" width="44" height="170" rx="14" transform="rotate(14 138 353)" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="352" y="268" width="44" height="170" rx="14" transform="rotate(-14 374 353)" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="184" y="510" width="52" height="186" rx="12" fill="${PALETTE.porcelainShade}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="276" y="510" width="52" height="186" rx="12" fill="${PALETTE.porcelainShade}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<polygon points="186,256 326,256 376,512 136,512" fill="${PALETTE.ink}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
      `<polygon points="210,276 302,276 328,496 184,496" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
      `<circle cx="256" cy="166" r="84" fill="${PALETTE.porcelain}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
      `<path d="M 256 82 C 304 82 340 120 340 166 C 340 212 304 250 256 250 C 288 232 304 198 304 166 C 304 134 288 100 256 82 Z" fill="${PALETTE.porcelainShade}"/>` +
      `<path d="M 224 94 L 246 146 L 234 176 L 258 234" fill="none" stroke="${PALETTE.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${starPath(294, 178, 13, 4.5, 4)}" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
      `<polygon points="194,254 256,284 318,254 306,294 256,276 206,294" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="5" stroke-linejoin="round"/>` +
      `<rect x="282" y="424" width="38" height="20" rx="3" transform="rotate(-12 301 434)" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
      halftoneDots(4, 3, 200, 350, 14, 2, PALETTE.magenta, 0.25)
    );
  }

  const sil =
    '<circle cx="132" cy="146" r="64"/><circle cx="380" cy="146" r="64"/>' +
    '<circle cx="256" cy="186" r="102"/>' +
    '<polygon points="122,304 390,304 422,456 90,456"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.magenta,
      accentB: PALETTE.yellow,
      seed: hashSeed('babydoll-pencil-portrait'),
      outlinePts: [
        [154, 186],
        [256, 84],
        [358, 186],
        [390, 304],
        [422, 456],
        [90, 456],
        [122, 304],
      ],
      detailFn: () =>
        `<circle cx="256" cy="186" r="92" fill="${PALETTE.porcelain}" stroke="${PALETTE.ink}" stroke-width="4.5"/>` +
        `<path d="M 222 104 L 246 164 L 230 198 L 258 264" fill="none" stroke="${PALETTE.ink}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<path d="${starPath(302, 198, 15, 5, 4)}" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
        `<polygon points="184,296 256,332 328,296 314,344 256,322 198,344" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3.5"/>`,
    });
  }
  return (
    `<circle cx="132" cy="146" r="62" fill="${PALETTE.ink}" stroke="${PALETTE.magenta}" stroke-width="5"/>` +
    `<circle cx="380" cy="146" r="62" fill="${PALETTE.ink}" stroke="${PALETTE.magenta}" stroke-width="5"/>` +
    `<polygon points="122,304 390,304 422,456 90,456" fill="${PALETTE.ink}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
    `<polygon points="178,314 334,314 352,448 160,448" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
    `<circle cx="256" cy="186" r="98" fill="${PALETTE.porcelain}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
    `<path d="M 256 88 C 314 88 354 134 354 186 C 354 238 314 284 256 284 C 294 264 312 226 312 186 C 312 146 294 108 256 88 Z" fill="${PALETTE.porcelainShade}"/>` +
    `<path d="M 220 100 L 246 164 L 230 202 L 260 272" fill="none" stroke="${PALETTE.ink}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${starPath(302, 198, 16, 5.5, 4)}" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
    `<polygon points="180,294 256,332 332,294 316,348 256,322 196,348" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="5.5" stroke-linejoin="round"/>` +
    `<rect x="176" y="388" width="44" height="22" rx="3" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3.5"/>`
  );
}

function renderBlueWitch(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  if (isAction) {
    const sil =
      '<polygon points="256,42 152,188 188,218 88,684 256,646 424,684 324,218 360,188"/>';
    const sigilRing =
      `<circle cx="256" cy="368" r="118" fill="none" stroke="${PALETTE.cyan}" stroke-width="4" stroke-dasharray="14 8"/>` +
      waveRibbon(124, 368, 388, 368, 16, 3, PALETTE.cyan, 4);
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.cyan,
        accentB: PALETTE.cobalt,
        seed: hashSeed('bluewitch-pencil-action'),
        outlinePts: [
          [256, 42],
          [360, 188],
          [324, 218],
          [424, 684],
          [256, 646],
          [88, 684],
          [188, 218],
          [152, 188],
        ],
        detailFn: () =>
          `<polygon points="256,56 176,184 336,184" fill="${PALETTE.cobalt}" fill-opacity="0.72" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          `<path d="M 206 164 L 306 164 L 296 226 L 216 226 Z" fill="${PALETTE.ink}"/>` +
          `<rect x="224" y="182" width="64" height="10" rx="5" fill="${PALETTE.cyan}"/>` +
          sigilRing +
          `<path d="M 140 580 L 372 580" stroke="${PALETTE.cobalt}" stroke-width="6" stroke-dasharray="18 8"/>`,
      });
    }
    return (
      `<polygon points="256,42 152,188 188,218 88,684 256,646 424,684 324,218 360,188" fill="${PALETTE.cobaltDark}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
      `<polygon points="256,54 166,184 202,216 112,664 250,636 256,222" fill="${PALETTE.cobalt}"/>` +
      `<path d="M 202 162 L 310 162 L 296 228 L 216 228 Z" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="3"/>` +
      `<rect x="224" y="182" width="64" height="10" rx="5" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
      `<path d="M 192 246 L 122 652 M 320 246 L 390 652" fill="none" stroke="${PALETTE.cyan}" stroke-width="4.5" stroke-linecap="round"/>` +
      sigilRing +
      `<circle cx="256" cy="368" r="32" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="4"/>` +
      `<polygon points="256,342 276,368 256,394 236,368" fill="${PALETTE.cyan}"/>`
    );
  }

  const sil =
    '<polygon points="256,42 132,208 172,238 92,456 420,456 340,238 380,208"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.cyan,
      accentB: PALETTE.cobalt,
      seed: hashSeed('bluewitch-pencil-portrait'),
      outlinePts: [
        [256, 42],
        [380, 208],
        [340, 238],
        [420, 456],
        [92, 456],
        [172, 238],
        [132, 208],
      ],
      detailFn: () =>
        `<path d="M 196 172 L 316 172 L 302 252 L 210 252 Z" fill="${PALETTE.ink}"/>` +
        `<rect x="218" y="198" width="76" height="12" rx="6" fill="${PALETTE.cyan}"/>` +
        `<circle cx="256" cy="340" r="72" fill="${PALETTE.cobalt}" fill-opacity="0.22" stroke="${PALETTE.cyan}" stroke-width="4" stroke-dasharray="12 6"/>` +
        waveRibbon(132, 340, 380, 340, 14, 3, PALETTE.cyan, 4),
    });
  }
  return (
    `<polygon points="256,42 132,208 172,238 92,456 420,456 340,238 380,208" fill="${PALETTE.cobaltDark}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
    `<polygon points="256,56 146,204 186,236 112,446 256,446 256,236" fill="${PALETTE.cobalt}"/>` +
    `<path d="M 194 168 L 318 168 L 302 252 L 210 252 Z" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="3.5"/>` +
    `<rect x="218" y="198" width="76" height="12" rx="6" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
    `<circle cx="256" cy="346" r="78" fill="none" stroke="${PALETTE.cyan}" stroke-width="4.5" stroke-dasharray="14 8"/>` +
    `<circle cx="256" cy="346" r="38" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="4"/>` +
    waveRibbon(128, 346, 384, 346, 14, 3, PALETTE.cyan, 4) +
    halftoneDots(4, 3, 286, 280, 14, 2, PALETTE.cyan, 0.28)
  );
}

function renderDogsFromUniverse(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  if (isAction) {
    const sil =
      '<polygon points="108,286 154,194 184,244 216,184 226,254 344,274 422,238 388,334 428,464 366,464 328,386 244,412 192,522 132,522 174,404 102,424 68,360 116,324"/>' +
      '<polygon points="134,504 202,440 286,440 342,504 378,616 322,616 286,544 196,544 150,616 92,616"/>';
    const pulseRings =
      `<circle cx="196" cy="328" r="14" fill="none" stroke="${PALETTE.yellow}" stroke-width="4"/>` +
      `<circle cx="196" cy="328" r="28" fill="none" stroke="${PALETTE.cyan}" stroke-width="3" stroke-dasharray="8 6"/>` +
      `<circle cx="196" cy="328" r="42" fill="none" stroke="${PALETTE.violet}" stroke-width="2.5" stroke-dasharray="5 7"/>`;
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.cyan,
        accentB: PALETTE.yellow,
        seed: hashSeed('dogs-pencil-action'),
        outlinePts: [
          [108, 286],
          [154, 194],
          [216, 184],
          [344, 274],
          [422, 238],
          [388, 334],
          [428, 464],
          [192, 522],
          [68, 360],
        ],
        detailFn: () =>
          `<path d="${starPath(146, 294, 14, 5, 4)}" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
          `<rect x="180" y="294" width="22" height="58" rx="6" transform="rotate(24 191 323)" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
          pulseRings +
          `<rect x="236" y="316" width="84" height="52" rx="8" fill="${PALETTE.violet}" fill-opacity="0.72" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
          sparkArc([[380, 292], [446, 272]], PALETTE.cyan, 4) +
          sparkArc([[396, 356], [462, 342]], PALETTE.yellow, 4),
      });
    }
    return (
      `<polygon points="108,286 154,194 184,244 216,184 226,254 344,274 422,238 388,334 428,464 366,464 328,386 244,412 192,522 132,522 174,404 102,424 68,360 116,324" fill="${PALETTE.charcoal}" stroke="${PALETTE.cyan}" stroke-width="6" stroke-linejoin="round"/>` +
      `<polygon points="134,504 202,440 286,440 342,504 378,616 322,616 286,544 196,544 150,616 92,616" fill="${PALETTE.graphite}" stroke="${PALETTE.violet}" stroke-width="5" stroke-linejoin="round"/>` +
      `<polygon points="154,194 184,244 216,184 226,254 344,274 260,342 152,324" fill="${PALETTE.slate}"/>` +
      `<path d="${starPath(146, 294, 15, 5.5, 4)}" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
      `<rect x="180" y="294" width="22" height="58" rx="6" transform="rotate(24 191 323)" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
      `<rect x="234" y="316" width="88" height="54" rx="8" fill="${PALETTE.violetDark}" stroke="${PALETTE.cyan}" stroke-width="4"/>` +
      pulseRings +
      sparkArc([[366, 286], [446, 266]], PALETTE.cyan, 4.5) +
      sparkArc([[384, 344], [460, 328]], PALETTE.yellow, 4.5)
    );
  }

  const sil =
    '<polygon points="148,140 184,78 216,154 296,154 328,78 364,140 384,256 340,344 378,448 134,448 172,344 128,256"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.cyan,
      accentB: PALETTE.yellow,
      seed: hashSeed('dogs-pencil-portrait'),
      outlinePts: [
        [148, 140],
        [184, 78],
        [216, 154],
        [296, 154],
        [328, 78],
        [364, 140],
        [384, 256],
        [378, 448],
        [134, 448],
        [128, 256],
      ],
      detailFn: () =>
        `<path d="${starPath(214, 224, 14, 5, 4)}" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
        `<path d="${starPath(298, 224, 14, 5, 4)}" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
        `<polygon points="236,276 276,276 256,304" fill="${PALETTE.ink}"/>` +
        `<rect x="176" y="336" width="160" height="32" rx="14" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
        `<circle cx="216" cy="352" r="8" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2"/>` +
        `<circle cx="256" cy="352" r="8" fill="${PALETTE.violet}" stroke="${PALETTE.ink}" stroke-width="2"/>` +
        `<circle cx="296" cy="352" r="8" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2"/>`,
    });
  }
  return (
    `<polygon points="74,238 104,174 134,242 152,374 88,374" fill="${PALETTE.violetDark}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
    `<polygon points="438,238 408,174 378,242 360,374 424,374" fill="${PALETTE.violetDark}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
    `<polygon points="148,140 184,78 216,154 296,154 328,78 364,140 384,256 340,344 378,448 134,448 172,344 128,256" fill="${PALETTE.charcoal}" stroke="${PALETTE.cyan}" stroke-width="6" stroke-linejoin="round"/>` +
    `<polygon points="184,90 214,158 256,158 256,338 176,338 138,254" fill="${PALETTE.graphite}"/>` +
    `<path d="${starPath(214, 224, 15, 5.5, 4)}" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
    `<path d="${starPath(298, 224, 15, 5.5, 4)}" fill="${PALETTE.cyan}" stroke="${PALETTE.paper}" stroke-width="2"/>` +
    `<polygon points="236,276 276,276 256,304" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="3"/>` +
    `<rect x="172" y="336" width="168" height="34" rx="16" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
    `<circle cx="216" cy="353" r="9" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
    `<circle cx="256" cy="353" r="9" fill="${PALETTE.violet}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` +
    `<circle cx="296" cy="353" r="9" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="2.5"/>`
  );
}

function renderDjDavid(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  const eqBars = (baseY) =>
    [0, 1, 2, 3, 4, 5, 6]
      .map((i) => {
        const bh = [34, 62, 44, 78, 52, 68, 38][i];
        const bx = 114 + i * 42;
        const fill = i % 2 === 0 ? PALETTE.yellow : PALETTE.magenta;
        return `<rect x="${bx}" y="${baseY - bh}" width="24" height="${bh}" rx="4" fill="${fill}" stroke="${PALETTE.ink}" stroke-width="3.5"/>`;
      })
      .join('');
  if (isAction) {
    const sil =
      '<path d="M 192 92 C 232 42 332 44 338 118 L 324 196 L 378 242 L 414 358 L 368 416 L 396 520 L 116 520 L 144 416 L 98 358 L 134 242 L 188 196 Z"/>' +
      '<rect x="166" y="516" width="68" height="184" rx="14"/><rect x="278" y="516" width="68" height="184" rx="14"/>';
    const deck =
      `<rect x="122" y="352" width="268" height="128" rx="12" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<circle cx="188" cy="416" r="42" fill="${PALETTE.ink}" stroke="${PALETTE.yellow}" stroke-width="4"/>` +
      `<circle cx="188" cy="416" r="14" fill="${PALETTE.magenta}"/>` +
      `<circle cx="324" cy="416" r="42" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="4"/>` +
      `<circle cx="324" cy="416" r="14" fill="${PALETTE.yellow}"/>` +
      `<rect x="242" y="388" width="28" height="56" rx="4" fill="${PALETTE.charcoal}" stroke="${PALETTE.paper}" stroke-width="2.5"/>`;
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.yellow,
        accentB: PALETTE.magenta,
        seed: hashSeed('djdavid-pencil-action'),
        outlinePts: [
          [192, 92],
          [338, 118],
          [378, 242],
          [396, 520],
          [116, 520],
          [134, 242],
        ],
        detailFn: () =>
          `<rect x="184" y="138" width="144" height="36" rx="10" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          `<circle cx="164" cy="156" r="24" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          `<circle cx="348" cy="156" r="24" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          deck +
          eqBars(336),
      });
    }
    return (
      eqBars(242) +
      `<path d="M 192 92 C 232 42 332 44 338 118 L 324 196 L 378 242 L 414 358 L 368 416 L 396 520 L 116 520 L 144 416 L 98 358 L 134 242 L 188 196 Z" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
      `<rect x="166" y="516" width="68" height="184" rx="14" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="278" y="516" width="68" height="184" rx="14" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="180" y="136" width="152" height="38" rx="10" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
      `<path d="M 190 144 L 322 144 L 306 168 L 190 168 Z" fill="${PALETTE.magenta}" fill-opacity="0.55"/>` +
      `<circle cx="164" cy="156" r="26" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
      `<circle cx="348" cy="156" r="26" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="5"/>` +
      `<rect x="180" y="256" width="46" height="28" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
      `<rect x="286" y="256" width="46" height="28" rx="4" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
      deck
    );
  }

  const sil =
    '<path d="M 172 96 C 220 34 344 40 352 132 L 336 228 L 414 282 L 424 452 L 88 452 L 98 282 L 176 228 Z"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.yellow,
      accentB: PALETTE.magenta,
      seed: hashSeed('djdavid-pencil-portrait'),
      outlinePts: [
        [172, 96],
        [352, 132],
        [414, 282],
        [424, 452],
        [88, 452],
        [98, 282],
      ],
      detailFn: () =>
        `<rect x="164" y="156" width="184" height="44" rx="12" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
        `<circle cx="144" cy="178" r="30" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
        `<circle cx="368" cy="178" r="30" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
        `<rect x="166" y="314" width="64" height="40" rx="5" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
        `<rect x="282" y="314" width="64" height="40" rx="5" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="3.5"/>`,
    });
  }
  return (
    eqBars(212) +
    `<path d="M 172 96 C 220 34 344 40 352 132 L 336 228 L 414 282 L 424 452 L 88 452 L 98 282 L 176 228 Z" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
    `<rect x="164" y="156" width="184" height="44" rx="12" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
    `<path d="M 174 166 L 334 166 L 310 192 L 174 192 Z" fill="${PALETTE.magenta}" fill-opacity="0.6"/>` +
    `<circle cx="144" cy="178" r="32" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
    `<circle cx="368" cy="178" r="32" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
    `<rect x="166" y="314" width="66" height="42" rx="5" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
    `<rect x="280" y="314" width="66" height="42" rx="5" fill="${PALETTE.magenta}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
    `<circle cx="256" cy="396" r="24" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="4"/>`
  );
}

function renderElectricForest(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  const insulators = (cy) =>
    `<rect x="202" y="${cy}" width="108" height="22" rx="11" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="4.5"/>` +
    `<rect x="210" y="${cy + 24}" width="92" height="20" rx="10" fill="${PALETTE.paperShade}" stroke="${PALETTE.ink}" stroke-width="4.5"/>`;
  if (isAction) {
    const sil =
      '<path d="M 186 218 L 106 108 L 166 132 L 204 58 L 244 134 L 256 46 L 274 134 L 314 58 L 348 132 L 406 108 L 326 218 L 378 336 L 342 520 L 406 688 L 294 648 L 256 704 L 218 648 L 106 688 L 170 520 L 134 336 Z"/>';
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.mercyGreen,
        accentB: PALETTE.cyan,
        seed: hashSeed('forest-pencil-action'),
        outlinePts: [
          [186, 218],
          [106, 108],
          [256, 46],
          [406, 108],
          [326, 218],
          [378, 336],
          [406, 688],
          [256, 704],
          [106, 688],
          [134, 336],
        ],
        detailFn: () =>
          `<circle cx="256" cy="224" r="30" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          insulators(286) +
          `<path d="M 184 374 Q 256 420 328 374" fill="none" stroke="${PALETTE.mercyGreen}" stroke-width="10" stroke-linecap="round"/>` +
          sparkArc([[106, 108], [160, 210], [218, 224]], PALETTE.cyan, 4) +
          sparkArc([[406, 108], [352, 210], [294, 224]], PALETTE.cyan, 4),
      });
    }
    return (
      `<path d="M 186 218 L 106 108 L 166 132 L 204 58 L 244 134 L 256 46 L 274 134 L 314 58 L 348 132 L 406 108 L 326 218 L 378 336 L 342 520 L 406 688 L 294 648 L 256 704 L 218 648 L 106 688 L 170 520 L 134 336 Z" fill="${PALETTE.charcoal}" stroke="${PALETTE.mercyGreen}" stroke-width="6" stroke-linejoin="round"/>` +
      `<path d="M 206 232 L 256 232 L 240 650 L 134 670 L 182 518 L 148 338 Z" fill="${PALETTE.graphite}"/>` +
      `<circle cx="256" cy="224" r="32" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="5"/>` +
      `<circle cx="256" cy="224" r="14" fill="${PALETTE.cyan}"/>` +
      insulators(286) +
      `<path d="M 180 390 C 216 440 296 440 332 390" fill="none" stroke="${PALETTE.mercyGreen}" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="M 180 480 C 216 520 296 520 332 480" fill="none" stroke="${PALETTE.copper}" stroke-width="9" stroke-linecap="round"/>` +
      sparkArc([[106, 108], [160, 210], [218, 224]], PALETTE.cyan, 4.5) +
      sparkArc([[406, 108], [352, 210], [294, 224]], PALETTE.cyan, 4.5)
    );
  }

  const sil =
    '<path d="M 164 196 L 78 96 L 146 116 L 188 46 L 236 124 L 256 42 L 278 124 L 326 46 L 366 116 L 434 96 L 348 196 L 404 452 L 108 452 Z"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.mercyGreen,
      accentB: PALETTE.cyan,
      seed: hashSeed('forest-pencil-portrait'),
      outlinePts: [
        [164, 196],
        [78, 96],
        [256, 42],
        [434, 96],
        [348, 196],
        [404, 452],
        [108, 452],
      ],
      detailFn: () =>
        `<circle cx="256" cy="228" r="36" fill="${PALETTE.cyan}" stroke="${PALETTE.ink}" stroke-width="4.5"/>` +
        insulators(294) +
        `<path d="M 164 388 Q 256 424 348 388" fill="none" stroke="${PALETTE.mercyGreen}" stroke-width="12" stroke-linecap="round"/>` +
        sparkArc([[88, 114], [156, 206], [216, 228]], PALETTE.cyan, 4) +
        sparkArc([[424, 114], [356, 206], [296, 228]], PALETTE.cyan, 4),
    });
  }
  return (
    `<path d="M 164 196 L 78 96 L 146 116 L 188 46 L 236 124 L 256 42 L 278 124 L 326 46 L 366 116 L 434 96 L 348 196 L 404 452 L 108 452 Z" fill="${PALETTE.charcoal}" stroke="${PALETTE.mercyGreen}" stroke-width="6" stroke-linejoin="round"/>` +
    `<polygon points="174,202 256,202 240,444 122,444" fill="${PALETTE.graphite}"/>` +
    `<circle cx="256" cy="228" r="38" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="5"/>` +
    `<circle cx="256" cy="228" r="16" fill="${PALETTE.cyan}"/>` +
    insulators(294) +
    `<path d="M 162 392 Q 256 428 350 392" fill="none" stroke="${PALETTE.mercyGreen}" stroke-width="14" stroke-linecap="round"/>` +
    `<circle cx="144" cy="116" r="16" fill="${PALETTE.copper}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
    `<circle cx="368" cy="116" r="16" fill="${PALETTE.copper}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
    sparkArc([[88, 114], [156, 206], [216, 228]], PALETTE.cyan, 4.5) +
    sparkArc([[424, 114], [356, 206], [296, 228]], PALETTE.cyan, 4.5)
  );
}

function renderIndestructible(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  const tallyMarks = (tx, ty) =>
    [0, 1, 2, 3].map((i) => `<path d="M ${tx + i * 10} ${ty} L ${tx + i * 10} ${ty + 28}" stroke="${PALETTE.crimson}" stroke-width="4" stroke-linecap="round"/>`).join('') +
    `<path d="M ${tx - 4} ${ty + 24} L ${tx + 36} ${ty + 4}" stroke="${PALETTE.crimson}" stroke-width="4" stroke-linecap="round"/>`;

  if (isAction) {
    const sil =
      '<polygon points="74,202 184,166 200,92 312,92 328,166 438,202 418,366 376,366 376,522 136,522 136,366 94,366"/>' +
      '<rect x="144" y="518" width="96" height="184" rx="12"/><rect x="272" y="518" width="96" height="184" rx="12"/>';
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.crimson,
        accentB: PALETTE.yellow,
        seed: hashSeed('indestructible-pencil-action'),
        outlinePts: [
          [74, 202],
          [200, 92],
          [312, 92],
          [438, 202],
          [418, 366],
          [376, 522],
          [136, 522],
          [94, 366],
        ],
        detailFn: () =>
          `<rect x="204" y="106" width="104" height="82" rx="10" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
          `<rect x="218" y="136" width="76" height="16" rx="4" fill="${PALETTE.crimson}"/>` +
          `<rect x="164" y="294" width="184" height="24" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
          tallyMarks(112, 236) +
          tallyMarks(364, 236),
      });
    }
    return (
      `<polygon points="74,202 184,166 200,92 312,92 328,166 438,202 418,366 376,366 376,522 136,522 136,366 94,366" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
      `<polygon points="84,206 256,176 256,514 142,514 142,360 100,360" fill="${PALETTE.graphite}"/>` +
      `<rect x="144" y="518" width="96" height="184" rx="12" fill="${PALETTE.graphite}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="272" y="518" width="96" height="184" rx="12" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="200" y="94" width="112" height="92" rx="12" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="6"/>` +
      `<rect x="214" y="132" width="84" height="16" rx="4" fill="${PALETTE.crimson}" stroke="${PALETTE.yellow}" stroke-width="2.5"/>` +
      `<rect x="158" y="292" width="196" height="26" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
      tallyMarks(110, 236) +
      tallyMarks(366, 236) +
      `<path d="M 190 364 L 256 410 L 322 364 L 306 468 L 256 490 L 206 468 Z" fill="${PALETTE.crimson}" stroke="${PALETTE.ink}" stroke-width="5"/>`
    );
  }

  const sil =
    '<polygon points="56,220 176,168 194,76 318,76 336,168 456,220 434,448 78,448"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.crimson,
      accentB: PALETTE.yellow,
      seed: hashSeed('indestructible-pencil-portrait'),
      outlinePts: [
        [56, 220],
        [194, 76],
        [318, 76],
        [456, 220],
        [434, 448],
        [78, 448],
      ],
      detailFn: () =>
        `<rect x="196" y="88" width="120" height="98" rx="12" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
        `<rect x="212" y="128" width="88" height="18" rx="4" fill="${PALETTE.crimson}"/>` +
        `<rect x="148" y="310" width="216" height="28" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
        tallyMarks(102, 244) +
        tallyMarks(374, 244),
    });
  }
  return (
    `<polygon points="56,220 176,168 194,76 318,76 336,168 456,220 434,448 78,448" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7" stroke-linejoin="round"/>` +
    `<polygon points="66,224 256,178 256,440 86,440" fill="${PALETTE.graphite}"/>` +
    `<rect x="194" y="78" width="124" height="106" rx="12" fill="${PALETTE.charcoal}" stroke="${PALETTE.ink}" stroke-width="7"/>` +
    `<rect x="210" y="124" width="92" height="18" rx="4" fill="${PALETTE.crimson}" stroke="${PALETTE.yellow}" stroke-width="2.5"/>` +
    `<rect x="144" y="308" width="224" height="28" rx="4" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="4.5"/>` +
    tallyMarks(102, 240) +
    tallyMarks(374, 240) +
    `<polygon points="196,358 316,358 296,432 256,446 216,432" fill="${PALETTE.crimson}" stroke="${PALETTE.ink}" stroke-width="5"/>`
  );
}

function renderTheListener(variant, w, h, idPrefix) {
  const isPencil = variant.startsWith('pencil');
  const isAction = variant.endsWith('action');
  const dishes = (cy) =>
    `<path d="M 164 ${cy - 44} C 102 ${cy - 44} 96 ${cy + 44} 164 ${cy + 44} Z" fill="${PALETTE.graphite}" stroke="${PALETTE.cyan}" stroke-width="5"/>` +
    `<path d="M 348 ${cy - 44} C 410 ${cy - 44} 416 ${cy + 44} 348 ${cy + 44} Z" fill="${PALETTE.graphite}" stroke="${PALETTE.cyan}" stroke-width="5"/>` +
    `<circle cx="136" cy="${cy}" r="10" fill="${PALETTE.violet}"/>` +
    `<circle cx="376" cy="${cy}" r="10" fill="${PALETTE.violet}"/>`;

  if (isAction) {
    const sil =
      '<circle cx="136" cy="148" r="52"/><circle cx="376" cy="148" r="52"/>' +
      '<path d="M 256 76 C 204 76 174 116 174 182 L 92 296 L 116 544 L 396 544 L 420 296 L 338 182 C 338 116 308 76 256 76 Z"/>' +
      '<rect x="166" y="540" width="66" height="156" rx="12"/><rect x="280" y="540" width="66" height="156" rx="12"/>';
    if (isPencil) {
      return buildRoughPencilBackdrop({
        idPrefix,
        w,
        h,
        silhouetteSvg: sil,
        accentA: PALETTE.violet,
        accentB: PALETTE.cyan,
        seed: hashSeed('listener-pencil-action'),
        outlinePts: [
          [256, 76],
          [338, 182],
          [420, 296],
          [396, 544],
          [116, 544],
          [92, 296],
          [174, 182],
        ],
        detailFn: () =>
          dishes(152) +
          `<path d="M 204 116 L 308 116 L 298 196 L 214 196 Z" fill="${PALETTE.ink}"/>` +
          `<rect x="224" y="148" width="64" height="10" rx="5" fill="${PALETTE.violet}"/>` +
          `<circle cx="196" cy="480" r="28" fill="${PALETTE.copper}" fill-opacity="0.7" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
          `<circle cx="316" cy="480" r="28" fill="${PALETTE.copper}" fill-opacity="0.7" stroke="${PALETTE.ink}" stroke-width="3.5"/>` +
          waveRibbon(72, 344, 440, 344, 22, 4, PALETTE.cyan, 4) +
          waveRibbon(92, 384, 420, 384, 14, 3, PALETTE.violet, 3.5),
      });
    }
    return (
      dishes(152) +
      `<path d="M 256 76 C 204 76 174 116 174 182 L 92 296 L 116 544 L 396 544 L 420 296 L 338 182 C 338 116 308 76 256 76 Z" fill="${PALETTE.charcoal}" stroke="${PALETTE.violet}" stroke-width="6" stroke-linejoin="round"/>` +
      `<polygon points="256,82 184,182 104,300 124,536 250,536" fill="${PALETTE.graphite}"/>` +
      `<rect x="166" y="540" width="66" height="156" rx="12" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="4"/>` +
      `<rect x="280" y="540" width="66" height="156" rx="12" fill="${PALETTE.ink}" stroke="${PALETTE.cyan}" stroke-width="4"/>` +
      `<path d="M 202 114 L 310 114 L 298 196 L 214 196 Z" fill="${PALETTE.ink}" stroke="${PALETTE.paper}" stroke-width="2.5"/>` +
      `<rect x="224" y="148" width="64" height="10" rx="5" fill="${PALETTE.violet}"/>` +
      `<circle cx="196" cy="480" r="30" fill="${PALETTE.copper}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
      `<circle cx="316" cy="480" r="30" fill="${PALETTE.copper}" stroke="${PALETTE.ink}" stroke-width="4"/>` +
      waveRibbon(74, 344, 438, 344, 22, 4, PALETTE.cyan, 4.5) +
      waveRibbon(96, 384, 416, 384, 14, 3, PALETTE.violet, 3.5)
    );
  }

  const sil =
    '<circle cx="136" cy="184" r="58"/><circle cx="376" cy="184" r="58"/>' +
    '<path d="M 256 74 C 190 74 156 122 156 206 L 86 300 L 106 448 L 406 448 L 426 300 L 356 206 C 356 122 322 74 256 74 Z"/>';
  if (isPencil) {
    return buildRoughPencilBackdrop({
      idPrefix,
      w,
      h,
      silhouetteSvg: sil,
      accentA: PALETTE.violet,
      accentB: PALETTE.cyan,
      seed: hashSeed('listener-pencil-portrait'),
      outlinePts: [
        [256, 74],
        [356, 206],
        [426, 300],
        [406, 448],
        [106, 448],
        [86, 300],
        [156, 206],
      ],
      detailFn: () =>
        dishes(186) +
        `<path d="M 196 132 L 316 132 L 302 224 L 210 224 Z" fill="${PALETTE.ink}"/>` +
        `<rect x="218" y="172" width="76" height="12" rx="6" fill="${PALETTE.violet}"/>` +
        waveRibbon(78, 338, 434, 338, 18, 4, PALETTE.cyan, 4) +
        waveRibbon(102, 376, 410, 376, 12, 3, PALETTE.violet, 3.5),
    });
  }
  return (
    dishes(186) +
    `<path d="M 256 74 C 190 74 156 122 156 206 L 86 300 L 106 448 L 406 448 L 426 300 L 356 206 C 356 122 322 74 256 74 Z" fill="${PALETTE.charcoal}" stroke="${PALETTE.violet}" stroke-width="6" stroke-linejoin="round"/>` +
    `<polygon points="256,80 166,208 98,304 116,440 250,440" fill="${PALETTE.graphite}"/>` +
    `<path d="M 196 132 L 316 132 L 302 224 L 210 224 Z" fill="${PALETTE.ink}" stroke="${PALETTE.paper}" stroke-width="3"/>` +
    `<rect x="218" y="172" width="76" height="12" rx="6" fill="${PALETTE.violet}" stroke="${PALETTE.cyan}" stroke-width="2"/>` +
    waveRibbon(78, 338, 434, 338, 18, 4, PALETTE.cyan, 4.5) +
    waveRibbon(102, 376, 410, 376, 12, 3, PALETTE.violet, 3.5)
  );
}

const RENDERERS = Object.freeze({
  fourlah: renderFourlah,
  'the-shadow': renderTheShadow,
  'baby-doll': renderBabyDoll,
  'blue-witch': renderBlueWitch,
  'dogs-from-universe': renderDogsFromUniverse,
  'dj-david': renderDjDavid,
  'electric-forest': renderElectricForest,
  indestructible: renderIndestructible,
  'the-listener': renderTheListener,
});

function createGuard(visualRenderingMode, rationale, extraProhibited = []) {
  return {
    canonLevel: 'lore',
    autoMergeForbidden: true,
    rules: ['CAN-0004', 'CAN-0005', 'CAN-0011'],
    visualRenderingMode,
    facelessOrStylizedOnly: true,
    photorealismForbidden: true,
    realPersonLikenessForbidden: true,
    sacredDepictionForbidden: true,
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'photorealistic-face', ...extraProhibited],
    rationale,
  };
}

export const EXTENDED_LORE_CAST_SPECS = Object.freeze([
  {
    slug: 'fourlah',
    characterId: 'fourlah-batteries',
    canonRecordId: 'char_a_lah',
    dir: 'fourlah',
    name: '4-LAH / THE BATTERIES',
    displayName: '4-LAH / THE BATTERIES',
    callsign: '4-LAH/THE BATTERIES',
    aliases: ['4-LAH', 'A-LAH', 'THE BATTERIES', 'Circuit-Four'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'stylized-faceless',
    silhouette:
      'Faceless modular four-cell battery conduit construct with copper busbars, glowing capacitor visor slit, and braided voltage cables',
    outfit: 'Insulated industrial capacitor shell plates marked with 01-04 charge gauges and hazard-yellow tape',
    summary:
      'Strictly fictional distributed power conduit ensemble within MoonWitness lore; CAN-0004 and CAN-0011 forbid any auto-merge or sacred association.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'recognizable-face', 'religious-figure-merge'],
    canonGuard: createGuard(
      'faceless-stylized',
      'Non-humanoid faceless battery construct; CAN-0004 strictly forbids alias auto-merge and CAN-0011 forbids any religious figure association.',
      ['recognizable-face', 'religious-figure-merge']
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: '4-LAH / THE BATTERIES cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: '4-LAH / THE BATTERIES rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: '4-LAH / THE BATTERIES cel quad-cell action' },
      { id: 'pencil-action', width: 512, height: 768, title: '4-LAH / THE BATTERIES rough-pencil quad-cell action' },
      { id: 'cel-relay', width: 512, height: 512, title: '4-LAH / THE BATTERIES cel four-cell relay conduit' },
      { id: 'pencil-relay', width: 512, height: 512, title: '4-LAH / THE BATTERIES rough-pencil four-cell relay' },
    ],
  },
  {
    slug: 'the-shadow',
    characterId: 'the-shadow',
    canonRecordId: 'char_the_shadow',
    dir: 'extended',
    name: 'The Shadow',
    displayName: 'The Shadow',
    callsign: 'THE SHADOW',
    aliases: ['The Shadow', 'Shadow Signal', 'Zero-Phase'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'silhouette-only',
    silhouette: 'Sharp ink-void cloaked silhouette with torn trench-coat hem, zero facial features, and glowing violet frequency slit',
    outfit: 'Layered blackout cloak etched with white pencil crosshatching and cassette-tape bandolier',
    summary: 'Operates in the blind spots of the RockSoul relay grid, cataloguing erased transmissions.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'recognizable-face'],
    canonGuard: createGuard(
      'silhouette',
      'Pure silhouette-only faceless observer; zero photorealistic features per CAN-0004 and CAN-0011.',
      ['recognizable-face']
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'The Shadow cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'The Shadow rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'The Shadow cel action cloak' },
      { id: 'pencil-action', width: 512, height: 768, title: 'The Shadow rough-pencil action cloak' },
    ],
  },
  {
    slug: 'baby-doll',
    characterId: 'baby-doll',
    canonRecordId: 'lore_baby_doll',
    dir: 'extended',
    name: 'Baby Doll',
    displayName: 'Baby Doll',
    callsign: 'BABY DOLL',
    aliases: ['Baby Doll', 'Porcelain Static', 'Doll-Mask'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'stylized-faceless',
    silhouette: 'Stylized marionette sentinel wearing a blank cracked porcelain mask, oversized ribbon collar, and inked wind-up key on back',
    outfit: 'Ruffled monochrome zine pinafore pinned with magenta safety tags and stitched fingerless sleeves',
    summary: 'Stylized blank-mask sentinel patrolling underground stage alleys with kinetic wind-up chimes.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'recognizable-face'],
    canonGuard: createGuard(
      'faceless-stylized',
      'Blank porcelain-mask stylized puppet design; prohibits human likeness and sacred iconography.',
      ['recognizable-face']
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'Baby Doll cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'Baby Doll rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'Baby Doll cel wind-up action' },
      { id: 'pencil-action', width: 512, height: 768, title: 'Baby Doll rough-pencil wind-up action' },
    ],
  },
  {
    slug: 'blue-witch',
    characterId: 'blue-witch',
    canonRecordId: 'char_blue_witch',
    dir: 'extended',
    name: 'Blue Witch',
    displayName: 'Blue Witch',
    callsign: 'BLUE WITCH',
    aliases: ['Blue Witch', 'Cobalt Weaver', 'Frequency Hex'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'stylized-faceless',
    silhouette: 'Tall angular mage silhouette under a sweeping cobalt crescent hood and hovering waveform sigil ring',
    outfit: 'Ink-dipped cobalt cloak lined with cyan oscilloscope trim and sketched chalk talismans',
    summary: 'Manipulates cobalt-band interference to shield hidden enclaves across the Blue Inversion era.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness'],
    canonGuard: createGuard(
      'stylized',
      'Stylized shadowed-hood spellcaster; CAN-0004 and CAN-0011 enforce pure fictional isolation.'
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'Blue Witch cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'Blue Witch rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'Blue Witch cel waveform action' },
      { id: 'pencil-action', width: 512, height: 768, title: 'Blue Witch rough-pencil waveform action' },
    ],
  },
  {
    slug: 'dogs-from-universe',
    characterId: 'dogs-from-universe',
    canonRecordId: 'char_dogs_from_universe',
    dir: 'extended',
    name: 'Dogs From Universe',
    displayName: 'Dogs From Universe',
    callsign: 'DOGS FROM UNIVERSE',
    aliases: ['Dogs From Universe', 'Cosmic Pack', 'Orbital Hounds'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'stylized-faceless',
    silhouette: 'Angular cosmic hound pack silhouettes sketched in starlight cyan chalk with glowing triple-pulse collars',
    outfit: 'Zero-gravity orbital harnesses bearing phosphor-yellow telemetry tags and graphite speedlines',
    summary: 'Interstellar scouts drawn to high-amplitude resonance anomalies across the RockSoul frontier.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness'],
    canonGuard: createGuard(
      'stylized',
      'Non-humanoid stylized cosmic hound pack; strictly fictional CAN-0004/CAN-0011 compliant.'
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'Dogs From Universe cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'Dogs From Universe rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'Dogs From Universe cel pack run' },
      { id: 'pencil-action', width: 512, height: 768, title: 'Dogs From Universe rough-pencil pack run' },
    ],
  },
  {
    slug: 'dj-david',
    characterId: 'dj-david',
    canonRecordId: 'char_dj_david',
    dir: 'extended',
    name: 'DJ David',
    displayName: 'DJ David',
    callsign: 'DJ DAVID',
    aliases: ['DJ David', 'Selector-D', 'Turntable Architect'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'stylized-faceless',
    silhouette: 'Stylized visor-shaded pirate DJ with boxy turntable flight-case, oversized cue headphones, and ink halftone equalizer aura',
    outfit: 'Sleeveless boombox utility jacket covered in yellow cassette stickers and magenta crossfader patches',
    summary: 'Fictional pirate-radio strategist orchestrating citywide tempo shifts; never auto-merged with historical or religious figures.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'historical-figure-merge'],
    canonGuard: createGuard(
      'stylized',
      'Stylized visor-shaded cartoon DJ; CAN-0004 forbids auto-merging with historical or religious figures and CAN-0011 forbids sacred imagery.',
      ['historical-figure-merge']
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'DJ David cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'DJ David rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'DJ David cel turntable action' },
      { id: 'pencil-action', width: 512, height: 768, title: 'DJ David rough-pencil turntable action' },
    ],
  },
  {
    slug: 'electric-forest',
    characterId: 'electric-forest',
    canonRecordId: 'char_electric_forest',
    dir: 'extended',
    name: 'Electric Forest',
    displayName: 'Electric Forest',
    callsign: 'ELECTRIC FOREST',
    aliases: ['Electric Forest', 'Volt Canopy', 'Static Woods'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'silhouette-only',
    silhouette: 'Living canopy guardian formed of knotted graphite tree-trunks, glowing copper-leaf boughs, and arcing cyan static filaments',
    outfit: 'Natural conductive bark armor braided with phosphor moss and porcelain insulator rings',
    summary: 'Sentient conductive woodland acting as both sanctuary and natural amplifier across RockSoul districts.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness'],
    canonGuard: createGuard(
      'silhouette',
      'Botanical electromagnetic biome silhouette; zero human or sacred figure depiction per CAN-0011.'
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'Electric Forest cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'Electric Forest rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'Electric Forest cel canopy surge' },
      { id: 'pencil-action', width: 512, height: 768, title: 'Electric Forest rough-pencil canopy surge' },
    ],
  },
  {
    slug: 'indestructible',
    characterId: 'indestructible',
    canonRecordId: 'char_indestructible',
    dir: 'extended',
    name: 'Indestructible',
    displayName: 'Indestructible',
    callsign: 'INDESTRUCTIBLE',
    aliases: ['Indestructible', 'Iron-Hull', 'Unbroken'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'stylized-faceless',
    silhouette: 'Broad armored vanguard monolith with welded visor slit, notched graphite pauldrons, and crimson fracture tally marks',
    outfit: 'Riveted storm-plate overcoat scarred by lightning welds and cautionary stencil bands',
    summary: 'Frontline sentinel engineered to survive high-voltage convergence storms while bearing structural endurance costs.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'recognizable-face'],
    canonGuard: createGuard(
      'faceless-stylized',
      'Faceless helmeted vanguard construct; obeys CAN-0004, CAN-0011, and world rule wr_06.',
      ['recognizable-face']
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'Indestructible cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'Indestructible rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'Indestructible cel bulwark stance' },
      { id: 'pencil-action', width: 512, height: 768, title: 'Indestructible rough-pencil bulwark stance' },
    ],
  },
  {
    slug: 'the-listener',
    characterId: 'the-listener',
    canonRecordId: 'lore_the_listener',
    dir: 'extended',
    name: 'The Listener',
    displayName: 'The Listener',
    callsign: 'THE LISTENER',
    aliases: ['The Listener', 'Carrier Ear', 'Sub-Static Witness'],
    canonLevel: 'lore',
    autoMergeForbidden: true,
    depictionPolicy: 'silhouette-only',
    silhouette: 'Hooded faceless acoustic archivist framed by twin parabolic ear-dishes and floating rough-pencil waveform ribbons',
    outfit: 'Charcoal field-recording poncho draped over copper coil spools and chalk-numbered reel cases',
    summary: 'Silent acoustic archivist monitoring the unattributed carrier wave humming beneath the RockSoul horizon.',
    prohibitedVariants: ['sacred-figure', 'real-person-likeness', 'recognizable-face'],
    canonGuard: createGuard(
      'faceless-stylized',
      'Faceless hooded archivist figure; CAN-0004 and CAN-0011 prohibit identifiable or sacred depiction.',
      ['recognizable-face']
    ),
    variants: [
      { id: 'cel-portrait', width: 512, height: 512, title: 'The Listener cel portrait' },
      { id: 'pencil-portrait', width: 512, height: 512, title: 'The Listener rough-pencil portrait' },
      { id: 'cel-action', width: 512, height: 768, title: 'The Listener cel parabolic action' },
      { id: 'pencil-action', width: 512, height: 768, title: 'The Listener rough-pencil parabolic action' },
    ],
  },
]);

async function enforceCanonGuards() {
  for (const spec of EXTENDED_LORE_CAST_SPECS) {
    for (const field of ['slug', 'characterId', 'name', 'displayName', 'callsign', 'silhouette', 'outfit', 'summary']) {
      validateCan0011Text(spec[field], 'generate-extended-lore-cast.mjs', `${spec.slug}.${field}`);
    }
    validateCan0011Text(spec.aliases, 'generate-extended-lore-cast.mjs', `${spec.slug}.aliases`);
    validateCanonGuardMetadata(spec, 'generate-extended-lore-cast.mjs', spec.slug, { requireGuards: true });
    const audit = assertCan0004NoAliasAutoMerge(spec.callsign, EXTENDED_LORE_CAST_SPECS);
    if (audit.autoMergeAllowed !== false || !audit.matchedCharacterIds.includes(spec.characterId)) {
      throw new Error(`CAN-0004 alias isolation check failed for ${spec.characterId}`);
    }
  }

  const uiRegistryDist = resolve(packageRoot, '../ui/dist/lib/character-registry.js');
  if (existsSync(uiRegistryDist)) {
    const registryMod = await import(pathToFileURL(uiRegistryDist).href);
    for (const spec of EXTENDED_LORE_CAST_SPECS) {
      const registered = registryMod.getLoreCharacterById?.(spec.characterId);
      if (!registered) {
        throw new Error(`UI character-registry missing lore character ${spec.characterId}`);
      }
      if (registered.canonLevel !== 'lore' || registered.autoMergeForbidden !== true) {
        throw new Error(`UI character-registry guard mismatch for ${spec.characterId}`);
      }
    }
  }
}

async function verifyPngBuffer(buf, relPath, expectedWidth, expectedHeight) {
  if (buf.length === 0 || buf.length > MAX_SPRITE_BYTES) {
    throw new Error(`${relPath}: byte size ${buf.length} outside (0, ${MAX_SPRITE_BYTES}]`);
  }
  const pngSig = '89504e470d0a1a0a';
  if (buf.subarray(0, 8).toString('hex') !== pngSig) {
    throw new Error(`${relPath}: invalid PNG signature`);
  }
  const ihdrColorType = buf[25];
  if (ihdrColorType !== 3) {
    throw new Error(`${relPath}: expected PNG-8 indexed palette (colorType=3), got ${ihdrColorType}`);
  }

  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== expectedWidth || info.height !== expectedHeight) {
    throw new Error(`${relPath}: expected ${expectedWidth}x${expectedHeight}, got ${info.width}x${info.height}`);
  }

  const corners = [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1],
    [6, 6],
    [info.width - 7, 6],
    [6, info.height - 7],
    [info.width - 7, info.height - 7],
  ];
  for (const [x, y] of corners) {
    const alpha = data[(y * info.width + x) * 4 + 3];
    if (alpha !== 0) {
      throw new Error(`${relPath}: exterior pixel (${x},${y}) alpha=${alpha}, expected 0`);
    }
  }

  const cx = Math.floor(info.width / 2);
  const cy = Math.floor(info.height / 2);
  const centerAlpha = data[(cy * info.width + cx) * 4 + 3];
  if (centerAlpha !== 255) {
    throw new Error(`${relPath}: center pixel (${cx},${cy}) alpha=${centerAlpha}, expected 255`);
  }

  let opaqueCount = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] === 255) opaqueCount += 1;
  }
  if (opaqueCount < Math.floor((info.width * info.height) * 0.1)) {
    throw new Error(`${relPath}: insufficient opaque silhouette coverage (${opaqueCount} px)`);
  }
}

/** Generate or verify the 4-LAH / THE BATTERIES & extended lore PNG cast pack. */
export async function generateExtendedLoreCast({ checkOnly = false, rootDir = packageRoot } = {}) {
  await enforceCanonGuards();

  const digests = new Map();
  const entries = [];

  for (const spec of EXTENDED_LORE_CAST_SPECS) {
    const dirRel = `illustrations/rocksoul-universe/${spec.dir}`;
    if (!checkOnly) {
      await mkdir(resolve(rootDir, dirRel), { recursive: true });
    }
    const render = RENDERERS[spec.slug];

    for (const variant of spec.variants) {
      const fileName = `${spec.slug}-${variant.id}.png`;
      const relPath = `${dirRel}/${fileName}`;
      const absPath = resolve(rootDir, relPath);
      const idPrefix = `mw-ext-${spec.slug}-${variant.id}`;
      const body = render(variant.id, variant.width, variant.height, idPrefix);
      const svg = buildSvgDoc(variant.width, variant.height, variant.title, body);

      const pngBuf = await sharp(Buffer.from(svg, 'utf8'))
        .resize(variant.width, variant.height)
        .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10, dither: 0 })
        .toBuffer();

      await verifyPngBuffer(pngBuf, relPath, variant.width, variant.height);

      const sha256 = createHash('sha256').update(pngBuf).digest('hex');
      if (digests.has(sha256)) {
        throw new Error(`Duplicate generated PNG hash between ${digests.get(sha256)} and ${relPath}`);
      }
      digests.set(sha256, relPath);

      if (checkOnly) {
        if (!existsSync(absPath)) {
          throw new Error(`Missing generated asset on disk: ${relPath}`);
        }
        const diskStat = await stat(absPath);
        if (diskStat.size > MAX_SPRITE_BYTES) {
          throw new Error(`${relPath}: on-disk size ${diskStat.size} exceeds ${MAX_SPRITE_BYTES}B`);
        }
        const diskBuf = await readFile(absPath);
        await verifyPngBuffer(diskBuf, relPath, variant.width, variant.height);
        if (!diskBuf.equals(pngBuf)) {
          throw new Error(`${relPath}: on-disk PNG differs from deterministic generator output`);
        }
      } else {
        await atomicWrite(absPath, pngBuf);
      }

      entries.push({
        path: relPath,
        kind: 'character-sprite',
        variant: variant.id,
        subject: spec.characterId,
        format: 'png',
        width: variant.width,
        height: variant.height,
        pack: 'rocksoul-universe',
        domain: 'visual-universe',
        status: 'review',
        license: 'ISC',
        source: 'packages/assets/scripts/generate-extended-lore-cast.mjs',
        bytes: pngBuf.length,
        sha256,
      });
    }
  }

  return entries;
}

const MANIFEST_PATH = resolve(packageRoot, 'manifest.json');
const OWNED_PREFIXES = ['illustrations/rocksoul-universe/fourlah/', 'illustrations/rocksoul-universe/extended/'];

/** Register generated extended lore sprites in manifest.json, replacing only paths this generator owns. */
export async function registerExtendedLoreCast(entries) {
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
  const entries = await generateExtendedLoreCast({ checkOnly });
  if (!checkOnly) {
    await registerExtendedLoreCast(entries);
  }
  stdout.write(
    `${checkOnly ? 'Verified' : 'Generated'} ${entries.length} CAN-0004/CAN-0011 extended lore PNG-8 sprites across ${EXTENDED_LORE_CAST_SPECS.length} characters.\n`
  );
}
