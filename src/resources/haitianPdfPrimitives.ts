import { rgb, type PDFDocument, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { qrCodeImageUrl } from '../lib/leadAttribution';
import { SHEET_H, SHEET_W } from './sheetPdfKit';

export const W = SHEET_W;
export const H = SHEET_H;
export const M = 48;
export const RIGHT = W - 48;
export const CONTENT_W = RIGHT - M;
/** Keep drawing until here. Below this is CTA + footer. Header-only pages fail this floor. */
export const FLOOR_Y = 148;

export const WHITE = rgb(1, 1, 1);
export const IVORY = rgb(0.98, 0.97, 0.94);
export const NAVY = rgb(0.043, 0.122, 0.227);
export const INK = rgb(0.086, 0.086, 0.094);
export const MUTED = rgb(0.28, 0.29, 0.32);
export const RULE = rgb(0.72, 0.73, 0.75);
export const EMERALD = rgb(0.016, 0.471, 0.341);
export const VIOLET = rgb(0.427, 0.157, 0.851);
export const SKY = rgb(0.012, 0.412, 0.631);
export const ROSE = rgb(0.745, 0.071, 0.235);
export const PAPER = rgb(0.97, 0.96, 0.93);
export const ROSE_PAPER = rgb(1, 0.945, 0.949);
export const FILE_FLOOR = rgb(0.973, 0.976, 0.98);
export const SIT_EN = rgb(0.961, 0.953, 1);
export const SIT_HT = rgb(0.925, 0.996, 1);
export const SKY_TRACK = rgb(0.878, 0.949, 0.988);
export const EMERALD_WASH = rgb(0.925, 0.996, 0.957);

export type HaitianPdfFonts = {
  times: PDFFont;
  timesBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
  regular: PDFFont;
  bold: PDFFont;
};

export function winAnsi(value: string): string {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s{2,}/g, ' ');
}

export function accentRgb(accent: 'emerald' | 'violet' | 'sky' | 'rose'): RGB {
  if (accent === 'violet') return VIOLET;
  if (accent === 'sky') return SKY;
  if (accent === 'rose') return ROSE;
  return EMERALD;
}

export function wrapWinAnsi(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
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

export function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  o: { x: number; y: number; size: number; maxW: number; color: RGB; gap?: number },
): number {
  const gap = o.gap ?? o.size + 3.4;
  const lines = wrapWinAnsi(font, text, o.size, o.maxW);
  let baseline = o.y - o.size;
  for (const line of lines) {
    page.drawText(line, { x: o.x, y: baseline, size: o.size, font, color: o.color });
    baseline -= gap;
  }
  return baseline + gap;
}

export function drawFooter(page: PDFPage, font: PDFFont, text: string) {
  const safe = winAnsi(text);
  const size = 8;
  page.drawText(safe, {
    x: W / 2 - font.widthOfTextAtSize(safe, size) / 2,
    y: 28,
    size,
    font,
    color: MUTED,
  });
}

export function fillPage(page: PDFPage, color: RGB) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color });
}

export function drawTable(
  page: PDFPage,
  fonts: HaitianPdfFonts,
  y: number,
  table: { columns: string[]; rows: string[][] },
  color: RGB,
  family: 'times' | 'sans' = 'sans',
): number {
  const head = family === 'sans' ? fonts.sansBold : fonts.timesBold;
  const body = family === 'sans' ? fonts.sans : fonts.times;
  const cols = table.columns.length;
  const colW = CONTENT_W / cols;
  const rowH = 22;
  const headerH = 20;
  page.drawRectangle({ x: M, y: y - headerH, width: CONTENT_W, height: headerH, color });
  table.columns.forEach((col, i) => {
    page.drawText(winAnsi(col), {
      x: M + 6 + i * colW,
      y: y - 14,
      size: 8,
      font: head,
      color: WHITE,
    });
  });
  let top = y - headerH;
  table.rows.forEach((row, r) => {
    const h = 28;
    page.drawRectangle({
      x: M,
      y: top - h,
      width: CONTENT_W,
      height: h,
      color: r % 2 === 0 ? WHITE : FILE_FLOOR,
      borderColor: RULE,
      borderWidth: 0.4,
    });
    row.forEach((cell, i) => {
      drawWrapped(page, body, cell, {
        x: M + 6 + i * colW,
        y: top - 4,
        size: 8,
        maxW: colW - 12,
        color: INK,
        gap: 10,
      });
    });
    top -= h;
  });
  return top - 8;
}

export function drawFormRows(
  page: PDFPage,
  fonts: HaitianPdfFonts,
  y: number,
  rows: { labelEn: string; labelHt: string }[],
  color: RGB,
): number {
  let top = y;
  rows.forEach((row) => {
    page.drawRectangle({ x: M, y: top - 36, width: CONTENT_W, height: 32, color: WHITE, borderColor: color, borderWidth: 1 });
    page.drawText(winAnsi(row.labelEn), { x: M + 10, y: top - 14, size: 9, font: fonts.sansBold, color: INK });
    page.drawText(winAnsi(row.labelHt), { x: M + 10, y: top - 26, size: 8, font: fonts.sans, color: MUTED });
    page.drawLine({
      start: { x: M + CONTENT_W * 0.42, y: top - 22 },
      end: { x: M + CONTENT_W - 12, y: top - 22 },
      thickness: 0.7,
      color: RULE,
    });
    top -= 40;
  });
  return top;
}

export function drawActionLine(
  page: PDFPage,
  fonts: HaitianPdfFonts,
  y: number,
  en: string,
  ht: string,
  color: RGB,
): number {
  page.drawText(winAnsi('Do this today'), { x: M, y: y - 12, size: 9, font: fonts.sansBold, color });
  y = drawWrapped(page, fonts.timesBold, en, { x: M, y: y - 16, size: 11, maxW: CONTENT_W, color: INK, gap: 14 });
  return drawWrapped(page, fonts.times, ht, { x: M, y: y - 4, size: 9, maxW: CONTENT_W, color: MUTED, gap: 12 });
}

export async function drawQr(
  page: PDFPage,
  doc: PDFDocument,
  href: string,
  box: { x: number; y: number; size: number },
) {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/$/, '')
      : 'https://finelycred.com';
  const url = href.startsWith('http') ? href : `${origin}${href}`;
  try {
    const qrRes = await fetch(qrCodeImageUrl(url, 320));
    const qrBytes = new Uint8Array(await qrRes.arrayBuffer());
    const qr = await doc.embedPng(qrBytes);
    page.drawImage(qr, { x: box.x, y: box.y, width: box.size, height: box.size });
  } catch {
    page.drawRectangle({ x: box.x, y: box.y, width: box.size, height: box.size, color: WHITE });
  }
}
