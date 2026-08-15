import { getBlobStore } from '../storage/getBlobStore';
import { isLetterClosingParagraphLine, stripLetterVendorBranding } from '../lib/letterBodySafety';

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
      // Keep short lines verbatim — preserves partner spacing edits.
      if (useFont.widthOfTextAtSize(p, useFontSize) <= maxWidth) {
        lines.push(p);
        continue;
      }
      const words = p.split(' ');
      let line = '';
      for (const w of words) {
        if (w === '') {
          if (line.endsWith(' ')) continue;
          line += ' ';
          continue;
        }
        const next = line ? `${line}${line.endsWith(' ') ? '' : ' '}${w}` : w;
        const width = useFont.widthOfTextAtSize(next, useFontSize);
        if (width <= maxWidth) {
          line = next;
        } else {
          if (line.trim()) lines.push(line);
          line = w;
        }
      }
      if (line.trim()) lines.push(line);
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
  let prevInkLine = '';
  for (const line of lines) {
    ensureSpace(lineHeight);
    if (!line.trim()) {
      const extraGap = /^\s*\d+\.\s+/.test(prevInkLine) ? lineHeight : 0;
      y -= lineHeight + extraGap;
      prevInkLine = '';
      continue;
    }
    const trimmed = line.trim();
    const isMarkdownHeading = /^#{1,4}\s+/.test(trimmed);
    const drawText = isMarkdownHeading ? trimmed.replace(/^#{1,4}\s+/, '') : line.replace(/\s+$/g, '');
    const isNumbered = /^\s*\d+\.\s+/.test(drawText);
    const isBullet = /^\s*[-•]\s+/.test(drawText);
    const leadingSpaces = drawText.length - drawText.trimStart().length;
    const spaceWidth = font.widthOfTextAtSize(' ', fontSize);
    const ink = isMarkdownHeading ? drawText : drawText.trimStart() || drawText;
    if (
      prevInkLine &&
      /^\s*\d+\.\s+/.test(prevInkLine) &&
      !isNumbered &&
      !isBullet &&
      isLetterClosingParagraphLine(ink)
    ) {
      y -= lineHeight;
    }
    page.drawText(ink, {
      x: margin + (isBullet || isNumbered ? 10 : 0) + leadingSpaces * spaceWidth,
      y,
      size: fontSize,
      font,
      color: rgb(0.12, 0.12, 0.12),
      maxWidth,
    });
    y -= lineHeight;
    prevInkLine = ink;
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
  // the mailer edge function estimates page count via a text scan for "/Type /Page"
  // and "/Count", which can't see markers hidden inside compressed object streams.
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
