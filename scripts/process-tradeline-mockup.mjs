/**
 * Tradeline Advantage e-guide cutout — same v2 pipeline as debt guide.
 */
import sharp from 'sharp';

const SRC =
  'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets/tradeline-advantage-guide-source.png';
const OUT =
  'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets/tradeline-advantage-guide-cutout.png';

function idx(width, x, y) {
  return y * width + x;
}

function isPureBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const avg = (r + g + b) / 3;
  return sat <= 6 && avg >= 246 && avg <= 254;
}

function isDefiniteBook(r, g, b) {
  const avg = (r + g + b) / 3;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (avg < 70) return true;
  if (sat >= 18 && r > g && r > b) return true;
  if (sat >= 12 && avg < 245) return true;
  if (r > 90 && g > 70 && b < 90) return true;
  return false;
}

function isDarkContent(r, g, b) {
  return (r + g + b) / 3 < 58;
}

function isGoldContent(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min >= 20 && r > g && r > b;
}

function isWarmPaper(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const warmth = r - b;
  if (warmth >= 12) return true;
  if (sat >= 14 && warmth >= 8) return true;
  return false;
}

function isProtected(r, g, b) {
  return isDarkContent(r, g, b) || isWarmPaper(r, g, b) || isGoldContent(r, g, b);
}

function isCheckerboard(r, g, b, a) {
  if (a < 8) return true;
  if (isProtected(r, g, b)) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const avg = (r + g + b) / 3;
  if (sat <= 7 && avg >= 158) return true;
  if (sat <= 11 && avg >= 205) return true;
  return false;
}

function isDetachedNeutral(r, g, b) {
  if (isProtected(r, g, b)) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const avg = (r + g + b) / 3;
  if (sat <= 6 && avg >= 145) return true;
  if (sat <= 12 && avg >= 70 && avg <= 210) return true;
  return false;
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function morphologicalReconstruction(width, height, mask, seeds) {
  const marker = Uint8Array.from(seeds);
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = idx(width, x, y);
        if (marker[p] || !mask[p]) continue;
        for (const [ox, oy] of offsets) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (marker[idx(width, nx, ny)]) {
            marker[p] = 1;
            changed = true;
            break;
          }
        }
      }
    }
  }
  return marker;
}

function floodFromEdges(width, height, channels, data, seedFn) {
  const seen = new Uint8Array(width * height);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = idx(width, x, y);
    if (seen[p]) return;
    const i = p * channels;
    if (data[i + 3] < 10) return;
    if (!seedFn(data[i], data[i + 1], data[i + 2])) return;
    seen[p] = 1;
    q.push(p);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % width;
    const y = (p / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return seen;
}

function nearProtected(width, height, channels, data, x, y, radius = 2) {
  for (let yy = -radius; yy <= radius; yy++) {
    for (let xx = -radius; xx <= radius; xx++) {
      const nx = x + xx;
      const ny = y + yy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const i = idx(width, nx, ny) * channels;
      if (data[i + 3] === 0) continue;
      if (isProtected(data[i], data[i + 1], data[i + 2])) return true;
    }
  }
  return false;
}

function buildSilhouettePolygon(width, height, channels, data, yMin, yMax) {
  const leftPts = [];
  const rightPts = [];
  for (let y = yMin; y <= yMax; y++) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < width; x++) {
      const i = idx(width, x, y) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!isPureBackground(r, g, b)) {
        if (left < 0) left = x;
        right = x;
      }
    }
    if (left >= 0) {
      leftPts.push([Math.max(0, left - 4), y]);
      rightPts.push([Math.min(width - 1, right + 4), y]);
    }
  }
  return [...leftPts, ...rightPts.reverse()];
}

const { data: srcData, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const width = info.width;
const height = info.height;
const channels = info.channels;

let yMin = height;
let yMax = -1;
for (let y = 0; y < height; y++) {
  for (let x = 80; x < width - 80; x++) {
    const i = idx(width, x, y) * channels;
    const r = srcData[i];
    const g = srcData[i + 1];
    const b = srcData[i + 2];
    if (!isDefiniteBook(r, g, b)) continue;
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
}

const polygon = buildSilhouettePolygon(width, height, channels, srcData, yMin, yMax);
const silhouetteMask = new Uint8Array(width * height);
const seedMask = new Uint8Array(width * height);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = idx(width, x, y);
    if (!pointInPolygon(x, y, polygon)) continue;
    silhouetteMask[p] = 1;
    const i = p * channels;
    if (isDefiniteBook(srcData[i], srcData[i + 1], srcData[i + 2])) seedMask[p] = 1;
  }
}

const bookMask = morphologicalReconstruction(width, height, silhouetteMask, seedMask);
const outData = Buffer.alloc(width * height * channels);

for (let p = 0; p < width * height; p++) {
  const i = p * channels;
  if (!bookMask[p]) {
    outData[i + 3] = 0;
    continue;
  }
  outData[i] = srcData[i];
  outData[i + 1] = srcData[i + 1];
  outData[i + 2] = srcData[i + 2];
  outData[i + 3] = 255;
}

const exteriorChecker = floodFromEdges(width, height, channels, outData, isCheckerboard);
for (let p = 0; p < width * height; p++) {
  if (exteriorChecker[p]) outData[p * channels + 3] = 0;
}

let detachedTotal = 0;
for (let pass = 0; pass < 8; pass++) {
  const q = [];
  const kill = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = idx(width, x, y);
      const i = p * channels;
      if (outData[i + 3] !== 0) continue;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const nx = x + xx;
          const ny = y + yy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = idx(width, nx, ny);
          if (kill[np] || outData[np * channels + 3] === 0) continue;
          const ni = np * channels;
          const r = outData[ni];
          const g = outData[ni + 1];
          const b = outData[ni + 2];
          if (!isDetachedNeutral(r, g, b)) continue;
          if (nearProtected(width, height, channels, outData, nx, ny, 2)) continue;
          kill[np] = 1;
          q.push(np);
        }
      }
    }
  }
  if (!q.length) break;
  for (const p of q) outData[p * channels + 3] = 0;
  detachedTotal += q.length;
}

let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (outData[idx(width, x, y) * channels + 3] <= 4) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
}

const pad = 4;
const left = Math.max(0, minX - pad);
const top = Math.max(0, minY - pad);
const right = Math.min(width - 1, maxX + pad);
const bottom = Math.min(height - 1, maxY + pad);
const outWidth = right - left + 1;
const outHeight = bottom - top + 1;

const cropped = Buffer.alloc(outWidth * outHeight * channels);
for (let y = 0; y < outHeight; y++) {
  for (let x = 0; x < outWidth; x++) {
    const srcOffset = idx(width, x + left, y + top) * channels;
    const dstOffset = idx(outWidth, x, y) * channels;
    cropped[dstOffset] = outData[srcOffset];
    cropped[dstOffset + 1] = outData[srcOffset + 1];
    cropped[dstOffset + 2] = outData[srcOffset + 2];
    cropped[dstOffset + 3] = outData[srcOffset + 3];
  }
}

await sharp(cropped, { raw: { width: outWidth, height: outHeight, channels } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(
  JSON.stringify(
    {
      source: { width, height },
      silhouette: { yMin, yMax, polygonPoints: polygon.length },
      output: { width: outWidth, height: outHeight, left, top, right, bottom },
      detachedRemoved: detachedTotal,
    },
    null,
    2,
  ),
);
