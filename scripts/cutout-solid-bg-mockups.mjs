/**
 * Cut lead-magnet mockups from solid white or magenta plates → true PNG alpha.
 * Usage:
 *   node scripts/cutout-solid-bg-mockups.mjs white <in.png> <out.png>
 *   node scripts/cutout-solid-bg-mockups.mjs magenta <in.png> <out.png>
 */
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, basename } from 'node:path';

const [mode, input, output] = process.argv.slice(2);
if (!mode || !input || !output || !['white', 'magenta'].includes(mode)) {
  console.error('Usage: node scripts/cutout-solid-bg-mockups.mjs white|magenta <in.png> <out.png>');
  process.exit(1);
}

function avg3(r, g, b) {
  return (r + g + b) / 3;
}
function sat3(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isPlate(r, g, b, a, modeName) {
  if (a < 8) return true;
  if (modeName === 'magenta') {
    // Hot magenta / pink / fuchsia plate (generators vary), including darker fringe
    // near shadows where the plate gets crushed toward deep pink/purple.
    const magentaDominant = r >= g + 40 && b >= g + 30 && g < 140;
    return (
      (r > 140 && b > 110 && g < 160 && r - g > 30 && b - g > 20) ||
      (r > 200 && g < 80 && b > 160) ||
      (magentaDominant && r > 120 && b > 100 && sat3(r, g, b) > 80)
    );
  }
  // Near-white / light-gray plate (low sat)
  const avg = avg3(r, g, b);
  return avg >= 232 && sat3(r, g, b) <= 14;
}

function isProtectedContent(r, g, b, modeName) {
  // Magenta plate pixels must never be treated as content (high-sat trap).
  if (modeName === 'magenta' && isPlate(r, g, b, 255, modeName)) return false;
  const avg = avg3(r, g, b);
  const sat = sat3(r, g, b);
  if (avg < 100) return true; // dark covers / spines
  if (sat >= 22) return true; // gold, navy, green accents
  // Cream paper
  if (avg >= 150 && r - b >= 6 && sat >= 6) return true;
  if (modeName === 'white') {
    // Warm paper / ivory
    if (avg >= 200 && r >= g && g >= b - 4 && sat >= 4 && sat <= 40) return true;
  }
  return false;
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const ch = info.channels;
const visited = new Uint8Array(w * h);
const stack = [];

const push = (x, y) => {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const id = y * w + x;
  if (visited[id]) return;
  const i = id * ch;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  // Plate check FIRST — magenta/pink plates are high-sat and must not be "protected"
  if (!isPlate(r, g, b, a, mode)) return;
  if (mode !== 'magenta' && isProtectedContent(r, g, b, mode)) return;
  visited[id] = 1;
  stack.push(id);
};

for (let x = 0; x < w; x++) {
  push(x, 0);
  push(x, h - 1);
}
for (let y = 0; y < h; y++) {
  push(0, y);
  push(w - 1, y);
}

while (stack.length) {
  const id = stack.pop();
  const x = id % w;
  const y = (id / w) | 0;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

let cleared = 0;
for (let id = 0; id < visited.length; id++) {
  if (!visited[id]) continue;
  const i = id * ch;
  data[i + 3] = 0;
  cleared++;
}

// Soften plate fringe: if mostly plate neighbors and not protected, fade
for (let y = 1; y < h - 1; y++) {
  for (let x = 1; x < w - 1; x++) {
    const id = y * w + x;
    if (visited[id]) continue;
    const i = id * ch;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isProtectedContent(r, g, b, mode)) continue;
    let n = 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      if (visited[(y + dy) * w + (x + dx)]) n++;
    }
    if (n >= 4 && isPlate(r, g, b, data[i + 3], mode)) {
      data[i + 3] = 0;
      cleared++;
    } else if (n >= 3 && isPlate(r, g, b, data[i + 3], mode)) {
      data[i + 3] = Math.min(data[i + 3], 90);
    }
  }
}

// Content bbox + pad
let minX = w;
let minY = h;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * ch + 3] > 16) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}
const pad = 20;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(w - 1, maxX + pad);
maxY = Math.min(h - 1, maxY + pad);
const cw = maxX - minX + 1;
const chh = maxY - minY + 1;

mkdirSync(dirname(output), { recursive: true });
const tmp = `${output}.tmp.png`;
await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .extract({ left: minX, top: minY, width: cw, height: chh })
  .png({ compressionLevel: 9 })
  .toFile(tmp);

// Atomic-ish replace (Windows-friendly)
if (existsSync(output)) {
  try {
    copyFileSync(output, `${output}.bak`);
  } catch {
    /* ignore */
  }
}
copyFileSync(tmp, output);

const check = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const cd = check.data;
const cw2 = check.info.width;
const ch2 = check.info.height;
const cch = check.info.channels;
const corner = (x, y) => {
  const i = (y * cw2 + x) * cch;
  return [cd[i], cd[i + 1], cd[i + 2], cd[i + 3]];
};
console.log(
  basename(output),
  `${cw2}x${ch2}`,
  'cleared',
  cleared,
  'corners',
  corner(0, 0),
  corner(cw2 - 1, 0),
  corner(0, ch2 - 1),
  corner(cw2 - 1, ch2 - 1),
);
