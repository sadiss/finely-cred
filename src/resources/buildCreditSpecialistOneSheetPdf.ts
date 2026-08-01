/**
 * Credit Specialist One-Sheet — single-page PDF for the guide landing.
 * Educational positioning only. No income guarantees.
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

const W = 612;
const H = 792;
const M = 28;
const FOOTER_H = 40;

const NAVY = rgb(0.02, 0.04, 0.08);
const INK = rgb(0.06, 0.08, 0.12);
const GOLD = rgb(0.83, 0.64, 0.28);
const GOLD_SOFT = rgb(0.94, 0.8, 0.46);
const LIME = rgb(0.58, 0.88, 0.0);
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.72, 0.74, 0.78);
const PANEL = rgb(0.08, 0.11, 0.18);
const PANEL_EDGE = rgb(0.22, 0.26, 0.34);

const COMPLIANCE =
  'Results vary · not legal advice · funding subject to underwriting · income not guaranteed · educational only.';

export const CREDIT_SPECIALIST_ONE_SHEET = {
  id: 'credit_specialist_playbook',
  title: 'Credit Specialist One-Sheet',
  filename: 'finely-cred-credit-specialist-onesheet.pdf',
  eyebrow: 'FINELY CRED · FREE E-GUIDE COMPANION',
  summary:
    'One-page map of the Credit Specialist craft: personal restore, business fundability, debt/laws education, and the specialist opportunity path — with links into the free in-app guide.',
  guidePath: '/credit-specialist-guide',
  readPath: '/credit-specialist-guide/read',
  joinPath: '/credit-specialist/join',
} as const;

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
  for (const w of words) {
    const test = row ? `${row} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (row) lines.push(row);
      row = w;
    } else {
      row = test;
    }
  }
  if (row) lines.push(row);
  return lines;
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  opts: { x: number; y: number; size: number; maxW: number; color: RGB; lineGap?: number; maxLines?: number },
): number {
  const gap = opts.lineGap ?? opts.size + 2.5;
  const lines = wrap(font, text, opts.size, opts.maxW);
  const use = opts.maxLines ? lines.slice(0, opts.maxLines) : lines;
  let y = opts.y;
  for (const line of use) {
    page.drawText(line, { x: opts.x, y, size: opts.size, font, color: opts.color });
    y -= gap;
  }
  return y;
}

type Fonts = { regular: PDFFont; bold: PDFFont };

function drawPillarCard(
  page: PDFPage,
  fonts: Fonts,
  opts: { x: number; y: number; w: number; h: number; title: string; lines: string[]; accent: RGB },
) {
  page.drawRectangle({
    x: opts.x,
    y: opts.y - opts.h,
    width: opts.w,
    height: opts.h,
    color: PANEL,
    borderColor: PANEL_EDGE,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: opts.x,
    y: opts.y - 4,
    width: opts.w,
    height: 4,
    color: opts.accent,
  });
  page.drawText(pdfSafe(opts.title), {
    x: opts.x + 10,
    y: opts.y - 22,
    size: 9.5,
    font: fonts.bold,
    color: GOLD_SOFT,
  });
  let cy = opts.y - 38;
  for (const line of opts.lines) {
    page.drawRectangle({ x: opts.x + 10, y: cy + 1, width: 3.5, height: 3.5, color: opts.accent });
    cy = drawWrapped(page, fonts.regular, line, {
      x: opts.x + 18,
      y: cy,
      size: 7.5,
      maxW: opts.w - 28,
      color: MUTED,
      lineGap: 9.5,
      maxLines: 2,
    });
    cy -= 4;
  }
}

export async function buildCreditSpecialistOneSheetPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  // Full dark canvas
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });

  // Hero band
  page.drawRectangle({ x: 0, y: H - 128, width: W, height: 128, color: INK });
  page.drawRectangle({ x: 0, y: H - 132, width: W, height: 4, color: GOLD });

  page.drawText(pdfSafe(CREDIT_SPECIALIST_ONE_SHEET.eyebrow), {
    x: M,
    y: H - 28,
    size: 8,
    font: fonts.bold,
    color: LIME,
  });
  page.drawText(pdfSafe('The Credit Specialist Playbook'), {
    x: M,
    y: H - 54,
    size: 22,
    font: fonts.bold,
    color: WHITE,
  });
  page.drawText(pdfSafe('One-Sheet · Personal · Business · Debt & Laws · Opportunity'), {
    x: M,
    y: H - 74,
    size: 10,
    font: fonts.regular,
    color: GOLD_SOFT,
  });
  drawWrapped(
    page,
    fonts.regular,
    'A free companion map for Credit Specialists who help partners restore personal files, sequence business credit, respond to debt pressure with documentation discipline, and open ethical growth lanes — without hype or guarantees.',
    {
      x: M,
      y: H - 94,
      size: 8.5,
      maxW: W - M * 2,
      color: MUTED,
      lineGap: 11,
      maxLines: 2,
    },
  );

  // Four pillar cards (2x2)
  const cardW = (W - M * 2 - 10) / 2;
  const cardH = 118;
  const topY = H - 152;
  const pillars = [
    {
      title: '01  PERSONAL CREDIT',
      accent: LIME,
      lines: [
        'Scores tell a story: payment history, utilization, age, mix, inquiries.',
        'Dispute with factual findings tied to bureau screenshots.',
        'Coach utilization and good-account protection — timelines vary.',
      ],
    },
    {
      title: '02  BUSINESS CREDIT',
      accent: rgb(0.49, 0.83, 0.99),
      lines: [
        'Entity truth before capital asks: name, EIN, address, phone match.',
        'Vendor depth and revolving optics before volume applications.',
        'Funding subject to underwriting — sequence first, ask second.',
      ],
    },
    {
      title: '03  DEBT + LAWS INSIGHT',
      accent: rgb(0.98, 0.44, 0.52),
      lines: [
        'Validation-first: organize notices, request writing, log contradictions.',
        'Summons = urgency + calendar — specialists educate, counsel decides.',
        'Educational only. Not legal advice. Outcomes vary by facts and state.',
      ],
    },
    {
      title: '04  SPECIALIST OPPORTUNITY',
      accent: GOLD,
      lines: [
        'Help partners rebuild optionality — then open funding and depth lanes.',
        'Run files on Finely Cred OS: disputes, vault, business tools, portal.',
        'Income varies with training, delivery, and ownership — never promised.',
      ],
    },
  ] as const;

  pillars.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (cardW + 10);
    const y = topY - row * (cardH + 10);
    drawPillarCard(page, fonts, {
      x,
      y,
      w: cardW,
      h: cardH,
      title: p.title,
      lines: [...p.lines],
      accent: p.accent,
    });
  });

  // Freedom / craft strip
  let y = topY - 2 * (cardH + 10) - 18;
  page.drawRectangle({
    x: M,
    y: y - 62,
    width: W - M * 2,
    height: 62,
    color: PANEL,
    borderColor: GOLD,
    borderWidth: 1.2,
  });
  page.drawText(pdfSafe('FINANCIAL FREEDOM FRAMING (COMPLIANT)'), {
    x: M + 12,
    y: y - 16,
    size: 8,
    font: fonts.bold,
    color: GOLD_SOFT,
  });
  drawWrapped(
    page,
    fonts.regular,
    'Freedom here means optionality: cleaner files, calmer debt response, fundable business optics, and a specialist craft you can teach. It is not a salary promise. Teach systems, document honestly, and let underwriting and courts decide outcomes.',
    {
      x: M + 12,
      y: y - 32,
      size: 8,
      maxW: W - M * 2 - 24,
      color: MUTED,
      lineGap: 10.5,
      maxLines: 2,
    },
  );

  // How to use + next steps
  y -= 82;
  page.drawText(pdfSafe('HOW TO USE THIS WITH THE FREE E-GUIDE'), {
    x: M,
    y,
    size: 9,
    font: fonts.bold,
    color: LIME,
  });
  y -= 14;
  const steps = [
    'Open the in-app guide at finelycred.com/credit-specialist-guide — no signup required to read.',
    'Click any chapter preview (or Open e-guide) to enter the readable chapter view.',
    'Study personal restore, business sequencing, debt/laws education, then opportunity chapters.',
    'When ready for tiers and signup, continue to /credit-specialist/join — keep reading until then.',
  ];
  for (const step of steps) {
    page.drawRectangle({ x: M, y: y + 1, width: 4, height: 4, color: GOLD });
    y = drawWrapped(page, fonts.regular, step, {
      x: M + 12,
      y,
      size: 8,
      maxW: W - M * 2 - 12,
      color: MUTED,
      lineGap: 10.5,
      maxLines: 2,
    });
    y -= 5;
  }

  // CTA bar
  y -= 8;
  page.drawRectangle({ x: M, y: y - 58, width: W - M * 2, height: 58, color: rgb(0.12, 0.1, 0.05) });
  page.drawRectangle({ x: M, y: y - 58, width: 5, height: 58, color: GOLD });
  page.drawText(pdfSafe('NEXT STEP'), {
    x: M + 16,
    y: y - 16,
    size: 7.5,
    font: fonts.bold,
    color: GOLD_SOFT,
  });
  page.drawText(pdfSafe('Read the free e-guide  ·  finelycred.com/credit-specialist-guide/read'), {
    x: M + 16,
    y: y - 32,
    size: 10,
    font: fonts.bold,
    color: WHITE,
  });
  page.drawText(pdfSafe('Join when ready  ·  finelycred.com/credit-specialist/join'), {
    x: M + 16,
    y: y - 48,
    size: 8.5,
    font: fonts.regular,
    color: MUTED,
  });

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: INK });
  page.drawRectangle({ x: 0, y: FOOTER_H - 2, width: W, height: 2, color: GOLD });
  page.drawText(pdfSafe(COMPLIANCE), {
    x: M,
    y: 22,
    size: 6.5,
    font: fonts.regular,
    color: rgb(0.55, 0.56, 0.6),
  });
  page.drawText(pdfSafe('FINELY CRED'), {
    x: W - M - 72,
    y: 10,
    size: 7.5,
    font: fonts.bold,
    color: GOLD,
  });
  page.drawText(pdfSafe('Partner materials  ·  Credit Specialist'), {
    x: M,
    y: 10,
    size: 7,
    font: fonts.regular,
    color: rgb(0.55, 0.56, 0.6),
  });

  return doc.save();
}

export async function downloadCreditSpecialistOneSheet() {
  const bytes = await buildCreditSpecialistOneSheetPdf();
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = CREDIT_SPECIALIST_ONE_SHEET.filename;
  a.click();
  URL.revokeObjectURL(url);
}
