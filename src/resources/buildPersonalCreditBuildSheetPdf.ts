/**
 * Personal Credit Build — 2-sheet blueprint.
 *
 * Visual language: drafting paper. Pale gridded stock, navy technical ink, dimension ticks, and
 * a rung ladder drawn like an elevation. Intentionally the light counterpart to the charcoal
 * Restore dossier and the midnight AU card gallery.
 *
 * Sheet 1 — The instrument ladder and what each rung actually moves.
 * Sheet 2 — The optics engine: utilization math, statement timing, and a 12-month build calendar.
 */
import { PDFDocument, rgb, StandardFonts, type PDFPage, type RGB } from 'pdf-lib';
import {
  SHEET_H,
  SHEET_W,
  type SheetFonts,
  downloadPdfBytes,
  drawCenteredText,
  drawParagraph,
  drawRightText,
  paragraphHeight,
  pdfSafe,
  wrapText,
} from './sheetPdfKit';

const W = SHEET_W;
const H = SHEET_H;
const M = 34;
const RIGHT = W - M;
const CONTENT_W = RIGHT - M;
const FOOTER_H = 30;

const PAPER = rgb(0.973, 0.976, 0.98);
const PAPER_TINT = rgb(0.933, 0.945, 0.961);
const GRID = rgb(0.867, 0.894, 0.929);
const GRID_MAJOR = rgb(0.788, 0.835, 0.894);

const NAVY = rgb(0.075, 0.141, 0.251);
const INK = rgb(0.129, 0.176, 0.239);
const BODY = rgb(0.322, 0.373, 0.439);
const FAINT = rgb(0.549, 0.6, 0.663);
const WHITE = rgb(1, 1, 1);

const BLUE = rgb(0.106, 0.42, 0.741);
const GOLD = rgb(0.706, 0.49, 0.09);
const GREEN = rgb(0.075, 0.502, 0.365);
const PLUM = rgb(0.451, 0.227, 0.6);
const CLAY = rgb(0.706, 0.263, 0.243);

const COMPLIANCE =
  'Educational material - not legal advice and not a score guarantee. Scoring models weigh files differently and results vary. Approval for any product is the issuer\'s decision.';

export const PERSONAL_CREDIT_BUILD_SHEET = {
  id: 'personal_credit_build_sheet',
  pageCount: 2,
  sheetLabel: '2-sheet',
  title: 'Personal Credit Build — 2-Sheet Blueprint',
  shortLabel: '2-sheet build blueprint',
  downloadLabel: 'Download the 2-sheet blueprint',
  filename: 'finely-cred-personal-credit-build-2-sheet.pdf',
  eyebrow: 'PERSONAL CREDIT BUILD - 2-SHEET BLUEPRINT',
  route: '/resources/personal-credit-build-sheet',
  summary:
    'Two drafting sheets for building a file from thin or rebuilt: the five-rung instrument ladder with what each rung moves and what it costs, then the optics engine - utilization math, statement-date timing, inquiry discipline, and a twelve-month calendar you can work without guessing.',
  pages: [
    {
      n: 1,
      title: 'The instrument ladder',
      body: 'Five rungs from secured card to unsecured approval, what each one adds to the file, realistic cost, and the scoring weights that decide which rung matters next.',
    },
    {
      n: 2,
      title: 'The optics engine',
      body: 'Worked utilization math, the statement-date trick most people get backwards, the mistakes that quietly reset progress, and a month-by-month twelve-month calendar.',
    },
  ],
} as const;

/* ── drafting primitives ─────────────────────────────────────────────── */

