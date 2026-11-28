import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_SPRITE_BYTES = 160 * 1024;
const P = {
  ink: '#0d0d0d', charcoal: '#1b1d24', suit: '#31353d', suitDark: '#23262d',
  paper: '#f3efe4', paperShade: '#e3dfd4', paperBright: '#fffdf6',
  crimson: '#d1132a', crimsonDeep: '#9f1022', cyan: '#00b8f0',
  yellow: '#ffe031', skin: '#fad7bf', skinShade: '#deb094', wood: '#8b5a2b',
};

function halftoneBurst(cx, cy, grid, color, op = 0.72) {
  const [cols, rows] = grid;
  const dots = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const dx = cx + (c - cols / 2) * 18 + (r % 2) * 9;
      const dy = cy + (r - rows / 2) * 18;
      const rad = 2.8 - Math.abs(c - cols / 2) * 0.25;
      if (rad > 0.7) {
        dots.push(`<circle cx="${dx}" cy="${dy}" r="${rad.toFixed(1)}" fill="${color}" fill-opacity="${op}"/>`);
      }
    }
  }
  return dots.join('');
}

function starBurst(cx, cy, outerR, innerR, pts = 4) {
  const segs = [];
  for (let i = 0; i < pts * 2; i += 1) {
    const a = (Math.PI * i) / pts - Math.PI / 2;
    const rad = i % 2 === 0 ? outerR : innerR;
    segs.push(`${i === 0 ? 'M' : 'L'} ${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return `${segs.join(' ')} Z`;
}

function crosshatchPattern(id, color, op = 0.55) {
  return `<defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse">` +
    `<path d="M0 14L14 0M-3 7L7 -3M7 17L17 7" stroke="${color}" stroke-width="1.5" stroke-opacity="${op}"/>` +
    `<path d="M0 0L14 14M7 -3L17 7M-3 7L7 17" stroke="${color}" stroke-width="1.1" stroke-opacity="${op * 0.7}"/>` +
    '</pattern></defs>';
}

function buildIsrockfeelHead(cy, mode, pencil) {
  const skin = pencil ? P.paperBright : P.skin;
  const hair = pencil ? P.paperShade : P.crimson;
  const hairDeep = pencil ? P.paper : P.crimsonDeep;
  const hp = pencil ? P.paper : P.charcoal;
  const mouth = mode === 'riffing'
    ? `<path d="M236 ${cy + 38}q20 22 40 0q-20 7-40 0Z" fill="${P.crimson}" stroke="${P.ink}" stroke-width="4"/>`
    : `<path d="M238 ${cy + 39}q18 ${mode === 'smirk' ? 9 : 4} 36-3" fill="none" stroke="${P.ink}" ` +
      'stroke-width="4.5" stroke-linecap="round"/>';
  return `<path d="M236 ${cy + 58}h40v36h-40Z" fill="${pencil ? P.paperShade : P.skinShade}" stroke="${P.ink}" ` +
    'stroke-width="5"/>' +
    `<path d="M204 ${cy - 34}l-32-52 46 22 6-66 28 52 24-66 14 66 44-24-22 52Z" fill="${hair}" ` +
    `stroke="${P.paper}" stroke-width="10" stroke-linejoin="round"/>` +
    `<path d="M204 ${cy - 34}l-32-52 46 22 6-66 28 52 24-66 14 66 44-24-22 52Z" fill="${hair}" ` +
    `stroke="${P.ink}" stroke-width="5.5" stroke-linejoin="round"/>` +
    `<path d="M188 ${cy - 12}a68 68 0 0 1 136 0" fill="none" stroke="${hp}" stroke-width="11" ` +
    'stroke-linecap="round"/>' +
    `<path d="M204 ${cy - 18}c0-26 22-44 52-44s52 18 52 44v28l-18 32-34 14-34-14-18-32Z" fill="${skin}" ` +
    `stroke="${P.ink}" stroke-width="5.5" stroke-linejoin="round"/>` +
    `<path d="M206 ${cy - 30}l22-18 14 14 18-16 14 16 26-10 8 22-22-4-16 14-16-12-22 14-18-10Z" ` +
    `fill="${hairDeep}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="174" y="${cy - 18}" width="24" height="44" rx="8" fill="${P.crimson}" stroke="${P.ink}" ` +
    `stroke-width="5"/><rect x="314" y="${cy - 18}" width="24" height="44" rx="8" fill="${P.cyan}" ` +
    `stroke="${P.ink}" stroke-width="5"/><polygon points="205,${cy - 8} 307,${cy - 8} 297,${cy + 16} ` +
    `262,${cy + 10} 250,${cy + 10} 215,${cy + 16}" fill="${P.ink}" stroke="${P.paper}" stroke-width="2.5"/>` +
    `<path d="M214 ${cy}l28 5M270 ${cy + 5}l28-5" stroke="${P.cyan}" stroke-width="3.8" ` +
    `stroke-linecap="round"/>${mouth}`;
}

function buildIsrockfeelGuitar(yOff, pencil) {
  const bodyFill = pencil ? P.paper : P.crimson;
  const guardFill = pencil ? P.paperBright : P.yellow;
  return `<g transform="translate(0 ${yOff})">` +
    `<path d="M164 316l68 60-30 46 62 14 14 44-76-20-44 42 8-68-42-22 40-20Z" fill="${bodyFill}" ` +
    `stroke="${P.paper}" stroke-width="10" stroke-linejoin="round"/>` +
    `<path d="M164 316l68 60-30 46 62 14 14 44-76-20-44 42 8-68-42-22 40-20Z" fill="${bodyFill}" ` +
    `stroke="${P.ink}" stroke-width="5.5" stroke-linejoin="round"/>` +
    `<polygon points="174,344 210,378 190,404 220,412 180,434" fill="${guardFill}" stroke="${P.ink}" ` +
    'stroke-width="3.5" stroke-linejoin="round"/>' +
    `<path d="M216 368l144-122 18-26 22 12-16 28-152 126Z" fill="${P.charcoal}" stroke="${P.ink}" ` +
    'stroke-width="5" stroke-linejoin="round"/>' +
    `<path d="M236 354l112-94" stroke="${P.cyan}" stroke-width="3.5" stroke-dasharray="6 9"/></g>`;
}

function buildIsrockfeelBody(yOff, spec) {
  const isPose = spec.height === 768;
  const pencil = spec.style === 'rough-pencil';
  const jacket = pencil ? P.paperShade : P.charcoal;
  const tee = pencil ? P.paperBright : P.suit;
  const legs = isPose
    ? `<ellipse cx="256" cy="720" rx="146" ry="18" fill="${P.ink}" fill-opacity="0.72"/>` +
      `<path d="M188 470l-28 196 48 10 38-150 20 150 50-8-26-198Z" fill="${jacket}" stroke="${P.paper}" ` +
      `stroke-width="9" stroke-linejoin="round"/><path d="M188 470l-28 196 48 10 38-150 20 150 50-8-26-198Z" ` +
      `fill="${jacket}" stroke="${P.ink}" stroke-width="6" stroke-linejoin="round"/>` +
      `<path d="M148 666h68l6 32h-82Z M264 666h68l8 32h-80Z" fill="${P.ink}" stroke="${P.crimson}" ` +
      'stroke-width="4" stroke-linejoin="round"/>'
    : '';
  const armRight = spec.mode === 'smirk' && isPose
    ? `<path d="M352 290l66 30-16 42-60-24Z" fill="${jacket}" stroke="${P.ink}" stroke-width="5.5"/>` +
      `<circle cx="422" cy="342" r="18" fill="${pencil ? P.paperBright : P.skin}" stroke="${P.ink}" ` +
      `stroke-width="4.5"/><path d="M434 336l28-14" stroke="${P.cyan}" stroke-width="6" stroke-linecap="round"/>`
    : `<path d="M342 292l38 82-36 18-32-74Z" fill="${jacket}" stroke="${P.ink}" stroke-width="5.5"/>` +
      `<circle cx="332" cy="392" r="18" fill="${pencil ? P.paperBright : P.skin}" stroke="${P.ink}" stroke-width="4.5"/>`;
  const armLeft = `<path d="M170 292l-46 78 34 22 36-74Z" fill="${jacket}" stroke="${P.ink}" stroke-width="5.5"/>` +
    `<circle cx="152" cy="388" r="18" fill="${pencil ? P.paperBright : P.skin}" stroke="${P.ink}" stroke-width="4.5"/>`;
  return `${legs}<g transform="translate(0 ${yOff})">${armLeft}${armRight}` +
    `<path d="M168 272q88-26 176 0l14 198H154Z" fill="${jacket}" stroke="${P.paper}" stroke-width="10" ` +
    'stroke-linejoin="round"/>' +
    `<path d="M168 272q88-26 176 0l14 198H154Z" fill="${jacket}" stroke="${P.ink}" stroke-width="6" ` +
    'stroke-linejoin="round"/>' +
    `<polygon points="212,262 256,374 300,262" fill="${tee}" stroke="${P.ink}" stroke-width="4.5"/>` +
    `<path d="M212 262l-26 24 28 54 16-20Z M300 262l26 24-28 54-16-20Z" fill="${P.crimson}" stroke="${P.ink}" ` +
    'stroke-width="4" stroke-linejoin="round"/>' +
    `<path d="M162 340l28-10 5 14-28 10Z" fill="${P.cyan}" stroke="${P.ink}" stroke-width="3"/>` +
    `<circle cx="196" cy="306" r="5" fill="${P.paperShade}" stroke="${P.ink}" stroke-width="2.5"/></g>`;
}

function buildIsrockfeelSvg(spec) {
  const isPose = spec.height === 768;
  const pencil = spec.style === 'rough-pencil';
  const burstY = isPose ? 260 : 210;
  const bgBurst = halftoneBurst(102, burstY, [6, 5], pencil ? P.ink : P.crimson, pencil ? 0.52 : 0.72) +
    halftoneBurst(406, burstY + 40, [6, 5], pencil ? P.crimson : P.cyan, pencil ? 0.56 : 0.72);
  const fx = `<path d="${starBurst(422, 120, 22, 8, 4)}" fill="${P.yellow}" stroke="${P.ink}" stroke-width="4"/>` +
    `<path d="${starBurst(84, 146, 18, 6, 4)}" fill="${P.cyan}" stroke="${P.ink}" stroke-width="3.5"/>`;
  const [headY, torsoY] = [isPose ? 168 : 196, isPose ? 20 : 48];
  const guitar = spec.guitar ? buildIsrockfeelGuitar(isPose ? 24 : 50, pencil) : '';
  const pencilGrid = pencil
    ? `${crosshatchPattern('ir_hatch', P.ink, 0.55)}<polygon points="168,292 344,292 358,490 154,490" ` +
      'fill="url(#ir_hatch)"/>'
    : '';
  const body = `${bgBurst}${buildIsrockfeelBody(torsoY, spec)}${pencilGrid}` +
    `${buildIsrockfeelHead(headY, spec.mode, pencil)}${guitar}${fx}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.width} ${spec.height}" ` +
    `width="${spec.width}" height="${spec.height}">${body}</svg>`;
}

async function floodFillCutout(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let [head, tail] = [0, 0];
  const enqueue = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    const o = p * 4;
    const [r, g, b] = [data[o], data[o + 1], data[o + 2]];
    if (r > 234 && g > 234 && b > 234 && Math.max(r, g, b) - Math.min(r, g, b) < 24) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < w; x += 1) { enqueue(x, 0); enqueue(x, h - 1); }
  for (let y = 0; y < h; y += 1) { enqueue(0, y); enqueue(w - 1, y); }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p - x) / w;
    enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
  }
  for (let p = 0; p < w * h; p += 1) {
    if (visited[p]) data[p * 4 + 3] = 0;
  }
  return { data, width: w, height: h };
}

