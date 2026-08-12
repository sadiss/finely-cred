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
export const PDF_IVORY = { r: 0.97, g: 0.97, b: 0.95 };
export const PDF_CALLOUT_BG = { r: 0.94, g: 0.96, b: 0.94 };

export type PdfRgb = { r: number; g: number; b: number };

/** Visual family packs — e-guides should not all look identical. */
export type GuidePdfThemeId =
  | 'blueprint-slate'
  | 'capital-gold'
  | 'evidence-rose'
  | 'academic-ivory'
  | 'emerald-precision'
  | 'premium-green-gold';

export type GuidePdfTheme = {
  id: GuidePdfThemeId;
  /** Short UI / footer label */
  name: string;
  /** Cover series line (right of brand) */
  seriesLabel: string;
  /** Strong cover promise under the title */
  promiseLine: string;
  primary: PdfRgb;
  primaryDim: PdfRgb;
  accent: PdfRgb;
  darkBg: PdfRgb;
  darkPanel: PdfRgb;
  pageBg: PdfRgb;
  body: PdfRgb;
  muted: PdfRgb;
  heading: PdfRgb;
  highlight: PdfRgb;
  footerBar: PdfRgb;
  footerText: PdfRgb;
  calloutBg: PdfRgb;
  /** Cover glows: decorative ambient rectangles */
  glows: Array<{ x: number; y: number; w: number; h: number; r: number; g: number; b: number; a: number }>;
  /** Side rail width on content pages */
  railW: number;
  /** Top rule stack height feel: 'bold' | 'thin' | 'dual' */
  chromeStyle: 'bold' | 'thin' | 'dual' | 'grid';
  warningAccent: PdfRgb;
  warningWash: PdfRgb;
};

