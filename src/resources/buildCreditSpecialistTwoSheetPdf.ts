/**
 * Credit Specialist Two-Sheet Playbook — two-page premium PDF companion to the free e-guide.
 *
 * Sheet 1: offer clarity, who it is for, honest earnings path, 3-lead / 30-day window, how join works.
 * Sheet 2: weekly operating rhythm, escalation ladder, partner conversation tips, toolkit checklist, next step.
 *
 * Educational positioning only. Keep bands are not income projections.
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

const W = 612;
const H = 792;
const M = 30;
const CONTENT_W = W - M * 2;
const FOOTER_H = 34;

const NAVY = rgb(0.02, 0.04, 0.08);
const INK = rgb(0.05, 0.07, 0.11);
const PANEL = rgb(0.075, 0.1, 0.16);
const PANEL_HEAD = rgb(0.1, 0.13, 0.2);
const ROW_ALT = rgb(0.06, 0.08, 0.13);
const PANEL_EDGE = rgb(0.2, 0.24, 0.32);
const RULE = rgb(0.18, 0.21, 0.28);

const WHITE = rgb(1, 1, 1);
const WHITE_SOFT = rgb(0.9, 0.92, 0.95);
const MUTED = rgb(0.71, 0.74, 0.79);
const DIM = rgb(0.5, 0.53, 0.58);

const GOLD = rgb(0.83, 0.64, 0.28);
const GOLD_SOFT = rgb(0.94, 0.8, 0.46);
const LIME = rgb(0.58, 0.88, 0.0);
const SKY = rgb(0.49, 0.83, 0.99);
const ROSE = rgb(0.98, 0.44, 0.52);
const VIOLET = rgb(0.68, 0.58, 0.99);

const COMPLIANCE =
  'Results vary - not legal advice - funding subject to underwriting - income not guaranteed - educational material only.';

export const CREDIT_SPECIALIST_TWO_SHEET = {
  id: 'credit_specialist_two_sheet_playbook',
  title: 'Credit Specialist Two-Sheet Playbook',
  shortLabel: '2-sheet playbook',
  downloadLabel: 'Download 2-sheet playbook',
  filename: 'finely-cred-credit-specialist-two-sheet-playbook.pdf',
  eyebrow: 'FINELY CRED - CREDIT SPECIALIST - TWO-SHEET PLAYBOOK',
  summary:
    'Two-page companion to the free e-guide: sheet one covers the offer, who it fits, the honest earnings path, and how joining works. Sheet two is the operating sheet - weekly rhythm, escalation ladder, partner language, and the file checklist.',
  guidePath: '/credit-specialist-guide',
  readPath: '/credit-specialist-guide/read',
  pricingPath: '/credit-specialist',
  joinPath: '/credit-specialist/join',
} as const;

type Fonts = { regular: PDFFont; bold: PDFFont };

function pdfSafe(s: string): string {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[·•]/g, ' | ')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/…/g, '...')
    .replace(/©/g, '(c)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+\|\s+/g, ' | ')
    .replace(/\s{2,}/g, ' ');
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let row = '';
  for (const word of words) {
    const test = row ? `${row} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (row) lines.push(row);
      row = word;
    } else {
      row = test;
    }
  }
  if (row) lines.push(row);
  return lines;
}

type TextBlockOpts = {
  x: number;
  y: number;
  size: number;
  maxW: number;
  color: RGB;
  lineGap?: number;
  maxLines?: number;
};

/** `y` is the TOP of the text block. Returns the bottom edge of the last line. */
function textBlock(page: PDFPage, font: PDFFont, text: string, o: TextBlockOpts): number {
  const gap = o.lineGap ?? o.size + 2.8;
  const all = wrap(font, text, o.size, o.maxW);
  const lines = o.maxLines ? all.slice(0, o.maxLines) : all;
  let baseline = o.y - o.size;
  for (const line of lines) {
    page.drawText(line, { x: o.x, y: baseline, size: o.size, font, color: o.color });
    baseline -= gap;
  }
  return baseline + gap - o.size * 0.28;
}

