/**
 * Business Credit Power Guide mockup — elite matte black / gold / lime editorial.
 *
 * Flat cover + 2 full-height cream spreads → ThinBookletEngine → live PNGs + QA.
 * Real logo ONLY via ensureLogoKit(). Never invents FC seals.
 *
 *   node scripts/mockups/build-bc-power-guide.mjs
 *   node scripts/mockups/build-bc-power-guide.mjs --flats-only
 */
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ensureLogoKit,
  ThinBookletEngine,
  writeQaPair,
  KIT_DIR,
} from '../build-lead-magnet-mockups.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT_DIR = path.join(ROOT, 'public/images/lead-magnets');
const FLATS_DIR = path.join(OUT_DIR, '_kit', 'bc-flats');
const BACKUP_DIR = path.join(OUT_DIR, 'backup-before-bg-remove');

const LIVE_PNG = path.join(OUT_DIR, 'business-credit-power-guide-mockup.png');
const LIVE_TRANSPARENT = path.join(OUT_DIR, 'business-credit-power-guide-mockup-transparent.png');

const COVER_W = 1200;
const COVER_H = 1600;
const PAGE_W = 1200;
const PAGE_H = 1576; // ~98.5% of cover H — full-height peeks

const GOLD = '#d4a447';
const GOLD_SOFT = '#e8c96a';
const GOLD_DEEP = '#b8860b';
const GOLD_BRIGHT = '#f0d78a';
const GOLD_FOIL = '#f5e0a0';
const GREEN = '#95e000';
const GREEN_SOFT = '#b8f04a';
const GREEN_DEEP = '#6fb000';
const CREAM = '#f4efe6';
const CREAM_DEEP = '#ebe4d8';
const CREAM_BRIGHT = '#faf7f1';
const INK = '#141616';
const MUTED = '#5a5f5a';
const MUTED_SOFT = '#7a8078';

/** Multi-layer filament ribbon — depth underlays + mid weave + catchlight accents. */
function wavePaths() {
  const lines = [];

  // Layer 0 — soft depth underlays (wide, low opacity)
  const underlays = [
    { y: 980, amp: 52, o: 0.1, sw: 14, c: GOLD_DEEP },
    { y: 1035, amp: 58, o: 0.12, sw: 16, c: GREEN_DEEP },
    { y: 1095, amp: 48, o: 0.09, sw: 12, c: GOLD },
    { y: 1155, amp: 54, o: 0.11, sw: 15, c: GREEN },
  ];
  for (let i = 0; i < underlays.length; i++) {
    const u = underlays[i];
    const phase = i * 0.55;
    const d = [
      `M 48 ${u.y}`,
      `C ${220 + phase * 22} ${u.y - u.amp}, ${380} ${u.y + u.amp * 0.95}, ${540} ${u.y - u.amp * 0.35}`,
      `S ${760} ${u.y + u.amp * 1.1}, ${900} ${u.y - u.amp * 0.55}`,
      `S ${1040} ${u.y + u.amp * 0.5}, ${1152} ${u.y + 6}`,
    ].join(' ');
    lines.push(
      `<path d="${d}" fill="none" stroke="${u.c}" stroke-width="${u.sw}" stroke-opacity="${u.o}" stroke-linecap="round"/>`,
    );
  }

  // Layer 1 — dense mid filaments (gold/green weave)
  const mid = [
    { c: GOLD_DEEP, o: 0.44, sw: 1.15 },
    { c: GOLD, o: 0.64, sw: 1.7 },
    { c: GREEN, o: 0.9, sw: 2.3 },
    { c: GOLD_SOFT, o: 0.84, sw: 2.0 },
    { c: GREEN_SOFT, o: 0.8, sw: 1.9 },
    { c: GOLD, o: 0.58, sw: 1.45 },
    { c: GREEN, o: 0.76, sw: 1.75 },
    { c: GOLD_BRIGHT, o: 0.72, sw: 1.6 },
    { c: GREEN, o: 0.66, sw: 1.4 },
    { c: GOLD, o: 0.5, sw: 1.25 },
    { c: GREEN_SOFT, o: 0.58, sw: 1.2 },
    { c: GOLD_DEEP, o: 0.4, sw: 1.1 },
    { c: GREEN, o: 0.54, sw: 1.15 },
    { c: GOLD_SOFT, o: 0.48, sw: 1.05 },
    { c: GREEN_SOFT, o: 0.46, sw: 1.0 },
    { c: GOLD, o: 0.38, sw: 0.95 },
    { c: GREEN, o: 0.42, sw: 0.9 },
    { c: GOLD_BRIGHT, o: 0.4, sw: 0.85 },
    { c: GREEN_SOFT, o: 0.36, sw: 0.8 },
    { c: GOLD_DEEP, o: 0.32, sw: 0.75 },
  ];
  for (let i = 0; i < mid.length; i++) {
    const y0 = 888 + i * 16.5;
    const amp = 38 + (i % 5) * 7.5 + (i % 3) * 3;
    const phase = i * 0.41;
    const skew = (i % 2 === 0 ? 1 : -1) * 8;
    const d = [
      `M 64 ${y0}`,
      `C ${200 + phase * 16} ${y0 - amp * 1.08 + skew}, ${360} ${y0 + amp * 0.95}, ${520} ${y0 - amp * 0.42}`,
      `S ${700 + skew} ${y0 + amp * 1.12}, ${850} ${y0 - amp * 0.58}`,
      `S ${980} ${y0 + amp * 0.48}, ${1040} ${y0 - amp * 0.2}`,
      `S ${1100} ${y0 + amp * 0.35}, ${1136} ${y0 + 3}`,
    ].join(' ');
    const { c, o, sw } = mid[i];
    // Soft under-glow for green / bright gold catchlights
    if (c === GREEN || c === GREEN_SOFT || c === GOLD_BRIGHT) {
      lines.push(
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw + 4.2}" stroke-opacity="${o * 0.16}" stroke-linecap="round"/>`,
      );
    }
    lines.push(
      `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-opacity="${o}" stroke-linecap="round"/>`,
    );
  }

  // Layer 2 — bright catchlight filaments (thin high-contrast accents)
  const accents = [
    { y: 948, amp: 40, c: GREEN_SOFT, o: 0.95, sw: 1.05 },
    { y: 992, amp: 46, c: GOLD_FOIL, o: 0.82, sw: 0.95 },
    { y: 1036, amp: 42, c: GREEN, o: 0.92, sw: 1.15 },
    { y: 1088, amp: 50, c: GOLD_BRIGHT, o: 0.78, sw: 0.9 },
    { y: 1140, amp: 38, c: GREEN_SOFT, o: 0.88, sw: 1.0 },
    { y: 1190, amp: 44, c: GOLD_FOIL, o: 0.7, sw: 0.85 },
  ];
  for (const a of accents) {
    const d = `M 88 ${a.y} C 280 ${a.y - a.amp}, 460 ${a.y + a.amp * 0.85}, 640 ${a.y - a.amp * 0.28} S 900 ${a.y + a.amp * 1.05}, 1060 ${a.y - a.amp * 0.15} S 1120 ${a.y + a.amp * 0.3}, 1144 ${a.y}`;
    lines.push(
      `<path d="${d}" fill="none" stroke="${a.c}" stroke-width="${a.sw + 3}" stroke-opacity="${a.o * 0.14}" stroke-linecap="round"/>`,
    );
    lines.push(
      `<path d="${d}" fill="none" stroke="${a.c}" stroke-width="${a.sw}" stroke-opacity="${a.o}" stroke-linecap="round"/>`,
    );
  }

  // Specular ticks along crest peaks (micro catchlights)
  const ticks = [
    [320, 920, GREEN_SOFT],
    [480, 975, GOLD_FOIL],
    [640, 1010, GREEN],
    [800, 1065, GOLD_BRIGHT],
    [920, 1120, GREEN_SOFT],
    [540, 1185, GOLD_FOIL],
  ];
  for (const [x, y, c] of ticks) {
    lines.push(
      `<circle cx="${x}" cy="${y}" r="2.2" fill="${c}" fill-opacity="0.55"/>`,
      `<circle cx="${x}" cy="${y}" r="5.5" fill="${c}" fill-opacity="0.12"/>`,
    );
  }

  return lines.join('\n');
}