const THEMES: Record<GuidePdfThemeId, GuidePdfTheme> = {
  'premium-green-gold': {
    id: 'premium-green-gold',
    name: 'Premium Green/Gold',
    seriesLabel: 'PARTNER EDUCATION SERIES',
    promiseLine: 'A clear framework you can run — not theory, not fluff.',
    primary: PDF_GREEN,
    primaryDim: PDF_GREEN_DIM,
    accent: PDF_GOLD,
    darkBg: PDF_DARK_BG,
    darkPanel: PDF_DARK_PANEL,
    pageBg: PDF_IVORY,
    body: PDF_BODY,
    muted: PDF_MUTED,
    heading: PDF_SLATE,
    highlight: PDF_GREEN,
    footerBar: { r: 0.08, g: 0.1, b: 0.09 },
    footerText: { r: 0.75, g: 0.78, b: 0.76 },
    calloutBg: PDF_CALLOUT_BG,
    glows: [
      { x: -40, y: PDF_PAGE_H - 320, w: 360, h: 320, r: 0.22, g: 1, b: 0.08, a: 0.14 },
      { x: PDF_PAGE_W - 280, y: PDF_PAGE_H - 420, w: 320, h: 280, r: 0.85, g: 0.65, b: 0.13, a: 0.06 },
      { x: 40, y: 80, w: 280, h: 220, r: 0.06, g: 0.72, b: 0.35, a: 0.08 },
    ],
    railW: 8,
    chromeStyle: 'dual',
    warningAccent: PDF_GOLD,
    warningWash: { r: 0.98, g: 0.95, b: 0.88 },
  },
  'blueprint-slate': {
    id: 'blueprint-slate',
    name: 'Blueprint Slate',
    seriesLabel: 'BUREAU SYSTEMS BLUEPRINT',
    promiseLine: 'Decode the rails — Metro2, e-OSCAR, and bureau logic that actually moves files.',
    primary: { r: 0.35, g: 0.55, b: 0.72 },
    primaryDim: { r: 0.22, g: 0.38, b: 0.52 },
    accent: { r: 0.55, g: 0.78, b: 0.92 },
    darkBg: { r: 0.06, g: 0.09, b: 0.14 },
    darkPanel: { r: 0.1, g: 0.14, b: 0.2 },
    pageBg: { r: 0.96, g: 0.97, b: 0.98 },
    body: { r: 0.18, g: 0.22, b: 0.28 },
    muted: { r: 0.42, g: 0.48, b: 0.55 },
    heading: { r: 0.12, g: 0.18, b: 0.28 },
    highlight: { r: 0.35, g: 0.55, b: 0.72 },
    footerBar: { r: 0.08, g: 0.11, b: 0.16 },
    footerText: { r: 0.7, g: 0.76, b: 0.82 },
    calloutBg: { r: 0.92, g: 0.95, b: 0.97 },
    glows: [
      { x: -60, y: PDF_PAGE_H - 340, w: 380, h: 340, r: 0.35, g: 0.55, b: 0.72, a: 0.16 },
      { x: PDF_PAGE_W - 260, y: PDF_PAGE_H - 400, w: 300, h: 260, r: 0.55, g: 0.78, b: 0.92, a: 0.08 },
      { x: 60, y: 60, w: 240, h: 180, r: 0.22, g: 0.38, b: 0.52, a: 0.1 },
    ],
    railW: 10,
    chromeStyle: 'grid',
    warningAccent: { r: 0.85, g: 0.62, b: 0.2 },
    warningWash: { r: 0.97, g: 0.94, b: 0.88 },
  },
  'capital-gold': {
    id: 'capital-gold',
    name: 'Capital Gold',
    seriesLabel: 'CAPITAL & FUNDING SERIES',
    promiseLine: 'Sequence vendors, optics, and capital so underwriting sees a fundable file.',
    primary: { r: 0.78, g: 0.58, b: 0.18 },
    primaryDim: { r: 0.58, g: 0.42, b: 0.12 },
    accent: { r: 0.94, g: 0.82, b: 0.42 },
    darkBg: { r: 0.07, g: 0.06, b: 0.04 },
    darkPanel: { r: 0.12, g: 0.1, b: 0.07 },
    pageBg: { r: 0.98, g: 0.97, b: 0.94 },
    body: { r: 0.24, g: 0.2, b: 0.14 },
    muted: { r: 0.5, g: 0.45, b: 0.38 },
    heading: { r: 0.18, g: 0.14, b: 0.08 },
    highlight: { r: 0.78, g: 0.58, b: 0.18 },
    footerBar: { r: 0.1, g: 0.08, b: 0.05 },
    footerText: { r: 0.8, g: 0.74, b: 0.58 },
    calloutBg: { r: 0.97, g: 0.94, b: 0.88 },
    glows: [
      { x: -40, y: PDF_PAGE_H - 300, w: 340, h: 300, r: 0.85, g: 0.65, b: 0.13, a: 0.14 },
      { x: PDF_PAGE_W - 300, y: PDF_PAGE_H - 440, w: 340, h: 300, r: 0.94, g: 0.82, b: 0.42, a: 0.08 },
      { x: 80, y: 50, w: 260, h: 200, r: 0.58, g: 0.42, b: 0.12, a: 0.1 },
    ],
    railW: 8,
    chromeStyle: 'bold',
    warningAccent: { r: 0.72, g: 0.35, b: 0.12 },
    warningWash: { r: 0.98, g: 0.93, b: 0.88 },
  },
  'evidence-rose': {
    id: 'evidence-rose',
    name: 'Structured Ivory + Rose',
    seriesLabel: 'EVIDENCE & VALIDATION SERIES',
    promiseLine: 'Build a paper trail creditors and courts cannot shrug off.',
    primary: { r: 0.55, g: 0.22, b: 0.28 },
    primaryDim: { r: 0.42, g: 0.16, b: 0.22 },
    accent: { r: 0.78, g: 0.38, b: 0.42 },
    darkBg: { r: 0.1, g: 0.07, b: 0.08 },
    darkPanel: { r: 0.14, g: 0.1, b: 0.11 },
    pageBg: { r: 0.985, g: 0.975, b: 0.96 },
    body: { r: 0.22, g: 0.18, b: 0.18 },
    muted: { r: 0.5, g: 0.44, b: 0.44 },
    heading: { r: 0.2, g: 0.12, b: 0.14 },
    highlight: { r: 0.55, g: 0.22, b: 0.28 },
    footerBar: { r: 0.12, g: 0.08, b: 0.09 },
    footerText: { r: 0.82, g: 0.72, b: 0.74 },
    calloutBg: { r: 0.97, g: 0.94, b: 0.94 },
    glows: [
      { x: -50, y: PDF_PAGE_H - 310, w: 360, h: 300, r: 0.55, g: 0.22, b: 0.28, a: 0.12 },
      { x: PDF_PAGE_W - 280, y: PDF_PAGE_H - 400, w: 300, h: 260, r: 0.9, g: 0.85, b: 0.8, a: 0.08 },
      { x: 40, y: 70, w: 260, h: 200, r: 0.78, g: 0.38, b: 0.42, a: 0.07 },
    ],
    railW: 6,
    chromeStyle: 'thin',
    warningAccent: { r: 0.72, g: 0.2, b: 0.28 },
    warningWash: { r: 0.98, g: 0.92, b: 0.92 },
  },
  'academic-ivory': {
    id: 'academic-ivory',
    name: 'Academic Ivory',
    seriesLabel: 'LEGAL EDUCATION SERIES',
    promiseLine: 'Precision doctrine — stay informed, stay lawful, stay safe.',
    primary: { r: 0.28, g: 0.26, b: 0.24 },
    primaryDim: { r: 0.38, g: 0.34, b: 0.3 },
    accent: { r: 0.55, g: 0.42, b: 0.28 },
    darkBg: { r: 0.12, g: 0.11, b: 0.1 },
    darkPanel: { r: 0.16, g: 0.14, b: 0.12 },
    pageBg: { r: 0.99, g: 0.985, b: 0.97 },
    body: { r: 0.2, g: 0.18, b: 0.16 },
    muted: { r: 0.48, g: 0.45, b: 0.42 },
    heading: { r: 0.14, g: 0.12, b: 0.1 },
    highlight: { r: 0.38, g: 0.34, b: 0.3 },
    footerBar: { r: 0.14, g: 0.12, b: 0.1 },
    footerText: { r: 0.72, g: 0.68, b: 0.62 },
    calloutBg: { r: 0.96, g: 0.95, b: 0.92 },
    glows: [
      { x: -30, y: PDF_PAGE_H - 280, w: 300, h: 260, r: 0.55, g: 0.42, b: 0.28, a: 0.08 },
      { x: PDF_PAGE_W - 240, y: PDF_PAGE_H - 360, w: 260, h: 220, r: 0.9, g: 0.88, b: 0.82, a: 0.06 },
      { x: 100, y: 90, w: 220, h: 160, r: 0.28, g: 0.26, b: 0.24, a: 0.06 },
    ],
    railW: 3,
    chromeStyle: 'thin',
    warningAccent: { r: 0.55, g: 0.32, b: 0.18 },
    warningWash: { r: 0.97, g: 0.94, b: 0.9 },
  },
  'emerald-precision': {
    id: 'emerald-precision',
    name: 'Emerald Precision',
    seriesLabel: 'SCORE ARCHITECTURE SERIES',
    promiseLine: 'Control utilization, tradelines, and inquiries with surgical rules.',
    primary: { r: 0.08, g: 0.62, b: 0.42 },
    primaryDim: { r: 0.05, g: 0.48, b: 0.34 },
    accent: { r: 0.2, g: 0.85, b: 0.55 },
    darkBg: { r: 0.04, g: 0.09, b: 0.07 },
    darkPanel: { r: 0.07, g: 0.13, b: 0.1 },
    pageBg: { r: 0.965, g: 0.98, b: 0.97 },
    body: { r: 0.16, g: 0.22, b: 0.2 },
    muted: { r: 0.4, g: 0.48, b: 0.45 },
    heading: { r: 0.08, g: 0.2, b: 0.16 },
    highlight: { r: 0.08, g: 0.62, b: 0.42 },
    footerBar: { r: 0.05, g: 0.1, b: 0.08 },
    footerText: { r: 0.65, g: 0.8, b: 0.72 },
    calloutBg: { r: 0.9, g: 0.96, b: 0.93 },
    glows: [
      { x: -40, y: PDF_PAGE_H - 320, w: 350, h: 320, r: 0.08, g: 0.62, b: 0.42, a: 0.14 },
      { x: PDF_PAGE_W - 270, y: PDF_PAGE_H - 400, w: 300, h: 260, r: 0.2, g: 0.85, b: 0.55, a: 0.07 },
      { x: 50, y: 70, w: 250, h: 190, r: 0.05, g: 0.48, b: 0.34, a: 0.09 },
    ],
    railW: 7,
    chromeStyle: 'dual',
    warningAccent: { r: 0.75, g: 0.55, b: 0.12 },
    warningWash: { r: 0.97, g: 0.95, b: 0.88 },
  },
};

