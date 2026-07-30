/**
 * Debt Eradication lead-magnet mockup — private-banking editorial (BC sibling craft).
 *
 * Typography + material depth. ZERO chains / broken-link / figurative clip-art.
 * Mid-cover = abstract gold geometry only (arcs · filaments · diamond rule).
 * Real logo ONLY via ensureLogoKit(). ThinBookletEngine composite.
 *
 *   node scripts/build-debt-eradication-mockup.mjs
 */
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ensureLogoKit,
  ThinBookletEngine,
  writeQaPair,
  GEOMETRY,
} from './build-lead-magnet-mockups.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_DIR = path.join(ROOT, 'public/images/lead-magnets');
const BACKUP_DIR = path.join(OUT_DIR, 'backup-before-bg-remove');
const OUT = path.join(OUT_DIR, 'debt-eradication-mockup.png');
const FLAT_DIR = path.join(OUT_DIR, '_kit');

/** Match BC craft resolution so hero scale holds detail */
const COVER_W = 1200;
const COVER_H = 1600;
const PAGE_W = 1200;
const PAGE_H = 1584; // 99% of cover H — full-height peeks

const NAVY = '#0a1628';
const NAVY_DEEP = '#030912';
const NAVY_MID = '#12263f';
const NAVY_LIFT = '#1c3658';
const NAVY_SOFT = '#243f62';
const GOLD = '#d4a447';
const GOLD_SOFT = '#e8c96a';
const GOLD_BRIGHT = '#f5e0a0';
const GOLD_DEEP = '#b8862a';
const GOLD_INK = '#8a6420';
const CREAM = '#f4efe6';
const CREAM_DEEP = '#ebe4d8';
const CREAM_BRIGHT = '#faf7f1';
const CREAM_WARM = '#e8dfd0';
const INK = '#0b1f3a';
const MUTED = '#5c615c';
const WARM_MUTED = '#8a7350';

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Dense private-banking motif — concentric arcs + gold filament field + diamond rule.
 * Never figurative. Cadence intentionally denser than prior thin-SVG pass.
 */
function geometricMotifSvg(cx, cy) {
  const arcs = [];
  for (let i = 0; i < 7; i++) {
    const r = 38 + i * 26;
    const op = 0.72 - i * 0.075;
    const sw = i === 0 ? 2.0 : i < 3 ? 1.45 : 1.05;
    arcs.push(
      `<circle cx="0" cy="0" r="${r}" fill="none" stroke="url(#motifGold)" stroke-width="${sw}" opacity="${Math.max(0.18, op)}"/>`,
    );
  }

  // Horizontal filament waves (BC-wave sibling, gold-only)
  const filaments = [];
  const specs = [
    { y: -78, amp: 28, o: 0.55, sw: 1.35 },
    { y: -48, amp: 36, o: 0.48, sw: 1.15 },
    { y: -18, amp: 22, o: 0.62, sw: 1.4 },
    { y: 18, amp: 30, o: 0.5, sw: 1.2 },
    { y: 48, amp: 38, o: 0.42, sw: 1.1 },
    { y: 78, amp: 26, o: 0.38, sw: 1.0 },
  ];
  for (let i = 0; i < specs.length; i++) {
    const { y, amp, o, sw } = specs[i];
    const phase = i * 22;
    const d = [
      `M -250 ${y}`,
      `C ${-140 + phase} ${y - amp}, ${-40} ${y + amp * 0.85}, 0 ${y - amp * 0.25}`,
      `S ${140 - phase * 0.4} ${y + amp}, 250 ${y + 2}`,
    ].join(' ');
    filaments.push(
      `<path d="${d}" fill="none" stroke="url(#motifGold)" stroke-width="${sw + 3.2}" stroke-opacity="${o * 0.16}" stroke-linecap="round"/>`,
    );
    filaments.push(
      `<path d="${d}" fill="none" stroke="url(#motifGold)" stroke-width="${sw}" stroke-opacity="${o}" stroke-linecap="round"/>`,
    );
  }

  return `
  <g transform="translate(${cx}, ${cy})">
    <defs>
      <linearGradient id="motifGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
        <stop offset="32%" stop-color="${GOLD_SOFT}"/>
        <stop offset="58%" stop-color="${GOLD}"/>
        <stop offset="100%" stop-color="${GOLD_DEEP}"/>
      </linearGradient>
      <radialGradient id="motifWash" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.16"/>
        <stop offset="45%" stop-color="${GOLD}" stop-opacity="0.055"/>
        <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="0" cy="0" r="210" fill="url(#motifWash)"/>
    ${filaments.join('\n')}
    ${arcs.join('\n')}
    <!-- diamond rule (center jewel geometry) -->
    <path d="M 0 -26 L 16 0 L 0 26 L -16 0 Z" fill="none" stroke="url(#motifGold)" stroke-width="1.7" opacity="0.95"/>
    <path d="M 0 -12 L 7.5 0 L 0 12 L -7.5 0 Z" fill="${GOLD}" opacity="0.62"/>
    <circle cx="0" cy="0" r="2.6" fill="${GOLD_BRIGHT}" opacity="0.95"/>
    <!-- diamond-rule hairlines -->
    <line x1="-195" y1="0" x2="-34" y2="0" stroke="url(#motifGold)" stroke-width="1.05" opacity="0.62"/>
    <line x1="34" y1="0" x2="195" y2="0" stroke="url(#motifGold)" stroke-width="1.05" opacity="0.62"/>
    <line x1="-10" y1="-10" x2="-28" y2="-28" stroke="${GOLD_SOFT}" stroke-width="0.8" opacity="0.45"/>
    <line x1="10" y1="-10" x2="28" y2="-28" stroke="${GOLD_SOFT}" stroke-width="0.8" opacity="0.45"/>
    <line x1="-10" y1="10" x2="-28" y2="28" stroke="${GOLD_SOFT}" stroke-width="0.8" opacity="0.45"/>
    <line x1="10" y1="10" x2="28" y2="28" stroke="${GOLD_SOFT}" stroke-width="0.8" opacity="0.45"/>
  </g>`;
}