function coverSvg() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_W}" height="${COVER_H}" viewBox="0 0 ${COVER_W} ${COVER_H}">
  <defs>
    <linearGradient id="coverField" x1="0.12" y1="0" x2="0.55" y2="1">
      <stop offset="0%" stop-color="#0c0e0d"/>
      <stop offset="22%" stop-color="#060807"/>
      <stop offset="55%" stop-color="#020303"/>
      <stop offset="82%" stop-color="#010101"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="softKey" cx="26%" cy="12%" r="80%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="18%" stop-color="#e8c96a" stop-opacity="0.09"/>
      <stop offset="42%" stop-color="#d4a447" stop-opacity="0.045"/>
      <stop offset="68%" stop-color="#95e000" stop-opacity="0.022"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="centerGold" cx="50%" cy="40%" r="54%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.16"/>
      <stop offset="42%" stop-color="${GOLD}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="edgeVignette" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="foilGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5e0a0"/>
      <stop offset="22%" stop-color="#e8c96a"/>
      <stop offset="48%" stop-color="#d4a447"/>
      <stop offset="72%" stop-color="#b8860b"/>
      <stop offset="100%" stop-color="#f0d78a"/>
    </linearGradient>
    <linearGradient id="foilEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5e0a0"/>
      <stop offset="40%" stop-color="#d4a447"/>
      <stop offset="100%" stop-color="#8a6810"/>
    </linearGradient>
    <linearGradient id="titleFoil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7e6b0"/>
      <stop offset="38%" stop-color="#e8c96a"/>
      <stop offset="72%" stop-color="#c4962e"/>
      <stop offset="100%" stop-color="#a67c1a"/>
    </linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.92  0 0 0 0.055 0"/>
    </filter>
    <filter id="grainFine" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.9  0 0 0 0.03 0"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#coverField)"/>
  <rect width="100%" height="100%" fill="url(#softKey)"/>
  <rect width="100%" height="100%" fill="url(#centerGold)"/>
  <rect width="100%" height="100%" fill="url(#edgeVignette)"/>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.85"/>
  <rect width="100%" height="100%" filter="url(#grainFine)" opacity="0.55"/>

  <!-- Premium foil triple frame -->
  <rect x="28" y="28" width="${COVER_W - 56}" height="${COVER_H - 56}" fill="none" stroke="url(#foilGold)" stroke-width="4.2"/>
  <rect x="38" y="38" width="${COVER_W - 76}" height="${COVER_H - 76}" fill="none" stroke="url(#foilEdge)" stroke-width="1.35" opacity="0.85"/>
  <rect x="48" y="48" width="${COVER_W - 96}" height="${COVER_H - 96}" fill="none" stroke="${GOLD_SOFT}" stroke-width="0.9" opacity="0.42"/>
  <!-- Corner brackets -->
  ${[
    [60, 60, 1, 1],
    [COVER_W - 60, 60, -1, 1],
    [60, COVER_H - 60, 1, -1],
    [COVER_W - 60, COVER_H - 60, -1, -1],
  ]
    .map(
      ([x, y, sx, sy]) => `
    <path d="M ${x} ${y + sy * 38} L ${x} ${y} L ${x + sx * 38} ${y}" fill="none" stroke="url(#foilGold)" stroke-width="2.1" opacity="0.92"/>
    <path d="M ${x + sx * 4} ${y + sy * 28} L ${x + sx * 4} ${y + sy * 4} L ${x + sx * 28} ${y + sy * 4}" fill="none" stroke="${GOLD_SOFT}" stroke-width="0.85" opacity="0.55"/>`,
    )
    .join('\n')}

  <!-- Editorial eyebrow (under logo zone) -->
  <line x1="228" y1="322" x2="378" y2="322" stroke="url(#foilGold)" stroke-width="1.05" opacity="0.78"/>
  <circle cx="390" cy="322" r="2.1" fill="${GOLD_SOFT}" opacity="0.8"/>
  <circle cx="810" cy="322" r="2.1" fill="${GOLD_SOFT}" opacity="0.8"/>
  <line x1="822" y1="322" x2="972" y2="322" stroke="url(#foilGold)" stroke-width="1.05" opacity="0.78"/>
  <text x="600" y="327" text-anchor="middle" fill="${GOLD_SOFT}"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="12.5" font-weight="600"
    letter-spacing="0.36em">PREPARED FOR AMBITIOUS BUSINESSES</text>

  <!-- Published-book title hierarchy -->
  <text x="600" y="488" text-anchor="middle" fill="url(#titleFoil)"
    font-family="Georgia, 'Playfair Display', 'Times New Roman', serif"
    font-size="86" font-weight="700">Business Credit</text>
  <line x1="360" y1="518" x2="840" y2="518" stroke="url(#foilGold)" stroke-width="1.45" opacity="0.75"/>
  <line x1="420" y1="524" x2="780" y2="524" stroke="${GOLD_SOFT}" stroke-width="0.6" opacity="0.35"/>
  <text x="600" y="602" text-anchor="middle" fill="#f7f8f5"
    font-family="Georgia, 'Playfair Display', 'Times New Roman', serif"
    font-size="76" font-weight="600"
    stroke="${GOLD}" stroke-width="0.55" paint-order="stroke fill">Power Guide</text>

  <text x="600" y="678" text-anchor="middle" fill="#e4e8e2" opacity="0.88"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="20" font-weight="300"
    letter-spacing="0.02em">
    Structure Your Business for Better Funding Options
  </text>
  <text x="600" y="708" text-anchor="middle" fill="#b8c0b8" opacity="0.72"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="17" font-weight="300">
    in Just a Few Steps
  </text>
  <text x="600" y="752" text-anchor="middle" fill="${GREEN}" opacity="0.9"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="12" font-weight="600"
    letter-spacing="0.28em">PARTNER FUNDABILITY PLAYBOOK</text>

  <!-- Wave art — refined multi-layer filaments -->
  <g opacity="0.98">
    ${wavePaths()}
  </g>

  <!-- Footer tagline -->
  <line x1="340" y1="1488" x2="420" y2="1488" stroke="${GOLD}" stroke-width="0.9" opacity="0.45"/>
  <line x1="780" y1="1488" x2="860" y2="1488" stroke="${GOLD}" stroke-width="0.9" opacity="0.45"/>
  <text x="600" y="1494" text-anchor="middle" fill="${GOLD_SOFT}"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="14" font-weight="500"
    letter-spacing="0.3em">STRONGER CREDIT. MORE FREEDOM.</text>
