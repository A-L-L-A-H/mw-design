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
const OUT_DIR = 'illustrations/ui-state-pack';
const WIDTH = 512;
const HEIGHT = 384;
const FEATHER_ROWS = 44;
const MAX_BYTES = 160 * 1024;
const SPRITE_HEIGHT = 268;
const SPRITE_MAX_WIDTH = 380;
const SPRITE_BASE_Y = 312;

const INK = '#0d0d0d';
const PAPER = '#f3efe4';
const WOOD = '#8b5a2b';
const WOOD_DARK = '#6b4220';
const GRASS = '#2fa85a';
const GRASS_DARK = '#1f7a41';

const YELLOW = '#ffe031';
const MAGENTA = '#ff2e88';
const CYAN = '#00b8f0';
const VIOLET = '#c084fc';

const PROPS = {
  question: [
    ['path', 'd="M28 40 a28 26 0 1 1 46 18 q-18 8 -18 24"', 'none'], ['circle', 'cx="56" cy="102" r="7"', YELLOW],
  ],
  spinner: [['path', 'd="M56 14 a42 42 0 1 1 -42 42"', 'none'], ['circle', 'cx="56" cy="14" r="10"', CYAN]],
  warning: [
    ['path', 'd="M56 10 L106 98 H6 Z"', YELLOW],
    ['path', 'd="M56 40 v30"', 'none'],
    ['circle', 'cx="56" cy="84" r="5"', INK],
  ],
  check: [['circle', 'cx="56" cy="56" r="46"', YELLOW], ['path', 'd="M32 58 L50 76 L82 38"', 'none']],
  cross: [['circle', 'cx="56" cy="56" r="46"', MAGENTA], ['path', 'd="M36 36 L76 76 M76 36 L36 76"', 'none']],
  wifi: [
    ['path', 'd="M12 48 a62 62 0 0 1 88 0 M30 66 a36 36 0 0 1 52 0"', 'none'],
    ['circle', 'cx="56" cy="88" r="8"', MAGENTA],
  ],
  lock: [
    ['path', 'd="M34 54 V38 a22 22 0 0 1 44 0 V54"', 'none'],
    ['rect', 'x="22" y="52" width="68" height="52" rx="12"', YELLOW],
  ],
  mail: [['rect', 'x="8" y="22" width="96" height="68" rx="10"', PAPER], ['path', 'd="M10 28 L56 62 L102 28"', 'none']],
  bell: [
    ['path', 'd="M20 84 C34 70 30 50 36 38 a20 20 0 0 1 40 0 C82 50 78 70 92 84 Z"', YELLOW],
    ['circle', 'cx="56" cy="96" r="8"', INK],
  ],
  clock: [['circle', 'cx="56" cy="56" r="46"', PAPER], ['path', 'd="M56 28 V58 L76 70"', 'none']],
  book: [
    ['path', 'd="M10 24 H54 V94 H10 Z M58 24 H102 V94 H58 Z"', PAPER],
    ['path', 'd="M20 42 H44 M20 58 H44 M68 42 H92"', 'none'],
  ],
  pencil: [['path', 'd="M22 90 L16 104 L32 98 L90 40 L72 22 Z"', YELLOW], ['path', 'd="M66 28 L84 46"', 'none']],
  magnifier: [['circle', 'cx="46" cy="46" r="32"', CYAN], ['path', 'd="M70 70 L102 102"', 'none']],
  cloud: [
    ['path', 'd="M30 86 a24 24 0 0 1 4-48 a30 30 0 0 1 56 10 a20 20 0 0 1-4 38 Z"', PAPER],
    ['path', 'd="M56 96 V60 M44 72 L56 60 L68 72"', 'none'],
  ],
  gear: [
    ['circle', 'cx="56" cy="56" r="36"', VIOLET],
    ['circle', 'cx="56" cy="56" r="12"', PAPER],
    ['path', 'd="M56 10 V22 M56 90 V102 M10 56 H22 M90 56 H102"', 'none'],
  ],
  star: [['path', 'd="M56 6 L68 42 L106 44 L76 66 L86 104 L56 82 L26 104 L36 66 L6 44 L44 42 Z"', YELLOW]],
  bolt: [['path', 'd="M66 6 L22 62 H54 L44 104 L92 44 H60 Z"', YELLOW]],
  zzz: [['path', 'd="M10 28 H44 L10 62 H44 M52 70 H80 L52 98 H80"', 'none']],
  flag: [['path', 'd="M20 104 V10"', 'none'], ['path', 'd="M20 14 H92 L78 34 L92 54 H20 Z"', MAGENTA]],
  wrench: [['path', 'd="M80 12 a24 24 0 0 0-26 32 L12 86 L26 100 L68 58 a24 24 0 0 0 32-26 L82 46 L66 30 Z"', CYAN]],
};

