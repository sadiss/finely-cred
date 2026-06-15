import type { FreeGuide } from './freeGuides';

import type { GeneratedGuidePage } from './disputeLetterGuideContent';

import { guardPdfBodyText, pdfDisclaimerFooter } from '../lib/complianceEngine';



export const PDF_PAGE_W = 612;

export const PDF_PAGE_H = 792;

export const PDF_MARGIN = 54;



export const PDF_GREEN = { r: 0.22, g: 1.0, b: 0.08 };

export const PDF_GREEN_DIM = { r: 0.06, g: 0.72, b: 0.35 };

export const PDF_GOLD = { r: 0.85, g: 0.65, b: 0.13 };

export const PDF_SLATE = { r: 0.15, g: 0.18, b: 0.22 };

export const PDF_BODY = { r: 0.22, g: 0.25, b: 0.28 };

export const PDF_MUTED = { r: 0.45, g: 0.48, b: 0.52 };

export const PDF_DARK_BG = { r: 0.05, g: 0.08, b: 0.07 };

export const PDF_DARK_PANEL = { r: 0.09, g: 0.12, b: 0.11 };



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

  /** Cover headline override (defaults to guide title). */

  coverTitle?: string;

  /** Short bullets on the cover panel. */

  coverHighlights?: string[];

};



type PdfFonts = { regular: unknown; bold: unknown };

type RgbFn = (r: number, g: number, b: number) => unknown;



type PdfPage = {

  drawRectangle: (o: object) => void;

  drawText: (t: string, o: object) => void;

};



/** Ambient green glow + dark panel — matches lead-magnet mockup aesthetic. */

export function drawPremiumGlowBackground(page: PdfPage, rgb: RgbFn) {

  page.drawRectangle({

    x: 0,

    y: 0,

    width: PDF_PAGE_W,

    height: PDF_PAGE_H,

    color: rgb(PDF_DARK_BG.r, PDF_DARK_BG.g, PDF_DARK_BG.b),

  });

  const glows = [

    { x: -40, y: PDF_PAGE_H - 320, w: 360, h: 320, r: 0.22, g: 1, b: 0.08, a: 0.14 },

    { x: PDF_PAGE_W - 280, y: PDF_PAGE_H - 420, w: 320, h: 280, r: 0.85, g: 0.65, b: 0.13, a: 0.06 },

    { x: 40, y: 80, w: 280, h: 220, r: 0.06, g: 0.72, b: 0.35, a: 0.08 },

  ];

  for (const g of glows) {

    page.drawRectangle({

      x: g.x,

      y: g.y,

      width: g.w,

      height: g.h,

      color: rgb(g.r, g.g, g.b),

      opacity: g.a,

    });

  }

  page.drawRectangle({

    x: 0,

    y: 0,

    width: 14,

    height: PDF_PAGE_H,

    color: rgb(PDF_GREEN_DIM.r, PDF_GREEN_DIM.g, PDF_GREEN_DIM.b),

  });

  page.drawRectangle({

    x: 0,

    y: PDF_PAGE_H - 10,

    width: PDF_PAGE_W,

    height: 10,

    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

  });

}



/** Branded cover page — no internal reference IDs. */

