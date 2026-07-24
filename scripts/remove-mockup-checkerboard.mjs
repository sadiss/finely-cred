/**
 * High-care checkerboard plate removal for book mockups (white-cover safe).
 *
 * Do NOT flood-delete light neutrals from the edges into the cover.
 * Instead:
 *  1) Mark edge-connected checkerboard plate (strict tile alternation)
 *  2) Seed from definite book pixels (dark / gold / saturated)
 *  3) Morphologically reconstruct the book into every non-plate pixel
 *  4) Soft contact shadows only outside the reconstructed book
 */
import sharp from 'sharp';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets';
const BACKUP_DIR = join(ROOT, 'backup-before-bg-remove');

const TARGETS = [
  {
    id: 'debt',
    src: join(ROOT, 'debt-eradication-mockup.png'),
    out: join(ROOT, 'debt-eradication-mockup.png'),
    qa: join(ROOT, '_qa-debt-cleaned-on-magenta.png'),
  },
  {
    id: 'business',
    src: join(ROOT, 'business-credit-power-guide-mockup.png'),
    out: join(ROOT, 'business-credit-power-guide-mockup.png'),
    qa: join(ROOT, '_qa-business-cleaned-on-magenta.png'),
  },
];

function idx(w, x, y) {
  return y * w + x;
}

function avg3(r, g, b) {
  return (r + g + b) / 3;
}

function sat3(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isGoldOrWarmAccent(r, g, b) {
  const sat = sat3(r, g, b);
  if (sat < 14) return false;
  if (r > g + 5 && r > b + 8 && r >= 80) return true;
  if (r > 120 && g > 80 && b < 140 && r >= g) return true;
  return false;
}

function isGreenAccent(r, g, b) {
  return sat3(r, g, b) >= 16 && g > r + 6 && g > b + 3 && g >= 65;
}

function isDefiniteBook(r, g, b) {
  const avg = avg3(r, g, b);
  const sat = sat3(r, g, b);
  if (avg < 90) return true;
  if (isGoldOrWarmAccent(r, g, b) || isGreenAccent(r, g, b)) return true;
  if (sat >= 18) return true;
  // Warm/cream paper pages (business mockup)
  if (avg >= 160 && r - b >= 8 && sat >= 8) return true;
  return false;
}

function isProtectedContent(r, g, b) {
  return isDefiniteBook(r, g, b);
}

function detectPeriod(data, width, height, channels) {
  const scores = [];
  for (const periodCand of [8, 10, 12, 14, 16, 18, 20, 24]) {
    let alt = 0;
    let total = 0;
    for (let y = 2; y < 100; y += 2) {
      for (let x = 2; x < 100; x += 2) {
        const i = idx(width, x, y) * channels;
        if (sat3(data[i], data[i + 1], data[i + 2]) > 10) continue;
        const a1 = avg3(data[i], data[i + 1], data[i + 2]);
        if (a1 < 220) continue;
        const hx = x + (periodCand >> 1);
        if (hx >= width) continue;
        const j = idx(width, hx, y) * channels;
        if (sat3(data[j], data[j + 1], data[j + 2]) > 10) continue;
        const a2 = avg3(data[j], data[j + 1], data[j + 2]);
        if (a2 < 220) continue;
        total++;
        const d = Math.abs(a1 - a2);
        if (d >= 4 && d <= 16) alt++;
      }
    }
    scores.push({ period: periodCand, altRate: total ? alt / total : 0 });
  }
  scores.sort((a, b) => b.altRate - a.altRate);
  return scores[0]?.period || 16;
}

function sampleTileAvgs(data, width, height, channels) {
  const buckets = new Map();
  for (let y = 0; y < 72; y++) {
    for (let x = 0; x < 72; x++) {
      const i = idx(width, x, y) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (sat3(r, g, b) > 10) continue;
      const a = Math.round(avg3(r, g, b));
      if (a < 220) continue;
      buckets.set(a, (buckets.get(a) || 0) + 1);
    }
  }
  const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const light = ranked[0]?.[0] ?? 254;
  let dark = light;
  for (const [avg] of ranked) {
    if (Math.abs(avg - light) >= 4) {
      dark = avg;
      break;
    }
  }
  return { light: Math.max(light, dark), dark: Math.min(light, dark) };
}

function isLightNeutral(r, g, b) {
  return sat3(r, g, b) <= 12 && avg3(r, g, b) >= 220;
}

/** Strict: both samples light-neutral and delta matches tile contrast (not cover ink). */
function isStrictCheckerPixel(data, width, height, channels, x, y, period, tiles) {
  const i = idx(width, x, y) * channels;
  const r0 = data[i];
  const g0 = data[i + 1];
  const b0 = data[i + 2];
  if (!isLightNeutral(r0, g0, b0)) return false;
  if (isProtectedContent(r0, g0, b0)) return false;

  const a0 = avg3(r0, g0, b0);
  const nearTile =
    Math.abs(a0 - tiles.light) <= 8 || Math.abs(a0 - tiles.dark) <= 8 || a0 >= 238;
  if (!nearTile) return false;

  const periods = new Set([period, 8, 12, 16]);
  let bestHits = 0;
  for (const p of periods) {
    const half = Math.max(2, p >> 1);
    let hits = 0;
    for (const [ox, oy] of [
      [half, 0],
      [-half, 0],
      [0, half],
      [0, -half],
    ]) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = idx(width, nx, ny) * channels;
      const r = data[j];
      const g = data[j + 1];
      const b = data[j + 2];
      if (!isLightNeutral(r, g, b)) continue;
      const a1 = avg3(r, g, b);
      const d = Math.abs(a0 - a1);
      if (d >= 5 && d <= 14) hits++;
    }
    bestHits = Math.max(bestHits, hits);
  }
  return bestHits >= 2;
}

