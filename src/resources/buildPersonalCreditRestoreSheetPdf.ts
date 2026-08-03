/**
 * Personal Credit Restore — 3-sheet field kit.
 *
 * Visual language: investigator's dossier. Charcoal stock, a punched index rail down the left
 * edge, stamped statute blocks, and a hand-fillable findings ledger. Deliberately unlike the
 * cream Business Credit brief and the navy Credit Specialist playbook.
 *
 * Sheet 1 — Pull the file, name the finding.
 * Sheet 2 — Round one: sequence, reasons, evidence, clocks.
 * Sheet 3 — Escalate on the record, then hold the gain.
 */
import { PDFDocument, rgb, StandardFonts, type PDFPage, type RGB } from 'pdf-lib';
import {
  SHEET_H,
  SHEET_W,
  type SheetFonts,
  downloadPdfBytes,
  drawParagraph,
  drawRightText,
  paragraphHeight,
  pdfSafe,
  wrapText,
} from './sheetPdfKit';

const W = SHEET_W;
const H = SHEET_H;
const RAIL = 22;
const M = RAIL + 20;
const RIGHT = W - 30;
const CONTENT_W = RIGHT - M;
const FOOTER_H = 32;

const STOCK = rgb(0.086, 0.09, 0.104);
const STOCK_DEEP = rgb(0.043, 0.047, 0.059);
const RAIL_INK = rgb(0.129, 0.137, 0.157);
const CARD = rgb(0.114, 0.122, 0.141);
const CARD_ALT = rgb(0.098, 0.106, 0.125);
const EDGE = rgb(0.235, 0.251, 0.29);
const HAIRLINE = rgb(0.184, 0.196, 0.227);

const PAPER = rgb(0.965, 0.961, 0.945);
const TEXT = rgb(0.906, 0.914, 0.929);
const MUTED = rgb(0.686, 0.706, 0.745);
const FAINT = rgb(0.478, 0.498, 0.541);

const RUST = rgb(0.898, 0.365, 0.325);
const AMBER = rgb(0.925, 0.702, 0.286);
const JADE = rgb(0.353, 0.804, 0.588);
const ICE = rgb(0.494, 0.757, 0.925);

const COMPLIANCE =
  'Educational material - not legal advice. Results vary. No deletion, score, or timeline is promised. Bureaus and furnishers decide outcomes on the evidence you document.';

export const PERSONAL_CREDIT_RESTORE_SHEET = {
  id: 'personal_credit_restore_sheet',
  pageCount: 3,
  sheetLabel: '3-sheet',
  title: 'Personal Credit Restore — 3-Sheet Field Kit',
  shortLabel: '3-sheet restore field kit',
  downloadLabel: 'Download the 3-sheet field kit',
  filename: 'finely-cred-personal-credit-restore-3-sheet.pdf',
  eyebrow: 'PERSONAL CREDIT RESTORE - 3-SHEET FIELD KIT',
  route: '/resources/personal-credit-restore-sheet',
  summary:
    'Three working sheets for a documented restore: the statutes you actually invoke and how to pull a complete file, the round-one sequence with reason language and evidence pairing, then the escalation ladder and the utilization plan that holds the gain.',
  pages: [
    {
      n: 1,
      title: 'Pull the file, name the finding',
      body: 'FCRA rights in the order you use them, the eight-item pull list, and a findings ledger you fill in by hand before a single letter goes out.',
    },
    {
      n: 2,
      title: 'Round one: sequence, reasons, clocks',
      body: 'How to order the first round, factual reason language versus the phrasing that gets you dismissed, evidence pairing by finding type, and the 30/45/60-day clock map.',
    },
    {
      n: 3,
      title: 'Escalate on the record, hold the gain',
      body: 'The five-rung escalation ladder with the real filing portals, utilization math that moves scores fastest, and a 90-day hold calendar.',
    },
  ],
} as const;

/* ── dossier primitives ──────────────────────────────────────────────── */