</svg>`);
}

function spreadHeader(labelRight) {
  return `
  <rect x="0" y="0" width="${PAGE_W}" height="72" fill="${CREAM_DEEP}" opacity="0.95"/>
  <text x="48" y="44" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="12"
    font-weight="700" letter-spacing="0.22em">FINELY CRED</text>
  <text x="${PAGE_W - 200}" y="44" text-anchor="end" fill="${MUTED}"
    font-family="Inter, Arial, sans-serif" font-size="11" letter-spacing="0.14em">${labelRight}</text>
  <line x1="48" y1="72" x2="${PAGE_W - 48}" y2="72" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="1.5"/>
  <line x1="48" y1="76" x2="${PAGE_W - 48}" y2="76" stroke="${GREEN}" stroke-opacity="0.18" stroke-width="0.8"/>
  <rect x="28" y="88" width="${PAGE_W - 56}" height="${PAGE_H - 112}" fill="none" stroke="${GOLD}" stroke-opacity="0.32" stroke-width="1.35"/>
  <rect x="34" y="94" width="${PAGE_W - 68}" height="${PAGE_H - 124}" fill="none" stroke="${GOLD_SOFT}" stroke-opacity="0.14" stroke-width="0.7"/>`;
}

function spreadASvg() {
  const metrics = [
    ['Payment history', 'GOOD', 'Consistent on-time pattern', 0.88],
    ['Utilization', 'FAIR', '32% of available revolving', 0.55],
    ['Age of accounts', 'GOOD', 'Healthy average age', 0.8],
    ['Inquiries', 'FAIR', 'Recent volume elevated', 0.48],
    ['Public records', 'CLEAR', 'No active judgments shown', 0.95],
    ['Collections', 'WATCH', '1 aged item under review', 0.35],
  ];

  const metricRows = metrics
    .map((row, i) => {
      const y = 678 + i * 92;
      const chip =
        row[1] === 'GOOD' || row[1] === 'CLEAR' ? GREEN : row[1] === 'WATCH' ? GOLD : GOLD_DEEP;
      const barW = Math.round(220 * row[3]);
      return `
      <rect x="48" y="${y}" width="${PAGE_W - 220}" height="80" rx="14" fill="#ffffff" fill-opacity="0.68" stroke="${GOLD}" stroke-opacity="0.3"/>
      <rect x="48" y="${y}" width="6" height="80" fill="${chip}" opacity="0.85"/>
      <text x="76" y="${y + 30}" fill="${INK}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700">${row[0]}</text>
      <text x="76" y="${y + 52}" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="13">${row[2]}</text>
      <rect x="76" y="${y + 62}" width="220" height="5" rx="2.5" fill="#ddd6c8"/>
      <rect x="76" y="${y + 62}" width="${barW}" height="5" rx="2.5" fill="${chip}" opacity="0.75"/>
      <rect x="${PAGE_W - 280}" y="${y + 24}" width="100" height="32" rx="8" fill="${chip}" fill-opacity="0.12" stroke="${chip}" stroke-opacity="0.65"/>
      <text x="${PAGE_W - 230}" y="${y + 45}" text-anchor="middle" fill="${chip}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.1em">${row[1]}</text>`;
    })
    .join('');

  // Peek-readable right rail (visible when page peeks past cover)
  const peekRail = `
  <rect x="${PAGE_W - 148}" y="120" width="116" height="${PAGE_H - 200}" rx="12" fill="#0c0e0d" opacity="0.94"/>
  <rect x="${PAGE_W - 148}" y="120" width="4" height="${PAGE_H - 200}" fill="${GREEN}" opacity="0.7"/>
  <text x="${PAGE_W - 90}" y="158" text-anchor="middle" fill="${GOLD_SOFT}" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="0.16em">LIVE</text>
  <text x="${PAGE_W - 90}" y="176" text-anchor="middle" fill="#9aa29a" font-family="Inter, Arial, sans-serif" font-size="10" letter-spacing="0.08em">READ</text>
  ${[
    ['689', 'SCORE'],
    ['32%', 'UTIL'],
    ['94%', 'PAY'],
    ['4', 'INQ'],
    ['MOD', 'TIER'],
  ]
    .map(
      (k, i) => `
    <rect x="${PAGE_W - 136}" y="${210 + i * 130}" width="92" height="100" rx="10" fill="#161916" stroke="${GOLD}" stroke-opacity="0.28"/>
    <text x="${PAGE_W - 90}" y="${250 + i * 130}" text-anchor="middle" fill="${i % 2 === 0 ? GREEN : GOLD_SOFT}" font-family="Georgia, serif" font-size="22" font-weight="700">${k[0]}</text>
    <text x="${PAGE_W - 90}" y="${278 + i * 130}" text-anchor="middle" fill="${MUTED_SOFT}" font-family="Inter, Arial, sans-serif" font-size="10" letter-spacing="0.14em">${k[1]}</text>`,
    )
    .join('')}`;

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0.15" y2="1">
      <stop offset="0%" stop-color="${CREAM_BRIGHT}"/>
      <stop offset="55%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${CREAM_DEEP}"/>
    </linearGradient>
    <linearGradient id="gaugeArc" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD_DEEP}"/>
      <stop offset="40%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GREEN}"/>
    </linearGradient>
    <linearGradient id="scorePlate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141816"/>
      <stop offset="100%" stop-color="#0a0c0b"/>
    </linearGradient>
    <filter id="paperGrain">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.28  0 0 0 0 0.26  0 0 0 0 0.2  0 0 0 0.055 0"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#paper)"/>
  <rect width="100%" height="100%" filter="url(#paperGrain)" opacity="0.78"/>

  ${spreadHeader('CREDIT ANALYSIS REPORT  ·  SPREAD 2 OF 10')}

  <text x="52" y="158" fill="${INK}" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="700">
    Your Credit
  </text>
  <text x="52" y="214" fill="${GOLD_DEEP}" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700">
    Snapshot
  </text>
  <text x="52" y="252" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="15">
    Illustrative readiness view — how fundability reads before optimization.
  </text>

  <!-- LARGE readiness gauge (peek zone) -->
  <g transform="translate(520, 268)">
    <circle cx="220" cy="210" r="198" fill="#fff" fill-opacity="0.72" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="2"/>
    <circle cx="220" cy="210" r="198" fill="none" stroke="${GREEN}" stroke-opacity="0.12" stroke-width="8"/>
    <!-- tick marks -->
    ${Array.from({ length: 12 }, (_, i) => {
      const a = ((140 + i * 20) * Math.PI) / 180;
      const x1 = 220 + Math.cos(a) * 172;
      const y1 = 210 + Math.sin(a) * 172;
      const x2 = 220 + Math.cos(a) * 186;
      const y2 = 210 + Math.sin(a) * 186;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="1.5"/>`;
    }).join('')}
    <circle cx="220" cy="210" r="158" fill="none" stroke="#ddd6c8" stroke-width="22" stroke-linecap="round"
      stroke-dasharray="420 560" transform="rotate(140 220 210)"/>
    <circle cx="220" cy="210" r="158" fill="none" stroke="url(#gaugeArc)" stroke-width="22" stroke-linecap="round"
      stroke-dasharray="268 560" transform="rotate(140 220 210)"/>
    <circle cx="220" cy="210" r="126" fill="${CREAM_BRIGHT}" stroke="${GOLD}" stroke-opacity="0.22" stroke-width="1.2"/>
    <text x="220" y="152" text-anchor="middle" fill="${MUTED}" font-family="Inter, Arial, sans-serif"
      font-size="12" letter-spacing="0.2em" font-weight="700">OVERALL READINESS</text>
    <text x="220" y="210" text-anchor="middle" fill="${GOLD_DEEP}" font-family="Georgia, serif" font-size="52" font-weight="700">Moderate</text>
    <text x="220" y="248" text-anchor="middle" fill="${GREEN}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">Improving</text>
    <text x="220" y="278" text-anchor="middle" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="12">
      Path clear with focused work
    </text>
  </g>

  <!-- Score KPI card — dense chrome -->
  <rect x="52" y="290" width="440" height="188" rx="16" fill="url(#scorePlate)"/>
  <rect x="52" y="290" width="7" height="188" fill="${GREEN}"/>
  <rect x="52" y="290" width="440" height="1" fill="${GOLD}" opacity="0.35"/>
  <text x="82" y="334" fill="${GOLD_SOFT}" font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="0.18em" font-weight="600">EQUIFAX · ILLUSTRATIVE</text>
  <text x="82" y="412" fill="#ffffff" font-family="Georgia, serif" font-size="78" font-weight="700">689</text>
  <rect x="278" y="378" width="96" height="34" rx="9" fill="${GREEN}" fill-opacity="0.16" stroke="${GREEN}" stroke-opacity="0.75"/>
  <text x="326" y="401" text-anchor="middle" fill="${GREEN}" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700">+2 pts</text>
  <text x="82" y="452" fill="#9aa29a" font-family="Inter, Arial, sans-serif" font-size="12">Sample bureau read · results vary</text>

  <!-- Mini KPI tiles -->
  ${[
    { x: 52, label: 'UTILIZATION', val: '32%', tone: GOLD },
    { x: 200, label: 'ON-TIME', val: '94%', tone: GREEN },
    { x: 348, label: 'INQUIRIES', val: '4', tone: GOLD_DEEP },
  ]
    .map(
      (k) => `
    <rect x="${k.x}" y="502" width="136" height="92" rx="12" fill="#ffffff" fill-opacity="0.78" stroke="${GOLD}" stroke-opacity="0.4"/>
    <rect x="${k.x}" y="502" width="136" height="3" fill="${k.tone}" opacity="0.7"/>
    <text x="${k.x + 68}" y="536" text-anchor="middle" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="10" letter-spacing="0.14em" font-weight="700">${k.label}</text>
    <text x="${k.x + 68}" y="574" text-anchor="middle" fill="${k.tone}" font-family="Georgia, serif" font-size="28" font-weight="700">${k.val}</text>`,
    )
    .join('')}

  <!-- Secondary KPI strip -->
  <rect x="52" y="612" width="432" height="48" rx="10" fill="#ffffff" fill-opacity="0.55" stroke="${GOLD}" stroke-opacity="0.25"/>
  <text x="72" y="642" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600">AVG AGE</text>
  <text x="148" y="642" fill="${INK}" font-family="Georgia, serif" font-size="16" font-weight="700">6.4 yrs</text>
  <text x="240" y="642" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600">MIX</text>
  <text x="288" y="642" fill="${GREEN}" font-family="Georgia, serif" font-size="16" font-weight="700">Solid</text>
  <text x="370" y="642" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600">RISK</text>
  <text x="420" y="642" fill="${GOLD_DEEP}" font-family="Georgia, serif" font-size="16" font-weight="700">Low</text>

  <g font-family="Inter, Arial, sans-serif">
    ${metricRows}
  </g>

  ${peekRail}

  <line x1="48" y1="${PAGE_H - 52}" x2="${PAGE_W - 168}" y2="${PAGE_H - 52}" stroke="${GOLD}" stroke-opacity="0.5"/>
  <text x="48" y="${PAGE_H - 26}" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="10" letter-spacing="0.1em">
    ILLUSTRATIVE · RESULTS VARY · NOT A CREDIT GUARANTEE
  </text>
  <text x="${PAGE_W - 168}" y="${PAGE_H - 26}" text-anchor="end" fill="${MUTED}"
    font-family="Inter, Arial, sans-serif" font-size="10">SPREAD 2 OF 10</text>
