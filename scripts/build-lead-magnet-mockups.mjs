/**
 * Premium Lead-Magnet Mockup Pipeline — shared infra (Agent 1)
 *
 * Rasterizes the REAL Finely Cred logo/icon into `_kit/`, and exports
 * ThinBookletEngine + QA helpers for Agents 2 (BC) and 3 (Debt).
 *
 * ---------------------------------------------------------------------------
 * CLI usage
 * ---------------------------------------------------------------------------
 *
 *   # Build logo kit only (@2x / @4x PNG, true alpha)
 *   node scripts/build-lead-magnet-mockups.mjs --kit
 *
 *   # Kit + dry-run demo booklet (writes _kit/_demo-thin-booklet.png + QA plates)
 *   # Does NOT overwrite live BC/Debt mockups.
 *   node scripts/build-lead-magnet-mockups.mjs --demo
 *
 *   # Same as --demo (default when no flags)
 *   node scripts/build-lead-magnet-mockups.mjs
 *
 * ---------------------------------------------------------------------------
 * Programmatic API (Agents 2 & 3)
 * ---------------------------------------------------------------------------
 *
 *   import {
 *     ensureLogoKit,
 *     logoKitPaths,
 *     KIT_DIR,
 *     GEOMETRY,
 *     ThinBookletEngine,
 *     composeThinBooklet,
 *     writeMagentaQa,
 *     writeDarkHeroQa,
 *     writeQaPair,
 *   } from './build-lead-magnet-mockups.mjs';
 *
 *   await ensureLogoKit();
 *   const engine = new ThinBookletEngine();
 *   const { buffer, metrics } = await engine.compose({
 *     cover: 'path/to/flat-cover.png',
 *     pages: ['path/to/spread-a.png', 'path/to/spread-b.png'],
 *     coverHeight: 1600,
 *     outPath: 'public/images/lead-magnets/business-credit-power-guide-mockup.png',
 *     // navySpine: true,  // Debt
 *     // layeredYaw: true, // richer per-page yaw
 *   });
 *   await writeQaPair(buffer, 'public/images/lead-magnets', 'bc');
 *
 * Geometry (art bible):
 *   spine depth 2.5–4% of H | pages ≥96% H | peek 12–18% of W
 *   contact shadow soft ellipse | true RGBA | tight transparent margins 3–5%
 *
 * NEVER invent FC seals — logo kit comes only from public/brand/*.svg
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GEOMETRY, clampGeometry } from './mockups/geometry.mjs';
import {
  ensureLogoKit,
  logoKitPaths,
  loadKitLogo,
  KIT_DIR,
  BRAND_LOGO_SVG,
  BRAND_ICON_SVG,
} from './mockups/logoKit.mjs';
import { ThinBookletEngine, composeThinBooklet } from './mockups/thinBookletEngine.mjs';
import { writeMagentaQa, writeDarkHeroQa, writeQaPair } from './mockups/qa.mjs';

export {
  GEOMETRY,
  clampGeometry,
  ensureLogoKit,
  logoKitPaths,
  loadKitLogo,
  KIT_DIR,
  BRAND_LOGO_SVG,
  BRAND_ICON_SVG,
  ThinBookletEngine,
  composeThinBooklet,
  writeMagentaQa,
  writeDarkHeroQa,
  writeQaPair,
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const LEAD_MAGNETS = path.join(ROOT, 'public/images/lead-magnets');

/** Solid flat cover for dry-run only (not a live asset). */
async function makeDemoCover(kitLogo4x, { w = 900, h = 1200, navy = false } = {}) {
  const bg = navy ? '#0c1a2e' : '#0a0c0b';
  const title = navy ? 'Eradicate the Debt' : 'Business Credit';
  const sub = navy ? 'Reclaim Your Future' : 'Power Guide';
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${navy ? '#07101c' : '#050605'}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="#d4a447" stroke-width="2.5"/>
  <rect x="36" y="36" width="${w - 72}" height="${h - 72}" fill="none" stroke="#e8c96a" stroke-width="1" opacity="0.55"/>
  <text x="${w / 2}" y="${h * 0.42}" text-anchor="middle" fill="#d4a447"
    font-family="Georgia, 'Times New Roman', serif" font-size="54">${title}</text>
  <text x="${w / 2}" y="${h * 0.50}" text-anchor="middle" fill="#ffffff"
    font-family="Georgia, 'Times New Roman', serif" font-size="42">${sub}</text>
  <text x="${w / 2}" y="${h * 0.88}" text-anchor="middle" fill="#e8c96a" opacity="0.85"
    font-family="Inter, Arial, sans-serif" font-size="16" letter-spacing="0.18em">DEMO ENGINE ONLY</text>
</svg>`);
  const base = await sharp(svg).ensureAlpha().png().toBuffer();
  const logo = await sharp(kitLogo4x)
    .resize({ width: Math.round(w * 0.42), kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  return sharp(base)
    .composite([
      {
        input: logo,
        left: Math.round((w - logoMeta.width) / 2),
        top: Math.round(h * 0.12),
      },
    ])
    .png()
    .toBuffer();
}

async function makeDemoSpread(kitLogo2x, { w = 900, h = 1176, label = 'SPREAD A' } = {}) {
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#f4efe6"/>
  <rect x="0" y="0" width="100%" height="48" fill="#ebe4d8"/>
  <text x="40" y="32" fill="#5c615c" font-family="Inter, Arial, sans-serif" font-size="14"
    letter-spacing="0.14em">FINELY CRED · REPORT · ${label}</text>
  <text x="40" y="120" fill="#1a1c1b" font-family="Georgia, 'Times New Roman', serif" font-size="40">
    Editorial preview page
  </text>
  <rect x="40" y="160" width="${w - 80}" height="2" fill="#d4a447" opacity="0.7"/>
  <rect x="40" y="200" width="${w - 80}" height="160" rx="12" fill="#ffffff" stroke="#d4a447" stroke-width="1.2"/>
  <text x="60" y="250" fill="#1a1c1b" font-family="Inter, Arial, sans-serif" font-size="18">
    Dense report content peeks behind the cover.
  </text>
  <text x="60" y="285" fill="#5c615c" font-family="Inter, Arial, sans-serif" font-size="15">
    Full-height cream spread · illustrative demo only
  </text>
  <line x1="40" y1="${h - 48}" x2="${w - 40}" y2="${h - 48}" stroke="#d4a447" stroke-width="1.5"/>
</svg>`);
  const base = await sharp(svg).ensureAlpha().png().toBuffer();
  const logo = await sharp(kitLogo2x)
    .resize({ width: 140, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  return sharp(base)
    .composite([{ input: logo, left: w - 180, top: 8 }])
    .png()
    .toBuffer();
}

async function runDemo() {
  const kit = await ensureLogoKit();
  console.log('[kit] wrote:');
  for (const key of ['logo2x', 'logo4x', 'icon2x', 'icon4x']) {
    console.log('      ', kit[key]);
  }

  const cover = await makeDemoCover(kit.logo4x);
  const pageA = await makeDemoSpread(kit.logo2x, { label: 'SPREAD A' });
  const pageB = await makeDemoSpread(kit.logo2x, { label: 'SPREAD B' });

  const demoOut = path.join(KIT_DIR, '_demo-thin-booklet.png');
  const engine = new ThinBookletEngine();
  const result = await engine.compose({
    cover,
    pages: [pageA, pageB],
    coverHeight: 1400,
    outPath: demoOut,
    layeredYaw: false,
  });

  const qa = await writeQaPair(result.buffer, KIT_DIR, 'demo-thin-booklet');
  console.log('[demo] booklet:', demoOut);
  console.log('[demo] metrics:', JSON.stringify(result.metrics, null, 2));
  console.log('[demo] QA magenta:', qa.magenta);
  console.log('[demo] QA dark-hero:', qa.dark);
  console.log('[demo] Live BC/Debt mockups were NOT overwritten.');
  return result;
}

async function main() {
  const args = new Set(process.argv.slice(2));

  if (args.has('--help') || args.has('-h')) {
    console.log(`Usage:
  node scripts/build-lead-magnet-mockups.mjs --kit
  node scripts/build-lead-magnet-mockups.mjs --demo
  node scripts/build-lead-magnet-mockups.mjs          # kit + demo`);
    return;
  }

  mkdirSync(KIT_DIR, { recursive: true });
  mkdirSync(LEAD_MAGNETS, { recursive: true });

  const kitOnly = args.has('--kit') && !args.has('--demo');
  if (kitOnly) {
    const kit = await ensureLogoKit();
    console.log('[kit] ready:', kit.dir);
    console.log(' ', kit.logo2x);
    console.log(' ', kit.logo4x);
    console.log(' ', kit.icon2x);
    console.log(' ', kit.icon4x);
    return;
  }

  // Default / --demo: kit + dry-run booklet (never touches live mockups)
  await runDemo();
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
