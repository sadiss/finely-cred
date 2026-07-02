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

  const title = String((args.meta?.title || args.filename || 'Finely Cred Document') as string)
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .trim();
  const metaKind = String(args.meta?.kind || args.meta?.type || '').replace(/_/g, ' ').trim();

  // Refined header band, simple enough for legal/validation documents.
  page.drawRectangle({
    x: 0,
    y: pageHeight - 86,
    width: pageWidth,
    height: 86,
    color: rgb(0.035, 0.055, 0.05),
  });
  page.drawRectangle({
    x: 0,
    y: pageHeight - 88,
    width: pageWidth,
    height: 2,
    color: rgb(0.96, 0.63, 0.12),
  });
  page.drawText('FINELY CRED', {
    x: margin,
    y: pageHeight - 36,
    size: 10,
    font: fontBold,
    color: rgb(0.96, 0.78, 0.36),
  });
  page.drawText(title.slice(0, 72), {
    x: margin,
    y: pageHeight - 58,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  if (metaKind) {
    page.drawText(metaKind.slice(0, 80), {
      x: margin,
      y: pageHeight - 74,
      size: 8.5,
      font,
      color: rgb(0.78, 0.82, 0.86),
    });
  }
  y = pageHeight - 112;

  const lines = wrap(args.text || '', font, fontSize);
  for (const line of lines) {
    ensureSpace(lineHeight);
    if (!line) {
      y -= lineHeight * 0.7;
      continue;
    }
    const trimmed = line.trim();
    const isMarkdownHeading = /^#{1,4}\s+/.test(trimmed);
    const headingText = trimmed.replace(/^#{1,4}\s+/, '');
    const isHeading = isMarkdownHeading || /^[A-Z][A-Z0-9 \-:]{6,}$/.test(trimmed);
    const isNumbered = /^\d+\.\s+/.test(trimmed);
    const isBullet = /^[-•]\s+/.test(trimmed);
    const drawText = isHeading ? headingText : trimmed;
    if (isHeading) {
      y -= 4;
      ensureSpace(lineHeight + 8);
      page.drawRectangle({
        x: margin,
        y: y - 4,
        width: 3,
        height: 14,
        color: rgb(0.96, 0.63, 0.12),
      });
    }
    page.drawText(drawText, {
      x: margin + (isBullet || isNumbered ? 10 : isHeading ? 10 : 0),
      y,
      size: isHeading ? 12.5 : isNumbered || isBullet ? 10.2 : fontSize,
      font: isHeading ? fontBold : font,
      color: isHeading ? rgb(0.06, 0.08, 0.08) : rgb(0.12, 0.12, 0.12),
      maxWidth,
    });
    y -= isHeading ? lineHeight + 4 : lineHeight;
  }

  // Small footer on every page after content generation.
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: margin, y: 38 },
      end: { x: pageWidth - margin, y: 38 },
      thickness: 0.5,
      color: rgb(0.82, 0.84, 0.86),
    });
    p.drawText(`Finely Cred • Educational workflow document • Page ${idx + 1} of ${pages.length}`, {
      x: margin,
      y: 24,
      size: 8,
      font,
      color: rgb(0.42, 0.45, 0.48),
    });
  });

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