/** Explicit id → theme (authoritative). Title keywords fill gaps for unknown ids. */
export const GUIDE_PDF_THEME_BY_ID: Record<string, GuidePdfThemeId> = {
  // Blueprint slate — Metro2 / bureau / e-OSCAR / DOFD
  'metro2-consistency-trap': 'blueprint-slate',
  'metro2-k-segment-field-guide': 'blueprint-slate',
  'bureau-response-decoder': 'blueprint-slate',
  'eoscar-acdv-decoder': 'blueprint-slate',
  'dofd-reaging-audit': 'blueprint-slate',
  'student-loan-metro2-playbook': 'blueprint-slate',

  // Capital gold — business / funding / vendor / loan
  'business-credit-jumpstart': 'capital-gold',
  'business-sequence-ladder': 'capital-gold',
  'loan-funding-sequence': 'capital-gold',
  'vendor-tier-matrix-free': 'capital-gold',
  'funding-ready-underwriting-optics': 'capital-gold',
  'smart-application-timing': 'capital-gold',
  'fraud-alert-funding-timing': 'capital-gold',

  // Evidence rose — collections / evidence / certified mail / validation
  'collections-proof-pack': 'evidence-rose',
  'collections-validation-deep-dive': 'evidence-rose',
  'certified-mail-evidence-system': 'evidence-rose',
  'round-2-method-verification': 'evidence-rose',
  'debt-settlement-tax-traps': 'evidence-rose',
  'identity-theft-block-unblock': 'evidence-rose',

  // Academic ivory — legal primers
  'ucc-article-3-primer': 'academic-ivory',
  'ucc1-business-filing-primer': 'academic-ivory',
  'strawman-myths-reality': 'academic-ivory',

  // Emerald precision — tradeline / utilization / inquiry
  'primary-tradeline-insider': 'emerald-precision',
  'combo-tradeline-ladder': 'emerald-precision',
  'utilization-sniper-rules': 'emerald-precision',
  'inquiry-removal-advanced': 'emerald-precision',

  // Default premium (and dispute letter stays on its own PDF path)
  'credit-dispute-letter-guide': 'premium-green-gold',
  'ai-dispute-workflows': 'premium-green-gold',
  'permissible-purpose-scriptbook': 'premium-green-gold',
  'bankruptcy-rebuild-sequencer': 'premium-green-gold',
  'mortgage-overlay-dispute-prep': 'premium-green-gold',
};

