import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { validateSvg } from '../scripts/validate.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const animationRoot = join(packageRoot, 'animation');

async function loadCrewFrames() {
  const dirs = (await readdir(animationRoot)).filter((name) => name.startsWith('crew-01-'));
  const frames = [];
  for (const dir of dirs.sort()) {
    const files = (await readdir(join(animationRoot, dir))).filter((file) => file.endsWith('.svg'));
    for (const file of files.sort()) {
      const path = `animation/${dir}/${file}`;
      frames.push({ path, svg: await readFile(join(animationRoot, dir, file), 'utf8') });
    }
  }
  return frames;
}

test('crew-01 ships 4 clips x 4 SVG frames', async () => {
  const frames = await loadCrewFrames();
  assert.equal(frames.length, 16);
});

test('crew-01 frames pass SVG validation with a 1024 viewBox and no ID errors', async () => {
  for (const { path, svg } of await loadCrewFrames()) {
    const parsed = validateSvg(svg, path);
    assert.equal(parsed.viewBox, '0 0 1024 1024', `${path}: unexpected viewBox`);
  }
});

test('crew-01 frames have no opaque full-canvas backdrop rect', async () => {
  for (const { path, svg } of await loadCrewFrames()) {
    const fullCanvasRect = /<rect\b[^>]*\bwidth="1024"[^>]*\bheight="1024"/u.test(svg);
    assert.equal(fullCanvasRect, false, `${path}: full-canvas backdrop rect still present`);
    assert.doesNotMatch(svg, /fill="#f3efe4"\/>\s*<circle cx="512" cy="500" r="372"/u, path);
  }
});

test('crew-01 frames layer cel and graphite ground shadows', async () => {
  for (const { path, svg } of await loadCrewFrames()) {
    assert.match(svg, /data-layer="cel-shadow"/u, `${path}: missing cel shadow layer`);
    assert.match(svg, /data-layer="graphite-shadow"/u, `${path}: missing graphite shadow layer`);
  }
});

test('crew-01 frames render with transparent corners and an opaque figure', async () => {
  for (const { path, svg } of await loadCrewFrames()) {
    const { data, info } = await sharp(Buffer.from(svg, 'utf8'))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alphaAt = (x, y) => data[(y * info.width + x) * 4 + 3];
    for (const [x, y] of [
      [2, 2],
      [info.width - 3, 2],
      [2, info.height - 3],
      [info.width - 3, info.height - 3],
    ]) {
      assert.equal(alphaAt(x, y), 0, `${path}: pixel ${x},${y} is not transparent`);
    }
    assert.equal(alphaAt(512, 600), 255, `${path}: figure torso is not opaque`);
  }
});

test('crew-01 frames stay distinct within each clip', async () => {
  const byClip = new Map();
  for (const { path, svg } of await loadCrewFrames()) {
    const clip = path.split('/')[1];
    byClip.set(clip, [...(byClip.get(clip) ?? []), svg]);
  }
  for (const [clip, frames] of byClip) {
    assert.equal(new Set(frames).size, frames.length, `${clip}: duplicate frames`);
  }
});
