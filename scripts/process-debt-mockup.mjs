/**
 * Debt e-guide cutout — apply the preserved transparent mask onto full-res source.
 *
 * The v2 seed-reconstruction cutout ate ~189k interior pixels (gray cover matched
 * checkerboard), which made the book look faded/disintegrating. The earlier
 * debt-eradication-guide-transparent.png kept the book intact; we reuse that
 * alpha at a calibrated offset and skip aggressive fringe passes.
 */
import sharp from 'sharp';

const SOURCE_MOCKUP =
  'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets/debt-eradication-guide-source.png';
const MASK_BASE =
  'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets/debt-eradication-guide-transparent.png';
const OUT =
  'e:/Finely-Cred/Tishobe/finely-cred-main/public/images/lead-magnets/debt-eradication-guide-cutout.png';

const MASK_OFFSET_X = 152;
const MASK_OFFSET_Y = 0;
const MASK_ALPHA_THRESHOLD = 24;

function idx(w, x, y) {
  return y * w + x;
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
  if (maxX < 0) throw new Error('No opaque pixels found.');
  return { minX, minY, maxX, maxY };
}

try {
  await sharp(SOURCE_MOCKUP).metadata();
} catch {
  const ASSET_SRC =
    'C:/Users/stlou/.cursor/projects/e-Finely-Cred/assets/c__Users_stlou_AppData_Roaming_Cursor_User_workspaceStorage_d7bfcfc657fce481bfd25c69b5fe9b14_images_Delete_Debt_E-guide_Mockup-1c6253ea-909b-4f51-9d18-644a460e87ba.png';
  await sharp(ASSET_SRC).png().toFile(SOURCE_MOCKUP);
}

const { data: srcData, info: srcInfo } = await sharp(SOURCE_MOCKUP)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { data: maskData, info: maskInfo } = await sharp(MASK_BASE)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const w = srcInfo.width;
const h = srcInfo.height;
const ch = srcInfo.channels;
const mw = maskInfo.width;
const mh = maskInfo.height;
const outData = Buffer.alloc(w * h * ch);

let opaque = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const p = idx(w, x, y);
    const i = p * ch;
    const mx = x - MASK_OFFSET_X;
    const my = y - MASK_OFFSET_Y;
    let keep = false;
    if (mx >= 0 && my >= 0 && mx < mw && my < mh) {
      keep = maskData[idx(mw, mx, my) * ch + 3] > MASK_ALPHA_THRESHOLD;
    }
    if (!keep) {
      outData[i + 3] = 0;
      continue;
    }
    outData[i] = srcData[i];
    outData[i + 1] = srcData[i + 1];
    outData[i + 2] = srcData[i + 2];
    outData[i + 3] = 255;
    opaque++;
  }
}

const bounds = alphaBounds(outData, w, h, ch);
const pad = 2;
const left = Math.max(0, bounds.minX - pad);
const top = Math.max(0, bounds.minY - pad);
const right = Math.min(w - 1, bounds.maxX + pad);
const bottom = Math.min(h - 1, bounds.maxY + pad);
const outW = right - left + 1;
const outH = bottom - top + 1;

const cropped = Buffer.alloc(outW * outH * ch);
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    const srcOff = idx(w, x + left, y + top) * ch;
    const dstOff = idx(outW, x, y) * ch;
    cropped[dstOff] = outData[srcOff];
    cropped[dstOff + 1] = outData[srcOff + 1];
    cropped[dstOff + 2] = outData[srcOff + 2];
    cropped[dstOff + 3] = outData[srcOff + 3];
  }
}

await sharp(cropped, { raw: { width: outW, height: outH, channels: ch } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

let croppedOpaque = 0;
let holes = 0;
for (let p = 0; p < outW * outH; p++) {
  if (cropped[p * ch + 3] > 250) croppedOpaque++;
}
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    if (cropped[idx(outW, x, y) * ch + 3] < 10) holes++;
  }
}

console.log(
  JSON.stringify(
    {
      maskOffset: { x: MASK_OFFSET_X, y: MASK_OFFSET_Y },
      source: { width: w, height: h },
      output: { width: outW, height: outH, left, top, right, bottom },
      opaqueBeforeCrop: opaque,
      opaquePixels: croppedOpaque,
      holesInsideBounds: holes,
    },
    null,
    2,
  ),
);