/** Foil corner craft — L ticks + small miter diamonds */
function cornerCraft(inset = 54) {
  const len = 32;
  const pts = [
    [inset, inset, 1, 1],
    [COVER_W - inset, inset, -1, 1],
    [inset, COVER_H - inset, 1, -1],
    [COVER_W - inset, COVER_H - inset, -1, -1],
  ];
  return pts
    .map(([x, y, sx, sy]) => {
      const dx = sx * 10;
      const dy = sy * 10;
      return `
    <path d="M ${x} ${y + sy * len} L ${x} ${y} L ${x + sx * len} ${y}"
      fill="none" stroke="${GOLD_SOFT}" stroke-width="1.7" opacity="0.88"/>
    <path d="M ${x + dx} ${y + dy - sy * 5} L ${x + dx + sx * 5} ${y + dy} L ${x + dx} ${y + dy + sy * 5} L ${x + dx - sx * 5} ${y + dy} Z"
      fill="none" stroke="url(#frameGold)" stroke-width="1.1" opacity="0.75"/>`;
    })
    .join('');
}

async function renderCover(kitLogo4x) {
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_W}" height="${COVER_H}" viewBox="0 0 ${COVER_W} ${COVER_H}">
  <defs>
    <linearGradient id="coverBg" x1="0.1" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="${NAVY_SOFT}"/>
      <stop offset="28%" stop-color="${NAVY_LIFT}"/>
      <stop offset="55%" stop-color="${NAVY}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <radialGradient id="keyLight" cx="40%" cy="18%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.09"/>
      <stop offset="28%" stop-color="${GOLD}" stop-opacity="0.075"/>
      <stop offset="62%" stop-color="${NAVY_MID}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="goldWash" cx="50%" cy="44%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.15"/>
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="48%" r="72%">
      <stop offset="55%" stop-color="${NAVY_DEEP}" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000814" stop-opacity="0.45"/>
    </radialGradient>
    <linearGradient id="frameGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="28%" stop-color="${GOLD_SOFT}"/>
      <stop offset="55%" stop-color="${GOLD}"/>
      <stop offset="82%" stop-color="${GOLD_DEEP}"/>
      <stop offset="100%" stop-color="${GOLD_BRIGHT}"/>
    </linearGradient>
    <linearGradient id="titleFoil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf3e0"/>
      <stop offset="40%" stop-color="#f0e4c4"/>
      <stop offset="100%" stop-color="#d4b56a"/>
    </linearGradient>
    <linearGradient id="subFoil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="50%" stop-color="${GOLD_SOFT}"/>
      <stop offset="100%" stop-color="${GOLD_DEEP}"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CREAM_BRIGHT}"/>
      <stop offset="55%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${CREAM_WARM}"/>
    </linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.76" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.94  0 0 0 0 0.82  0 0 0 0.055 0"/>
    </filter>
    <filter id="bandGrain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.04 0"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#coverBg)"/>
  <rect width="100%" height="100%" fill="url(#keyLight)"/>
  <rect width="100%" height="100%" fill="url(#goldWash)"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.62"/>

  <!-- Foil gold double frame -->
  <rect x="32" y="32" width="${COVER_W - 64}" height="${COVER_H - 64}" fill="none" stroke="url(#frameGold)" stroke-width="3.2"/>
  <rect x="46" y="46" width="${COVER_W - 92}" height="${COVER_H - 92}" fill="none" stroke="${GOLD_SOFT}" stroke-width="1.15" opacity="0.55"/>
  ${cornerCraft(56)}

  <!-- Logo reserved (composited) — eyebrow below -->
  <line x1="300" y1="292" x2="430" y2="292" stroke="url(#frameGold)" stroke-width="1.15" opacity="0.8"/>
  <line x1="770" y1="292" x2="900" y2="292" stroke="url(#frameGold)" stroke-width="1.15" opacity="0.8"/>
  <text x="${COVER_W / 2}" y="297" text-anchor="middle" fill="${GOLD_SOFT}"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="13.5" font-weight="600"
    letter-spacing="0.34em">DEBT RESPONSE BRIEF</text>

  <!-- Published title hierarchy — foil cream / foil gold -->
  <text x="${COVER_W / 2}" y="400" text-anchor="middle" fill="url(#titleFoil)"
    font-family="Georgia, 'Playfair Display', 'Times New Roman', serif"
    font-size="72" font-weight="700">Eradicate the Debt</text>
  <line x1="390" y1="432" x2="810" y2="432" stroke="url(#frameGold)" stroke-width="1.35" opacity="0.78"/>
  <text x="${COVER_W / 2}" y="500" text-anchor="middle" fill="url(#subFoil)"
    font-family="Georgia, 'Playfair Display', 'Times New Roman', serif"
    font-size="44" letter-spacing="0.03em"
    stroke="${GOLD_DEEP}" stroke-width="0.55" paint-order="stroke fill">Reclaim Your Future</text>
  <text x="${COVER_W / 2}" y="552" text-anchor="middle" fill="#c8d0dc" opacity="0.9"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="17.5" font-weight="300">
    A structured partner playbook from summons to response
  </text>
  <text x="${COVER_W / 2}" y="586" text-anchor="middle" fill="${GOLD}" opacity="0.78"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="12.5" font-weight="600"
    letter-spacing="0.22em">PARTNER CLARITY PLAYBOOK</text>

  ${geometricMotifSvg(COVER_W / 2, 820)}

  <!-- Cream lower band — paper depth, no FREE spam -->
  <rect x="46" y="1148" width="${COVER_W - 92}" height="${COVER_H - 1148 - 46}" fill="url(#band)"/>
  <rect x="46" y="1148" width="${COVER_W - 92}" height="${COVER_H - 1148 - 46}" filter="url(#bandGrain)" opacity="0.55"/>
  <line x1="46" y1="1148" x2="${COVER_W - 46}" y2="1148" stroke="url(#frameGold)" stroke-width="2.2"/>
  <line x1="46" y1="1152" x2="${COVER_W - 46}" y2="1152" stroke="${GOLD_SOFT}" stroke-width="0.7" opacity="0.45"/>
  <rect x="46" y="1148" width="8" height="${COVER_H - 1148 - 46}" fill="url(#frameGold)" opacity="0.85"/>

  <text x="88" y="1224" fill="${INK}"
    font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="700">Your step-by-step legal defense</text>
  <text x="88" y="1260" fill="${INK}"
    font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="700">against debt collectors</text>
  <text x="88" y="1308" fill="${MUTED}"
    font-family="Inter, Arial, sans-serif" font-size="14.5">Partner clarity · summons to response · not legal advice</text>
  <text x="88" y="1348" fill="${WARM_MUTED}"
    font-family="Inter, Arial, sans-serif" font-size="13.5" letter-spacing="0.1em" font-weight="600">VALIDATION  ·  STANDING  ·  STRUCTURED NEXT MOVES</text>

  <!-- Single subtle chip (not FREE spam) -->
  <g transform="translate(980, 1288)">
    <rect x="0" y="0" width="148" height="44" rx="8" fill="${INK}" stroke="url(#frameGold)" stroke-width="1.4"/>
    <text x="74" y="28" text-anchor="middle" fill="${GOLD_SOFT}"
      font-family="Inter, Arial, sans-serif" font-size="12" letter-spacing="0.16em" font-weight="700">E-GUIDE</text>
  </g>

  <text x="${COVER_W / 2}" y="1528" text-anchor="middle" fill="${GOLD_SOFT}" opacity="0.9"
    font-family="Inter, Segoe UI, Arial, sans-serif" font-size="14.5" font-weight="500"
    letter-spacing="0.24em">KNOWLEDGE. ACTION. CLARITY.</text>