function measureBlockHeight(font: PDFFont, text: string, size: number, maxW: number, maxLines?: number): number {
  const gap = size + 2.8;
  const all = wrap(font, text, size, maxW);
  const n = Math.max(1, maxLines ? Math.min(all.length, maxLines) : all.length);
  return size + (n - 1) * gap + size * 0.28;
}

function drawSectionHeader(
  page: PDFPage,
  fonts: Fonts,
  o: { x: number; y: number; w: number; label: string; accent: RGB; hint?: string },
): number {
  page.drawRectangle({ x: o.x, y: o.y - 9.5, width: 3, height: 9.5, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: o.x + 9, y: o.y - 8.5, size: 8.5, font: fonts.bold, color: GOLD_SOFT });
  if (o.hint) {
    const hint = pdfSafe(o.hint);
    const hw = fonts.regular.widthOfTextAtSize(hint, 6.8);
    page.drawText(hint, { x: o.x + o.w - hw, y: o.y - 8, size: 6.8, font: fonts.regular, color: DIM });
  }
  page.drawRectangle({ x: o.x, y: o.y - 15, width: o.w, height: 0.6, color: RULE });
  return o.y - 22;
}

function drawBullets(
  page: PDFPage,
  fonts: Fonts,
  o: {
    x: number;
    y: number;
    w: number;
    items: readonly string[];
    accent: RGB;
    size?: number;
    color?: RGB;
    maxLines?: number;
    gap?: number;
  },
): number {
  const size = o.size ?? 7.5;
  let y = o.y;
  for (const item of o.items) {
    page.drawRectangle({ x: o.x, y: y - size + 1.4, width: 3, height: 3, color: o.accent });
    y = textBlock(page, fonts.regular, item, {
      x: o.x + 9,
      y,
      size,
      maxW: o.w - 9,
      color: o.color ?? MUTED,
      maxLines: o.maxLines ?? 3,
    });
    y -= o.gap ?? 4.5;
  }
  return y;
}

function drawNumbered(
  page: PDFPage,
  fonts: Fonts,
  o: { x: number; y: number; w: number; items: readonly string[]; accent: RGB; size?: number; gap?: number },
): number {
  const size = o.size ?? 7.5;
  let y = o.y;
  o.items.forEach((item, i) => {
    page.drawRectangle({ x: o.x, y: y - size - 1.5, width: 12, height: size + 3.5, color: PANEL_HEAD });
    page.drawText(String(i + 1), {
      x: o.x + 4.4,
      y: y - size + 0.6,
      size: size - 0.6,
      font: fonts.bold,
      color: o.accent,
    });
    y = textBlock(page, fonts.regular, item, {
      x: o.x + 18,
      y,
      size,
      maxW: o.w - 18,
      color: MUTED,
      maxLines: 2,
    });
    y -= o.gap ?? 5;
  });
  return y;
}

function drawChecklist(
  page: PDFPage,
  fonts: Fonts,
  o: { x: number; y: number; w: number; items: readonly string[]; accent: RGB; cols?: number; size?: number },
): number {
  const size = o.size ?? 7.4;
  const cols = o.cols ?? 2;
  const gutter = 14;
  const colW = (o.w - gutter * (cols - 1)) / cols;
  const rowH = 17.5;
  const rows = Math.ceil(o.items.length / cols);
  o.items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = o.x + col * (colW + gutter);
    const y = o.y - row * rowH;
    page.drawRectangle({
      x,
      y: y - 8,
      width: 7.5,
      height: 7.5,
      borderColor: o.accent,
      borderWidth: 0.9,
    });
    textBlock(page, fonts.regular, item, {
      x: x + 12.5,
      y: y - 0.5,
      size,
      maxW: colW - 12.5,
      color: MUTED,
      maxLines: 1,
    });
  });
  return o.y - rows * rowH + 3;
}

type TableCol = { label: string; width: number };

