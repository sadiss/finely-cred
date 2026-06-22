import React from 'react';
import { FileText } from 'lucide-react';
import type { CreditReportRecord } from '../../domain/creditReports';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Compact horizontal report picker — not a tall sidebar list. */
export function ReportFileStrip({
  reports,
  selectedId,
  onSelect,
  label = 'Reports',
  accent = 'violet',
}: {
  reports: CreditReportRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label?: string;
  accent?: 'violet' | 'amber' | 'emerald';
}) {
  const activeId = selectedId ?? reports[0]?.id ?? null;

  if (!reports.length) {
    return (
      <div className={`${finelyOsCatalogCard(accent)} !p-4 w-full`}>
        <div className={FINELY_OS_ENTITY_BODY}>No reports uploaded yet.</div>
      </div>
    );
  }

  return (
    <div className={`${finelyOsCatalogCard(accent)} !p-4 md:!p-5 w-full max-w-full overflow-visible`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="inline-flex items-center gap-2">
          <FileText size={14} className="text-fuchsia-300/80 shrink-0" />
          <span className={FINELY_OS_ENTITY_SUBLABEL}>{label}</span>
        </div>
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{reports.length} file{reports.length === 1 ? '' : 's'}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
        {reports.map((r) => {
          const selected = r.id === activeId;
          const tl = r.parsed?.tradelines?.length ?? 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={`snap-start shrink-0 min-w-[min(100%,220px)] max-w-[280px] text-left rounded-2xl border px-4 py-3 transition-all ${
                selected
                  ? 'border-fuchsia-400/50 bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30 shadow-[0_8px_24px_-12px_rgba(217,70,239,0.45)]'
                  : 'border-white/[0.1] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
              title={r.filename}
            >
              <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{r.filename}</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case text-[10px]`}>
                {r.fileType} · {r.provider}
              </div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case text-[10px] opacity-80`}>{fmtWhen(r.receivedAt)}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.parsed ? (
                  <span className={finelyOsStatusChip('ok')}>{tl} tradelines</span>
                ) : (
                  <span className={finelyOsStatusChip('warn')}>Not parsed</span>
                )}
                {Array.isArray((r as any).identityCheck?.faults) && (r as any).identityCheck.faults.length ? (
                  <span className={finelyOsStatusChip('warn')}>Identity</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReportActionsBar({
  report,
  children,
}: {
  report: CreditReportRecord | null;
  children?: React.ReactNode;
}) {
  if (!report) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 w-full max-w-full">
      <div className="min-w-0">
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>Selected report</div>
        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{report.filename}</div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div> : null}
    </div>
  );
}
