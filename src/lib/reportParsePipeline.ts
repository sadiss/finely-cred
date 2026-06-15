import type { CreditReportFileType, ParsedCreditReport } from '../domain/creditReports';
import { parseCreditReportHtmlEnhanced } from '../creditReports/parseHtmlReport';
import { parseCreditReportPdf } from '../creditReports/parsePdfReport';
import { detectProviderFromText } from '../creditReports/detectProvider';
import { detectReportDateFromText } from '../creditReports/parsePdfText';
import { htmlToPdfTextFallback } from '../creditReports/htmlToPdfFallback';
import {
  getCachedParsedReport,
  hashReportContent,
  setCachedParsedReport,
} from './reportParseCache';

export type ReportParseProgress = (status: string) => void;

export type ParsedReportBundle = {
  parsed: ParsedCreditReport | undefined;
  provider: string;
  reportDate?: string;
  pdfText?: string;
  pdfMeta?: Record<string, unknown>;
  fromCache?: boolean;
};

function cacheKeyForContent(args: {
  reportId: string;
  fileType: CreditReportFileType;
  content: string;
}): string {
  return hashReportContent(`${args.fileType}:${args.content.slice(0, 12000)}`);
}

export async function parseHtmlReportWithCache(args: {
  reportId: string;
  html: string;
  onProgress?: ReportParseProgress;
}): Promise<ParsedReportBundle> {
  const contentHash = cacheKeyForContent({ reportId: args.reportId, fileType: 'html', content: args.html });
  const cached = getCachedParsedReport({ reportId: args.reportId, contentHash });
  if (cached) {
    return {
      parsed: cached,
      provider: cached.provider ?? 'unknown',
      reportDate: cached.reportDate,
      fromCache: true,
    };
  }

  let parsed: ParsedCreditReport | undefined;
  try {
    parsed = await parseCreditReportHtmlEnhanced(args.html, {
      onProgress: (s) => args.onProgress?.(s),
    });
  } catch {
    parsed = undefined;
  }

  const tradelines = parsed?.tradelines?.length ?? 0;
  const scores = parsed?.scores?.length ?? 0;
  const shouldFallback = !parsed || (tradelines === 0 && scores < 3);

  if (shouldFallback) {
    args.onProgress?.('Fallback: converting HTML → PDF (text-first)…');
    const { blob } = await htmlToPdfTextFallback({ html: args.html, title: 'report' });
    const pdfFile = new File([blob], 'report_fallback.pdf', { type: 'application/pdf' });
    const res = await parseCreditReportPdf(pdfFile, {
      onProgress: (p) => {
        const page = typeof p.page === 'number' ? p.page : null;
        const pages = typeof p.numPages === 'number' ? p.numPages : null;
        args.onProgress?.(page && pages ? `${p.status} (page ${page}/${pages})` : p.status);
      },
    });
    if (res.parsed) {
      const fbHash = hashReportContent(`pdf-fallback:${res.pdfText?.slice(0, 12000) ?? ''}`);
      setCachedParsedReport({ reportId: args.reportId, contentHash: fbHash, parsed: res.parsed });
    }
    return {
      parsed: res.parsed,
      provider: res.provider ?? (res.pdfText ? detectProviderFromText(res.pdfText) : 'unknown'),
      reportDate: res.reportDate ?? (res.pdfText ? detectReportDateFromText(res.pdfText) : undefined),
      pdfText: res.pdfText,
      pdfMeta: { ...(res.pdfMeta as any), ocrUsed: Boolean(res.ocrUsed), ocrEngine: (res.pdfMeta as any)?.ocrEngine },
    };
  }

  if (parsed) {
    setCachedParsedReport({ reportId: args.reportId, contentHash, parsed });
  }
  return {
    parsed,
    provider: parsed?.provider ?? 'unknown',
    reportDate: parsed?.reportDate,
  };
}

export async function parsePdfReportWithCache(args: {
  reportId: string;
  file: File;
  onProgress?: ReportParseProgress;
}): Promise<ParsedReportBundle> {
  const preview = await args.file.slice(0, 64000).text().catch(() => '');
  const contentHash = cacheKeyForContent({ reportId: args.reportId, fileType: 'pdf', content: preview || args.file.name });
  const cached = getCachedParsedReport({ reportId: args.reportId, contentHash });
  if (cached) {
    return {
      parsed: cached,
      provider: cached.provider ?? 'unknown',
      reportDate: cached.reportDate,
      fromCache: true,
    };
  }

  const res = await parseCreditReportPdf(args.file, {
    onProgress: (p) => {
      const page = typeof p.page === 'number' ? p.page : null;
      const pages = typeof p.numPages === 'number' ? p.numPages : null;
      args.onProgress?.(page && pages ? `${p.status} (page ${page}/${pages})` : p.status);
    },
  });

  if (res.parsed) {
    const hash = hashReportContent(`pdf:${res.pdfText?.slice(0, 12000) ?? preview}`);
    setCachedParsedReport({ reportId: args.reportId, contentHash: hash, parsed: res.parsed });
  }

  return {
    parsed: res.parsed,
    provider: res.provider ?? (res.pdfText ? detectProviderFromText(res.pdfText) : 'unknown'),
    reportDate: res.reportDate ?? (res.pdfText ? detectReportDateFromText(res.pdfText) : undefined),
    pdfText: res.pdfText,
    pdfMeta: { ...(res.pdfMeta as any), ocrUsed: Boolean(res.ocrUsed), ocrEngine: (res.pdfMeta as any)?.ocrEngine },
  };
}
