import {
  drawPremiumGlowBackground,
  PDF_GREEN,
  PDF_MARGIN,
  PDF_PAGE_H,
  PDF_PAGE_W,
  pdfSafeText,
  type PdfMeta,
} from './buildFreeGuidePdf';

type PdfFonts = { regular: unknown; bold: unknown };
type RgbFn = (r: number, g: number, b: number) => unknown;

type PdfDrawPage = {
  drawRectangle: (o: object) => void;
  drawText: (t: string, o: object) => void;
  drawImage?: (img: unknown, o: { x: number; y: number; width: number; height: number }) => void;
};

export function formatGuidePersonalizationDate(d = new Date()) {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

/** Branded text cover — no score mockup (fallback when PNG unavailable). */
export function drawDisputeGuideTextCoverPage(page: PdfDrawPage, fonts: PdfFonts, rgb: RgbFn) {
  drawPremiumGlowBackground(page, rgb);

  const panelW = PDF_PAGE_W - PDF_MARGIN * 2;
  const panelH = 340;
  const panelY = (PDF_PAGE_H - panelH) / 2;

  page.drawRectangle({
    x: PDF_MARGIN,
    y: panelY,
    width: panelW,
    height: panelH,
    color: rgb(0.06, 0.09, 0.08),
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 1.2,
    opacity: 0.97,
  });

  let y = panelY + panelH - 32;
  page.drawText('FINELY CRED', {
    x: PDF_MARGIN + 24,
    y,
    size: 10,
    font: fonts.bold,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  y -= 18;
  page.drawText('FREE EDITION', {
    x: PDF_MARGIN + 24,
    y,
    size: 9,
    font: fonts.bold,
    color: rgb(0.55, 0.92, 0.72),
  });
  y -= 28;
  page.drawText('Equifax  ·  Experian  ·  TransUnion', {
    x: PDF_MARGIN + 24,
    y,
    size: 8,
    font: fonts.regular,
    color: rgb(0.55, 0.6, 0.58),
  });
  y -= 28;
  page.drawText('Credit Dispute', {
    x: PDF_MARGIN + 24,
    y,
    size: 28,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 32;
  page.drawText('Letter Guide', {
    x: PDF_MARGIN + 24,
    y,
    size: 28,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 28;
  page.drawText('FCRA rights · 5-step framework · certified mail workflow', {
    x: PDF_MARGIN + 24,
    y,
    size: 10,
    font: fonts.regular,
    color: rgb(0.72, 0.78, 0.76),
  });
}

/** Cover page — embed guide artwork PNG (no score bar page). */
export async function drawDisputeGuideCoverImagePage(
  page: PdfDrawPage,
  pdfDoc: {
    embedPng: (bytes: Uint8Array) => Promise<{
      width: number;
      height: number;
      scale: (factor: number) => { width: number; height: number };
    }>;
  },
  fonts: PdfFonts,
  rgb: RgbFn,
  coverUrl: string,
) {
  try {
    const res = await fetch(coverUrl);
    if (!res.ok) throw new Error('cover fetch failed');
    const bytes = new Uint8Array(await res.arrayBuffer());
    const img = await pdfDoc.embedPng(bytes);
    const dims = img.scale(1);
    const scale = Math.min(PDF_PAGE_W / dims.width, PDF_PAGE_H / dims.height);
    const w = dims.width * scale;
    const h = dims.height * scale;
    if (page.drawImage) {
      page.drawImage(img, { x: (PDF_PAGE_W - w) / 2, y: (PDF_PAGE_H - h) / 2, width: w, height: h });
      return;
    }
    throw new Error('drawImage unavailable');
  } catch {
    drawDisputeGuideTextCoverPage(page, fonts, rgb);
  }
}

/** @deprecated Score bar cover removed from downloadable guide — use drawDisputeGuideCoverImagePage */
export function drawDisputeGuideScoreBarCoverPage(
  page: PdfDrawPage,
  fonts: PdfFonts,
  rgb: RgbFn,
) {
  drawPremiumGlowBackground(page, rgb);

  const panelW = PDF_PAGE_W - PDF_MARGIN * 2;
  const panelH = 440;
  const panelY = PDF_PAGE_H - PDF_MARGIN - panelH - 36;

  page.drawRectangle({
    x: PDF_MARGIN,
    y: panelY,
    width: panelW,
    height: panelH,
    color: rgb(0.06, 0.09, 0.08),
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 1.2,
    opacity: 0.97,
  });

  let y = panelY + panelH - 32;
  page.drawText('FINELY CRED', {
    x: PDF_MARGIN + 24,
    y,
    size: 10,
    font: fonts.bold,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  y -= 18;
  page.drawText('FREE EDITION', {
    x: PDF_MARGIN + 24,
    y,
    size: 9,
    font: fonts.bold,
    color: rgb(0.55, 0.92, 0.72),
  });
  y -= 28;
  page.drawText('Equifax  ·  Experian  ·  TransUnion', {
    x: PDF_MARGIN + 24,
    y,
    size: 8,
    font: fonts.regular,
    color: rgb(0.55, 0.6, 0.58),
  });
  y -= 28;
  page.drawText('Credit Dispute', {
    x: PDF_MARGIN + 24,
    y,
    size: 28,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 32;
  page.drawText('Letter Guide', {
    x: PDF_MARGIN + 24,
    y,
    size: 28,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 28;
  page.drawText('FCRA rights · 5-step framework · certified mail workflow', {
    x: PDF_MARGIN + 24,
    y,
    size: 10,
    font: fonts.regular,
    color: rgb(0.72, 0.78, 0.76),
  });

  const scoreCardY = panelY + 52;
  const scoreCardH = 92;
  page.drawRectangle({
    x: PDF_MARGIN + 24,
    y: scoreCardY,
    width: panelW - 48,
    height: scoreCardH,
    color: rgb(0.08, 0.14, 0.11),
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 0.8,
    opacity: 0.85,
  });
  page.drawText('OVERALL SCORE', {
    x: PDF_MARGIN + 36,
    y: scoreCardY + scoreCardH - 22,
    size: 8,
    font: fonts.bold,
    color: rgb(0.55, 0.6, 0.58),
  });
  page.drawText('682', {
    x: PDF_MARGIN + 36,
    y: scoreCardY + 38,
    size: 36,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  page.drawText('+24', {
    x: PDF_MARGIN + 88,
    y: scoreCardY + 48,
    size: 11,
    font: fonts.bold,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  const barX = PDF_MARGIN + 36;
  const barY = scoreCardY + 22;
  const barW = panelW - 72;
  page.drawRectangle({
    x: barX,
    y: barY,
    width: barW,
    height: 6,
    color: rgb(0.2, 0.22, 0.24),
  });
  page.drawRectangle({
    x: barX,
    y: barY,
    width: barW * 0.68,
    height: 6,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  page.drawText('Profile + dispute readiness', {
    x: PDF_MARGIN + 36,
    y: scoreCardY + 8,
    size: 8,
    font: fonts.regular,
    color: rgb(0.55, 0.6, 0.58),
  });

  const stripY = PDF_MARGIN + 8;
  page.drawRectangle({
    x: PDF_MARGIN,
    y: stripY,
    width: panelW,
    height: 34,
    color: rgb(0, 0, 0),
    opacity: 0.45,
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 0.8,
  });
  page.drawText('Step-by-step  |  Instant PDF  |  FCRA checklist  |  Educational only', {
    x: PDF_MARGIN + 14,
    y: stripY + 11,
    size: 8,
    font: fonts.regular,
    color: rgb(0.92, 0.98, 0.94),
  });
}

/** Introduction page — personalization only (separate from cover). */
export function drawDisputeGuideIntroPage(
  page: PdfDrawPage,
  fonts: PdfFonts,
  rgb: RgbFn,
  meta?: PdfMeta,
) {
  drawPremiumGlowBackground(page, rgb);

  const panelW = PDF_PAGE_W - PDF_MARGIN * 2;
  const panelH = 360;
  const panelY = (PDF_PAGE_H - panelH) / 2;

  page.drawRectangle({
    x: PDF_MARGIN,
    y: panelY,
    width: panelW,
    height: panelH,
    color: rgb(0.04, 0.07, 0.06),
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 1,
    opacity: 0.94,
  });

  let y = panelY + panelH - 36;
  page.drawText('FINELY CRED', {
    x: PDF_MARGIN + 24,
    y,
    size: 9,
    font: fonts.bold,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  y -= 32;
  page.drawText('Your guide is ready', {
    x: PDF_MARGIN + 24,
    y,
    size: 22,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 28;
  page.drawText('Prepared for', {
    x: PDF_MARGIN + 24,
    y,
    size: 10,
    font: fonts.regular,
    color: rgb(0.65, 0.7, 0.68),
  });
  y -= 22;
  const displayName = meta?.fullName?.trim() || 'you';
  page.drawText(pdfSafeText(displayName), {
    x: PDF_MARGIN + 24,
    y,
    size: 18,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  y -= 24;
  page.drawText(pdfSafeText(`Date ${formatGuidePersonalizationDate()}`), {
    x: PDF_MARGIN + 24,
    y,
    size: 11,
    font: fonts.regular,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  y -= 36;
  page.drawText('What you will learn:', {
    x: PDF_MARGIN + 24,
    y,
    size: 11,
    font: fonts.bold,
    color: rgb(0.85, 0.88, 0.86),
  });
  y -= 20;
  const bullets = [
    'Your own words — denials, apartments, auto loans, and why the file feels wrong',
    'Expanded 5-step framework — one page per step with power moves',
    'FCRA, OCR/Metro2, validation-first, law-per-negative, affidavits',
    'Example consumer letter + certified mail & escalation chapters',
  ];
  for (const b of bullets) {
    page.drawText(pdfSafeText(`+ ${b}`), {
      x: PDF_MARGIN + 28,
      y,
      size: 10,
      font: fonts.regular,
      color: rgb(0.78, 0.82, 0.8),
    });
    y -= 18;
  }

  page.drawText('Educational only — not legal advice.', {
    x: PDF_MARGIN + 24,
    y: panelY + 24,
    size: 9,
    font: fonts.regular,
    color: rgb(0.55, 0.58, 0.6),
  });
}

/** @deprecated Use drawDisputeGuideScoreBarCoverPage + drawDisputeGuideIntroPage */
export async function drawDisputeGuideMockupCoverPage(
  page: PdfDrawPage,
  _pdfDoc: unknown,
  fonts: PdfFonts,
  rgb: RgbFn,
  meta?: PdfMeta,
) {
  drawDisputeGuideScoreBarCoverPage(page, fonts, rgb);
  void meta;
}