function drawDraftingStock(page: PDFPage, fonts: SheetFonts, sheetNo: number) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });

  for (let x = 0; x <= W; x += 14) {
    page.drawRectangle({ x, y: 0, width: 0.35, height: H, color: x % 70 === 0 ? GRID_MAJOR : GRID });
  }
  for (let y = 0; y <= H; y += 14) {
    page.drawRectangle({ x: 0, y, width: W, height: 0.35, color: y % 70 === 0 ? GRID_MAJOR : GRID });
  }

  // Drafting border + corner ticks.
  page.drawRectangle({
    x: 16,
    y: 16,
    width: W - 32,
    height: H - 32,
    borderColor: GRID_MAJOR,
    borderWidth: 0.8,
  });
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 40, borderColor: NAVY, borderWidth: 0.5 });

  // Sheet index marks in the top-right border gutter.
  for (let i = 1; i <= 2; i += 1) {
    const active = i === sheetNo;
    page.drawRectangle({
      x: W - 48 + (i - 1) * 14,
      y: H - 18,
      width: 10,
      height: 10,
      color: active ? NAVY : PAPER_TINT,
      borderColor: NAVY,
      borderWidth: 0.5,
    });
    page.drawText(pdfSafe(String(i)), {
      x: W - 45.6 + (i - 1) * 14,
      y: H - 15.6,
      size: 6.4,
      font: fonts.bold,
      color: active ? PAPER : FAINT,
    });
  }
}

function drawTitleBlock(
  page: PDFPage,
  fonts: SheetFonts,
  o: { sheetNo: number; kicker: string; title: string; lede: string; revision: string },
): number {
  const top = H - 30;
  const blockH = 96;

  page.drawRectangle({ x: M, y: top - blockH, width: CONTENT_W, height: blockH, color: WHITE, borderColor: NAVY, borderWidth: 0.9 });
  page.drawRectangle({ x: M, y: top - 18, width: CONTENT_W, height: 18, color: NAVY });
  page.drawText(pdfSafe(o.kicker), { x: M + 10, y: top - 12.6, size: 6.8, font: fonts.bold, color: rgb(0.792, 0.855, 0.949) });
  drawRightText(page, fonts.bold, `SHEET ${o.sheetNo} OF 2`, { right: RIGHT - 10, y: top - 12.6, size: 6.8, color: rgb(0.976, 0.831, 0.502) });

  page.drawText(pdfSafe(o.title), { x: M + 12, y: top - 42, size: 19, font: fonts.bold, color: NAVY });
  drawParagraph(page, fonts.regular, o.lede, {
    x: M + 12,
    y: top - 50,
    size: 7.8,
    maxW: CONTENT_W - 130,
    color: BODY,
    maxLines: 3,
  });

  // Revision stamp, drafting style.
  const stampW = 96;
  page.drawRectangle({ x: RIGHT - stampW - 10, y: top - 82, width: stampW, height: 34, color: PAPER_TINT, borderColor: NAVY, borderWidth: 0.6 });
  page.drawText(pdfSafe('SCOPE'), { x: RIGHT - stampW - 2, y: top - 60, size: 5.8, font: fonts.bold, color: FAINT });
  drawParagraph(page, fonts.bold, o.revision, {
    x: RIGHT - stampW - 2,
    y: top - 64,
    size: 7,
    maxW: stampW - 16,
    color: BLUE,
    maxLines: 2,
  });

  return top - blockH - 14;
}

function drawSectionTag(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; label: string; accent: RGB; hint?: string },
): number {
  const labelW = fonts.bold.widthOfTextAtSize(pdfSafe(o.label), 8) + 16;
  page.drawRectangle({ x: M, y: o.y - 14, width: labelW, height: 14, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: M + 8, y: o.y - 10, size: 8, font: fonts.bold, color: WHITE });
  page.drawRectangle({ x: M + labelW + 6, y: o.y - 7.4, width: CONTENT_W - labelW - 6, height: 0.6, color: o.accent });
  if (o.hint) {
    drawRightText(page, fonts.regular, o.hint, { right: RIGHT, y: o.y - 12, size: 6.6, color: FAINT });
  }
  return o.y - 21;
}