function themeFromKeywords(hay: string): GuidePdfThemeId | null {
  // Legal primers first (UCC / strawman beat "business" in ucc1-business-…)
  if (/\bucc\b|strawman|negotiable|article\s*3/.test(hay)) return 'academic-ivory';
  // Blueprint rails
  if (/metro\s*2|metro2|bureau|e-?oscar|eoscar|acdv|dofd|re-?aging|k-segment/.test(hay)) {
    return 'blueprint-slate';
  }
  // Evidence / collections
  if (
    /collection|evidence|certified\s*mail|validation|proof\s*pack|method.?of.?verification|identity\s*theft|debt\s*settlement/.test(
      hay,
    )
  ) {
    return 'evidence-rose';
  }
  // Score architecture
  if (/tradeline|utilization|inquiry/.test(hay)) return 'emerald-precision';
  // Capital
  if (/business|funding|vendor|loan|underwriting|jumpstart|capital/.test(hay)) return 'capital-gold';
  return null;
}

export function resolveGuidePdfThemeId(guideId?: string, title?: string): GuidePdfThemeId {
  const id = (guideId || '').trim().toLowerCase();
  if (id && GUIDE_PDF_THEME_BY_ID[id]) return GUIDE_PDF_THEME_BY_ID[id];
  const fromKw = themeFromKeywords(`${id} ${(title || '').toLowerCase()}`);
  return fromKw ?? 'premium-green-gold';
}

export function getGuidePdfTheme(themeId?: GuidePdfThemeId | null): GuidePdfTheme {
  return THEMES[themeId || 'premium-green-gold'] ?? THEMES['premium-green-gold'];
}

export function resolveGuidePdfTheme(guideId?: string, title?: string): GuidePdfTheme {
  return getGuidePdfTheme(resolveGuidePdfThemeId(guideId, title));
}

export function normalizeEguidePunctuation(s: string): string {
  return String(s ?? '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([.!?])([A-Za-z])/g, '$1 $2')
    .trim();
}

export function pdfSafeText(s: string) {
  return normalizeEguidePunctuation(
    String(s ?? '')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/•/g, '-')
      .replace(/→/g, '->')
      .replace(/←/g, '<-')
      .replace(/…/g, '...')
      .replace(/©/g, '(c)')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ''),
  );
}

export function wrapPdfText(
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  text: string,
  maxWidth: number,
): string[] {
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
  /** Cover promise line override. */
  coverPromise?: string;
};

type PdfFonts = { regular: unknown; bold: unknown };
type RgbFn = (r: number, g: number, b: number) => unknown;

type PdfPage = {
  drawRectangle: (o: object) => void;
  drawText: (t: string, o: object) => void;
};

type CalloutKind = 'tip' | 'warning' | 'key' | 'compliance' | null;

function detectCallout(bullet: string): { kind: CalloutKind; label: string; body: string } {
  const m = bullet.match(/^(TIP|WARNING|KEY|COMPLIANCE)\s*:\s*(.*)$/i);
  if (!m) return { kind: null, label: '', body: bullet };
  const raw = m[1].toUpperCase();
  const kind =
    raw === 'TIP' ? 'tip' : raw === 'WARNING' ? 'warning' : raw === 'KEY' ? 'key' : 'compliance';
  return { kind, label: raw, body: m[2] };
}

function calloutColors(kind: Exclude<CalloutKind, null>, theme: GuidePdfTheme) {
  if (kind === 'warning') {
    return {
      border: theme.warningAccent,
      wash: theme.warningWash,
      label: theme.warningAccent,
    };
  }
  if (kind === 'compliance') {
    return {
      border: theme.muted,
      wash: { r: 0.94, g: 0.94, b: 0.94 },
      label: theme.muted,
    };
  }
  if (kind === 'key') {
    return {
      border: theme.primaryDim,
      wash: theme.calloutBg,
      label: theme.primaryDim,
    };
  }
  return {
    border: theme.primary,
    wash: theme.calloutBg,
    label: theme.primaryDim,
  };
}