function shadePencilRgb(src, o, edge, lv, xy) {
  const [x, y] = xy;
  const isAccent = (src[o] > 180 && src[o + 1] > 155 && src[o + 2] < 90) ||
    (src[o] > 175 && src[o + 2] > 90 && src[o + 1] < 85);
  if (isAccent) return [src[o], src[o + 1], src[o + 2]];
  if (edge > 46 || lv < 52) return [24, 24, 29];
  const h1 = (x + y) % 9 < 2;
  const h2 = (x - y + 2048) % 11 < 2;
  if (lv < 118) return h1 || h2 ? [44, 44, 50] : [224, 219, 206];
  if (lv < 185) return h1 ? [82, 79, 73] : [243, 239, 228];
  return [255, 253, 246];
}

function toRoughPencilPixels(src, w, h) {
  const out = Buffer.from(src);
  const lum = (p) => src[p * 4] * 0.299 + src[p * 4 + 1] * 0.587 + src[p * 4 + 2] * 0.114;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const p = y * w + x;
      const o = p * 4;
      if (src[o + 3] === 0) continue;
      const edge = Math.abs(lum(p + 1) - lum(p - 1)) + Math.abs(lum(p + w) - lum(p - w));
      const [r, g, b] = shadePencilRgb(src, o, edge, lum(p), [x, y]);
      out[o] = r; out[o + 1] = g; out[o + 2] = b;
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

function buildWalterLowerBody(mode, pencil) {
  const suit = pencil ? P.paperShade : P.suit;
  const suitDark = pencil ? P.paper : P.suitDark;
  const showBroom = mode === 'sweeping' || mode === 'idle' || pencil;
  const broom = showBroom
    ? `<path d="M292 418l114 238" stroke="${P.ink}" stroke-width="17" stroke-linecap="round"/>` +
      `<path d="M292 418l114 238" stroke="${pencil ? P.paper : P.wood}" stroke-width="9" stroke-linecap="round"/>` +
      `<polygon points="384,650 434,634 468,708 386,718" fill="${pencil ? P.paperBright : P.yellow}" ` +
      `stroke="${P.ink}" stroke-width="5.5" stroke-linejoin="round"/>` +
      '<path d="M402 650l14 60M418 646l20 62M432 642l24 62" stroke="#0d0d0d" stroke-width="3"/>'
    : '';
  const belt = `<path d="M98 416q158 52 316 0l-10 38q-148 52-296 0Z" fill="${P.ink}" stroke="${P.crimson}" ` +
    'stroke-width="3" stroke-linejoin="round"/>';
  return `<ellipse cx="256" cy="722" rx="146" ry="18" fill="${P.ink}" fill-opacity="0.72"/>` +
    `<path d="M108 424h296l-18 118-32 138h-58l-40-124-40 124h-58l-32-138Z" fill="${suit}" stroke="${P.paper}" ` +
    'stroke-width="10" stroke-linejoin="round"/>' +
    `<path d="M108 424h296l-18 118-32 138h-58l-40-124-40 124h-58l-32-138Z" fill="${suit}" stroke="${P.ink}" ` +
    'stroke-width="6" stroke-linejoin="round"/>' +
    `<path d="M126 446l28 110 42 108h20l38-114" fill="none" stroke="${suitDark}" stroke-width="7"/>` +
    `<path d="M150 676h66l6 32h-80Z M294 676h66l8 32h-82Z" fill="${P.ink}" stroke="${P.ink}" ` +
    `stroke-width="5" stroke-linejoin="round"/>${broom}${belt}`;
}

function buildWalterOverlay(mode, h, pencil) {
  const bursts = halftoneBurst(108, 128, [5, 4], pencil ? P.ink : P.cyan, 0.7) +
    halftoneBurst(406, 178, [4, 4], pencil ? P.crimson : P.crimson, 0.65);
  const crown = mode === 'victorious'
    ? `<path d="M366 130l12-44 22 22 22-22 12 44Z" fill="${P.yellow}" stroke="${P.ink}" stroke-width="4.5"/>` +
      `<path d="${starBurst(344, 88, 16, 6, 5)}" fill="${P.yellow}" stroke="${P.ink}" stroke-width="3"/>`
    : '';
  const mic = mode === 'gloating'
    ? `<path d="M372 256l32-54" stroke="${P.ink}" stroke-width="10" stroke-linecap="round"/>` +
      `<circle cx="408" cy="194" r="19" fill="${P.cyan}" stroke="${P.ink}" stroke-width="5"/>`
    : '';
  const sweep = mode === 'sweeping'
    ? `<path d="M46 ${h - 104}q86-34 164-10M38 ${h - 76}q90-30 170-12" fill="none" stroke="${P.cyan}" ` +
      'stroke-width="6" stroke-linecap="round"/>'
    : '';
  const sketch = pencil
    ? `<path d="M48 64l34-18M430 62l34 18M46 ${h - 62}l38 14" stroke="${P.crimson}" stroke-width="4" ` +
      'stroke-linecap="round"/>'
    : '';
  return `${bursts}${crown}${mic}${sweep}${sketch}` +
    `<path d="${starBurst(96, 118, 18, 6, 4)}" fill="${P.yellow}" stroke="${P.ink}" stroke-width="3.5"/>`;
}

async function quantizeAndWrite(rawSharp, w, h, outBase) {
  const rawBuf = await rawSharp.resize(w, h).raw().toBuffer();
  for (let i = 3; i < rawBuf.length; i += 4) {
    rawBuf[i] = rawBuf[i] >= 210 ? 255 : rawBuf[i] >= 100 ? 170 : 0;
  }
  const pngBuf = await sharp(rawBuf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, quality: 92, colors: 256, effort: 10, dither: 0 }).toBuffer();
  const webpBuf = await sharp(rawBuf, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 94, effort: 6 }).toBuffer();
  if (pngBuf.length > MAX_SPRITE_BYTES || webpBuf.length > MAX_SPRITE_BYTES) {
    throw new Error(`${outBase} exceeds ${MAX_SPRITE_BYTES}B budget`);
  }
  await atomicWrite(resolve(packageRoot, `${outBase}.png`), pngBuf);
  await atomicWrite(resolve(packageRoot, `${outBase}.webp`), webpBuf);
}

