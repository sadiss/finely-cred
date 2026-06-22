import React, { useState } from 'react';
import { BarChart3, Download, ExternalLink, Sparkles } from 'lucide-react';
import type { CreditAnalysisReportRecord } from '../../domain/creditAnalysisReports';
import {
  downloadCreditAnalysisPdf,
  openCreditAnalysisPdf,
} from '../../lib/creditAnalysisDocumentActions';
import { formatCreditAnalysisCardSubtitle } from '../../lib/creditAnalysisReportNaming';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

export function CreditAnalysisDeliverableCard({
  item,
  compact = false,
}: {
  item: CreditAnalysisReportRecord;
  compact?: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<'open' | 'download' | null>(null);

  const subtitle = formatCreditAnalysisCardSubtitle({
    pages: item.pages,
    createdAt: item.createdAt,
    sourceReportFilename: item.sourceReportFilename,
  });

  const run = async (mode: 'open' | 'download') => {
    setErr(null);
    setBusy(mode);
    try {
      const fn = mode === 'open' ? openCreditAnalysisPdf : downloadCreditAnalysisPdf;
      const res = await fn({ blobRef: item.blobRef, filename: item.filename });
      if (!res.ok) setErr(res.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/12 via-fuchsia-500/8 to-amber-500/10 ${
        compact ? 'px-3 py-3 max-w-[280px]' : 'px-4 py-4 max-w-[320px]'
      } shrink-0 snap-start shadow-[0_10px_28px_-16px_rgba(139,92,246,0.55)] ring-1 ring-inset ring-violet-400/20`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200/90">
            <Sparkles size={10} /> Strategy report
          </div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} text-sm leading-snug line-clamp-2`}>{item.title}</div>
          {subtitle ? (
            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case text-[10px] opacity-80 line-clamp-1`}>{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('open')}
          className={`${FINELY_OS_PRIMARY_BTN} !py-1.5 !px-3 !text-[10px]`}
        >
          <ExternalLink size={12} /> {busy === 'open' ? 'Opening…' : 'Open'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('download')}
          className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px]`}
        >
          <Download size={12} /> {busy === 'download' ? 'Saving…' : 'Download'}
        </button>
      </div>

      {err ? <div className="mt-2 text-[11px] text-rose-200/90">{err}</div> : null}
    </div>
  );
}

export function CreditAnalysisDeliverableStrip({
  items,
  emptyHint,
}: {
  items: CreditAnalysisReportRecord[];
  emptyHint?: string;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/55">
        {emptyHint ?? 'No strategy reports yet — generate one from the Analysis tab after uploading a credit report.'}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
      {items.map((item) => (
        <CreditAnalysisDeliverableCard key={item.id} item={item} compact />
      ))}
    </div>
  );
}
