import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicWrite } from './atomic-write.mjs';
import { replaceGeneratedAssets } from './manifest-ownership.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const escapeHtml = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const PROOF_DIR = 'brand/rendered';
const PROOF_COLORS = 96;
const CELL = { width: 152, height: 172, columns: 8, pad: 16, head: 72, thumbHeight: 118 };
const LABEL_MAX = 21;
const MONO = 'font-family="Consolas, Menlo, monospace"';
const PROOF_SHEETS = [
  {
    file: 'contact-sheet-rocksoul-cast.png',
    title: 'ROCKSOUL cast: cel and rough-pencil sprites',
    select: (asset) => asset.pack === 'rocksoul-universe',
  },
  {
    file: 'contact-sheet-pencil-grunge-stickers.png',
    title: 'Street stickers on cream paper (left) and obsidian (right)',
    select: (asset) => asset.pack === 'stickers-pack',
    split: true,
  },
  {
    file: 'contact-sheet-ai-agent-states.png',
    title: 'AI agent telemetry badges and UI state vignettes',
    select: (asset) => ['telemetry-pack', 'ui-state-pack'].includes(asset.pack),
  },
];

export function selectProofAssets(manifest, sheet) {
  return manifest.assets
    .filter((asset) => asset.format === 'png' && sheet.select(asset))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}

export function proofLabel(variant) {
  return variant.length <= LABEL_MAX ? variant : `~${variant.slice(-(LABEL_MAX - 1))}`;
}

const cellOrigin = (index) => ({
  x: CELL.pad + (index % CELL.columns) * CELL.width,
  y: CELL.head + Math.floor(index / CELL.columns) * CELL.height,
});

function cellSvg(sheet, asset, index) {
  const { x, y } = cellOrigin(index);
  const half = CELL.width / 2 - 3;
  const box = (dx, width, fill) =>
    `<rect x="${x + 3 + dx}" y="${y + 3}" width="${width}" height="${CELL.thumbHeight + 16}" fill="${fill}"/>`;
  const fills = sheet.split
    ? box(0, half, '#f3efe4') + box(half, half, '#0e0e10')
    : box(0, CELL.width - 6, '#232631');
  return `${fills}<text x="${x + 8}" y="${y + CELL.thumbHeight + 36}" ${MONO} font-size="11" fill="#b8b4aa">` +
    `${escapeHtml(proofLabel(asset.variant))}</text>`;
}

function proofBackground(sheet, assets, size) {
  const text = (y, px, fill, body) =>
    `<text x="${CELL.pad}" y="${y}" ${MONO} font-size="${px}" fill="${fill}">${body}</text>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}">` +
      '<rect width="100%" height="100%" fill="#121318"/>' +
      text(34, 20, '#ffe031', escapeHtml(sheet.title)) +
      text(56, 12, '#b8b4aa', `${assets.length} PNG assets`) +
      assets.map((asset, index) => cellSvg(sheet, asset, index)).join('') +
      '</svg>',
    'utf8'
  );
}

async function thumbLayer(rootDir, asset, index) {
  const { data, info } = await sharp(resolve(rootDir, asset.path))
    .resize(CELL.width - 16, CELL.thumbHeight, { fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { x, y } = cellOrigin(index);
  return {
    input: data,
    left: x + Math.round((CELL.width - info.width) / 2),
    top: y + 11 + Math.round((CELL.thumbHeight - info.height) / 2),
  };
}

async function renderProofSheet(rootDir, sheet, assets) {
  const rows = Math.ceil(assets.length / CELL.columns);
  const width = CELL.columns * CELL.width + CELL.pad * 2;
  const height = CELL.head + rows * CELL.height + CELL.pad;
  const layers = [{ input: proofBackground(sheet, assets, { width, height }), left: 0, top: 0 }];
  for (const [index, asset] of assets.entries()) layers.push(await thumbLayer(rootDir, asset, index));
  const png = await sharp({ create: { width, height, channels: 4, background: '#121318' } })
    .composite(layers)
    .png({ palette: true, quality: 72, colors: PROOF_COLORS, compressionLevel: 9, effort: 10, dither: 0 })
    .toBuffer();
  return { file: sheet.file, png, count: assets.length, width, height };
}

export async function generateProofSheets({
  rootDir = packageRoot,
  outputDir = resolve(packageRoot, PROOF_DIR),
} = {}) {
  const manifest = JSON.parse(await readFile(resolve(rootDir, 'manifest.json'), 'utf8'));
  const results = [];
  for (const sheet of PROOF_SHEETS) {
    const { png, ...meta } = await renderProofSheet(rootDir, sheet, selectProofAssets(manifest, sheet));
    await atomicWrite(resolve(outputDir, sheet.file), png);
    results.push(meta);
  }
  return results;
}

export async function registerProofSheets(results, manifestPath = resolve(packageRoot, 'manifest.json')) {
  const entries = results.map(({ file, width, height }) => ({
    path: `${PROOF_DIR}/${file}`,
    kind: 'social-card',
    variant: file.replace(/^contact-sheet-|\.png$/gu, ''),
    format: 'png',
    width,
    height,
    pack: 'brand',
    domain: 'visual-universe',
    status: 'review',
    license: 'ISC',
    source: 'packages/assets/scripts/generate-contact-sheets.mjs',
  }));
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const owned = new Set(PROOF_SHEETS.map(({ file }) => `${PROOF_DIR}/${file}`));
  manifest.assets = replaceGeneratedAssets(manifest.assets, entries, owned);
  await atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
