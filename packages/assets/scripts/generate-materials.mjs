import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';
import { validateSvg } from './validate.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = resolve(root, 'manifest.json');
const [INK, GRAPHITE, PAPER, PAPER_RAISED, PAPER_SHADE, CRIMSON, YELLOW, TAPE_GOLD, C] = [
  '#0d0d0d', '#18181c', '#f3efe4', '#fffdf6', '#e3dfd4', '#d1132a', '#ffe031', '#f4d95b', 'currentColor',
];
const f1 = (n) => Math.round(n * 10) / 10;
const rnd = (rng, min, max) => min + rng() * (max - min);
function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function wrapSvg(width, height, title, body, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}"${extra} role="img" aria-label="${title}">` +
    `<title>${title}</title>${body}</svg>\n`;
}
function sketchSegment(p1, p2, rng, jitter = 1.4) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  return `M${f1(x1)} ${f1(y1)}Q${f1((x1 + x2) / 2 + rnd(rng, -jitter, jitter))} ` +
    `${f1((y1 + y2) / 2 + rnd(rng, -jitter, jitter))} ${f1(x2)} ${f1(y2)}`;
}
function clipLineBox(cx, cy, dir, min, max) {
  const [dx, dy] = dir;
  const tx = [(min - cx) / dx, (max - cx) / dx].sort((a, b) => a - b);
  const ty = [(min - cy) / dy, (max - cy) / dy].sort((a, b) => a - b);
  const [t0, t1] = [Math.max(tx[0], ty[0]), Math.min(tx[1], ty[1])];
  if (t1 - t0 < 8) return null;
  return [[cx + dx * t0, cy + dy * t0], [cx + dx * t1, cy + dy * t1]];
}
function buildCrosshatchStrokes(size, step, angleDeg, rng, pad) {
  const out = [];
  const rad = (angleDeg * Math.PI) / 180;
  const [dx, dy] = [Math.cos(rad), Math.sin(rad)];
  for (let off = -size; off <= size; off += step) {
    const seg = clipLineBox(size / 2 - dy * off, size / 2 + dx * off, [dx, dy], pad, size - pad);
    if (!seg) continue;
    const dash = rng() > 0.52 ? ` stroke-dasharray="${f1(rnd(rng, 9, 22))} ${f1(rnd(rng, 2, 5))}"` : '';
    out.push(`<path d="${sketchSegment(seg[0], seg[1], rng, 1.5)}" stroke="${C}" ` +
      `stroke-width="${f1(rnd(rng, 0.9, 1.8))}" stroke-opacity="${f1(rnd(rng, 0.28, 0.7))}"${dash}/>`);
  }
  return out.join('');
}
function buildPencilCrosshatch(slug, dense) {
  const rng = createRng(dense ? 0x51c04b : 0x2a8f19);
  if (!dense) {
    const pid = `mw-materials-${slug}-grid`;
    const step = 8 * Math.SQRT2;
    const strokes = buildCrosshatchStrokes(80, step, 45, rng, 0) + buildCrosshatchStrokes(80, step, -45, rng, 0);
    const flecks = Array.from({ length: 18 }, () =>
      `<circle cx="${f1(rnd(rng, 4, 76))}" cy="${f1(rnd(rng, 4, 76))}" r="${f1(rnd(rng, 0.6, 1.3))}" ` +
      `fill="${C}" fill-opacity="0.32"/>`
    ).join('');
    return `<defs><pattern id="${pid}" width="80" height="80" patternUnits="userSpaceOnUse">` +
      `<g fill="none" stroke-linecap="round">${strokes}</g>${flecks}</pattern></defs>` +
      `<rect x="0" y="0" width="160" height="160" fill="url(#${pid})"/>`;
  }
  const layers = buildCrosshatchStrokes(160, 9, 41, rng, 4) + buildCrosshatchStrokes(160, 10, -47, rng, 4) +
    buildCrosshatchStrokes(160, 22, 12, rng, 4);
  const accents = Array.from({ length: 6 }, () => {
    const [x1, y1] = [rnd(rng, 14, 110), rnd(rng, 18, 138)];
    const d = sketchSegment([x1, y1], [x1 + rnd(rng, 18, 36), y1 - rnd(rng, 12, 28)], rng, 1.2);
    return `<path d="${d}" stroke="${CRIMSON}" stroke-width="1.4" stroke-opacity="0.72"/>`;
  }).join('');
  return `<g fill="none" stroke-linecap="round">${layers}${accents}</g>`;
}
function sketchPolyEdge(p1, p2, rng, overshoot) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
  const [sx, sy, ex, ey] = [x1 - ux * overshoot, y1 - uy * overshoot, x2 + ux * overshoot, y2 + uy * overshoot];
  const pts = [`M${f1(sx)} ${f1(sy)}`];
  for (let i = 1; i <= 6; i += 1) {
    const t = i / 6;
    const j = i === 6 ? 0 : rnd(rng, -1.6, 1.6);
    pts.push(`L${f1(sx + (ex - sx) * t - uy * j)} ${f1(sy + (ey - sy) * t + ux * j)}`);
  }
  return pts.join('');
}
function sketchFrameLoop(box, rng, overshoot, color) {
  const [x, y, w, h] = box;
  const edges = [
    sketchPolyEdge([x, y], [x + w, y], rng, overshoot),
    sketchPolyEdge([x + w, y], [x + w, y + h], rng, overshoot),
    sketchPolyEdge([x + w, y + h], [x, y + h], rng, overshoot),
    sketchPolyEdge([x, y + h], [x, y], rng, overshoot),
  ];
  return edges.map((d, idx) =>
    `<path d="${d}" stroke="${color}" stroke-width="${idx % 2 === 0 ? '2.2' : '1.9'}" ` +
    `stroke-opacity="${f1(rnd(rng, 0.72, 0.94))}"/>`
  ).join('');
}
function buildGraphiteBorder(zine) {
  const rng = createRng(zine ? 0x99d113 : 0x44b811);
  const strokeColor = zine ? INK : C;
  const outer = sketchFrameLoop([10, 10, 300, 160], rng, 6, strokeColor);
  const inner = sketchFrameLoop([15, 15, 290, 150], rng, 4, strokeColor)
    .replaceAll('stroke-width="2.2"', 'stroke-width="1.3" stroke-dasharray="20 3 9 2"')
    .replaceAll('stroke-width="1.9"', 'stroke-width="1.2" stroke-dasharray="16 3 7 3"');
  const ticks = [[[6, 20], [22, 6]], [[298, 6], [314, 20]], [[6, 160], [22, 174]], [[298, 174], [314, 160]]]
    .map(([a, b]) => `<path d="${sketchSegment(a, b, rng, 0.8)}" stroke="${strokeColor}" ` +
      'stroke-width="1.3" stroke-opacity="0.52"/>').join('');
  if (!zine) return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${outer}${inner}${ticks}</g>`;
  const zineMarks = `<path d="M5 26V5h26M289 5h26v21M5 154v21h26M289 175h26v-21" stroke="${CRIMSON}" ` +
    `stroke-width="3"/><path d="M120 7h76M126 173h74" stroke="${YELLOW}" stroke-width="3.2"/>`;
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${outer}${inner}${ticks}${zineMarks}</g>`;
}
function buildXeroxSpecks(w, h, count, rng, color) {
  return Array.from({ length: count }, (_, i) => {
    const [cx, cy, op] = [f1(rnd(rng, 4, w - 4)), f1(rnd(rng, 4, h - 4)), f1(rnd(rng, 0.25, 0.85))];
    if (i % 7 !== 0) {
      return `<circle cx="${cx}" cy="${cy}" r="${f1(rnd(rng, 0.6, 2.1))}" fill="${color}" fill-opacity="${op}"/>`;
    }
    const s = rnd(rng, 1.4, 3.2);
    const pts = `${cx},${cy} ${f1(cx + s)},${f1(cy + 0.6)} ${f1(cx + s * 0.4)},${f1(cy + s)}`;
    return `<polygon points="${pts}" fill="${color}" fill-opacity="${op}"/>`;
  }).join('');
}
function buildXeroxDistress(slug, band) {
  const rng = createRng(band ? 0x71e09a : 0x3f88c2);
  const [w, h, pid] = [band ? 320 : 240, band ? 64 : 240, `mw-materials-${slug}-dots`];
  const pattern = `<defs><pattern id="${pid}" width="14" height="14" patternUnits="userSpaceOnUse">` +
    `<circle cx="3.5" cy="3.5" r="1.5" fill="${C}" fill-opacity="0.32"/><circle cx="10.5" cy="10.5" r="1.8" ` +
    `fill="${C}" fill-opacity="0.24"/></pattern></defs>`;
  const blobs = band
    ? ['6,10 112,6 146,24 92,34 12,30', '166,30 296,26 312,54 202,58 148,46']
    : ['8,12 96,6 118,52 74,98 14,82', '128,142 222,126 234,218 158,234 114,196'];
  const halftoneBlobs = blobs.map((pts) => `<polygon points="${pts}" fill="url(#${pid})"/>`).join('');
  const streaks = Array.from({ length: band ? 8 : 11 }, () => {
    const y = rnd(rng, 6, h - 6);
    const x1 = rnd(rng, 4, w * 0.45);
    const x2 = Math.min(w - 4, x1 + rnd(rng, 28, w * 0.55));
    return `<path d="${sketchSegment([x1, y], [x2, y + rnd(rng, -1.5, 1.5)], rng, 1)}" stroke="${C}" ` +
      `stroke-width="${f1(rnd(rng, 0.9, 1.8))}" stroke-opacity="${f1(rnd(rng, 0.3, 0.65))}" ` +
      `stroke-dasharray="${f1(rnd(rng, 8, 26))} ${f1(rnd(rng, 3, 9))}" fill="none" stroke-linecap="round"/>`;
  }).join('');
  return `${pattern}${halftoneBlobs}${buildXeroxSpecks(w, h, band ? 68 : 110, rng, C)}${streaks}`;
}
function buildTapeBody(w, h, rng, cfg) {
  const [m, teeth] = [8, 5];
  const stepY = (h - m * 2) / teeth;
  const edgePt = (x0, sign, i) => `${f1(x0 + sign * (i % 2 === 0 ? 0 : rnd(rng, 3, 7)))},${f1(m + i * stepY)}`;
  const pts = [
    ...Array.from({ length: teeth + 1 }, (_, i) => edgePt(m, 1, i)),
    ...Array.from({ length: teeth + 1 }, (_, k) => edgePt(w - m, -1, teeth - k)),
  ];
  const poly = pts.join(' ');
  const shadow = cfg.shadow ? `<polygon points="${poly}" transform="translate(3 3)" fill="${INK}"/>` : '';
  const crease = [
    sketchSegment([16, h * 0.34], [w - 18, h * 0.3], rng, 1.2),
    sketchSegment([20, h * 0.66], [w - 16, h * 0.68], rng, 1.2),
  ].map((d) => `<path d="${d}" fill="none" stroke="${cfg.crease}" stroke-width="1.4" stroke-opacity="0.45"/>`).join('');
  const hatch = Array.from({ length: 6 }, (_, i) =>
    `<path d="M${f1(24 + i * ((w - 48) / 5))} ${f1(h * 0.28)}l-6 ${f1(h * 0.42)}" ` +
    `stroke="${cfg.hatch}" stroke-width="1.3" stroke-opacity="0.48" stroke-linecap="round"/>`
  ).join('');
  const mark = cfg.mark ? `<path d="${cfg.mark}" stroke="${CRIMSON}" stroke-width="2.4" stroke-linecap="round"/>` : '';
  return `${shadow}<polygon points="${poly}" fill="${cfg.fill}" fill-opacity="0.92" stroke="${INK}" ` +
    `stroke-width="2.4" stroke-linejoin="round"/>${crease}${hatch}${mark}`;
}
const EDGE_CFG = {
  top: { horiz: true, span: 320, edge: 30, map: (u, v) => [u, v], off: [0, 2], nick: 'M56 22h18' },
  bottom: { horiz: true, span: 320, edge: 2, map: (u, v) => [u, 32 - v], off: [0, -2], nick: 'M56 10h18' },
  left: { horiz: false, span: 240, edge: 30, map: (u, v) => [v, u], off: [2, 0], nick: 'M22 56v18' },
  right: { horiz: false, span: 240, edge: 2, map: (u, v) => [32 - v, u], off: [-2, 0], nick: 'M10 56v18' },
};
function buildTornZineEdge(side) {
  const cfg = EDGE_CFG[side];
  const rng = createRng(side.charCodeAt(0) * 9973 + side.length * 131);
  const tearPts = Array.from({ length: 21 }, (_, i) =>
    cfg.map(2 + ((cfg.span - 4) * i) / 20, i === 0 || i === 20 ? 14 : rnd(rng, 5, 19))
  );
  const base = (u) => (cfg.horiz ? `${f1(u)} ${cfg.edge}` : `${cfg.edge} ${f1(u)}`);
  const polyD = `M${base(2)} ${tearPts.map(([x, y]) => `L${f1(x)} ${f1(y)}`).join(' ')} L${base(cfg.span - 2)} Z`;
  const contourD = `M${tearPts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L')}`;
  const sketchD = `M${tearPts.map(([x, y]) => `${f1(x + cfg.off[0])} ${f1(y + cfg.off[1])}`).join(' L')}`;
  const dots = Array.from({ length: 14 }, () => {
    const [cx, cy] = cfg.map(rnd(rng, 10, cfg.span - 10), rnd(rng, 18, 26));
    return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="1.1" fill="${INK}" fill-opacity="0.28"/>`;
  }).join('');
  return `<path d="${polyD}" fill="${PAPER}" stroke="none"/><path d="${sketchD}" fill="none" ` +
    `stroke="${PAPER_SHADE}" stroke-width="3" stroke-linejoin="round"/><path d="${contourD}" fill="none" ` +
    `stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${dots}<path d="${cfg.nick}" stroke="${CRIMSON}" ` +
    'stroke-width="2" stroke-linecap="round"/>';
}

const legacySpecs = [
  ['torn-edge-top', 'Torn paper top edge', 'material', 'paper-edge', 240, 16,
    `<path d="M0 16V4l18 4 14-6 20 5 16-5 24 6 18-7 22 6 19-5 21 5 17-6 23 6 14-5 14 4v10Z" fill="${C}"/>`],
  ['torn-edge-bottom', 'Torn paper bottom edge', 'material', 'paper-edge', 240, 16,
    `<path d="M0 0v12l16-4 18 6 21-5 15 6 24-7 19 6 23-5 17 6 22-6 18 5 21-5 14 4 12-3V0Z" fill="${C}"/>`],
  ['torn-edge-left', 'Torn paper left edge', 'material', 'paper-edge', 16, 240,
    `<path d="M16 0H4l4 18-6 14 5 20-5 16 6 24-7 18 6 22-5 19 5 21-6 17 6 23-5 14 4 14h10Z" fill="${C}"/>`],
  ['torn-edge-right', 'Torn paper right edge', 'material', 'paper-edge', 16, 240,
    `<path d="M0 0h12l-4 16 6 18-5 21 6 15-7 24 6 19-5 23 6 17-6 22 5 18-5 21 4 14-3 12H0Z" fill="${C}"/>`],
  ['torn-corner-tl', 'Torn paper top-left corner', 'material', 'paper-corner', 24, 24,
    `<path d="M24 0v16H16v8H0V12l5-4-2-4 6-1 3-3h12Z" fill="${C}"/>`],
  ['torn-corner-tr', 'Torn paper top-right corner', 'material', 'paper-corner', 24, 24,
    `<path d="M0 0h12l3 3 6 1-2 4 5 4v12H8v-8H0V0Z" fill="${C}"/>`],
  ['torn-corner-bl', 'Torn paper bottom-left corner', 'material', 'paper-corner', 24, 24,
    `<path d="M0 0h16v8h8v16H12l-3-3-6-1 2-4-5-4V0Z" fill="${C}"/>`],
  ['torn-corner-br', 'Torn paper bottom-right corner', 'material', 'paper-corner', 24, 24,
    `<path d="M8 0h16v12l-5 4 2 4-6 1-3 3H0V8h8V0Z" fill="${C}"/>`],
  ['brush-strip-short', 'Short brush stroke strip', 'material', 'brush-strip', 160, 40,
    `<path d="M6 10c42-5 98-6 148-2l-5 9 7 8c-48 5-102 6-152 3l6-9-4-9Z" fill="${C}"/>`],
  ['brush-strip-long', 'Long brush stroke ribbon', 'material', 'brush-strip', 320, 44,
    `<path d="M8 9c86-6 212-7 304-1l-8 11 9 10c-94 6-220 7-306 2l9-11-8-11Z" fill="${C}"/>`],
  ['paper-note', 'Paper note card frame', 'material', 'paper-note', 180, 120,
    `<path d="M6 10h140l28 24v80H6V10Z" fill="${PAPER_RAISED}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M146 10v24h28" fill="${PAPER_SHADE}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<rect x="64" y="2" width="52" height="14" fill="${YELLOW}" stroke="${INK}" stroke-width="2" ` +
    'transform="rotate(-2 90 9)"/>'],
  ['tape-strip', 'Masking tape strip', 'material', 'tape', 96, 28,
    `<path d="M4 6 12 3l72 2 8-2-3 10 3 9-12 2-68-2-8 2 3-9-3-9Z" fill="${YELLOW}" ` +
    `fill-opacity="0.88" stroke="${INK}" stroke-width="2"/>`],
  ['folded-corner', 'Folded paper corner', 'material', 'paper-corner', 32, 32,
    `<path d="M2 2h28v28Z" fill="${PAPER_SHADE}"/><path d="M2 2v28h28L2 2Z" fill="${PAPER_RAISED}" ` +
    `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`],
  ['stamp-outline', 'Rubber stamp frame', 'material', 'stamp', 120, 48,
    `<rect x="3" y="3" width="114" height="42" rx="4" fill="none" stroke="${C}" stroke-width="3" ` +
    `stroke-dasharray="14 3 6 2"/><rect x="8" y="8" width="104" height="32" rx="2" fill="none" ` +
    `stroke="${C}" stroke-width="1.5"/>`],
  ['ink-splatter-sm', 'Small ink splatter', 'material', 'ink-splatter', 48, 48,
    `<path d="M22 14c4-2 9 1 11 5 2 5-1 10-6 12-5 1-11-2-12-7-1-5 2-9 7-10Z" fill="${C}"/>` +
    `<circle cx="11" cy="14" r="2.2" fill="${C}"/><circle cx="37" cy="16" r="1.8" fill="${C}"/>` +
    `<circle cx="34" cy="35" r="2.6" fill="${C}"/><circle cx="14" cy="34" r="1.5" fill="${C}"/>`],
  ['ink-splatter-md', 'Medium ink splatter', 'material', 'ink-splatter', 84, 84,
    `<path d="M38 22c9-3 18 3 21 11 3 9-2 19-11 22-9 4-20-1-23-10-3-9 3-19 13-23Z" fill="${C}"/>` +
    `<circle cx="18" cy="24" r="3.4" fill="${C}"/><circle cx="67" cy="21" r="2.8" fill="${C}"/>` +
    `<circle cx="68" cy="58" r="4.1" fill="${C}"/><circle cx="22" cy="62" r="2.5" fill="${C}"/>` +
    `<circle cx="44" cy="11" r="2.2" fill="${C}"/><path d="M56 38 72 34m-18 14 14 12" ` +
    `stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`],
  ['tile-halftone', 'Halftone dot tile', 'pattern', 'tile', 64, 64,
    '<defs><pattern id="mw-materials-tile-halftone-svg-dots" width="16" height="16" patternUnits="userSpaceOnUse">' +
    `<circle cx="4" cy="4" r="1.6" fill="${C}" fill-opacity="0.22"/><circle cx="12" cy="12" r="1.6" ` +
    `fill="${C}" fill-opacity="0.22"/></pattern></defs><rect width="64" height="64" ` +
    'fill="url(#mw-materials-tile-halftone-svg-dots)"/>'],
  ['tile-speckle', 'Paper speckle tile', 'pattern', 'tile', 80, 80,
    '<defs><pattern id="mw-materials-tile-speckle-svg-grain" width="40" height="40" patternUnits="userSpaceOnUse">' +
    `<circle cx="7" cy="9" r="1" fill="${C}" fill-opacity="0.24"/><circle cx="23" cy="5" r="0.9" ` +
    `fill="${C}" fill-opacity="0.18"/><circle cx="31" cy="19" r="1.2" fill="${C}" fill-opacity="0.2"/>` +
    `<circle cx="13" cy="28" r="0.8" fill="${C}" fill-opacity="0.22"/><circle cx="35" cy="34" r="1" ` +
    `fill="${C}" fill-opacity="0.16"/></pattern></defs><rect width="80" height="80" ` +
    'fill="url(#mw-materials-tile-speckle-svg-grain)"/>'],
  ['tile-scratch', 'Ink scratch texture tile', 'pattern', 'tile', 80, 80,
    `<g fill="none" stroke="${C}" stroke-opacity="0.24" stroke-width="1.2" stroke-linecap="round">` +
    '<path d="M6 14 24 8M44 16l22-5M12 42l28-6M50 48l18-3M8 68l24-7M48 70l22-4"/></g>'],
  ['scuffed-border', 'Scuffed ink border', 'material', 'border', 240, 120,
    `<path d="M4 4h72m10 0h94m10 0h46v44m0 10v58h-82m-12 0H4V64m0-12V4" fill="none" stroke="${C}" ` +
    `stroke-width="3" stroke-linecap="square"/><path d="M10 9h38m142 102h38" fill="none" stroke="${C}" ` +
    'stroke-width="1.5" stroke-opacity="0.45"/>'],
  ['doodle-star', 'Hand-drawn star doodle', 'ornament', 'doodle', 24, 24,
    `<path d="M12 2.5 14.6 8.6l6.6.5-5 4.3 1.6 6.5L12 16.4l-5.8 3.5 1.6-6.5-5-4.3 6.6-.5Z" fill="none" ` +
    `stroke="${C}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`],
  ['doodle-bolt', 'Hand-drawn lightning bolt doodle', 'ornament', 'doodle', 24, 24,
    `<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6Z" fill="${YELLOW}" stroke="${INK}" ` +
    'stroke-width="2" stroke-linejoin="round"/>'],
  ['doodle-smiley', 'Hand-drawn smiley doodle', 'ornament', 'doodle', 24, 24,
    `<circle cx="12" cy="12" r="9.2" fill="${YELLOW}" stroke="${INK}" stroke-width="2"/><circle cx="9" cy="10" ` +
    `r="1.2" fill="${INK}"/><circle cx="15" cy="10" r="1.2" fill="${INK}"/><path d="M8.5 14.2c1.2 2 5.8 2 7 0" ` +
    `fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`],
  ['doodle-arrow', 'Hand-drawn arrow doodle', 'ornament', 'doodle', 24, 24,
    `<path d="M3 18c4-1 8-5 10-11m0 0-4 2m4-2 1.5 4.5" fill="none" stroke="${C}" stroke-width="2.2" ` +
    'stroke-linecap="round" stroke-linejoin="round"/>'],
  ['doodle-crown', 'Hand-sketched crown doodle', 'ornament', 'doodle', 28, 24,
    `<path d="M4 17.5 3.5 8.5l5.2 4.5L13.5 5l5.1 7.6 5.4-4.2-1 9.1Z" fill="none" stroke="${C}" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round"/><path d="M5 20.5c5.5-.8 12.5-.6 18 0" fill="none" ` +
    `stroke="${C}" stroke-width="2" stroke-linecap="round"/><circle cx="3.5" cy="6.5" r="1.1" fill="${C}"/>` +
    `<circle cx="13.5" cy="3.3" r="1.2" fill="${C}"/><circle cx="24" cy="6.3" r="1.1" fill="${C}"/>`],
  ['motif-underline', 'Hand-drawn scribble underline motif', 'ornament', 'motif', 200, 16,
    `<path d="M2 10C40 4 80 14 120 7s60-2 78 2M10 13c50-4 110 2 180-2" fill="none" stroke="${C}" ` +
    'stroke-width="2.6" stroke-linecap="round"/>'],
  ['motif-cross-out', 'Editorial cross-out motif', 'ornament', 'motif', 120, 24,
    `<path d="M4 15c34-6 78-7 112-3M8 9c38 4 72 6 106 3" fill="none" stroke="${C}" stroke-width="2.8" ` +
    'stroke-linecap="round"/>'],
  ['motif-orbit', 'Signal orbit motif', 'ornament', 'motif', 120, 120,
    `<circle cx="60" cy="60" r="48" fill="none" stroke="${C}" stroke-opacity="0.35" stroke-width="1.6" ` +
    `stroke-dasharray="6 4"/><ellipse cx="60" cy="60" rx="52" ry="20" fill="none" stroke="${C}" ` +
    `stroke-width="2" transform="rotate(-24 60 60)"/><circle cx="101" cy="40" r="4.5" fill="#00b8f0" ` +
    `stroke="${INK}" stroke-width="1.5"/>`],
  ['motif-globe-grid', 'Editorial globe grid motif', 'ornament', 'motif', 96, 96,
    `<circle cx="48" cy="48" r="40" fill="none" stroke="${C}" stroke-width="2"/><ellipse cx="48" cy="48" ` +
    `rx="19" ry="40" fill="none" stroke="${C}" stroke-width="1.5"/><path d="M10 34h76M10 62h76M48 8v80" ` +
    `fill="none" stroke="${C}" stroke-width="1.5"/>`],
  ['motif-moon-phases', 'Moon phases strip motif', 'ornament', 'motif', 160, 32,
    `<circle cx="20" cy="16" r="10" fill="${C}"/><path d="M52 6a10 10 0 1 0 0 20 7.5 10 0 0 1 0-20Z" ` +
    `fill="${C}"/><path d="M84 6a10 10 0 1 0 0 20V6Z" fill="${C}"/><circle cx="84" cy="16" r="10" fill="none" ` +
    `stroke="${C}" stroke-width="1.8"/><circle cx="116" cy="16" r="10" fill="none" stroke="${C}" ` +
    `stroke-width="1.8"/><path d="M116 6a10 10 0 0 1 0 20 6 10 0 0 0 0-20Z" fill="${C}"/>` +
    `<circle cx="146" cy="16" r="10" fill="none" stroke="${C}" stroke-width="1.8"/>`],
  ['motif-eye-target', 'Witness eye and target motif', 'ornament', 'motif', 64, 40,
    `<path d="M4 20c8-11 18-15 28-15s20 4 28 15c-8 11-18 15-28 15S12 31 4 20Z" fill="none" stroke="${C}" ` +
    `stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="20" r="8" fill="none" stroke="${C}" ` +
    `stroke-width="2"/><circle cx="32" cy="20" r="3" fill="${C}"/><path d="M32 3v5M32 32v5M1 20h6M57 20h6" ` +
    `fill="none" stroke="${C}" stroke-width="1.8" stroke-linecap="round"/>`],
];

const rocksoulEntries = [
  { name: 'pencil-crosshatch', title: 'Rough graphite pencil crosshatch texture', kind: 'pattern',
    variant: 'pencil-crosshatch', width: 160, height: 160, pngDualTone: true,
    body: buildPencilCrosshatch('pencil-crosshatch', false) },
  { name: 'pencil-crosshatch-dense', title: 'Dense 4B graphite and crimson crosshatch texture', kind: 'pattern',
    variant: 'pencil-crosshatch', width: 160, height: 160, pngDualTone: true,
    body: buildPencilCrosshatch('pencil-crosshatch-dense', true) },
  { name: 'graphite-stroke-border', title: 'Organic double-line graphite pencil frame', kind: 'material',
    variant: 'pencil-border', width: 320, height: 180, pngDualTone: true, body: buildGraphiteBorder(false) },
  { name: 'graphite-stroke-border-zine', title: 'ROCKSOUL zine graphite and crimson sketch frame', kind: 'material',
    variant: 'pencil-border', width: 320, height: 180, pngDualTone: false, body: buildGraphiteBorder(true) },
  { name: 'xerox-distress', title: 'Photocopy xerox speckle and halftone grain texture', kind: 'pattern',
    variant: 'xerox-distress', width: 240, height: 240, pngDualTone: true,
    body: buildXeroxDistress('xerox-distress', false) },
  { name: 'xerox-distress-band', title: 'Photocopy xerox toner grain horizontal divider band', kind: 'material',
    variant: 'xerox-distress', width: 320, height: 64, pngDualTone: true,
    body: buildXeroxDistress('xerox-distress-band', true) },
  { name: 'masking-tape-strip', title: 'Serrated street-zine masking tape strip', kind: 'material',
    variant: 'tape', width: 160, height: 48, pngDualTone: false,
    body: buildTapeBody(160, 48, createRng(0x11aa22), { fill: TAPE_GOLD, crease: PAPER_RAISED, hatch: GRAPHITE }) },
  { name: 'masking-tape-strip-crimson', title: 'ROCKSOUL crimson zine masking tape strip', kind: 'material',
    variant: 'tape', width: 160, height: 48, pngDualTone: false, body: buildTapeBody(160, 48, createRng(0x33cc44),
      { fill: CRIMSON, crease: PAPER, hatch: YELLOW, shadow: true, mark: 'M18 14l14 20' }) },
  { name: 'torn-tape', title: 'Angled torn street-zine masking tape patch', kind: 'material',
    variant: 'tape', width: 180, height: 56, pngDualTone: false, body: `<g transform="rotate(-2.2 90 28)">` +
      `${buildTapeBody(180, 56, createRng(0x77ee99), { fill: YELLOW, crease: PAPER_RAISED, hatch: INK,
        shadow: true, mark: 'M148 16l12 12m0-12l-12 12' })}</g>` },
  { name: 'torn-zine-edge-top', title: 'Street-zine jagged torn paper top edge', kind: 'material',
    variant: 'paper-edge', width: 320, height: 32, pngDualTone: false, body: buildTornZineEdge('top') },
  { name: 'torn-zine-edge-bottom', title: 'Street-zine jagged torn paper bottom edge', kind: 'material',
    variant: 'paper-edge', width: 320, height: 32, pngDualTone: false, body: buildTornZineEdge('bottom') },
  { name: 'torn-zine-edge-left', title: 'Street-zine jagged torn paper left spine edge', kind: 'material',
    variant: 'paper-edge', width: 32, height: 240, pngDualTone: false, body: buildTornZineEdge('left') },
  { name: 'torn-zine-edge-right', title: 'Street-zine jagged torn paper right edge', kind: 'material',
    variant: 'paper-edge', width: 32, height: 240, pngDualTone: false, body: buildTornZineEdge('right') },
];
export const ROCKSOUL_MATERIAL_SLUGS = rocksoulEntries.map((entry) => entry.name);
function buildPngSourceSvg(entry, svg) {
  if (!entry.pngDualTone) return svg;
  const chalkBody = entry.body.replaceAll(C, PAPER).replaceAll('mw-materials-', 'mw-materials-chalk-');
  const chalkPass = `<g opacity="0.24" transform="translate(1 1)">${chalkBody}</g>`;
  return wrapSvg(entry.width, entry.height, entry.title, `${chalkPass}${entry.body.replaceAll(C, GRAPHITE)}`);
}

export async function generateMaterials({ checkOnly = false } = {}) {
  await mkdir(resolve(root, 'materials'), { recursive: true });
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const generatedEntries = [];
  for (const [name, title, kind, variant, width, height, body] of legacySpecs) {
    const path = `materials/${name}.svg`;
    const svg = wrapSvg(width, height, title, body);
    validateSvg(svg, path);
    if (!checkOnly) await atomicWrite(resolve(root, path), svg);
    generatedEntries.push({ path, kind, variant, format: 'svg', width, height });
  }
  for (const entry of rocksoulEntries) {
    const [svgPath, pngPath] = [`materials/${entry.name}.svg`, `materials/${entry.name}.png`];
    const svg = wrapSvg(entry.width, entry.height, entry.title, entry.body);
    validateSvg(svg, svgPath);
    const pngBuf = await sharp(Buffer.from(buildPngSourceSvg(entry, svg), 'utf8'))
      .resize(entry.width, entry.height).png({ compressionLevel: 9, palette: true, quality: 92 }).toBuffer();
    if (!checkOnly) {
      await atomicWrite(resolve(root, svgPath), svg);
      await atomicWrite(resolve(root, pngPath), pngBuf);
    }
    generatedEntries.push(
      { path: svgPath, kind: entry.kind, variant: entry.variant,
        format: 'svg', width: entry.width, height: entry.height },
      { path: pngPath, kind: entry.kind, variant: entry.variant, format: 'png',
        width: entry.width, height: entry.height, source: svgPath, sourceAsset: svgPath }
    );
  }
  const ownedPaths = new Set([
    ...manifest.assets.filter((a) => a.path.startsWith('materials/')).map((a) => a.path),
    ...generatedEntries.map(({ path }) => path),
  ]);
  manifest.assets = replaceGeneratedAssets(manifest.assets, generatedEntries, ownedPaths);
  if (!checkOnly) await atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return generatedEntries;
}
if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = argv.includes('--check');
  const entries = await generateMaterials({ checkOnly });
  stdout.write(`${checkOnly ? 'Verified' : 'Generated'} ${entries.length} MoonWitness x ROCKSOUL material assets.\n`);
}
