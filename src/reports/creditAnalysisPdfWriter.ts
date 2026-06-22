import type { RGB, PDFFont, PDFPage, PDFDocument } from 'pdf-lib';
import { rgb } from 'pdf-lib';

export function wrapTextLines(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export type PdfWriterOpts = {
  pdf: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  accent: RGB;
  ink: RGB;
  soft: RGB;
  margin?: number;
  headerH?: number;
  footerH?: number;
};

export class PaginatedPdfWriter {
  readonly margin: number;
  readonly headerH: number;
  readonly footerH: number;
  readonly pageW = 612;
  readonly pageH = 792;
  pages: PDFPage[] = [];
  private page: PDFPage | null = null;
  private y = 0;

  constructor(private opts: PdfWriterOpts) {
    this.margin = opts.margin ?? 48;
    this.headerH = opts.headerH ?? 72;
    this.footerH = opts.footerH ?? 40;
  }

  private contentTop() {
    return this.pageH - this.headerH - 24;
  }

  private contentBottom() {
    return this.footerH + 16;
  }

  addPage(headerText: string) {
    this.page = this.opts.pdf.addPage([this.pageW, this.pageH]);
    this.pages.push(this.page);
    const { accent, ink, soft, font, fontBold } = this.opts;
    const { width, height } = this.page.getSize();
    this.page.drawRectangle({ x: 0, y: height - this.headerH, width, height: this.headerH, color: rgb(0.98, 0.98, 0.99) });
    this.page.drawRectangle({ x: 0, y: height - this.headerH - 2, width, height: 2, color: accent });
    this.page.drawText('Finely Cred', { x: this.margin, y: height - 46, size: 12, font: fontBold, color: ink });
    this.page.drawText(headerText.slice(0, 90), { x: this.margin, y: height - 62, size: 9, font, color: soft });
    this.y = this.contentTop();
  }

  ensureSpace(needed: number, headerText: string) {
    if (!this.page || this.y - needed < this.contentBottom()) {
      this.addPage(headerText);
    }
  }

  drawTitle(title: string) {
    this.ensureSpace(40, title);
    this.page!.drawText(title, { x: this.margin, y: this.y, size: 18, font: this.opts.fontBold, color: this.opts.ink });
    this.y -= 28;
    this.page!.drawRectangle({ x: this.margin, y: this.y, width: 40, height: 6, color: this.opts.accent });
    this.y -= 20;
  }

  drawParagraph(text: string, fontSize: number, headerText: string, indent = 0) {
    const maxW = this.pageW - this.margin * 2 - indent;
    const lines = wrapTextLines(text, maxW, fontSize, this.opts.font);
    for (const line of lines) {
      this.ensureSpace(fontSize + 6, headerText);
      this.page!.drawText(line, { x: this.margin + indent, y: this.y, size: fontSize, font: this.opts.font, color: this.opts.ink });
      this.y -= fontSize + 5;
    }
    this.y -= 4;
  }

  drawBullets(bullets: string[], headerText: string) {
    for (const b of bullets) {
      const lines = wrapTextLines(b, this.pageW - this.margin * 2 - 14, 11, this.opts.font);
      lines.forEach((line, i) => {
        this.ensureSpace(16, headerText);
        const text = i === 0 ? `- ${line}` : `  ${line}`;
        this.page!.drawText(text, { x: this.margin, y: this.y, size: 11, font: this.opts.font, color: this.opts.ink });
        this.y -= 15;
      });
      this.y -= 2;
    }
  }

  drawFooters() {
    const total = this.opts.pdf.getPageCount();
    const { font, soft } = this.opts;
    for (let i = 0; i < total; i++) {
      const page = this.opts.pdf.getPage(i);
      const { width, height } = page.getSize();
      page.drawRectangle({ x: 0, y: 0, width, height: this.footerH, color: rgb(0.985, 0.985, 0.99) });
      page.drawText(`Page ${i + 1} / ${total}`, { x: width - 120, y: 14, size: 9, font, color: soft });
    }
  }
}
