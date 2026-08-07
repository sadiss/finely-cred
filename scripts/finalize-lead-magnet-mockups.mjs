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
const DEBT_BOOK_SRC = join(ROOT, 'debt-eradication-mockup.png'); // current checkerboard cutout
const DEBT_CHECKER_BACKUP = join(BACKUP_DIR, 'debt-eradication-mockup.png');
const DEBT_OUT = join(ROOT, 'debt-eradication-mockup.png');

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

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function debtPageSvg({ title, subtitle, rows, badge }) {
  const rowHtml = rows
    .map(
      (r, i) => `
      <g transform="translate(36, ${210 + i * 58})">
        <circle cx="14" cy="14" r="14" fill="#0b1f3a"/>
        <text x="14" y="19" text-anchor="middle" fill="#d7a73f" font-size="12" font-family="Georgia, serif">${i + 1}</text>
        <text x="42" y="12" fill="#0b1f3a" font-size="15" font-weight="700" font-family="Arial, sans-serif">${esc(r.h)}</text>
        <text x="42" y="30" fill="#3a4558" font-size="11" font-family="Arial, sans-serif">${esc(r.s)}</text>
      </g>`,
    )
    .join('');

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f1e8"/>
      <stop offset="100%" stop-color="#efe4d4"/>
    </linearGradient>
  </defs>
  <rect width="420" height="560" rx="6" fill="url(#paper)"/>
  <rect x="14" y="14" width="392" height="532" rx="4" fill="none" stroke="#d7a73f" stroke-opacity="0.45" stroke-width="1.5"/>
  <text x="28" y="42" fill="#0b1f3a" font-size="11" letter-spacing="2" font-family="Arial, sans-serif" font-weight="700">FINELY CRED</text>
  <text x="392" y="42" text-anchor="end" fill="#8a7350" font-size="10" font-family="Arial, sans-serif">${esc(badge)}</text>
  <text x="28" y="78" fill="#0b1f3a" font-size="13" letter-spacing="1.5" font-family="Arial, sans-serif" font-weight="700">DEBT RESPONSE BRIEF</text>
  <text x="28" y="118" fill="#0b1f3a" font-size="28" font-family="Georgia, serif" font-weight="700">${esc(title)}</text>
  <text x="28" y="148" fill="#5a4a32" font-size="13" font-family="Arial, sans-serif">${esc(subtitle)}</text>
  <line x1="28" y1="168" x2="392" y2="168" stroke="#d7a73f" stroke-opacity="0.55"/>
  ${rowHtml}
  <rect x="28" y="470" width="364" height="58" rx="8" fill="#0b1f3a"/>
  <text x="48" y="496" fill="#d7a73f" font-size="12" font-family="Arial, sans-serif" font-weight="700">PARTNER NEXT STEP</text>
  <text x="48" y="516" fill="#f7f1e8" font-size="12" font-family="Arial, sans-serif">Organize summons proof · respond with clarity</text>
</svg>`);
}

async function renderDebtPage(opts) {
  return sharp(debtPageSvg(opts)).png().toBuffer();
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

/** Strip light checkerboard fringe on exterior silhouette (safe for white covers). */
function deFringeLight(data, w, h, ch) {
  let removed = 0;
  for (let pass = 0; pass < 12; pass++) {
    const kill = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(w, x, y) * ch;
        if (data[i + 3] < 10) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const avg = (r + g + b) / 3;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        // Only near-white / checker leftovers — never navy/gold cover content
        if (!(sat <= 16 && avg >= 218)) continue;
        let touchesClear = false;
        for (let yy = -1; yy <= 1 && !touchesClear; yy++) {
          for (let xx = -1; xx <= 1; xx++) {
            const nx = x + xx;
            const ny = y + yy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
              touchesClear = true;
              break;
            }
            if (data[idx(w, nx, ny) * ch + 3] < 10) touchesClear = true;
          }
        }
        if (touchesClear) kill.push(i);
      }
    }
    if (!kill.length) break;
    for (const i of kill) {
      data[i + 3] = 0;
      removed++;
    }
  }
  return removed;
}

function singleBookDebtCandidates() {
  const out = [];
  if (existsSync(BACKUP_DIR)) {
    for (const n of readdirSync(BACKUP_DIR)) {
      if (n.startsWith('debt-live-') && n.endsWith('.png')) out.push(join(BACKUP_DIR, n));
    }
  }
  out.push(DEBT_BOOK_SRC);
  return out;
}

async function getDebtBookCutout() {
  // Prefer single-book transparent cutouts (~369x561), never prior fanned composites.
  for (const src of singleBookDebtCandidates()) {
    if (!existsSync(src)) continue;
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cornerA = data[3];
    if (cornerA !== 0) continue;
    // Single book cutouts are compact; composites are wider/taller after fanning
    if (info.width < 280 || info.width > 430 || info.height < 480 || info.height > 620) continue;
    deFringeLight(data, info.width, info.height, info.channels);
    const { cropped, outW, outH } = cropAlpha(data, info.width, info.height, info.channels, 4);
    return sharp(cropped, { raw: { width: outW, height: outH, channels: info.channels } })
      .resize({ width: Math.round(outW * 1.55), height: Math.round(outH * 1.55), kernel: 'lanczos3' })
      .png()
      .toBuffer();
  }
  // Fallback: black-plate flood on source
  const src = join(ROOT, 'debt-eradication-mockup-source.png');
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // flood black from edges
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const kill = new Uint8Array(w * h);
  const q = [];
  const isBlack = (r, g, b) => (r + g + b) / 3 <= 14 && Math.max(r, g, b) - Math.min(r, g, b) <= 8;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = idx(w, x, y);
    if (kill[p]) return;
    const i = p * ch;
    if (!isBlack(data[i], data[i + 1], data[i + 2])) return;
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
  for (let p = 0; p < w * h; p++) if (kill[p]) data[p * ch + 3] = 0;
  const { cropped, outW, outH } = cropAlpha(data, w, h, ch, 4);
  return sharp(cropped, { raw: { width: outW, height: outH, channels: ch } }).png().toBuffer();
}

async function finalizeDebt() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  if (existsSync(DEBT_OUT)) {
    copyFileSync(DEBT_OUT, join(BACKUP_DIR, `debt-live-${TS}.png`));
  }
  // Keep checker source intact
  if (!existsSync(DEBT_CHECKER_BACKUP)) {
    throw new Error('Missing debt checkerboard backup');
  }

  const bookBuf = await getDebtBookCutout();
  const bookMeta = await sharp(bookBuf).metadata();

  const pageA = await renderDebtPage({
    title: 'Summons Snapshot',
    subtitle: 'What is on the table right now',
    badge: 'SHEET 1 OF 2',
    rows: [
      { h: 'Debt summons filed', s: 'Court caption · plaintiff · response window' },
      { h: 'Collector pressure', s: 'Validation gaps · mini-Miranda cues' },
      { h: 'Account chain of title', s: 'Original creditor vs assignee proof' },
      { h: 'Payment / settlement risk', s: 'Protect options before you commit' },
    ],
  });
  const pageB = await renderDebtPage({
    title: 'Response Path',
    subtitle: 'Partner playbook for clarity and control',
    badge: 'SHEET 2 OF 2',
    rows: [
      { h: 'Organize evidence', s: 'Statements · letters · docket facts' },
      { h: 'Answer with structure', s: 'Timely · factual · documented' },
      { h: 'Challenge weak claims', s: 'Standing · amount · ownership' },
      { h: 'Rebuild after pressure', s: 'Credit and cash-flow reset plan' },
    ],
  });

  // Canvas sized like BC luxury mockups
  const canvasW = 780;
  const canvasH = 980;
  const bookTargetH = 620;
  const bookScale = bookTargetH / bookMeta.height;
  const bookW = Math.round(bookMeta.width * bookScale);
  const bookH = bookTargetH;
  const bookResized = await sharp(bookBuf).resize(bookW, bookH, { fit: 'fill' }).png().toBuffer();

  // Fan pages behind book (skewed / rotated lightly)
  const pageW = 340;
  const pageH = 455;
  const pageAResized = await sharp(pageA)
    .resize(pageW, pageH)
    .affine(
      [
        [0.93, -0.07],
        [0.035, 0.97],
      ],
      {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        interpolator: sharp.interpolators.bilinear,
      },
    )
    .png()
    .toBuffer();
  const pageBResized = await sharp(pageB)
    .resize(pageW, pageH)
    .affine(
      [
        [0.9, -0.11],
        [0.05, 0.95],
      ],
      {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        interpolator: sharp.interpolators.bilinear,
      },
    )
    .png()
    .toBuffer();

  const pageAMeta = await sharp(pageAResized).metadata();
  const pageBMeta = await sharp(pageBResized).metadata();

  const bookLeft = 95;
  const bookTop = 150;
  const page1Left = bookLeft + Math.round(bookW * 0.36);
  const page1Top = bookTop - 40;
  const page2Left = bookLeft + Math.round(bookW * 0.48);
  const page2Top = bookTop + 55;

  let composed = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: pageBResized, left: page2Left, top: page2Top },
      { input: pageAResized, left: page1Left, top: page1Top },
      { input: bookResized, left: bookLeft, top: bookTop },
    ])
    .png()
    .toBuffer();

  // Crop to content then add contact shadow (no edge scrub — white cover + cream pages).
  const { data, info } = await sharp(composed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { cropped, outW, outH } = cropAlpha(data, info.width, info.height, info.channels, 12);
  composed = await sharp(cropped, { raw: { width: outW, height: outH, channels: info.channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  composed = await withContactShadow(composed, { expandBottom: 44, expandX: 22 });

  await sharp(composed).toFile(DEBT_OUT);
  await qaMagenta(composed, join(ROOT, '_qa-debt-final-magenta.png'));

  return {
    bookSize: `${bookMeta.width}x${bookMeta.height}`,
    pageSizes: { a: `${pageAMeta.width}x${pageAMeta.height}`, b: `${pageBMeta.width}x${pageBMeta.height}` },
    after: await analyzeBuf(composed, 'debt-final'),
    out: DEBT_OUT,
  };
}

const bc = await finalizeBusiness();
const debt = await finalizeDebt();
console.log(JSON.stringify({ bc, debt }, null, 2));