const ISROCKFEEL_SPECS = [
  { slug: 'isrockfeel-expression-determined', mode: 'determined', style: 'cel', width: 512, height: 512, guitar: false },
  { slug: 'isrockfeel-expression-riffing', mode: 'riffing', style: 'cel', width: 512, height: 512, guitar: true },
  { slug: 'isrockfeel-expression-smirk', mode: 'smirk', style: 'cel', width: 512, height: 512, guitar: false },
  { slug: 'isrockfeel-expression-rough-pencil', mode: 'determined', style: 'rough-pencil',
    width: 512, height: 512, guitar: true },
  { slug: 'isrockfeel-pose-guitar-riff', mode: 'riffing', style: 'cel', width: 512, height: 768, guitar: true },
  { slug: 'isrockfeel-pose-mentor-point', mode: 'smirk', style: 'cel', width: 512, height: 768, guitar: false },
  { slug: 'isrockfeel-pose-power-chord', mode: 'determined', style: 'cel', width: 512, height: 768, guitar: true },
  { slug: 'isrockfeel-pose-rough-pencil', mode: 'riffing', style: 'rough-pencil', width: 512, height: 768, guitar: true },
];

const WALTER_SPECS = [
  { slug: 'walterwhite-expression-idle', mode: 'idle', style: 'cel', width: 512, height: 512, tilt: 0 },
  { slug: 'walterwhite-expression-sweeping', mode: 'sweeping', style: 'cel', width: 512, height: 512, tilt: -4 },
  { slug: 'walterwhite-expression-gloating', mode: 'gloating', style: 'cel', width: 512, height: 512, tilt: 3 },
  { slug: 'walterwhite-expression-victorious', mode: 'victorious', style: 'cel', width: 512, height: 512, tilt: -2 },
  { slug: 'walterwhite-expression-rough-pencil', mode: 'idle', style: 'rough-pencil', width: 512, height: 512, tilt: 0 },
  { slug: 'walterwhite-pose-idle', mode: 'idle', style: 'cel', width: 512, height: 768, tilt: 0 },
  { slug: 'walterwhite-pose-sweeping', mode: 'sweeping', style: 'cel', width: 512, height: 768, tilt: -3 },
  { slug: 'walterwhite-pose-gloating', mode: 'gloating', style: 'cel', width: 512, height: 768, tilt: 3 },
  { slug: 'walterwhite-pose-victorious', mode: 'victorious', style: 'cel', width: 512, height: 768, tilt: -1 },
  { slug: 'walterwhite-pose-rough-pencil', mode: 'sweeping', style: 'rough-pencil', width: 512, height: 768, tilt: -2 },
];

