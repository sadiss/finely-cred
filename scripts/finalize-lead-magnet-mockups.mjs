/**
 * Finalize Business Credit + Debt Eradication lead-magnet mockups:
 *  - true PNG alpha (no black/checkerboard plate)
 *  - BC: restore preferred standing-book + fanned sheets composition
 *  - Debt: restyle toward BC composition (angled book + fanned sheets)
 */
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets';
const BACKUP_DIR = join(ROOT, 'backup-before-bg-remove');
const TS = Date.now();

const BC_BEST_SRC =
  'e:/Finely-Cred/Tishobe/finely-cred-main/.mockup-backup-20260705-103256/business-credit-power-guide-original-transparent.png';
const BC_OUT = join(ROOT, 'business-credit-power-guide-mockup.png');
const BC_TRANSPARENT_ALIAS = join(ROOT, 'business-credit-power-guide-mockup-transparent.png');

function idx(w, x, y) {
  return y * w + x;
}

function alphaBounds(data, w, h, ch, thr = 8) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[idx(w, x, y) * ch + 3] <= thr) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw new Error('No opaque pixels');
  return { minX, minY, maxX, maxY };
}

function cropAlpha(data, w, h, ch, pad = 8) {
  const b = alphaBounds(data, w, h, ch);
  const left = Math.max(0, b.minX - pad);
  const top = Math.max(0, b.minY - pad);
  const right = Math.min(w - 1, b.maxX + pad);
  const bottom = Math.min(h - 1, b.maxY + pad);
  const outW = right - left + 1;
  const outH = bottom - top + 1;
  const cropped = Buffer.alloc(outW * outH * ch);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const s = idx(w, x + left, y + top) * ch;
      const d = idx(outW, x, y) * ch;
      cropped[d] = data[s];
      cropped[d + 1] = data[s + 1];
      cropped[d + 2] = data[s + 2];
      cropped[d + 3] = data[s + 3];
    }
  }
  return { cropped, outW, outH, left, top };
}

/** Soft elliptical contact shadow under the product (true alpha). */
async function withContactShadow(pngBuf, { expandBottom = 36, expandX = 18 } = {}) {
  const meta = await sharp(pngBuf).metadata();
  const w = meta.width;
  const h = meta.height;
  const outW = w + expandX * 2;
  const outH = h + expandBottom;
  const cx = outW / 2;
  const cy = h - 8;
  const rx = w * 0.42;
  const ry = Math.max(18, expandBottom * 0.72);

  const shadow = Buffer.alloc(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1.15) continue;
      const a = Math.round(Math.max(0, 95 * (1 - d) ** 1.55));
      if (a < 2) continue;
      const i = idx(outW, x, y) * 4;
      shadow[i] = 8;
      shadow[i + 1] = 8;
      shadow[i + 2] = 10;
      shadow[i + 3] = a;
    }
  }

  const shadowPng = await sharp(shadow, { raw: { width: outW, height: outH, channels: 4 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: outW, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: shadowPng, left: 0, top: 0 },
      { input: pngBuf, left: expandX, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function qaMagenta(srcPathOrBuf, outPath) {
  const input = Buffer.isBuffer(srcPathOrBuf) ? srcPathOrBuf : await sharp(srcPathOrBuf).png().toBuffer();
  const meta = await sharp(input).metadata();
  await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: 255, g: 0, b: 200 },
    },
  })
    .composite([{ input }])
    .png()
    .toFile(outPath);
}

function cornerReport(data, w, h, ch) {
  const pts = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 2],
    [2, Math.floor(h / 2)],
  ];
  return pts.map(([x, y]) => {
    const i = idx(w, x, y) * ch;
    return { x, y, r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  });
}

async function analyzeBuf(buf, label) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  let zero = 0;
  let soft = 0;
  let edgeOp = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[idx(w, x, y) * ch + 3];
      if (a === 0) zero++;
      else if (a < 200) soft++;
      if ((x < 3 || y < 3 || x >= w - 3 || y >= h - 3) && a > 200) edgeOp++;
    }
  }
  return {
    label,
    size: `${w}x${h}`,
    pctZero: +((100 * zero) / (w * h)).toFixed(2),
    softAlpha: soft,
    edgeOpaque: edgeOp,
    corners: cornerReport(data, w, h, ch),
  };
}

/** Clear leftover plate pixels near edges (light checker / pure black) without eating cover. */
function scrubEdgePlate(data, w, h, ch) {
  const kill = new Uint8Array(w * h);
  const q = [];
  const isPlate = (r, g, b, a) => {
    if (a < 8) return true;
    const avg = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    // checkerboard / light plate
    if (sat <= 10 && avg >= 235) return true;
    // solid black plate (not mid-gray shadow)
    if (sat <= 8 && avg <= 12) return true;
    return false;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = idx(w, x, y);
    if (kill[p]) return;
    const i = p * ch;
    if (!isPlate(data[i], data[i + 1], data[i + 2], data[i + 3])) return;
    kill[p] = 1;
    q.push(p);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % w;
    const y = (p / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  let removed = 0;
  for (let p = 0; p < w * h; p++) {
    if (!kill[p]) continue;
    data[p * ch + 3] = 0;
    removed++;
  }
  return removed;
}

async function finalizeBusiness() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  if (existsSync(BC_OUT)) {
    copyFileSync(BC_OUT, join(BACKUP_DIR, `business-live-${TS}.png`));
  }

  const { data, info } = await sharp(BC_BEST_SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const removed = scrubEdgePlate(data, w, h, ch);
  const { cropped, outW, outH } = cropAlpha(data, w, h, ch, 10);
  let png = await sharp(cropped, { raw: { width: outW, height: outH, channels: ch } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  png = await withContactShadow(png, { expandBottom: 40, expandX: 20 });

  await sharp(png).toFile(BC_OUT);
  await sharp(png).toFile(BC_TRANSPARENT_ALIAS);
  await qaMagenta(png, join(ROOT, '_qa-business-final-magenta.png'));

  return {
    removedEdgePlate: removed,
    before: await analyzeBuf(await sharp(BC_BEST_SRC).png().toBuffer(), 'bc-source'),
    after: await analyzeBuf(png, 'bc-final'),
    out: BC_OUT,
  };
}

const bc = await finalizeBusiness();
console.log(JSON.stringify({ bc }, null, 2));
