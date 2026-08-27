import type { CreditReportProvider, ParsedCreditReport, PdfTextMeta } from '../domain/creditReports';
import { detectProviderFromText } from './detectProvider';
import { detectReportDateFromText, extractPdfTextWithMeta, type PdfTextExtraction } from './parsePdfText';
import { parseCreditReportText } from './parseTextReport';

const PDF_SOURCE_PARSE_VERSION = 'pdf-source-v1';

function normalizeSourceText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function attachPdfSourceAnchors(
  parsed: ParsedCreditReport | undefined,
  sourcePages: PdfTextExtraction['sourcePages'],
): ParsedCreditReport | undefined {
  if (!parsed) return parsed;

  const tradelines = (parsed.tradelines ?? []).map((tradeline) => {
    const normalizedName = normalizeSourceText(tradeline.creditorName);
    const tokens = normalizedName.split(' ').filter((token) => token.length >= 3);
    let best:
      | {
          page: number;
          score: number;
          region: { x: number; y: number; width: number; height: number };
        }
      | undefined;

    for (const page of sourcePages) {
      for (const run of page.runs) {
        const normalizedRun = normalizeSourceText(run.text);
        if (!normalizedRun) continue;
        const tokenMatches = tokens.filter((token) => normalizedRun.includes(token)).length;
        const exact = Boolean(normalizedName && (normalizedRun.includes(normalizedName) || normalizedName.includes(normalizedRun)));
        const score = exact ? 100 + tokenMatches : tokenMatches;
        if (score < Math.min(2, Math.max(1, tokens.length))) continue;
        if (!best || score > best.score) {
          const y = Math.max(0, run.region.y - 0.025);
          best = {
            page: page.page,
            score,
            region: {
              x: 0.02,
              y,
              width: 0.96,
              height: Math.min(0.46, 1 - y),
            },
          };
        }
      }
    }

    if (!best) return tradeline;
    return {
      ...tradeline,
      sourceAnchor: {
        fileType: 'pdf' as const,
        page: best.page,
        region: best.region,
        parseVersion: PDF_SOURCE_PARSE_VERSION,
        confidence: best.score >= 100 ? ('exact' as const) : ('approximate' as const),
      },
    };
  });

  return {
    ...parsed,
    tradelines,
    sourceMap: {
      version: PDF_SOURCE_PARSE_VERSION,
      fileType: 'pdf',
      pdfPages: sourcePages.map((page) => ({
        page: page.page,
        width: page.width,
        height: page.height,
      })),
    },
  };
}

export type PdfParseResult = {
  provider: CreditReportProvider;
  reportDate?: string;
  pdfText: string;
  pdfMeta: PdfTextMeta;
  parsed?: ParsedCreditReport;
  ocrUsed?: boolean;
};

function shouldOcr(args: { pdfText: string; pdfMeta: PdfTextMeta; parsed?: ParsedCreditReport | null }) {
  const textLen = (args.pdfText || '').trim().length;
  const nonEmpty = args.pdfMeta?.nonEmptyPages ?? 0;
  const pages = args.pdfMeta?.numPages ?? 0;
  const parsedTradelines = args.parsed?.tradelines?.length ?? 0;
  const parsedScores = args.parsed?.scores?.length ?? 0;

  // If we extracted almost nothing, or parsing produced no useful structure, OCR is likely needed.
  if (textLen < 800) return true;
  if (pages > 0 && nonEmpty === 0) return true;
  if (parsedTradelines === 0 && parsedScores === 0) return true;
  return false;
}

async function ocrPdfToText(
  _file: File,
  _opts?: {
    onProgress?: (p: { page: number; numPages: number; status: string; progress01?: number }) => void;
    /** First page to OCR (1-indexed). Defaults 1. */
    startPage?: number;
    /** Max pages to OCR from startPage. Defaults all pages. */
    maxPages?: number;
    /** Specific pages to OCR (1-indexed). If provided, overrides startPage/maxPages. */
    pages?: number[];
  },
) {
  // Lazy-loaded to avoid bundling OCR for users who never upload PDFs.
  const { ocrPdfToText: impl } = await import('./pdfOcr');
  return await impl(_file, _opts);
}