</svg>`);
}

function spreadBSvg() {
  const items = [
    {
      t: 'Inaccuracies or Unverifiable Negatives',
      d: 'Items that lack clear documentation or do not match your file get flagged first.',
      n: '01',
      icon: 'doc',
    },
    {
      t: 'High-Impact Recent Lates',
      d: 'Recent late marks weigh heavier — we sequence disputes and goodwill with intent.',
      n: '02',
      icon: 'clock',
    },
    {
      t: 'Collections &amp; Charge-Offs',
      d: 'Ownership, balance accuracy, and validation gaps decide the next move.',
      n: '03',
      icon: 'shield',
    },
    {
      t: 'Utilization Optimization',
      d: 'Revolving ratios and reporting timing — quiet levers that move fundability.',
      n: '04',
      icon: 'gauge',
    },
    {
      t: 'Inquiry Cleanup &amp; Appropriacy',
      d: 'Hard pulls that no longer serve a purpose are reviewed for challenge paths.',
      n: '05',
      icon: 'search',
    },
  ];

  const iconPath = (kind, cx, cy) => {
    if (kind === 'doc')
      return `<rect x="${cx - 9}" y="${cy - 11}" width="18" height="22" rx="2" fill="none" stroke="${GOLD_SOFT}" stroke-width="1.6"/><line x1="${cx - 5}" y1="${cy - 4}" x2="${cx + 5}" y2="${cy - 4}" stroke="${GREEN}" stroke-width="1.4"/><line x1="${cx - 5}" y1="${cy + 1}" x2="${cx + 5}" y2="${cy + 1}" stroke="${GREEN}" stroke-width="1.4"/>`;
    if (kind === 'clock')
      return `<circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${GOLD_SOFT}" stroke-width="1.6"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 6}" stroke="${GREEN}" stroke-width="1.6" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${cx + 5}" y2="${cy + 2}" stroke="${GREEN}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (kind === 'shield')
      return `<path d="M${cx} ${cy - 12} L${cx + 10} ${cy - 7} V${cy + 2} C${cx + 10} ${cy + 10} ${cx} ${cy + 14} ${cx} ${cy + 14} C${cx} ${cy + 14} ${cx - 10} ${cy + 10} ${cx - 10} ${cy + 2} V${cy - 7} Z" fill="none" stroke="${GOLD_SOFT}" stroke-width="1.6"/><path d="M${cx - 4} ${cy + 1} L${cx - 1} ${cy + 4} L${cx + 5} ${cy - 3}" fill="none" stroke="${GREEN}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (kind === 'gauge')
      return `<path d="M${cx - 11} ${cy + 6} A12 12 0 1 1 ${cx + 11} ${cy + 6}" fill="none" stroke="${GOLD_SOFT}" stroke-width="1.6"/><line x1="${cx}" y1="${cy + 4}" x2="${cx + 6}" y2="${cy - 4}" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="${GOLD_SOFT}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="none" stroke="${GREEN}" stroke-width="1.4"/><line x1="${cx + 6}" y1="${cy + 6}" x2="${cx + 11}" y2="${cy + 11}" stroke="${GREEN}" stroke-width="1.6" stroke-linecap="round"/>`;
  };

  const rows = items
    .map((it, i) => {
      const y = 258 + i * 158;
      const accent = i % 2 === 0 ? GOLD : GREEN;
      return `
    <g>
      <rect x="48" y="${y}" width="${PAGE_W - 96}" height="144" rx="15" fill="#ffffff" fill-opacity="0.64" stroke="${GOLD}" stroke-opacity="0.34" stroke-width="1.35"/>
      <rect x="48" y="${y}" width="7" height="144" fill="${accent}"/>
      <!-- icon well -->
      <circle cx="108" cy="${y + 46}" r="28" fill="#0e100f"/>
      <circle cx="108" cy="${y + 46}" r="28" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.2"/>
      ${iconPath(it.icon, 108, y + 46)}
      <text x="158" y="${y + 34}" fill="${GOLD_SOFT}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.16em">${it.n}</text>
      <text x="158" y="${y + 64}" fill="${INK}" font-family="Georgia, serif" font-size="25" font-weight="700">${it.t}</text>
      <text x="158" y="${y + 92}" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="14">${it.d}</text>
      <text x="158" y="${y + 120}" fill="${GOLD_DEEP}" font-family="Inter, Arial, sans-serif" font-size="11" letter-spacing="0.16em" font-weight="700">PRIORITY ${i + 1}  ·  PARTNER REVIEW</text>
      <!-- peek rail chip -->
      <rect x="${PAGE_W - 178}" y="${y + 38}" width="108" height="68" rx="12" fill="#0e100f"/>
      <rect x="${PAGE_W - 178}" y="${y + 38}" width="108" height="2" fill="${accent}" opacity="0.85"/>
      <text x="${PAGE_W - 124}" y="${y + 70}" text-anchor="middle" fill="${GREEN}" font-size="12" font-family="Inter, Arial, sans-serif" font-weight="700" letter-spacing="0.12em">OPEN</text>
      <text x="${PAGE_W - 124}" y="${y + 90}" text-anchor="middle" fill="${GOLD_SOFT}" font-size="11" font-family="Inter, Arial, sans-serif">queue</text>
    </g>`;
    })
    .join('');

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
  <defs>
    <linearGradient id="paperB" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="${CREAM_BRIGHT}"/>
      <stop offset="100%" stop-color="${CREAM_DEEP}"/>
    </linearGradient>
    <filter id="paperGrainB">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.28  0 0 0 0 0.26  0 0 0 0 0.2  0 0 0 0.055 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#paperB)"/>
  <rect width="100%" height="100%" filter="url(#paperGrainB)" opacity="0.72"/>

  ${spreadHeader('CREDIT ANALYSIS REPORT  ·  SPREAD 3 OF 10')}

  <text x="56" y="158" fill="${INK}" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700">
    What We
  </text>
  <text x="56" y="214" fill="${GOLD_DEEP}" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-weight="700">
    Review First
  </text>
  <text x="56" y="244" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="14">
    Priority checklist — densest levers before funding optics improve.
  </text>

  ${rows}

  <!-- Luxury callout -->
  <rect x="48" y="${PAGE_H - 210}" width="${PAGE_W - 96}" height="118" rx="16" fill="#0a0c0b"/>
  <rect x="48" y="${PAGE_H - 210}" width="${PAGE_W - 96}" height="3" fill="${GOLD}" opacity="0.65"/>
  <circle cx="104" cy="${PAGE_H - 151}" r="26" fill="${GREEN}" fill-opacity="0.14" stroke="${GREEN}" stroke-width="2"/>
  <path d="M93 ${PAGE_H - 151} L101 ${PAGE_H - 143} L117 ${PAGE_H - 162}" fill="none" stroke="${GREEN}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="150" y="${PAGE_H - 172}" fill="#ffffff" font-family="Georgia, serif" font-size="24" font-weight="700">
    Challenge · Optimize · Reposition
  </text>
  <text x="150" y="${PAGE_H - 144}" fill="#c8cfc8" font-family="Inter, Arial, sans-serif" font-size="14">
    Items that fail accuracy or purpose tests can be disputed or sequenced for stronger optics.
  </text>
  <text x="150" y="${PAGE_H - 118}" fill="${GOLD_SOFT}" font-family="Inter, Arial, sans-serif" font-size="11" letter-spacing="0.1em">
    EDUCATIONAL · RESULTS VARY · FUNDING SUBJECT TO UNDERWRITING
  </text>

  <line x1="48" y1="${PAGE_H - 52}" x2="${PAGE_W - 48}" y2="${PAGE_H - 52}" stroke="${GOLD}" stroke-opacity="0.5"/>
  <text x="${PAGE_W - 48}" y="${PAGE_H - 26}" text-anchor="end" fill="${MUTED}"
    font-family="Inter, Arial, sans-serif" font-size="10">SPREAD 3 OF 10</text>
