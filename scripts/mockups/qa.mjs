/**
 * QA plate writers for lead-magnet mockups (magenta + dark-hero).
 */
import sharp from 'sharp';
import path from 'node:path';
import { GEOMETRY } from './geometry.mjs';

async function toPngBuf(src) {
  if (Buffer.isBuffer(src)) return sharp(src).ensureAlpha().png().toBuffer();
  return sharp(src).ensureAlpha().png().toBuffer();
}

async function compositeOnPlate(src, rgb, outPath) {
  const input = await toPngBuf(src);
  const meta = await sharp(input).metadata();
  await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: rgb,
    },
  })
    .composite([{ input }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  return outPath;
}

/** Magenta plate — reveals fringe / plate residue. */
export async function writeMagentaQa(src, outPath) {
  return compositeOnPlate(src, GEOMETRY.magentaRgb, outPath);
}

/** Dark-hero plate `#030504` — page-native lighting check. */
export async function writeDarkHeroQa(src, outPath) {
  return compositeOnPlate(src, GEOMETRY.heroDarkRgb, outPath);
}

/**
 * Write both QA plates next to a mockup path.
 * @param {string|Buffer} src
 * @param {string} baseOutDir
 * @param {string} stem e.g. "bc" → `_qa-bc-on-magenta.png`
 */
export async function writeQaPair(src, baseOutDir, stem) {
  const magenta = path.join(baseOutDir, `_qa-${stem}-on-magenta.png`);
  const dark = path.join(baseOutDir, `_qa-${stem}-on-hero-dark.png`);
  await writeMagentaQa(src, magenta);
  await writeDarkHeroQa(src, dark);
  return { magenta, dark };
}