export async function parseCreditReportPdf(file: File, opts?: { forceOcr?: boolean; onProgress?: (p: { status: string; page?: number; numPages?: number; progress01?: number }) => void }): Promise<PdfParseResult> {
  const res = await extractPdfTextWithMeta(file);
  const pdfText = res.text || '';
  const pdfMeta: PdfTextMeta = {
    numPages: res.numPages,
    nonEmptyPages: res.nonEmptyPages,
    extractedChars: pdfText.length,
    ocrUsed: false,
    pageDimensions: res.sourcePages.map((page) => ({
      page: page.page,
      width: page.width,
      height: page.height,
    })),
  };
  let provider: CreditReportProvider = pdfText ? detectProviderFromText(pdfText) : 'unknown';
  let reportDate = pdfText ? detectReportDateFromText(pdfText) : undefined;

  let parsed: ParsedCreditReport | undefined;
  try {
    parsed = pdfText ? parseCreditReportText(pdfText, provider) : undefined;
  } catch {
    parsed = undefined;
  }

  const wantOcr = Boolean(opts?.forceOcr) || shouldOcr({ pdfText, pdfMeta, parsed: parsed ?? null });
  if (!wantOcr) {
    parsed = attachPdfSourceAnchors(parsed, res.sourcePages);
    return { provider, reportDate, pdfText, pdfMeta, parsed };
  }

  // Smarter OCR: prioritize pages where extracted text is sparse, but allow scanning all pages if needed.
  const totalPages = pdfMeta.numPages ?? 0;
  const pagesByChars = (res.pages || []).slice().sort((a, b) => a.extractedChars - b.extractedChars);
  const sparsePages = pagesByChars.filter((p) => p.extractedChars < 80).map((p) => p.page);
  const mediumPages = pagesByChars.filter((p) => p.extractedChars >= 80 && p.extractedChars < 280).map((p) => p.page);
  const fallbackAll = Array.from({ length: totalPages }, (_, i) => i + 1);

  opts?.onProgress?.({ status: 'OCR: preparing…', progress01: 0 });
  let ocrMerged = '';
  const ocrPagesUsed = new Set<number>();
  const passes: number[][] = [];
  if (sparsePages.length) passes.push(sparsePages);
  if (mediumPages.length) passes.push(mediumPages);
  // Final pass: everything (if still needed). This is intentionally not capped; we early-exit once parsing is “good enough”.
  passes.push(fallbackAll);

  for (let passIdx = 0; passIdx < passes.length; passIdx++) {
    const pages = passes[passIdx]!;
    for (const p of pages) ocrPagesUsed.add(p);
    const ocrText = await ocrPdfToText(file, {
      pages,
      onProgress: (p) => opts?.onProgress?.({ status: `OCR: ${p.status}`, page: p.page, numPages: p.numPages, progress01: p.progress01 }),
    });
    if ((ocrText || '').trim()) {
      ocrMerged = `${ocrMerged}\n\n${ocrText}`.trim();
    }

    // Try parsing after each pass. If we have meaningful tradelines/history/scores, stop.
    try {
      const tryParsed = ocrMerged ? parseCreditReportText(ocrMerged, provider) : undefined;
      const tl = tryParsed?.tradelines?.length ?? 0;
      const sc = tryParsed?.scores?.length ?? 0;
      const withHist = (tryParsed?.tradelines ?? []).filter((t) => t.paymentHistory2y && (Object.keys(t.paymentHistory2y.byBureau || {}).length > 0)).length;
      if (tl >= 5 || (tl >= 2 && withHist >= 1) || (tl >= 2 && sc >= 3) || (sc >= 6 && tl >= 1)) {
        parsed = tryParsed;
        break;
      }
    } catch {
      // keep scanning
    }
  }

  // Merge OCR + extracted text (don’t throw away PDF-native text, which is often cleaner for addresses/dates).
  const mergedText = (() => {
    const a = (pdfText || '').trim();
    const b = (ocrMerged || '').trim();
    if (!a && !b) return '';
    if (!a) return b;
    if (!b) return a;
    // De-dupe lines while preserving rough order (pdfText first, OCR appended).
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (line: string) => {
      const s = (line || '').trim();
      if (!s) return;
      const k = s.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(k)) return;
      seen.add(k);
      out.push(s);
    };
    for (const l of a.split('\n')) push(l);
    out.push('');
    for (const l of b.split('\n')) push(l);
    return out.join('\n').trim();
  })();
  provider = mergedText ? detectProviderFromText(mergedText) : provider;
  reportDate = mergedText ? detectReportDateFromText(mergedText) : reportDate;
  if (!parsed) {
    try {
      parsed = mergedText ? parseCreditReportText(mergedText, provider) : parsed;
    } catch {
      // keep previous best-effort parsed
    }
  }
  if (parsed) {
    parsed = {
      ...parsed,
      debug: {
        ...(parsed.debug as any),
        pdf: {
          extractedChars: mergedText.length,
          ocrUsed: true,
          ocrPagesUsed: Array.from(ocrPagesUsed.values()).sort((a, b) => a - b),
        },
      } as any,
    };
  }
  parsed = attachPdfSourceAnchors(parsed, res.sourcePages);

  return {
    provider,
    reportDate,
    pdfText: mergedText,
    pdfMeta: { ...pdfMeta, extractedChars: mergedText.length, ocrUsed: true, ocrEngine: 'tesseract.js', ocrPagesUsed: Array.from(ocrPagesUsed.values()).sort((a, b) => a - b) },
    parsed,
    ocrUsed: true,
  };
}