/** Ambient glow + dark panel — theme-aware; default matches classic premium green/gold. */
export function drawPremiumGlowBackground(
  page: PdfPage,
  rgb: RgbFn,
  theme: GuidePdfTheme = THEMES['premium-green-gold'],
) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_PAGE_W,
    height: PDF_PAGE_H,
    color: rgb(theme.darkBg.r, theme.darkBg.g, theme.darkBg.b),
  });
  for (const g of theme.glows) {
    page.drawRectangle({
      x: g.x,
      y: g.y,
      width: g.w,
      height: g.h,
      color: rgb(g.r, g.g, g.b),
      opacity: g.a,
    });
  }
  // Blueprint grid ticks
  if (theme.chromeStyle === 'grid') {
    for (let gx = 24; gx < PDF_PAGE_W; gx += 36) {
      page.drawRectangle({
        x: gx,
        y: 0,
        width: 0.6,
        height: PDF_PAGE_H,
        color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
        opacity: 0.04,
      });
    }
  }
  page.drawRectangle({
    x: 0,
    y: 0,
    width: theme.railW + 4,
    height: PDF_PAGE_H,
    color: rgb(theme.primaryDim.r, theme.primaryDim.g, theme.primaryDim.b),
  });
  const topH = theme.chromeStyle === 'thin' ? 6 : theme.chromeStyle === 'bold' ? 14 : 10;
  page.drawRectangle({
    x: 0,
    y: PDF_PAGE_H - topH,
    width: PDF_PAGE_W,
    height: topH,
    color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
  });
  if (theme.chromeStyle !== 'thin') {
    page.drawRectangle({
      x: 0,
      y: PDF_PAGE_H - topH - 3,
      width: PDF_PAGE_W,
      height: 3,
      color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
      opacity: 0.85,
    });
  }
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
    theme?: GuidePdfTheme;
  },
) {
  const theme = args.theme ?? THEMES['premium-green-gold'];
  drawPremiumGlowBackground(page, rgb, theme);

  const panelW = PDF_PAGE_W - PDF_MARGIN * 2;
  const panelH = 500;
  const panelY = PDF_PAGE_H - PDF_MARGIN - panelH - 36;

  page.drawRectangle({
    x: PDF_MARGIN,
    y: panelY,
    width: panelW,
    height: panelH,
    color: rgb(theme.darkPanel.r, theme.darkPanel.g, theme.darkPanel.b),
    borderColor: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
    borderWidth: theme.chromeStyle === 'thin' ? 0.8 : 1.4,
    opacity: 0.97,
  });

  // Accent band under top edge of panel
  page.drawRectangle({
    x: PDF_MARGIN + 1,
    y: panelY + panelH - 30,
    width: panelW - 2,
    height: 28,
    color: rgb(
      Math.min(1, theme.darkBg.r + 0.03),
      Math.min(1, theme.darkBg.g + 0.03),
      Math.min(1, theme.darkBg.b + 0.03),
    ),
  });
  page.drawRectangle({
    x: PDF_MARGIN + 1,
    y: panelY + panelH - 30,
    width: panelW - 2,
    height: theme.chromeStyle === 'thin' ? 1 : 2.5,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    opacity: 0.95,
  });

  let y = panelY + panelH - 50;
  page.drawText('FINELY CRED', {
    x: PDF_MARGIN + 24,
    y,
    size: 11,
    font: fonts.bold,
    color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
  });
  page.drawText(theme.seriesLabel, {
    x: PDF_MARGIN + 120,
    y,
    size: 7.5,
    font: fonts.regular,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
  });

  y -= 36;
  const titleLines = wrapPdfText(
    fonts.bold as { widthOfTextAtSize: (t: string, s: number) => number },
    22,
    args.title,
    panelW - 48,
  );
  for (const line of titleLines.slice(0, 3)) {
    page.drawText(line, {
      x: PDF_MARGIN + 24,
      y,
      size: 22,
      font: fonts.bold,
      color: rgb(1, 1, 1),
    });
    y -= 26;
  }

  // Strong promise line
  const promise = pdfSafeText(args.meta?.coverPromise || theme.promiseLine);
  y -= 6;
  page.drawRectangle({
    x: PDF_MARGIN + 24,
    y: y - 2,
    width: 4,
    height: 28,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
  });
  const promiseLines = wrapPdfText(
    fonts.bold as { widthOfTextAtSize: (t: string, s: number) => number },
    11,
    promise,
    panelW - 56,
  ).slice(0, 2);
  let py = y + 10;
  for (const line of promiseLines) {
    page.drawText(line, {
      x: PDF_MARGIN + 36,
      y: py,
      size: 11,
      font: fonts.bold,
      color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    });
    py -= 14;
  }
  y = py - 6;

  if (args.subtitle) {
    y -= 2;
    for (const line of wrapPdfText(
      fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number },
      10,
      args.subtitle,
      panelW - 48,
    ).slice(0, 4)) {
      page.drawText(line, {
        x: PDF_MARGIN + 24,
        y,
        size: 10,
        font: fonts.regular,
        color: rgb(0.78, 0.8, 0.78),
      });
      y -= 13;
    }
  }

  y -= 10;
  page.drawRectangle({
    x: PDF_MARGIN + 24,
    y: y + 8,
    width: theme.chromeStyle === 'thin' ? 48 : 80,
    height: theme.chromeStyle === 'thin' ? 1 : 2,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    opacity: 0.9,
  });
  y -= 6;

  const highlights = args.highlights ?? [
    'Step-by-step partner framework',
    'Checklists + realistic planning ranges',
    'Compliance-aware education',
  ];
  for (const h of highlights.slice(0, 5)) {
    page.drawRectangle({
      x: PDF_MARGIN + 24,
      y: y - 2,
      width: 5,
      height: 5,
      color: rgb(theme.highlight.r, theme.highlight.g, theme.highlight.b),
    });
    page.drawText(pdfSafeText(h), {
      x: PDF_MARGIN + 36,
      y,
      size: 10,
      font: fonts.regular,
      color: rgb(theme.highlight.r, theme.highlight.g, theme.highlight.b),
    });
    y -= 16;
  }

  if (args.meta?.fullName?.trim()) {
    y -= 6;
    page.drawRectangle({
      x: PDF_MARGIN + 20,
      y: y - 2,
      width: panelW - 40,
      height: 1,
      color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
      opacity: 0.28,
    });
    y -= 18;
    page.drawText(pdfSafeText(`Prepared for ${args.meta.fullName.trim()}`), {
      x: PDF_MARGIN + 24,
      y,
      size: 11,
      font: fonts.bold,
      color: rgb(1, 1, 1),
    });
  }

  const stripY = PDF_MARGIN + 8;
  page.drawRectangle({
    x: PDF_MARGIN,
    y: stripY,
    width: panelW,
    height: 42,
    color: rgb(0, 0, 0),
    opacity: 0.5,
    borderColor: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    borderWidth: 0.8,
  });
  page.drawText('Results vary  ·  not legal advice  ·  funding subject to underwriting', {
    x: PDF_MARGIN + 16,
    y: stripY + 24,
    size: 8,
    font: fonts.regular,
    color: rgb(0.78, 0.8, 0.78),
  });
  page.drawText(`Educational partner guide  ·  ${theme.name}  ·  finelycred.com`, {
    x: PDF_MARGIN + 16,
    y: stripY + 10,
    size: 8,
    font: fonts.bold,
    color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
  });
}