function drawStock(page: PDFPage, fonts: SheetFonts, sheetNo: number) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: STOCK });
  page.drawRectangle({ x: 0, y: 0, width: RAIL, height: H, color: RAIL_INK });
  page.drawRectangle({ x: RAIL, y: 0, width: 0.8, height: H, color: EDGE });

  // Punched index tabs — the active sheet is the lit one.
  for (let i = 1; i <= 3; i += 1) {
    const top = H - 170 - (i - 1) * 74;
    const active = i === sheetNo;
    page.drawRectangle({
      x: 4,
      y: top - 58,
      width: RAIL - 8,
      height: 58,
      color: active ? RUST : rgb(0.16, 0.17, 0.196),
    });
    page.drawText(pdfSafe(String(i)), {
      x: 8.4,
      y: top - 22,
      size: 11,
      font: fonts.bold,
      color: active ? STOCK_DEEP : FAINT,
    });
    for (let d = 0; d < 3; d += 1) {
      page.drawCircle({
        x: RAIL / 2,
        y: top - 34 - d * 7,
        size: 1.1,
        color: active ? STOCK_DEEP : rgb(0.24, 0.25, 0.29),
      });
    }
  }
}

function drawSheetHead(
  page: PDFPage,
  fonts: SheetFonts,
  o: { sheetNo: number; kicker: string; title: string; lede: string; stamp: string; accent: RGB },
): number {
  const bandH = 112;
  page.drawRectangle({ x: RAIL, y: H - bandH, width: W - RAIL, height: bandH, color: STOCK_DEEP });
  page.drawRectangle({ x: RAIL, y: H - bandH, width: W - RAIL, height: 2.4, color: o.accent });

  page.drawText(pdfSafe(o.kicker), { x: M, y: H - 26, size: 7.2, font: fonts.bold, color: o.accent });
  page.drawText(pdfSafe(o.title), { x: M, y: H - 52, size: 19.5, font: fonts.bold, color: PAPER });
  drawParagraph(page, fonts.regular, o.lede, {
    x: M,
    y: H - 60,
    size: 7.7,
    maxW: CONTENT_W - 96,
    color: MUTED,
    maxLines: 3,
  });

  // Rubber-stamp block, top right.
  const stampW = 86;
  const stampX = RIGHT - stampW;
  page.drawRectangle({
    x: stampX,
    y: H - 62,
    width: stampW,
    height: 38,
    borderColor: o.accent,
    borderWidth: 1.4,
  });
  page.drawText(pdfSafe(`SHEET ${o.sheetNo} / 3`), {
    x: stampX + 9,
    y: H - 39,
    size: 9,
    font: fonts.bold,
    color: o.accent,
  });
  page.drawText(pdfSafe(o.stamp), { x: stampX + 9, y: H - 53, size: 5.8, font: fonts.regular, color: MUTED });

  return H - bandH - 16;
}

function drawRule(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; label: string; accent: RGB; hint?: string },
): number {
  page.drawRectangle({ x: M, y: o.y - 9, width: 2.4, height: 9, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: M + 8, y: o.y - 8, size: 8.2, font: fonts.bold, color: PAPER });
  if (o.hint) {
    drawRightText(page, fonts.regular, o.hint, { right: RIGHT, y: o.y - 7.5, size: 6.6, color: FAINT });
  }
  page.drawRectangle({ x: M, y: o.y - 14.5, width: CONTENT_W, height: 0.6, color: HAIRLINE });
  return o.y - 21;
}

type Column = { label: string; width: number };

