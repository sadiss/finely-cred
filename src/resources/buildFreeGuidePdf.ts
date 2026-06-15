import type { FreeGuide } from './freeGuides';
import type { GeneratedGuidePage } from './disputeLetterGuideContent';
import { guardPdfBodyText, pdfDisclaimerFooter } from '../lib/complianceEngine';

export const PDF_PAGE_W = 612;
export const PDF_PAGE_H = 792;
export const PDF_MARGIN = 54;

export const PDF_GREEN = { r: 0.22, g: 0.78, b: 0.35 };
export const PDF_GOLD = { r: 0.85, g: 0.65, b: 0.13 };
export const PDF_SLATE = { r: 0.15, g: 0.18, b: 0.22 };
export const PDF_BODY = { r: 0.22, g: 0.25, b: 0.28 };
export const PDF_MUTED = { r: 0.45, g: 0.48, b: 0.52 };

export function pdfSafeText(s: string) {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/•/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/…/g, '...')
    .replace(/©/g, '(c)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

export function wrapPdfText(font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of pdfSafeText(text).split('\n')) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
      else {
        if (line) out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
    out.push('');
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

export type PdfMeta = {
  fullName?: string;
  leadId?: string;
  email?: string;
  subtitle?: string;
};

type PdfFonts = { regular: unknown; bold: unknown };
type RgbFn = (r: number, g: number, b: number) => unknown;

export function drawGuideContentPages(
  pdfDoc: { addPage: (size: [number, number]) => unknown },
  fonts: PdfFonts,
  rgb: RgbFn,
  pages: GeneratedGuidePage[],
  meta?: PdfMeta,
) {
  const maxW = PDF_PAGE_W - PDF_MARGIN * 2;
  let pageNum = 0;

  for (const pageContent of pages) {
    pageNum += 1;
    let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as {
      drawRectangle: (o: object) => void;
      drawText: (t: string, o: object) => void;
    };
    let y = PDF_PAGE_H - PDF_MARGIN;

    const drawTopBar = () => {
      page.drawRectangle({
        x: 0,
        y: PDF_PAGE_H - 6,
        width: PDF_PAGE_W,
        height: 6,
        color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),
      });
    };

    const newPage = () => {
      page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as typeof page;
      y = PDF_PAGE_H - PDF_MARGIN;
      drawTopBar();
    };

    const draw = (text: string, opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number } }) => {
      const size = opts?.size ?? 11;
      const font = opts?.bold ? fonts.bold : fonts.regular;
      const color = opts?.color ?? PDF_BODY;
      if (y < PDF_MARGIN + 48) newPage();
      page.drawText(pdfSafeText(text), {
        x: PDF_MARGIN,
        y,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
      });
      y -= size + 6;
    };

    drawTopBar();
    draw('FINELY CRED', { bold: true, size: 9, color: PDF_GREEN });
    y -= 4;
    draw(pageContent.title, { bold: true, size: 20, color: PDF_SLATE });
    if (pageContent.subtitle) {
      y -= 2;
      for (const line of wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 11, pageContent.subtitle, maxW)) {
        draw(line, { size: 11, color: PDF_MUTED });
      }
    }
    y -= 10;

    for (const sec of pageContent.sections) {
      if (sec.heading) {
        y -= 6;
        draw(sec.heading, { bold: true, size: 12, color: PDF_GREEN });
      }
      for (const p of sec.paragraphs ?? []) {
        for (const line of wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 11, p, maxW)) {
          draw(line);
        }
        y -= 4;
      }
      if (sec.bullets) {
        for (const b of sec.bullets) {
          for (const line of wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 10, `- ${b}`, maxW - 8)) {
            draw(line, { size: 10 });
          }
        }
        y -= 4;
      }
    }

    const footer = [`Page ${pageNum}`, `(c) ${new Date().getFullYear()} Finely Cred - Educational only`];
    if (meta?.fullName?.trim()) footer.unshift(`Prepared for: ${meta.fullName.trim()}`);
    let fy = PDF_MARGIN;
    for (const f of footer) {
      page.drawText(pdfSafeText(f), {
        x: PDF_MARGIN,
        y: fy,
        size: 8,
        font: fonts.regular,
        color: rgb(PDF_MUTED.r, PDF_MUTED.g, PDF_MUTED.b),
      });
      fy += 10;
    }
  }
}

export async function buildFreeGuidePdf(guide: FreeGuide, meta?: PdfMeta): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const maxW = PDF_PAGE_W - PDF_MARGIN * 2;

  let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]);
  let y = PDF_PAGE_H - PDF_MARGIN;
  let pageIndex = 1;

  const drawFooter = () => {
    page.drawText(pdfSafeText(`Page ${pageIndex} - (c) ${new Date().getFullYear()} Finely Cred`), {
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

  draw('FINELY CRED', { bold: true, size: 10, color: PDF_GREEN });
  draw('Resource Library', { size: 9, color: PDF_MUTED, gap: 14 });
  draw(guide.title, { bold: true, size: 22, color: PDF_SLATE, gap: 18 });
  for (const line of wrapPdfText(regular, 11, guide.desc, maxW)) {
    draw(line, { size: 11, color: PDF_BODY });
  }
  y -= 8;

  if (meta?.fullName?.trim()) draw(`Prepared for: ${meta.fullName.trim()}`, { size: 10, color: PDF_MUTED });
  if (meta?.email?.trim()) draw(`Email: ${meta.email.trim()}`, { size: 10, color: PDF_MUTED });
  if (meta?.leadId?.trim()) draw(`Reference: ${meta.leadId.trim()}`, { size: 10, color: PDF_MUTED });
  draw(`Generated: ${new Date().toLocaleString()}`, { size: 10, color: PDF_MUTED });
  y -= 12;

  if (guide.sections.length >= 3) {
    draw('Table of Contents', { bold: true, size: 13, color: PDF_GOLD, gap: 14 });
    guide.sections.forEach((sec, i) => {
      draw(`${i + 1}. ${sec.heading}`, { size: 10, color: PDF_BODY });
    });
    y -= 8;
    newPage();
  }

  for (const sec of guide.sections) {
    if (y < PDF_MARGIN + 120) newPage();
    draw(sec.heading, { bold: true, size: 14, color: PDF_GREEN, gap: 12 });
    for (const b of sec.bullets) {
      const safe = guardPdfBodyText(b);
      for (const line of wrapPdfText(regular, 11, safe, maxW - 12)) {
        draw(line.startsWith('-') ? line : `- ${line}`, { size: 11, color: PDF_BODY });
      }
      y -= 2;
    }
    y -= 10;
  }

  y -= 4;
  draw(pdfDisclaimerFooter(), {
    size: 9,
    color: PDF_MUTED,
  });

  drawFooter();
  return pdfDoc.save();
}

export function guideSectionsToPages(guide: FreeGuide): GeneratedGuidePage[] {
  return guide.sections.map((sec) => ({
    id: sec.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: sec.heading,
    sections: [{ bullets: sec.bullets }],
  }));
}
