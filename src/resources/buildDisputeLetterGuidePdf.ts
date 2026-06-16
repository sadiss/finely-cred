import {
  DISPUTE_LETTER_GUIDE_COVER,
  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,
} from './disputeLetterGuideContent';
import { drawGuideContentPages, PDF_PAGE_W } from './buildFreeGuidePdf';
import { drawDisputeGuideCoverImagePage, drawDisputeGuideIntroPage } from './guideMockupCoverPdf';
import { downloadBlob } from '../utils/download';

function sanitizeFilename(s: string) {
  return (s || 'Guide').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function buildDisputeLetterGuidePdf(args: {
  fullName?: string;
  leadId?: string;
  email?: string;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };

  const coverPage = pdfDoc.addPage([PDF_PAGE_W, 792]);
  await drawDisputeGuideCoverImagePage(
    coverPage as Parameters<typeof drawDisputeGuideCoverImagePage>[0],
    pdfDoc,
    fonts,
    rgb,
    DISPUTE_LETTER_GUIDE_COVER,
  );

  const introPage = pdfDoc.addPage([PDF_PAGE_W, 792]);
  drawDisputeGuideIntroPage(introPage as Parameters<typeof drawDisputeGuideIntroPage>[0], fonts, rgb, {
    fullName: args.fullName,
  });

  drawGuideContentPages(pdfDoc, fonts, rgb, DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES, {
    fullName: args.fullName,
  });

  return pdfDoc.save();
}

export async function downloadDisputeLetterGuidePdf(args: {
  fullName?: string;
  leadId?: string;
  email?: string;
}) {
  const bytes = await buildDisputeLetterGuidePdf(args);
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  downloadBlob({
    blob: new Blob([ab], { type: 'application/pdf' }),
    filename: `${sanitizeFilename('Free_Credit_Dispute_Letter_Guide')}_FinelyCred.pdf`,
  });
}
