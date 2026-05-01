import { getBlobStore } from '../storage/getBlobStore';

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

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontSize = 11;
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

  const lines = wrap(args.text || '', font, fontSize);
  for (const line of lines) {
    ensureSpace(lineHeight);
    if (!line) {
      y -= lineHeight;
      continue;
    }
    const isHeading = /^[A-Z][A-Z0-9 \-:]{6,}$/.test(line.trim());
    page.drawText(line, {
      x: margin,
      y,
      size: isHeading ? 12 : fontSize,
      font: isHeading ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth,
    });
    y -= lineHeight;
  }

  const bytes = await doc.save();
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