/** One rung of the instrument ladder, drawn as an elevation step. */
function drawRung(
  page: PDFPage,
  fonts: SheetFonts,
  o: {
    y: number;
    h: number;
    index: number;
    total: number;
    name: string;
    typicalCost: string;
    moves: string;
    detail: string;
    accent: RGB;
  },
): number {
  const stepW = 46 + (o.index / o.total) * 54;
  const top = o.y;

  page.drawRectangle({ x: M, y: top - o.h, width: CONTENT_W, height: o.h, color: WHITE, borderColor: GRID_MAJOR, borderWidth: 0.7 });
  page.drawRectangle({ x: M, y: top - o.h, width: stepW, height: o.h, color: o.accent });

  page.drawText(pdfSafe(`R${o.index}`), { x: M + 9, y: top - 17, size: 12, font: fonts.bold, color: WHITE });
  drawParagraph(page, fonts.bold, o.typicalCost, {
    x: M + 9,
    y: top - 22,
    size: 6.6,
    maxW: stepW - 18,
    color: rgb(1, 1, 1),
    maxLines: 2,
  });

  const textX = M + stepW + 11;
  const textW = CONTENT_W - stepW - 22;
  page.drawText(pdfSafe(o.name), { x: textX, y: top - 16, size: 10.4, font: fonts.bold, color: NAVY });
  drawRightText(page, fonts.bold, o.moves, { right: RIGHT - 10, y: top - 15.4, size: 6.8, color: o.accent });
  drawParagraph(page, fonts.regular, o.detail, {
    x: textX,
    y: top - 22,
    size: 7.5,
    maxW: textW,
    color: BODY,
    maxLines: 3,
  });

  return top - o.h;
}

function drawSpecTable(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; cols: { label: string; width: number }[]; rows: string[][]; accent: RGB; maxLines?: number },
): number {
  const size = 7.3;
  const gap = size + 2.6;
  const pad = 8;
  let y = o.y;

  page.drawRectangle({ x: M, y: y - 15, width: CONTENT_W, height: 15, color: NAVY });
  let hx = M;
  for (const col of o.cols) {
    page.drawText(pdfSafe(col.label), { x: hx + pad, y: y - 10.2, size: 6.3, font: fonts.bold, color: rgb(0.804, 0.863, 0.949) });
    hx += col.width;
  }
  y -= 15;

  o.rows.forEach((row, ri) => {
    const lines = Math.max(
      1,
      ...row.map((cell, i) =>
        Math.min(o.maxLines ?? 3, wrapText(fonts.regular, cell, size, (o.cols[i]?.width ?? 90) - pad * 2).length),
      ),
    );
    const rowH = 7 + lines * gap;
    page.drawRectangle({ x: M, y: y - rowH, width: CONTENT_W, height: rowH, color: ri % 2 === 0 ? WHITE : PAPER_TINT });
    let cx = M;
    row.forEach((cell, i) => {
      const col = o.cols[i];
      if (!col) return;
      if (i > 0) page.drawRectangle({ x: cx, y: y - rowH, width: 0.4, height: rowH, color: GRID_MAJOR });
      drawParagraph(page, i === 0 ? fonts.bold : fonts.regular, cell, {
        x: cx + pad,
        y: y - 3.5,
        size,
        maxW: col.width - pad * 2,
        color: i === 0 ? INK : BODY,
        lineGap: gap,
        maxLines: o.maxLines ?? 3,
      });
      cx += col.width;
    });
    y -= rowH;
    page.drawRectangle({ x: M, y, width: CONTENT_W, height: 0.4, color: GRID_MAJOR });
  });

  page.drawRectangle({ x: M, y, width: CONTENT_W, height: o.y - y, borderColor: NAVY, borderWidth: 0.7 });
  return y;
}

