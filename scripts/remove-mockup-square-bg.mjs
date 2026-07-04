/**
 * Remove Canva "transparent" square backgrounds that are actually solid black/white
 * with full alpha. Only flood-fills from image edges — never erodes interior content.
 */
import sharp from 'sharp';
import { copyFileSync, existsSync } from 'node:fs';

const INPUT = process.argv[2];
const OUTPUT = process.argv[3] || INPUT;

if (!INPUT) {
  console.error('Usage: node scripts/remove-mockup-square-bg.mjs <input.png> [output.png]');
  process.exit(1);
}

const BACKUP = INPUT.replace(/\.png$/i, '-source.png');
if (!existsSync(BACKUP)) {
  copyFileSync(INPUT, BACKUP);
}

function idx(w, x, y) {
  return y * w + x;
}

function isCanvasBlack(r, g, b) {
  const avg = (r + g + b) / 3;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return avg <= 14 && sat <= 8;
}

function isCanvasWhite(r, g, b) {
  const avg = (r + g + b) / 3;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return avg >= 245 && sat <= 10;
}

function isCanvasBg(r, g, b) {
  return isCanvasBlack(r, g, b) || isCanvasWhite(r, g, b);
}

function floodFromEdges(width, height, channels, data, matchFn) {
  const remove = new Uint8Array(width * height);
  const q = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = idx(width, x, y);
    if (remove[p]) return;
    const i = p * channels;
    if (!matchFn(data[i], data[i + 1], data[i + 2])) return;
    remove[p] = 1;
    q.push(p);
  };

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % width;
    const y = (p / width) | 0;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  return remove;
}

const { data: srcData, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const outData = Buffer.from(srcData);

const remove = floodFromEdges(width, height, channels, srcData, isCanvasBg);
let removed = 0;
for (let p = 0; p < width * height; p++) {
  if (!remove[p]) continue;
  outData[p * channels + 3] = 0;
  removed++;
}

// Grow transparency into enclosed pure-black pockets around angled mockups.
let expanded = 0;
for (let pass = 0; pass < width + height; pass++) {
  let changed = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = idx(width, x, y);
      const i = p * channels;
      if (outData[i + 3] >= 10) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = idx(width, nx, ny) * channels;
        if (outData[ni + 3] < 10) continue;
        if (!isCanvasBlack(outData[ni], outData[ni + 1], outData[ni + 2])) continue;
        outData[ni + 3] = 0;
        changed++;
      }
    }
  }
  expanded += changed;
  if (!changed) break;
}
removed += expanded;

let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;
let opaque = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = idx(width, x, y) * channels;
    if (outData[i + 3] < 10) continue;
    opaque++;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
}

const pad = 2;
const left = Math.max(0, minX - pad);
const top = Math.max(0, minY - pad);
const right = Math.min(width - 1, maxX + pad);
const bottom = Math.min(height - 1, maxY + pad);
const outW = right - left + 1;
const outH = bottom - top + 1;

const cropped = Buffer.alloc(outW * outH * channels);
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    const srcOff = idx(width, x + left, y + top) * channels;
    const dstOff = idx(outW, x, y) * channels;
    cropped[dstOff] = outData[srcOff];
    cropped[dstOff + 1] = outData[srcOff + 1];
    cropped[dstOff + 2] = outData[srcOff + 2];
    cropped[dstOff + 3] = outData[srcOff + 3];
  }
}

const tempOut = OUTPUT + '.tmp.png';
await sharp(cropped, { raw: { width: outW, height: outH, channels } })
  .png({ compressionLevel: 9 })
  .toFile(tempOut);

const { renameSync } = await import('node:fs');
renameSync(tempOut, OUTPUT);

console.log(
  JSON.stringify(
    {
      input: { width, height },
      removedPixels: removed,
      opaquePixels: opaque,
      output: { width: outW, height: outH, left, top, right, bottom },
      backup: BACKUP,
    },
    null,
    2,
  ),
);
