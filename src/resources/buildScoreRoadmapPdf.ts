import { SCORE_ROADMAP_PAGES, SCORE_ROADMAP_PDF_TITLE } from './scoreRoadmapContent';
import {
  drawGuideContentPages,
  PDF_GREEN,
  PDF_MARGIN,
  PDF_MUTED,
  PDF_PAGE_H,
  PDF_PAGE_W,
  PDF_SLATE,
  pdfSafeText,
  type PdfMeta,
} from './buildFreeGuidePdf';
import { downloadBlob } from '../utils/download';

function sanitizeFilename(s: string) {
  return (s || 'Score_Roadmap').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function buildScoreRoadmapPdf(meta?: PdfMeta): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]);
  let y = PDF_PAGE_H - PDF_MARGIN;

  page.drawRectangle({
    x: 0,
    y: PDF_PAGE_H - 6,
    width: PDF_PAGE_W,
    height: 6,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });

  page.drawText(pdfSafeText(SCORE_ROADMAP_PDF_TITLE), {
    x: PDF_MARGIN,
    y,
    size: 22,
    font: bold,
    color: rgb(PDF_SLATE.r, PDF_SLATE.g, PDF_SLATE.b),
  });
  y -= 28;

  page.drawText(pdfSafeText('Finely Cred — client-first credit education'), {
    x: PDF_MARGIN,
    y,
    size: 11,
    font: regular,
    color: rgb(PDF_MUTED.r, PDF_MUTED.g, PDF_MUTED.b),
  });
  y -= 18;

  if (meta?.fullName?.trim()) {
    page.drawText(pdfSafeText(`Prepared for: ${meta.fullName.trim()}`), {
      x: PDF_MARGIN,
      y,
      size: 10,
      font: regular,
      color: rgb(PDF_MUTED.r, PDF_MUTED.g, PDF_MUTED.b),
    });
  }

  drawGuideContentPages(pdfDoc, { regular, bold }, rgb, SCORE_ROADMAP_PAGES, meta);
  return pdfDoc.save();
}

export async function downloadScoreRoadmapPdf(args?: { fullName?: string; leadId?: string; email?: string }) {
  const bytes = await buildScoreRoadmapPdf({
    fullName: args?.fullName,
    leadId: args?.leadId,
    email: args?.email,
  });
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  downloadBlob({
    blob: new Blob([ab], { type: 'application/pdf' }),
    filename: `${sanitizeFilename(SCORE_ROADMAP_PDF_TITLE)}.pdf`,
  });
}
