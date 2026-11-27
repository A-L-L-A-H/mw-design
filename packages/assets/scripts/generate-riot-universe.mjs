import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { argv, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const INK = '#0d0d0d';
const PAPER = '#f3efe4';
const NIGHT = '#0e0e10';
const CHARCOAL = '#17171a';
const SLATE = '#262833';
const YELLOW = '#ffe031';
const YELLOW_SHADE = '#d9b514';
const MAGENTA = '#ff2e88';
const MAGENTA_SHADE = '#b8175d';
const CYAN = '#00b8f0';
const CYAN_SHADE = '#007fa8';
const VIOLET = '#c084fc';
const VIOLET_SHADE = '#7e4cc4';

function assetSlug(filePath) {
  return filePath
    .replace(/\.svg$/u, '')
    .replace(/[^a-zA-Z\d]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

/**
 * Remove exterior near-white backdrop using 4-edge BFS flood-fill with smooth
 * 2px anti-aliased edge feathering & white-fringe decontamination so cutouts sit
 * cleanly on both dark (#09090b) and light (#f3efe4) surfaces while interior
 * whites (eyes, teeth, bandages, Vesper's silver-cream hair) stay strictly opaque.
 */
export async function floodFillCutout(input, extractRect = null) {
  let pipeline = sharp(input).ensureAlpha();
  if (extractRect) pipeline = pipeline.extract(extractRect);
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isNearWhite = (offset) => {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    return r > 234 && g > 234 && b > 234 && maxC - minC < 24;
  };

  const enqueue = (x, y) => {
    const pixel = y * width + x;
    if (visited[pixel]) return;
    if (!isNearWhite(pixel * 4)) return;
    visited[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width;
    const y = (pixel - x) / width;
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  // Pass 1: clear exterior pixels & identify 1px boundary ring
  const edgeRing1 = new Uint8Array(total);
  for (let pixel = 0; pixel < total; pixel += 1) {
    const offset = pixel * 4;
    if (visited[pixel]) {
      data[offset + 3] = 0;
      continue;
    }
    const x = pixel % width;
    const y = (pixel - x) / width;
    const touchesExterior =
      (x > 0 && visited[pixel - 1]) ||
      (x < width - 1 && visited[pixel + 1]) ||
      (y > 0 && visited[pixel - width]) ||
      (y < height - 1 && visited[pixel + width]);
    if (touchesExterior) {
      edgeRing1[pixel] = 1;
    }
  }

  // Pass 2: smooth luminance-weighted feathering + white-fringe decontamination on 1px & 2px rim
  for (let pixel = 0; pixel < total; pixel += 1) {
    if (visited[pixel]) continue;
    const offset = pixel * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const luminance = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

    if (edgeRing1[pixel]) {
      if (luminance > 170 && chroma < 38) {
        const alpha = Math.max(0, Math.min(255, Math.round(255 - (luminance - 170) * 3.8)));
        data[offset + 3] = alpha;
        // Decontaminate white matte halo toward crisp ink
        if (alpha > 0 && alpha < 235) {
          const factor = Math.max(0.2, alpha / 255);
          data[offset] = Math.round(r * factor);
          data[offset + 1] = Math.round(g * factor);
          data[offset + 2] = Math.round(b * factor);
        }
      }
      continue;
    }

    const x = pixel % width;
    const y = (pixel - x) / width;
    const touchesRing1 =
      (x > 0 && edgeRing1[pixel - 1]) ||
      (x < width - 1 && edgeRing1[pixel + 1]) ||
      (y > 0 && edgeRing1[pixel - width]) ||
      (y < height - 1 && edgeRing1[pixel + width]);
    if (touchesRing1 && luminance > 215 && chroma < 28) {
      const alpha = Math.max(0, Math.min(255, Math.round(255 - (luminance - 215) * 4.5)));
      data[offset + 3] = alpha;
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

function wrapSvg(filePath, width, height, title, body) {
  const prefix = `mw-${assetSlug(filePath)}-`;
  const resolvedBody = body.replaceAll('__ID__', prefix);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}" role="img" aria-label="${title}">` +
    `<title>${title}</title>${resolvedBody}</svg>\n`
  );
}

async function svgBuffer(width, height, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`;
  return Buffer.from(svg, 'utf8');
}

function starPath(cx, cy, outerR, innerR, points = 4) {
  const coords = [];
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = (cx + Math.cos(angle) * radius).toFixed(1);
    const y = (cy + Math.sin(angle) * radius).toFixed(1);
    coords.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return `${coords.join(' ')} Z`;
}

function halftoneDots(cols, rows, startX, startY, step, radius, color, opacity = 0.25) {
  const dots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = startX + col * step + (row % 2 === 1 ? step / 2 : 0);
      const cy = startY + row * step;
      dots.push(
        `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}"/>`
      );
    }
  }
  return dots.join('');
}

const EXPRESSION_MASTERS = {
  happy: 'source/artwork/riot-universe/kuro-signal-portrait-happy-master.png',
  excited: 'source/artwork/riot-universe/kuro-signal-portrait-excited-master.png',
  thinking: 'source/artwork/riot-universe/kuro-signal-portrait-thinking-master.png',
  celebrating: 'source/artwork/riot-universe/kuro-signal-portrait-celebrating-master.png',
  angry: 'source/artwork/riot-universe/kuro-signal-portrait-angry-master.png',
  sad: 'source/artwork/riot-universe/kuro-signal-portrait-sad-master.png',
};

const POSE_MASTERS = {
  front: 'source/artwork/riot-universe/kuro-signal-fullbody-standing-master.png',
  side: 'source/artwork/riot-universe/kuro-signal-model-sheet-master.png',
  threeQuarter: 'source/artwork/riot-universe/kuro-signal-model-sheet-master.png',
  running: 'source/artwork/riot-universe/kuro-signal-pose-running-master.png',
  sitting: 'source/artwork/riot-universe/kuro-signal-pose-sitting-master.png',
  waving: 'source/artwork/riot-universe/kuro-signal-pose-waving-master.png',
};

const EXPRESSIONS = [
  {
    slug: 'happy',
    masterKey: 'happy',
    tilt: 0,
    scale: 1.0,
    offsetY: 0,
    overlay: `
      <path d="${starPath(428, 98, 20, 7, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
      <circle cx="92" cy="144" r="9" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'excited',
    masterKey: 'excited',
    tilt: -2,
    scale: 1.03,
    offsetY: -6,
    overlay: `
      <path d="${starPath(94, 108, 26, 9, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
      <path d="${starPath(428, 96, 28, 9, 4)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="4"/>
      <path d="${starPath(442, 224, 16, 5.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 52 204 L 84 214 M 44 252 L 78 248 M 428 178 L 462 168" stroke="${YELLOW}" stroke-width="5.5" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'laughing',
    masterKey: 'excited',
    tilt: 4,
    scale: 1.02,
    offsetY: -4,
    overlay: `
      <path d="M 68 158 Q 90 134 114 154 M 62 186 Q 86 164 110 182" fill="none" stroke="${YELLOW}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="${starPath(420, 114, 22, 8, 5)}" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
      <path d="M 406 188 L 448 168 M 414 214 L 456 206" stroke="${MAGENTA}" stroke-width="5" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'angry',
    masterKey: 'angry',
    tilt: -2,
    scale: 1.04,
    offsetY: 2,
    overlay: `
      <path d="M 386 102 Q 404 122 386 142 M 426 102 Q 408 122 426 142 M 388 100 Q 406 118 424 100 M 388 144 Q 406 126 424 144" fill="none" stroke="${MAGENTA}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 48 118 L 90 142 M 42 166 L 86 172 M 430 176 L 470 154" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="${starPath(84, 96, 18, 6, 4)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'confused',
    masterKey: 'thinking',
    tilt: 5,
    scale: 0.98,
    offsetY: 4,
    overlay: `
      <path d="M 396 126 C 396 92 444 92 444 120 C 444 142 420 148 420 170" fill="none" stroke="${CYAN}" stroke-width="8.5" stroke-linecap="round"/>
      <circle cx="420" cy="192" r="6" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 88 156 C 74 156 74 182 94 182 C 108 182 108 162 98 162" fill="none" stroke="${VIOLET}" stroke-width="4.5" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'thinking',
    masterKey: 'thinking',
    tilt: -2,
    scale: 0.99,
    offsetY: 2,
    overlay: `
      <circle cx="386" cy="180" r="8" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>
      <circle cx="410" cy="152" r="12" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <path d="M 386 106 C 386 82 416 78 428 94 C 446 86 466 104 456 122 C 466 138 446 154 426 146 C 408 154 386 138 394 122 C 382 116 382 110 386 106 Z" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <circle cx="410" cy="118" r="4.5" fill="${CYAN}"/>
      <circle cx="424" cy="118" r="4.5" fill="${MAGENTA}"/>
      <circle cx="438" cy="118" r="4.5" fill="${YELLOW}"/>
    `,
  },
  {
    slug: 'surprised',
    masterKey: 'excited',
    tilt: 0,
    scale: 1.05,
    offsetY: -8,
    overlay: `
      <path d="M 420 76 L 424 142" stroke="${YELLOW}" stroke-width="10" stroke-linecap="round"/>
      <circle cx="424" cy="168" r="6.5" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 58 122 L 94 148 M 46 176 L 84 184 M 428 206 L 468 196" stroke="${CYAN}" stroke-width="5" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'sad',
    masterKey: 'sad',
    tilt: -3,
    scale: 0.98,
    offsetY: 8,
    tint: { saturation: 0.88, brightness: 0.96 },
    overlay: `
      <path d="M 388 94 C 374 94 370 110 378 118 C 372 130 384 142 398 136 C 410 144 430 140 434 128 C 448 128 452 108 438 102 C 434 86 404 82 388 94 Z" fill="#475569" stroke="${INK}" stroke-width="4"/>
      <path d="M 390 150 L 384 170 M 412 154 L 406 176 M 432 150 L 426 170" stroke="${CYAN}" stroke-width="4" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'crying',
    masterKey: 'sad',
    tilt: 3,
    scale: 1.0,
    offsetY: 6,
    tint: { saturation: 0.92, brightness: 0.97 },
    overlay: `
      <path d="M 102 180 C 92 200 92 214 102 218 C 112 214 112 200 102 180 Z" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 416 154 C 406 174 406 188 416 192 C 426 188 426 174 416 154 Z" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'sleepy',
    masterKey: 'sad',
    tilt: 6,
    scale: 0.97,
    offsetY: 10,
    tint: { saturation: 0.84, brightness: 0.94 },
    overlay: `
      <path d="M 412 96 A 24 24 0 1 0 440 130 A 18 18 0 1 1 412 96 Z" fill="${VIOLET}" stroke="${INK}" stroke-width="4"/>
      <circle cx="380" cy="156" r="7.5" fill="${VIOLET}" fill-opacity="0.75" stroke="${INK}" stroke-width="3"/>
      <circle cx="398" cy="134" r="10" fill="${CYAN}" fill-opacity="0.75" stroke="${INK}" stroke-width="3"/>
    `,
  },
  {
    slug: 'curious',
    masterKey: 'thinking',
    tilt: -5,
    scale: 1.0,
    offsetY: 0,
    overlay: `
      <circle cx="128" cy="96" r="16" fill="none" stroke="${CYAN}" stroke-width="4" stroke-dasharray="7 5"/>
      <circle cx="128" cy="96" r="28" fill="none" stroke="${CYAN}" stroke-width="3" stroke-opacity="0.7"/>
      <path d="${starPath(422, 128, 18, 6.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'celebrating',
    masterKey: 'celebrating',
    tilt: 2,
    scale: 1.03,
    offsetY: -6,
    overlay: `
      <path d="${starPath(94, 102, 22, 7.5, 5)}" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
      <path d="${starPath(424, 106, 24, 8, 5)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="4"/>
      <rect x="64" y="182" width="16" height="9" rx="2" fill="${CYAN}" stroke="${INK}" stroke-width="3" transform="rotate(-24 72 186)"/>
      <rect x="426" y="188" width="16" height="9" rx="2" fill="${YELLOW}" stroke="${INK}" stroke-width="3" transform="rotate(28 434 192)"/>
    `,
  },
  {
    slug: 'embarrassed',
    masterKey: 'happy',
    tilt: 4,
    scale: 0.98,
    offsetY: 6,
    overlay: `
      <path d="M 406 126 C 396 148 396 164 406 170 C 416 164 416 148 406 126 Z" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 78 152 L 104 166 M 74 172 L 100 186" stroke="${MAGENTA}" stroke-width="4.5" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'determined',
    masterKey: 'angry',
    tilt: 1,
    scale: 1.03,
    offsetY: -4,
    overlay: `
      <path d="M 44 98 L 108 134 M 40 144 L 100 166 M 466 100 L 402 134" stroke="${YELLOW}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 388 188 L 428 182 L 408 210 L 436 208 L 396 244 L 408 218 L 384 220 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'victory',
    masterKey: 'celebrating',
    tilt: 2,
    scale: 1.04,
    offsetY: -8,
    overlay: `
      <path d="M 380 142 L 392 94 L 414 118 L 436 94 L 448 142 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="${starPath(98, 108, 20, 7, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(436, 196, 16, 5.5, 4)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'disappointed',
    masterKey: 'sad',
    tilt: -4,
    scale: 0.96,
    offsetY: 12,
    tint: { saturation: 0.72, brightness: 0.91 },
    overlay: `
      <path d="M 396 92 L 396 164 M 416 86 L 416 158 M 436 96 L 436 166" stroke="#64748b" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 70 134 Q 88 120 106 134" fill="none" stroke="#64748b" stroke-width="4.5" stroke-linecap="round"/>
    `,
  },
];

const POSES = [
  {
    slug: 'standing',
    view: 'front',
    tilt: 0,
    offsetY: 0,
    backFx: `<ellipse cx="256" cy="722" rx="136" ry="16" fill="${INK}" fill-opacity="0.22"/>`,
    frontFx: `<path d="${starPath(416, 134, 17, 6, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>`,
  },
  {
    slug: 'sitting',
    view: 'sitting',
    tilt: 0,
    offsetY: 8,
    backFx: `<ellipse cx="256" cy="718" rx="164" ry="18" fill="${INK}" fill-opacity="0.24"/>`,
    frontFx: `<circle cx="404" cy="146" r="12" fill="none" stroke="${CYAN}" stroke-width="3.5"/>`,
  },
  {
    slug: 'walking',
    view: 'running',
    tilt: -4,
    offsetY: 6,
    backFx: `
      <ellipse cx="256" cy="720" rx="152" ry="16" fill="${INK}" fill-opacity="0.2"/>
      <path d="M 64 684 Q 88 662 116 676 Q 132 660 156 680" fill="none" stroke="${PAPER}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M 64 684 Q 88 662 116 676 Q 132 660 156 680" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    `,
    frontFx: `<path d="M 52 346 L 106 346 M 44 376 L 96 376" stroke="${CYAN}" stroke-width="4.5" stroke-linecap="round"/>`,
  },
  {
    slug: 'running',
    view: 'running',
    tilt: 2,
    offsetY: -8,
    backFx: `
      <ellipse cx="256" cy="726" rx="140" ry="14" fill="${INK}" fill-opacity="0.18"/>
      <path d="M 24 250 L 122 250 M 18 332 L 108 332 M 36 440 L 130 440" stroke="${MAGENTA}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.9"/>
      <path d="M 38 286 L 116 286 M 28 486 L 112 486" stroke="${CYAN}" stroke-width="4.5" stroke-linecap="round" stroke-opacity="0.85"/>
    `,
    frontFx: `<path d="${starPath(440, 166, 18, 6.5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>`,
  },
  {
    slug: 'jumping',
    view: 'running',
    tilt: -8,
    offsetY: -44,
    backFx: `
      <ellipse cx="256" cy="734" rx="108" ry="12" fill="${INK}" fill-opacity="0.16"/>
      <path d="M 118 688 Q 256 626 394 688" fill="none" stroke="${YELLOW}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 94 550 L 94 636 M 418 550 L 418 636" stroke="${CYAN}" stroke-width="4.5" stroke-linecap="round"/>
    `,
    frontFx: `
      <path d="${starPath(94, 128, 20, 7, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(422, 146, 18, 6.5, 4)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'waving',
    view: 'waving',
    tilt: 0,
    offsetY: 0,
    backFx: `<ellipse cx="256" cy="722" rx="136" ry="16" fill="${INK}" fill-opacity="0.22"/>`,
    frontFx: `
      <path d="M 86 196 Q 66 158 90 128 M 68 206 Q 44 158 72 116" fill="none" stroke="${YELLOW}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="${starPath(418, 128, 18, 6, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'pointing',
    view: 'waving',
    tilt: 3,
    offsetY: -2,
    backFx: `<ellipse cx="256" cy="722" rx="136" ry="16" fill="${INK}" fill-opacity="0.22"/>`,
    frontFx: `
      <path d="M 366 304 L 460 282 L 442 264 M 460 282 L 442 302" fill="none" stroke="${YELLOW}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${starPath(458, 238, 15, 5, 4)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="3"/>
    `,
  },
  {
    slug: 'reading',
    view: 'sitting',
    tilt: -2,
    offsetY: 8,
    backFx: `<ellipse cx="256" cy="718" rx="164" ry="18" fill="${INK}" fill-opacity="0.24"/>`,
    frontFx: `
      <path d="${starPath(412, 166, 18, 6, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 378 242 Q 408 228 434 246 M 384 264 Q 412 252 436 266" fill="none" stroke="${CYAN}" stroke-width="4" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'gaming',
    view: 'sitting',
    tilt: 2,
    offsetY: 6,
    backFx: `
      <ellipse cx="256" cy="718" rx="164" ry="18" fill="${INK}" fill-opacity="0.24"/>
      ${halftoneDots(4, 3, 54, 156, 18, 2.5, MAGENTA, 0.35)}
    `,
    frontFx: `
      <path d="${starPath(424, 248, 18, 6, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(88, 224, 15, 5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>
    `,
  },
  {
    slug: 'working',
    view: 'sitting',
    tilt: 0,
    offsetY: 8,
    backFx: `<ellipse cx="256" cy="718" rx="164" ry="18" fill="${INK}" fill-opacity="0.24"/>`,
    frontFx: `
      <circle cx="412" cy="212" r="16" fill="none" stroke="${CYAN}" stroke-width="4" stroke-dasharray="8 6"/>
      <circle cx="412" cy="212" r="28" fill="none" stroke="${YELLOW}" stroke-width="3" stroke-opacity="0.8"/>
    `,
  },
  {
    slug: 'holding-objects',
    view: 'front',
    tilt: 0,
    offsetY: 0,
    backFx: `<ellipse cx="256" cy="722" rx="140" ry="16" fill="${INK}" fill-opacity="0.22"/>`,
    frontFx: `
      <g transform="translate(334, 286)">
        <rect x="4" y="6" width="112" height="82" rx="10" fill="${INK}" fill-opacity="0.45"/>
        <rect x="0" y="0" width="112" height="82" rx="10" fill="${YELLOW}" stroke="${INK}" stroke-width="5"/>
        <path d="M 0 28 H 112 M 56 0 V 82" stroke="${INK}" stroke-width="4"/>
        <path d="M 38 42 L 46 24 L 56 36 L 66 24 L 74 42 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="3"/>
      </g>
    `,
  },
  {
    slug: 'celebrating',
    view: 'waving',
    tilt: 2,
    offsetY: -22,
    backFx: `
      <ellipse cx="256" cy="726" rx="124" ry="14" fill="${INK}" fill-opacity="0.18"/>
      <path d="M 84 210 L 138 244 M 428 210 L 374 244 M 78 320 L 136 328 M 434 320 L 376 328" stroke="${YELLOW}" stroke-width="5.5" stroke-linecap="round"/>
    `,
    frontFx: `
      <path d="M 222 102 L 234 56 L 256 80 L 278 56 L 290 102 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="${starPath(94, 134, 22, 7.5, 5)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(418, 134, 22, 7.5, 5)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
];

// Scene masters that ALREADY illustrate Kuro / Vesper in-scene (never duplicate characters on top!)
const MASTERS_WITH_CHARACTERS = new Set([
  'scene-empty-signal-static-master.png',
  'scene-onboarding-welcome-master.png',
  'scene-quest-victory-master.png',
]);

// Compact comic medallion icon positioned in an unobstructed sky corner per scene master
function stateBadge(accent, iconBody, master) {
  let bx = 526;
  let by = 26;
  if (master === 'scene-empty-signal-static-master.png') {
    bx = 32;
    by = 28;
  } else if (master === 'scene-onboarding-welcome-master.png') {
    bx = 280;
    by = 22;
  }
  return `
    <g transform="translate(${bx}, ${by})">
      <rect x="6" y="6" width="80" height="80" rx="14" fill="${INK}" fill-opacity="0.88"/>
      <rect x="0" y="0" width="80" height="80" rx="14" fill="${CHARCOAL}" stroke="${INK}" stroke-width="4.5"/>
      <rect x="4" y="4" width="72" height="72" rx="10" fill="none" stroke="${accent}" stroke-width="3"/>
      <g transform="translate(40, 40) scale(0.92)">${iconBody}</g>
    </g>
  `;
}

const UI_STATES = [
  {
    slug: 'empty-dashboard',
    master: 'scene-empty-signal-static-master.png',
    expr: 'thinking',
    accent: CYAN,
    actor: 'none',
    badgeIcon: `<rect x="-20" y="-16" width="40" height="32" rx="4" fill="${NIGHT}" stroke="${CYAN}" stroke-width="3.5"/><path d="M-12 -4h24M-12 6h15" stroke="${CYAN}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  {
    slug: 'no-search-results',
    master: 'bg-riot-street-alley-master.png',
    expr: 'confused',
    accent: YELLOW,
    actor: 'vesper',
    badgeIcon: `<circle cx="-3" cy="-3" r="15" fill="none" stroke="${YELLOW}" stroke-width="4"/><path d="M8 8l12 12M-9 -9l12 12M3 -9l-12 12" stroke="${YELLOW}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
  {
    slug: 'no-notifications',
    master: 'scene-empty-signal-static-master.png',
    expr: 'thinking',
    accent: VIOLET,
    actor: 'none',
    badgeIcon: `<path d="M0 -18c-9 0-15 7-15 16v9l-5 7h40l-5-7v-9c0-9-6-16-15-16Z" fill="none" stroke="${VIOLET}" stroke-width="3.5"/><path d="M-18 -18l36 34" stroke="${MAGENTA}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    slug: 'empty-collection',
    master: 'bg-riot-arcade-workbench-master.png',
    expr: 'thinking',
    accent: MAGENTA,
    actor: 'vesper',
    badgeIcon: `<path d="M-22 -12h16l6 6h22v22h-44Z" fill="none" stroke="${MAGENTA}" stroke-width="3.5" stroke-linejoin="round"/><path d="M-14 4h28" stroke="${PAPER}" stroke-width="3" stroke-dasharray="4 5"/>`,
  },
  {
    slug: 'no-favorites',
    master: 'scene-empty-signal-static-master.png',
    expr: 'sad',
    accent: MAGENTA,
    actor: 'none',
    badgeIcon: `<path d="${starPath(0, 0, 21, 9, 5)}" fill="none" stroke="${MAGENTA}" stroke-width="3.5"/>`,
  },
  {
    slug: 'no-messages',
    master: 'bg-riot-arcade-workbench-master.png',
    expr: 'thinking',
    accent: CYAN,
    actor: 'kuro',
    badgeIcon: `<rect x="-22" y="-15" width="44" height="30" rx="4" fill="none" stroke="${CYAN}" stroke-width="3.5"/><path d="M-20 -13l20 15 20-15" fill="none" stroke="${CYAN}" stroke-width="3.5"/>`,
  },
  {
    slug: 'no-activity',
    master: 'bg-riot-arcade-workbench-master.png',
    expr: 'sleepy',
    accent: YELLOW,
    actor: 'vesper',
    badgeIcon: `<path d="M-24 2h12l6-14 8 26 7-12h15" fill="none" stroke="${YELLOW}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    slug: 'first-time',
    master: 'scene-onboarding-welcome-master.png',
    expr: 'excited',
    accent: YELLOW,
    actor: 'none',
    badgeIcon: `<path d="${starPath(0, 0, 20, 7, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5"/>`,
  },
  {
    slug: 'loading',
    master: 'bg-riot-arcade-workbench-master.png',
    expr: 'curious',
    accent: CYAN,
    actor: 'kuro',
    badgeIcon: `<circle cx="0" cy="0" r="18" fill="none" stroke="${SLATE}" stroke-width="5"/><path d="M0 -18a18 18 0 0 1 18 18" fill="none" stroke="${CYAN}" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="0" r="6" fill="${YELLOW}"/>`,
  },
  {
    slug: 'success',
    master: 'scene-quest-victory-master.png',
    expr: 'celebrating',
    accent: YELLOW,
    actor: 'none',
    badgeIcon: `<circle cx="0" cy="0" r="20" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/><path d="M-9 0l6 7 13-14" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    slug: 'error',
    master: 'scene-error-static-master.png',
    expr: 'angry',
    accent: MAGENTA,
    actor: 'kuro',
    badgeIcon: `<polygon points="0,-20 22,18 -22,18" fill="${MAGENTA}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0 -7v12" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="11" r="2.5" fill="${INK}"/>`,
  },
  {
    slug: 'offline',
    master: 'scene-error-static-master.png',
    expr: 'sad',
    accent: CYAN,
    actor: 'kuro',
    badgeIcon: `<path d="M-20 -4a28 28 0 0 1 40 0M-12 6a18 18 0 0 1 24 0" fill="none" stroke="${CYAN}" stroke-width="3.5" stroke-linecap="round"/><path d="M-16 -16l32 32" stroke="${MAGENTA}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    slug: 'network-disconnected',
    master: 'scene-error-static-master.png',
    expr: 'confused',
    accent: MAGENTA,
    actor: 'vesper',
    badgeIcon: `<path d="M-22 0h12m20 0h12" stroke="${CYAN}" stroke-width="4" stroke-linecap="round"/><rect x="-10" y="-10" width="8" height="20" rx="2" fill="${MAGENTA}"/><rect x="2" y="-10" width="8" height="20" rx="2" fill="${YELLOW}"/>`,
  },
  {
    slug: 'maintenance',
    master: 'bg-riot-arcade-workbench-master.png',
    expr: 'thinking',
    accent: YELLOW,
    actor: 'vesper',
    badgeIcon: `<circle cx="0" cy="0" r="16" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-dasharray="8 5"/><circle cx="0" cy="0" r="6" fill="${YELLOW}"/>`,
  },
  {
    slug: 'access-denied',
    master: 'scene-error-static-master.png',
    expr: 'angry',
    accent: MAGENTA,
    actor: 'vesper',
    badgeIcon: `<rect x="-16" y="-4" width="32" height="24" rx="4" fill="none" stroke="${MAGENTA}" stroke-width="3.5"/><path d="M-10 -4v-8a10 10 0 0 1 20 0v8" fill="none" stroke="${MAGENTA}" stroke-width="3.5"/>`,
  },
  {
    slug: 'not-found',
    master: 'bg-riot-street-alley-master.png',
    expr: 'confused',
    accent: VIOLET,
    actor: 'kuro',
    badgeIcon: `<circle cx="0" cy="0" r="19" fill="none" stroke="${VIOLET}" stroke-width="3.5" stroke-dasharray="8 5"/><path d="M-9 -9l18 18M9 -9l-18 18" stroke="${YELLOW}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    slug: 'unexpected-failure',
    master: 'scene-error-static-master.png',
    expr: 'angry',
    accent: MAGENTA,
    actor: 'kuro',
    badgeIcon: `<path d="M4 -22l-16 24h14l-6 20 18-26h-14Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  {
    slug: 'welcome',
    master: 'scene-onboarding-welcome-master.png',
    expr: 'excited',
    accent: YELLOW,
    actor: 'none',
    badgeIcon: `<path d="M-18 16v-26l18-10 18 10v26Z" fill="none" stroke="${YELLOW}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="8" cy="4" r="3" fill="${YELLOW}"/>`,
  },
  {
    slug: 'onboarding',
    master: 'scene-onboarding-welcome-master.png',
    expr: 'excited',
    accent: CYAN,
    actor: 'none',
    badgeIcon: `<circle cx="0" cy="0" r="18" fill="none" stroke="${CYAN}" stroke-width="3.5"/><polygon points="0,-13 7,0 0,13 -7,0" fill="${YELLOW}" stroke="${INK}" stroke-width="2"/>`,
  },
  {
    slug: 'discover',
    master: 'bg-riot-street-alley-master.png',
    expr: 'curious',
    accent: CYAN,
    actor: 'kuro',
    badgeIcon: `<circle cx="0" cy="0" r="18" fill="none" stroke="${CYAN}" stroke-width="3"/><circle cx="0" cy="0" r="10" fill="none" stroke="${MAGENTA}" stroke-width="2.5"/><circle cx="0" cy="0" r="4" fill="${YELLOW}"/>`,
  },
  {
    slug: 'explore',
    master: 'bg-riot-street-alley-master.png',
    expr: 'happy',
    accent: VIOLET,
    actor: 'vesper',
    badgeIcon: `<polygon points="-18,16 -8,-14 18,-16 8,14" fill="none" stroke="${VIOLET}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="0" cy="0" r="5" fill="${CYAN}"/>`,
  },
  {
    slug: 'profile',
    master: 'bg-riot-arcade-workbench-master.png',
    expr: 'happy',
    accent: YELLOW,
    actor: 'kuro',
    badgeIcon: `<circle cx="0" cy="-6" r="8" fill="${MAGENTA}"/><path d="M-14 16c3-10 25-10 28 0" fill="${CYAN}"/>`,
  },
  {
    slug: 'achievement',
    master: 'scene-quest-victory-master.png',
    expr: 'celebrating',
    accent: YELLOW,
    actor: 'none',
    badgeIcon: `<path d="M-16 -16h32v16c0 10-7 16-16 18-9-2-16-8-16-18Z" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5"/><path d="M-8 22h16" stroke="${YELLOW}" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    slug: 'completion',
    master: 'scene-quest-victory-master.png',
    expr: 'celebrating',
    accent: CYAN,
    actor: 'none',
    badgeIcon: `<path d="M-12 -18v38M-12 -16l28 8-28 10Z" fill="${CYAN}" stroke="${CYAN}" stroke-width="3" stroke-linejoin="round"/>`,
  },
  {
    slug: 'celebration',
    master: 'scene-quest-victory-master.png',
    expr: 'celebrating',
    accent: MAGENTA,
    actor: 'none',
    badgeIcon: `<path d="${starPath(0, 0, 19, 7.5, 5)}" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5"/><circle cx="-16" cy="-14" r="3.5" fill="${MAGENTA}"/><circle cx="16" cy="-12" r="3.5" fill="${CYAN}"/>`,
  },
];

const STICKERS = [
  {
    slug: 'speech-bubble-shout',
    title: 'Riot shout speech bubble sticker',
    body: `
      <polygon points="134,24 164,64 216,38 204,90 246,114 206,142 232,190 178,180 172,234 130,194 84,242 92,184 30,192 64,142 24,110 74,90 58,38 110,64" fill="${INK}" fill-opacity="0.9"/>
      <polygon points="128,18 158,58 210,32 198,84 242,108 200,136 226,184 172,174 166,228 124,188 78,236 86,178 24,186 58,136 18,104 68,84 52,32 104,58" fill="${YELLOW}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <polygon points="128,38 152,70 194,50 184,92 218,110 186,132 204,168 164,160 158,200 124,170 90,206 96,164 50,168 76,132 44,106 84,92 70,50 112,70" fill="${MAGENTA}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="128,54 146,80 178,64 172,98 198,112 174,128 186,154 156,148 150,180 124,158 98,184 102,152 68,154 88,128 62,108 94,98 84,64 114,80" fill="${PAPER}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      ${halftoneDots(4, 3, 102, 106, 16, 2, INK, 0.14)}
    `,
  },
  {
    slug: 'speech-bubble-thought',
    title: 'Thought cloud sticker',
    body: `
      <path d="M 80 158 C 48 158 34 124 58 100 C 50 68 84 44 118 58 C 140 32 188 38 200 70 C 234 72 244 114 220 138 C 234 164 206 190 178 178 C 156 192 118 186 106 168 C 96 168 88 164 80 158 Z" fill="${INK}"/>
      <path d="M 74 152 C 42 152 28 118 52 94 C 44 62 78 38 112 52 C 134 26 182 32 194 64 C 228 66 238 108 214 132 C 228 158 200 184 172 172 C 150 186 112 180 100 162 C 90 162 82 158 74 152 Z" fill="${PAPER}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 68 142 C 96 162 158 172 198 148 C 216 138 220 112 208 94 C 212 126 178 152 130 150 C 102 148 82 144 68 142 Z" fill="${CYAN}" fill-opacity="0.22"/>
      ${halftoneDots(5, 2, 92, 96, 18, 2.2, CYAN, 0.25)}
      <path d="M 74 82 C 88 64 118 60 134 72" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
      <circle cx="72" cy="196" r="14" fill="${CYAN}" stroke="${INK}" stroke-width="6"/>
      <circle cx="46" cy="224" r="9" fill="${YELLOW}" stroke="${INK}" stroke-width="5"/>
    `,
  },
  {
    slug: 'comic-boom',
    title: 'Comic impact burst sticker',
    body: `
      <path d="${starPath(134, 134, 112, 56, 10)}" fill="${INK}"/>
      <path d="${starPath(128, 128, 112, 56, 10)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="${starPath(128, 128, 96, 48, 10)}" fill="none" stroke="${MAGENTA_SHADE}" stroke-width="5" stroke-dasharray="10 8"/>
      <path d="${starPath(128, 128, 76, 36, 10)}" fill="${YELLOW}" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>
      <path d="${starPath(128, 128, 46, 22, 8)}" fill="${CYAN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="128" cy="128" r="22" fill="${PAPER}" stroke="${INK}" stroke-width="5"/>
      <circle cx="122" cy="122" r="6" fill="#ffffff"/>
    `,
  },
  {
    slug: 'lightning-bolt',
    title: 'Signal lightning bolt sticker',
    body: `
      <polygon points="160,22 64,144 124,144 104,244 204,118 144,118" fill="${INK}"/>
      <polygon points="154,16 58,138 118,138 98,240 198,112 138,112" fill="${YELLOW}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
      <polygon points="154,16 138,112 198,112 98,240 128,138 134,94" fill="${YELLOW_SHADE}" fill-opacity="0.7"/>
      <polygon points="142,46 84,126 116,126 108,166" fill="#ffffff" fill-opacity="0.65"/>
      <path d="M 154 16 L 58 138 L 118 138 L 98 240 L 198 112 L 138 112 Z" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
      <path d="${starPath(194, 52, 16, 5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'riot-star',
    title: 'Riot star sticker',
    body: `
      <path d="${starPath(134, 134, 106, 44, 5)}" fill="${INK}"/>
      <path d="${starPath(128, 128, 106, 44, 5)}" fill="${YELLOW}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
      <polygon points="128,22 154,92 128,128" fill="#ffffff" fill-opacity="0.45"/>
      <polygon points="128,128 228,96 170,142 190,214 128,172" fill="${YELLOW_SHADE}" fill-opacity="0.65"/>
      <path d="${starPath(128, 128, 106, 44, 5)}" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
      <path d="${starPath(128, 128, 56, 24, 5)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>
      <circle cx="128" cy="128" r="13" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
    `,
  },
  {
    slug: 'street-flame',
    title: 'Street flame sticker',
    body: `
      <path d="M 140 24 C 174 68 212 100 206 158 C 202 208 172 244 134 244 C 90 244 62 208 64 160 C 66 118 96 98 98 70 C 114 84 124 92 126 112 C 142 88 132 54 140 24 Z" fill="${INK}"/>
      <path d="M 134 18 C 168 62 206 94 200 152 C 196 202 166 238 128 238 C 84 238 56 202 58 154 C 60 112 90 92 92 64 C 108 78 118 86 120 106 C 136 82 126 48 134 18 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 130 88 C 158 122 174 150 166 186 C 162 212 146 226 128 226 C 104 226 90 204 92 178 C 94 150 116 132 130 88 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="5.5"/>
      <path d="M 128 144 C 142 164 148 180 144 198 C 140 212 134 218 126 218 C 116 218 110 206 112 192 C 114 176 122 166 128 144 Z" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
    `,
  },
  {
    slug: 'pixel-heart',
    title: 'Pixel heart sticker',
    body: `
      <path d="M 54 62 H 110 V 86 H 158 V 62 H 214 V 118 H 190 V 150 H 166 V 182 H 142 V 214 H 126 V 182 H 102 V 150 H 78 V 118 H 54 Z" fill="${INK}"/>
      <path d="M 48 56 H 104 V 80 H 152 V 56 H 208 V 112 H 184 V 144 H 160 V 176 H 136 V 208 H 120 V 176 H 96 V 144 H 72 V 112 H 48 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="8" stroke-linejoin="miter"/>
      <path d="M 152 80 H 208 V 112 H 184 V 144 H 160 V 176 H 136 V 208 H 128 V 152 H 152 V 120 H 176 V 80 Z" fill="${MAGENTA_SHADE}" fill-opacity="0.72"/>
      <rect x="68" y="76" width="24" height="24" fill="${PAPER}"/>
      <rect x="92" y="100" width="14" height="14" fill="${YELLOW}"/>
      <path d="M 48 56 H 104 V 80 H 152 V 56 H 208 V 112 H 184 V 144 H 160 V 176 H 136 V 208 H 120 V 176 H 96 V 144 H 72 V 112 H 48 Z" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="miter"/>
    `,
  },
  {
    slug: 'hand-arrow',
    title: 'Hand-inked arrow sticker',
    body: `
      <path d="M 30 154 L 154 118 L 140 76 L 240 112 L 172 198 L 160 156 L 40 190 Z" fill="${INK}"/>
      <path d="M 24 148 L 148 112 L 134 70 L 234 106 L 166 192 L 154 150 L 34 184 Z" fill="${CYAN}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 32 164 L 156 128 L 164 176 L 226 108 L 152 138 L 36 174 Z" fill="${CYAN_SHADE}" fill-opacity="0.7"/>
      <path d="M 42 150 L 146 120" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-opacity="0.7"/>
      <path d="M 24 148 L 148 112 L 134 70 L 234 106 L 166 192 L 154 150 L 34 184 Z" fill="none" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    `,
  },
  {
    slug: 'paint-splash',
    title: 'Paint splash sticker',
    body: `
      <path d="M 128 58 C 158 50 182 72 202 64 C 218 58 226 80 208 100 C 230 120 224 154 198 160 C 204 190 180 214 154 200 C 136 226 100 218 94 188 C 64 194 46 164 68 140 C 44 120 58 86 88 90 C 92 64 110 62 128 58 Z" fill="${INK}"/>
      <path d="M 122 52 C 152 44 176 66 196 58 C 212 52 220 74 202 94 C 224 114 218 148 192 154 C 198 184 174 208 148 194 C 130 220 94 212 88 182 C 58 188 40 158 62 134 C 38 114 52 80 82 84 C 86 58 104 56 122 52 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="7.5"/>
      <path d="M 96 92 C 114 78 146 80 162 94" fill="none" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" stroke-opacity="0.65"/>
      ${halftoneDots(4, 3, 98, 122, 16, 2.2, INK, 0.22)}
      <circle cx="44" cy="54" r="15" fill="${YELLOW}" stroke="${INK}" stroke-width="5"/>
      <circle cx="216" cy="196" r="13" fill="${CYAN}" stroke="${INK}" stroke-width="5"/>
      <circle cx="206" cy="40" r="10" fill="${MAGENTA}" stroke="${INK}" stroke-width="4.5"/>
    `,
  },
  {
    slug: 'motion-burst',
    title: 'Comic motion burst sticker',
    body: `
      <path d="M 128 18 L 128 66 M 128 190 L 128 238 M 18 128 L 66 128 M 190 128 L 238 128 M 48 48 L 84 84 M 172 172 L 208 208 M 208 48 L 172 84 M 84 172 L 48 208" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
      <path d="M 128 18 L 128 66 M 128 190 L 128 238 M 18 128 L 66 128 M 190 128 L 238 128 M 48 48 L 84 84 M 172 172 L 208 208 M 208 48 L 172 84 M 84 172 L 48 208" stroke="${YELLOW}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="132" cy="132" r="36" fill="${INK}"/>
      <circle cx="128" cy="128" r="36" fill="${CYAN}" stroke="${INK}" stroke-width="7"/>
      <circle cx="128" cy="128" r="18" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>
      <circle cx="122" cy="122" r="5" fill="${MAGENTA}"/>
    `,
  },
  {
    slug: 'torn-tape-x',
    title: 'Torn masking tape cross sticker',
    body: `
      <path d="M 42 70 L 74 38 L 224 188 L 192 220 Z" fill="${INK}"/>
      <path d="M 192 38 L 224 70 L 74 220 L 42 188 Z" fill="${INK}"/>
      <path d="M 38 64 L 54 54 L 68 34 L 218 184 L 204 196 L 188 214 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M 188 34 L 204 52 L 218 64 L 68 214 L 54 198 L 38 184 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M 64 56 L 192 184" stroke="${YELLOW_SHADE}" stroke-width="4" stroke-dasharray="10 8"/>
      <path d="M 192 56 L 64 184" stroke="#ffffff" stroke-opacity="0.45" stroke-width="4" stroke-dasharray="10 8"/>
      <circle cx="128" cy="124" r="14" fill="${PAPER}" stroke="${INK}" stroke-width="5"/>
    `,
  },
  {
    slug: 'graffiti-crown',
    title: 'MoonWitness crown sticker',
    body: `
      <path d="M 36 200 L 50 70 L 102 128 L 134 52 L 166 128 L 218 70 L 232 200 Z" fill="${INK}"/>
      <rect x="42" y="204" width="184" height="24" rx="6" fill="${INK}"/>
      <path d="M 30 194 L 44 64 L 96 122 L 128 46 L 160 122 L 212 64 L 226 194 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
      <path d="M 128 46 L 160 122 L 212 64 L 226 194 H 128 Z" fill="${YELLOW_SHADE}" fill-opacity="0.55"/>
      <path d="M 30 194 L 44 64 L 96 122 L 128 46 L 160 122 L 212 64 L 226 194 Z" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
      <circle cx="128" cy="144" r="12" fill="${CYAN}" stroke="${INK}" stroke-width="4"/>
      <circle cx="78" cy="156" r="8" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
      <circle cx="178" cy="156" r="8" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
      <rect x="36" y="198" width="184" height="24" rx="6" fill="${MAGENTA}" stroke="${INK}" stroke-width="7"/>
    `,
  },
];

function comicShieldBase(accent, accentShade, innerBody) {
  return `
    <polygon points="134,24 230,74 212,198 134,244 56,198 38,74" fill="${INK}"/>
    <polygon points="128,18 224,68 206,192 128,238 50,192 32,68" fill="${CHARCOAL}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
    <polygon points="128,18 224,68 206,192 128,238" fill="${SLATE}" fill-opacity="0.55"/>
    <polygon points="128,34 208,76 192,182 128,220 64,182 48,76" fill="none" stroke="${accent}" stroke-width="5.5" stroke-linejoin="round"/>
    <polygon points="128,34 208,76 192,182 128,220" fill="none" stroke="${accentShade}" stroke-width="2.5" stroke-dasharray="8 6"/>
    ${halftoneDots(5, 3, 86, 150, 18, 2, accent, 0.2)}
    ${innerBody}
    <polygon points="128,18 224,68 206,192 128,238 50,192 32,68" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
  `;
}

const GAME_ASSETS = [
  {
    slug: 'avatar-kuro',
    w: 256,
    h: 256,
    title: 'Kuro avatar medallion',
    avatarKey: 'kuro',
    body: `<circle cx="132" cy="132" r="112" fill="${INK}"/><circle cx="128" cy="128" r="112" fill="${CHARCOAL}" stroke="${INK}" stroke-width="10"/><circle cx="128" cy="128" r="96" fill="${CYAN}" fill-opacity="0.22" stroke="${YELLOW}" stroke-width="6"/><path d="M 80 186 C 84 146 172 146 176 186 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="6"/><circle cx="128" cy="110" r="40" fill="${PAPER}" stroke="${INK}" stroke-width="6"/><path d="M 88 106 C 92 64 164 64 168 106 L 154 96 L 138 108 L 122 94 L 104 108 Z" fill="${INK}"/>`,
  },
  {
    slug: 'avatar-vesper',
    w: 256,
    h: 256,
    title: 'Vesper avatar medallion',
    avatarKey: 'vesper',
    body: `<circle cx="132" cy="132" r="112" fill="${INK}"/><circle cx="128" cy="128" r="112" fill="${CHARCOAL}" stroke="${INK}" stroke-width="10"/><circle cx="128" cy="128" r="96" fill="${VIOLET}" fill-opacity="0.22" stroke="${VIOLET}" stroke-width="6"/><path d="M 84 186 C 90 148 166 148 172 186 Z" fill="${CHARCOAL}" stroke="${INK}" stroke-width="6"/><circle cx="128" cy="112" r="38" fill="${PAPER}" stroke="${INK}" stroke-width="6"/><circle cx="110" cy="84" r="14" fill="${VIOLET}" stroke="${INK}" stroke-width="4"/><circle cx="146" cy="84" r="14" fill="${CYAN}" stroke="${INK}" stroke-width="4"/>`,
  },
  {
    slug: 'avatar-frame-riot',
    w: 256,
    h: 256,
    title: 'Signal Riot avatar frame',
    body: `
      <circle cx="128" cy="128" r="112" fill="none" stroke="${INK}" stroke-width="18"/>
      <circle cx="128" cy="128" r="112" fill="none" stroke="${YELLOW}" stroke-width="9" stroke-dasharray="52 14"/>
      <circle cx="128" cy="128" r="96" fill="none" stroke="${MAGENTA}" stroke-width="5"/>
      <path d="${starPath(206, 48, 24, 8.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="4.5"/>
      <path d="${starPath(48, 206, 18, 6, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="4"/>
    `,
  },
  {
    slug: 'badge-signal-scout',
    w: 256,
    h: 256,
    title: 'Signal Scout badge',
    body: comicShieldBase(
      CYAN,
      CYAN_SHADE,
      `
        <circle cx="128" cy="128" r="52" fill="${NIGHT}" stroke="${CYAN}" stroke-width="6"/>
        <path d="M 128 76 V 180 M 76 128 H 180" stroke="${CYAN}" stroke-width="3" stroke-opacity="0.45"/>
        <path d="M 128 128 L 166 94 A 52 52 0 0 1 180 128 Z" fill="${CYAN}" fill-opacity="0.35"/>
        <circle cx="128" cy="128" r="28" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-dasharray="12 6"/>
        <circle cx="128" cy="128" r="10" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
        <path d="${starPath(162, 96, 14, 4.5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>
      `
    ),
  },
  {
    slug: 'badge-archive-keeper',
    w: 256,
    h: 256,
    title: 'Archive Keeper badge',
    body: comicShieldBase(
      VIOLET,
      VIOLET_SHADE,
      `
        <rect x="84" y="76" width="94" height="108" rx="8" fill="${INK}"/>
        <rect x="78" y="70" width="94" height="108" rx="8" fill="${PAPER}" stroke="${INK}" stroke-width="6"/>
        <path d="M 78 70 H 98 V 178 H 78 Z" fill="${VIOLET}" stroke="${INK}" stroke-width="5"/>
        <path d="M 110 100 H 158 M 110 122 H 158 M 110 144 H 142" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
        <path d="M 142 58 H 168 V 104 L 155 92 L 142 104 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      `
    ),
  },
  {
    slug: 'badge-story-architect',
    w: 256,
    h: 256,
    title: 'Story Architect badge',
    body: comicShieldBase(
      YELLOW,
      YELLOW_SHADE,
      `
        <path d="M 78 184 L 156 82 L 190 116 L 106 196 L 68 206 Z" fill="${INK}"/>
        <path d="M 74 176 L 154 78 L 188 112 L 102 192 L 66 200 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M 140 94 L 172 126" stroke="${INK}" stroke-width="6"/>
        <path d="M 154 78 L 188 112 L 172 126 L 140 94 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M 74 176 L 102 192 L 66 200 Z" fill="${PAPER}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="72" cy="196" r="5" fill="${INK}"/>
        <path d="${starPath(94, 88, 22, 7.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="4"/>
      `
    ),
  },
  {
    slug: 'badge-zero-drift',
    w: 256,
    h: 256,
    title: 'Zero Drift badge',
    body: comicShieldBase(
      MAGENTA,
      MAGENTA_SHADE,
      `
        <circle cx="132" cy="132" r="54" fill="${INK}"/>
        <circle cx="128" cy="128" r="54" fill="${YELLOW}" stroke="${INK}" stroke-width="6.5"/>
        <path d="M 128 74 A 54 54 0 0 1 182 128 H 128 Z" fill="#ffffff" fill-opacity="0.35"/>
        <circle cx="128" cy="128" r="42" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="8 6"/>
        <path d="M 98 128 L 120 150 L 162 104" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 98 128 L 120 150 L 162 104" fill="none" stroke="${PAPER}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      `
    ),
  },
  {
    slug: 'rank-rookie',
    w: 256,
    h: 256,
    title: 'Rookie rank chevron',
    body: comicShieldBase(
      CYAN,
      CYAN_SHADE,
      `
        <path d="M 74 156 L 128 102 L 182 156 L 166 172 L 128 134 L 90 172 Z" fill="${INK}"/>
        <path d="M 70 150 L 128 92 L 186 150 L 168 168 L 128 128 L 88 168 Z" fill="${CYAN}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="${starPath(128, 70, 14, 5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      `
    ),
  },
  {
    slug: 'rank-vanguard',
    w: 256,
    h: 256,
    title: 'Vanguard rank dual chevron',
    body: comicShieldBase(
      MAGENTA,
      MAGENTA_SHADE,
      `
        <path d="M 72 130 L 128 76 L 184 130 L 168 146 L 128 108 L 88 146 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M 72 174 L 128 120 L 184 174 L 168 190 L 128 152 L 88 190 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      `
    ),
  },
  {
    slug: 'rank-legend',
    w: 256,
    h: 256,
    title: 'Legend rank crown emblem',
    body: comicShieldBase(
      YELLOW,
      YELLOW_SHADE,
      `
        <path d="M 70 178 L 82 100 L 110 134 L 130 86 L 150 134 L 178 100 L 190 178 Z" fill="${INK}"/>
        <path d="M 66 172 L 78 94 L 106 128 L 128 78 L 150 128 L 178 94 L 190 172 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <rect x="66" y="172" width="124" height="18" rx="4" fill="${MAGENTA}" stroke="${INK}" stroke-width="5"/>
        <path d="${starPath(128, 52, 18, 6.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      `
    ),
  },
  {
    slug: 'quest-banner',
    w: 512,
    h: 192,
    title: 'Riot quest banner ribbon',
    body: `
      <path d="M 28 50 L 74 50 L 60 154 L 28 154 L 46 102 Z" fill="${INK}"/>
      <path d="M 496 50 L 450 50 L 464 154 L 496 154 L 478 102 Z" fill="${INK}"/>
      <rect x="58" y="34" width="408" height="120" rx="12" fill="${INK}"/>
      <path d="M 22 44 L 68 44 L 54 148 L 22 148 L 40 96 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M 490 44 L 444 44 L 458 148 L 490 148 L 472 96 Z" fill="${MAGENTA}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <rect x="52" y="28" width="408" height="120" rx="12" fill="${YELLOW}" stroke="${INK}" stroke-width="8"/>
      <rect x="56" y="114" width="400" height="30" rx="6" fill="${YELLOW_SHADE}" fill-opacity="0.5"/>
      <path d="M 74 50 H 438 M 74 126 H 438" stroke="${INK}" stroke-width="3.5" stroke-dasharray="10 8"/>
      <path d="${starPath(106, 88, 24, 9, 5)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="4.5"/>
      <path d="${starPath(406, 88, 24, 9, 5)}" fill="${CYAN}" stroke="${INK}" stroke-width="4.5"/>
    `,
  },
  {
    slug: 'reward-crate',
    w: 256,
    h: 256,
    title: 'Signal reward crate',
    body: `
      <rect x="50" y="94" width="168" height="130" rx="12" fill="${INK}"/>
      <rect x="44" y="88" width="168" height="130" rx="12" fill="${CHARCOAL}" stroke="${INK}" stroke-width="8"/>
      <path d="M 44 134 H 212 M 44 178 H 212" stroke="${SLATE}" stroke-width="5"/>
      <rect x="34" y="62" width="188" height="38" rx="8" fill="${YELLOW}" stroke="${INK}" stroke-width="8"/>
      <rect x="114" y="62" width="28" height="156" fill="${MAGENTA}" stroke="${INK}" stroke-width="6"/>
      <path d="M 102 62 C 80 30 118 20 128 56 C 138 20 176 30 154 62 Z" fill="${CYAN}" stroke="${INK}" stroke-width="5.5"/>
      <path d="${starPath(192, 42, 16, 5.5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'level-up-burst',
    w: 256,
    h: 256,
    title: 'Level up burst badge',
    body: `
      <path d="${starPath(134, 134, 110, 66, 8)}" fill="${INK}"/>
      <path d="${starPath(128, 128, 110, 66, 8)}" fill="${YELLOW}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <circle cx="128" cy="128" r="58" fill="${MAGENTA}" stroke="${INK}" stroke-width="6.5"/>
      <circle cx="128" cy="128" r="46" fill="none" stroke="${CYAN}" stroke-width="3.5" stroke-dasharray="10 6"/>
      <path d="M 128 82 L 162 124 H 142 V 170 H 114 V 124 H 94 Z" fill="${PAPER}" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>
    `,
  },
];

const ANIMATION_CLIPS = [
  {
    id: 'idle',
    masterKey: 'happy',
    durationMs: 240,
    direction: 'ping-pong',
    bob: [0, -5, -8, -3],
    tilt: [0, -1.2, 0.8, 0.4],
    scale: [1.0, 1.015, 1.022, 1.008],
    fx: (i) => `
      <circle cx="392" cy="96" r="${9 + i * 2.5}" fill="none" stroke="${CYAN}" stroke-width="3.5" stroke-opacity="${0.9 - i * 0.16}"/>
      <circle cx="392" cy="96" r="${4 + i}" fill="${CYAN}" stroke="${INK}" stroke-width="2.5"/>
    `,
  },
  {
    id: 'blink',
    masterKey: 'happy',
    durationMs: 170,
    direction: 'forward',
    bob: [0, 2, 3, 0],
    tilt: [0, 0.6, 0.3, 0],
    scale: [1.0, 0.995, 0.992, 1.0],
    fx: (i) =>
      i === 1 || i === 2
        ? `<path d="${starPath(406, 108, 16 + i * 2, 5.5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/><circle cx="96" cy="138" r="${5 + i}" fill="${CYAN}" stroke="${INK}" stroke-width="2.5"/>`
        : `<path d="${starPath(406, 108, 12 + i * 2, 4, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3"/>`,
  },
  {
    id: 'wave',
    masterKey: 'excited',
    durationMs: 190,
    direction: 'ping-pong',
    bob: [0, -8, -12, -4],
    tilt: [-3, 3, -2, 1],
    scale: [1.0, 1.02, 1.03, 1.01],
    fx: (i) => `
      <path d="M ${82 - i * 4} 174 Q 62 136 ${88 + i * 4} 108" fill="none" stroke="${YELLOW}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M ${64 - i * 4} 188 Q 42 138 ${70 + i * 4} 96" fill="none" stroke="${MAGENTA}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="${starPath(424, 108 - i * 4, 18 + i * 2, 6, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    id: 'celebrate',
    masterKey: 'celebrating',
    durationMs: 175,
    direction: 'forward',
    bob: [0, -14, -22, -8],
    tilt: [-3, 2, 4, -1],
    scale: [1.0, 1.025, 1.04, 1.01],
    fx: (i) => `
      <path d="${starPath(94 + i * 5, 108 - i * 4, 20 + i * 1.5, 7, 5)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(422 - i * 5, 114 - i * 4, 20 + i * 1.5, 7, 5)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="3.5"/>
      <rect x="${74 + i * 8}" y="${182 - i * 6}" width="14" height="8" rx="2" fill="${CYAN}" stroke="${INK}" stroke-width="2.5" transform="rotate(${-24 + i * 12} ${81 + i * 8} ${186 - i * 6})"/>
    `,
  },
  {
    id: 'think',
    masterKey: 'thinking',
    durationMs: 260,
    direction: 'ping-pong',
    bob: [0, -3, -6, -2],
    tilt: [-3, -5, -4, -2],
    scale: [1.0, 1.008, 1.012, 1.004],
    fx: (i) => `
      <circle cx="386" cy="168" r="${5 + i}" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>
      <circle cx="412" cy="136" r="${9 + i * 1.5}" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>
      <circle cx="438" cy="100" r="${13 + i * 1.5}" fill="${CYAN}" stroke="${INK}" stroke-width="4"/>
    `,
  },
  {
    id: 'loading',
    masterKey: 'thinking',
    durationMs: 170,
    direction: 'forward',
    bob: [0, -4, 0, 3],
    tilt: [0, 1.5, 0, -1.5],
    scale: [1.0, 1.01, 1.0, 0.995],
    fx: (i) => `
      <g transform="rotate(${i * 90} 418 122)">
        <circle cx="418" cy="122" r="24" fill="${CHARCOAL}" fill-opacity="0.7" stroke="${INK}" stroke-width="6"/>
        <path d="M 418 98 A 24 24 0 0 1 442 122" fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="round"/>
        <path d="M 418 146 A 24 24 0 0 1 394 122" fill="none" stroke="${YELLOW}" stroke-width="5" stroke-linecap="round"/>
      </g>
    `,
  },
  {
    id: 'success',
    masterKey: 'celebrating',
    durationMs: 190,
    direction: 'forward',
    bob: [0, -10, -14, -4],
    tilt: [0, 2, 3, 1],
    scale: [1.0, 1.02, 1.03, 1.01],
    fx: (i) => `
      <circle cx="414" cy="126" r="${22 + i * 2}" fill="${YELLOW}" stroke="${INK}" stroke-width="4.5"/>
      <path d="M 402 126 L 412 136 L 428 114" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  {
    id: 'error',
    masterKey: 'angry',
    durationMs: 150,
    direction: 'ping-pong',
    bob: [0, 4, -4, 2],
    tilt: [-4, 4, -3, 2],
    scale: [1.02, 1.04, 1.02, 1.03],
    fx: (i) => `
      <polygon points="416,${84 + i * 2} 446,${140 + i * 2} 386,${140 + i * 2}" fill="${MAGENTA}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M 416 ${104 + i * 2} V ${120 + i * 2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="416" cy="${130 + i * 2}" r="3" fill="${INK}"/>
      <path d="M ${54 + i * 3} 142 L ${92 + i * 3} 160 M ${48 + i * 3} 180 L ${88 + i * 3} 186" stroke="${MAGENTA}" stroke-width="5" stroke-linecap="round"/>
    `,
  },
];

const WALTER_EXPRESSIONS = [
  {
    slug: 'calm',
    tilt: 0,
    scale: 1.0,
    offsetY: 4,
    overlay: `
      <circle cx="414" cy="112" r="10" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(94, 128, 16, 5.5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'sweeping',
    tilt: -3,
    scale: 1.02,
    offsetY: 2,
    overlay: `
      <path d="M 46 392 Q 112 356 176 382 M 36 420 Q 108 388 170 408" fill="none" stroke="${CYAN}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="${starPath(422, 124, 20, 7, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
  {
    slug: 'gloating',
    tilt: 3,
    scale: 1.03,
    offsetY: -2,
    overlay: `
      <path d="${starPath(418, 106, 22, 7.5, 4)}" fill="${MAGENTA}" stroke="${INK}" stroke-width="4"/>
      <path d="${starPath(96, 134, 18, 6, 4)}" fill="${VIOLET}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 404 166 L 444 152 M 412 192 L 454 186" stroke="${MAGENTA}" stroke-width="5" stroke-linecap="round"/>
    `,
  },
  {
    slug: 'victorious',
    tilt: -1,
    scale: 1.04,
    offsetY: -6,
    overlay: `
      <path d="M 380 138 L 392 92 L 414 114 L 436 92 L 448 138 Z" fill="${YELLOW}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="${starPath(96, 108, 22, 7.5, 5)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
      <path d="${starPath(434, 194, 16, 5.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3.5"/>
    `,
  },
];

async function placeOnCanvas(width, height, fgBuf, offsetY = 0) {
  const fgMeta = await sharp(fgBuf).metadata();
  const canvasW = Math.max(width, fgMeta.width + 40);
  const canvasH = Math.max(height, fgMeta.height + Math.abs(offsetY) * 2 + 40);
  const left = Math.round((canvasW - fgMeta.width) / 2);
  const top = Math.round((canvasH - fgMeta.height) / 2 + offsetY);
  const extractLeft = Math.round((canvasW - width) / 2);
  const extractTop = Math.round((canvasH - height) / 2);
  return sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fgBuf, left, top }])
    .extract({ left: extractLeft, top: extractTop, width, height })
    .png()
    .toBuffer();
}

async function buildCompositePortrait(
  cutoutBuf,
  {
    size = 512,
    tilt = 0,
    scale = 1,
    offsetY = 0,
    tint = null,
    overlaySvg = '',
    background = { r: 0, g: 0, b: 0, alpha: 0 },
  }
) {
  const innerSize = Math.round(size * 0.84 * scale);
  let fg = sharp(cutoutBuf).resize(innerSize, innerSize, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (tilt !== 0) {
    fg = fg.rotate(tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  if (tint) {
    fg = fg.modulate(tint);
  }
  const positionedFg = await placeOnCanvas(size, size, await fg.png().toBuffer(), offsetY);

  const composites = [{ input: positionedFg, left: 0, top: 0 }];
  if (overlaySvg) {
    const overlayBuf = await svgBuffer(size, size, overlaySvg);
    composites.push({ input: overlayBuf, left: 0, top: 0 });
  }

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 })
    .toBuffer();
}

async function encodeWebpWithinBudget(buildPipeline, maxBytes, qualities) {
  let smallest = null;
  for (const quality of qualities) {
    const buf = await buildPipeline().webp({ quality, effort: 6 }).toBuffer();
    if (!smallest || buf.length < smallest.length) smallest = buf;
    if (buf.length <= maxBytes) return buf;
  }
  return smallest;
}

async function main() {
  const manifestPath = resolve(packageRoot, 'manifest.json');
  const licensesPath = resolve(packageRoot, 'licenses.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const licenses = JSON.parse(await readFile(licensesPath, 'utf8'));

  const riotSourceDir = resolve(packageRoot, 'source/artwork/riot-universe');
  const kuroModelPath = resolve(riotSourceDir, 'kuro-signal-model-sheet-master.png');
  const kuroHappyPath = resolve(riotSourceDir, 'kuro-signal-portrait-happy-master.png');
  const kuroExcitedPath = resolve(riotSourceDir, 'kuro-signal-portrait-excited-master.png');
  const kuroThinkingPath = resolve(riotSourceDir, 'kuro-signal-portrait-thinking-master.png');
  const kuroCelebratingPath = resolve(riotSourceDir, 'kuro-signal-portrait-celebrating-master.png');
  const kuroAngryPath = resolve(riotSourceDir, 'kuro-signal-portrait-angry-master.png');
  const kuroSadPath = resolve(riotSourceDir, 'kuro-signal-portrait-sad-master.png');
  const kuroFullbodyPath = resolve(riotSourceDir, 'kuro-signal-fullbody-standing-master.png');
  const kuroPoseRunningPath = resolve(riotSourceDir, 'kuro-signal-pose-running-master.png');
  const kuroPoseSittingPath = resolve(riotSourceDir, 'kuro-signal-pose-sitting-master.png');
  const kuroPoseWavingPath = resolve(riotSourceDir, 'kuro-signal-pose-waving-master.png');
  const vesperPortraitPath = resolve(riotSourceDir, 'vesper-ink-portrait-master.png');
  const walterCelPath = resolve(riotSourceDir, 'walter-white-portrait-cel-master.png');

  stdout.write('Keying character masters via 2-pass anti-aliased flood-fill...\n');
  const [
    kuroPortraitHappyCutout,
    kuroPortraitExcitedCutout,
    kuroPortraitThinkingCutout,
    kuroPortraitCelebratingCutout,
    kuroPortraitAngryCutout,
    kuroPortraitSadCutout,
    kuroFullbodyStandingCutout,
    kuroPoseRunningCutout,
    kuroPoseSittingCutout,
    kuroPoseWavingCutout,
    vesperPortraitCutout,
    walterCelCutout,
    kuroSideCutout,
    kuroThreeQuarterCutout,
  ] = await Promise.all([
    floodFillCutout(kuroHappyPath),
    floodFillCutout(kuroExcitedPath),
    floodFillCutout(kuroThinkingPath),
    floodFillCutout(kuroCelebratingPath),
    floodFillCutout(kuroAngryPath),
    floodFillCutout(kuroSadPath),
    floodFillCutout(kuroFullbodyPath),
    floodFillCutout(kuroPoseRunningPath),
    floodFillCutout(kuroPoseSittingPath),
    floodFillCutout(kuroPoseWavingPath),
    floodFillCutout(vesperPortraitPath),
    floodFillCutout(walterCelPath),
    floodFillCutout(kuroModelPath, { left: 614, top: 44, width: 208, height: 710 }),
    floodFillCutout(kuroModelPath, { left: 988, top: 38, width: 268, height: 722 }),
  ]);

  const expressionCutouts = {
    happy: kuroPortraitHappyCutout,
    excited: kuroPortraitExcitedCutout,
    thinking: kuroPortraitThinkingCutout,
    celebrating: kuroPortraitCelebratingCutout,
    angry: kuroPortraitAngryCutout,
    sad: kuroPortraitSadCutout,
  };

  const viewCutouts = {
    front: kuroFullbodyStandingCutout,
    side: kuroSideCutout,
    threeQuarter: kuroThreeQuarterCutout,
    running: kuroPoseRunningCutout,
    sitting: kuroPoseSittingCutout,
    waving: kuroPoseWavingCutout,
  };

  const generated = [];
  const sourceProvenance = [];

  // 1. Register all Direct AI Source Masters + synthesize the 2 procedural halftone masters
  const existingMasters = [
    {
      path: 'source/artwork/riot-universe/kuro-signal-model-sheet-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white sheet for Signal Riot character pipeline',
      modifications:
        'Unaltered 3-view character turnaround master (front, side, 3/4) for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-portrait-happy-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI happy bust portrait master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-portrait-excited-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI excited bust portrait master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-portrait-thinking-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI thinking bust portrait master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-portrait-celebrating-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI celebrating bust portrait master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-portrait-angry-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI angry/determined bust portrait master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-portrait-sad-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI sad/teary bust portrait master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-fullbody-standing-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI full-body standing master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-pose-running-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI dynamic full-body running/action master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-pose-sitting-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI full-body seated on crate with handheld signal deck master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/kuro-signal-pose-waving-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI full-body friendly waving master for kuro-signal.',
    },
    {
      path: 'source/artwork/riot-universe/vesper-ink-portrait-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation on solid white backdrop for Signal Riot character pipeline',
      modifications: 'Direct AI bust portrait master for vesper-ink.',
    },
    {
      path: 'source/artwork/riot-universe/walter-white-portrait-cel-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI cel-shaded portrait master unified with Signal Riot art direction',
      modifications: 'Direct AI cel-shaded bust portrait master on #ffffff for transparent walter-white cutouts.',
    },
    {
      path: 'source/artwork/riot-universe/bg-riot-street-alley-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation for Signal Riot nocturnal street alley environment',
      modifications: 'Direct AI 1376x768 landscape master for Signal Riot street alley backdrop.',
    },
    {
      path: 'source/artwork/riot-universe/bg-riot-arcade-workbench-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation for Signal Riot arcade studio workbench environment',
      modifications: 'Direct AI 1376x768 landscape master for Signal Riot arcade workbench backdrop.',
    },
    {
      path: 'source/artwork/riot-universe/scene-empty-signal-static-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation for Signal Riot empty/offline/static scene states',
      modifications: 'Direct AI 1376x768 narrative scene master for empty-signal-static.',
    },
    {
      path: 'source/artwork/riot-universe/scene-error-static-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation for Signal Riot error/offline/glitch scene states',
      modifications: 'Direct AI narrative scene master for rooftop CRT static & antenna glitch.',
    },
    {
      path: 'source/artwork/riot-universe/scene-onboarding-welcome-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation for Signal Riot onboarding/welcome scene states',
      modifications: 'Direct AI 1376x768 narrative scene master for onboarding-welcome.',
    },
    {
      path: 'source/artwork/riot-universe/scene-quest-victory-master.png',
      creator: 'Google Gemini image generation, commissioned by MoonWitness contributors',
      source: 'Direct AI master generation for Signal Riot quest victory/celebration scene states',
      modifications: 'Direct AI 1376x768 narrative scene master for quest-victory.',
    },
  ];
  for (const item of existingMasters) {
    const meta = await sharp(resolve(packageRoot, item.path)).metadata();
    generated.push({
      path: item.path,
      kind: 'source',
      variant: 'riot-universe-master',
      format: 'png',
      width: meta.width,
      height: meta.height,
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'MoonWitness Commissioned Asset (ISC pipeline)',
      source: 'packages/assets/scripts/generate-riot-universe.mjs',
    });
    sourceProvenance.push({
      path: item.path,
      creator: item.creator,
      source: item.source,
      license: 'MoonWitness Commissioned Asset (ISC pipeline)',
      termsVerified: true,
      modifications: item.modifications,
      status: 'approved',
      distribution: 'approved source master for MoonWitness Signal Riot asset pipeline',
    });
  }

  // 2. Backgrounds (2 Direct AI -> WebP + 2 procedural halftone masters -> WebP, <= 220 KB)
  const MAX_BG_BYTES = 220 * 1024;
  for (const slug of ['riot-street-alley', 'riot-arcade-workbench']) {
    const masterRel = `source/artwork/riot-universe/bg-${slug}-master.png`;
    const webpRel = `illustrations/riot-universe/backgrounds/bg-${slug}.webp`;
    const masterAbs = resolve(packageRoot, masterRel);
    const webpBuf = await encodeWebpWithinBudget(
      () => sharp(masterAbs).resize(1376, 768, { fit: 'cover', position: 'centre' }),
      MAX_BG_BYTES,
      [78, 66, 54, 44]
    );
    await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
    generated.push({
      path: webpRel,
      kind: 'background',
      variant: slug,
      format: 'webp',
      width: 1376,
      height: 768,
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'MoonWitness Commissioned Asset (ISC pipeline)',
      source: masterRel,
      sourceAsset: masterRel,
    });
  }

  const proceduralBgSpecs = [
    {
      slug: 'halftone-paper-light',
      notes:
        'Procedural warm newsprint zine texture (#f3efe4) with Ben-Day halftone dots and corner registration marks.',
      baseColor: { r: 243, g: 239, b: 228, alpha: 1 },
      overlay: `
        ${halftoneDots(44, 24, 16, 16, 32, 2.2, INK, 0.08)}
        ${halftoneDots(20, 12, 740, 380, 32, 3.2, MAGENTA, 0.07)}
        <path d="M 28 58 L 28 28 L 58 28 M 1348 58 L 1348 28 L 1318 28 M 28 710 L 28 740 L 58 740 M 1348 710 L 1348 740 L 1318 740" fill="none" stroke="${INK}" stroke-opacity="0.24" stroke-width="3"/>
      `,
    },
    {
      slug: 'halftone-ink-dark',
      notes:
        'Procedural charcoal zine backdrop (#0e0e10) with subtle halftone grid and cyan/magenta rim vignette.',
      baseColor: { r: 14, g: 14, b: 16, alpha: 1 },
      overlay: `
        ${halftoneDots(44, 24, 16, 16, 32, 2.2, PAPER, 0.07)}
        ${halftoneDots(18, 10, 820, 40, 30, 3, CYAN, 0.09)}
        <rect x="18" y="18" width="1340" height="732" fill="none" stroke="${MAGENTA}" stroke-opacity="0.18" stroke-width="3"/>
      `,
    },
  ];

  for (const bg of proceduralBgSpecs) {
    const masterRel = `source/artwork/riot-universe/bg-${bg.slug}-master.png`;
    const webpRel = `illustrations/riot-universe/backgrounds/bg-${bg.slug}.webp`;
    const overlayBuf = await svgBuffer(1376, 768, bg.overlay);
    const masterBuf = await sharp({
      create: { width: 1376, height: 768, channels: 4, background: bg.baseColor },
    })
      .composite([{ input: overlayBuf, left: 0, top: 0 }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    await atomicWrite(resolve(packageRoot, masterRel), masterBuf);
    const webpBuf = await encodeWebpWithinBudget(
      () => sharp(masterBuf),
      MAX_BG_BYTES,
      [78, 66, 54, 44]
    );
    await atomicWrite(resolve(packageRoot, webpRel), webpBuf);

    generated.push({
      path: masterRel,
      kind: 'source',
      variant: 'riot-universe-background-master',
      format: 'png',
      width: 1376,
      height: 768,
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'ISC',
      source: 'packages/assets/scripts/generate-riot-universe.mjs',
    });
    sourceProvenance.push({
      path: masterRel,
      creator: 'MoonWitness contributors',
      source: 'Procedural comic-halftone SVG/sharp rasterizer',
      license: 'ISC',
      termsVerified: true,
      modifications: bg.notes,
      status: 'approved',
      distribution: 'approved source master for MoonWitness Signal Riot asset pipeline',
    });
    generated.push({
      path: webpRel,
      kind: 'background',
      variant: bg.slug,
      format: 'webp',
      width: 1376,
      height: 768,
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'ISC',
      source: masterRel,
      sourceAsset: masterRel,
    });
  }

  // 3. 16 Kuro Expressions (512x512 PNG + WebP)
  stdout.write('Generating 16 Kuro expression cutouts (.png + .webp)...\n');
  for (const expr of EXPRESSIONS) {
    const cutout = expressionCutouts[expr.masterKey];
    const sourceMasterRel = EXPRESSION_MASTERS[expr.masterKey];
    const pngBuf = await buildCompositePortrait(cutout, {
      size: 512,
      tilt: expr.tilt,
      scale: expr.scale,
      offsetY: expr.offsetY,
      tint: expr.tint,
      overlaySvg: expr.overlay,
    });
    const webpBuf = await sharp(pngBuf)
      .webp({ quality: 88, alphaQuality: 96, effort: 6 })
      .toBuffer();
    const pngRel = `illustrations/riot-universe/characters/kuro-signal-expression-${expr.slug}.png`;
    const webpRel = `illustrations/riot-universe/characters/kuro-signal-expression-${expr.slug}.webp`;
    await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
    await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
    for (const [path, format] of [
      [pngRel, 'png'],
      [webpRel, 'webp'],
    ]) {
      generated.push({
        path,
        kind: 'character-sprite',
        variant: `expression-${expr.slug}`,
        subject: 'kuro-signal',
        format,
        width: 512,
        height: 512,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'MoonWitness Commissioned Asset (ISC pipeline)',
        source: sourceMasterRel,
        sourceAsset: sourceMasterRel,
      });
    }
  }

  // 4. 12 Kuro Poses (512x768 PNG + WebP)
  stdout.write('Generating 12 Kuro full-body pose cutouts (.png + .webp)...\n');
  for (const pose of POSES) {
    const baseCutout = viewCutouts[pose.view];
    const poseSourceRel = POSE_MASTERS[pose.view];
    let fg = sharp(baseCutout).resize(420, 650, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    if (pose.tilt !== 0) fg = fg.rotate(pose.tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    const positionedFg = await placeOnCanvas(512, 768, await fg.png().toBuffer(), pose.offsetY);
    const composites = [];
    if (pose.backFx)
      composites.push({ input: await svgBuffer(512, 768, pose.backFx), left: 0, top: 0 });
    composites.push({ input: positionedFg, left: 0, top: 0 });
    if (pose.frontFx)
      composites.push({ input: await svgBuffer(512, 768, pose.frontFx), left: 0, top: 0 });

    const pngBuf = await sharp({
      create: { width: 512, height: 768, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(composites)
      .png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 })
      .toBuffer();
    const webpBuf = await sharp(pngBuf)
      .webp({ quality: 88, alphaQuality: 96, effort: 6 })
      .toBuffer();

    const pngRel = `illustrations/riot-universe/characters/kuro-signal-pose-${pose.slug}.png`;
    const webpRel = `illustrations/riot-universe/characters/kuro-signal-pose-${pose.slug}.webp`;
    await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
    await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
    for (const [path, format] of [
      [pngRel, 'png'],
      [webpRel, 'webp'],
    ]) {
      generated.push({
        path,
        kind: 'character-sprite',
        variant: `pose-${pose.slug}`,
        subject: 'kuro-signal',
        format,
        width: 512,
        height: 768,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'MoonWitness Commissioned Asset (ISC pipeline)',
        source: poseSourceRel,
        sourceAsset: poseSourceRel,
      });
    }
  }

  // 5. Vesper portrait (512x512 PNG + WebP)
  {
    const pngBuf = await buildCompositePortrait(vesperPortraitCutout, {
      size: 512,
      scale: 1.06,
      offsetY: 16,
    });
    const webpBuf = await sharp(pngBuf)
      .webp({ quality: 88, alphaQuality: 96, effort: 6 })
      .toBuffer();
    const pngRel = 'illustrations/riot-universe/characters/vesper-ink-portrait.png';
    const webpRel = 'illustrations/riot-universe/characters/vesper-ink-portrait.webp';
    await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
    await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
    for (const [path, format] of [
      [pngRel, 'png'],
      [webpRel, 'webp'],
    ]) {
      generated.push({
        path,
        kind: 'character-sprite',
        variant: 'portrait',
        subject: 'vesper-ink',
        format,
        width: 512,
        height: 512,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'MoonWitness Commissioned Asset (ISC pipeline)',
        source: 'source/artwork/riot-universe/vesper-ink-portrait-master.png',
        sourceAsset: 'source/artwork/riot-universe/vesper-ink-portrait-master.png',
      });
    }
  }

  // 5b. Walter White 4 transparent cel-shaded expressions (512x512 PNG + WebP)
  stdout.write('Generating 4 transparent cel-shaded Walter White cutouts (.png + .webp)...\n');
  const walterSourceRel = 'source/artwork/riot-universe/walter-white-portrait-cel-master.png';
  for (const expr of WALTER_EXPRESSIONS) {
    const pngBuf = await buildCompositePortrait(walterCelCutout, {
      size: 512,
      tilt: expr.tilt,
      scale: expr.scale,
      offsetY: expr.offsetY,
      overlaySvg: expr.overlay,
    });
    const webpBuf = await sharp(pngBuf)
      .webp({ quality: 88, alphaQuality: 96, effort: 6 })
      .toBuffer();
    const pngRel = `illustrations/riot-universe/characters/walter-white-expression-${expr.slug}.png`;
    const webpRel = `illustrations/riot-universe/characters/walter-white-expression-${expr.slug}.webp`;
    await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
    await atomicWrite(resolve(packageRoot, webpRel), webpBuf);
    for (const [path, format] of [
      [pngRel, 'png'],
      [webpRel, 'webp'],
    ]) {
      generated.push({
        path,
        kind: 'character-sprite',
        variant: `expression-${expr.slug}`,
        subject: 'walter-white',
        format,
        width: 512,
        height: 512,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'MoonWitness Commissioned Asset (ISC pipeline)',
        source: walterSourceRel,
        sourceAsset: walterSourceRel,
      });
    }
  }

  // 6. 25 UI States (640x480 WebP <= 160 KB) — clean comic framing, zero duplicate actors
  stdout.write('Generating 25 UI state vignettes (.webp)...\n');
  const MAX_STATE_BYTES = 160 * 1024;
  for (const state of UI_STATES) {
    const rel = `illustrations/riot-universe/states/state-${state.slug}.webp`;
    const masterRel = `source/artwork/riot-universe/${state.master}`;
    const hasEmbeddedActor = MASTERS_WITH_CHARACTERS.has(state.master);

    const frameSvg = `
      <defs>
        <linearGradient id="st_scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${NIGHT}" stop-opacity="0.18"/>
          <stop offset="65%" stop-color="${NIGHT}" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="${NIGHT}" stop-opacity="0.44"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="640" height="480" fill="url(#st_scrim)"/>
      ${halftoneDots(8, 3, 24, 24, 18, 1.8, state.accent, 0.22)}
      <rect x="10" y="10" width="620" height="460" fill="none" stroke="${INK}" stroke-width="6"/>
      <rect x="14" y="14" width="612" height="452" fill="none" stroke="${state.accent}" stroke-width="2" stroke-opacity="0.82"/>
      <path d="M 14 42 V 14 H 42 M 598 14 H 626 V 42 M 14 438 V 466 H 42 M 598 466 H 626 V 438" fill="none" stroke="${state.accent}" stroke-width="4.5" stroke-linecap="square"/>
      ${stateBadge(state.accent, state.badgeIcon, state.master)}
    `;

    const composites = [];
    if (!hasEmbeddedActor && (state.actor === 'kuro' || state.actor === 'both')) {
      const kuroCutout = expressionCutouts[state.expr] ?? expressionCutouts.thinking;
      const kBuf = await sharp(kuroCutout)
        .resize(248, 248, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({ input: kBuf, left: 20, top: 222 });
    }
    if (!hasEmbeddedActor && (state.actor === 'vesper' || state.actor === 'both')) {
      const vBuf = await sharp(vesperPortraitCutout)
        .resize(236, 236, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({ input: vBuf, left: state.actor === 'both' ? 378 : 22, top: 234 });
    }
    composites.push({ input: await svgBuffer(640, 480, frameSvg), left: 0, top: 0 });

    const masterAbs = resolve(packageRoot, masterRel);
    const webpBuf = await encodeWebpWithinBudget(
      () =>
        sharp(masterAbs)
          .resize(640, 480, { fit: 'cover', position: 'centre' })
          .composite(composites),
      MAX_STATE_BYTES,
      [84, 74, 62, 50]
    );
    await atomicWrite(resolve(packageRoot, rel), webpBuf);
    generated.push({
      path: rel,
      kind: 'state-illustration',
      variant: state.slug,
      format: 'webp',
      width: 640,
      height: 480,
      pack: 'riot-universe',
      domain: 'ui-states',
      status: 'approved',
      license: 'MoonWitness Commissioned Asset (ISC pipeline)',
      source: masterRel,
      sourceAsset: masterRel,
    });
  }

  // 7. 12 Stickers (256x256 .svg + transparent .png)
  stdout.write('Generating 12 comic stickers (.svg + .png)...\n');
  for (const sticker of STICKERS) {
    const svgRel = `illustrations/riot-universe/stickers/sticker-${sticker.slug}.svg`;
    const pngRel = `illustrations/riot-universe/stickers/sticker-${sticker.slug}.png`;
    const svgText = wrapSvg(svgRel, 256, 256, sticker.title, sticker.body);
    await atomicWrite(resolve(packageRoot, svgRel), svgText);
    const pngBuf = await sharp(Buffer.from(svgText, 'utf8'))
      .resize(256, 256)
      .png({ compressionLevel: 9, palette: true, quality: 94 })
      .toBuffer();
    await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
    generated.push(
      {
        path: svgRel,
        kind: 'sticker',
        variant: sticker.slug,
        format: 'svg',
        width: 256,
        height: 256,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'ISC',
        source: 'packages/assets/scripts/generate-riot-universe.mjs',
      },
      {
        path: pngRel,
        kind: 'sticker',
        variant: sticker.slug,
        format: 'png',
        width: 256,
        height: 256,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'ISC',
        source: svgRel,
        sourceAsset: svgRel,
      }
    );
  }

  // 8. 13 Game & Badges (.svg + transparent .png)
  stdout.write('Generating 13 game badges, ranks & avatars (.svg + .png)...\n');
  for (const item of GAME_ASSETS) {
    const svgRel = `illustrations/riot-universe/game/${item.slug}.svg`;
    const pngRel = `illustrations/riot-universe/game/${item.slug}.png`;
    const svgText = wrapSvg(svgRel, item.w, item.h, item.title, item.body);
    await atomicWrite(resolve(packageRoot, svgRel), svgText);

    let pngBuf;
    if (item.avatarKey) {
      const portrait = item.avatarKey === 'kuro' ? kuroPortraitHappyCutout : vesperPortraitCutout;
      const ringSvg = `<circle cx="132" cy="132" r="112" fill="${INK}"/><circle cx="128" cy="128" r="112" fill="${CHARCOAL}" stroke="${INK}" stroke-width="10"/><circle cx="128" cy="128" r="98" fill="${item.avatarKey === 'kuro' ? CYAN : VIOLET}" fill-opacity="0.24" stroke="${item.avatarKey === 'kuro' ? YELLOW : VIOLET}" stroke-width="6"/>`;
      const faceBuf = await sharp(portrait)
        .resize(186, 186, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      const frontRing = `<circle cx="128" cy="128" r="108" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="128" cy="128" r="100" fill="none" stroke="${item.avatarKey === 'kuro' ? YELLOW : VIOLET}" stroke-width="4.5"/>`;
      pngBuf = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          { input: await svgBuffer(256, 256, ringSvg), left: 0, top: 0 },
          { input: faceBuf, left: 35, top: 43 },
          { input: await svgBuffer(256, 256, frontRing), left: 0, top: 0 },
        ])
        .png({ compressionLevel: 9, palette: true, quality: 94 })
        .toBuffer();
    } else {
      pngBuf = await sharp(Buffer.from(svgText, 'utf8'))
        .resize(item.w, item.h)
        .png({ compressionLevel: 9, palette: true, quality: 94 })
        .toBuffer();
    }

    await atomicWrite(resolve(packageRoot, pngRel), pngBuf);
    generated.push(
      {
        path: svgRel,
        kind: 'game-asset',
        variant: item.slug,
        format: 'svg',
        width: item.w,
        height: item.h,
        pack: 'riot-universe',
        domain: 'gamification',
        status: 'approved',
        license: 'ISC',
        source: 'packages/assets/scripts/generate-riot-universe.mjs',
      },
      {
        path: pngRel,
        kind: 'game-asset',
        variant: item.slug,
        format: 'png',
        width: item.w,
        height: item.h,
        pack: 'riot-universe',
        domain: 'gamification',
        status: 'approved',
        license: 'ISC',
        source: svgRel,
        sourceAsset: svgRel,
      }
    );
  }

  // 9. 8 Kuro Animation Clips (4 x 512x512 PNG frames + 1024x1024 2x2 PNG sheet + clip JSON)
  stdout.write('Generating 8 Kuro animation clips (frames + 2x2 sheets + clip JSON)...\n');
  for (const clipSpec of ANIMATION_CLIPS) {
    const dirRel = `animation/kuro-signal-${clipSpec.id}`;
    const sheetRel = `${dirRel}/kuro-signal-${clipSpec.id}-sheet.png`;
    const clipRel = `${dirRel}/kuro-signal-${clipSpec.id}-clip.json`;
    const clipCutout = expressionCutouts[clipSpec.masterKey];
    const clipSourceRel = EXPRESSION_MASTERS[clipSpec.masterKey];
    const frameBuffers = [];
    const frameEntries = [];

    for (let i = 0; i < 4; i += 1) {
      const frameNum = String(i + 1).padStart(2, '0');
      const frameRel = `${dirRel}/kuro-signal-${clipSpec.id}-frame-${frameNum}.png`;
      const frameBuf = await buildCompositePortrait(clipCutout, {
        size: 512,
        tilt: clipSpec.tilt[i],
        scale: clipSpec.scale ? clipSpec.scale[i] : 0.98 + (i % 2 === 1 ? 0.02 : 0),
        offsetY: clipSpec.bob[i],
        overlaySvg: clipSpec.fx(i),
      });
      await atomicWrite(resolve(packageRoot, frameRel), frameBuf);
      frameBuffers.push(frameBuf);
      frameEntries.push({ asset: frameRel, durationMs: clipSpec.durationMs });
      generated.push({
        path: frameRel,
        kind: 'animation-frame',
        variant: `kuro-signal-${clipSpec.id}-frame-${frameNum}`,
        subject: 'kuro-signal',
        format: 'png',
        width: 512,
        height: 512,
        pack: 'riot-universe',
        domain: 'visual-universe',
        status: 'approved',
        license: 'MoonWitness Commissioned Asset (ISC pipeline)',
        source: clipSourceRel,
        sourceAsset: clipSourceRel,
      });
    }

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
    generated.push({
      path: sheetRel,
      kind: 'animation-sheet',
      variant: `kuro-signal-${clipSpec.id}-sheet`,
      subject: 'kuro-signal',
      format: 'png',
      width: 1024,
      height: 1024,
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'MoonWitness Commissioned Asset (ISC pipeline)',
      source: clipSourceRel,
      sourceAsset: clipSourceRel,
    });

    const clipDoc = {
      schemaVersion: 1,
      clipId: `kuro-signal-${clipSpec.id}`,
      characterId: 'kuro-signal',
      pack: 'riot-universe',
      domain: 'visual-universe',
      description: `Four-frame stepped comic animation clip (${clipSpec.id}) for kuro-signal with 2x2 1024x1024 sprite atlas.`,
      clip: {
        id: `kuro-signal-${clipSpec.id}`,
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
      status: 'approved',
    };
    await atomicWrite(resolve(packageRoot, clipRel), `${JSON.stringify(clipDoc, null, 2)}\n`);
    generated.push({
      path: clipRel,
      kind: 'animation-clip',
      variant: `kuro-signal-${clipSpec.id}-clip`,
      subject: 'kuro-signal',
      format: 'json',
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'ISC',
      source: 'packages/assets/scripts/generate-riot-universe.mjs',
      spriteSheet: clipDoc.spriteSheet,
    });
  }

  // 10. 5-Layer Parallax Scene: 4 translucent atmospheric SVGs that enhance bg-riot-street-alley.webp
  stdout.write('Generating 5-layer Riot Alley parallax scene...\n');
  const alleyLayers = [
    {
      path: 'environments/riot-alley-bg.svg',
      title: 'Riot alley nocturnal moon halo and drifting halftone sky haze',
      variant: 'riot-alley-bg',
      body: `
        <defs>
          <radialGradient id="__ID__moonHalo" cx="67%" cy="17%" r="28%">
            <stop offset="0%" stop-color="${PAPER}" stop-opacity="0.34"/>
            <stop offset="48%" stop-color="${CYAN}" stop-opacity="0.14"/>
            <stop offset="100%" stop-color="${NIGHT}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="2048" height="1152" fill="url(#__ID__moonHalo)"/>
        ${halftoneDots(12, 5, 1180, 64, 34, 2.8, PAPER, 0.16)}
        <path d="M 140 260 Q 420 212 720 256 T 1340 248 T 1920 270" fill="none" stroke="${CYAN}" stroke-opacity="0.14" stroke-width="24" stroke-linecap="round"/>
      `,
    },
    {
      path: 'environments/riot-alley-mid.svg',
      title: 'Riot alley neon magenta and cyan wall glow atmosphere',
      variant: 'riot-alley-mid',
      body: `
        <defs>
          <radialGradient id="__ID__pinkGlow" cx="46%" cy="54%" r="24%">
            <stop offset="0%" stop-color="${MAGENTA}" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="${MAGENTA}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="__ID__cyanGlow" cx="82%" cy="56%" r="24%">
            <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="2048" height="1152" fill="url(#__ID__pinkGlow)"/>
        <rect x="0" y="0" width="2048" height="1152" fill="url(#__ID__cyanGlow)"/>
        ${halftoneDots(8, 6, 780, 420, 28, 2.4, MAGENTA, 0.16)}
        ${halftoneDots(8, 6, 1520, 400, 28, 2.4, CYAN, 0.16)}
      `,
    },
    {
      path: 'environments/riot-alley-fg.svg',
      title: 'Riot alley wet pavement shimmer reflections and framing vignette',
      variant: 'riot-alley-fg',
      body: `
        <defs>
          <linearGradient id="__ID__bottomVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${NIGHT}" stop-opacity="0"/>
            <stop offset="72%" stop-color="${NIGHT}" stop-opacity="0"/>
            <stop offset="100%" stop-color="${NIGHT}" stop-opacity="0.56"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="2048" height="1152" fill="url(#__ID__bottomVignette)"/>
        <ellipse cx="960" cy="1028" rx="190" ry="18" fill="${MAGENTA}" fill-opacity="0.22"/>
        <ellipse cx="1240" cy="1046" rx="210" ry="20" fill="${CYAN}" fill-opacity="0.2"/>
        <path d="M 860 1018 H 1040 M 1160 1044 H 1340" stroke="${PAPER}" stroke-opacity="0.28" stroke-width="3" stroke-linecap="round"/>
      `,
    },
    {
      path: 'environments/riot-alley-decor.svg',
      title: 'Riot alley overhead catenary wires and drifting comic spark motes',
      variant: 'riot-alley-decor',
      body: `
        <path d="M 0 112 Q 980 284 2048 134 M 0 176 Q 1040 342 2048 198" fill="none" stroke="${INK}" stroke-width="5" stroke-opacity="0.72" stroke-linecap="round"/>
        <path d="${starPath(1720, 290, 20, 6.5, 4)}" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
        <path d="${starPath(380, 260, 16, 5.5, 4)}" fill="${CYAN}" stroke="${INK}" stroke-width="3"/>
        <circle cx="1180" cy="236" r="7" fill="${MAGENTA}" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="840" cy="212" r="5.5" fill="${YELLOW}" stroke="${INK}" stroke-width="2.5"/>
        <path d="M 520 380 L 508 424 M 1480 340 L 1468 386 M 980 460 L 968 504" stroke="${CYAN}" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
      `,
    },
  ];
  for (const layer of alleyLayers) {
    const svgText = wrapSvg(layer.path, 2048, 1152, layer.title, layer.body);
    await atomicWrite(resolve(packageRoot, layer.path), svgText);
    generated.push({
      path: layer.path,
      kind: 'environment',
      variant: layer.variant,
      format: 'svg',
      width: 2048,
      height: 1152,
      pack: 'riot-universe',
      domain: 'visual-universe',
      status: 'approved',
      license: 'ISC',
      source: 'packages/assets/scripts/generate-riot-universe.mjs',
    });
  }

  const riotScenePath = 'scenes/riot-alley-scene.json';
  const riotSceneBundle = {
    scenes: [
      {
        id: 'riot-alley-hero',
        staticFallback: 'illustrations/riot-universe/backgrounds/bg-riot-street-alley.webp',
        accessibilityFallback: 'illustrations/riot-universe/states/state-welcome.webp',
        clips: ['kuro-signal-idle', 'kuro-signal-wave'],
        layers: [
          {
            id: 'sky-backdrop',
            asset: 'illustrations/riot-universe/backgrounds/bg-riot-street-alley.webp',
            order: 0,
            position: { x: 0.5, y: 0.5 },
            pivot: { x: 0.5, y: 0.5 },
            opacity: 1,
            parallax: { x: 0, y: 0 },
          },
          {
            id: 'alley-bg',
            asset: 'environments/riot-alley-bg.svg',
            order: 10,
            position: { x: 0.5, y: 0.5 },
            pivot: { x: 0.5, y: 0.5 },
            opacity: 0.9,
            parallax: { x: 0.1, y: 0.04 },
          },
          {
            id: 'alley-mid',
            asset: 'environments/riot-alley-mid.svg',
            order: 20,
            position: { x: 0.5, y: 0.52 },
            pivot: { x: 0.5, y: 0.52 },
            opacity: 0.92,
            parallax: { x: 0.28, y: 0.1 },
          },
          {
            id: 'alley-fg',
            asset: 'environments/riot-alley-fg.svg',
            order: 40,
            position: { x: 0.5, y: 0.88 },
            pivot: { x: 0.5, y: 0.88 },
            opacity: 0.95,
            parallax: { x: 0.52, y: 0.18 },
          },
          {
            id: 'alley-decor',
            asset: 'environments/riot-alley-decor.svg',
            order: 60,
            position: { x: 0.5, y: 0.24 },
            pivot: { x: 0.5, y: 0.24 },
            opacity: 0.94,
            parallax: { x: 0.72, y: 0.24 },
          },
        ],
        breakpoints: [
          {
            name: 'mobile',
            minWidth: 0,
            maxWidth: 767,
            overlay: 'illustrations/riot-universe/states/state-welcome.webp',
            layerOverrides: [
              { layerId: 'alley-decor', opacity: 0.55, parallax: { x: 0.2, y: 0.08 } },
            ],
          },
          {
            name: 'desktop',
            minWidth: 768,
            overlay: 'illustrations/riot-universe/backgrounds/bg-riot-street-alley.webp',
          },
        ],
      },
    ],
    clips: ['idle', 'wave'].map((clipId) => {
      const spec = ANIMATION_CLIPS.find((c) => c.id === clipId);
      return {
        id: `kuro-signal-${clipId}`,
        loop: true,
        direction: spec.direction,
        pivot: { x: 0.5, y: 0.88 },
        frames: [1, 2, 3, 4].map((n) => ({
          asset: `animation/kuro-signal-${clipId}/kuro-signal-${clipId}-frame-0${n}.png`,
          durationMs: spec.durationMs,
        })),
      };
    }),
  };
  await atomicWrite(
    resolve(packageRoot, riotScenePath),
    `${JSON.stringify(riotSceneBundle, null, 2)}\n`
  );
  generated.push({
    path: riotScenePath,
    kind: 'scene',
    variant: 'canonical-scene-bundle',
    format: 'json',
    pack: 'riot-universe',
    domain: 'visual-universe',
    status: 'approved',
    license: 'ISC',
    source: 'packages/assets/scripts/generate-riot-universe.mjs',
  });

  // Update manifest.json with strict ownership via replaceGeneratedAssets
  const ownedPaths = new Set(generated.map((item) => item.path));
  manifest.assets = replaceGeneratedAssets(manifest.assets, generated, ownedPaths);
  await atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Update licenses.json sourceAssets for every kind === 'source' && pack === 'riot-universe'
  const retainedProvenance = (licenses.sourceAssets ?? []).filter(
    (entry) => !ownedPaths.has(entry.path)
  );
  licenses.sourceAssets = [...retainedProvenance, ...sourceProvenance].sort((a, b) =>
    a.path.localeCompare(b.path)
  );
  await atomicWrite(licensesPath, `${JSON.stringify(licenses, null, 2)}\n`);

  stdout.write(
    `Generated riot-universe pack: ${generated.length} manifest entries (${sourceProvenance.length} source masters).\n`
  );
}

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