function drawTable(
  page: PDFPage,
  fonts: Fonts,
  o: { x: number; y: number; w: number; cols: TableCol[]; rows: string[][]; accent: RGB; size?: number },
): number {
  const size = o.size ?? 7.3;
  const lineGap = size + 2.6;
  const padX = 8;
  const headH = 16;
  let y = o.y;

  page.drawRectangle({ x: o.x, y: y - headH, width: o.w, height: headH, color: PANEL_HEAD });
  let hx = o.x;
  for (const col of o.cols) {
    page.drawText(pdfSafe(col.label), {
      x: hx + padX,
      y: y - 11,
      size: 6.6,
      font: fonts.bold,
      color: o.accent,
    });
    hx += col.width;
  }
  y -= headH;
  page.drawRectangle({ x: o.x, y: y - 1, width: o.w, height: 1, color: o.accent });

  o.rows.forEach((row, ri) => {
    const lineCounts = row.map((cell, i) =>
      Math.min(2, wrap(fonts.regular, cell, size, (o.cols[i]?.width ?? 100) - padX * 2).length),
    );
    const rowLines = Math.max(1, ...lineCounts);
    const rowH = 8 + rowLines * lineGap;
    if (ri % 2 === 1) {
      page.drawRectangle({ x: o.x, y: y - rowH, width: o.w, height: rowH, color: ROW_ALT });
    }
    let cx = o.x;
    row.forEach((cell, i) => {
      const col = o.cols[i];
      if (!col) return;
      textBlock(page, i === 0 ? fonts.bold : fonts.regular, cell, {
        x: cx + padX,
        y: y - 4,
        size,
        maxW: col.width - padX * 2,
        color: i === 0 ? WHITE_SOFT : MUTED,
        lineGap,
        maxLines: 2,
      });
      cx += col.width;
    });
    y -= rowH;
  });

  page.drawRectangle({ x: o.x, y, width: o.w, height: o.y - y, borderColor: PANEL_EDGE, borderWidth: 0.8 });
  return y;
}

function drawCallout(
  page: PDFPage,
  fonts: Fonts,
  o: { x: number; y: number; w: number; label: string; body: string; accent: RGB; size?: number },
): number {
  const size = o.size ?? 7.3;
  const innerW = o.w - 26;
  const bodyH = measureBlockHeight(fonts.regular, o.body, size, innerW);
  const h = 15 + bodyH + 11;
  page.drawRectangle({ x: o.x, y: o.y - h, width: o.w, height: h, color: PANEL, borderColor: o.accent, borderWidth: 0.9 });
  page.drawRectangle({ x: o.x, y: o.y - h, width: 3.5, height: h, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: o.x + 14, y: o.y - 13, size: 6.8, font: fonts.bold, color: o.accent });
  textBlock(page, fonts.regular, o.body, {
    x: o.x + 14,
    y: o.y - 17,
    size,
    maxW: innerW,
    color: MUTED,
  });
  return o.y - h;
}

function drawScriptPanel(
  page: PDFPage,
  fonts: Fonts,
  o: { x: number; y: number; w: number; h: number; title: string; items: readonly string[]; accent: RGB },
) {
  page.drawRectangle({
    x: o.x,
    y: o.y - o.h,
    width: o.w,
    height: o.h,
    color: PANEL,
    borderColor: PANEL_EDGE,
    borderWidth: 0.8,
  });
  page.drawRectangle({ x: o.x, y: o.y - 3.5, width: o.w, height: 3.5, color: o.accent });
  page.drawText(pdfSafe(o.title), { x: o.x + 11, y: o.y - 19, size: 7.4, font: fonts.bold, color: o.accent });
  drawBullets(page, fonts, {
    x: o.x + 11,
    y: o.y - 26,
    w: o.w - 22,
    items: o.items,
    accent: o.accent,
    size: 7.1,
    maxLines: 2,
    gap: 4,
  });
}

