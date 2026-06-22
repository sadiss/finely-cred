import type { CreditReportFileType, CreditReportRecord, CreditReportProvider, ParsedCreditReport } from '../domain/creditReports';
import { parseCreditReportHtmlEnhanced } from '../creditReports/parseHtmlReport';
import { parseCreditReportPdf } from '../creditReports/parsePdfReport';
import { detectProviderFromHtml, detectProviderFromText } from '../creditReports/detectProvider';
import { detectReportDateFromText } from '../creditReports/parsePdfText';
import { htmlToPdfTextFallback } from '../creditReports/htmlToPdfFallback';
import { getBlobStore } from '../storage/getBlobStore';
import {
  getCachedParsedReport,
  hashReportContent,
  setCachedParsedReport,
} from './reportParseCache';

export type ReportParseProgress = (status: string) => void;

export type ParsedReportBundle = {
  parsed: ParsedCreditReport | undefined;
  provider: CreditReportProvider;
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
    try {
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
    } catch (fallbackErr) {
      console.warn('[parseHtmlReportWithCache] PDF fallback failed', fallbackErr);
      args.onProgress?.('HTML parse incomplete — saved file; try Re-parse or a different export format.');
    }
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

  let res: Awaited<ReturnType<typeof parseCreditReportPdf>>;
  try {
    res = await parseCreditReportPdf(args.file, {
      onProgress: (p) => {
        const page = typeof p.page === 'number' ? p.page : null;
        const pages = typeof p.numPages === 'number' ? p.numPages : null;
        args.onProgress?.(page && pages ? `${p.status} (page ${page}/${pages})` : p.status);
      },
    });
  } catch (err) {
    console.warn('[parsePdfReportWithCache] parse failed', err);
    res = {
      parsed: undefined,
      provider: 'unknown',
      reportDate: undefined,
      pdfText: '',
      pdfMeta: { extractedChars: 0 },
      ocrUsed: false,
    };
  }

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

export function parseWarningForReport(parsed: ParsedCreditReport | undefined | null): string | null {
  const tlCount = parsed?.tradelines?.length ?? 0;
  const scoreCount = parsed?.scores?.length ?? 0;
  if (!parsed || tlCount === 0) {
    return 'Partial parse — no tradelines extracted yet. The file was saved; use Re-parse or upload an HTML export from IdentityIQ / MyScoreIQ.';
  }
  if (scoreCount === 0) {
    return 'Partial parse — tradelines found but bureau scores were not detected. You can still review accounts; re-parse if scores are missing.';
  }
  return null;
}

/** Re-run full parse pipeline (HTML enhanced + PDF fallback) from stored blob. */
export async function reparseStoredCreditReport(args: {
  record: CreditReportRecord;
  onProgress?: ReportParseProgress;
}): Promise<CreditReportRecord> {
  const store = getBlobStore();
  const blob = await store.get(args.record.rawBlobRef);
  if (!blob) {
    throw new Error('Stored report file not found. Re-upload the original HTML or PDF export using the uploader above.');
  }

  if (args.record.fileType === 'html') {
    const html = await blob.text();
    const bundle = await parseHtmlReportWithCache({
      reportId: args.record.id,
      html,
      onProgress: args.onProgress,
    });
    return {
      ...args.record,
      provider: (bundle.provider ?? detectProviderFromHtml(html) ?? args.record.provider) as CreditReportProvider,
      reportDate: bundle.reportDate ?? args.record.reportDate,
      parsed: bundle.parsed,
      pdfText: bundle.pdfText,
      pdfMeta: bundle.pdfMeta as CreditReportRecord['pdfMeta'],
    };
  }

  const file = new File([blob], args.record.filename || 'report.pdf', {
    type: blob.type || args.record.mimeType || 'application/pdf',
  });
  const bundle = await parsePdfReportWithCache({
    reportId: args.record.id,
    file,
    onProgress: args.onProgress,
  });
  return {
    ...args.record,
    provider: (bundle.provider ?? args.record.provider) as CreditReportProvider,
    reportDate: bundle.reportDate ?? args.record.reportDate,
    pdfText: bundle.pdfText,
    pdfMeta: bundle.pdfMeta as CreditReportRecord['pdfMeta'],
    parsed: bundle.parsed,
  };
}
