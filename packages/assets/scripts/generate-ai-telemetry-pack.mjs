import { Buffer } from 'node:buffer';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = resolve(packageRoot, 'manifest.json');
const OUT_DIR = 'illustrations/telemetry-pack';
const SIZE = 256;
const MAX_BYTES = 64 * 1024;
const OWNED_PREFIX = `${OUT_DIR}/`;

const INK = '#0d0d0d';
const GRAPHITE = '#2b2b30';
const PAPER = '#f3efe4';
const CHARCOAL = '#17171a';
const SLATE = '#262833';
const YELLOW = '#ffe031';
const MAGENTA = '#ff2e88';
const CYAN = '#00b8f0';
const VIOLET = '#c084fc';

const STYLES = {
  ink: { stroke: INK, width: 6, fillOpacity: 1, sketch: false },
  'rough-pencil': { stroke: GRAPHITE, width: 4, fillOpacity: 0.32, sketch: true },
};

/** Collects shapes so every halo is painted beneath every inked shape. */
function createCanvas(style) {
  const halos = [];
  const mains = [];
  const sketches = [];
  const shape = (tag, attrs, fill) => {
    const haloFill = fill === 'none' ? 'none' : PAPER;
    halos.push(
      `<${tag} ${attrs} fill="${haloFill}" stroke="${PAPER}" stroke-width="16" ` +
        'stroke-linejoin="round" stroke-linecap="round"/>'
    );
    if (style.sketch && fill !== 'none') mains.push(`<${tag} ${attrs} fill="${PAPER}"/>`);
    mains.push(
      `<${tag} ${attrs} fill="${fill}" fill-opacity="${style.fillOpacity}" stroke="${style.stroke}" ` +
        `stroke-width="${style.width}" stroke-linejoin="round" stroke-linecap="round"/>`
    );
    if (style.sketch) {
      sketches.push(
        `<${tag} ${attrs} fill="none" stroke="${GRAPHITE}" stroke-opacity="0.5" stroke-width="2" ` +
          'stroke-dasharray="14 7" transform="translate(3 -3)"/>'
      );
    }
  };
  const render = (title) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">` +
    `<title>${title}</title>${halos.join('')}${mains.join('')}${sketches.join('')}</svg>`;
  return { shape, render };
}

function head(c, { eyes, accent = CYAN, y = 0 }) {
  c.shape('rect', `x="56" y="${74 + y}" width="144" height="116" rx="34"`, CHARCOAL);
  c.shape('rect', `x="120" y="${48 + y}" width="16" height="30"`, SLATE);
  c.shape('circle', `cx="128" cy="${44 + y}" r="11"`, accent);
  c.shape('rect', `x="30" y="${112 + y}" width="26" height="40" rx="10"`, SLATE);
  c.shape('rect', `x="200" y="${112 + y}" width="26" height="40" rx="10"`, SLATE);
  eyes(c, y, accent);
}

const flatEyes = (c, y, accent) => {
  c.shape('rect', `x="86" y="${126 + y}" width="30" height="10" rx="5"`, accent);
  c.shape('rect', `x="140" y="${126 + y}" width="30" height="10" rx="5"`, accent);
};

const upEyes = (c, y, accent) => {
  c.shape('circle', `cx="101" cy="${122 + y}" r="14"`, accent);
  c.shape('circle', `cx="155" cy="${122 + y}" r="14"`, accent);
};

const crossEyes = (c, y, accent) => {
  c.shape('path', `d="M88 ${114 + y} L114 ${140 + y} M114 ${114 + y} L88 ${140 + y}"`, 'none');
  c.shape('path', `d="M142 ${114 + y} L168 ${140 + y} M168 ${114 + y} L142 ${140 + y}"`, 'none');
  c.shape('circle', `cx="128" cy="${160 + y}" r="9"`, accent);
};