</svg>`);

  const base = await sharp(svg).ensureAlpha().png().toBuffer();
  const logo = await sharp(kitLogo4x)
    .resize({ width: Math.round(COVER_W * 0.34), kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  return sharp(base)
    .composite([
      {
        input: logo,
        left: Math.round((COVER_W - logoMeta.width) / 2),
        top: 92,
      },
    ])
    .png()
    .toBuffer();
}

/** Summons Snapshot — dense cream editorial; right rail peeks at ~18%. */
async function renderSummonsSnapshot(kitIcon2x) {
  const rows = [
    {
      h: 'What it is',
      s: 'A court notice that starts a lawsuit against you as the partner named.',
      tag: 'NOTICE',
      detail: 'Confirm plaintiff · case number · service date on the face page.',
    },
    {
      h: 'Why it matters',
      s: 'Ignoring it can open a path to default judgment and wage pressure.',
      tag: 'RISK',
      detail: 'Calendar the response window the day the papers arrive.',
    },
    {
      h: 'Key deadline',
      s: 'Typical response window: 20–30 days from service — confirm your docket.',
      tag: 'CLOCK',
      detail: 'State rules vary · never assume the longest window.',
    },
    {
      h: 'Proof to gather',
      s: 'Summons · complaint · statements · collector letters · ownership trail.',
      tag: 'DOCS',
      detail: 'Organize a single evidence folder before drafting a response.',
    },
  ];

  const mainW = PAGE_W - 80 - 236;
  const rowHtml = rows
    .map((r, i) => {
      const y = 248 + i * 204;
      return `
      <g transform="translate(48, ${y})">
        <rect x="2" y="4" width="${mainW}" height="178" rx="14" fill="${INK}" fill-opacity="0.06"/>
        <rect x="0" y="0" width="${mainW}" height="178" rx="14" fill="#ffffff" fill-opacity="0.78" stroke="url(#foilStroke)" stroke-opacity="0.55" stroke-width="1.5"/>
        <rect x="0" y="0" width="11" height="178" rx="3" fill="url(#foilStroke)"/>
        <circle cx="66" cy="52" r="30" fill="${INK}" stroke="${GOLD}" stroke-width="1.4"/>
        <text x="66" y="60" text-anchor="middle" fill="${GOLD_SOFT}" font-size="20" font-family="Georgia, serif" font-weight="700">${i + 1}</text>
        <text x="114" y="44" fill="${INK}" font-size="29" font-family="Georgia, 'Times New Roman', serif" font-weight="700">${esc(r.h)}</text>
        <rect x="${mainW - 122}" y="22" width="100" height="30" rx="8" fill="${INK}"/>
        <text x="${mainW - 72}" y="42" text-anchor="middle" fill="${GOLD_SOFT}" font-size="11.5" font-family="Inter, Arial, sans-serif" font-weight="700" letter-spacing="0.14em">${esc(r.tag)}</text>
        <text x="114" y="80" fill="${MUTED}" font-size="16" font-family="Inter, Arial, sans-serif">${esc(r.s)}</text>
        <line x1="114" y1="102" x2="${mainW - 28}" y2="102" stroke="${GOLD}" stroke-opacity="0.28"/>
        <text x="114" y="130" fill="${WARM_MUTED}" font-size="14" font-family="Inter, Arial, sans-serif">${esc(r.detail)}</text>
        <text x="114" y="160" fill="${INK}" font-size="12" font-family="Inter, Arial, sans-serif" font-weight="600" letter-spacing="0.1em" opacity="0.72">PARTNER ACTION  ·  DOCUMENT  ·  CONFIRM</text>
      </g>`;
    })
    .join('');

  const railItems = [
    { label: 'Service date', hint: 'From summons face', sample: 'MM / DD / YYYY' },
    { label: 'Plaintiff', hint: 'Named party', sample: 'Creditor / assignee' },
    { label: 'Amount claimed', hint: 'Complaint total', sample: '$ — — —' },
    { label: 'Court / venue', hint: 'County · division', sample: 'County court' },
    { label: 'Response due', hint: 'Calendar this', sample: 'Day 20–30' },
  ];
  const railHtml = railItems
    .map((item, i) => {
      const y = 248 + i * 170;
      return `
      <g transform="translate(${PAGE_W - 260}, ${y})">
        <rect x="2" y="3" width="208" height="152" rx="14" fill="${INK}" fill-opacity="0.07"/>
        <rect x="0" y="0" width="208" height="152" rx="14" fill="#ffffff" fill-opacity="0.84" stroke="${GOLD}" stroke-opacity="0.48" stroke-width="1.4"/>
        <rect x="0" y="0" width="208" height="40" rx="14" fill="${INK}"/>
        <rect x="0" y="24" width="208" height="16" fill="${INK}"/>
        <text x="104" y="26" text-anchor="middle" fill="${GOLD_SOFT}" font-size="11.5" font-family="Inter, Arial, sans-serif" letter-spacing="0.14em" font-weight="700">${esc(item.label.toUpperCase())}</text>
        <text x="18" y="72" fill="${INK}" font-size="18" font-family="Georgia, 'Times New Roman', serif" font-weight="700">${esc(item.sample)}</text>
        <line x1="18" y1="86" x2="190" y2="86" stroke="${GOLD}" stroke-opacity="0.35"/>
        <rect x="18" y="100" width="172" height="10" rx="3" fill="${CREAM_DEEP}"/>
        <text x="18" y="132" fill="${WARM_MUTED}" font-size="12.5" font-family="Inter, Arial, sans-serif">${esc(item.hint)}</text>
      </g>`;
    })
    .join('');

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0.15" y2="1">
      <stop offset="0%" stop-color="${CREAM_BRIGHT}"/>
      <stop offset="55%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${CREAM_DEEP}"/>
    </linearGradient>
    <linearGradient id="foilStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="45%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DEEP}"/>
    </linearGradient>
    <filter id="paperGrain">
      <feTurbulence type="fractalNoise" baseFrequency="1.0" numOctaves="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.28  0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0.045 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#paper)"/>
  <rect width="100%" height="100%" filter="url(#paperGrain)" opacity="0.7"/>

  <rect x="0" y="0" width="100%" height="76" fill="${CREAM_DEEP}" opacity="0.95"/>
  <text x="48" y="46" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="0.18em" font-weight="600">FINELY CRED  ·  DEBT RESPONSE BRIEF</text>
  <text x="${PAGE_W - 48}" y="46" text-anchor="end" fill="${WARM_MUTED}" font-family="Inter, Arial, sans-serif" font-size="12" letter-spacing="0.14em" font-weight="700">SPREAD 1 OF 2</text>
  <line x1="48" y1="76" x2="${PAGE_W - 48}" y2="76" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="32" y="92" width="${PAGE_W - 64}" height="${PAGE_H - 120}" fill="none" stroke="${GOLD}" stroke-opacity="0.4" stroke-width="1.6"/>

  <text x="56" y="152" fill="${INK}" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-weight="700">Summons Snapshot</text>
  <text x="56" y="192" fill="#6a5a42" font-family="Inter, Arial, sans-serif" font-size="17">What is on the table — calm urgency for partners</text>
  <line x1="56" y1="216" x2="${PAGE_W - 56}" y2="216" stroke="url(#foilStroke)" stroke-opacity="0.65" stroke-width="1.7"/>

  ${rowHtml}
  ${railHtml}

  <rect x="48" y="${PAGE_H - 118}" width="${PAGE_W - 96}" height="76" rx="12" fill="${INK}"/>
  <rect x="48" y="${PAGE_H - 118}" width="8" height="76" rx="2" fill="${GOLD}"/>
  <text x="76" y="${PAGE_H - 80}" fill="${GOLD}" font-family="Inter, Arial, sans-serif" font-size="13.5" font-weight="700" letter-spacing="0.12em">ACT FAST  ·  DO NOT IGNORE</text>
  <text x="76" y="${PAGE_H - 54}" fill="${CREAM}" font-family="Inter, Arial, sans-serif" font-size="14">Results vary · educational guide · not legal advice</text>
</svg>`);

  const base = await sharp(svg).ensureAlpha().png().toBuffer();
  const icon = await sharp(kitIcon2x).resize({ width: 42 }).png().toBuffer();
  return sharp(base)
    .composite([{ input: icon, left: PAGE_W - 108, top: 108 }])
    .png()
    .toBuffer();
}

