import { Buffer } from 'node:buffer';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';
import { validateSvg } from './validate.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = resolve(packageRoot, 'manifest.json');
const OUT_DIR = 'illustrations/stickers-pack';
const VIEW = 256;
const PX = 512;
const MAX_BYTES = 64 * 1024;
const INK_W = 6;
const HALO_W = INK_W * 3;

const INK = '#0d0d0d';
const GRAPHITE = '#2b2b30';
const PAPER = '#f3efe4';
const YELLOW = '#ffe031';
const MAGENTA = '#ff2e88';
const CYAN = '#00b8f0';
const VIOLET = '#c084fc';

/** Stroke font on a 4x6 grid; every glyph is a list of polylines. */
const GLYPHS = {
  A: [[[0, 6], [2, 0], [4, 6]], [[0.8, 4], [3.2, 4]]],
  B: [[[0, 0], [0, 6]], [[0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]],
  D: [[[0, 0], [0, 6], [2, 6], [4, 4], [4, 2], [2, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
  G: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3], [2, 3]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0, 3], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [[[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]]],
  P: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]],
  R: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[2, 3], [4, 6]]],
  S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
  W: [[[0, 0], [1, 6], [2, 3], [3, 6], [4, 0]]],
  Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
};

const GAP = 1.6;
const SPACE = 2.4;

function textWidth(text) {
  return [...text].reduce((sum, ch, i) => sum + (ch === ' ' ? SPACE : 4) + (i ? GAP : 0), 0);
}

/** Path data for one text line, centred on cx with its top at y and fitted inside maxWidth. */
function lettering(text, cx, y, maxWidth, maxScale) {
  const scale = Math.min(maxScale, maxWidth / textWidth(text));
  let x = cx - (textWidth(text) * scale) / 2;
  const parts = [];
  for (const ch of text) {
    if (ch !== ' ') {
      for (const line of GLYPHS[ch]) {
        const points = line.map(([px, py]) => `${(x + px * scale).toFixed(1)} ${(y + py * scale).toFixed(1)}`);
        parts.push(`M${points.join(' L')}`);
      }
    }
    x += ((ch === ' ' ? SPACE : 4) + GAP) * scale;
  }
  return { d: parts.join(' '), height: 6 * scale };
}