const checkEyes = (c, y, accent) => {
  c.shape('path', `d="M86 ${132 + y} Q101 ${112 + y} 116 ${132 + y}"`, 'none');
  c.shape('path', `d="M140 ${132 + y} Q155 ${112 + y} 170 ${132 + y}"`, 'none');
  c.shape('rect', `x="108" y="${156 + y}" width="40" height="8" rx="4"`, accent);
};

const SPECS = [
  {
    slug: 'ai-idle',
    title: 'AI agent idle telemetry badge',
    build(c) {
      head(c, { eyes: flatEyes, accent: CYAN, y: 14 });
      c.shape('path', 'd="M190 52 h28 l-28 30 h28"', 'none');
    },
  },
  {
    slug: 'ai-thinking',
    title: 'AI agent thinking telemetry badge',
    build(c) {
      head(c, { eyes: upEyes, accent: VIOLET, y: 22 });
      c.shape('circle', 'cx="206" cy="68" r="10"', VIOLET);
      c.shape('circle', 'cx="226" cy="36" r="14"', VIOLET);
    },
  },
  {
    slug: 'ai-streaming',
    title: 'AI agent streaming telemetry badge',
    build(c) {
      head(c, { eyes: flatEyes, accent: CYAN, y: 4 });
      c.shape('rect', 'x="70" y="196" width="116" height="14" rx="7"', CYAN);
      c.shape('rect', 'x="70" y="218" width="84" height="14" rx="7"', YELLOW);
      c.shape('rect', 'x="70" y="240" width="52" height="10" rx="5"', MAGENTA);
    },
  },
  {
    slug: 'ai-complete',
    title: 'AI agent complete telemetry badge',
    build(c) {
      head(c, { eyes: checkEyes, accent: YELLOW, y: 8 });
      c.shape('circle', 'cx="198" cy="196" r="38"', YELLOW);
      c.shape('path', 'd="M180 196 L194 210 L218 182"', 'none');
    },
  },
  {
    slug: 'ai-error',
    title: 'AI agent error telemetry badge',
    build(c) {
      head(c, { eyes: crossEyes, accent: MAGENTA, y: 8 });
      c.shape('path', 'd="M214 120 L240 150 L204 156 L226 190 L190 176 L182 214 L168 178"', MAGENTA);
    },
  },
  {
    slug: 'swarm-leader',
    title: 'Swarm leader telemetry badge',
    build(c) {
      c.shape('path', 'd="M128 150 L58 206 M128 150 L198 206"', 'none');
      c.shape('circle', 'cx="58" cy="206" r="26"', SLATE);
      c.shape('circle', 'cx="198" cy="206" r="26"', SLATE);
      c.shape('circle', 'cx="128" cy="140" r="52"', CHARCOAL);
      c.shape('path', 'd="M92 80 L104 38 L128 66 L152 38 L164 80 Z"', YELLOW);
      c.shape('rect', 'x="104" y="130" width="48" height="10" rx="5"', CYAN);
    },
  },
  {
    slug: 'merkle-sealed',
    title: 'Merkle sealed telemetry badge',
    build(c) {
      const branches = 'M128 70 L78 130 L40 196 M78 130 L116 196 M128 70 L178 130 L140 196 M178 130 L216 196';
      c.shape('path', `d="${branches}"`, 'none');
      for (const x of [40, 116, 140, 216]) {
        c.shape('rect', `x="${x - 16}" y="190" width="32" height="32" rx="8"`, SLATE);
      }
      c.shape('circle', 'cx="78" cy="130" r="20"', CHARCOAL);
      c.shape('circle', 'cx="178" cy="130" r="20"', CHARCOAL);
      c.shape('circle', 'cx="128" cy="70" r="40"', YELLOW);
      c.shape('path', 'd="M110 70 L124 84 L148 56"', 'none');
    },
  },
  {
    slug: 'scope-locked',
    title: 'Scope locked telemetry badge',
    build(c) {
      c.shape('path', 'd="M30 76 V34 H72 M184 34 H226 V76 M226 180 V222 H184 M72 222 H30 V180"', 'none');
      c.shape('path', 'd="M92 120 V92 a36 36 0 0 1 72 0 V120"', 'none');
      c.shape('rect', 'x="74" y="116" width="108" height="86" rx="18"', YELLOW);
      c.shape('circle', 'cx="128" cy="150" r="12"', INK);
      c.shape('rect', 'x="122" y="156" width="12" height="28" rx="5"', INK);
    },
  },
];