function drawContentChrome(
  page: PdfPage,
  rgb: RgbFn,
  theme: GuidePdfTheme,
  opts?: { dark?: boolean },
) {
  if (opts?.dark) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PDF_PAGE_W,
      height: PDF_PAGE_H,
      color: rgb(theme.pageBg.r, theme.pageBg.g, theme.pageBg.b),
    });
  }
  const topH = theme.chromeStyle === 'thin' ? 5 : theme.chromeStyle === 'bold' ? 12 : 9;
  page.drawRectangle({
    x: 0,
    y: PDF_PAGE_H - topH,
    width: PDF_PAGE_W,
    height: topH,
    color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
  });
  if (theme.chromeStyle === 'dual' || theme.chromeStyle === 'bold' || theme.chromeStyle === 'grid') {
    page.drawRectangle({
      x: 0,
      y: PDF_PAGE_H - topH - 2.5,
      width: PDF_PAGE_W,
      height: 2.5,
      color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
      opacity: 0.9,
    });
  }
  if (theme.chromeStyle === 'grid') {
    page.drawRectangle({
      x: PDF_PAGE_W - 4,
      y: 28,
      width: 4,
      height: PDF_PAGE_H - 28 - topH,
      color: rgb(theme.primaryDim.r, theme.primaryDim.g, theme.primaryDim.b),
      opacity: 0.35,
    });
  }
  page.drawRectangle({
    x: 0,
    y: 0,
    width: theme.railW,
    height: PDF_PAGE_H,
    color: rgb(theme.primaryDim.r, theme.primaryDim.g, theme.primaryDim.b),
  });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PDF_PAGE_W,
    height: 26,
    color: rgb(theme.footerBar.r, theme.footerBar.g, theme.footerBar.b),
  });
}

function drawRunningHeader(
  page: PdfPage,
  fonts: PdfFonts,
  rgb: RgbFn,
  guideTitle: string,
  theme: GuidePdfTheme,
) {
  page.drawText('FINELY CRED', {
    x: PDF_MARGIN + 8,
    y: PDF_PAGE_H - PDF_MARGIN + 8,
    size: 8,
    font: fonts.bold,
    color: rgb(theme.primaryDim.r, theme.primaryDim.g, theme.primaryDim.b),
  });
  const short = pdfSafeText(guideTitle).slice(0, 42);
  page.drawText(short, {
    x: PDF_PAGE_W - PDF_MARGIN - 200,
    y: PDF_PAGE_H - PDF_MARGIN + 8,
    size: 7.5,
    font: fonts.regular,
    color: rgb(theme.muted.r, theme.muted.g, theme.muted.b),
  });
}

function drawPageFooter(
  page: PdfPage,
  fonts: PdfFonts,
  rgb: RgbFn,
  pageNum: number,
  totalPages: number,
  meta?: PdfMeta,
  theme: GuidePdfTheme = THEMES['premium-green-gold'],
) {
  const year = new Date().getFullYear();
  page.drawText(pdfSafeText(`Page ${pageNum} of ${totalPages}`), {
    x: PDF_MARGIN + 8,
    y: 10,
    size: 7.5,
    font: fonts.regular,
    color: rgb(theme.footerText.r, theme.footerText.g, theme.footerText.b),
  });
  const mid = meta?.fullName?.trim()
    ? `Prepared for ${meta.fullName.trim()}`
    : `(c) ${year} Finely Cred · ${theme.seriesLabel}`;
  page.drawText(pdfSafeText(mid).slice(0, 62), {
    x: PDF_MARGIN + 100,
    y: 10,
    size: 6.5,
    font: fonts.regular,
    color: rgb(theme.footerText.r, theme.footerText.g, theme.footerText.b),
  });
  page.drawText('finelycred.com', {
    x: PDF_PAGE_W - PDF_MARGIN - 70,
    y: 10,
    size: 8,
    font: fonts.bold,
    color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
  });
}

function drawSectionHeaderBand(
  page: PdfPage,
  rgb: RgbFn,
  theme: GuidePdfTheme,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const barW = theme.chromeStyle === 'thin' ? 2.5 : theme.chromeStyle === 'grid' ? 5 : 4;
  page.drawRectangle({
    x,
    y,
    width: barW,
    height: h,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
  });
  page.drawRectangle({
    x: x + barW,
    y,
    width: w - barW,
    height: h,
    color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
    opacity: theme.chromeStyle === 'thin' ? 0.05 : 0.1,
  });
  if (theme.chromeStyle === 'grid') {
    page.drawRectangle({
      x: x + barW,
      y,
      width: w - barW,
      height: 1,
      color: rgb(theme.primaryDim.r, theme.primaryDim.g, theme.primaryDim.b),
      opacity: 0.35,
    });
  }
}