function drawFooter(page: PDFPage, fonts: Fonts, sheetLabel: string) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: INK });
  page.drawRectangle({ x: 0, y: FOOTER_H - 1.6, width: W, height: 1.6, color: GOLD });
  page.drawText(pdfSafe(COMPLIANCE), { x: M, y: 19, size: 6.2, font: fonts.regular, color: DIM });
  page.drawText(pdfSafe('FINELY CRED - Credit Specialist partner materials'), {
    x: M,
    y: 8,
    size: 6.4,
    font: fonts.regular,
    color: DIM,
  });
  const label = pdfSafe(sheetLabel);
  const lw = fonts.bold.widthOfTextAtSize(label, 7);
  page.drawText(label, { x: W - M - lw, y: 8, size: 7, font: fonts.bold, color: GOLD });
}

/* ── Sheet 1 ─────────────────────────────────────────────────────────── */

function drawSheetOne(page: PDFPage, fonts: Fonts) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });

  // Hero band
  const heroH = 118;
  page.drawRectangle({ x: 0, y: H - heroH, width: W, height: heroH, color: INK });
  page.drawRectangle({ x: 0, y: H - heroH - 3.5, width: W, height: 3.5, color: GOLD });
  page.drawText(pdfSafe(CREDIT_SPECIALIST_TWO_SHEET.eyebrow), {
    x: M,
    y: H - 26,
    size: 7.6,
    font: fonts.bold,
    color: LIME,
  });
  page.drawText(pdfSafe('The Credit Specialist Playbook'), {
    x: M,
    y: H - 52,
    size: 21,
    font: fonts.bold,
    color: WHITE,
  });
  page.drawText(pdfSafe('Sheet 1 of 2 - The offer, in plain English'), {
    x: M,
    y: H - 70,
    size: 9.5,
    font: fonts.bold,
    color: GOLD_SOFT,
  });
  textBlock(
    page,
    fonts.regular,
    'Everything a prospective Credit Specialist should know before joining: who this fits, what you actually do all week, what you can and cannot expect to earn, and the exact path from reading the free e-guide to running your first partner file.',
    { x: M, y: H - 76, size: 7.6, maxW: CONTENT_W, color: MUTED, maxLines: 3 },
  );

  // KPI strip
  let y = H - heroH - 14;
  const kpis = [
    { n: '3', label: 'Partner leads to start', accent: LIME },
    { n: '30', label: 'Days of free-leads window', accent: SKY },
    { n: '$0', label: 'Platform fee, ever', accent: GOLD },
    { n: '4', label: 'Access tiers to grow into', accent: VIOLET },
  ];
  const kpiW = (CONTENT_W - 8 * 3) / 4;
  const kpiH = 46;
  kpis.forEach((k, i) => {
    const x = M + i * (kpiW + 8);
    page.drawRectangle({
      x,
      y: y - kpiH,
      width: kpiW,
      height: kpiH,
      color: PANEL,
      borderColor: PANEL_EDGE,
      borderWidth: 0.8,
    });
    page.drawRectangle({ x, y: y - kpiH, width: kpiW, height: 2.5, color: k.accent });
    page.drawText(pdfSafe(k.n), { x: x + 10, y: y - 22, size: 16, font: fonts.bold, color: k.accent });
    textBlock(page, fonts.regular, k.label, {
      x: x + 10,
      y: y - 26,
      size: 6.6,
      maxW: kpiW - 20,
      color: MUTED,
      maxLines: 2,
    });
  });
  y -= kpiH + 16;

  // Two-column block
  const colGap = 14;
  const leftW = Math.round((CONTENT_W - colGap) * 0.56);
  const rightW = CONTENT_W - colGap - leftW;
  const rightX = M + leftW + colGap;
  const columnTop = y;

  let ly = drawSectionHeader(page, fonts, {
    x: M,
    y: columnTop,
    w: leftW,
    label: 'WHO THIS IS FOR',
    accent: LIME,
  });
  ly = drawBullets(page, fonts, {
    x: M,
    y: ly,
    w: leftW,
    accent: LIME,
    items: [
      'Credit repair operators who want an operating system, tested methods, and mentor review instead of duct-taped tools.',
      'Insurance, tax, real-estate, and lending pros who already hear "my credit is a mess" every single week.',
      'Coaches and community builders who want a compliant, documented way to monetize the help they already give.',
      'Career changers willing to learn the craft first and bring three partner leads to prove the motion.',
    ],
    maxLines: 2,
  });
  ly -= 4;
  ly = drawSectionHeader(page, fonts, {
    x: M,
    y: ly,
    w: leftW,
    label: 'WHAT YOU ACTUALLY DO',
    accent: SKY,
  });
  ly = drawBullets(page, fonts, {
    x: M,
    y: ly,
    w: leftW,
    accent: SKY,
    items: [
      'Personal restore - read the file, log factual findings, sequence disputes with real evidence.',
      'Business fundability - fix entity truth, build vendor depth, prepare the capital pack before the ask.',
      'Debt pressure - validation-first documentation, deadline discipline, and clean escalation routing.',
      'Growth - intake, follow-up, referrals, and partner reporting, all inside the Finely OS.',
      'Proof - every finding, letter, and mail receipt stored so the file survives scrutiny later.',
    ],
    maxLines: 2,
  });

  let ry = drawSectionHeader(page, fonts, {
    x: rightX,
    y: columnTop,
    w: rightW,
    label: 'THE 3-LEAD / 30-DAY WINDOW',
    accent: GOLD,
  });
  ry = drawBullets(page, fonts, {
    x: rightX,
    y: ry,
    w: rightW,
    accent: GOLD,
    items: [
      'Three partner leads is the entry commitment. It unlocks the academy, the methods library, and full OS access.',
      'You get 30 days from signup to source them using Finely capture pages, funnels, and growth playbooks.',
      '"Free leads" means no platform fee during that window - and you keep the partners you bring with you.',
      'After the window you continue on revenue share. Any lead-share arrangement is disclosed before it changes your keep.',
    ],
    maxLines: 3,
  });
  ry -= 3;
  ry = drawCallout(page, fonts, {
    x: rightX,
    y: ry,
    w: rightW,
    label: 'NOT A FIT IF',
    body: 'You are looking for guaranteed income, promised deletions, or a passive-income button. This is a documented craft with real partner accountability.',
    accent: ROSE,
  });

  y = Math.min(ly, ry) - 16;

  // Earnings table
  y = drawSectionHeader(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'EARNINGS PATH - THE HONEST VERSION',
    accent: GOLD,
    hint: 'Keep bands on partner service fees, not income projections',
  });
  y = drawTable(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    accent: GOLD_SOFT,
    cols: [
      { label: 'TIER', width: 132 },
      { label: 'TYPICAL KEEP', width: 86 },
      { label: 'WHO IT FITS', width: CONTENT_W - 132 - 86 },
    ],
    rows: [
      ['Specialist Foundation', '~30%', 'Learning the craft while landing your first three partners, with mentor QA on early rounds.'],
      ['Specialist Builder', '~42%', 'You own the pipeline and most of the file work; Finely backs complex fulfillment.'],
      ['Specialist Pro', '~52%', 'Independent volume under your own brand motion, with the OS as your engine.'],
      ['Certified Partner', '~62-80%', 'Proven quality, volume, and compliance scores. Invitation and review based.'],
    ],
  });
  y -= 9;
  y = drawCallout(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'READ THIS BEFORE YOU DO THE MATH',
    body: 'Keep bands apply only to partner service fees you actually collect. They are not salary, revenue, or an income projection, and no volume is promised or implied. There is no platform fee; Finely retains a share for the OS layer. Your outcome depends on effort, market, compliance, and partner fit. Results vary and income is never guaranteed.',
    accent: ROSE,
  });
  y -= 14;

  // How joining works
  y = drawSectionHeader(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'HOW JOINING WORKS',
    accent: VIOLET,
    hint: 'Reading is always free - join stays a separate step',
  });
  drawNumbered(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    accent: GOLD_SOFT,
    items: [
      'Read the free in-app e-guide at finelycred.com/credit-specialist-guide - no signup required to read any chapter.',
      'Compare tiers, economics, and what is included at finelycred.com/credit-specialist.',
      'Open the join flow and confirm the three-lead commitment plus your 30-day free-leads window.',
      'Choose a starting tier. You can graduate as your keep band, volume, and compliance record grow.',
      'Create your account, finish onboarding, and open your first partner file with mentor review on early rounds.',
    ],
  });

  drawFooter(page, fonts, 'SHEET 1 OF 2 - THE OFFER');
}