export function drawPremiumCoverPage(

  page: PdfPage,

  fonts: PdfFonts,

  rgb: RgbFn,

  args: {

    title: string;

    subtitle?: string;

    meta?: PdfMeta;

    highlights?: string[];

  },

) {

  drawPremiumGlowBackground(page, rgb);



  const panelW = PDF_PAGE_W - PDF_MARGIN * 2;

  const panelH = 420;

  const panelY = PDF_PAGE_H - PDF_MARGIN - panelH - 40;

  page.drawRectangle({

    x: PDF_MARGIN,

    y: panelY,

    width: panelW,

    height: panelH,

    color: rgb(PDF_DARK_PANEL.r, PDF_DARK_PANEL.g, PDF_DARK_PANEL.b),

    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

    borderWidth: 1.2,

    opacity: 0.96,

  });



  let y = panelY + panelH - 36;

  page.drawText('FINELY CRED', {

    x: PDF_MARGIN + 24,

    y,

    size: 11,

    font: fonts.bold,

    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

  });

  y -= 36;

  page.drawText(pdfSafeText(args.title), {

    x: PDF_MARGIN + 24,

    y,

    size: 26,

    font: fonts.bold,

    color: rgb(1, 1, 1),

  });

  y -= 28;

  if (args.subtitle) {

    for (const line of wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 12, args.subtitle, panelW - 48)) {

      page.drawText(line, {

        x: PDF_MARGIN + 24,

        y,

        size: 12,

        font: fonts.regular,

        color: rgb(0.78, 0.82, 0.8),

      });

      y -= 16;

    }

  }



  y -= 12;

  const highlights = args.highlights ?? [

    'Step-by-step dispute framework',

    'FCRA rights + certified mail workflow',

    'Law-per-negative citation guide',

  ];

  for (const h of highlights) {

    page.drawText(pdfSafeText(`+ ${h}`), {

      x: PDF_MARGIN + 28,

      y,

      size: 10,

      font: fonts.regular,

      color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

    });

    y -= 18;

  }



  if (args.meta?.fullName?.trim()) {

    y -= 8;

    page.drawRectangle({

      x: PDF_MARGIN + 20,

      y: y - 4,

      width: panelW - 40,

      height: 1,

      color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

      opacity: 0.25,

    });

    y -= 22;

    page.drawText(pdfSafeText(`Prepared for ${args.meta.fullName.trim()}`), {

      x: PDF_MARGIN + 24,

      y,

      size: 12,

      font: fonts.bold,

      color: rgb(1, 1, 1),

    });

  }



  const stripY = PDF_MARGIN + 8;

  page.drawRectangle({

    x: PDF_MARGIN,

    y: stripY,

    width: panelW,

    height: 36,

    color: rgb(0, 0, 0),

    opacity: 0.45,

    borderColor: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

    borderWidth: 0.8,

  });

  page.drawText('Educational only - not legal advice', {

    x: PDF_MARGIN + 16,

    y: stripY + 12,

    size: 9,

    font: fonts.regular,

    color: rgb(0.75, 0.8, 0.78),

  });

  page.drawText('finelycred.com', {

    x: PDF_PAGE_W - PDF_MARGIN - 88,

    y: stripY + 12,

    size: 9,

    font: fonts.bold,

    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

  });

}



