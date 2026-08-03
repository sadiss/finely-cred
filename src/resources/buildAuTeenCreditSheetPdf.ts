/**
 * Authorized User & Teen Credit — 2-sheet parent kit.
 *
 * Visual language: midnight card gallery. Embossed plastic tiles, an issuer policy matrix, and a
 * transition timeline. Deliberately unlike the charcoal Restore dossier and the pale Build blueprint.
 *
 * Sheet 1 — Who can be added, and whether it ever reaches a bureau.
 * Sheet 2 — The parent playbook: what AU moves, the risks, and the 18th-birthday handoff.
 *
 * Issuer policies below are educational summaries only. They change without notice and are
 * confirmed by the issuer, never by us.
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
const M = 32;
const RIGHT = W - M;
const CONTENT_W = RIGHT - M;
const FOOTER_H = 34;

const MID = rgb(0.043, 0.055, 0.106);
const DEEP = rgb(0.02, 0.027, 0.059);
const PLATE = rgb(0.078, 0.09, 0.157);
const PLATE_ALT = rgb(0.063, 0.075, 0.129);
const PLATE_HEAD = rgb(0.106, 0.122, 0.204);
const EDGE = rgb(0.192, 0.216, 0.314);
const HAIRLINE = rgb(0.145, 0.165, 0.251);

const WHITE = rgb(1, 1, 1);
const TEXT = rgb(0.906, 0.918, 0.949);
const MUTED = rgb(0.667, 0.694, 0.765);
const FAINT = rgb(0.451, 0.478, 0.557);

const GOLD = rgb(0.878, 0.725, 0.4);
const TEAL = rgb(0.298, 0.847, 0.784);
const LILAC = rgb(0.647, 0.596, 0.98);
const CORAL = rgb(0.976, 0.475, 0.443);

const COMPLIANCE =
  'Educational material - not legal, tax, or financial advice. Issuer age rules and bureau reporting practices change without notice; confirm with the issuer before you rely on any of it. Authorized user reporting is never automatic and no score outcome is promised.';

export const AU_TEEN_CREDIT_SHEET = {
  id: 'au_teen_credit_sheet',
  pageCount: 2,
  sheetLabel: '2-sheet',
  title: 'Authorized User & Teen Credit — 2-Sheet Parent Kit',
  shortLabel: '2-sheet AU & teen kit',
  downloadLabel: 'Download the 2-sheet parent kit',
  filename: 'finely-cred-au-teen-credit-2-sheet.pdf',
  eyebrow: 'AUTHORIZED USER + TEEN CREDIT - 2-SHEET PARENT KIT',
  route: '/resources/au-teen-credit-sheet',
  summary:
    'Two sheets for parents and AU buyers who want the truth: the issuer minimum-age and reporting matrix, why a minor being added does not mean a bureau ever sees it, what an AU line genuinely moves, the risks that run both directions, and the 18th-birthday handoff plan.',
  pages: [
    {
      n: 1,
      title: 'Who can be added — and whether it reports',
      body: 'Issuer minimum ages including the roughly-13 policies, which issuers commonly furnish a minor\'s AU line and which usually do not, and the four things that must all be true before an AU account reaches a credit file.',
    },
    {
      n: 2,
      title: 'The parent playbook',
      body: 'What an AU line actually moves, what it will never do, the eight-point setup checklist, risks in both directions, removal mechanics, and a step-by-step 18th-birthday transition.',
    },
  ],
} as const;

/* ── card-gallery primitives ─────────────────────────────────────────── */

function drawGalleryStock(page: PDFPage, fonts: SheetFonts, sheetNo: number) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: MID });
  // Faint embossed ribs, like brushed card plastic.
  for (let x = 0; x <= W; x += 22) {
    page.drawRectangle({ x, y: 0, width: 0.5, height: H, color: rgb(0.059, 0.071, 0.129) });
  }
  page.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: sheetNo === 1 ? GOLD : TEAL });
}