const K = 'illustrations/riot-universe/characters/kuro-signal-';
const R = 'illustrations/rocksoul-universe/rocksoul';
const spec = (slug, subject, sprite, env, prop) => ({ slug, subject, sprite, env, prop: PROPS[prop] });

const STATE_SPECS = [
  spec('state-empty-inbox', 'kuro-signal', `${K}expression-sleepy.png`, 'desk', 'mail'),
  spec('state-empty-collection', 'kuro-signal', `${K}expression-curious.png`, 'desk', 'question'),
  spec('state-empty-search', 'kuro-signal', `${K}expression-confused.png`, 'desk', 'magnifier'),
  spec('state-empty-notifications', 'kuro-signal', `${K}expression-disappointed.png`, 'desk', 'bell'),
  spec('state-loading-sync', 'kuro-signal', `${K}expression-thinking.png`, 'desk', 'spinner'),
  spec('state-loading-upload', 'kuro-signal', `${K}pose-working.png`, 'desk', 'cloud'),
  spec('state-loading-render', 'rocksoul', `${R}/rocksoul-black-resolve-signal-lock-cel.png`, 'forest', 'gear'),
  spec('state-error-generic', 'kuro-signal', `${K}expression-surprised.png`, 'desk', 'warning'),
  spec('state-error-network', 'kuro-signal', `${K}expression-crying.png`, 'desk', 'wifi'),
  spec('state-error-permission', 'kuro-signal', `${K}expression-angry.png`, 'desk', 'lock'),
  spec('state-error-not-found', 'rocksoul', `${R}/rocksoul-green-mercy-portrait-cel.png`, 'forest', 'question'),
  spec('state-error-timeout', 'kuro-signal', `${K}expression-embarrassed.png`, 'desk', 'clock'),
  spec('state-desk-writing', 'kuro-signal', `${K}pose-working.png`, 'desk', 'pencil'),
  spec('state-desk-reading', 'kuro-signal', `${K}pose-reading.png`, 'desk', 'book'),
  spec('state-desk-gaming', 'kuro-signal', `${K}pose-gaming.png`, 'desk', 'bolt'),
  spec('state-desk-review', 'kuro-signal', `${K}expression-determined.png`, 'desk', 'magnifier'),
  spec('state-desk-idle', 'kuro-signal', `${K}pose-sitting.png`, 'desk', 'zzz'),
  spec('state-success-saved', 'kuro-signal', `${K}expression-happy.png`, 'desk', 'check'),
  spec('state-success-published', 'kuro-signal', `${K}expression-laughing.png`, 'desk', 'flag'),
  spec('state-offline', 'rocksoul', `${R}/rocksoul-black-resolve-portrait-cel.png`, 'forest', 'wifi'),
  spec('state-maintenance', 'rocksoul', `${R}/rocksoul-green-mercy-overdrive-cel.png`, 'forest', 'wrench'),
  spec('state-onboarding-welcome', 'kuro-signal', `${K}pose-waving.png`, 'desk', 'star'),
  spec('state-scope-locked', 'rocksoul', `${R}/rocksoul-black-resolve-pose-standing-cel.png`, 'forest', 'lock'),
  spec('state-celebration', 'kuro-signal', `${K}expression-victory.png`, 'desk', 'star'),
];

const SVG_OPEN =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
  `width="${WIDTH}" height="${HEIGHT}">`;
const svgDoc = (body) => Buffer.from(`${SVG_OPEN}${body}</svg>`, 'utf8');

const outline = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