function drawLedger(
  page: PDFPage,
  fonts: SheetFonts,
  o: {
    y: number;
    cols: Column[];
    rows: string[][];
    accent: RGB;
    size?: number;
    maxLines?: number;
    firstColBold?: boolean;
  },
): number {
  const size = o.size ?? 7.2;
  const pad = 7;
  const gap = size + 2.5;
  let y = o.y;

  page.drawRectangle({ x: M, y: y - 14, width: CONTENT_W, height: 14, color: rgb(0.145, 0.153, 0.176) });
  let hx = M;
  for (const col of o.cols) {
    page.drawText(pdfSafe(col.label), { x: hx + pad, y: y - 9.8, size: 6.2, font: fonts.bold, color: o.accent });
    hx += col.width;
  }
  y -= 14;
  page.drawRectangle({ x: M, y: y - 0.9, width: CONTENT_W, height: 0.9, color: o.accent });

  o.rows.forEach((row, ri) => {
    const lineCount = Math.max(
      1,
      ...row.map((cell, i) =>
        Math.min(o.maxLines ?? 3, wrapText(fonts.regular, cell, size, (o.cols[i]?.width ?? 90) - pad * 2).length),
      ),
    );
    const rowH = 7 + lineCount * gap;
    if (ri % 2 === 1) page.drawRectangle({ x: M, y: y - rowH, width: CONTENT_W, height: rowH, color: CARD_ALT });
    let cx = M;
    row.forEach((cell, i) => {
      const col = o.cols[i];
      if (!col) return;
      drawParagraph(page, i === 0 && o.firstColBold !== false ? fonts.bold : fonts.regular, cell, {
        x: cx + pad,
        y: y - 3.5,
        size,
        maxW: col.width - pad * 2,
        color: i === 0 && o.firstColBold !== false ? TEXT : MUTED,
        lineGap: gap,
        maxLines: o.maxLines ?? 3,
      });
      cx += col.width;
    });
    y -= rowH;
  });

  page.drawRectangle({ x: M, y, width: CONTENT_W, height: o.y - y, borderColor: EDGE, borderWidth: 0.7 });
  return y;
}

/** Hand-fillable ruled rows — the partner writes findings here before drafting. */
function drawBlankLedger(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; cols: Column[]; rows: number; accent: RGB },
): number {
  let y = o.y;
  page.drawRectangle({ x: M, y: y - 13, width: CONTENT_W, height: 13, color: rgb(0.145, 0.153, 0.176) });
  let hx = M;
  for (const col of o.cols) {
    page.drawText(pdfSafe(col.label), { x: hx + 7, y: y - 9.2, size: 6.2, font: fonts.bold, color: o.accent });
    if (hx > M) page.drawRectangle({ x: hx, y: y - 13, width: 0.6, height: 13, color: EDGE });
    hx += col.width;
  }
  y -= 13;
  page.drawRectangle({ x: M, y: y - 0.9, width: CONTENT_W, height: 0.9, color: o.accent });

  const rowH = 17;
  for (let r = 0; r < o.rows; r += 1) {
    if (r % 2 === 1) page.drawRectangle({ x: M, y: y - rowH, width: CONTENT_W, height: rowH, color: CARD_ALT });
    page.drawText(pdfSafe(String(r + 1)), { x: M + 6, y: y - 11.5, size: 6.4, font: fonts.bold, color: FAINT });
    let vx = M;
    for (const col of o.cols) {
      if (vx > M) page.drawRectangle({ x: vx, y: y - rowH, width: 0.5, height: rowH, color: HAIRLINE });
      vx += col.width;
    }
    y -= rowH;
    page.drawRectangle({ x: M, y, width: CONTENT_W, height: 0.5, color: HAIRLINE });
  }
  page.drawRectangle({ x: M, y, width: CONTENT_W, height: o.y - y, borderColor: EDGE, borderWidth: 0.7 });
  return y;
}

function drawStamps(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; items: { big: string; label: string; accent: RGB }[] },
): number {
  const gap = 7;
  const w = (CONTENT_W - gap * (o.items.length - 1)) / o.items.length;
  const h = 44;
  o.items.forEach((item, i) => {
    const x = M + i * (w + gap);
    page.drawRectangle({ x, y: o.y - h, width: w, height: h, color: CARD, borderColor: EDGE, borderWidth: 0.7 });
    page.drawRectangle({ x, y: o.y - h, width: 2.4, height: h, color: item.accent });
    page.drawText(pdfSafe(item.big), { x: x + 10, y: o.y - 21, size: 14, font: fonts.bold, color: item.accent });
    drawParagraph(page, fonts.regular, item.label, {
      x: x + 10,
      y: o.y - 24,
      size: 6.4,
      maxW: w - 18,
      color: MUTED,
      maxLines: 2,
    });
  });
  return o.y - h;
}

function drawSteps(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; items: readonly string[]; accent: RGB; size?: number; maxLines?: number },
): number {
  const size = o.size ?? 7.4;
  let y = o.y;
  o.items.forEach((item, i) => {
    page.drawRectangle({ x: M, y: y - size - 2.6, width: 13, height: size + 4.6, color: rgb(0.157, 0.165, 0.192) });
    page.drawText(pdfSafe(String(i + 1).padStart(2, '0')), {
      x: M + 2,
      y: y - size - 0.4,
      size: size - 1.4,
      font: fonts.bold,
      color: o.accent,
    });
    y = drawParagraph(page, fonts.regular, item, {
      x: M + 19,
      y,
      size,
      maxW: CONTENT_W - 19,
      color: MUTED,
      maxLines: o.maxLines ?? 2,
    });
    y -= 4.6;
  });
  return y;
}

