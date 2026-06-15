import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { CreditReportProvider, PdfTextMeta } from '../../domain/creditReports';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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
    <div className={`${FINELY_OS_GLASS_CATALOG} space-y-3`}>
      <div className="inline-flex items-center gap-2 text-fuchsia-400">
        <FileText size={18} />
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>PDF report</span>
      </div>
      <p className={FINELY_OS_ENTITY_VALUE}>{filename}</p>
      <div className="flex flex-wrap gap-2">
        {provider && provider !== 'unknown' && (
          <span className={finelyOsStatusChip('ok')}>
            Provider: <span className="font-mono normal-case">{provider}</span>
          </span>
        )}
        {reportDate && (
          <span className={finelyOsStatusChip('ok')}>
            Report date: <span className="font-mono normal-case">{reportDate}</span>
          </span>
        )}
        {typeof pdfMeta?.numPages === 'number' && (
          <span className={finelyOsStatusChip('ok')}>
            Pages: <span className="font-mono normal-case">{pdfMeta.numPages}</span>
          </span>
        )}
        {typeof pdfMeta?.extractedChars === 'number' && pdfMeta.extractedChars > 0 && (
          <span className={finelyOsStatusChip('ok')}>
            Extracted text: <span className="font-mono normal-case">{pdfMeta.extractedChars.toLocaleString()}</span> chars
          </span>
        )}
      </div>
      <p className={FINELY_OS_ENTITY_BODY}>
        {variant === 'admin'
          ? 'PDFs can be parsed, but older uploads may still be missing parsed data. Use Re-parse to run text extraction + OCR fallback.'
          : 'This file is a PDF. If it doesn’t show tradelines/scores, use Re-parse (it will extract text and run OCR if needed).'}
      </p>
      {looksScanned && (
        <div className={FINELY_OS_NOTICE_WARN}>
          <div className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            This PDF looks image-only (scanned)
          </div>
          <p className="mt-2">
            We couldn’t find enough selectable text. Re-parse will try OCR. If OCR still struggles, an HTML export usually yields the cleanest tables.
          </p>
        </div>
      )}
      <button type="button" onClick={() => setShowRawText((v) => !v)} className={FINELY_OS_SECONDARY_BTN}>
        {showRawText ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {showRawText ? 'Hide' : 'View'} extracted text {hasText ? `(${(pdfText || '').length.toLocaleString()} chars)` : ''}
      </button>
      {showRawText && hasText && (
        <pre className="p-4 rounded-xl border border-white/[0.08] bg-fc-input text-[11px] text-white/65 whitespace-pre-wrap max-h-[320px] overflow-auto font-mono">
          {(pdfText || '').slice(0, 8000) || '[No text]'}
        </pre>
      )}
    </div>
  );
}
