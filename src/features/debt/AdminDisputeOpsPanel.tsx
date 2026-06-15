import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, FileWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listDisputeOpsAttentionRows } from '../../lib/disputeOpsSummary';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_NOTICE_SUCCESS,
  finelyOsGlassShell,
} from '../os/finelyOsLightUi';

export function AdminDisputeOpsPanel() {
  const navigate = useNavigate();
  const rows = useMemo(() => listDisputeOpsAttentionRows(), []);

  if (!rows.length) {
    return (
      <div className={FINELY_OS_NOTICE_SUCCESS}>
        Dispute rounds are on track — no stale drafts or overdue bureau windows.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${finelyOsGlassShell('panel', 'amber')}`}>
      <div className="flex items-center gap-2">
        <FileWarning size={18} className="text-amber-300" />
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300`}>Dispute follow-up queue</div>
          <p className={FINELY_OS_ENTITY_BODY}>
            {rows.length} open case{rows.length === 1 ? '' : 's'} need mail, bureau window, or escalation attention.
          </p>
        </div>
      </div>
      <FinelyOsPaginatedStack
        items={rows}
        pageSize={5}
        emptyMessage="No dispute follow-ups."
        renderItem={(row, i) => (
          <button
            key={row.caseId}
            type="button"
            onClick={() => navigate(`/admin/partners/${encodeURIComponent(row.partnerId)}?tab=disputes`)}
            className={`w-full text-left rounded-xl border p-3 hover:shadow-md transition-all ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{row.title}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                  {row.bureau} · {row.round} · {row.status.replace(/_/g, ' ')}
                </div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs opacity-80 mt-1`}>{row.hint}</div>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-xs font-semibold">
                {row.tone === 'blocking' ? (
                  <AlertTriangle size={12} className="text-rose-300" />
                ) : null}
                <span className={row.tone === 'blocking' ? 'text-rose-300' : row.tone === 'warning' ? 'text-amber-200' : 'text-white/70'}>
                  {row.daysInState}d
                </span>
                <ArrowRight size={12} className="text-white/40" />
              </div>
            </div>
          </button>
        )}
      />
    </div>
  );
}