function drawGalleryHead(
  page: PDFPage,
  fonts: SheetFonts,
  o: { sheetNo: number; kicker: string; title: string; accent: string; lede: string; badge: string; accentColor: RGB },
): number {
  const bandH = 116;
  page.drawRectangle({ x: 0, y: H - bandH, width: W, height: bandH, color: DEEP });

  page.drawText(pdfSafe(o.kicker), { x: M, y: H - 30, size: 7.2, font: fonts.bold, color: o.accentColor });

  const titleSize = 19;
  page.drawText(pdfSafe(o.title), { x: M, y: H - 56, size: titleSize, font: fonts.bold, color: WHITE });
  const titleW = fonts.bold.widthOfTextAtSize(pdfSafe(o.title), titleSize);
  page.drawText(pdfSafe(o.accent), {
    x: M + titleW + 7,
    y: H - 56,
    size: titleSize,
    font: fonts.bold,
    color: o.accentColor,
  });

  drawParagraph(page, fonts.regular, o.lede, {
    x: M,
    y: H - 64,
    size: 7.7,
    maxW: CONTENT_W - 118,
    color: MUTED,
    maxLines: 3,
  });

  // Mini "card" badge, top right.
  const badgeW = 104;
  const badgeH = 60;
  const bx = RIGHT - badgeW;
  const by = H - 26 - badgeH;
  page.drawRectangle({ x: bx, y: by, width: badgeW, height: badgeH, color: PLATE, borderColor: o.accentColor, borderWidth: 0.9 });
  page.drawRectangle({ x: bx + 9, y: by + badgeH - 24, width: 15, height: 11, color: o.accentColor });
  page.drawText(pdfSafe(`SHEET ${o.sheetNo} / 2`), {
    x: bx + 30,
    y: by + badgeH - 21,
    size: 7,
    font: fonts.bold,
    color: TEXT,
  });
  drawParagraph(page, fonts.regular, o.badge, {
    x: bx + 9,
    y: by + badgeH - 30,
    size: 6.3,
    maxW: badgeW - 18,
    color: MUTED,
    maxLines: 3,
  });

  return H - bandH - 15;
}

function drawGalleryRule(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; label: string; accent: RGB; hint?: string },
): number {
  page.drawCircle({ x: M + 3, y: o.y - 5, size: 3, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: M + 12, y: o.y - 8.4, size: 8.2, font: fonts.bold, color: TEXT });
  if (o.hint) drawRightText(page, fonts.regular, o.hint, { right: RIGHT, y: o.y - 8, size: 6.6, color: FAINT });
  page.drawRectangle({ x: M, y: o.y - 15, width: CONTENT_W, height: 0.6, color: HAIRLINE });
  return o.y - 22;
}

/** Embossed plastic tile with a chip, a headline figure, and a caption. */
function drawCardTiles(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; h?: number; tiles: { figure: string; label: string; caption: string; accent: RGB }[] },
): number {
  const gap = 9;
  const h = o.h ?? 74;
  const w = (CONTENT_W - gap * (o.tiles.length - 1)) / o.tiles.length;
  o.tiles.forEach((tile, i) => {
    const x = M + i * (w + gap);
    page.drawRectangle({ x, y: o.y - h, width: w, height: h, color: PLATE, borderColor: EDGE, borderWidth: 0.8 });
    page.drawRectangle({ x, y: o.y - h, width: w, height: 2.4, color: tile.accent });
    // chip
    page.drawRectangle({ x: x + 11, y: o.y - 24, width: 15, height: 11, color: tile.accent });
    page.drawRectangle({ x: x + 15.6, y: o.y - 24, width: 0.6, height: 11, color: PLATE });
    page.drawRectangle({ x: x + 11, y: o.y - 19.2, width: 15, height: 0.6, color: PLATE });

    page.drawText(pdfSafe(tile.figure), { x: x + 32, y: o.y - 24, size: 15, font: fonts.bold, color: tile.accent });
    page.drawText(pdfSafe(tile.label), { x: x + 11, y: o.y - 38, size: 6.6, font: fonts.bold, color: TEXT });
    drawParagraph(page, fonts.regular, tile.caption, {
      x: x + 11,
      y: o.y - 42,
      size: 6.5,
      maxW: w - 22,
      color: MUTED,
      maxLines: 3,
    });
  });
  return o.y - h;
}

