/**
 * Touch-up Finely Cred logo — replace orange circle with metallic gold only.
 * Preserves original letterforms, puzzle cutouts, and spacing from source PNG.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'public/brand/finely-cred-logo-source.png');
const OUT_DIR = path.join(ROOT, 'public/brand');
const RENDER_SCALE = 3;

const GOLD_STOPS = [
  [0, [214, 137, 16]],
  [0.15, [243, 156, 18]],
  [0.35, [253, 203, 110]],
  [0.5, [255, 234, 167]],
  [0.65, [253, 203, 110]],
  [0.85, [243, 156, 18]],
  [1, [214, 137, 16]],
];

function lerpGold(t) {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < GOLD_STOPS.length - 1; i++) {
    const [t0, c0] = GOLD_STOPS[i];
    const [t1, c1] = GOLD_STOPS[i + 1];
    if (x >= t0 && x <= t1) {
      const f = (x - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return GOLD_STOPS[GOLD_STOPS.length - 1][1];
}

function isOrange(r, g, b, a) {
  return a > 15 && r > 150 && g > 70 && g < 210 && b < 130;
}

function isWhite(r, g, b, a) {
  return a > 15 && r > 200 && g > 200 && b > 200;
}

function idx(width, channels, x, y) {
  return (y * width + x) * channels;
}

/** Light touch — snap only clearly-white letter pixels; never touch transparent cutouts. */
function snapWhiteLetters(out, width, height, channels, bounds) {
  const { minX, maxX, minY, maxY } = bounds;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const i = idx(width, channels, x, y);
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const a = out[i + 3];
      if (isWhite(r, g, b, a) && a > 200) {
        out[i] = 255;
        out[i + 1] = 255;
        out[i + 2] = 255;
        out[i + 3] = 255;
      }
    }
  }
}

function processBuffer(data, info, { lightText = false }) {
  const { width, height, channels } = info;
  const out = Buffer.from(data);

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(width, channels, x, y);
      if (out[i + 3] > 15) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const orangeMinX = minX;
  const orangeMaxX = Math.min(maxX, minX + Math.round((maxX - minX) * 0.55));
  const orangeMaxY = Math.min(maxY, minY + Math.round((maxY - minY) * 0.72));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const circleR = Math.max(orangeMaxX - orangeMinX, orangeMaxY - minY) * 0.52;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(width, channels, x, y);
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const a = out[i + 3];

      if (isOrange(r, g, b, a)) {
        const t =
          ((x - orangeMinX) / Math.max(1, orangeMaxX - orangeMinX)) * 0.55 +
          (1 - (y - minY) / Math.max(1, orangeMaxY - minY)) * 0.45;
        let [R, G, B] = lerpGold(t);
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        if (dist < circleR * 0.82 && angle > -2.6 && angle < -0.7) {
          const boost = 1 - dist / (circleR * 0.82);
          R = Math.min(255, R + Math.round(boost * 38));
          G = Math.min(255, G + Math.round(boost * 30));
          B = Math.min(255, B + Math.round(boost * 20));
        }
        out[i] = R;
        out[i + 1] = G;
        out[i + 2] = B;
        out[i + 3] = a < 255 ? Math.max(a, 240) : 255;
      } else if (isWhite(r, g, b, a) && lightText) {
        out[i] = 10;
        out[i + 1] = 16;
        out[i + 2] = 14;
        out[i + 3] = 255;
      }
    }
  }

  snapWhiteLetters(out, width, height, channels, { minX, maxX, minY, maxY });
  return { out, bounds: { minX, maxX, minY, maxY } };
}

async function loadSourceScaled() {
  const meta = await sharp(SRC).metadata();
  const targetW = Math.round((meta.width ?? 500) * RENDER_SCALE);
  return sharp(SRC)
    .ensureAlpha()
    .resize({ width: targetW, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function writeVariant(name, { lightText }) {
  const { data, info } = await loadSourceScaled();
  const { out, bounds } = processBuffer(data, info, { lightText });
  const pad = Math.round(12 * RENDER_SCALE);
  const left = Math.max(0, bounds.minX - pad);
  const top = Math.max(0, bounds.minY - pad);
  const width = Math.min(info.width - left, bounds.maxX - bounds.minX + pad * 2);
  const height = Math.min(info.height - top, bounds.maxY - bounds.minY + pad * 2);

  await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(OUT_DIR, name));

  console.log('wrote', name, { width, height, lightText });
}

await mkdir(OUT_DIR, { recursive: true });
await writeVariant('finely-cred-logo-dark.png', { lightText: false });
await writeVariant('finely-cred-logo-light.png', { lightText: true });
await writeVariant('finely-cred-logo-email-dark.png', { lightText: false });
await writeVariant('finely-cred-logo-email-light.png', { lightText: true });

const darkPath = path.join(OUT_DIR, 'finely-cred-logo-dark.png');
const darkMeta = await sharp(darkPath).metadata();
const sigH = 80;
await sharp(darkPath)
  .resize(Math.round(sigH * ((darkMeta.width ?? 420) / (darkMeta.height ?? 330))), sigH, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(path.join(OUT_DIR, 'finely-cred-logo-email-signature.png'));

await sharp(darkPath)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(OUT_DIR, 'finely-cred-mark.png'));

console.log('done');
