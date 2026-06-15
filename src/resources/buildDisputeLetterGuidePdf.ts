import {
  DISPUTE_LETTER_GUIDE_IMAGE_PAGES,
  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,
} from './disputeLetterGuideContent';
import {
  drawGuideContentPages,
  PDF_GREEN,
  PDF_MARGIN,
  PDF_MUTED,
  PDF_PAGE_H,
  PDF_PAGE_W,
  PDF_SLATE,
  pdfSafeText,
} from './buildFreeGuidePdf';
import { downloadBlob } from '../utils/download';

function sanitizeFilename(s: string) {
  return (s || 'Guide').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedPngPageIfAvailable(pdfDoc: { embedPng: (b: Uint8Array) => Promise<unknown>; addPage: (s: [number, number]) => unknown }, url: string) {
  const bytes = await fetchImageBytes(url);
  if (!bytes) return false;
  const img = (await pdfDoc.embedPng(bytes)) as { width: number; height: number };
  const page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as { drawImage: (img: unknown, o: object) => void };
  const scale = Math.min(PDF_PAGE_W / img.width, PDF_PAGE_H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  page.drawImage(img, {
    x: (PDF_PAGE_W - w) / 2,
    y: (PDF_PAGE_H - h) / 2,
    width: w,
    height: h,
  });
  return true;
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

  {
    const page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]);
    page.drawRectangle({
      x: 0,
      y: PDF_PAGE_H - 8,
      width: PDF_PAGE_W,
      height: 8,
      color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    });
    page.drawText('FINELY CRED', {
      x: PDF_MARGIN,
      y: PDF_PAGE_H - PDF_MARGIN - 20,
      size: 10,
      font: bold,
      color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    });
    page.drawText('Free Credit Dispute Letter Guide', {
      x: PDF_MARGIN,
      y: PDF_PAGE_H - PDF_MARGIN - 48,
      size: 20,
      font: bold,
      color: rgb(PDF_SLATE.r, PDF_SLATE.g, PDF_SLATE.b),
    });
    const lines = [
      args.fullName?.trim() ? `Prepared for: ${args.fullName.trim()}` : null,
      args.email?.trim() ? `Email: ${args.email.trim()}` : null,
      args.leadId?.trim() ? `Reference: ${args.leadId.trim()}` : null,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Complete Finely Cred edition: FCRA rights, 5-step framework,',
      'example letter, mailing workflow, and escalation playbook.',
      '',
      'Educational only — not legal advice.',
    ].filter((l) => l !== null) as string[];
    let y = PDF_PAGE_H - PDF_MARGIN - 90;
    for (const line of lines) {
      page.drawText(pdfSafeText(line), {
        x: PDF_MARGIN,
        y,
        size: 11,
        font: regular,
        color: rgb(PDF_SLATE.r, PDF_SLATE.g, PDF_SLATE.b),
      });
      y -= 16;
    }
    page.drawText(pdfSafeText('Page 1'), {
      x: PDF_MARGIN,
      y: PDF_MARGIN - 8,
      size: 8,
      font: regular,
      color: rgb(PDF_MUTED.r, PDF_MUTED.g, PDF_MUTED.b),
    });
  }

  for (const url of DISPUTE_LETTER_GUIDE_IMAGE_PAGES) {
    await embedPngPageIfAvailable(pdfDoc, url);
  }

  drawGuideContentPages(pdfDoc, fonts, rgb, DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES, args);

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