/** Horizontal weight bars for the scoring-factor breakdown. */
function drawWeightBars(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; items: { label: string; pct: number; note: string; accent: RGB }[] },
): number {
  const rowH = 22;
  const labelW = 118;
  const noteW = 168;
  const trackX = M + labelW;
  const trackW = CONTENT_W - labelW - noteW - 12;
  let y = o.y;

  for (const item of o.items) {
    page.drawText(pdfSafe(item.label), { x: M, y: y - 12, size: 7.6, font: fonts.bold, color: INK });
    page.drawRectangle({ x: trackX, y: y - 15, width: trackW, height: 9, color: PAPER_TINT, borderColor: GRID_MAJOR, borderWidth: 0.4 });
    page.drawRectangle({ x: trackX, y: y - 15, width: (trackW * item.pct) / 35, height: 9, color: item.accent });
    page.drawText(pdfSafe(`${item.pct}%`), {
      x: trackX + trackW + 5,
      y: y - 13.4,
      size: 7.2,
      font: fonts.bold,
      color: item.accent,
    });
    drawParagraph(page, fonts.regular, item.note, {
      x: trackX + trackW + 32,
      y: y - 4,
      size: 6.9,
      maxW: noteW - 20,
      color: BODY,
      maxLines: 2,
    });
    y -= rowH;
  }
  return y;
}

function drawCallout(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; x?: number; w?: number; label: string; body: string; accent: RGB },
): number {
  const x = o.x ?? M;
  const w = o.w ?? CONTENT_W;
  const inner = w - 24;
  const h = 15 + paragraphHeight(fonts.regular, o.body, 7.2, inner) + 10;
  page.drawRectangle({ x, y: o.y - h, width: w, height: h, color: WHITE, borderColor: o.accent, borderWidth: 0.9 });
  page.drawRectangle({ x, y: o.y - h, width: w, height: 2.6, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: x + 12, y: o.y - 15, size: 6.8, font: fonts.bold, color: o.accent });
  drawParagraph(page, fonts.regular, o.body, { x: x + 12, y: o.y - 19, size: 7.2, maxW: inner, color: BODY });
  return o.y - h;
}

function drawFooter(page: PDFPage, fonts: SheetFonts, sheetNo: number, tag: string) {
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: FOOTER_H, color: PAPER_TINT });
  page.drawRectangle({ x: 20, y: 20 + FOOTER_H, width: W - 40, height: 0.7, color: NAVY });
  let cy = 20 + FOOTER_H - 10;
  for (const line of wrapText(fonts.regular, COMPLIANCE, 5.9, W - 200)) {
    page.drawText(line, { x: M, y: cy, size: 5.9, font: fonts.regular, color: FAINT });
    cy -= 7.2;
  }
  drawRightText(page, fonts.bold, `SHEET ${sheetNo} / 2 - ${tag}`, { right: RIGHT, y: 20 + FOOTER_H - 11, size: 6.8, color: NAVY });
  drawRightText(page, fonts.regular, 'finelycred.com/resources/personal-credit-build-sheet', {
    right: RIGHT,
    y: 20 + FOOTER_H - 21,
    size: 6,
    color: FAINT,
  });
}

/* ── Sheet 1 ─────────────────────────────────────────────────────────── */