const variants = Object.keys(STYLES);

function relBase(spec, variant) {
  return `${OUT_DIR}/${spec.slug}-${variant}`;
}

async function renderPng(spec, variant) {
  const canvas = createCanvas(STYLES[variant]);
  spec.build(canvas);
  const raw = await sharp(Buffer.from(canvas.render(spec.title), 'utf8')).ensureAlpha().raw().toBuffer();
  for (let i = 3; i < raw.length; i += 4) raw[i] = raw[i] >= 200 ? 255 : raw[i] >= 90 ? 160 : 0;
  return sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, quality: 92, colors: 128, effort: 10, dither: 0 })
    .toBuffer();
}

function assertTransparentCorners(data, path) {
  const alphaAt = (x, y) => data[(y * SIZE + x) * 4 + 3];
  for (const [x, y] of [[1, 1], [SIZE - 2, 1], [1, SIZE - 2], [SIZE - 2, SIZE - 2]]) {
    if (alphaAt(x, y) !== 0) throw new Error(`Non-transparent corner on ${path}`);
  }
}

function countOpaquePixels(data) {
  let opaque = 0;
  let paperHalo = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) continue;
    opaque += 1;
    if (data[i] > 225 && data[i + 1] > 220 && data[i + 2] > 200) paperHalo += 1;
  }
  return { opaque, paperHalo };
}

async function verifyAsset(path) {
  const abs = resolve(packageRoot, path);
  const size = (await stat(abs).catch(() => null))?.size;
  if (!size) throw new Error(`Missing output: ${path}`);
  if (size > MAX_BYTES) throw new Error(`Budget violation on ${path}: ${size}B`);
  const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== SIZE || info.height !== SIZE) throw new Error(`Size mismatch on ${path}`);
  assertTransparentCorners(data, path);
  const { opaque, paperHalo } = countOpaquePixels(data);
  if (opaque < SIZE * SIZE * 0.08) throw new Error(`Too little opaque coverage on ${path}`);
  if (paperHalo < 400) throw new Error(`Missing light contrast edge on ${path}`);
}

function manifestEntries() {
  return SPECS.flatMap((spec) =>
    variants.map((variant) => ({
      path: `${relBase(spec, variant)}.png`,
      kind: 'state-illustration',
      variant: `${spec.slug}-${variant}`,
      format: 'png',
      width: SIZE,
      height: SIZE,
      pack: 'telemetry-pack',
      domain: 'visual-universe',
      status: 'review',
      license: 'ISC',
      source: 'packages/assets/scripts/generate-ai-telemetry-pack.mjs',
    }))
  );
}

export async function registerTelemetryPack() {
  const entries = manifestEntries();
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const owned = new Set([
    ...manifest.assets.map(({ path }) => path).filter((path) => path.startsWith(OWNED_PREFIX)),
    ...entries.map(({ path }) => path),
  ]);
  manifest.assets = replaceGeneratedAssets(manifest.assets, entries, owned);
  await atomicWrite(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function generateTelemetryPack({ checkOnly = false } = {}) {
  if (!checkOnly) {
    for (const spec of SPECS) {
      for (const variant of variants) {
        await atomicWrite(resolve(packageRoot, `${relBase(spec, variant)}.png`), await renderPng(spec, variant));
      }
    }
  }
  for (const spec of SPECS) {
    for (const variant of variants) await verifyAsset(`${relBase(spec, variant)}.png`);
  }
  return SPECS.length * variants.length;
}

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = argv.includes('--check');
  const count = await generateTelemetryPack({ checkOnly });
  if (!checkOnly) await registerTelemetryPack();
  stdout.write(`${checkOnly ? 'Verified' : 'Generated'} ${count} telemetry PNG assets.\n`);
}