function drawNote(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; label: string; body: string; accent: RGB; x?: number; w?: number },
): number {
  const x = o.x ?? M;
  const w = o.w ?? CONTENT_W;
  const inner = w - 24;
  const h = 15 + paragraphHeight(fonts.regular, o.body, 7.1, inner) + 10;
  page.drawRectangle({ x, y: o.y - h, width: w, height: h, color: CARD, borderColor: o.accent, borderWidth: 0.8 });
  page.drawRectangle({ x, y: o.y - h, width: 3, height: h, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: x + 13, y: o.y - 12.5, size: 6.5, font: fonts.bold, color: o.accent });
  drawParagraph(page, fonts.regular, o.body, {
    x: x + 13,
    y: o.y - 16.5,
    size: 7.1,
    maxW: inner,
    color: MUTED,
  });
  return o.y - h;
}

function drawChecklist(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; items: readonly string[]; accent: RGB; cols?: number },
): number {
  const cols = o.cols ?? 2;
  const gutter = 14;
  const colW = (CONTENT_W - gutter * (cols - 1)) / cols;
  const rowH = 16.5;
  const rows = Math.ceil(o.items.length / cols);
  o.items.forEach((item, i) => {
    const x = M + (i % cols) * (colW + gutter);
    const y = o.y - Math.floor(i / cols) * rowH;
    page.drawRectangle({ x, y: y - 8, width: 7.4, height: 7.4, borderColor: o.accent, borderWidth: 0.85 });
    drawParagraph(page, fonts.regular, item, {
      x: x + 12,
      y: y - 0.6,
      size: 7.2,
      maxW: colW - 12,
      color: MUTED,
      maxLines: 1,
    });
  });
  return o.y - rows * rowH + 2;
}

function drawSplitPanels(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; h: number; left: { title: string; items: readonly string[]; accent: RGB }; right: { title: string; items: readonly string[]; accent: RGB } },
) {
  const gap = 11;
  const w = (CONTENT_W - gap) / 2;
  [o.left, o.right].forEach((panel, i) => {
    const x = M + i * (w + gap);
    page.drawRectangle({ x, y: o.y - o.h, width: w, height: o.h, color: CARD, borderColor: EDGE, borderWidth: 0.7 });
    page.drawRectangle({ x, y: o.y - 3, width: w, height: 3, color: panel.accent });
    page.drawText(pdfSafe(panel.title), { x: x + 10, y: o.y - 18, size: 7.2, font: fonts.bold, color: panel.accent });
    let y = o.y - 25;
    for (const item of panel.items) {
      page.drawRectangle({ x: x + 10, y: y - 6.1, width: 2.6, height: 2.6, color: panel.accent });
      y = drawParagraph(page, fonts.regular, item, {
        x: x + 17,
        y,
        size: 7,
        maxW: w - 27,
        color: MUTED,
        maxLines: 3,
      });
      y -= 4;
    }
  });
}

function drawFooter(page: PDFPage, fonts: SheetFonts, sheetNo: number, tag: string) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: STOCK_DEEP });
  page.drawRectangle({ x: 0, y: FOOTER_H - 1.4, width: W, height: 1.4, color: RUST });
  let cy = 20;
  for (const line of wrapText(fonts.regular, COMPLIANCE, 6, W - M - 130)) {
    page.drawText(line, { x: M, y: cy, size: 6, font: fonts.regular, color: FAINT });
    cy -= 7.4;
  }
  page.drawText(pdfSafe('finelycred.com/resources/personal-credit-restore-sheet'), {
    x: M,
    y: 6,
    size: 6.2,
    font: fonts.regular,
    color: FAINT,
  });
  drawRightText(page, fonts.bold, `SHEET ${sheetNo} OF 3 - ${tag}`, {
    right: RIGHT,
    y: 6,
    size: 6.8,
    color: RUST,
  });
}

