import type { FreeGuide } from './freeGuides';
import { downloadBlob } from '../utils/download';

function sanitizeFilename(s: string) {
  return (s || 'Guide').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

function wrap(font: any, fontSize: number, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  const paragraphs = (text || '').split('\n');
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(next, fontSize);
      if (width <= maxWidth) line = next;
      else {
        if (line) out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
    out.push('');
  }
  // trim trailing blanks
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

export async function downloadFreeGuidePdf(args: { guide: FreeGuide; leadId?: string; fullName?: string }) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pageWidth = 612; // Letter
  const pageHeight = 792;
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 11;
  const lineHeight = 14;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawLine = (text: string, opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number } }) => {
    const useBold = Boolean(opts?.bold);
    const size = opts?.size ?? fontSize;
    const f = useBold ? fontBold : font;
    const c = opts?.color ?? { r: 1, g: 1, b: 1 };
    if (y < margin + lineHeight * 2) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(c.r, c.g, c.b) });
    y -= lineHeight;
  };

  // Title
  drawLine('FINELY CRED — RESOURCE LIBRARY', { bold: true, size: 12, color: { r: 0.96, g: 0.75, b: 0.25 } });
  drawLine(args.guide.title, { bold: true, size: 16 });
  drawLine(args.guide.desc);
  drawLine('');

  // Meta
  const meta: string[] = [];
  if (args.fullName?.trim()) meta.push(`Requested by: ${args.fullName.trim()}`);
  if (args.leadId?.trim()) meta.push(`Reference ID: ${args.leadId.trim()}`);
  meta.push(`Generated: ${new Date().toLocaleString()}`);
  meta.forEach((m) => drawLine(m, { size: 9, color: { r: 0.75, g: 0.75, b: 0.75 } }));
  drawLine('');

  // Table of contents (when 5+ sections)
  if (args.guide.sections.length >= 5) {
    drawLine('TABLE OF CONTENTS', { bold: true, size: 12, color: { r: 0.96, g: 0.75, b: 0.25 } });
    for (const sec of args.guide.sections) {
      drawLine(sec.heading, { size: 10 });
    }
    drawLine('');
  }

  // Body sections
  for (const sec of args.guide.sections) {
    drawLine(sec.heading, { bold: true, size: 12, color: { r: 0.96, g: 0.75, b: 0.25 } });
    for (const b of sec.bullets) {
      const lines = wrap(font, fontSize, `• ${b}`, maxWidth);
      lines.forEach((l) => drawLine(l));
    }
    drawLine('');
  }

  // Footer note
  drawLine('Educational material only. Not legal advice.', { size: 9, color: { r: 0.7, g: 0.7, b: 0.7 } });

  const bytes = await pdfDoc.save();
  // TS safety: BlobPart typing can be strict about ArrayBufferLike; use a concrete ArrayBuffer slice.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: 'application/pdf' });
  downloadBlob({ blob, filename: `${sanitizeFilename(args.guide.title)}.pdf` });
}