/* ── Sheet 2 ─────────────────────────────────────────────────────────── */

function drawSheetTwo(page: PDFPage, fonts: Fonts) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });

  const heroH = 84;
  page.drawRectangle({ x: 0, y: H - heroH, width: W, height: heroH, color: INK });
  page.drawRectangle({ x: 0, y: H - heroH - 3.5, width: W, height: 3.5, color: LIME });
  page.drawText(pdfSafe('SHEET 2 OF 2 - THE OPERATING SHEET'), {
    x: M,
    y: H - 25,
    size: 7.6,
    font: fonts.bold,
    color: LIME,
  });
  page.drawText(pdfSafe('Run the week. Escalate on evidence.'), {
    x: M,
    y: H - 48,
    size: 18,
    font: fonts.bold,
    color: WHITE,
  });
  textBlock(
    page,
    fonts.regular,
    'Pin this next to your desk. It is the rhythm, the ladder, and the language that separate a documented specialist from someone mailing template letters and hoping.',
    { x: M, y: H - 54, size: 7.6, maxW: CONTENT_W, color: MUTED, maxLines: 2 },
  );

  let y = H - heroH - 16;

  // Weekly rhythm
  y = drawSectionHeader(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'WEEKLY OPERATING RHYTHM',
    accent: SKY,
    hint: 'Same five blocks every week - the craft is repetition',
  });
  y = drawTable(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    accent: SKY,
    cols: [
      { label: 'DAY', width: 74 },
      { label: 'FOCUS', width: 132 },
      { label: 'OUTPUT YOU CAN POINT AT', width: CONTENT_W - 74 - 132 },
    ],
    rows: [
      ['Monday', 'Pipeline and intake', 'New leads worked, intake calls booked, partner files opened in the OS.'],
      ['Tuesday', 'File review', 'Reports read line by line, factual findings logged with screenshots, rounds queued.'],
      ['Wednesday', 'Send and document', 'Letters out, mail proof filed to the vault, portal notes updated the same day.'],
      ['Thursday', 'Partner contact', 'Progress calls, expectation resets, utilization and payment coaching.'],
      ['Friday', 'Escalate and learn', 'Deadlines checked, next rung filed, one academy module completed.'],
    ],
  });
  y -= 7;
  page.drawText(pdfSafe('Weekend rule: protect the craft. Tired specialists write sloppy files, and sloppy files lose credibility.'), {
    x: M,
    y: y - 7,
    size: 6.9,
    font: fonts.regular,
    color: DIM,
  });
  y -= 27;

  // Escalation ladder
  y = drawSectionHeader(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'ESCALATION LADDER SNAPSHOT',
    accent: ROSE,
    hint: 'Never skip a rung - each one needs its own record',
  });
  y = drawNumbered(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    accent: ROSE,
    items: [
      'Direct dispute - bureau or furnisher, a factual finding tied to the report, evidence attached, dated copy retained.',
      'Reinvestigation - new evidence only. Re-mailing the same letter is repetition, not escalation, and it reads that way.',
      'CFPB complaint - consumerfinance.gov/complaint, filed by the partner with a clean narrative and the document set.',
      'State AG and FTC - naag.org plus reportfraud.ftc.gov for pattern conduct, collector abuse, and repeat non-response.',
      'Counsel referral - summons, lawsuits, and legal strategy belong with a licensed attorney in the partner\'s state.',
    ],
  });
  y -= 3;
  page.drawText(
    pdfSafe('Specialists organize, document, and educate. The partner and their counsel make every legal decision.'),
    { x: M, y: y - 7, size: 6.9, font: fonts.regular, color: DIM },
  );
  y -= 27;

  // Conversation tips
  y = drawSectionHeader(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'PARTNER CONVERSATION TIPS',
    accent: GOLD,
    hint: 'Language is compliance - say the first column, never the second',
  });
  const panelGap = 12;
  const panelW = (CONTENT_W - panelGap) / 2;
  const panelH = 112;
  drawScriptPanel(page, fonts, {
    x: M,
    y,
    w: panelW,
    h: panelH,
    title: 'SAY THIS',
    accent: LIME,
    items: [
      '"Here is what the report actually says - let me show you the line."',
      '"We challenge what is inaccurate or unverifiable, and we document every round."',
      '"Timelines vary. The bureaus have windows; results follow the evidence."',
      '"Your job this month: keep utilization low and pay everything on time."',
    ],
  });
  drawScriptPanel(page, fonts, {
    x: M + panelW + panelGap,
    y,
    w: panelW,
    h: panelH,
    title: 'NEVER SAY THIS',
    accent: ROSE,
    items: [
      '"I can delete that." Nobody can promise a deletion - not you, not anyone.',
      '"You will be at 750 by spring." No score promises, no timelines you cannot control.',
      '"Just stop paying them." That is advice you are not licensed to give.',
      '"This is legal advice." It is not. Route legal questions to counsel, every time.',
    ],
  });
  y -= panelH + 24;

  // Toolkit checklist
  y = drawSectionHeader(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    label: 'SPECIALIST TOOLKIT CHECKLIST',
    accent: GOLD,
    hint: 'Every open partner file should tick all ten',
  });
  y = drawChecklist(page, fonts, {
    x: M,
    y,
    w: CONTENT_W,
    accent: GOLD_SOFT,
    items: [
      'Signed partner agreement and disclosures on file',
      'All three bureau reports pulled and read',
      'Factual findings logged with screenshots',
      'Dispute round drafted in Letters Studio',
      'Mail proof and dates saved to the Vault',
      'Portal access shown to the partner live',
      'Utilization and payment plan agreed',
      'Next contact date on the calendar',
      'Escalation rung and deadline noted',
      'Academy module for this lane completed',
    ],
  });
  y -= 22;

  // Next step CTA
  const ctaH = 66;
  page.drawRectangle({ x: M, y: y - ctaH, width: CONTENT_W, height: ctaH, color: rgb(0.11, 0.09, 0.045) });
  page.drawRectangle({ x: M, y: y - ctaH, width: 4.5, height: ctaH, color: GOLD });
  page.drawText(pdfSafe('NEXT STEP'), { x: M + 16, y: y - 16, size: 7, font: fonts.bold, color: GOLD_SOFT });
  page.drawText(pdfSafe('Read the free e-guide - finelycred.com/credit-specialist-guide/read'), {
    x: M + 16,
    y: y - 33,
    size: 10,
    font: fonts.bold,
    color: WHITE,
  });
  page.drawText(
    pdfSafe('Compare tiers - finelycred.com/credit-specialist   |   Join when ready - finelycred.com/credit-specialist/join'),
    { x: M + 16, y: y - 49, size: 8, font: fonts.regular, color: MUTED },
  );

  drawFooter(page, fonts, 'SHEET 2 OF 2 - OPERATE');
}

export async function buildCreditSpecialistTwoSheetPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  doc.setTitle(CREDIT_SPECIALIST_TWO_SHEET.title);
  doc.setSubject(CREDIT_SPECIALIST_TWO_SHEET.summary);
  doc.setProducer('Finely Cred');
  doc.setCreator('Finely Cred');

  drawSheetOne(doc.addPage([W, H]), fonts);
  drawSheetTwo(doc.addPage([W, H]), fonts);

  return doc.save();
}

export async function downloadCreditSpecialistTwoSheet() {
  const bytes = await buildCreditSpecialistTwoSheetPdf();
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = CREDIT_SPECIALIST_TWO_SHEET.filename;
  a.click();
  URL.revokeObjectURL(url);
}
