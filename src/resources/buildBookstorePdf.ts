import type { BookstoreProduct } from '../domain/bookstore';
import { splitBookIntoChapters } from '../domain/libraryEntitlements';
import { guardPdfBodyText, pdfDisclaimerFooter } from '../lib/complianceEngine';
import {
  PDF_BODY,
  PDF_GOLD,
  PDF_GREEN,
  PDF_MARGIN,
  PDF_MUTED,
  PDF_PAGE_H,
  PDF_PAGE_W,
  PDF_SLATE,
  pdfSafeText,
  wrapPdfText,
} from './buildFreeGuidePdf';

function markdownToPlain(md: string): string {
  return (md || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '• ')
    .replace(/\|/g, ' ')
    .replace(/---+/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type BookPdfMeta = {
  fullName?: string;
  email?: string;
  /** Limit chapters for preview exports */
  maxChapters?: number;
};

export async function buildBookstorePdf(product: BookstoreProduct, meta?: BookPdfMeta): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const maxW = PDF_PAGE_W - PDF_MARGIN * 2;

  const allChapters = splitBookIntoChapters(product.contentMarkdown ?? '', product.slug);
  const chapters = meta?.maxChapters ? allChapters.slice(0, meta.maxChapters) : allChapters;

  let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]);
  let y = PDF_PAGE_H - PDF_MARGIN;
  let pageIndex = 1;

  const drawFooter = () => {
    page.drawText(pdfSafeText(`Page ${pageIndex} · ${product.title} · Finely Cred`), {
      x: PDF_MARGIN,
      y: PDF_MARGIN - 8,
      size: 8,
      font: regular,
      color: rgb(PDF_MUTED.r, PDF_MUTED.g, PDF_MUTED.b),
    });
  };

  const newPage = () => {
    drawFooter();
    pageIndex += 1;
    page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]);
    y = PDF_PAGE_H - PDF_MARGIN;
    page.drawRectangle({
      x: 0,
      y: PDF_PAGE_H - 6,
      width: PDF_PAGE_W,
      height: 6,
      color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
    });
  };

  page.drawRectangle({
    x: 0,
    y: PDF_PAGE_H - 8,
    width: PDF_PAGE_W,
    height: 8,
    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
  });

  const draw = (text: string, opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number }; gap?: number }) => {
    const size = opts?.size ?? 11;
    const font = opts?.bold ? bold : regular;
    const color = opts?.color ?? PDF_BODY;
    const gap = opts?.gap ?? size + 6;
    if (y < PDF_MARGIN + 56) newPage();
    page.drawText(pdfSafeText(text), { x: PDF_MARGIN, y, size, font, color: rgb(color.r, color.g, color.b) });
    y -= gap;
  };

  draw('FINELY CRED BOOKSTORE', { bold: true, size: 10, color: PDF_GREEN });
  draw(product.sub, { size: 9, color: PDF_MUTED, gap: 14 });
  draw(product.title, { bold: true, size: 22, color: PDF_SLATE, gap: 18 });
  for (const line of wrapPdfText(regular, 11, product.desc, maxW)) {
    draw(line, { size: 11, color: PDF_BODY });
  }
  y -= 8;

  if (meta?.fullName?.trim()) draw(`Prepared for: ${meta.fullName.trim()}`, { size: 10, color: PDF_MUTED });
  if (meta?.email?.trim()) draw(`Email: ${meta.email.trim()}`, { size: 10, color: PDF_MUTED });
  draw(`Generated: ${new Date().toLocaleString()}`, { size: 10, color: PDF_MUTED });
  if (meta?.maxChapters && allChapters.length > meta.maxChapters) {
    draw(`Preview — first ${meta.maxChapters} of ${allChapters.length} chapters`, { size: 10, color: PDF_GOLD });
  }
  y -= 12;

  if (chapters.length >= 2) {
    draw('Table of Contents', { bold: true, size: 13, color: PDF_GOLD, gap: 14 });
    chapters.forEach((ch, i) => {
      draw(`${i + 1}. ${ch.title}`, { size: 10, color: PDF_BODY });
    });
    y -= 8;
    newPage();
  }

  for (const ch of chapters) {
    if (y < PDF_MARGIN + 120) newPage();
    draw(ch.title, { bold: true, size: 14, color: PDF_GREEN, gap: 12 });
    const plain = markdownToPlain(ch.body);
    for (const paragraph of plain.split(/\n\n+/)) {
      const safe = guardPdfBodyText(paragraph.trim());
      if (!safe) continue;
      for (const line of wrapPdfText(regular, 11, safe, maxW)) {
        draw(line, { size: 11, color: PDF_BODY });
      }
      y -= 6;
    }
    y -= 10;
  }

  y -= 4;
  draw(pdfDisclaimerFooter(), { size: 9, color: PDF_MUTED });
  drawFooter();
  return pdfDoc.save();
}

export async function downloadBookstorePdf(args: {
  product: BookstoreProduct;
  fullName?: string;
  email?: string;
  previewOnly?: boolean;
}) {
  const { downloadBlob } = await import('../utils/download');
  const maxChapters = args.previewOnly ? 2 : undefined;
  const bytes = await buildBookstorePdf(args.product, {
    fullName: args.fullName,
    email: args.email,
    maxChapters,
  });
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const slug = args.product.slug.replace(/[^\w-]+/g, '-');
  const suffix = args.previewOnly ? '-preview' : '';
  downloadBlob({
    blob: new Blob([ab], { type: 'application/pdf' }),
    filename: `FinelyCred-${slug}${suffix}.pdf`,
  });
}