/** Halos are queued separately so every die-cut border sits under every inked shape. */
function createCanvas() {
  const halos = [];
  const mains = [];
  const shape = (tag, attrs, fill, { stroke = INK, width = INK_W, opacity = 1 } = {}) => {
    const closed = fill === 'none' ? 'none' : PAPER;
    const join = 'stroke-linejoin="round" stroke-linecap="round"';
    halos.push(`<${tag} ${attrs} fill="${closed}" stroke="${PAPER}" stroke-width="${HALO_W + width}" ${join}/>`);
    mains.push(
      `<${tag} ${attrs} fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" ` +
        `stroke-width="${width}" ${join}/>`
    );
  };
  const render = (title) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="${VIEW}" height="${VIEW}" ` +
    `role="img" aria-label="${title}"><title>${title}</title>${halos.join('')}${mains.join('')}</svg>\n`;
  return { shape, render };
}

function star(cx, cy, outer, inner, points) {
  const coords = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    coords.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return coords.join(' ');
}

const BADGES = {
  burst: (c, fill) => c.shape('polygon', `points="${star(128, 128, 116, 78, 12)}"`, fill),
  banner: (c, fill) =>
    c.shape('rect', 'x="22" y="52" width="212" height="152" rx="22" transform="rotate(-5 128 128)"', fill),
  shield: (c, fill) => c.shape('path', 'd="M30 36 H226 V140 C226 190 170 216 128 232 C86 216 30 190 30 140 Z"', fill),
  bubble: (c, fill) => {
    const outlinePath =
      'M128 42 C198 42 236 80 236 124 C236 168 198 204 128 204 C108 204 96 206 70 226 ' +
      'L76 194 C44 180 20 156 20 124 C20 80 58 42 128 42 Z';
    c.shape('path', `d="${outlinePath}"`, fill);
  },
  pill: (c, fill) => c.shape('rect', 'x="14" y="76" width="228" height="104" rx="52"', fill),
  tape: (c, fill) => {
    const edge =
      'M14 70 L34 82 L14 96 L34 110 L14 124 L34 138 L14 152 L34 166 L14 180 H242 ' +
      'L222 166 L242 152 L222 138 L242 124 L222 110 L242 96 L222 82 L242 70 Z';
    c.shape('path', `d="${edge}"`, fill);
  },
};

const TEXT_FIT = { burst: 112, banner: 150, shield: 130, bubble: 140, pill: 160, tape: 130 };
const LINE_GAP = 18;

function textSticker({ shape, fill, lines, ink = INK, accent = MAGENTA }) {
  return (c) => {
    BADGES[shape](c, fill);
    const maxWidth = TEXT_FIT[shape];
    const maxScale = lines.length === 1 ? 7 : 5;
    const measured = lines.map((line) => lettering(line, 128, 0, maxWidth, maxScale).height);
    const total = measured.reduce((a, b) => a + b, 0) + lines.length * LINE_GAP;
    let y = 128 - total / 2;
    for (const line of lines) {
      const { d, height } = lettering(line, 128, y, maxWidth, maxScale);
      c.shape('path', `d="${d}"`, 'none', { stroke: ink, width: 5 });
      y += height + LINE_GAP;
    }
    c.shape('path', `d="M84 ${y - 6} Q128 ${y + 4} 172 ${y - 6}"`, 'none', { stroke: accent, width: 5 });
  };
}

const COLORS = { Y: YELLOW, M: MAGENTA, C: CYAN, V: VIOLET };
const TEXT_ROWS = [
  ['lesgo', 'LESGO street shout', 'burst', 'Y', 'LESGO', 'M'],
  ['zero-drift', 'ZERO DRIFT banner', 'banner', 'C', 'ZERO|DRIFT', 'Y'],
  ['chaos-medic', 'CHAOS MEDIC bubble', 'bubble', 'M', 'CHAOS|MEDIC', 'Y'],
  ['signal-locked', 'SIGNAL LOCKED shield', 'shield', 'Y', 'SIGNAL|LOCKED', 'C'],
  ['no-cap', 'NO CAP pill', 'pill', 'V', 'NO CAP', 'Y'],
  ['ship-it', 'SHIP IT torn tape', 'tape', 'Y', 'SHIP IT', 'M'],
  ['build-it', 'BUILD IT banner', 'banner', 'M', 'BUILD|IT', 'C'],
  ['trust-me', 'TRUST ME bubble', 'bubble', 'C', 'TRUST|ME', 'Y'],
  ['merged', 'MERGED burst', 'burst', 'V', 'MERGED', 'Y'],
  ['on-fire', 'ON FIRE shield', 'shield', 'M', 'ON|FIRE', 'Y'],
  ['gg-wp', 'GG WP pill', 'pill', 'C', 'GG WP', 'M'],
  ['clean-diff', 'CLEAN DIFF torn tape', 'tape', 'C', 'CLEAN|DIFF', 'Y'],
];

const TEXT_STICKERS = TEXT_ROWS.map(([slug, label, shape, fill, text, accent]) => ({
  slug,
  title: `${label} sticker`,
  group: 'badge',
  build: textSticker({ shape, fill: COLORS[fill], lines: text.split('|'), accent: COLORS[accent] }),
}));

const ARROWS = [
  ['right', 'M30 140 C80 120 140 150 206 128', 'M180 100 L214 126 L182 156', YELLOW],
  ['curve-down', 'M50 60 C150 40 220 90 190 186', 'M164 164 L190 200 L220 170', CYAN],
  [
    'loop',
    'M40 204 C40 124 120 124 120 164 C120 204 70 194 90 144 C110 94 186 84 208 62',
    'M190 52 L214 58 L208 82',
    MAGENTA,
  ],
  ['zigzag', 'M30 176 L80 112 L110 162 L160 92 L200 132', 'M176 112 L206 134 L214 98', YELLOW],
  ['up', 'M128 222 C110 172 146 122 128 52', 'M100 82 L128 42 L158 80', CYAN],
  ['down-left', 'M210 50 C170 100 100 120 50 196', 'M44 162 L46 204 L84 194', MAGENTA],
  ['double', 'M34 128 H222', 'M184 100 L214 128 L184 156 M72 100 L42 128 L72 156', YELLOW],
  ['spiral-in', 'M40 60 C200 30 220 200 100 190 C40 180 60 110 120 120', 'M100 98 L126 120 L96 140', CYAN],
  ['swoosh', 'M30 200 C90 222 170 212 224 172', 'M198 160 L226 170 L210 196', MAGENTA],
  ['bent', 'M44 60 V180 H200', 'M174 154 L204 180 L174 206', YELLOW],
].map(([name, shaft, head, accent]) => ({
  slug: `arrow-${name}`,
  title: `Rough pencil ${name} arrow sticker`,
  group: 'arrow',
  build(c) {
    c.shape('path', `d="${shaft}"`, 'none', { stroke: accent, width: 14, opacity: 0.9 });
    c.shape('path', `d="${head}"`, 'none', { stroke: accent, width: 14, opacity: 0.9 });
    c.shape('path', `d="${shaft}" transform="translate(2 -2)"`, 'none', { stroke: GRAPHITE, width: 4 });
    c.shape('path', `d="${head}" transform="translate(2 -2)"`, 'none', { stroke: GRAPHITE, width: 4 });
  },
}));

/** Colour stroke over a wider ink stroke so line-only doodles keep a black outline. */
function inkedStroke(c, d, color) {
  c.shape('path', `d="${d}"`, 'none', { stroke: INK, width: 18 });
  c.shape('path', `d="${d}"`, 'none', { stroke: color, width: 8 });
}

const DOODLES = [
  ['star', (c) => c.shape('polygon', `points="${star(128, 132, 100, 44, 5)}"`, YELLOW)],
  ['spiral', (c) => {
    const d =
      'M128 128 C128 110 156 110 156 132 C156 164 108 168 100 128 ' +
      'C92 84 160 70 184 112 C208 160 160 210 100 196';
    inkedStroke(c, d, CYAN);
  }],
  ['crown', (c) => c.shape('path', 'd="M40 190 L30 80 L82 120 L128 54 L174 120 L226 80 L216 190 Z"', YELLOW)],
  ['heart', (c) => {
    const d = 'M128 214 C20 150 36 62 94 62 C112 62 124 74 128 88 C132 74 144 62 162 62 C220 62 236 150 128 214 Z';
    c.shape('path', `d="${d}"`, MAGENTA);
  }],
  ['bolt', (c) => c.shape('polygon', 'points="150,26 62,138 114,138 94,232 194,104 140,104"', YELLOW)],
  ['eye', (c) => {
    c.shape('path', 'd="M20 128 C70 56 186 56 236 128 C186 200 70 200 20 128 Z"', PAPER);
    c.shape('circle', 'cx="128" cy="128" r="36"', CYAN);
    c.shape('circle', 'cx="128" cy="128" r="14"', INK);
  }],
  ['sparkles', (c) => {
    c.shape('polygon', `points="${star(96, 140, 70, 14, 4)}"`, YELLOW);
    c.shape('polygon', `points="${star(190, 78, 40, 9, 4)}"`, CYAN);
    c.shape('polygon', `points="${star(196, 188, 30, 7, 4)}"`, MAGENTA);
  }],
  ['cloud', (c) => {
    const d = 'M60 186 C20 186 18 130 62 126 C60 82 120 64 146 98 C186 78 230 112 210 150 C240 170 216 200 186 188 Z';
    c.shape('path', `d="${d}"`, PAPER);
  }],
  ['smiley', (c) => {
    c.shape('circle', 'cx="128" cy="128" r="100"', YELLOW);
    c.shape('path', 'd="M90 104 V120 M166 104 V120"', 'none', { width: 10 });
    c.shape('path', 'd="M80 156 C104 196 152 196 176 156"', 'none', { width: 8 });
  }],
  ['scribble-underline', (c) => inkedStroke(c, 'M24 150 L220 120 L40 170 L230 140 L60 196 L226 168', MAGENTA)],
].map(([name, draw]) => ({
  slug: `doodle-${name}`,
  title: `Pencil doodle ${name} sticker`,
  group: 'doodle',
  build: draw,
}));

const SPECS = [...TEXT_STICKERS, ...ARROWS, ...DOODLES];
const svgPath = (spec) => `${OUT_DIR}/sticker-${spec.slug}.svg`;
const pngPath = (spec) => `${OUT_DIR}/sticker-${spec.slug}.png`;

function buildSvg(spec) {
  const canvas = createCanvas();
  spec.build(canvas);
  return canvas.render(spec.title);
}

async function renderPng(svg) {
  const raw = await sharp(Buffer.from(svg, 'utf8'), { density: 144 }).resize(PX, PX).ensureAlpha().raw().toBuffer();
  for (let i = 3; i < raw.length; i += 4) raw[i] = raw[i] >= 200 ? 255 : raw[i] >= 90 ? 160 : 0;
  return sharp(raw, { raw: { width: PX, height: PX, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, quality: 92, colors: 64, effort: 10, dither: 0 })
    .toBuffer();
}

function countStickerPixels(data) {
  let dark = 0;
  let light = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) continue;
    if (data[i] < 60 && data[i + 1] < 60 && data[i + 2] < 60) dark += 1;
    else if (data[i] > 225 && data[i + 1] > 220 && data[i + 2] > 200) light += 1;
  }
  return { dark, light };
}

async function verifyPng(path) {
  const abs = resolve(packageRoot, path);
  const size = (await stat(abs).catch(() => null))?.size;
  if (!size) throw new Error(`Missing output: ${path}`);
  if (size > MAX_BYTES) throw new Error(`Budget violation on ${path}: ${size}B`);
  const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== PX || info.height !== PX) throw new Error(`Size mismatch on ${path}`);
  for (const [x, y] of [[2, 2], [PX - 3, 2], [2, PX - 3], [PX - 3, PX - 3]]) {
    if (data[(y * PX + x) * 4 + 3] !== 0) throw new Error(`Non-transparent corner on ${path}`);
  }
  const { dark, light } = countStickerPixels(data);
  if (dark < 400) throw new Error(`Missing ink outline contrast on ${path} (${dark}px)`);
  if (light < 1500) throw new Error(`Missing paper die-cut border on ${path} (${light}px)`);
}

async function verifySvg(path) {
  const source = await readFile(resolve(packageRoot, path), 'utf8').catch(() => null);
  if (!source) throw new Error(`Missing output: ${path}`);
  validateSvg(source, path);
}

function manifestEntries() {
  return SPECS.flatMap((spec) => {
    const common = {
      kind: 'sticker',
      variant: `${spec.slug}`,
      width: VIEW,
      height: VIEW,
      pack: 'stickers-pack',
      domain: 'visual-universe',
      status: 'review',
      license: 'ISC',
    };
    return [
      { path: svgPath(spec), ...common, format: 'svg', source: 'packages/assets/scripts/generate-street-stickers.mjs' },
      {
        path: pngPath(spec),
        ...common,
        format: 'png',
        width: PX,
        height: PX,
        source: svgPath(spec),
        sourceAsset: svgPath(spec),
      },
    ];
  });
}

export async function registerStickersPack() {
  const entries = manifestEntries();
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const owned = new Set([
    ...manifest.assets.map(({ path }) => path).filter((path) => path.startsWith(`${OUT_DIR}/`)),
    ...entries.map(({ path }) => path),
  ]);
  manifest.assets = replaceGeneratedAssets(manifest.assets, entries, owned);
  await atomicWrite(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function generateStreetStickers({ checkOnly = false } = {}) {
  if (!checkOnly) {
    for (const spec of SPECS) {
      const svg = buildSvg(spec);
      await atomicWrite(resolve(packageRoot, svgPath(spec)), svg);
      await atomicWrite(resolve(packageRoot, pngPath(spec)), await renderPng(svg));
    }
  }
  for (const spec of SPECS) {
    await verifySvg(svgPath(spec));
    await verifyPng(pngPath(spec));
  }
  return SPECS.length;
}

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = argv.includes('--check');
  const count = await generateStreetStickers({ checkOnly });
  if (!checkOnly) await registerStickersPack();
  stdout.write(`${checkOnly ? 'Verified' : 'Generated'} ${count} street stickers (PNG + SVG).\n`);
}