</svg>`);
}

/** Gold seal from official icon — strip dark plate so it sits cleanly on matte cover. */
async function goldSealFromIcon(icon4x, size = 56) {
  const raw = await sharp(icon4x)
    .resize({ width: size * 2, height: size * 2, fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (avg < 28 && sat < 18) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function compositeLogoOnCover(basePng, logo4x, icon4x) {
  // Readable kit logo — larger scale + intentional air under frame
  const logo = await sharp(logo4x)
    .resize({ width: 520, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const icon = await goldSealFromIcon(icon4x, 58);
  const iconMeta = await sharp(icon).metadata();

  return sharp(basePng)
    .composite([
      {
        input: logo,
        left: Math.round((COVER_W - logoMeta.width) / 2),
        top: 88,
      },
      {
        input: icon,
        left: Math.round((COVER_W - iconMeta.width) / 2),
        top: 1518,
      },
    ])
    .png()
    .toBuffer();
}

async function compositeLogoOnSpread(basePng, logo2x) {
  const logo = await sharp(logo2x)
    .resize({ width: 152, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const lm = await sharp(logo).metadata();
  const padX = 12;
  const padY = 7;
  const chipW = lm.width + padX * 2;
  const chipH = lm.height + padY * 2;
  // Soft dark chip with gold hairline — quieter than a hard plate
  const chipBg = await sharp({
    create: {
      width: chipW,
      height: chipH,
      channels: 4,
      background: { r: 12, g: 14, b: 13, alpha: 235 },
    },
  })
    .png()
    .toBuffer();

  const goldLine = await sharp(
    Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${chipW}" height="${chipH}">
  <rect x="0.5" y="0.5" width="${chipW - 1}" height="${chipH - 1}" rx="8" fill="none" stroke="#d4a447" stroke-opacity="0.45" stroke-width="1"/>
</svg>`),
  )
    .png()
    .toBuffer();

  const chip = await sharp(chipBg)
    .composite([
      { input: goldLine, left: 0, top: 0 },
      { input: logo, left: padX, top: padY },
    ])
    .png()
    .toBuffer();

  return sharp(basePng)
    .composite([{ input: chip, left: PAGE_W - chipW - 52, top: 14 }])
    .png()
    .toBuffer();
}