function floodCheckerFromEdges(width, height, channels, data, period, tiles) {
  const kill = new Uint8Array(width * height);
  const q = [];
  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = idx(width, x, y);
    if (kill[p]) return;
    const i = p * channels;
    if (data[i + 3] < 8) {
      kill[p] = 1;
      q.push(p);
      return;
    }
    if (!isStrictCheckerPixel(data, width, height, channels, x, y, period, tiles)) return;
    kill[p] = 1;
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
  return kill;
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
  const q = [];
  for (let p = 0; p < width * height; p++) if (marker[p]) q.push(p);

  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % width;
    const y = (p / width) | 0;
    for (const [ox, oy] of offsets) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = idx(width, nx, ny);
      if (marker[np] || !mask[np]) continue;
      marker[np] = 1;
      q.push(np);
    }
  }
  return marker;
}

function alphaBounds(data, w, h, ch) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[idx(w, x, y) * ch + 3] <= 4) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw new Error('No opaque pixels after cutout');
  return { minX, minY, maxX, maxY };
}

async function processOne(target) {
  if (!existsSync(target.src)) throw new Error(`Missing ${target.src}`);
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = join(BACKUP_DIR, `${target.id}-${Date.now()}-src.png`);
  const stableBackup = join(
    BACKUP_DIR,
    target.id === 'debt' ? 'debt-eradication-mockup.png' : 'business-credit-power-guide-mockup.png',
  );
  if (!existsSync(stableBackup)) copyFileSync(target.src, stableBackup);
  copyFileSync(existsSync(stableBackup) ? stableBackup : target.src, backupPath);

  const processSrc = stableBackup;
  const { data: srcData, info } = await sharp(processSrc).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const period = detectPeriod(srcData, width, height, channels);
  const tiles = sampleTileAvgs(srcData, width, height, channels);

  const plate = floodCheckerFromEdges(width, height, channels, srcData, period, tiles);

  // Grow plate once more into adjacent light neutrals that still look like tiles,
  // but never into definite book pixels.
  for (let pass = 0; pass < 6; pass++) {
    const add = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = idx(width, x, y);
        if (plate[p]) continue;
        const i = p * channels;
        const r = srcData[i];
        const g = srcData[i + 1];
        const b = srcData[i + 2];
        if (isDefiniteBook(r, g, b)) continue;
        if (!isStrictCheckerPixel(srcData, width, height, channels, x, y, period, tiles)) continue;
        let touch = false;
        for (let yy = -1; yy <= 1 && !touch; yy++) {
          for (let xx = -1; xx <= 1; xx++) {
            const nx = x + xx;
            const ny = y + yy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            if (plate[idx(width, nx, ny)]) touch = true;
          }
        }
        if (touch) add.push(p);
      }
    }
    if (!add.length) break;
    for (const p of add) plate[p] = 1;
  }

  const growMask = new Uint8Array(width * height);
  const seeds = new Uint8Array(width * height);
  let seedCount = 0;
  for (let p = 0; p < width * height; p++) {
    if (plate[p]) continue;
    growMask[p] = 1;
    const i = p * channels;
    if (isDefiniteBook(srcData[i], srcData[i + 1], srcData[i + 2])) {
      seeds[p] = 1;
      seedCount++;
    }
  }
  if (seedCount < 500) throw new Error(`Too few book seeds (${seedCount}) for ${target.id}`);

  const book = morphologicalReconstruction(width, height, growMask, seeds);

  // Fill solid cover interiors row-wise between the book’s left/right extents.
  // This restores white cover margins that seed-growth can miss, without
  // reintroducing exterior checkerboard (skipped via plate[]).
  let filled = 0;
  for (let y = 0; y < height; y++) {
    let minX = -1;
    let maxX = -1;
    for (let x = 0; x < width; x++) {
      if (!book[idx(width, x, y)]) continue;
      if (minX < 0) minX = x;
      maxX = x;
    }
    if (minX < 0) continue;
    // small pad for anti-aliased edges, still blocked by plate
    const left = Math.max(0, minX - 1);
    const right = Math.min(width - 1, maxX + 1);
    for (let x = left; x <= right; x++) {
      const p = idx(width, x, y);
      if (book[p] || plate[p]) continue;
      const i = p * channels;
      const r = srcData[i];
      const g = srcData[i + 1];
      const b = srcData[i + 2];
      if (isDefiniteBook(r, g, b) || isLightNeutral(r, g, b) || avg3(r, g, b) < 210) {
        // keep midtones/shadows on cover too
        if (isStrictCheckerPixel(srcData, width, height, channels, x, y, period, tiles)) continue;
        book[p] = 1;
        filled++;
      }
    }
  }

  // Strip only checker-like fringe on the exterior boundary.
  let fringeRemoved = 0;
  for (let pass = 0; pass < 8; pass++) {
    const kill = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = idx(width, x, y);
        if (!book[p]) continue;
        if (!isStrictCheckerPixel(srcData, width, height, channels, x, y, period, tiles)) continue;
        let touchesClear = false;
        for (let yy = -1; yy <= 1 && !touchesClear; yy++) {
          for (let xx = -1; xx <= 1; xx++) {
            const nx = x + xx;
            const ny = y + yy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              touchesClear = true;
              break;
            }
            if (!book[idx(width, nx, ny)]) {
              touchesClear = true;
              break;
            }
          }
        }
        if (touchesClear) kill.push(p);
      }
    }
    if (!kill.length) break;
    for (const p of kill) book[p] = 0;
    fringeRemoved += kill.length;
  }

  const outData = Buffer.alloc(width * height * channels);
  let opaque = 0;
  let softShadow = 0;
  let cleared = 0;

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const r = srcData[i];
    const g = srcData[i + 1];
    const b = srcData[i + 2];

    if (book[p]) {
      outData[i] = r;
      outData[i + 1] = g;
      outData[i + 2] = b;
      outData[i + 3] = 255;
      opaque++;
      continue;
    }

    // Soft contact shadow: dark-neutral, touching book
    const avg = avg3(r, g, b);
    const sat = sat3(r, g, b);
    if (sat <= 14 && avg >= 35 && avg <= 170) {
      let touchesBook = false;
      const x = p % width;
      const y = (p / width) | 0;
      for (let yy = -2; yy <= 2 && !touchesBook; yy++) {
        for (let xx = -2; xx <= 2; xx++) {
          const nx = x + xx;
          const ny = y + yy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (book[idx(width, nx, ny)]) touchesBook = true;
        }
      }
      if (touchesBook) {
        const alpha = Math.max(0, Math.min(140, Math.round((175 - avg) * 1.05)));
        outData[i] = Math.min(r, 26);
        outData[i + 1] = Math.min(g, 26);
        outData[i + 2] = Math.min(b, 26);
        outData[i + 3] = alpha;
        softShadow++;
        continue;
      }
    }

    outData[i + 3] = 0;
    cleared++;
  }

  const bounds = alphaBounds(outData, width, height, channels);
  const pad = 4;
  const left = Math.max(0, bounds.minX - pad);
  const top = Math.max(0, bounds.minY - pad);
  const right = Math.min(width - 1, bounds.maxX + pad);
  const bottom = Math.min(height - 1, bounds.maxY + pad);
  const outW = right - left + 1;
  const outH = bottom - top + 1;

  const cropped = Buffer.alloc(outW * outH * channels);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const s = idx(width, x + left, y + top) * channels;
      const d = idx(outW, x, y) * channels;
      cropped[d] = outData[s];
      cropped[d + 1] = outData[s + 1];
      cropped[d + 2] = outData[s + 2];
      cropped[d + 3] = outData[s + 3];
    }
  }

  await sharp(cropped, { raw: { width: outW, height: outH, channels } })
    .png({ compressionLevel: 9 })
    .toFile(target.out);

  await sharp({
    create: { width: outW, height: outH, channels: 3, background: { r: 255, g: 0, b: 128 } },
  })
    .composite([{ input: target.out }])
    .png()
    .toFile(target.qa);

  return {
    id: target.id,
    method: 'seed-reconstruction + strict checker plate',
    period,
    tiles,
    seedCount,
    source: { width, height },
    output: { width: outW, height: outH, left, top },
    cleared,
    softShadow,
    fringeRemoved,
    filled,
    opaque,
    backupPath,
    stableBackup,
    out: target.out,
    qa: target.qa,
  };
}

const only = process.argv[2];
const list = only ? TARGETS.filter((t) => t.id === only) : TARGETS;
if (!list.length) {
  console.error('Unknown target. Use: debt | business');
  process.exit(1);
}

const results = [];
for (const t of list) results.push(await processOne(t));
console.log(JSON.stringify(results, null, 2));