function drawSheetOne(page: PDFPage, fonts: SheetFonts) {
  drawDraftingStock(page, fonts, 1);
  let y = drawTitleBlock(page, fonts, {
    sheetNo: 1,
    kicker: PERSONAL_CREDIT_BUILD_SHEET.eyebrow,
    title: 'Build the file on purpose.',
    lede: 'A thin file is not a broken file - it is an empty one. You fill it in a deliberate order, because each instrument adds a different signal. Add them out of order and you pay for products that report nothing useful.',
    revision: 'Thin file · rebuild · first approval',
  });

  y = drawSectionTag(page, fonts, {
    y,
    label: 'THE INSTRUMENT LADDER',
    accent: BLUE,
    hint: 'Climb in order - each rung earns the next',
  });

  const rungs: { name: string; typicalCost: string; moves: string; detail: string; accent: RGB }[] = [
    {
      name: 'Secured card, reported to all three',
      typicalCost: '$200-500 deposit',
      moves: 'Payment history + utilization',
      detail: 'Your deposit becomes the limit. Confirm before you open that the issuer reports to all three bureaus - some do not, and an unreported card builds nothing. Use it for one small recurring charge and autopay it in full.',
      accent: BLUE,
    },
    {
      name: 'Credit-builder or share-secured loan',
      typicalCost: '$10-40 / month',
      moves: 'Installment mix + history',
      detail: 'The lender holds the money while you pay it in; you get it back at the end. It is the cheapest honest way to add an installment line to a file that only has revolving accounts.',
      accent: GREEN,
    },
    {
      name: 'Rent and utility reporting',
      typicalCost: '$0-10 / month',
      moves: 'Positive payment depth',
      detail: 'Bills you already pay become reported tradelines. Coverage varies by bureau and by service, so verify which bureaus receive the data before you subscribe - and never enroll if you are behind.',
      accent: PLUM,
    },
    {
      name: 'Authorized user placement',
      typicalCost: 'Varies by arrangement',
      moves: 'Age, limit, utilization optics',
      detail: 'Being added to a seasoned, low-utilization account can lend age and available limit to your file. Reporting is never automatic and issuer policies differ - see the AU and teen sheet before you rely on it.',
      accent: GOLD,
    },
    {
      name: 'First unsecured approval',
      typicalCost: 'Application only',
      moves: 'Real limit + graduation path',
      detail: 'After six to twelve clean months, apply once - not to five issuers in a week. Ask your secured issuer about graduating and refunding your deposit before you add a brand-new account.',
      accent: CLAY,
    },
  ];

  const rungH = 52;
  rungs.forEach((rung, i) => {
    y = drawRung(page, fonts, {
      y,
      h: rungH,
      index: i + 1,
      total: rungs.length,
      name: rung.name,
      typicalCost: rung.typicalCost,
      moves: rung.moves,
      detail: rung.detail,
      accent: rung.accent,
    });
    y -= 5;
  });
  y -= 8;

  y = drawSectionTag(page, fonts, {
    y,
    label: 'WHAT THE SCORE IS MADE OF',
    accent: NAVY,
    hint: 'Classic FICO weights - VantageScore differs',
  });
  y = drawWeightBars(page, fonts, {
    y,
    items: [
      { label: 'Payment history', pct: 35, note: 'One missed payment outweighs months of tidy balances.', accent: GREEN },
      { label: 'Amounts owed', pct: 30, note: 'Utilization is the fastest lever you actually control.', accent: BLUE },
      { label: 'Length of history', pct: 15, note: 'Time only accrues if you keep the old account open.', accent: PLUM },
      { label: 'New credit', pct: 10, note: 'Every hard pull is a small, temporary, avoidable cost.', accent: CLAY },
      { label: 'Credit mix', pct: 10, note: 'Revolving plus installment reads as a fuller file.', accent: GOLD },
    ],
  });
  y -= 6;

  drawCallout(page, fonts, {
    y,
    label: 'BUY THE REPORTING, NOT THE LOGO',
    accent: BLUE,
    body: 'Before you pay for any product on this ladder, ask one question in writing: which bureaus do you report to, and how often? A card, loan, or rent service that does not furnish data is a subscription, not a credit builder. Two reporting instruments beat five silent ones every time.',
  });

  drawFooter(page, fonts, 1, 'THE LADDER');
}

/* ── Sheet 2 ─────────────────────────────────────────────────────────── */