export function drawGuideContentPages(
  pdfDoc: { addPage: (size: [number, number]) => unknown },
  fonts: PdfFonts,
  rgb: RgbFn,
  pages: GeneratedGuidePage[],
  meta?: PdfMeta,
  theme: GuidePdfTheme = THEMES['premium-green-gold'],
) {
  const maxW = PDF_PAGE_W - PDF_MARGIN * 2 - 16;
  let pageNum = 0;
  const created: PdfPage[] = [];

  for (const pageContent of pages) {
    pageNum += 1;
    let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as PdfPage & {
      drawText: (t: string, o: object) => void;
    };
    created.push(page);
    let y = PDF_PAGE_H - PDF_MARGIN - 28;

    const drawTopBar = () => {
      drawContentChrome(page, rgb, theme, { dark: true });
      drawRunningHeader(page, fonts, rgb, pageContent.title, theme);
    };

    const newPage = () => {
      page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as typeof page;
      created.push(page);
      pageNum += 1;
      y = PDF_PAGE_H - PDF_MARGIN - 28;
      drawTopBar();
    };

    const draw = (
      text: string,
      opts?: { bold?: boolean; size?: number; color?: PdfRgb; indent?: number },
    ) => {
      const size = opts?.size ?? 10.5;
      const font = opts?.bold ? fonts.bold : fonts.regular;
      const color = opts?.color ?? theme.body;
      const indent = opts?.indent ?? 0;
      if (y < PDF_MARGIN + 52) newPage();
      page.drawText(pdfSafeText(text), {
        x: PDF_MARGIN + indent,
        y,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
      });
      y -= size + 5;
    };

    drawTopBar();
    draw('FINELY CRED', { bold: true, size: 8, color: theme.primaryDim });
    y -= 2;
    draw(pageContent.title, { bold: true, size: 16, color: theme.heading });
    if (pageContent.subtitle) {
      y -= 1;
      for (const line of wrapPdfText(
        fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number },
        10,
        pageContent.subtitle,
        maxW,
      )) {
        draw(line, { size: 10, color: theme.muted });
      }
    }
    y -= 8;

    for (const sec of pageContent.sections) {
      if (sec.heading) {
        y -= 3;
        if (y < PDF_MARGIN + 72) newPage();
        drawSectionHeaderBand(page, rgb, theme, PDF_MARGIN, y - 3, maxW + 12, 18);
        draw(sec.heading, { bold: true, size: 11, color: theme.primaryDim, indent: 10 });
      }
      for (const p of sec.paragraphs ?? []) {
        if (!p.trim()) {
          y -= 8;
          continue;
        }
        for (const line of wrapPdfText(
          fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number },
          10.5,
          p,
          maxW,
        )) {
          draw(line);
        }
        y -= 3;
      }
      if (sec.bullets) {
        for (const b of sec.bullets) {
          const { kind, label, body } = detectCallout(b);
          if (kind) {
            const colors = calloutColors(kind, theme);
            const wrapped = wrapPdfText(
              fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number },
              9.5,
              `${label}: ${body}`,
              maxW - 24,
            );
            const boxH = wrapped.length * 12 + 12;
            if (y < PDF_MARGIN + 52 + boxH) newPage();
            page.drawRectangle({
              x: PDF_MARGIN + 4,
              y: y - boxH + 11,
              width: maxW + 8,
              height: boxH,
              color: rgb(colors.wash.r, colors.wash.g, colors.wash.b),
              borderColor: rgb(colors.border.r, colors.border.g, colors.border.b),
              borderWidth: 0.9,
            });
            page.drawRectangle({
              x: PDF_MARGIN + 4,
              y: y - boxH + 11,
              width: 3.5,
              height: boxH,
              color: rgb(colors.border.r, colors.border.g, colors.border.b),
            });
            for (const line of wrapped) {
              draw(line, { size: 9.5, color: theme.body, indent: 14 });
            }
            y -= 6;
          } else {
            const wrapped = wrapPdfText(
              fonts.regular as { widthOfTextAtSize: (t: string, s: number) => number },
              10,
              b,
              maxW - 12,
            );
            wrapped.forEach((line, i) => {
              draw(i === 0 ? `- ${line}` : `  ${line}`, { size: 10, indent: 4 });
            });
          }
        }
        y -= 3;
      }
    }
  }

  const total = created.length;
  created.forEach((p, idx) => {
    drawPageFooter(p, fonts, rgb, idx + 1, total, meta, theme);
  });
}