async function renderWalterSpec(spec, celBuf, pencilBuf, outDir) {
  const pencil = spec.style === 'rough-pencil';
  const isPose = spec.height === 768;
  const bust = await sharp(pencil ? pencilBuf : celBuf).resize(isPose ? 430 : 440, isPose ? 430 : 440, {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).rotate(spec.tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const bMeta = await sharp(bust).metadata();
  const bustLayer = { input: bust, left: Math.round((512 - bMeta.width) / 2),
    top: isPose ? 52 : Math.round((512 - bMeta.height) / 2) + 12 };
  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="${spec.height}">` +
    `${buildWalterOverlay(spec.mode, spec.height, pencil)}</svg>`;
  const layers = [bustLayer];
  if (isPose) {
    const lowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="768">` +
      `${buildWalterLowerBody(spec.mode, pencil)}</svg>`;
    layers.push({ input: Buffer.from(lowerSvg), left: 0, top: 0 });
  }
  layers.push({ input: Buffer.from(overlaySvg), left: 0, top: 0 });
  const canvas = sharp({ create: { width: 512, height: spec.height, channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers);
  await quantizeAndWrite(canvas, spec.width, spec.height, `${outDir}/${spec.slug}`);
}

async function verifyGeneratedAsset(relBase, w, h) {
  for (const ext of ['png', 'webp']) {
    const abs = resolve(packageRoot, `${relBase}.${ext}`);
    if (!existsSync(abs)) throw new Error(`Missing output: ${relBase}.${ext}`);
    const fileStat = await stat(abs);
    if (fileStat.size === 0 || fileStat.size > MAX_SPRITE_BYTES) {
      throw new Error(`Budget violation on ${relBase}.${ext}: ${fileStat.size}B`);
    }
    const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== w || info.height !== h) throw new Error(`Size mismatch on ${relBase}.${ext}`);
    const corners = [3, (w - 1) * 4 + 3, ((h - 1) * w) * 4 + 3, ((h - 1) * w + w - 1) * 4 + 3];
    if (corners.some((o) => data[o] !== 0)) throw new Error(`Non-transparent corner on ${relBase}.${ext}`);
    if (data[((h >> 1) * w + (w >> 1)) * 4 + 3] !== 255) {
      throw new Error(`Non-opaque center pixel on ${relBase}.${ext}`);
    }
  }
}

export async function generateIsrockfeelWalter({ checkOnly = false } = {}) {
  const baseDir = 'illustrations/rocksoul-universe';
  if (!checkOnly) {
    await mkdir(resolve(packageRoot, `${baseDir}/isrockfeel`), { recursive: true });
    await mkdir(resolve(packageRoot, `${baseDir}/walterwhite`), { recursive: true });
    for (const spec of ISROCKFEEL_SPECS) {
      await quantizeAndWrite(sharp(Buffer.from(buildIsrockfeelSvg(spec), 'utf8')),
        spec.width, spec.height, `${baseDir}/isrockfeel/${spec.slug}`);
    }
    const cel = await floodFillCutout(resolve(packageRoot,
      'source/artwork/riot-universe/walter-white-portrait-cel-master.png'));
    const celBuf = await sharp(cel.data, { raw: { width: cel.width, height: cel.height, channels: 4 } })
      .png().toBuffer();
    const pencilBuf = await toRoughPencilPixels(cel.data, cel.width, cel.height);
    for (const spec of WALTER_SPECS) {
      await renderWalterSpec(spec, celBuf, pencilBuf, `${baseDir}/walterwhite`);
    }
  }
  for (const s of ISROCKFEEL_SPECS) await verifyGeneratedAsset(`${baseDir}/isrockfeel/${s.slug}`, s.width, s.height);
  for (const s of WALTER_SPECS) await verifyGeneratedAsset(`${baseDir}/walterwhite/${s.slug}`, s.width, s.height);
  return { isrockfeel: ISROCKFEEL_SPECS.length * 2, walterwhite: WALTER_SPECS.length * 2 };
}

const MANIFEST_PATH = resolve(packageRoot, 'manifest.json');
const OWNED_PREFIXES = ['illustrations/rocksoul-universe/isrockfeel/', 'illustrations/rocksoul-universe/walterwhite/'];

function buildManifestEntries() {
  const groups = [
    ['isrockfeel', ISROCKFEEL_SPECS],
    ['walterwhite', WALTER_SPECS],
  ];
  return groups.flatMap(([subject, specs]) =>
    specs.flatMap((spec) =>
      ['png', 'webp'].map((format) => ({
        path: `illustrations/rocksoul-universe/${subject}/${spec.slug}.${format}`,
        kind: 'character-sprite',
        variant: spec.slug,
        subject,
        format,
        width: spec.width,
        height: spec.height,
        pack: 'rocksoul-universe',
        domain: 'visual-universe',
        status: 'review',
        license: 'ISC',
        source: 'packages/assets/scripts/generate-isrockfeel-walter.mjs',
      }))
    )
  );
}

/** Register generated ISROCKFEEL and WALTERWHITE sprites in manifest.json, replacing only owned paths. */
export async function registerIsrockfeelWalter() {
  const entries = buildManifestEntries();
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
  const counts = await generateIsrockfeelWalter({ checkOnly });
  if (!checkOnly) await registerIsrockfeelWalter();
  stdout.write(`${checkOnly ? 'Verified' : 'Generated'} ${counts.isrockfeel} isrockfeel and ` +
    `${counts.walterwhite} walterwhite PNG/WebP assets.\n`);
}