export function drawGuideContentPages(

  pdfDoc: { addPage: (size: [number, number]) => unknown },

  fonts: PdfFonts,

  rgb: RgbFn,

  pages: GeneratedGuidePage[],

  meta?: PdfMeta,

) {

  const maxW = PDF_PAGE_W - PDF_MARGIN * 2 - 16;

  let pageNum = 0;



  for (const pageContent of pages) {

    pageNum += 1;

    let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as PdfPage & {

      drawText: (t: string, o: object) => void;

    };

    let y = PDF_PAGE_H - PDF_MARGIN - 20;



    const drawTopBar = () => {

      page.drawRectangle({

        x: 0,

        y: PDF_PAGE_H - 8,

        width: PDF_PAGE_W,

        height: 8,

        color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

      });

      page.drawRectangle({

        x: 0,

        y: 0,

        width: 8,

        height: PDF_PAGE_H,

        color: rgb(PDF_GREEN_DIM.r, PDF_GREEN_DIM.g, PDF_GREEN_DIM.b),

      });

    };



    const newPage = () => {

      page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as typeof page;

      y = PDF_PAGE_H - PDF_MARGIN - 20;

      drawTopBar();

    };



    const draw = (text: string, opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number }; indent?: number }) => {

      const size = opts?.size ?? 11;

      const font = opts?.bold ? fonts.bold : fonts.regular;

      const color = opts?.color ?? PDF_BODY;

      const indent = opts?.indent ?? 0;

      if (y < PDF_MARGIN + 56) newPage();

      page.drawText(pdfSafeText(text), {

        x: PDF_MARGIN + indent,

        y,

        size,

        font,

        color: rgb(color.r, color.g, color.b),

      });

      y -= size + 6;

    };



    drawTopBar();

    draw('FINELY CRED', { bold: true, size: 9, color: PDF_GREEN });

    y -= 6;

    draw(pageContent.title, { bold: true, size: 20, color: PDF_SLATE });

    if (pageContent.subtitle) {

      y -= 2;

      for (const line of wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 11, pageContent.subtitle, maxW)) {

        draw(line, { size: 11, color: PDF_MUTED });

      }

    }

    y -= 12;



    for (const sec of pageContent.sections) {

      if (sec.heading) {

        y -= 4;

        page.drawRectangle({

          x: PDF_MARGIN,

          y: y - 2,

          width: maxW + 16,

          height: 22,

          color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

          opacity: 0.08,

        });

        draw(sec.heading, { bold: true, size: 12, color: PDF_GREEN_DIM });

      }

      for (const p of sec.paragraphs ?? []) {

        for (const line of wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 11, p, maxW)) {

          draw(line);

        }

        y -= 4;

      }

      if (sec.bullets) {
        for (const b of sec.bullets) {
          const wrapped = wrapPdfText(fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number }, 10, b, maxW - 12);
          wrapped.forEach((line, i) => {
            draw(i === 0 ? `- ${line}` : `  ${line}`, { size: 10, indent: 4 });
          });
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



  const coverPage = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as PdfPage;

  drawPremiumCoverPage(coverPage, fonts, rgb, {

    title: guide.title,

    subtitle: guide.desc,

    meta,

    highlights: guide.sections.slice(0, 3).map((s) => s.heading),

  });



  let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as PdfPage & { drawText: (t: string, o: object) => void };

  let y = PDF_PAGE_H - PDF_MARGIN;

  let pageIndex = 2;



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

    page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as typeof page;

    y = PDF_PAGE_H - PDF_MARGIN;

    page.drawRectangle({

      x: 0,

      y: PDF_PAGE_H - 8,

      width: PDF_PAGE_W,

      height: 8,

      color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

    });

    page.drawRectangle({

      x: 0,

      y: 0,

      width: 8,

      height: PDF_PAGE_H,

      color: rgb(PDF_GREEN_DIM.r, PDF_GREEN_DIM.g, PDF_GREEN_DIM.b),

    });

  };



  page.drawRectangle({

    x: 0,

    y: PDF_PAGE_H - 8,

    width: PDF_PAGE_W,

    height: 8,

    color: rgb(PDF_GREEN.r, PDF_GREEN.g, PDF_GREEN.b),

  });

  page.drawRectangle({

    x: 0,

    y: 0,

    width: 8,

    height: PDF_PAGE_H,

    color: rgb(PDF_GREEN_DIM.r, PDF_GREEN_DIM.g, PDF_GREEN_DIM.b),

  });



  const draw = (text: string, opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number }; gap?: number }) => {

    const size = opts?.size ?? 11;

    const font = opts?.bold ? bold : regular;

    const color = opts?.color ?? PDF_BODY;

    const gap = opts?.gap ?? size + 6;

    if (y < PDF_MARGIN + 56) newPage();

    page.drawText(pdfSafeText(text), { x: PDF_MARGIN + 8, y, size, font, color: rgb(color.r, color.g, color.b) });

    y -= gap;

  };



  draw('FINELY CRED', { bold: true, size: 10, color: PDF_GREEN });

  draw('Table of Contents', { bold: true, size: 16, color: PDF_SLATE, gap: 18 });

  guide.sections.forEach((sec, i) => {

    draw(`${i + 1}. ${sec.heading}`, { size: 11, color: PDF_BODY });

  });

  y -= 8;

  newPage();



  for (const sec of guide.sections) {

    if (y < PDF_MARGIN + 120) newPage();

    draw(sec.heading, { bold: true, size: 14, color: PDF_GREEN_DIM, gap: 12 });

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

