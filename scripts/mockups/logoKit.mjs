/**
 * Rasterize official Finely Cred SVG logos into lead-magnet kit PNGs (true alpha).
 * NEVER invent FC seals — only public/brand/*.svg sources.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

export const BRAND_LOGO_SVG = path.join(ROOT, 'public/brand/finely-cred-logo.svg');
export const BRAND_ICON_SVG = path.join(ROOT, 'public/brand/finely-cred-icon.svg');
export const KIT_DIR = path.join(ROOT, 'public/images/lead-magnets/_kit');

/** Design viewBox bases → @2x / @4x pixel sizes */
const LOGO_BASE = { w: 300, h: 96 };
const ICON_BASE = { w: 64, h: 64 };

export function logoKitPaths() {
  return {
    dir: KIT_DIR,
    logo2x: path.join(KIT_DIR, 'finely-cred-logo@2x.png'),
    logo4x: path.join(KIT_DIR, 'finely-cred-logo@4x.png'),
    icon2x: path.join(KIT_DIR, 'finely-cred-icon@2x.png'),
    icon4x: path.join(KIT_DIR, 'finely-cred-icon@4x.png'),
    brandLogoSvg: BRAND_LOGO_SVG,
    brandIconSvg: BRAND_ICON_SVG,
  };
}

async function rasterizeSvg(svgPath, width, height, outPath) {
  if (!existsSync(svgPath)) {
    throw new Error(`Missing brand SVG (required, never invent logos): ${svgPath}`);
  }
  // High density so text/gradients stay crisp when downscaled into covers.
  const density = Math.max(300, Math.round((width / LOGO_BASE.w) * 150));
  await sharp(svgPath, { density })
    .resize(width, height, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png({ compressionLevel: 9, force: true })
    .toFile(outPath);
  return outPath;
}

/**
 * Write kit PNGs at @2x and @4x. Idempotent — overwrites kit only, never live mockups.
 * @returns {Promise<ReturnType<typeof logoKitPaths>>}
 */
export async function ensureLogoKit({ force = true } = {}) {
  mkdirSync(KIT_DIR, { recursive: true });
  const paths = logoKitPaths();

  const jobs = [
    [BRAND_LOGO_SVG, LOGO_BASE.w * 2, LOGO_BASE.h * 2, paths.logo2x],
    [BRAND_LOGO_SVG, LOGO_BASE.w * 4, LOGO_BASE.h * 4, paths.logo4x],
    [BRAND_ICON_SVG, ICON_BASE.w * 2, ICON_BASE.h * 2, paths.icon2x],
    [BRAND_ICON_SVG, ICON_BASE.w * 4, ICON_BASE.h * 4, paths.icon4x],
  ];

  for (const [svg, w, h, out] of jobs) {
    if (!force && existsSync(out)) continue;
    await rasterizeSvg(svg, w, h, out);
  }

  return paths;
}

/** Load a kit PNG as buffer (prefers @4x). */
export async function loadKitLogo({ scale = 4, kind = 'logo' } = {}) {
  const paths = logoKitPaths();
  const map = {
    logo: { 2: paths.logo2x, 4: paths.logo4x },
    icon: { 2: paths.icon2x, 4: paths.icon4x },
  };
  const file = map[kind]?.[scale];
  if (!file) throw new Error(`Unknown kit asset kind=${kind} scale=${scale}`);
  if (!existsSync(file)) await ensureLogoKit();
  return sharp(file).ensureAlpha().png().toBuffer();
}