export async function buildFreeGuidePdf(guide: FreeGuide, meta?: PdfMeta): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const maxW = PDF_PAGE_W - PDF_MARGIN * 2;
  const contentPages: PdfPage[] = [];
  const theme = resolveGuidePdfTheme(guide.id, guide.title);

  const coverPage = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as PdfPage;
  drawPremiumCoverPage(coverPage, fonts, rgb, {
    title: meta?.coverTitle || guide.title,
    subtitle: meta?.subtitle || guide.desc,
    meta,
    highlights: meta?.coverHighlights ?? guide.sections.slice(0, 5).map((s) => s.heading),
    theme,
  });

  let page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as PdfPage & { drawText: (t: string, o: object) => void };
  contentPages.push(page);
  let y = PDF_PAGE_H - PDF_MARGIN - 18;

  const ensureChrome = () => {
    drawContentChrome(page, rgb, theme, { dark: true });
    drawRunningHeader(page, fonts, rgb, guide.title, theme);
  };

  const newPage = () => {
    page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as typeof page;
    contentPages.push(page);
    y = PDF_PAGE_H - PDF_MARGIN - 18;
    ensureChrome();
  };

  ensureChrome();

  const draw = (
    text: string,
    opts?: { bold?: boolean; size?: number; color?: PdfRgb; gap?: number; indent?: number },
  ) => {
    const size = opts?.size ?? 10.5;
    const font = opts?.bold ? bold : regular;
    const color = opts?.color ?? theme.body;
    const gap = opts?.gap ?? size + 5;
    const indent = opts?.indent ?? 0;
    if (y < PDF_MARGIN + 52) newPage();
    page.drawText(pdfSafeText(text), {
      x: PDF_MARGIN + 8 + indent,
      y,
      size,
      font,
      color: rgb(color.r, color.g, color.b),
    });
    y -= gap;
  };

  draw('FINELY CRED', { bold: true, size: 9, color: theme.primaryDim });
  draw(theme.seriesLabel, { size: 8, color: theme.accent, gap: 6 });
  draw('Table of Contents', { bold: true, size: 16, color: theme.heading, gap: 8 });
  page.drawRectangle({
    x: PDF_MARGIN + 8,
    y: y + 4,
    width: theme.chromeStyle === 'thin' ? 40 : 56,
    height: theme.chromeStyle === 'thin' ? 1 : 2,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
  });
  y -= 10;

  guide.sections.forEach((sec, i) => {
    if (y < PDF_MARGIN + 52) newPage();
    page.drawRectangle({
      x: PDF_MARGIN + 8,
      y: y - 1,
      width: maxW,
      height: 14,
      color: rgb(theme.primary.r, theme.primary.g, theme.primary.b),
      opacity: i % 2 === 0 ? 0.06 : 0.025,
    });
    draw(`${String(i + 1).padStart(2, '0')}  ${sec.heading}`, {
      size: 10,
      color: theme.body,
      gap: 15,
    });
  });

  y -= 4;
  draw('Results vary · not legal advice · funding subject to underwriting', {
    size: 7.5,
    color: theme.muted,
  });

  newPage();

  for (const sec of guide.sections) {
    if (y < PDF_MARGIN + 120) newPage();

    drawSectionHeaderBand(page, rgb, theme, PDF_MARGIN + 4, y - 5, maxW - 1, 22);
    draw(sec.heading, { bold: true, size: 12, color: theme.primaryDim, gap: 16, indent: 8 });
    y -= 1;

    for (const b of sec.bullets) {
      const safe = guardPdfBodyText(b);
      const { kind, label, body } = detectCallout(safe);
      if (kind) {
        const colors = calloutColors(kind, theme);
        const wrapped = wrapPdfText(regular, 9.5, `${label}: ${body}`, maxW - 28);
        const boxH = Math.max(26, wrapped.length * 12 + 14);
        if (y < PDF_MARGIN + 52 + boxH) newPage();
        page.drawRectangle({
          x: PDF_MARGIN + 8,
          y: y - boxH + 12,
          width: maxW,
          height: boxH,
          color: rgb(colors.wash.r, colors.wash.g, colors.wash.b),
          borderColor: rgb(colors.border.r, colors.border.g, colors.border.b),
          borderWidth: 0.9,
        });
        page.drawRectangle({
          x: PDF_MARGIN + 8,
          y: y - boxH + 12,
          width: 3.5,
          height: boxH,
          color: rgb(colors.border.r, colors.border.g, colors.border.b),
        });
        for (const line of wrapped) {
          draw(line, { size: 9.5, color: theme.body, indent: 12, gap: 12 });
        }
        y -= 8;
        continue;
      }

      const lines = wrapPdfText(regular, 10.5, safe, maxW - 16);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        draw(i === 0 ? `- ${line}` : `  ${line}`, { size: 10.5, color: theme.body, indent: 4 });
      }
      y -= 2;
    }
    y -= 10;
  }

  y -= 2;
  if (y < PDF_MARGIN + 72) newPage();
  page.drawRectangle({
    x: PDF_MARGIN + 8,
    y: y - 32,
    width: maxW,
    height: 42,
    color: rgb(theme.calloutBg.r, theme.calloutBg.g, theme.calloutBg.b),
    borderColor: rgb(theme.muted.r, theme.muted.g, theme.muted.b),
    borderWidth: 0.7,
  });
  draw(pdfDisclaimerFooter(), {
    size: 7.5,
    color: theme.muted,
    indent: 8,
  });

  const totalPages = 1 + contentPages.length; // cover + content
  contentPages.forEach((p, idx) => {
    drawPageFooter(p, fonts, rgb, idx + 2, totalPages, meta, theme);
  });
  drawPageFooter(coverPage, fonts, rgb, 1, totalPages, meta, theme);

  return pdfDoc.save();
}

export function guideSectionsToPages(guide: FreeGuide): GeneratedGuidePage[] {
  return guide.sections.map((sec) => ({
    id: sec.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: sec.heading,
    sections: [{ bullets: sec.bullets }],
  }));
}