function deskPlate() {
  return svgDoc(
    `<rect x="36" y="300" width="440" height="120" rx="16" fill="${WOOD}" ${outline}/>` +
      `<rect x="36" y="296" width="440" height="38" rx="14" fill="${PAPER}" ${outline}/>` +
      `<path d="M60 352 H220 M280 352 H452 M60 372 H150 M210 372 H420" stroke="${WOOD_DARK}" ` +
      'stroke-width="3" stroke-linecap="round" fill="none"/>' +
      `<rect x="52" y="262" width="34" height="38" rx="6" fill="#fff" ${outline}/>` +
      `<path d="M86 272 H98 a8 10 0 0 1 0 20 H86" fill="none" ${outline}/>`
  );
}

function forestBack() {
  const pine = (x, top, w) =>
    `<path d="M${x} ${top} L${x + w} ${top + 90} H${x - w} Z M${x} ${top + 40} L${x + w + 8} ${top + 140} ` +
    `H${x - w - 8} Z" fill="${GRASS_DARK}" ${outline}/>`;
  return svgDoc(pine(60, 150, 34) + pine(452, 160, 30) + pine(110, 190, 24));
}

function forestPlate() {
  return svgDoc(
    `<path d="M40 420 V345 C40 318 130 298 256 298 C382 298 472 318 472 345 V420 Z" ` +
      `fill="${GRASS}" ${outline}/>` +
      `<path d="M84 340 q10-14 20 0 M390 332 q10-14 20 0 M330 360 q10-14 20 0" fill="none" ` +
      `stroke="${GRASS_DARK}" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="420" cy="322" r="7" fill="${YELLOW}" ${outline}/>` +
      `<circle cx="96" cy="318" r="7" fill="${MAGENTA}" ${outline}/>`
  );
}

async function shadowHalo() {
  const svg = svgDoc(
    '<defs><filter id="b" x="-20%" y="-60%" width="140%" height="220%">' +
      '<feGaussianBlur stdDeviation="6"/></filter></defs>' +
      `<ellipse cx="256" cy="304" rx="120" ry="9" fill="${INK}" fill-opacity="0.34" filter="url(#b)"/>`
  );
  return sharp(svg).png().toBuffer();
}

function propLayer(prop) {
  const halos = [];
  const mains = [];
  for (const [tag, attrs, fill] of prop) {
    const haloFill = fill === 'none' ? 'none' : PAPER;
    halos.push(
      `<${tag} ${attrs} fill="${haloFill}" stroke="${PAPER}" stroke-width="15" ` +
        'stroke-linejoin="round" stroke-linecap="round"/>'
    );
    mains.push(`<${tag} ${attrs} fill="${fill}" ${outline}/>`);
  }
  return svgDoc(`<g transform="translate(382 36)">${halos.join('')}${mains.join('')}</g>`);
}

function featherBottom(data) {
  const start = HEIGHT - FEATHER_ROWS;
  for (let y = start; y < HEIGHT; y += 1) {
    const t = 1 - (y - start + 1) / FEATHER_ROWS;
    const smooth = t * t * (3 - 2 * t);
    for (let x = 0; x < WIDTH; x += 1) {
      const idx = (y * WIDTH + x) * 4 + 3;
      data[idx] = Math.round(data[idx] * smooth);
    }
  }
}

async function renderVignette(spec) {
  const sprite = await sharp(resolve(packageRoot, spec.sprite))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize({ width: SPRITE_MAX_WIDTH, height: SPRITE_HEIGHT, fit: 'inside' })
    .png()
    .toBuffer();
  const spriteMeta = await sharp(sprite).metadata();
  const environment = spec.env === 'forest' ? forestPlate() : deskPlate();
  const layers = [
    ...(spec.env === 'forest' ? [{ input: forestBack() }] : []),
    { input: sprite, left: Math.round((WIDTH - spriteMeta.width) / 2), top: SPRITE_BASE_Y - spriteMeta.height },
    { input: environment },
    { input: await shadowHalo() },
    { input: propLayer(spec.prop) },
  ];
  const flattened = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  featherBottom(flattened);
  return flattened;
}