/** Response Path — numbered editorial steps + peek-side gate cards. */
async function renderResponsePath(kitIcon2x) {
  const steps = [
    {
      h: 'Verify the debt',
      s: 'Match amounts, names, and ownership before you respond.',
      n: '01',
      chip: 'VALIDATE',
      note: 'Ownership trail · amount match · name accuracy',
    },
    {
      h: 'Draft your response',
      s: 'Timely · factual · documented — structure beats panic.',
      n: '02',
      chip: 'RESPOND',
      note: 'Answer · affirmative defenses · proof packet',
    },
    {
      h: 'Prepare your defense',
      s: 'Standing, amount, and ownership gaps in plain English.',
      n: '03',
      chip: 'DEFEND',
      note: 'Standing · validation · discovery readiness',
    },
    {
      h: 'Protect next moves',
      s: 'Settlement pressure, credit rebuild, and cash-flow reset.',
      n: '04',
      chip: 'PROTECT',
      note: 'Settlement · credit · cash-flow plan',
    },
  ];

  const stepMainW = PAGE_W - 80 - 220;
  const stepHtml = steps
    .map((r, i) => {
      const y = 248 + i * 214;
      const gateX = PAGE_W - 80 - 188;
      return `
      <g transform="translate(48, ${y})">
        <rect x="2" y="4" width="${stepMainW}" height="188" rx="14" fill="${INK}" fill-opacity="0.06"/>
        <rect x="0" y="0" width="${stepMainW}" height="188" rx="14" fill="#ffffff" fill-opacity="0.78" stroke="${GOLD}" stroke-opacity="0.42" stroke-width="1.4"/>
        <circle cx="58" cy="58" r="36" fill="${INK}" stroke="${GOLD}" stroke-width="1.5"/>
        <text x="58" y="66" text-anchor="middle" fill="${GOLD_SOFT}" font-size="21" font-family="Georgia, serif" font-weight="700">${r.n}</text>
        <text x="116" y="50" fill="${INK}" font-size="31" font-family="Georgia, 'Times New Roman', serif" font-weight="700">${esc(r.h)}</text>
        <text x="116" y="88" fill="${MUTED}" font-size="17" font-family="Inter, Arial, sans-serif">${esc(r.s)}</text>
        <rect x="116" y="110" width="280" height="26" rx="7" fill="${CREAM_DEEP}" stroke="${GOLD}" stroke-opacity="0.25"/>
        <text x="128" y="128" fill="${WARM_MUTED}" font-size="11.5" font-family="Inter, Arial, sans-serif" font-weight="700" letter-spacing="0.1em">CHECKLIST  ·  EVIDENCE  ·  NEXT</text>
        <text x="116" y="164" fill="${INK}" font-size="13.5" font-family="Inter, Arial, sans-serif" opacity="0.7">${esc(r.note)}</text>

        <!-- peek-side gate card -->
        <rect x="${gateX + 2}" y="20" width="172" height="152" rx="14" fill="#000814" opacity="0.35"/>
        <rect x="${gateX}" y="16" width="172" height="156" rx="14" fill="${NAVY_MID}"/>
        <rect x="${gateX}" y="16" width="172" height="5" fill="url(#foilGate)"/>
        <text x="${gateX + 86}" y="60" text-anchor="middle" fill="${GOLD_SOFT}" font-size="11.5" font-family="Inter, Arial, sans-serif" letter-spacing="0.16em" font-weight="700">GATE ${r.n}</text>
        <text x="${gateX + 86}" y="100" text-anchor="middle" fill="#f7f1e8" font-size="22" font-family="Georgia, serif" font-weight="700">${esc(r.chip)}</text>
        <line x1="${gateX + 28}" y1="118" x2="${gateX + 144}" y2="118" stroke="${GOLD}" stroke-opacity="0.45"/>
        <text x="${gateX + 86}" y="146" text-anchor="middle" fill="#a8b0bc" font-size="12.5" font-family="Inter, Arial, sans-serif">partner path</text>
      </g>`;
    })
    .join('');

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
  <defs>
    <linearGradient id="paperB" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${CREAM_BRIGHT}"/>
      <stop offset="100%" stop-color="${CREAM_DEEP}"/>
    </linearGradient>
    <linearGradient id="foilGate" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD_DEEP}"/>
      <stop offset="45%" stop-color="${GOLD_SOFT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
    <filter id="paperGrainB">
      <feTurbulence type="fractalNoise" baseFrequency="1.0" numOctaves="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.28  0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0.045 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#paperB)"/>
  <rect width="100%" height="100%" filter="url(#paperGrainB)" opacity="0.7"/>

  <rect x="0" y="0" width="100%" height="76" fill="${CREAM_DEEP}" opacity="0.95"/>
  <text x="48" y="46" fill="${MUTED}" font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="0.18em" font-weight="600">FINELY CRED  ·  PARTNER PLAYBOOK</text>
  <text x="${PAGE_W - 48}" y="46" text-anchor="end" fill="${WARM_MUTED}" font-family="Inter, Arial, sans-serif" font-size="12" letter-spacing="0.14em" font-weight="700">SPREAD 2 OF 2</text>
  <line x1="48" y1="76" x2="${PAGE_W - 48}" y2="76" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="32" y="92" width="${PAGE_W - 64}" height="${PAGE_H - 120}" fill="none" stroke="${GOLD}" stroke-opacity="0.4" stroke-width="1.6"/>

  <text x="56" y="152" fill="${INK}" font-family="Georgia, 'Times New Roman', serif" font-size="50" font-weight="700">Response Path</text>
  <text x="56" y="192" fill="#6a5a42" font-family="Inter, Arial, sans-serif" font-size="17">From summons pressure to structured control</text>
  <line x1="56" y1="216" x2="${PAGE_W - 56}" y2="216" stroke="${GOLD}" stroke-opacity="0.6" stroke-width="1.7"/>

  ${stepHtml}

  <rect x="48" y="${PAGE_H - 128}" width="${PAGE_W - 96}" height="86" rx="12" fill="${INK}"/>
  <rect x="48" y="${PAGE_H - 128}" width="8" height="86" rx="2" fill="${GOLD}"/>
  <text x="76" y="${PAGE_H - 88}" fill="${GOLD}" font-family="Inter, Arial, sans-serif" font-size="13.5" font-weight="700" letter-spacing="0.12em">KNOWLEDGE  ·  ACTION  ·  CLARITY</text>
  <text x="76" y="${PAGE_H - 58}" fill="${CREAM}" font-family="Inter, Arial, sans-serif" font-size="14">Organize evidence · answer with structure · results vary · not legal advice</text>
