import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, Clock, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listOpenValidationClocks } from '../../lib/validationLetterEngine';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_NOTICE_SUCCESS,
  finelyOsGlassShell,
} from '../os/finelyOsLightUi';

export function AdminValidationClocksPanel() {
  const navigate = useNavigate();
  const clocks = useMemo(() => listOpenValidationClocks(), []);

  if (!clocks.length) {
    return (
      <div className={FINELY_OS_NOTICE_SUCCESS}>
        No open FDCPA validation or summons response clocks in scope.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${finelyOsGlassShell('panel', 'fuchsia')}`}>
      <div className="flex items-center gap-2">
        <Scale size={18} className="text-fuchsia-300" />
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>Validation & summons clocks</div>
          <p className={FINELY_OS_ENTITY_BODY}>
            {clocks.length} debt case{clocks.length === 1 ? '' : 's'} with active legal windows — validation-first doctrine.
          </p>
        </div>
      </div>
      <FinelyOsPaginatedStack
        items={clocks}
        pageSize={5}
        emptyMessage="No validation clocks."
        renderItem={(row, i) => {
          const urgent = row.timer.daysRemaining <= 0;
          const warn = row.timer.daysRemaining <= 7;
          return (
            <button
              key={`${row.debtCaseId}_${row.timer.kind}`}
              type="button"
              onClick={() => navigate(`/admin/partners/${encodeURIComponent(row.partnerId)}?tab=debt`)}
              className={`w-full text-left rounded-xl border p-3 hover:shadow-md transition-all ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{row.debtName}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                    {row.timer.label} · {row.debtType} · partner {row.partnerId.slice(0, 8)}…
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs font-semibold">
                  {urgent ? (
                    <AlertTriangle size={12} className="text-rose-300" />
                  ) : warn ? (
                    <Clock size={12} className="text-amber-300" />
                  ) : (
                    <Clock size={12} className="text-fuchsia-300" />
                  )}
                  <span className={urgent ? 'text-rose-300' : warn ? 'text-amber-200' : 'text-fuchsia-200'}>
                    {row.timer.daysRemaining <= 0
                      ? 'Overdue'
                      : `${row.timer.daysRemaining}d left`}
                  </span>
                  <ArrowRight size={12} className="text-white/40" />
                </div>
              </div>
            </button>
          );
        }}
      />
    </div>
  );
}