async function encode(raw) {
  const rawOptions = { raw: { width: WIDTH, height: HEIGHT, channels: 4 } };
  const png = await sharp(raw, rawOptions)
    .png({ compressionLevel: 9, palette: true, quality: 90, colors: 256, effort: 10, dither: 0 })
    .toBuffer();
  let webp = null;
  for (const quality of [88, 80, 70, 60]) {
    webp = await sharp(raw, rawOptions).webp({ quality, alphaQuality: 92, effort: 6 }).toBuffer();
    if (webp.length <= MAX_BYTES) break;
  }
  return { png, webp };
}

function rowMeanAlpha(data, y) {
  let sum = 0;
  for (let x = 0; x < WIDTH; x += 1) sum += data[(y * WIDTH + x) * 4 + 3];
  return sum / WIDTH;
}

function assertFeatheredBottom(data, path) {
  if (rowMeanAlpha(data, HEIGHT - 1) > 1) throw new Error(`Bottom edge is not fully feathered on ${path}`);
  for (let y = HEIGHT - FEATHER_ROWS + 1; y < HEIGHT; y += 1) {
    const step = rowMeanAlpha(data, y - 1) - rowMeanAlpha(data, y);
    if (step < -2) throw new Error(`Feather is not monotonic at row ${y} on ${path}`);
    if (step > 28) throw new Error(`Sharp bottom cut at row ${y} on ${path}`);
  }
}

function assertCutoutShape(data, path) {
  const alphaAt = (x, y) => data[(y * WIDTH + x) * 4 + 3];
  for (const [x, y] of [[1, 1], [WIDTH - 2, 1], [1, HEIGHT - 2], [WIDTH - 2, HEIGHT - 2]]) {
    if (alphaAt(x, y) > 4) throw new Error(`Non-transparent corner on ${path}`);
  }
  if (alphaAt(256, 330) < 250) throw new Error(`Ground plate is not opaque on ${path}`);
  assertFeatheredBottom(data, path);
}

async function verifyAsset(path) {
  const abs = resolve(packageRoot, path);
  const size = (await stat(abs).catch(() => null))?.size;
  if (!size) throw new Error(`Missing output: ${path}`);
  if (size > MAX_BYTES) throw new Error(`Budget violation on ${path}: ${size}B`);
  const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== WIDTH || info.height !== HEIGHT) throw new Error(`Size mismatch on ${path}`);
  assertCutoutShape(data, path);
}

const basePath = (spec) => `${OUT_DIR}/${spec.slug}`;

function manifestEntries() {
  return STATE_SPECS.flatMap((spec) =>
    ['png', 'webp'].map((format) => ({
      path: `${basePath(spec)}.${format}`,
      kind: 'state-illustration',
      variant: spec.slug,
      subject: spec.subject,
      format,
      width: WIDTH,
      height: HEIGHT,
      pack: 'ui-state-pack',
      domain: 'visual-universe',
      status: 'review',
      license: 'ISC',
      source: 'packages/assets/scripts/generate-ui-state-cutouts.mjs',
    }))
  );
}

export async function registerUiStatePack() {
  const entries = manifestEntries();
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const owned = new Set([
    ...manifest.assets.map(({ path }) => path).filter((path) => path.startsWith(`${OUT_DIR}/`)),
    ...entries.map(({ path }) => path),
  ]);
  manifest.assets = replaceGeneratedAssets(manifest.assets, entries, owned);
  await atomicWrite(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function generateUiStateCutouts({ checkOnly = false } = {}) {
  if (!checkOnly) {
    for (const spec of STATE_SPECS) {
      const { png, webp } = await encode(await renderVignette(spec));
      await atomicWrite(resolve(packageRoot, `${basePath(spec)}.png`), png);
      await atomicWrite(resolve(packageRoot, `${basePath(spec)}.webp`), webp);
    }
  }
  for (const spec of STATE_SPECS) {
    await verifyAsset(`${basePath(spec)}.png`);
    await verifyAsset(`${basePath(spec)}.webp`);
  }
  return STATE_SPECS.length * 2;
}

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = argv.includes('--check');
  const count = await generateUiStateCutouts({ checkOnly });
  if (!checkOnly) await registerUiStatePack();
  stdout.write(`${checkOnly ? 'Verified' : 'Generated'} ${count} UI state vignette assets.\n`);
}