type MatrixCol = { label: string; width: number };

function drawMatrix(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; cols: MatrixCol[]; rows: string[][]; accent: RGB; maxLines?: number; tone?: (row: string[]) => RGB },
): number {
  const size = 7.1;
  const gap = size + 2.5;
  const pad = 7;
  let y = o.y;

  page.drawRectangle({ x: M, y: y - 15, width: CONTENT_W, height: 15, color: PLATE_HEAD });
  let hx = M;
  for (const col of o.cols) {
    page.drawText(pdfSafe(col.label), { x: hx + pad, y: y - 10.2, size: 6.2, font: fonts.bold, color: o.accent });
    hx += col.width;
  }
  y -= 15;
  page.drawRectangle({ x: M, y: y - 0.9, width: CONTENT_W, height: 0.9, color: o.accent });

  o.rows.forEach((row, ri) => {
    const lines = Math.max(
      1,
      ...row.map((cell, i) =>
        Math.min(o.maxLines ?? 3, wrapText(fonts.regular, cell, size, (o.cols[i]?.width ?? 90) - pad * 2).length),
      ),
    );
    const rowH = 7 + lines * gap;
    page.drawRectangle({ x: M, y: y - rowH, width: CONTENT_W, height: rowH, color: ri % 2 === 1 ? PLATE_ALT : PLATE });
    const tone = o.tone?.(row);
    if (tone) page.drawRectangle({ x: M, y: y - rowH, width: 2.2, height: rowH, color: tone });
    let cx = M;
    row.forEach((cell, i) => {
      const col = o.cols[i];
      if (!col) return;
      drawParagraph(page, i === 0 ? fonts.bold : fonts.regular, cell, {
        x: cx + pad + (i === 0 && tone ? 2 : 0),
        y: y - 3.5,
        size,
        maxW: col.width - pad * 2,
        color: i === 0 ? TEXT : MUTED,
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

function drawGates(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; items: { title: string; body: string }[]; accent: RGB },
): number {
  const gap = 8;
  const w = (CONTENT_W - gap * (o.items.length - 1)) / o.items.length;
  const h = 82;
  o.items.forEach((item, i) => {
    const x = M + i * (w + gap);
    page.drawRectangle({ x, y: o.y - h, width: w, height: h, color: PLATE, borderColor: EDGE, borderWidth: 0.7 });
    page.drawCircle({ x: x + 16, y: o.y - 18, size: 8.5, color: o.accent });
    drawCenteredText(page, fonts.bold, String(i + 1), { centerX: x + 16, y: o.y - 21, size: 9, color: DEEP });
    if (i < o.items.length - 1) {
      page.drawText(pdfSafe('>'), { x: x + w + 1.4, y: o.y - 22, size: 9, font: fonts.bold, color: FAINT });
    }
    drawParagraph(page, fonts.bold, item.title, {
      x: x + 30,
      y: o.y - 10,
      size: 7.6,
      maxW: w - 38,
      color: TEXT,
      maxLines: 2,
    });
    drawParagraph(page, fonts.regular, item.body, {
      x: x + 11,
      y: o.y - 34,
      size: 6.8,
      maxW: w - 22,
      color: MUTED,
      maxLines: 5,
    });
  });
  return o.y - h;
}

function drawTwoTone(
  page: PDFPage,
  fonts: SheetFonts,
  o: {
    y: number;
    h: number;
    left: { title: string; items: readonly string[]; accent: RGB };
    right: { title: string; items: readonly string[]; accent: RGB };
  },
) {
  const gap = 11;
  const w = (CONTENT_W - gap) / 2;
  [o.left, o.right].forEach((panel, i) => {
    const x = M + i * (w + gap);
    page.drawRectangle({ x, y: o.y - o.h, width: w, height: o.h, color: PLATE, borderColor: panel.accent, borderWidth: 0.8 });
    page.drawRectangle({ x, y: o.y - o.h, width: 3, height: o.h, color: panel.accent });
    page.drawText(pdfSafe(panel.title), { x: x + 13, y: o.y - 17, size: 7.4, font: fonts.bold, color: panel.accent });
    let y = o.y - 25;
    for (const item of panel.items) {
      page.drawRectangle({ x: x + 13, y: y - 6, width: 2.6, height: 2.6, color: panel.accent });
      y = drawParagraph(page, fonts.regular, item, {
        x: x + 20,
        y,
        size: 7,
        maxW: w - 32,
        color: MUTED,
        maxLines: 3,
      });
      y -= 4;
    }
  });
}

function drawChecklist(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; items: readonly string[]; accent: RGB; cols?: number },
): number {
  const cols = o.cols ?? 2;
  const gutter = 14;
  const colW = (CONTENT_W - gutter * (cols - 1)) / cols;
  const rowH = 17;
  const rows = Math.ceil(o.items.length / cols);
  o.items.forEach((item, i) => {
    const x = M + (i % cols) * (colW + gutter);
    const y = o.y - Math.floor(i / cols) * rowH;
    page.drawRectangle({ x, y: y - 8, width: 7.4, height: 7.4, borderColor: o.accent, borderWidth: 0.85 });
    drawParagraph(page, fonts.regular, item, {
      x: x + 12,
      y: y - 0.6,
      size: 7.1,
      maxW: colW - 12,
      color: MUTED,
      maxLines: 1,
    });
  });
  return o.y - rows * rowH + 2;
}

function drawNote(
  page: PDFPage,
  fonts: SheetFonts,
  o: { y: number; label: string; body: string; accent: RGB },
): number {
  const inner = CONTENT_W - 26;
  const h = 15 + paragraphHeight(fonts.regular, o.body, 7.1, inner) + 10;
  page.drawRectangle({ x: M, y: o.y - h, width: CONTENT_W, height: h, color: PLATE, borderColor: o.accent, borderWidth: 0.9 });
  page.drawRectangle({ x: M, y: o.y - h, width: CONTENT_W, height: 2.4, color: o.accent });
  page.drawText(pdfSafe(o.label), { x: M + 14, y: o.y - 15, size: 6.8, font: fonts.bold, color: o.accent });
  drawParagraph(page, fonts.regular, o.body, { x: M + 14, y: o.y - 19, size: 7.1, maxW: inner, color: MUTED });
  return o.y - h;
}

function drawFooter(page: PDFPage, fonts: SheetFonts, sheetNo: number, tag: string, accent: RGB) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: DEEP });
  page.drawRectangle({ x: 0, y: FOOTER_H - 1.4, width: W, height: 1.4, color: accent });
  let cy = 22;
  for (const line of wrapText(fonts.regular, COMPLIANCE, 5.9, W - M - 140)) {
    page.drawText(line, { x: M, y: cy, size: 5.9, font: fonts.regular, color: FAINT });
    cy -= 7.2;
  }
  page.drawText(pdfSafe('finelycred.com/resources/au-teen-credit-sheet'), {
    x: M,
    y: 6,
    size: 6.2,
    font: fonts.regular,
    color: FAINT,
  });
  drawRightText(page, fonts.bold, `SHEET ${sheetNo} OF 2 - ${tag}`, { right: RIGHT, y: 6, size: 6.8, color: accent });
}

/* ── Sheet 1 ─────────────────────────────────────────────────────────── */

function drawSheetOne(page: PDFPage, fonts: SheetFonts) {
  drawGalleryStock(page, fonts, 1);
  let y = drawGalleryHead(page, fonts, {
    sheetNo: 1,
    kicker: AU_TEEN_CREDIT_SHEET.eyebrow,
    title: 'Added is not the same as',
    accent: 'reported.',
    accentColor: GOLD,
    lede: 'Adding a teenager as an authorized user takes five minutes. Whether that line ever appears on a credit file depends on the issuer, the age of the child, and whether a file exists to attach it to. Know all three before you count on it.',
    badge: 'Issuer ages, reporting reality, and the four gates an AU line has to clear.',
  });

  y = drawCardTiles(page, fonts, {
    y,
    tiles: [
      {
        figure: '13',
        label: 'Youngest commonly allowed',
        caption: 'American Express and U.S. Bank set minimum authorized user ages around 13. Several issuers publish no minimum at all.',
        accent: GOLD,
      },
      {
        figure: '18',
        label: 'When reporting gets reliable',
        caption: 'Some issuers - Chase and Amex among them - commonly do not furnish a minor\'s AU line to the bureaus until adulthood.',
        accent: CORAL,
      },
      {
        figure: '0',
        label: 'Guarantees available',
        caption: 'No issuer promises to report an AU, and none promise a score effect. Treat every claim otherwise as a sales pitch.',
        accent: TEAL,
      },
    ],
  });
  y -= 14;

  y = drawGalleryRule(page, fonts, {
    y,
    label: 'ISSUER MINIMUM AGE + REPORTING MATRIX',
    accent: GOLD,
    hint: 'Educational summary - policies change without notice',
  });
  y = drawMatrix(page, fonts, {
    y,
    accent: GOLD,
    maxLines: 2,
    tone: (row) => (row[2]?.startsWith('Often not') ? CORAL : row[2]?.startsWith('Commonly') ? TEAL : LILAC),
    cols: [
      { label: 'ISSUER', width: 104 },
      { label: 'MINIMUM AU AGE', width: 96 },
      { label: 'REPORTS A MINOR AU?', width: 108 },
      { label: 'WHAT THAT MEANS FOR YOU', width: CONTENT_W - 104 - 96 - 108 },
    ],
    rows: [
      ['American Express', 'About 13', 'Often not for minors', 'Great for teaching habits early; do not expect a bureau line before 18.'],
      ['U.S. Bank', 'About 13', 'Varies', 'Low age bar. Ask the issuer directly whether a minor AU is furnished.'],
      ['Discover', 'About 15', 'Generally yes', 'Publishes an age floor and commonly furnishes AU data.'],
      ['Capital One', 'No stated minimum', 'Varies', 'No published age floor, but minor-AU reporting is inconsistently confirmed - verify today.'],
      ['Chase', 'No stated minimum', 'Often not for minors', 'Easy to add at any age; the line frequently does not surface until 18.'],
      ['Bank of America', 'No stated minimum', 'Generally yes', 'Confirm the AU is furnished to all three bureaus, not just one.'],
      ['Citi', 'No stated minimum', 'Generally yes', 'Verify which bureaus receive the data before you plan around it.'],
      ['Wells Fargo', 'No stated minimum', 'Varies', 'Policy has shifted over time - call and get the current answer.'],
    ],
  });
  y -= 12;

  y = drawGalleryRule(page, fonts, {
    y,
    label: 'THE FOUR GATES AN AU LINE MUST CLEAR',
    accent: TEAL,
    hint: 'All four, or nothing reaches the file',
  });
  y = drawGates(page, fonts, {
    y,
    accent: TEAL,
    items: [
      {
        title: 'The issuer allows the age',
        body: 'Some publish a floor, some do not. Ask before you apply rather than after you have paid for anything.',
      },
      {
        title: 'The issuer furnishes AU data',
        body: 'Adding someone to your account and reporting them to a bureau are two separate decisions the issuer makes.',
      },
      {
        title: 'A credit file exists to match',
        body: 'Bureaus do not open files for minors. Without a matching identity record the furnished line has nowhere to land.',
      },
      {
        title: 'The data actually matches',
        body: 'Name, date of birth, and Social Security number must line up. A typo quietly sends the line nowhere.',
      },
    ],
  });
  y -= 13;

  drawNote(page, fonts, {
    y,
    label: 'CONFIRM IT YOURSELF - IN WRITING',
    accent: CORAL,
    body: 'Call the number on the back of the card and ask two questions: what is your minimum authorized user age, and do you report authorized users under 18 to Equifax, Experian, and TransUnion? Write the date and the representative\'s answer down. Issuer policy is the only source that counts, it changes without notice, and nobody selling you a tradeline can override it.',
  });

  drawFooter(page, fonts, 1, 'AGES + REPORTING', GOLD);
}

/* ── Sheet 2 ─────────────────────────────────────────────────────────── */

function drawSheetTwo(page: PDFPage, fonts: SheetFonts) {
  drawGalleryStock(page, fonts, 2);
  let y = drawGalleryHead(page, fonts, {
    sheetNo: 2,
    kicker: 'PARENT PLAYBOOK - SET IT UP, PROTECT IT, HAND IT OVER',
    title: 'Lend the history.',
    accent: 'Keep the control.',
    accentColor: TEAL,
    lede: 'An authorized user line is your account, lent out. You keep the card, the limit, and every consequence - which is exactly why the setup and the exit matter more than the add itself.',
    badge: 'What it moves, what it never does, and the 18th-birthday handoff.',
  });

  y = drawGalleryRule(page, fonts, { y, label: 'WHAT AN AU LINE ACTUALLY DOES', accent: TEAL });
  y = drawMatrix(page, fonts, {
    y,
    accent: TEAL,
    maxLines: 2,
    cols: [
      { label: 'IT CAN', width: 152 },
      { label: 'HOW', width: 194 },
      { label: 'IT WILL NOT', width: CONTENT_W - 152 - 194 },
    ],
    rows: [
      ['Add account age', 'The account\'s open date can carry onto the AU\'s file when furnished', 'Erase a negative already reporting'],
      ['Add available limit', 'A large, low-balance limit improves utilization optics', 'Fix a maxed-out card they hold themselves'],
      ['Add payment depth', 'Years of on-time history attach to a thin file', 'Substitute for their own accounts'],
      ['Teach the habit', 'A real card, a real statement, a real due date', 'Guarantee any score number or approval'],
    ],
  });
  y -= 12;

  y = drawGalleryRule(page, fonts, { y, label: 'SETUP CHECKLIST - ALL EIGHT BEFORE YOU ADD ANYONE', accent: GOLD });
  y = drawChecklist(page, fonts, {
    y,
    accent: GOLD,
    items: [
      'Issuer confirmed the minimum age in writing',
      'Issuer confirmed it furnishes AU to all three bureaus',
      'Account utilization is under 30 percent and staying there',
      'Account has zero late payments in its full history',
      'Card is old enough that its age is worth lending',
      'Teen\'s legal name, date of birth, and SSN verified',
      'Decide now: do they get a physical card or not',
      'Calendar a check of their report in 60 to 90 days',
    ],
  });
  y -= 13;

  y = drawGalleryRule(page, fonts, { y, label: 'RISK RUNS BOTH DIRECTIONS', accent: CORAL, hint: 'Removal is the exit - use it early' });
  drawTwoTone(page, fonts, {
    y,
    h: 104,
    left: {
      title: 'WHAT THEY INHERIT FROM YOU',
      accent: CORAL,
      items: [
        'Your late payments can attach to their file exactly the way your on-time payments do.',
        'If you run the balance up, their utilization optics go up with it.',
        'A charge-off or closure on your account can follow onto the line you lent them.',
        'Adding a young or thin account can pull their average age down instead of up.',
      ],
    },
    right: {
      title: 'WHAT YOU KEEP CARRYING',
      accent: LILAC,
      items: [
        'Every dollar they spend is legally yours to repay - AU status carries no liability for them.',
        'You can remove an authorized user with one call, usually effective immediately.',
        'Removal typically drops the line from their file; history built elsewhere stays theirs.',
        'Never pay for an AU placement you cannot verify, unwind, or see reported.',
      ],
    },
  });
  y -= 104 + 14;

  y = drawGalleryRule(page, fonts, { y, label: 'THE 18TH-BIRTHDAY HANDOFF', accent: LILAC, hint: 'Plan the exit before you need it' });
  const stepGap = 7;
  const steps = [
    { when: 'Age 16-17', what: 'Teach statements', body: 'Read the statement together every month. Show what utilization looks like on a real card.' },
    { when: 'Turning 18', what: 'Check the file', body: 'Pull all three reports at annualcreditreport.com and see whether the AU line actually appears.' },
    { when: 'First 90 days', what: 'Open their own', body: 'A student or secured card in their name. The AU line supports it; it cannot replace it.' },
    { when: 'Months 4-9', what: 'Build their history', body: 'One small recurring charge, autopay on, paid before the statement cuts every cycle.' },
    { when: 'Month 12', what: 'Unwind cleanly', body: 'Once their own accounts carry the file, remove the AU line and let their record stand alone.' },
  ];
  const stepW = (CONTENT_W - stepGap * (steps.length - 1)) / steps.length;
  const stepH = 92;
  steps.forEach((step, i) => {
    const x = M + i * (stepW + stepGap);
    page.drawRectangle({ x, y: y - stepH, width: stepW, height: stepH, color: PLATE, borderColor: EDGE, borderWidth: 0.7 });
    page.drawRectangle({ x, y: y - stepH, width: stepW, height: 15, color: PLATE_HEAD });
    drawCenteredText(page, fonts.bold, step.when, { centerX: x + stepW / 2, y: y - stepH + 5, size: 6.3, color: LILAC });
    page.drawRectangle({ x, y: y - 2.4, width: stepW, height: 2.4, color: LILAC });
    drawParagraph(page, fonts.bold, step.what, {
      x: x + 9,
      y: y - 10,
      size: 8,
      maxW: stepW - 18,
      color: TEXT,
      maxLines: 2,
    });
    drawParagraph(page, fonts.regular, step.body, {
      x: x + 9,
      y: y - 34,
      size: 6.6,
      maxW: stepW - 18,
      color: MUTED,
      maxLines: 6,
    });
  });
  y -= stepH + 13;

  const ctaH = 64;
  page.drawRectangle({ x: M, y: y - ctaH, width: CONTENT_W, height: ctaH, color: rgb(0.063, 0.098, 0.106) });
  page.drawRectangle({ x: M, y: y - ctaH, width: 4, height: ctaH, color: TEAL });
  page.drawText(pdfSafe('WHEN YOU WANT IT DONE WITH YOU'), { x: M + 15, y: y - 15, size: 6.8, font: fonts.bold, color: TEAL });
  page.drawText(pdfSafe('Browse verified AU inventory - finelycred.com/tradelines'), {
    x: M + 15,
    y: y - 33,
    size: 10,
    font: fonts.bold,
    color: WHITE,
  });
  page.drawText(
    pdfSafe('Free tradeline guide - finelycred.com/free-tradeline-guide   |   Book a session - finelycred.com/enlightenment-session'),
    { x: M + 15, y: y - 48, size: 7.4, font: fonts.regular, color: MUTED },
  );

  drawFooter(page, fonts, 2, 'PARENT PLAYBOOK', TEAL);
}

export async function buildAuTeenCreditSheetPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: SheetFonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  doc.setTitle(AU_TEEN_CREDIT_SHEET.title);
  doc.setSubject(AU_TEEN_CREDIT_SHEET.summary);
  doc.setProducer('Finely Cred');
  doc.setCreator('Finely Cred');

  drawSheetOne(doc.addPage([W, H]), fonts);
  drawSheetTwo(doc.addPage([W, H]), fonts);

  return doc.save();
}

export async function downloadAuTeenCreditSheet() {
  const bytes = await buildAuTeenCreditSheetPdf();
  downloadPdfBytes(bytes, AU_TEEN_CREDIT_SHEET.filename);
}