/* ── Sheet 1 ─────────────────────────────────────────────────────────── */

function drawSheetOne(page: PDFPage, fonts: SheetFonts) {
  drawStock(page, fonts, 1);
  let y = drawSheetHead(page, fonts, {
    sheetNo: 1,
    kicker: PERSONAL_CREDIT_RESTORE_SHEET.eyebrow,
    title: 'Pull the file. Name the finding.',
    lede: 'A restore file is won on paper. Before you write a single letter you pull everything the bureaus hold, read it line by line, and record what is factually wrong. Findings first, letters second - that order is what makes the rest of this kit work.',
    stamp: 'READ + RECORD',
    accent: RUST,
  });

  y = drawStamps(page, fonts, {
    y,
    items: [
      { big: '30', label: 'Days the bureau has to reinvestigate (45 if you add evidence mid-window)', accent: RUST },
      { big: '7', label: 'Years most negatives may report - collections, late pays, charge-offs', accent: AMBER },
      { big: '10', label: 'Years for a Chapter 7 bankruptcy from the filing date', accent: ICE },
      { big: '$0', label: 'What it costs you to dispute directly with every bureau', accent: JADE },
    ],
  });
  y -= 15;

  y = drawRule(page, fonts, {
    y,
    label: 'THE LAWS YOU INVOKE - IN THE ORDER YOU USE THEM',
    accent: RUST,
    hint: 'Cite the duty, not a threat',
  });
  y = drawLedger(page, fonts, {
    y,
    accent: RUST,
    cols: [
      { label: 'STATUTE', width: 96 },
      { label: 'WHAT IT GIVES YOU', width: 150 },
      { label: 'HOW YOU ACTUALLY USE IT', width: CONTENT_W - 96 - 150 },
    ],
    rows: [
      [
        'FCRA Sec. 609',
        'Full file disclosure, including who furnished each item',
        'Request the complete file - not the consumer-friendly summary - so you can see furnisher names, dates, and balances you will later contradict.',
      ],
      [
        'FCRA Sec. 611',
        'Reinvestigation within 30 days',
        'Dispute directly with each bureau holding the error. Unverifiable items must be deleted or modified. Adding evidence mid-window extends it to 45 days.',
      ],
      [
        'FCRA Sec. 623',
        'Furnisher duty to investigate',
        'The creditor or collector must investigate what the bureau forwards. Dispute with the furnisher too when the bureau parrots "verified" without detail.',
      ],
      [
        'FCRA Sec. 605',
        'Time limits on reporting',
        'Most negatives fall off at 7 years; Chapter 7 at 10 from filing. Age every negative item and challenge anything reporting past its window.',
      ],
      [
        'FDCPA Sec. 809',
        'Debt validation on collections',
        'Within 30 days of a collector\'s first contact, demand verification in writing. Collection activity pauses until they produce it.',
      ],
    ],
  });
  y -= 13;

  y = drawRule(page, fonts, { y, label: 'PULL LIST - DO ALL EIGHT BEFORE ROUND ONE', accent: AMBER });
  y = drawChecklist(page, fonts, {
    y,
    accent: AMBER,
    items: [
      'All three bureau reports pulled the same week',
      'Full disclosure requested, not a score-only summary',
      'Government ID and proof of address scanned',
      'Every negative item screenshotted per bureau',
      'Statement dates and balances noted per card',
      'Collector letters and envelopes kept with dates',
      'Court or judgment paperwork downloaded if any',
      'A single folder - digital or physical - holds it all',
    ],
  });
  y -= 13;

  y = drawRule(page, fonts, {
    y,
    label: 'FINDINGS LEDGER - FILL THIS IN BEFORE YOU DRAFT',
    accent: JADE,
    hint: 'One row per item, per bureau',
  });
  y = drawBlankLedger(page, fonts, {
    y,
    accent: JADE,
    rows: 6,
    cols: [
      { label: '#  BUREAU', width: 76 },
      { label: 'ACCOUNT / FURNISHER', width: 138 },
      { label: 'WHAT THE REPORT SAYS', width: 150 },
      { label: 'WHY IT IS WRONG', width: CONTENT_W - 76 - 138 - 150 },
    ],
  });
  y -= 12;

  drawNote(page, fonts, {
    y,
    label: 'WRITE FINDINGS, NOT COMMANDS',
    accent: RUST,
    body: 'A finding points at the report: "Equifax shows this account opened 03/2019; my statement shows 03/2021." A command begs: "please verify and delete." Findings force a real reinvestigation because they can be checked against a document. Commands get a form response. Every row above should read like something you could hand to a stranger and have them confirm in thirty seconds.',
  });

  drawFooter(page, fonts, 1, 'READ THE FILE');
}