function drawSheetTwo(page: PDFPage, fonts: SheetFonts) {
  drawDraftingStock(page, fonts, 2);
  let y = drawTitleBlock(page, fonts, {
    sheetNo: 2,
    kicker: 'OPTICS ENGINE - TIMING, MATH, AND THE 12-MONTH CALENDAR',
    title: 'Same spending. Better reporting.',
    lede: 'Most people pay their cards correctly and still report badly, because the bureaus see the statement balance - not what you spent or what you owe today. Fix the timing and the file improves without changing your budget.',
    revision: 'Utilization · timing · calendar',
  });

  y = drawSectionTag(page, fonts, {
    y,
    label: 'THE STATEMENT-DATE TRICK',
    accent: GREEN,
    hint: 'Pay before it cuts, not just before it is due',
  });

  const timelineH = 74;
  page.drawRectangle({ x: M, y: y - timelineH, width: CONTENT_W, height: timelineH, color: WHITE, borderColor: GRID_MAJOR, borderWidth: 0.7 });
  const axisY = y - 42;
  page.drawRectangle({ x: M + 24, y: axisY, width: CONTENT_W - 48, height: 1.1, color: NAVY });
  const marks: { at: number; label: string; note: string; accent: RGB }[] = [
    { at: 0.02, label: 'Cycle opens', note: 'Spend normally', accent: FAINT },
    { at: 0.42, label: 'PAY HERE', note: 'Two days before the statement cuts', accent: GREEN },
    { at: 0.62, label: 'Statement cuts', note: 'This balance is what gets reported', accent: CLAY },
    { at: 0.95, label: 'Due date', note: 'Too late to change the reported figure', accent: FAINT },
  ];
  for (const mark of marks) {
    const x = M + 24 + (CONTENT_W - 48) * mark.at;
    const strong = mark.accent === GREEN || mark.accent === CLAY;
    page.drawRectangle({ x: x - 0.6, y: axisY - 8, width: 1.2, height: strong ? 20 : 13, color: mark.accent });
    page.drawCircle({ x, y: axisY + 0.5, size: strong ? 3.4 : 2.4, color: mark.accent });
    drawCenteredText(page, fonts.bold, mark.label, { centerX: x, y: axisY + 15, size: 6.8, color: strong ? mark.accent : INK });
    drawParagraph(page, fonts.regular, mark.note, {
      x: Math.max(M + 6, Math.min(x - 44, RIGHT - 94)),
      y: axisY - 11,
      size: 6.4,
      maxW: 88,
      color: BODY,
      maxLines: 2,
    });
  }
  y -= timelineH + 12;

  y = drawSectionTag(page, fonts, { y, label: 'UTILIZATION, WORKED OUT', accent: BLUE });
  y = drawSpecTable(page, fonts, {
    y,
    accent: BLUE,
    maxLines: 2,
    cols: [
      { label: 'SITUATION', width: 132 },
      { label: 'THE MATH', width: 158 },
      { label: 'WHAT THE FILE SHOWS', width: CONTENT_W - 132 - 158 },
    ],
    rows: [
      ['One card, $500 limit', '$450 statement balance = 90 percent', 'Maxed. The single worst optic on a thin file.'],
      ['Same card, paid early', '$45 statement balance = 9 percent', 'Healthy. Identical spending, different timing.'],
      ['Two cards, $2,000 total', '$1,400 on one, $0 on the other = 70 percent on that card', 'Per-card utilization still reads as strained.'],
      ['Same $1,400, split evenly', '$700 each = 35 percent per card', 'Better, though under 30 percent per card is the target.'],
      ['All cards at zero', '0 percent reported across the file', 'Slightly weaker than a small reported balance - let one card report a few dollars.'],
    ],
  });
  y -= 12;

  y = drawSectionTag(page, fonts, { y, label: 'THE TWELVE-MONTH CALENDAR', accent: GOLD, hint: 'Four quarters, one job each' });
  const qGap = 8;
  const qW = (CONTENT_W - qGap * 3) / 4;
  const qH = 96;
  const quarters: { label: string; head: string; items: string[]; accent: RGB }[] = [
    {
      label: 'MONTHS 1-3',
      head: 'Open and stabilise',
      accent: BLUE,
      items: ['Secured card open and reporting', 'One small recurring charge only', 'Autopay set on every account', 'Zero new applications'],
    },
    {
      label: 'MONTHS 4-6',
      head: 'Add the second signal',
      accent: GREEN,
      items: ['Credit-builder loan started', 'Rent or utility reporting on', 'Pay before each statement cuts', 'Pull one free report to verify'],
    },
    {
      label: 'MONTHS 7-9',
      head: 'Deepen the file',
      accent: PLUM,
      items: ['Request a limit increase', 'Consider an AU placement', 'Keep every card under 30 percent', 'Check all three bureaus match'],
    },
    {
      label: 'MONTHS 10-12',
      head: 'Convert to real credit',
      accent: GOLD,
      items: ['Ask about graduating the secured card', 'One unsecured application - not five', 'Recover your deposit', 'Set next year\'s target'],
    },
  ];
  quarters.forEach((q, i) => {
    const x = M + i * (qW + qGap);
    page.drawRectangle({ x, y: y - qH, width: qW, height: qH, color: WHITE, borderColor: GRID_MAJOR, borderWidth: 0.7 });
    page.drawRectangle({ x, y: y - 16, width: qW, height: 16, color: q.accent });
    page.drawText(pdfSafe(q.label), { x: x + 8, y: y - 11, size: 6.4, font: fonts.bold, color: WHITE });
    page.drawText(pdfSafe(q.head), { x: x + 8, y: y - 30, size: 8.6, font: fonts.bold, color: NAVY });
    let iy = y - 40;
    for (const item of q.items) {
      page.drawRectangle({ x: x + 8, y: iy - 6, width: 5.4, height: 5.4, borderColor: q.accent, borderWidth: 0.7 });
      iy = drawParagraph(page, fonts.regular, item, {
        x: x + 17,
        y: iy,
        size: 6.7,
        maxW: qW - 25,
        color: BODY,
        maxLines: 2,
      });
      iy -= 3.4;
    }
  });
  y -= qH + 12;

  y = drawSectionTag(page, fonts, { y, label: 'WHAT QUIETLY RESETS YOU', accent: CLAY });
  const halfW = (CONTENT_W - 11) / 2;
  const leftBottom = drawCallout(page, fonts, {
    y,
    x: M,
    w: halfW,
    label: 'AVOID',
    accent: CLAY,
    body: 'Closing your oldest card to simplify. Applying to several issuers in one month. Carrying a balance because you think it helps - it does not, interest is not a scoring factor. Paying only the minimum. Letting a builder product lapse before it reports twelve months.',
  });
  const rightBottom = drawCallout(page, fonts, {
    y,
    x: M + halfW + 11,
    w: halfW,
    label: 'NEXT STEP',
    accent: GREEN,
    body: 'Restore first if you have errors or collections sitting on the file - building on top of a broken report wastes months. Start at finelycred.com/resources/personal-credit-restore-sheet, then come back to this ladder. Want it planned with you? Book at finelycred.com/enlightenment-session.',
  });
  y = Math.min(leftBottom, rightBottom);

  drawFooter(page, fonts, 2, 'OPTICS');
}

export async function buildPersonalCreditBuildSheetPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: SheetFonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  doc.setTitle(PERSONAL_CREDIT_BUILD_SHEET.title);
  doc.setSubject(PERSONAL_CREDIT_BUILD_SHEET.summary);
  doc.setProducer('Finely Cred');
  doc.setCreator('Finely Cred');

  drawSheetOne(doc.addPage([W, H]), fonts);
  drawSheetTwo(doc.addPage([W, H]), fonts);

  return doc.save();
}

export async function downloadPersonalCreditBuildSheet() {
  const bytes = await buildPersonalCreditBuildSheetPdf();
  downloadPdfBytes(bytes, PERSONAL_CREDIT_BUILD_SHEET.filename);
}