async function alphaStats(buf, label) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  let zero = 0;
  let soft = 0;
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ].map(([x, y]) => {
    const i = (y * w + x) * ch;
    return { x, y, a: data[i + 3], r: data[i], g: data[i + 1], b: data[i + 2] };
  });
  for (let i = 3; i < data.length; i += ch) {
    const a = data[i];
    if (a === 0) zero++;
    else if (a < 200) soft++;
  }
  return {
    label,
    size: `${w}x${h}`,
    pctTransparent: +((100 * zero) / (w * h)).toFixed(2),
    softAlpha: soft,
    corners,
    cornerAlphaZero: corners.every((c) => c.a === 0),
  };
}

async function buildFlats(kit) {
  mkdirSync(FLATS_DIR, { recursive: true });

  const coverBase = await sharp(coverSvg()).ensureAlpha().png().toBuffer();
  const cover = await compositeLogoOnCover(coverBase, kit.logo4x, kit.icon4x);
  const coverPath = path.join(FLATS_DIR, 'bc-cover.png');
  await sharp(cover).toFile(coverPath);

  const pageABase = await sharp(spreadASvg()).ensureAlpha().png().toBuffer();
  const pageA = await compositeLogoOnSpread(pageABase, kit.logo2x);
  const pageAPath = path.join(FLATS_DIR, 'bc-spread-a-snapshot.png');
  await sharp(pageA).toFile(pageAPath);

  const pageBBase = await sharp(spreadBSvg()).ensureAlpha().png().toBuffer();
  const pageB = await compositeLogoOnSpread(pageBBase, kit.logo2x);
  const pageBPath = path.join(FLATS_DIR, 'bc-spread-b-review.png');
  await sharp(pageB).toFile(pageBPath);

  return { cover, pageA, pageB, coverPath, pageAPath, pageBPath };
}