/* ── Sheet 2 ─────────────────────────────────────────────────────────── */

function drawSheetTwo(page: PDFPage, fonts: SheetFonts) {
  drawStock(page, fonts, 2);
  let y = drawSheetHead(page, fonts, {
    sheetNo: 2,
    kicker: 'ROUND ONE - SEQUENCE, LANGUAGE, EVIDENCE, CLOCKS',
    title: 'Send fewer letters. Send better ones.',
    lede: 'Round one decides how seriously the rest of the file gets taken. You dispute the strongest, most provable findings first, you pair every claim with a document, and you calendar the clock the day it starts.',
    stamp: 'DRAFT + SEND',
    accent: AMBER,
  });

  y = drawRule(page, fonts, {
    y,
    label: 'HOW TO ORDER ROUND ONE',
    accent: AMBER,
    hint: 'Strongest evidence goes first - always',
  });
  y = drawSteps(page, fonts, {
    y,
    accent: AMBER,
    items: [
      'Identity errors first. Wrong name spellings, old addresses, and mixed files corrupt everything downstream - clean them before you argue about accounts.',
      'Then provable data errors: wrong open date, wrong balance, wrong status, duplicate reporting of the same debt by original creditor and collector.',
      'Then obsolete items past the Sec. 605 window. These are the cleanest challenges on any file because the math is not arguable.',
      'Then collections you can put on the validation clock under FDCPA Sec. 809 - dispute with the bureau and demand verification from the collector in the same week.',
      'Hold the hardest, thinnest items for round two. Losing your weakest argument first trains the file to ignore you.',
    ],
  });
  y -= 12;

  y = drawRule(page, fonts, { y, label: 'REASON LANGUAGE', accent: RUST, hint: 'Language is compliance' });
  drawSplitPanels(page, fonts, {
    y,
    h: 106,
    left: {
      title: 'WRITE THIS',
      accent: JADE,
      items: [
        '"As reported on Experian, this account shows a 30-day late in 06/2023. My bank statement for that cycle shows payment posted 06/09."',
        '"TransUnion lists this collection and the original creditor is also reporting the same balance - the debt appears twice on one file."',
        '"This charge-off first delinquency was 04/2016 and remains on the report past the seven-year window."',
      ],
    },
    right: {
      title: 'NEVER WRITE THIS',
      accent: RUST,
      items: [
        '"Please verify and delete." It names no fact and invites a template reply.',
        '"This is not mine" on an account you opened. One false statement discredits the whole file.',
        '"I demand removal or I will sue." Threats you will not act on cost you credibility, not leverage.',
        'Anything copied from a template without a document behind it.',
      ],
    },
  });
  y -= 106 + 14;

  y = drawRule(page, fonts, { y, label: 'PAIR EVERY FINDING WITH THE DOCUMENT THAT CARRIES IT', accent: ICE });
  y = drawLedger(page, fonts, {
    y,
    accent: ICE,
    maxLines: 2,
    cols: [
      { label: 'FINDING TYPE', width: 128 },
      { label: 'EVIDENCE THAT ACTUALLY MOVES IT', width: 210 },
      { label: 'SEND TO', width: CONTENT_W - 128 - 210 },
    ],
    rows: [
      ['Wrong payment status', 'Bank statement or payment confirmation for that cycle', 'Bureau + furnisher'],
      ['Wrong balance or limit', 'Latest issuer statement showing the true figure', 'Bureau + furnisher'],
      ['Duplicate debt', 'Both report entries side by side, same amount and origin', 'Both bureaus involved'],
      ['Past the 7/10-year window', 'Date of first delinquency from the original account', 'Bureau'],
      ['Not my account / mixed file', 'ID, proof of address, and the mismatched identifiers', 'All three bureaus'],
      ['Unverified collection', 'Your Sec. 809 validation request and their non-response', 'Bureau + collector'],
    ],
  });
  y -= 13;

  y = drawRule(page, fonts, { y, label: 'THE CLOCK MAP', accent: JADE, hint: 'Calendar it the day you mail it' });
  y = drawLedger(page, fonts, {
    y,
    accent: JADE,
    maxLines: 2,
    firstColBold: true,
    cols: [
      { label: 'WHEN', width: 82 },
      { label: 'WHAT HAPPENS', width: CONTENT_W - 82 },
    ],
    rows: [
      ['Day 0', 'Round one mailed certified with return receipt. Copies and the receipt number go straight into your folder.'],
      ['Day 5-7', 'Green card or tracking confirms delivery. That date - not the mailing date - is what you defend later.'],
      ['Day 30', 'Reinvestigation window closes. No response is itself a documented fact worth escalating.'],
      ['Day 45', 'Extended deadline if you added evidence mid-window. Results and an updated report should be in hand.'],
      ['Day 60', 'Read the new report. Anything unchanged and still unsupported moves to the ladder on sheet three.'],
    ],
  });
  y -= 12;

  drawNote(page, fonts, {
    y,
    label: 'THE PROOF IS THE POINT',
    accent: AMBER,
    body: 'Certified mail with return receipt costs a few dollars and turns "I disputed it" into a date a regulator can read. Keep the letter, the exhibits, the receipt, and the response together per round. Files that survive scrutiny get taken seriously; files rebuilt from memory do not.',
  });

  drawFooter(page, fonts, 2, 'ROUND ONE');
}

