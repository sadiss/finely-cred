import { getBlobStore } from '../storage/getBlobStore';
import { stripLetterVendorBranding } from '../lib/letterBodySafety';

function sanitizeFilename(s: string) {
  return (s || 'Letter').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function generateTextPdfToVault(args: {
  text: string;
  filename: string;
  /** Metadata written to blob store record. */
  meta?: Record<string, any>;
}): Promise<{ pdfBlobRef: string | null; filename: string }> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pageWidth = 612; // US Letter
  const pageHeight = 792;
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;

  const letterText = stripLetterVendorBranding(args.text || '');

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontSize = 10.5;
  const lineHeight = 14;

  const wrap = (text: string, useFont = font, useFontSize = fontSize) => {
    const lines: string[] = [];
    const paragraphs = (text || '').split('\n');
    for (const p of paragraphs) {
      if (!p.trim()) {
        lines.push('');
        continue;
      }
      const words = p.split(/\s+/);
      let line = '';
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        const width = useFont.widthOfTextAtSize(next, useFontSize);
        if (width <= maxWidth) {
          line = next;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  };

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  const lines = wrap(letterText, font, fontSize);
  for (const line of lines) {
    ensureSpace(lineHeight);
    if (!line) {
      y -= lineHeight * 0.7;
      continue;
    }
    const trimmed = line.trim();
    const isMarkdownHeading = /^#{1,4}\s+/.test(trimmed);
    const drawText = isMarkdownHeading ? trimmed.replace(/^#{1,4}\s+/, '') : trimmed;
    const isNumbered = /^\d+\.\s+/.test(trimmed);
    const isBullet = /^[-•]\s+/.test(trimmed);
    page.drawText(drawText, {
      x: margin + (isBullet || isNumbered ? 10 : 0),
      y,
      size: fontSize,
      font,
      color: rgb(0.12, 0.12, 0.12),
      maxWidth,
    });
    y -= lineHeight;
  }

  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    if (pages.length > 1) {
      p.drawText(`Page ${idx + 1} of ${pages.length}`, {
        x: margin,
        y: 24,
        size: 8,
        font,
        color: rgb(0.42, 0.45, 0.48),
      });
    }
  });

  // useObjectStreams: false keeps page dictionaries as plain text in the PDF bytes —
  // the mailer edge function estimates page count via a text scan for "/Type /Page",
  // which can't see markers hidden inside compressed object streams.
  const bytes = await doc.save({ useObjectStreams: false });
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const filename = sanitizeFilename(args.filename).endsWith('.pdf') ? sanitizeFilename(args.filename) : `${sanitizeFilename(args.filename)}.pdf`;

  const store = getBlobStore();
  let pdfBlobRef: string | null = null;
  try {
    const put = await store.put(blob, { kind: 'letter_pdf', filename, ...(args.meta ?? {}) });
    pdfBlobRef = put.ref;
  } catch {
    pdfBlobRef = null;
  }

  return { pdfBlobRef, filename };
}
