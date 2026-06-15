import { DISPUTE_LETTER_GUIDE_COVER } from './disputeLetterGuideContent';
import {
  drawPremiumGlowBackground,
  PDF_GREEN,
  PDF_GREEN_DIM,
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
  drawImage: (img: unknown, o: object) => void;
};

export function formatGuidePersonalizationDate(d = new Date()) {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

async function fetchCoverBytes(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(DISPUTE_LETTER_GUIDE_COVER);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** 3D mockup book cover — green spine, glow backdrop, cover art + black footer overlay, name + date. */
export async function drawDisputeGuideMockupCoverPage(
  page: PdfDrawPage,
  pdfDoc: { embedPng: (b: Uint8Array) => Promise<unknown> },
  fonts: PdfFonts,
  rgb: RgbFn,
  meta?: PdfMeta,
) {
  drawPremiumGlowBackground(page, rgb);

  const bookW = 300;
  const bookH = Math.round(bookW * (1024 / 723));
  const bookX = (PDF_PAGE_W - bookW) / 2 + 6;
  const bookY = PDF_PAGE_H - PDF_MARGIN - bookH - 96;

  // Paper block (right edge)
  page.drawRectangle({
    x: bookX + 8,
    y: bookY - 4,
    width: bookW + 10,
    height: bookH + 8,
    color: rgb(0.92, 0.94, 0.96),
    borderColor: rgb(0.75, 0.78, 0.82),
    borderWidth: 0.6,
  });

  // Glowing green spine
  page.drawRectangle({
    x: bookX - 12,
    y: bookY,
    width: 14,
    height: bookH,
    color: rgb(PDF_GREEN_DIM.r, PDF_GREEN_DIM.g, PDF_GREEN_DIM.b),
  });
  page.drawRectangle({
    x: bookX - 12,
    y: bookY,
    width: 6,
    height: bookH,
    color: rgb(0.53, 0.93, 0.67),
    opacity: 0.55,
  });

  page.drawRectangle({
    x: bookX,
    y: bookY,
    width: bookW,
    height: bookH,
    color: rgb(1, 1, 1),
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 1.4,
  });

  const coverBytes = await fetchCoverBytes();
  let hasCoverArt = false;
  if (coverBytes) {
    try {
      const img = (await pdfDoc.embedPng(coverBytes)) as { width: number; height: number };
      page.drawImage(img, { x: bookX + 1, y: bookY + 1, width: bookW - 2, height: bookH - 2 });
      hasCoverArt = true;
    } catch {
      hasCoverArt = false;
    }
  }

  // Bottom black gradient overlay + proof strip (matches web mockup footer)
  const gradientHeights = [28, 24, 20, 16];
  const opacities = [0.78, 0.55, 0.35, 0.18];
  let gy = bookY + 1;
  for (let i = 0; i < gradientHeights.length; i++) {
    page.drawRectangle({
      x: bookX + 1,
      y: gy,
      width: bookW - 2,
      height: gradientHeights[i]!,
      color: rgb(0, 0, 0),
      opacity: opacities[i],
    });
    gy += gradientHeights[i]!;
  }

  page.drawText(pdfSafeText('Step-by-step  |  Instant PDF  |  FCRA checklist'), {
    x: bookX + 14,
    y: bookY + 14,
    size: 7,
    font: fonts.bold,
    color: rgb(0.92, 0.98, 0.94),
  });

  if (!hasCoverArt) {
    page.drawText('FREE CREDIT', {
      x: bookX + 22,
      y: bookY + bookH - 48,
      size: 16,
      font: fonts.bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('DISPUTE LETTER GUIDE', {
      x: bookX + 22,
      y: bookY + bookH - 72,
      size: 14,
      font: fonts.bold,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  // Personalization card below book — name then date underneath
  const cardW = bookW + 24;
  const cardX = (PDF_PAGE_W - cardW) / 2;
  const cardY = bookY - 78;
  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: 64,
    color: rgb(0.04, 0.07, 0.06),
    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    borderWidth: 1,
    opacity: 0.94,
  });

  const displayName = meta?.fullName?.trim() || 'you';
  page.drawText(pdfSafeText(`Prepared for ${displayName}`), {
    x: cardX + 16,
    y: cardY + 40,
    size: 12,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(pdfSafeText(`Date ${formatGuidePersonalizationDate()}`), {
    x: cardX + 16,
    y: cardY + 22,
    size: 10,
    font: fonts.regular,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });

  page.drawText('FINELY CRED', {
    x: PDF_MARGIN,
    y: PDF_PAGE_H - PDF_MARGIN - 12,
    size: 9,
    font: fonts.bold,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });
  page.drawText('Educational only - not legal advice', {
    x: PDF_PAGE_W - PDF_MARGIN - 168,
    y: PDF_PAGE_H - PDF_MARGIN - 12,
    size: 8,
    font: fonts.regular,
    color: rgb(0.55, 0.58, 0.6),
  });
}