</svg>`);

  const base = await sharp(svg).ensureAlpha().png().toBuffer();
  const icon = await sharp(kitIcon2x).resize({ width: 42 }).png().toBuffer();
  return sharp(base)
    .composite([{ input: icon, left: PAGE_W - 108, top: 108 }])
    .png()
    .toBuffer();
}

async function alphaStats(buf, label) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ].map(([x, y]) => data[(y * w + x) * ch + 3]);
  let opaque = 0;
  let zero = 0;
  let soft = 0;
  for (let i = 3; i < data.length; i += ch) {
    const a = data[i];
    if (a === 0) zero++;
    else if (a < 200) soft++;
    if (a > 10) opaque++;
  }
  return {
    label,
    size: `${w}x${h}`,
    cornersAlpha: corners,
    cornersAllZero: corners.every((a) => a === 0),
    opaque,
    zero,
    soft,
    pctTransparent: +((100 * zero) / (w * h)).toFixed(2),
  };
}

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  mkdirSync(FLAT_DIR, { recursive: true });

  if (existsSync(OUT)) {
    const backup = path.join(BACKUP_DIR, `debt-eradication-mockup-pre-luxury-${Date.now()}.png`);
    copyFileSync(OUT, backup);
    console.log('[backup]', backup);
  }

  const kit = await ensureLogoKit();
  console.log('[kit] logo4x', kit.logo4x, 'icon2x', kit.icon2x);

  const cover = await renderCover(kit.logo4x);
  const pageA = await renderSummonsSnapshot(kit.icon2x);
  const pageB = await renderResponsePath(kit.icon2x);

  const coverFlat = path.join(FLAT_DIR, '_debt-cover-flat.png');
  const pageAFlat = path.join(FLAT_DIR, '_debt-spread-summons.png');
  const pageBFlat = path.join(FLAT_DIR, '_debt-spread-response.png');
  await sharp(cover).png({ compressionLevel: 9, force: true }).toFile(coverFlat);
  await sharp(pageA).png({ compressionLevel: 9, force: true }).toFile(pageAFlat);
  await sharp(pageB).png({ compressionLevel: 9, force: true }).toFile(pageBFlat);

  const engine = new ThinBookletEngine({
    page2RightExtra: 0.058,
    page2UpExtra: 0.036,
    page1UpExtra: 0.018,
    shadowOpacity: 0.42,
  });
  const result = await engine.compose({
    cover,
    pages: [pageA, pageB],
    coverHeight: GEOMETRY.defaultCoverHeight,
    navySpine: true,
    layeredYaw: true,
    peekWidthRatio: 0.18,
    pageHeightRatio: 0.99,
    spineDepth: 0.032,
    yawDeg: -11.5,
    marginRatio: 0.034,
  });

  const tmpOut = path.join(OUT_DIR, `debt-eradication-mockup.${Date.now()}.tmp.png`);
  await sharp(result.buffer).png({ compressionLevel: 9, force: true }).toFile(tmpOut);
  let outPath = OUT;
  try {
    if (existsSync(OUT)) unlinkSync(OUT);
    copyFileSync(tmpOut, OUT);
  } catch (err) {
    const alt = path.join(OUT_DIR, 'debt-eradication-mockup-new.png');
    copyFileSync(tmpOut, alt);
    outPath = alt;
    console.warn('[warn] live OUT locked; wrote', alt, String(err?.message || err));
  }
  try {
    unlinkSync(tmpOut);
  } catch {
    /* ignore */
  }

  const qa = await writeQaPair(result.buffer, OUT_DIR, 'debt');
  const stats = await alphaStats(result.buffer, 'debt-eradication-mockup');

  const warnings = [];
  if (!stats.cornersAllZero) warnings.push('corner alpha not zero');
  if (result.metrics.spineDepthFrac > 0.04 + 1e-6) warnings.push('spine too thick');
  if (result.metrics.pageHeightFrac < 0.96 - 1e-6) warnings.push('pages not full height');

  console.log(
    JSON.stringify(
      {
        out: outPath,
        qa,
        flats: { cover: coverFlat, summons: pageAFlat, response: pageBFlat },
        metrics: result.metrics,
        alpha: stats,
        warnings,
        chainMetaphor: 'REMOVED',
        freeBadgeSpam: 'REMOVED — subtle E-GUIDE chip only',
      },
      null,
      2,
    ),
  );
  if (warnings.length) {
    console.warn('[debt] QA warnings:', warnings.join('; '));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
