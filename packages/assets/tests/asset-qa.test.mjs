import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { RUNTIME_BUDGET_BYTES, runAssetQa } from '../scripts/asset-qa.mjs';
import { ROCKSOUL_MATERIAL_SLUGS, generateMaterials } from '../scripts/generate-materials.mjs';
import { validateSvg } from '../scripts/validate.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('checked-in @moonwitness/assets passes duplicate, budget, ownership, and orphan QA gates', async () => {
  const report = await runAssetQa(packageRoot);
  assert.equal(report.ok, true, `Expected zero QA errors, got: ${JSON.stringify(report.errors)}`);
  assert.ok(report.summary.runtimeAssetsChecked > 100);
  assert.ok(report.summary.sourceMastersTracked >= 4);
  assert.equal(report.summary.duplicateGroups, 0);
});

test('asset QA flags duplicates, oversized runtime assets, wrong folders, and orphans', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mw-asset-qa-'));
  try {
    await mkdir(join(dir, 'icons'), { recursive: true });
    await mkdir(join(dir, 'source', 'artwork'), { recursive: true });
    const tinySvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ' +
      'role="img" aria-label="a"><title>a</title></svg>';
    await writeFile(join(dir, 'icons/dup-a.svg'), tinySvg);
    await writeFile(join(dir, 'icons/dup-b.svg'), tinySvg);
    await writeFile(join(dir, 'icons/oversized.svg'), 'x'.repeat(20 * 1024));
    await writeFile(join(dir, 'icons/orphan.svg'), tinySvg);
    await writeFile(join(dir, 'source/artwork/big-master.png'), Buffer.alloc(600 * 1024, 1));

    const manifest = {
      schemaVersion: 1,
      assets: [
        { path: 'icons/dup-a.svg', kind: 'icon', format: 'svg' },
        { path: 'icons/dup-b.svg', kind: 'icon', format: 'svg' },
        { path: 'icons/oversized.svg', kind: 'icon', format: 'svg' },
        { path: 'source/artwork/big-master.png', kind: 'source', format: 'png' },
      ],
    };
    const report = await runAssetQa(dir, {
      manifest,
      trackedFiles: [
        'icons/dup-a.svg',
        'icons/dup-b.svg',
        'icons/oversized.svg',
        'icons/orphan.svg',
        'source/artwork/big-master.png',
      ],
    });
    assert.equal(report.ok, false);
    const codes = new Set(report.errors.map((error) => error.code));
    assert.ok(codes.has('duplicate_runtime_asset'));
    assert.ok(codes.has('oversized_runtime_asset'));
    assert.ok(codes.has('orphan_file'));
    assert.equal(report.sourceMasters.length, 1);
    assert.equal(report.sourceMasters[0].path, 'source/artwork/big-master.png');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('MoonWitness x ROCKSOUL material SVGs pass validateSvg, prefix IDs, and QA budgets', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
  const byPath = new Map(manifest.assets.map((asset) => [asset.path, asset]));

  for (const slug of ROCKSOUL_MATERIAL_SLUGS) {
    const svgRel = `materials/${slug}.svg`;
    const entry = byPath.get(svgRel);
    assert.ok(entry, `${svgRel} must be registered in manifest.json`);
    assert.equal(entry.format, 'svg');
    const source = await readFile(resolve(packageRoot, svgRel), 'utf8');
    const parsed = validateSvg(source, svgRel);
    assert.equal(parsed.viewBox, `0 0 ${entry.width} ${entry.height}`);
    assert.equal(parsed.width, String(entry.width));
    assert.equal(parsed.height, String(entry.height));
    assert.doesNotMatch(source, /\sstyle\s*=/iu, `${svgRel} must have zero inline style attributes`);
    for (const id of parsed.ids) {
      assert.ok(id.startsWith(`mw-materials-${slug}-`), `${svgRel} id ${id} must be prefixed`);
    }
    const info = await stat(resolve(packageRoot, svgRel));
    const budget = RUNTIME_BUDGET_BYTES[entry.kind];
    assert.ok(info.size > 0 && info.size <= budget, `${svgRel} (${info.size}B) exceeds ${budget}B`);
  }
});

test('MoonWitness x ROCKSOUL material PNG derivatives are transparent, valid, and within budget', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
  const byPath = new Map(manifest.assets.map((asset) => [asset.path, asset]));

  for (const slug of ROCKSOUL_MATERIAL_SLUGS) {
    const svgRel = `materials/${slug}.svg`;
    const pngRel = `materials/${slug}.png`;
    const entry = byPath.get(pngRel);
    assert.ok(entry, `${pngRel} must be registered in manifest.json`);
    assert.equal(entry.format, 'png');
    assert.equal(entry.sourceAsset, svgRel);

    const pngFullPath = resolve(packageRoot, pngRel);
    const info = await stat(pngFullPath);
    const budget = RUNTIME_BUDGET_BYTES[entry.kind];
    assert.ok(info.size > 0 && info.size <= budget, `${pngRel} (${info.size}B) exceeds ${budget}B`);

    const { data, info: imgInfo } = await sharp(pngFullPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(imgInfo.width, entry.width, `${pngRel} width`);
    assert.equal(imgInfo.height, entry.height, `${pngRel} height`);

    let transparentPixels = 0;
    let drawnPixels = 0;
    for (let offset = 3; offset < data.length; offset += 4) {
      if (data[offset] === 0) transparentPixels += 1;
      else drawnPixels += 1;
    }
    assert.ok(transparentPixels > 0, `${pngRel} must have transparent alpha pixels`);
    assert.ok(drawnPixels > 0, `${pngRel} must have rendered foreground pixels`);
  }
});

test('generateMaterials emits all 57 materials while preserving riot-universe manifest entries', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));
  const riotBefore = manifest.assets.filter((asset) => asset.pack === 'riot-universe').length;
  assert.ok(riotBefore > 100, 'riot-universe assets must already exist in manifest.json');
  const emitted = await generateMaterials({ checkOnly: true });
  assert.equal(emitted.length, 57);
  const paths = new Set(emitted.map((item) => item.path));
  assert.equal(paths.size, 57);
  for (const slug of ROCKSOUL_MATERIAL_SLUGS) {
    assert.ok(paths.has(`materials/${slug}.svg`));
    assert.ok(paths.has(`materials/${slug}.png`));
  }
});
