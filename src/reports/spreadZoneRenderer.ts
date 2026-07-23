import type { PDFFont, PDFPage, RGB } from 'pdf-lib';
import { wrapTextLines } from './creditAnalysisPdfWriter';
import { pdfSafe } from './pdfTextUtils';
import { SPREAD_PALETTE, type SpreadColorKey } from './premiumSpreadPalette';

export type SpreadCover = {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: SpreadColorKey;
  opacity?: number;
  borderColor?: SpreadColorKey;
  borderOpacity?: number;
  borderWidth?: number;
};

export type SpreadTextZone = {
  text: string;
  /** Normalized 0–1 from left */
  x: number;
  /** Normalized 0–1 from TOP of page */
  y: number;
  size: number;
  color?: SpreadColorKey;
  bold?: boolean;
  cover?: SpreadCover;
  maxWidth?: number;
  maxLines?: number;
  minSize?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
};

const coverColor = (key: SpreadCover['color']): RGB => {
  return SPREAD_PALETTE[key ?? 'cream'];
};

function drawCover(page: PDFPage, pageW: number, pageH: number, cover: SpreadCover) {
  const cx = cover.x * pageW;
  const cw = cover.w * pageW;
  const ch = cover.h * pageH;
  const cy = pageH - cover.y * pageH - ch;
  page.drawRectangle({
    x: cx,
    y: cy,
    width: cw,
    height: ch,
    color: coverColor(cover.color),
    opacity: cover.opacity ?? 0.94,
    borderColor: cover.borderColor ? SPREAD_PALETTE[cover.borderColor] : undefined,
    borderOpacity: cover.borderOpacity ?? (cover.borderColor ? 0.72 : undefined),
    borderWidth: cover.borderWidth,
  });
}

function clippedLines(text: string, lines: string[], maxLines: number, maxW: number, fontSize: number, font: PDFFont) {
  if (lines.length <= maxLines) return lines;
  const next = lines.slice(0, maxLines);
  const ellipsis = '...';
  let last = next[next.length - 1] ?? '';
  while (last.length > 0 && font.widthOfTextAtSize(`${last}${ellipsis}`, fontSize) > maxW) {
    last = last.slice(0, -1).trimEnd();
  }
  next[next.length - 1] = last ? `${last}${ellipsis}` : ellipsis;
  return text.trim() ? next : [];
}

export function paintSpreadZones(
  page: PDFPage,
  pageW: number,
  pageH: number,
  zones: SpreadTextZone[],
  fonts: { regular: PDFFont; bold: PDFFont },
) {
  const scale = pageH / 2110;
  for (const z of zones) {
    const text = pdfSafe(z.text || '');
    if (z.cover) drawCover(page, pageW, pageH, z.cover);
    if (!text.trim()) continue;
    let fontSize = z.size * scale;
    const font = z.bold ? fonts.bold : fonts.regular;
    const maxW = (z.maxWidth ?? 0.28) * pageW;
    const maxLines = z.maxLines ?? 6;
    const minSize = (z.minSize ?? Math.max(6.5, z.size - 1.5)) * scale;
    let wrapped = wrapTextLines(text, maxW, fontSize, font);
    while (wrapped.length > maxLines && fontSize > minSize) {
      fontSize -= 0.35 * scale;
      wrapped = wrapTextLines(text, maxW, fontSize, font);
    }
    const lines = clippedLines(text, wrapped, maxLines, maxW, fontSize, font);
    const lineH = fontSize * (z.lineHeight ?? 1.15);

    let ty = pageH - z.y * pageH;
    for (const line of lines) {
      const tw = font.widthOfTextAtSize(line, fontSize);
      let tx = z.x * pageW;
      if (z.align === 'center') tx = z.x * pageW - tw / 2;
      if (z.align === 'right') tx = z.x * pageW - tw;
      page.drawText(line, {
        x: tx,
        y: ty - fontSize,
        size: fontSize,
        font,
        color: SPREAD_PALETTE[z.color ?? 'ink'],
      });
      ty -= lineH;
    }
  }
}

/** y = top-normalized helpers */
export function z(
  text: string,
  x: number,
  y: number,
  size: number,
  opts?: Partial<Omit<SpreadTextZone, 'text' | 'x' | 'y' | 'size'>>,
): SpreadTextZone {
  return { text, x, y, size, ...opts };
}

export function darkCover(x: number, y: number, w: number, h: number): SpreadCover {
  return { x, y, w, h, color: 'obsidian', opacity: 0.9, borderColor: 'gold', borderOpacity: 0.18, borderWidth: 1 };
}

export function creamCover(x: number, y: number, w: number, h: number): SpreadCover {
  return { x, y, w, h, color: 'ivory', opacity: 0.94, borderColor: 'gold', borderOpacity: 0.16, borderWidth: 1 };
}

export function forestCover(x: number, y: number, w: number, h: number): SpreadCover {
  return { x, y, w, h, color: 'forest', opacity: 0.9, borderColor: 'emerald', borderOpacity: 0.2, borderWidth: 1 };
}

export function accentCover(x: number, y: number, w: number, h: number, color: SpreadColorKey = 'gold'): SpreadCover {
  return { x, y, w, h, color, opacity: 0.9 };
}

export function glassCover(x: number, y: number, w: number, h: number, borderColor: SpreadColorKey = 'gold'): SpreadCover {
  return { x, y, w, h, color: 'ivory', opacity: 0.86, borderColor, borderOpacity: 0.32, borderWidth: 1.2 };
}

export function partnerBanner(vm: { preparedForBanner: string; preparedDate: string }): SpreadTextZone[] {
  return [
    z('', 0.05, 0.073, 1, { cover: accentCover(0.05, 0.073, 0.008, 0.076, 'emerald') }),
    z(vm.preparedForBanner, 0.068, 0.095, 10, { color: 'goldLight', bold: true, maxWidth: 0.42, cover: forestCover(0.05, 0.075, 0.44, 0.048) }),
    z(vm.preparedDate, 0.068, 0.125, 8, { color: 'white', maxWidth: 0.24 }),
  ];
}

export function partnerBannerLight(vm: { preparedForBanner: string; preparedDate: string }): SpreadTextZone[] {
  return [
    z('', 0.05, 0.073, 1, { cover: accentCover(0.05, 0.073, 0.008, 0.076, 'amber') }),
    z(vm.preparedForBanner, 0.068, 0.095, 10, { color: 'greenDark', bold: true, maxWidth: 0.42, cover: glassCover(0.05, 0.075, 0.44, 0.048, 'amber') }),
    z(vm.preparedDate, 0.068, 0.125, 8, { color: 'soft', maxWidth: 0.24 }),
  ];
}

export function footerLabel(vm: { footerLabel: string }, ctx?: { pageNumber?: number; pageTotal?: number }): SpreadTextZone[] {
  const pageSuffix =
    ctx?.pageNumber && ctx?.pageTotal ? `  ·  Page ${ctx.pageNumber} of ${ctx.pageTotal}` : '';
  return [
    z(`${vm.footerLabel}${pageSuffix}`, 0.52, 0.965, 8, {
      color: 'greenDark',
      maxWidth: 0.42,
      cover: { ...creamCover(0.5, 0.948, 0.44, 0.028), opacity: 0.86, borderColor: 'amber', borderOpacity: 0.18 },
    }),
  ];
}
