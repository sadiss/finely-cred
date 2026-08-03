/**
 * Low-level pdf-lib primitives shared by the dedicated partner sheet PDFs.
 *
 * Only text measurement / wrapping / sanitising lives here. Every sheet builds its own
 * visual language (dossier, blueprint, card gallery) on top of these primitives so no two
 * downloads look alike.
 */
import type { PDFFont, PDFPage, RGB } from 'pdf-lib';

export const SHEET_W = 612;
export const SHEET_H = 792;

export type SheetFonts = { regular: PDFFont; bold: PDFFont };

/** WinAnsi-safe: StandardFonts cannot encode smart quotes, dashes, bullets, or arrows. */
export function pdfSafe(value: string): string {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u00B7\u2022]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A9/g, '(c)')
    .replace(/\u00A7/g, 'Sec.')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s{2,}/g, ' ');
}

export function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let row = '';
  for (const word of words) {
    const test = row ? `${row} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (row) lines.push(row);
      row = word;
    } else {
      row = test;
    }
  }
  if (row) lines.push(row);
  return lines;
}

export type ParagraphOpts = {
  x: number;
  /** TOP edge of the text block. */
  y: number;
  size: number;
  maxW: number;
  color: RGB;
  lineGap?: number;
  maxLines?: number;
};

/** Draws a wrapped paragraph from its top edge. Returns the bottom edge of the last line. */
export function drawParagraph(page: PDFPage, font: PDFFont, text: string, o: ParagraphOpts): number {
  const gap = o.lineGap ?? o.size + 2.8;
  const all = wrapText(font, text, o.size, o.maxW);
  const lines = o.maxLines ? all.slice(0, o.maxLines) : all;
  let baseline = o.y - o.size;
  for (const line of lines) {
    page.drawText(line, { x: o.x, y: baseline, size: o.size, font, color: o.color });
    baseline -= gap;
  }
  return baseline + gap - o.size * 0.3;
}

export function paragraphHeight(
  font: PDFFont,
  text: string,
  size: number,
  maxW: number,
  maxLines?: number,
): number {
  const gap = size + 2.8;
  const all = wrapText(font, text, size, maxW);
  const n = Math.max(1, maxLines ? Math.min(all.length, maxLines) : all.length);
  return size + (n - 1) * gap + size * 0.3;
}

/** Right-aligned single line. */
export function drawRightText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  o: { right: number; y: number; size: number; color: RGB },
) {
  const safe = pdfSafe(text);
  page.drawText(safe, {
    x: o.right - font.widthOfTextAtSize(safe, o.size),
    y: o.y,
    size: o.size,
    font,
    color: o.color,
  });
}

/** Centered single line. */
export function drawCenteredText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  o: { centerX: number; y: number; size: number; color: RGB },
) {
  const safe = pdfSafe(text);
  page.drawText(safe, {
    x: o.centerX - font.widthOfTextAtSize(safe, o.size) / 2,
    y: o.y,
    size: o.size,
    font,
    color: o.color,
  });
}

/** Triggers a browser download for generated PDF bytes. */
export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