async function backupLive() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = Date.now();
  const backups = [];
  for (const p of [LIVE_PNG, LIVE_TRANSPARENT]) {
    if (!existsSync(p)) continue;
    const dest = path.join(BACKUP_DIR, `${path.basename(p, '.png')}-pre-luxury-${ts}.png`);
    copyFileSync(p, dest);
    backups.push(dest);
  }
  return backups;
}

async function writeLiveSafe(buffer, dest) {
  const tmp = `${dest}.${Date.now()}.tmp.png`;
  await sharp(buffer).png({ compressionLevel: 9, force: true }).toFile(tmp);
  try {
    if (existsSync(dest)) unlinkSync(dest);
    copyFileSync(tmp, dest);
    unlinkSync(tmp);
    return dest;
  } catch (err) {
    const alt = dest.replace(/\.png$/, '-new.png');
    copyFileSync(tmp, alt);
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    console.warn('[warn] live locked; wrote', alt, String(err?.message || err));
    return alt;
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const flatsOnly = args.has('--flats-only');

  const kit = await ensureLogoKit();
  console.log('[bc] kit ready:', KIT_DIR);

  const flats = await buildFlats(kit);
  console.log('[bc] flats:', flats.coverPath);
  console.log('           ', flats.pageAPath);
  console.log('           ', flats.pageBPath);

  if (flatsOnly) {
    console.log('[bc] flats-only — skipping composite');
    return;
  }

  const backups = await backupLive();
  console.log('[bc] backups:', backups);

  // BC-only geometry: thinner spine, fuller peeks, softer contact shadow
  const engine = new ThinBookletEngine({
    shadowOpacity: 0.36,
    shadowBlurPxAt1600: 56,
    shadowExpandBottomFrac: 0.06,
    shadowExpandXFrac: 0.045,
  });
  const result = await engine.compose({
    cover: flats.cover,
    pages: [flats.pageA, flats.pageB],
    coverHeight: 1600,
    layeredYaw: true,
    peekWidthRatio: 0.17,
    spineDepth: 0.028,
    pageHeightRatio: 0.985,
    yawDeg: -11,
  });

  const liveOut = await writeLiveSafe(result.buffer, LIVE_PNG);
  const transparentOut = await writeLiveSafe(result.buffer, LIVE_TRANSPARENT);

  const qa = await writeQaPair(result.buffer, OUT_DIR, 'bc');
  const stats = await alphaStats(result.buffer, 'bc-live');

  const warnings = [];
  if (!stats.cornerAlphaZero) warnings.push('corner alpha not zero');
  if (result.metrics.spineDepthFrac > 0.04 + 1e-6) warnings.push('spine too thick');
  if (result.metrics.pageHeightFrac < 0.96 - 1e-6) warnings.push('pages not full height');

  const report = {
    metrics: result.metrics,
    stats,
    live: liveOut,
    transparent: transparentOut,
    qa,
    flats: { cover: flats.coverPath, a: flats.pageAPath, b: flats.pageBPath },
    backups,
    warnings,
  };
  writeFileSync(path.join(FLATS_DIR, 'bc-build-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (warnings.length) {
    console.warn('[bc] QA warnings:', warnings.join('; '));
    process.exitCode = 2;
  }
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { buildFlats, main as buildBcPowerGuide };
