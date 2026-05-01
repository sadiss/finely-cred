import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { CreditReportProvider, PdfTextMeta } from '../../domain/creditReports';

/** Shown when a PDF report is selected but not parsed (no tradelines). Avoids a full-screen wall of raw text. */
export function PdfReportFallbackView({
  pdfText,
  pdfMeta,
  provider,
  reportDate,
  filename,
  variant = 'partner',
}: {
  pdfText?: string;
  pdfMeta?: PdfTextMeta;
  provider?: CreditReportProvider;
  reportDate?: string;
  filename: string;
  variant?: 'partner' | 'admin';
}) {
  const [showRawText, setShowRawText] = useState(false);
  const hasText = Boolean((pdfText || '').trim());
  const looksScanned = !hasText || (pdfMeta?.nonEmptyPages ?? 0) === 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-white/70">
      <div className="inline-flex items-center gap-2 text-amber-400 mb-4">
        <FileText size={18} />
        <span className="text-sm font-semibold">PDF report</span>
      </div>
      <p className="text-white/90 font-semibold">{filename}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {provider && provider !== 'unknown' && (
          <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 uppercase tracking-widest font-bold">
            Provider: <span className="text-white/90">{provider}</span>
          </span>
        )}
        {reportDate && (
          <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 uppercase tracking-widest font-bold">
            Report date: <span className="text-white/90">{reportDate}</span>
          </span>
        )}
        {typeof pdfMeta?.numPages === 'number' && (
          <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 uppercase tracking-widest font-bold">
            Pages: <span className="text-white/90">{pdfMeta.numPages}</span>
          </span>
        )}
        {typeof pdfMeta?.extractedChars === 'number' && pdfMeta.extractedChars > 0 && (
          <span className="text-[10px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/70 uppercase tracking-widest font-bold">
            Extracted text: <span className="text-white/90">{pdfMeta.extractedChars.toLocaleString()}</span> chars
          </span>
        )}
      </div>
      <p className="mt-2 text-white/60 text-sm">
        {variant === 'admin'
          ? 'PDFs can be parsed, but older uploads may still be missing parsed data. Use Re-parse to run text extraction + OCR fallback.'
          : 'This file is a PDF. If it doesn’t show tradelines/scores, use Re-parse (it will extract text and run OCR if needed).'}
      </p>
      {looksScanned && (
        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="inline-flex items-center gap-2 text-amber-200/90 text-sm font-semibold">
            <AlertTriangle size={16} />
            This PDF looks image-only (scanned)
          </div>
          <p className="mt-2 text-amber-100/70 text-sm">
            We couldn’t find enough selectable text. Re-parse will try OCR. If OCR still struggles, an HTML export usually yields the cleanest tables.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowRawText((v) => !v)}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70"
      >
        {showRawText ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {showRawText ? 'Hide' : 'View'} extracted text {hasText ? `(${(pdfText || '').length.toLocaleString()} chars)` : ''}
      </button>
      {showRawText && hasText && (
        <pre className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/60 whitespace-pre-wrap max-h-[320px] overflow-auto">
          {(pdfText || '').slice(0, 8000) || '[No text]'}
        </pre>
      )}
    </div>
  );
}