/* ── Sheet 3 ─────────────────────────────────────────────────────────── */

function drawSheetThree(page: PDFPage, fonts: SheetFonts) {
  drawStock(page, fonts, 3);
  let y = drawSheetHead(page, fonts, {
    sheetNo: 3,
    kicker: 'ESCALATE ON THE RECORD - THEN HOLD THE GAIN',
    title: 'Climb the ladder. Never skip a rung.',
    lede: 'When a bureau or furnisher stonewalls, you do not resend the same letter louder. You move up a rung, and every rung leaves a record the next one can read. Then you protect the score you just earned.',
    stamp: 'ESCALATE + HOLD',
    accent: JADE,
  });

  y = drawRule(page, fonts, {
    y,
    label: 'THE FIVE-RUNG LADDER',
    accent: JADE,
    hint: 'New evidence at every rung - repetition is not escalation',
  });
  y = drawSteps(page, fonts, {
    y,
    accent: JADE,
    maxLines: 3,
    items: [
      'Direct dispute - bureau and furnisher, factual finding, evidence attached, dated copy retained.',
      'Reinvestigation with new evidence only. A second identical letter tells them nothing changed and they will answer it the same way.',
      'CFPB complaint at consumerfinance.gov/complaint. You file it with a clean narrative, the dates, and the document set. Companies answer these on a published clock.',
      'State attorney general via naag.org, plus reportfraud.ftc.gov for pattern conduct or collector abuse. State AG offices care about repeat non-response.',
      'Licensed counsel in your state for summons, lawsuits, willful FCRA violations, and anything that belongs in front of a judge.',
    ],
  });
  y -= 12;

  y = drawRule(page, fonts, { y, label: 'UTILIZATION - THE FASTEST HONEST LEVER YOU CONTROL', accent: ICE });
  y = drawLedger(page, fonts, {
    y,
    accent: ICE,
    maxLines: 2,
    cols: [
      { label: 'LEVER', width: 128 },
      { label: 'WHAT TO DO', width: 208 },
      { label: 'WHY IT MOVES', width: CONTENT_W - 128 - 208 },
    ],
    rows: [
      ['Statement-date payoff', 'Pay the balance down before the statement cuts, not before the due date', 'The reported figure is the statement balance'],
      ['Per-card ceiling', 'Keep each revolving card under roughly 30 percent, and your best card lower', 'Individual utilization is scored, not just total'],
      ['Keep the oldest open', 'Do not close aged accounts to tidy up - age and available limit both matter', 'Closing shrinks limits and average age'],
      ['Inquiry discipline', 'Cluster rate shopping into a short window and stop applying otherwise', 'Scattered hard pulls read as distress'],
      ['On-time, every time', 'Autopay the minimum on everything, then pay the real target manually', 'Payment history is the heaviest single factor'],
    ],
  });
  y -= 13;

  y = drawRule(page, fonts, { y, label: '90-DAY HOLD PLAN', accent: AMBER, hint: 'The gain is only real if it survives' });
  const monthGap = 9;
  const monthW = (CONTENT_W - monthGap * 2) / 3;
  const monthH = 88;
  const months: { label: string; head: string; items: string[]; accent: RGB }[] = [
    {
      label: 'DAYS 1-30',
      head: 'Send and stabilise',
      accent: RUST,
      items: [
        'Round one mailed certified',
        'Autopay on for every account',
        'Balances down before statement cuts',
        'No new applications',
      ],
    },
    {
      label: 'DAYS 31-60',
      head: 'Read and answer',
      accent: AMBER,
      items: [
        'Pull fresh reports',
        'Log every result per item',
        'Escalate non-responses',
        'Round two on new evidence only',
      ],
    },
    {
      label: 'DAYS 61-90',
      head: 'Escalate and build',
      accent: JADE,
      items: [
        'CFPB filing where warranted',
        'Confirm deletions on all three',
        'Add one positive reporting line',
        'Set the next 90-day target',
      ],
    },
  ];
  months.forEach((month, i) => {
    const x = M + i * (monthW + monthGap);
    page.drawRectangle({ x, y: y - monthH, width: monthW, height: monthH, color: CARD, borderColor: EDGE, borderWidth: 0.7 });
    page.drawRectangle({ x, y: y - monthH, width: monthW, height: 2.6, color: month.accent });
    page.drawText(pdfSafe(month.label), { x: x + 10, y: y - 15, size: 6.4, font: fonts.bold, color: month.accent });
    page.drawText(pdfSafe(month.head), { x: x + 10, y: y - 28, size: 9.2, font: fonts.bold, color: PAPER });
    let iy = y - 38;
    for (const item of month.items) {
      page.drawRectangle({ x: x + 10, y: iy - 5.6, width: 2.4, height: 2.4, color: month.accent });
      iy = drawParagraph(page, fonts.regular, item, {
        x: x + 17,
        y: iy,
        size: 6.9,
        maxW: monthW - 27,
        color: MUTED,
        maxLines: 2,
      });
      iy -= 3.4;
    }
  });
  y -= monthH + 13;

  const ctaH = 62;
  page.drawRectangle({ x: M, y: y - ctaH, width: CONTENT_W, height: ctaH, color: rgb(0.086, 0.129, 0.11) });
  page.drawRectangle({ x: M, y: y - ctaH, width: 4, height: ctaH, color: JADE });
  page.drawText(pdfSafe('WHEN YOU WANT THE FILE RUN FOR YOU'), {
    x: M + 15,
    y: y - 15,
    size: 6.8,
    font: fonts.bold,
    color: JADE,
  });
  page.drawText(pdfSafe('Book a session - finelycred.com/enlightenment-session'), {
    x: M + 15,
    y: y - 32,
    size: 10,
    font: fonts.bold,
    color: PAPER,
  });
  page.drawText(
    pdfSafe('Free dispute guide - finelycred.com/free-guide   |   Build phase next - finelycred.com/resources/personal-credit-build-sheet'),
    { x: M + 15, y: y - 47, size: 7.4, font: fonts.regular, color: MUTED },
  );

  drawFooter(page, fonts, 3, 'ESCALATE');
}

export async function buildPersonalCreditRestoreSheetPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: SheetFonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  doc.setTitle(PERSONAL_CREDIT_RESTORE_SHEET.title);
  doc.setSubject(PERSONAL_CREDIT_RESTORE_SHEET.summary);
  doc.setProducer('Finely Cred');
  doc.setCreator('Finely Cred');

  drawSheetOne(doc.addPage([W, H]), fonts);
  drawSheetTwo(doc.addPage([W, H]), fonts);
  drawSheetThree(doc.addPage([W, H]), fonts);

  return doc.save();
}

export async function downloadPersonalCreditRestoreSheet() {
  const bytes = await buildPersonalCreditRestoreSheetPdf();
  downloadPdfBytes(bytes, PERSONAL_CREDIT_RESTORE_SHEET.filename);
}
