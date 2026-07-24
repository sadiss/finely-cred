import type { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import { wrapTextLines } from './creditAnalysisPdfWriter';
import { pdfSafe } from './pdfTextUtils';
import type { DetailedAccountRow, InquiryRow } from './analysisReportLayoutData';

/** Exact tokens from src/index.css — Finely Cred obsidian + amber gold (not navy/blue). */
function hex(h: string): RGB {
  const x = h.replace('#', '');
  return rgb(parseInt(x.slice(0, 2), 16) / 255, parseInt(x.slice(2, 4), 16) / 255, parseInt(x.slice(4, 6), 16) / 255);
}

export const FINELY_PDF_PALETTE = {
  bg: hex('#0b1110'),
  bgDeep: hex('#060908'),
  bgSection: hex('#0d1512'),
  bgElevated: hex('#141d1a'),
  forest: hex('#062319'),
  forestSoft: hex('#0d3326'),
  gold: hex('#fbbf24'),
  goldDark: hex('#f59e0b'),
  goldDeep: hex('#d97706'),
  amber: hex('#f97316'),
  cream: hex('#f7f5f2'),
  creamDark: hex('#f2f0ec'),
  ivory: hex('#fffaf0'),
  ivoryDeep: hex('#efe7d7'),
  ink: hex('#0a100e'),
  soft: hex('#3d4542'),
  muted: hex('#6b7280'),
  border: hex('#e5e2dc'),
  white: rgb(1, 1, 1),
  textOnDark: hex('#f8faf9'),
  textDimOnDark: hex('#a8b0ac'),
  emerald: hex('#10b981'),
  success: hex('#34d399'),
  warn: hex('#d97706'),
  danger: hex('#e11d48'),
  rose: hex('#e11d48'),
  fuchsia: hex('#d946ef'),
  violet: hex('#7c3aed'),
  sky: hex('#0ea5e9'),
};

export type FinelyPdfWriterOpts = {
  pdf: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  margin?: number;
  footerLabel?: string;
};

export class FinelyAnalysisPdfWriter {
  readonly pageW = 612;
  readonly pageH = 792;
  readonly margin: number;
  readonly contentW: number;
  readonly headerH = 48;
  readonly footerH = 40;
  readonly p = FINELY_PDF_PALETTE;
  readonly footerLabel: string;

  private page: PDFPage | null = null;
  private y = 0;
  private sectionHeader = 'Credit Analysis';

  constructor(private opts: FinelyPdfWriterOpts) {
    this.margin = opts.margin ?? 40;
    this.contentW = this.pageW - this.margin * 2;
    this.footerLabel = opts.footerLabel ?? 'Finely Cred';
  }

  private get font() {
    return this.opts.font;
  }
  private get fontBold() {
    return this.opts.fontBold;
  }

  private contentTop() {
    return this.pageH - this.headerH - 22;
  }

  private contentBottom() {
    return this.footerH + 20;
  }

  private toneColor(tone?: 'gold' | 'success' | 'warn' | 'ink' | 'danger' | 'violet' | 'fuchsia' | 'sky') {
    if (tone === 'success') return this.p.emerald;
    if (tone === 'warn') return this.p.amber;
    if (tone === 'danger') return this.p.rose;
    if (tone === 'violet') return this.p.violet;
    if (tone === 'fuchsia') return this.p.fuchsia;
    if (tone === 'sky') return this.p.sky;
    if (tone === 'ink') return this.p.ink;
    return this.p.gold;
  }

  private fittedSize(text: string, maxW: number, start: number, min = 6.5, bold = false) {
    const font = bold ? this.fontBold : this.font;
    let size = start;
    const safe = pdfSafe(text);
    while (size > min && font.widthOfTextAtSize(safe, size) > maxW) size -= 0.4;
    return size;
  }

  private drawFittedText(text: string, x: number, y: number, maxW: number, size: number, color: RGB, bold = false, min = 6.5) {
    const safe = pdfSafe(text);
    const font = bold ? this.fontBold : this.font;
    const fit = this.fittedSize(safe, maxW, size, min, bold);
    const suffix = '...';
    let out = safe;
    while (out.length > 3 && font.widthOfTextAtSize(out, fit) > maxW) out = `${out.slice(0, -4).trimEnd()}${suffix}`;
    this.page!.drawText(out, { x, y, size: fit, font, color });
  }

  setSectionHeader(text: string) {
    this.sectionHeader = pdfSafe(text).slice(0, 80);
  }

  private drawRunningHeader(page: PDFPage) {
    const { width, height } = page.getSize();
    page.drawRectangle({ x: 0, y: height - this.headerH, width, height: this.headerH, color: this.p.forest });
    page.drawRectangle({ x: 0, y: height - this.headerH, width, height: 2.5, color: this.p.gold });
    page.drawRectangle({ x: width * 0.38, y: height - this.headerH, width: width * 0.2, height: 2.5, color: this.p.emerald });
    page.drawRectangle({ x: width * 0.58, y: height - this.headerH, width: width * 0.14, height: 2.5, color: this.p.fuchsia });
    page.drawRectangle({ x: width * 0.72, y: height - this.headerH, width: width * 0.12, height: 2.5, color: this.p.violet });
    page.drawText('FINELY CRED', {
      x: this.margin,
      y: height - 22,
      size: 8.5,
      font: this.fontBold,
      color: this.p.gold,
    });
    page.drawText('PREMIUM CREDIT ANALYSIS', {
      x: this.margin + 78,
      y: height - 22,
      size: 7,
      font: this.font,
      color: this.p.textDimOnDark,
    });
    page.drawText(this.sectionHeader, {
      x: this.margin,
      y: height - 36,
      size: 8,
      font: this.font,
      color: this.p.textDimOnDark,
    });
    page.drawText('CONFIDENTIAL', {
      x: width - this.margin - 62,
      y: height - 28,
      size: 7,
      font: this.fontBold,
      color: this.p.goldDark,
    });
  }

  drawComplianceStrip(text = 'Results vary · not legal advice · funding subject to underwriting') {
    const h = 22;
    this.ensureSpace(h + 8, this.sectionHeader);
    const y = this.y - h;
    this.page!.drawRectangle({
      x: this.margin,
      y,
      width: this.contentW,
      height: h,
      color: this.p.creamDark,
      borderColor: this.p.border,
      borderWidth: 0.6,
    });
    this.page!.drawRectangle({ x: this.margin, y, width: 3, height: h, color: this.p.gold });
    this.page!.drawText(pdfSafe(text), {
      x: this.margin + 12,
      y: y + 7,
      size: 7.5,
      font: this.font,
      color: this.p.muted,
    });
    this.y = y - 10;
  }

  addPage(sectionHeader?: string) {
    if (sectionHeader) this.setSectionHeader(sectionHeader);
    this.page = this.opts.pdf.addPage([this.pageW, this.pageH]);
    this.page.drawRectangle({ x: 0, y: 0, width: this.pageW, height: this.pageH, color: this.p.ivory });
    this.page.drawRectangle({ x: 0, y: 0, width: 8, height: this.pageH, color: this.p.creamDark });
    this.drawRunningHeader(this.page);
    this.y = this.contentTop();
  }

  ensureSpace(needed: number, sectionHeader?: string) {
    if (!this.page || this.y - needed < this.contentBottom()) {
      this.addPage(sectionHeader ?? this.sectionHeader);
    }
  }

  drawSectionTitle(title: string, subtitle?: string) {
    this.ensureSpace(78, title);
    const top = this.y + 4;
    const h = subtitle ? 72 : 56;
    const y = top - h;
    this.page!.drawRectangle({ x: this.margin, y, width: this.contentW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 0.8 });
    this.page!.drawRectangle({ x: this.margin, y, width: 6, height: h, color: this.p.gold });
    this.page!.drawRectangle({ x: this.margin + 6, y: y + h - 3, width: this.contentW * 0.34, height: 3, color: this.p.emerald });
    this.page!.drawRectangle({ x: this.margin + this.contentW * 0.36, y: y + h - 3, width: this.contentW * 0.16, height: 3, color: this.p.fuchsia });
    this.page!.drawText(pdfSafe(title), { x: this.margin + 18, y: y + h - 28, size: 20, font: this.fontBold, color: this.p.ink });
    if (subtitle) {
      let sy = y + h - 46;
      for (const line of wrapTextLines(pdfSafe(subtitle), this.contentW - 36, 9.5, this.font).slice(0, 2)) {
        this.page!.drawText(line, { x: this.margin + 18, y: sy, size: 9.5, font: this.font, color: this.p.soft });
        sy -= 12;
      }
    }
    this.y = y - 18;
  }

  drawParagraph(text: string, size = 10.5) {
    for (const line of wrapTextLines(pdfSafe(text), this.contentW, size, this.font)) {
      this.ensureSpace(size + 6, this.sectionHeader);
      this.page!.drawText(line, { x: this.margin, y: this.y, size, font: this.font, color: this.p.ink });
      this.y -= size + 6;
    }
    this.y -= 6;
  }

  drawEditorialBlock(title: string, paragraphs: string[], subtitle?: string) {
    this.drawSectionTitle(title, subtitle);
    for (const p of paragraphs) {
      this.drawParagraph(p);
    }
    this.y -= 4;
  }

  drawPremiumImagePanel(kind: 'cover' | 'score' | 'mindset' | 'negative' | 'positive' | 'roadmap' | 'closing', x: number, y: number, w: number, h: number) {
    const page = this.page!;
    const dark = kind === 'cover' || kind === 'closing';
    page.drawRectangle({ x, y, width: w, height: h, color: dark ? this.p.bgDeep : this.p.creamDark, borderColor: this.p.gold, borderWidth: 1.25 });
    page.drawRectangle({ x, y: y + h - 5, width: w, height: 5, color: this.p.gold });
    page.drawRectangle({ x, y: y + h - 10, width: w * 0.55, height: 5, color: this.p.emerald });
    page.drawRectangle({ x: x + w * 0.55, y: y + h - 10, width: w * 0.25, height: 5, color: this.p.fuchsia });
    page.drawRectangle({ x: x + w * 0.8, y: y + h - 10, width: w * 0.2, height: 5, color: this.p.violet });

    // Layered “spread” atmosphere — luxury glass geometry, not flat fill
    page.drawEllipse({
      x: x + w * 0.62,
      y: y + h * 0.48,
      xScale: w * 0.28,
      yScale: h * 0.28,
      color: dark ? this.p.forestSoft : this.p.white,
      opacity: 0.55,
    });
    page.drawEllipse({
      x: x + w * 0.28,
      y: y + h * 0.68,
      xScale: w * 0.16,
      yScale: h * 0.12,
      color: this.p.emerald,
      opacity: 0.22,
    });
    page.drawEllipse({
      x: x + w * 0.78,
      y: y + h * 0.3,
      xScale: w * 0.14,
      yScale: h * 0.1,
      color: this.p.gold,
      opacity: 0.28,
    });
    page.drawRectangle({
      x: x + 16,
      y: y + 36,
      width: w * 0.42,
      height: h * 0.42,
      color: dark ? this.p.bgElevated : this.p.white,
      borderColor: this.p.goldDark,
      borderWidth: 0.8,
      opacity: 0.85,
    });
    page.drawRectangle({
      x: x + w * 0.48,
      y: y + 48,
      width: w * 0.42,
      height: h * 0.28,
      color: dark ? this.p.forest : this.p.ivoryDeep,
      borderColor: this.p.emerald,
      borderWidth: 0.6,
      opacity: 0.75,
    });

    const label =
      kind === 'score'
        ? 'SCORE POSITIONING'
        : kind === 'mindset'
          ? 'CREDIT MINDSET'
          : kind === 'negative'
            ? 'RISK STRATEGY'
            : kind === 'positive'
              ? 'CREDIT STRENGTH'
              : kind === 'roadmap'
                ? 'ACTION ROADMAP'
                : kind === 'closing'
                  ? 'NEXT STEPS'
                  : 'PREMIUM ANALYSIS';
    const sub =
      kind === 'score'
        ? 'Bureau readout · readiness · factor posture'
        : kind === 'mindset'
          ? 'Orient before you act'
          : kind === 'negative'
            ? 'Impact-ranked risk map'
            : kind === 'positive'
              ? 'Assets lenders trust'
              : kind === 'roadmap'
                ? 'Now · next · later'
                : kind === 'closing'
                  ? 'Execute in the portal'
                  : 'Partner strategy dossier';
    page.drawText(label, { x: x + 22, y: y + 22, size: 9, font: this.fontBold, color: dark ? this.p.gold : this.p.forest });
    page.drawText(sub, { x: x + 22, y: y + 10, size: 7.5, font: this.font, color: dark ? this.p.textDimOnDark : this.p.muted });
  }

  drawSectionOpener(title: string, subtitle: string, kind: 'score' | 'mindset' | 'negative' | 'positive' | 'roadmap' | 'closing') {
    this.addPage(title);
    const panelH = 188;
    this.drawPremiumImagePanel(kind, this.margin, this.y - panelH, this.contentW, panelH);
    this.y -= panelH + 16;
    this.drawSectionTitle(title, subtitle);
    this.drawComplianceStrip();
  }

  drawMindsetChapter(level: string, title: string, paragraphs: string[]) {
    const pad = 16;
    const bodyLines = paragraphs.flatMap((p) => wrapTextLines(pdfSafe(p), this.contentW - pad * 2, 10.5, this.font));
    const h = pad * 2 + 22 + bodyLines.length * 14;
    this.ensureSpace(h + 12, 'Credit mindset');
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
    this.page!.drawRectangle({ x, y: y + h - 4, width: this.contentW, height: 4, color: this.p.gold });
    this.page!.drawRectangle({ x, y, width: 5, height: h, color: this.p.bgElevated });
    this.page!.drawText(level.toUpperCase(), { x: x + 16, y: y + h - pad - 10, size: 8.5, font: this.fontBold, color: this.p.goldDeep });
    this.drawFittedText(pdfSafe(title), x + 100, y + h - pad - 10, this.contentW - 122, 12, this.p.ink, true, 8);
    let by = y + h - pad - 28;
    for (const line of bodyLines) {
      this.page!.drawText(line, { x: x + 14, y: by, size: 10.5, font: this.font, color: this.p.soft });
      by -= 14;
    }
    this.y = y - 12;
  }

  drawBullets(items: string[], size = 9.5) {
    for (const item of items) {
      const lines = wrapTextLines(pdfSafe(item), this.contentW - 14, size, this.font);
      lines.forEach((line, i) => {
        this.ensureSpace(size + 5, this.sectionHeader);
        this.page!.drawText((i === 0 ? '• ' : '  ') + line, {
          x: this.margin,
          y: this.y,
          size,
          font: this.font,
          color: this.p.ink,
        });
        this.y -= size + 4;
      });
      this.y -= 2;
    }
  }

  drawSubsectionLabel(title: string, count?: number) {
    const label = count != null ? `${pdfSafe(title)} (${count})` : pdfSafe(title);
    const h = 26;
    this.ensureSpace(h + 6, this.sectionHeader);
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.creamDark, borderColor: this.p.border, borderWidth: 0.5 });
    this.page!.drawRectangle({ x, y, width: 3, height: h, color: this.p.gold });
    this.page!.drawText(label.toUpperCase(), { x: x + 12, y: y + 8, size: 8, font: this.fontBold, color: this.p.ink });
    this.y = y - 6;
  }

  drawQuickReadCards(cards: Array<{ label: string; body: string; tone?: 'success' | 'warn' | 'gold' }>) {
    const gap = 12;
    const colW = (this.contentW - gap * 2) / 3;
    const heights = cards.map((c) => {
      const lines = wrapTextLines(pdfSafe(c.body), colW - 20, 9.5, this.font);
      return 44 + lines.length * 12;
    });
    const h = Math.max(...heights, 88);
    this.ensureSpace(h + 14, this.sectionHeader);
    const top = this.y;
    cards.forEach((card, i) => {
      const x = this.margin + i * (colW + gap);
      const y = top - h;
      const accent =
        card.tone === 'success' ? this.p.success : card.tone === 'warn' ? this.p.warn : this.p.gold;
      this.page!.drawRectangle({ x, y, width: colW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
      this.page!.drawRectangle({ x, y: y + h - 4, width: colW, height: 4, color: accent });
      this.page!.drawText(pdfSafe(card.label.toUpperCase()), {
        x: x + 10,
        y: y + h - 18,
        size: 7,
        font: this.fontBold,
        color: this.p.muted,
      });
      let by = y + h - 32;
      for (const line of wrapTextLines(pdfSafe(card.body), colW - 20, 9.5, this.font)) {
        this.page!.drawText(line, { x: x + 10, y: by, size: 9.5, font: this.font, color: this.p.ink });
        by -= 12;
      }
    });
    this.y = top - h - 14;
  }

  drawRoadmapPhase(phase: string, items: string[]) {
    const pad = 12;
    const bulletLines = items.flatMap((item) =>
      wrapTextLines(pdfSafe(item), this.contentW - pad * 2 - 10, 9, this.font).map((line, i) => (i === 0 ? `• ${line}` : `  ${line}`)),
    );
    const h = pad * 2 + 18 + bulletLines.length * 12;
    this.ensureSpace(h + 8, this.sectionHeader);
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
    this.page!.drawRectangle({ x, y: y + h - 2, width: this.contentW, height: 2, color: this.p.gold });
    this.page!.drawText(pdfSafe(phase.toUpperCase()), { x: x + pad, y: y + h - pad - 8, size: 8, font: this.fontBold, color: this.p.gold });
    let by = y + h - pad - 22;
    for (const line of bulletLines) {
      this.page!.drawText(line, { x: x + pad, y: by, size: 9, font: this.font, color: this.p.ink });
      by -= 12;
    }
    this.y = y - 8;
  }

  drawKpiRow(items: Array<{ label: string; value: string; tone?: 'gold' | 'success' | 'warn' | 'ink' }>) {
    const gap = 10;
    const n = Math.min(items.length, 4);
    const w = (this.contentW - gap * (n - 1)) / n;
    const h = 72;
    this.ensureSpace(h + 10, this.sectionHeader);
    items.slice(0, 4).forEach((item, i) => {
      const x = this.margin + i * (w + gap);
      const y = this.y - h;
      const tone = this.toneColor(item.tone);
      this.page!.drawRectangle({ x, y, width: w, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
      this.page!.drawRectangle({ x, y, width: 4, height: h, color: tone });
      this.page!.drawRectangle({ x, y: y + h - 3, width: w, height: 3, color: tone });
      this.page!.drawText(pdfSafe(item.label.toUpperCase()), {
        x: x + 12,
        y: y + h - 19,
        size: 6.5,
        font: this.fontBold,
        color: this.p.muted,
      });
      this.drawFittedText(item.value, x + 12, y + 24, w - 24, 17, tone, true, 8);
    });
    this.y -= h + 12;
  }

  drawMindsetTier(level: string, title: string, body: string) {
    const pad = 12;
    const bodyLines = wrapTextLines(pdfSafe(body), this.contentW - pad * 2 - 36, 9, this.font);
    const h = pad * 2 + 18 + bodyLines.length * 12;
    this.ensureSpace(h + 8, 'Credit mindset');
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
    this.page!.drawRectangle({ x, y, width: 4, height: h, color: this.p.gold });
    this.page!.drawText(level, { x: x + 14, y: y + h - pad - 10, size: 8.5, font: this.fontBold, color: this.p.gold });
    this.drawFittedText(pdfSafe(title), x + 88, y + h - pad - 10, this.contentW - 110, 10.5, this.p.ink, true, 7.5);
    let by = y + h - pad - 26;
    for (const line of bodyLines) {
      this.page!.drawText(line, { x: x + 14, y: by, size: 9, font: this.font, color: this.p.soft });
      by -= 12;
    }
    this.y = y - 8;
  }

  drawHighlightBox(title: string, body: string) {
    const pad = 18;
    const lines = wrapTextLines(pdfSafe(body), this.contentW - pad * 2, 10.5, this.font);
    const h = pad * 2 + 20 + lines.length * 14;
    this.ensureSpace(h + 12, this.sectionHeader);
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.bgElevated, borderColor: this.p.gold, borderWidth: 1.5 });
    this.page!.drawRectangle({ x, y: y + h - 3, width: this.contentW, height: 3, color: this.p.gold });
    this.page!.drawText(pdfSafe(title), { x: x + pad, y: y + h - pad - 10, size: 11, font: this.fontBold, color: this.p.gold });
    let by = y + h - pad - 28;
    for (const line of lines) {
      this.page!.drawText(line, { x: x + pad, y: by, size: 10.5, font: this.font, color: this.p.textOnDark });
      by -= 14;
    }
    this.y = y - 12;
  }

  drawPathPhase(title: string, paragraphs: string[]) {
    const pad = 14;
    const lines = paragraphs.flatMap((p) => wrapTextLines(pdfSafe(p), this.contentW - pad * 2, 10.5, this.font));
    const h = pad * 2 + 20 + lines.length * 14;
    this.ensureSpace(h + 10, 'Your path forward');
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
    this.page!.drawRectangle({ x, y, width: 5, height: h, color: this.p.gold });
    this.page!.drawText(pdfSafe(title), { x: x + 16, y: y + h - pad - 10, size: 11, font: this.fontBold, color: this.p.ink });
    let by = y + h - pad - 28;
    for (const line of lines) {
      this.page!.drawText(line, { x: x + 16, y: by, size: 10.5, font: this.font, color: this.p.soft });
      by -= 14;
    }
    this.y = y - 10;
  }

  private measureAccountCard(row: DetailedAccountRow): number {
    const fieldRows = Math.ceil(row.fields.length / 2);
    const noteLines = row.note ? wrapTextLines(pdfSafe(row.note), 220, 8.5, this.font).length : 0;
    return 56 + fieldRows * 15 + (row.note ? 10 + noteLines * 11 : 0);
  }

  private drawSingleAccountCard(x: number, y: number, w: number, h: number, row: DetailedAccountRow) {
    const headerH = 32;
    const statusColor =
      row.statusTone === 'success' ? this.p.success : row.statusTone === 'danger' ? this.p.danger : row.statusTone === 'warn' ? this.p.warn : this.p.soft;
    const status = pdfSafe(row.status).slice(0, 22);
    const statusW = Math.min(this.fontBold.widthOfTextAtSize(status, 7.5) + 14, w * 0.42);

    this.page!.drawRectangle({ x, y, width: w, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
    this.page!.drawRectangle({ x, y: y + h - headerH, width: w, height: headerH, color: this.p.bgElevated });
    this.page!.drawRectangle({ x, y: y + h - headerH, width: w, height: 2, color: this.p.gold });

    this.page!.drawText(pdfSafe(row.creditor).slice(0, 28), {
      x: x + 10,
      y: y + h - headerH + 10,
      size: 10,
      font: this.fontBold,
      color: this.p.textOnDark,
    });
    this.page!.drawRectangle({
      x: x + w - statusW - 8,
      y: y + h - headerH + 8,
      width: statusW,
      height: 16,
      color: this.p.bgSection,
      borderColor: this.p.goldDark,
      borderWidth: 0.5,
    });
    this.page!.drawText(status, {
      x: x + w - statusW - 4,
      y: y + h - headerH + 11,
      size: 7.5,
      font: this.fontBold,
      color: statusColor,
    });
    this.page!.drawText(pdfSafe(row.subtitle).slice(0, 36), {
      x: x + 10,
      y: y + h - headerH - 2,
      size: 7.5,
      font: this.font,
      color: this.p.textDimOnDark,
    });

    const colW = (w - 24) / 2;
    let fy = y + h - headerH - 18;
    for (let i = 0; i < row.fields.length; i += 2) {
      const left = row.fields[i];
      const right = row.fields[i + 1];
      this.page!.drawText(`${left.label}:`, { x: x + 10, y: fy, size: 7, font: this.fontBold, color: this.p.muted });
      this.page!.drawText(pdfSafe(left.value).slice(0, 18), { x: x + 10, y: fy - 10, size: 8.5, font: this.font, color: this.p.ink });
      if (right) {
        this.page!.drawText(`${right.label}:`, { x: x + 10 + colW, y: fy, size: 7, font: this.fontBold, color: this.p.muted });
        this.page!.drawText(pdfSafe(right.value).slice(0, 18), { x: x + 10 + colW, y: fy - 10, size: 8.5, font: this.font, color: this.p.ink });
      }
      fy -= 26;
    }

    if (row.note) {
      let ny = y + 10;
      for (const line of wrapTextLines(pdfSafe(row.note), w - 16, 8.5, this.font).slice(0, 3)) {
        this.page!.drawText(line, { x: x + 8, y: ny, size: 8.5, font: this.font, color: this.p.soft });
        ny += 10;
      }
    }
  }

  drawAccountCardPair(left: DetailedAccountRow, right?: DetailedAccountRow) {
    const gap = 14;
    const colW = (this.contentW - gap) / 2;
    const h = Math.max(this.measureAccountCard(left), right ? this.measureAccountCard(right) : 0, 120);
    this.ensureSpace(h + 12, this.sectionHeader);
    const top = this.y;
    const y = top - h;
    this.drawSingleAccountCard(this.margin, y, colW, h, left);
    if (right) this.drawSingleAccountCard(this.margin + colW + gap, y, colW, h, right);
    this.y = y - 12;
  }

  drawAccountCardGrid(rows: DetailedAccountRow[]) {
    for (let i = 0; i < rows.length; i += 2) {
      this.drawAccountCardPair(rows[i], rows[i + 1]);
    }
  }

  drawInquiryTable(rows: InquiryRow[]) {
    const rowH = 22;
    const headH = 20;
    const x = this.margin;

    const drawHeader = () => {
      this.ensureSpace(headH + 4, 'Inquiries');
      const ty = this.y;
      this.page!.drawRectangle({ x, y: ty - headH, width: this.contentW, height: headH, color: this.p.bg });
      this.page!.drawText('COMPANY', { x: x + 10, y: ty - 14, size: 7.5, font: this.fontBold, color: this.p.gold });
      this.page!.drawText('DATE', { x: x + this.contentW * 0.5, y: ty - 14, size: 7.5, font: this.fontBold, color: this.p.gold });
      this.page!.drawText('BUREAU', { x: x + this.contentW * 0.78, y: ty - 14, size: 7.5, font: this.fontBold, color: this.p.gold });
      this.y = ty - headH;
    };

    drawHeader();

    for (let i = 0; i < rows.length; i++) {
      this.ensureSpace(rowH + 2, 'Inquiries');
      const ry = this.y - rowH;
      const bg = i % 2 === 0 ? this.p.white : this.p.creamDark;
      this.page!.drawRectangle({ x, y: ry, width: this.contentW, height: rowH, color: bg, borderColor: this.p.border, borderWidth: 0.4 });
      const r = rows[i];
      this.page!.drawText(pdfSafe(r.company).slice(0, 38), { x: x + 10, y: ry + 7, size: 8, font: this.font, color: this.p.ink });
      this.page!.drawText(pdfSafe(r.date).slice(0, 14), { x: x + this.contentW * 0.5, y: ry + 7, size: 8, font: this.font, color: this.p.soft });
      this.page!.drawText(pdfSafe(r.bureau).slice(0, 10), { x: x + this.contentW * 0.78, y: ry + 7, size: 8, font: this.font, color: this.p.soft });
      this.y = ry - 4;
    }
    this.y -= 4;
  }

  drawPriorityCard(rank: number, row: DetailedAccountRow, notes: string[]) {
    const pad = 14;
    const noteLines = notes.flatMap((n) => wrapTextLines(pdfSafe(n), this.contentW - pad * 2 - 20, 10, this.font));
    const h = 52 + noteLines.length * 12;
    this.ensureSpace(h + 10, 'Priority action plan');
    const x = this.margin;
    const y = this.y - h;
    this.page!.drawRectangle({ x, y, width: this.contentW, height: h, color: this.p.white, borderColor: this.p.border, borderWidth: 1 });
    this.page!.drawRectangle({ x, y, width: 5, height: h, color: this.p.gold });
    this.page!.drawText(String(rank).padStart(2, '0'), { x: x + 12, y: y + h - 18, size: 12, font: this.fontBold, color: this.p.goldDeep });
    this.page!.drawText(pdfSafe(row.creditor).slice(0, 48), {
      x: x + 32,
      y: y + h - 18,
      size: 11,
      font: this.fontBold,
      color: this.p.ink,
    });
    this.page!.drawText(pdfSafe(row.subtitle).slice(0, 80), { x: x + 32, y: y + h - 32, size: 8.5, font: this.font, color: this.p.muted });
    let ny = y + h - 46;
    for (const line of noteLines) {
      this.page!.drawText(line, { x: x + 32, y: ny, size: 10, font: this.font, color: this.p.soft });
      ny -= 12;
    }
    this.y = y - 10;
  }

  drawCoverPage(args: {
    partnerName: string;
    title: string;
    preparedDate: string;
    reportLine: string;
    kpis: Array<{ label: string; value: string; tone?: 'gold' | 'success' | 'warn' | 'ink' }>;
  }) {
    const page = this.opts.pdf.addPage([this.pageW, this.pageH]);
    this.page = page;
    const { width, height } = page.getSize();
    const p = this.p;
    // Ivory body first, then dark hero band on top
    page.drawRectangle({ x: 0, y: 0, width, height, color: p.ivory });
    page.drawRectangle({ x: 0, y: height - 168, width, height: 168, color: p.bgDeep });
    // Soft radial wash on hero band
    page.drawRectangle({ x: 0, y: height - 168, width: width * 0.55, height: 168, color: p.forest, opacity: 0.35 });
    page.drawRectangle({ x: 0, y: height - 172, width, height: 4, color: p.gold });
    page.drawRectangle({ x: width * 0.4, y: height - 172, width: width * 0.22, height: 4, color: p.emerald });
    page.drawRectangle({ x: width * 0.62, y: height - 172, width: width * 0.16, height: 4, color: p.fuchsia });
    page.drawRectangle({ x: this.margin, y: height - 74, width: 56, height: 2, color: p.gold });
    page.drawText('FINELY CRED', { x: this.margin, y: height - 38, size: 12, font: this.fontBold, color: p.gold });
    page.drawText('PARTNER STRATEGY DOSSIER', { x: this.margin, y: height - 56, size: 8, font: this.font, color: p.textDimOnDark });
    page.drawText(pdfSafe(args.title), { x: this.margin, y: height - 100, size: 26, font: this.fontBold, color: p.textOnDark });
    page.drawText('Restore · Build · Fundability', {
      x: this.margin,
      y: height - 124,
      size: 10,
      font: this.fontBold,
      color: p.emerald,
    });
    page.drawText('Prepared exclusively for your file — sequence over guesswork', {
      x: this.margin,
      y: height - 142,
      size: 9,
      font: this.font,
      color: p.textDimOnDark,
    });

    this.drawPremiumImagePanel('cover', this.margin, height - 400, width - this.margin * 2, 200);

    page.drawText(pdfSafe(args.partnerName), { x: this.margin, y: height - 440, size: 22, font: this.fontBold, color: p.forest });
    page.drawText(pdfSafe(args.preparedDate), { x: this.margin, y: height - 464, size: 10.5, font: this.font, color: p.soft });
    page.drawText(pdfSafe(args.reportLine), { x: this.margin, y: height - 482, size: 10.5, font: this.font, color: p.soft });

    page.drawRectangle({
      x: this.margin,
      y: height - 520,
      width: width - this.margin * 2,
      height: 28,
      color: p.creamDark,
      borderColor: p.border,
      borderWidth: 0.7,
    });
    page.drawText('Results vary · not legal advice · funding subject to underwriting · confidential educational use', {
      x: this.margin + 12,
      y: height - 510,
      size: 8,
      font: this.font,
      color: p.muted,
    });

    const gap = 10;
    const n = 4;
    const w = (width - this.margin * 2 - gap * (n - 1)) / n;
    const cardH = 82;
    const cardY = 108;
    args.kpis.slice(0, 4).forEach((kpi, i) => {
      const x = this.margin + i * (w + gap);
      const tone = this.toneColor(kpi.tone);
      page.drawRectangle({ x, y: cardY, width: w, height: cardH, color: p.white, borderColor: p.border, borderWidth: 1 });
      page.drawRectangle({ x, y: cardY, width: 5, height: cardH, color: tone });
      page.drawRectangle({ x, y: cardY + cardH - 4, width: w, height: 4, color: tone });
      page.drawText(pdfSafe(kpi.label.toUpperCase()), { x: x + 12, y: cardY + 56, size: 6.5, font: this.fontBold, color: p.muted });
      this.drawFittedText(kpi.value, x + 12, cardY + 22, w - 24, 18, tone, true, 8);
    });
    page.drawText('Open your Finely Cred portal to execute Round 1 — this PDF is the oriented snapshot.', {
      x: this.margin,
      y: 78,
      size: 8.5,
      font: this.font,
      color: p.soft,
    });
  }

  drawClosingSpread(args: { partnerName: string; preparedDate: string; title: string; paragraphs: string[] }) {
    this.addPage('What happens next');
    this.drawEditorialBlock(args.title, args.paragraphs);
    this.page!.drawText('Prepared by Shelly St Louis · Finely Cred', {
      x: this.margin,
      y: this.footerH + 36,
      size: 10,
      font: this.fontBold,
      color: this.p.goldDeep,
    });
    this.page!.drawText(pdfSafe(`${args.partnerName} · ${args.preparedDate}`), {
      x: this.margin,
      y: this.footerH + 22,
      size: 9,
      font: this.font,
      color: this.p.muted,
    });
  }

  drawDarkClosingPage(args: { partnerName: string; preparedDate: string }) {
    const page = this.opts.pdf.addPage([this.pageW, this.pageH]);
    const { width, height } = page.getSize();
    const p = this.p;
    page.drawRectangle({ x: 0, y: 0, width, height, color: p.bgDeep });
    page.drawRectangle({ x: 0, y: height - 4, width, height: 4, color: p.gold });
    page.drawRectangle({ x: width * 0.4, y: height - 4, width: width * 0.25, height: 4, color: p.emerald });
    page.drawRectangle({
      x: this.margin,
      y: height * 0.38,
      width: width - this.margin * 2,
      height: height * 0.28,
      color: p.bgElevated,
      borderColor: p.gold,
      borderWidth: 1,
    });

    page.drawText('FINELY CRED', { x: this.margin, y: height - 48, size: 11, font: this.fontBold, color: p.gold });
    page.drawText('Your file. Your sequence. Your next move.', {
      x: this.margin,
      y: height - 72,
      size: 16,
      font: this.fontBold,
      color: p.textOnDark,
    });
    page.drawText('Thank you for trusting us with your credit strategy.', {
      x: this.margin + 18,
      y: height * 0.55,
      size: 12,
      font: this.fontBold,
      color: p.gold,
    });
    page.drawText('Execute Round 1 in the portal. Re-upload after bureau responses. Re-analyze. Repeat.', {
      x: this.margin + 18,
      y: height * 0.5,
      size: 9.5,
      font: this.font,
      color: p.textDimOnDark,
    });
    page.drawText(pdfSafe(`${args.partnerName} · ${args.preparedDate}`), {
      x: this.margin,
      y: 88,
      size: 10,
      font: this.font,
      color: p.textDimOnDark,
    });
    page.drawText('Results vary · not legal advice · funding subject to underwriting · no outcome guarantees.', {
      x: this.margin,
      y: 68,
      size: 8,
      font: this.font,
      color: p.textDimOnDark,
    });
  }

  drawFooters() {
    const total = this.opts.pdf.getPageCount();
    for (let i = 0; i < total; i++) {
      const page = this.opts.pdf.getPage(i);
      const { width } = page.getSize();
      const dark = i === total - 1;
      page.drawRectangle({ x: 0, y: 0, width, height: this.footerH, color: dark ? this.p.bgDeep : this.p.creamDark });
      page.drawRectangle({ x: 0, y: this.footerH - 1, width, height: 1, color: dark ? this.p.gold : this.p.border });
      page.drawText(pdfSafe(this.footerLabel), { x: this.margin, y: 14, size: 7, font: this.font, color: dark ? this.p.textDimOnDark : this.p.muted });
      page.drawText(`Page ${i + 1} of ${total}`, {
        x: width - this.margin - 54,
        y: 14,
        size: 8,
        font: this.fontBold,
        color: dark ? this.p.gold : this.p.soft,
      });
    }
  }
}
