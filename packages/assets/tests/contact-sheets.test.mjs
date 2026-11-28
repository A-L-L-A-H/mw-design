import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  buildContactSheetGroups,
  buildContactSheetHtml,
  generateContactSheets,
  generateProofSheets,
  proofLabel,
  selectProofAssets,
} from '../scripts/generate-contact-sheets.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('buildContactSheetGroups deterministically groups manifest assets with stable IDs and variants', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
  const first = buildContactSheetGroups(manifest);
  const second = buildContactSheetGroups(manifest);
  assert.deepEqual(first, second);
  assert.ok(first.length >= 5, 'groups cover multiple asset packs');
  const allItems = first.flatMap((group) => group.items);
  assert.ok(allItems.length > 100, 'covers canonical visual assets');
  for (const item of allItems) {
    assert.ok(typeof item.id === 'string' && item.id.length > 0, 'stable ID present');
    assert.ok(typeof item.variant === 'string' && item.variant.length > 0, 'variant present');
  }
});

test('buildContactSheetHtml embeds stable IDs and variants deterministically', () => {
  const group = {
    name: 'world-characters',
    slug: 'world-characters',
    count: 1,
    items: [
      {
        id: 'crew-01-sheet',
        path: 'source/world/characters/crew-01-sheet.svg',
        variant: 'neutral',
        format: 'svg',
        width: 512,
        height: 512,
      },
    ],
  };
  const html = buildContactSheetHtml(group, [
    { item: group.items[0], dataUrl: 'data:image/svg+xml;base64,AA==' },
  ]);
  assert.match(html, /data-asset-id="crew-01-sheet"/u);
  assert.match(html, /neutral · svg · 512x512/u);
});

test('generateContactSheets writes deterministic index without touching repo when outputDir is temp', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mw-contact-sheets-'));
  try {
    const { index, indexPath } = await generateContactSheets({
      rootDir: packageRoot,
      outputDir: dir,
      renderPng: false,
    });
    const persisted = JSON.parse(await readFile(indexPath, 'utf8'));
    assert.equal(persisted.schemaVersion, 1);
    assert.equal(persisted.totalGroups, index.totalGroups);
    assert.equal(persisted.totalVisualAssets, index.totalVisualAssets);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const PROOF_SHEETS = [
  { file: 'contact-sheet-rocksoul-cast.png', pack: 'rocksoul-universe', minAssets: 90 },
  { file: 'contact-sheet-pencil-grunge-stickers.png', pack: 'stickers-pack', minAssets: 32 },
  { file: 'contact-sheet-ai-agent-states.png', pack: 'telemetry-pack', minAssets: 16 },
];

test('proofLabel keeps short variants and shows the tail of long ones', () => {
  assert.equal(proofLabel('lesgo'), 'lesgo');
  const label = proofLabel('rocksoul-black-resolve-idle-frame-01');
  assert.ok(label.length <= 21);
  assert.ok(label.endsWith('idle-frame-01'));
});

test('proof sheets select only PNG assets of their packs, in a stable order', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
  for (const { file, pack, minAssets } of PROOF_SHEETS) {
    const selected = selectProofAssets(manifest, {
      select: (asset) =>
        pack === 'telemetry-pack'
          ? asset.pack === 'telemetry-pack' || asset.pack === 'ui-state-pack'
          : asset.pack === pack,
    });
    assert.ok(selected.length >= minAssets, `${file}: only ${selected.length} assets`);
    assert.ok(selected.every((asset) => asset.format === 'png'));
    const paths = selected.map((asset) => asset.path);
    assert.deepEqual(paths, [...paths].sort());
  }
});

test('committed proof sheets are registered PNGs with real content and within budget', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
  for (const { file } of PROOF_SHEETS) {
    const path = `brand/rendered/${file}`;
    const entry = manifest.assets.find((asset) => asset.path === path);
    assert.ok(entry, `${path} is missing from manifest.json`);
    const abs = resolve(packageRoot, path);
    const { size } = await stat(abs);
    assert.ok(size > 20 * 1024 && size <= 450 * 1024, `${path}: unexpected size ${size}`);
    const { data, info } = await sharp(abs).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, entry.width);
    assert.equal(info.height, entry.height);
    const colours = new Set();
    for (let i = 0; i < data.length; i += 3 * 97) colours.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    assert.ok(colours.size > 40, `${path}: sheet looks blank`);
  }
});

test('generateProofSheets writes three PNG sheets into a temp directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mw-proof-sheets-'));
  try {
    const results = await generateProofSheets({ rootDir: packageRoot, outputDir: dir });
    assert.deepEqual(results.map(({ file }) => file).sort(), PROOF_SHEETS.map(({ file }) => file).sort());
    for (const { file, width, height } of results) {
      const metadata = await sharp(join(dir, file)).metadata();
      assert.equal(metadata.format, 'png');
      assert.equal(metadata.width, width);
      assert.equal(metadata.height, height);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
