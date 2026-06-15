import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SlaBreach } from '../../../domain/workSla';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_NOTICE_SUCCESS,
  finelyOsGlassShell,
} from '../../os/finelyOsLightUi';

export function SlaBreachesPanel({ breaches }: { breaches: SlaBreach[] }) {
  const navigate = useNavigate();
  if (!breaches.length) {
    return (
      <div className={FINELY_OS_NOTICE_SUCCESS}>
        No active SLA breaches in your scope.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${finelyOsGlassShell('panel', 'rose')}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-rose-300" />
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-rose-300`}>SLA breaches</div>
          <p className={FINELY_OS_ENTITY_BODY}>
            {breaches.length} task{breaches.length === 1 ? '' : 's'} past response or overdue grace windows.
          </p>
        </div>
      </div>
      <FinelyOsPaginatedStack
        items={breaches}
        pageSize={5}
        emptyMessage="No SLA breaches."
        renderItem={(b, i) => (
          <button
            key={`${b.taskId}_${b.kind}`}
            type="button"
            onClick={() => b.projectId && navigate(`/admin/projects/${b.projectId}?task=${b.taskId}`)}
            className={`w-full text-left rounded-xl border p-3 hover:shadow-md transition-all ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{b.taskTitle}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                  {b.kind === 'response' ? 'Awaiting first action' : 'Past due + grace'} • {b.profile.label}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-rose-300 text-xs font-semibold">
                +{b.hoursLate}h {b.projectId ? <ArrowRight size={12} className="text-white/40" /> : null}
              </div>
            </div>
          </button>
        )}
      />
    </div>
  );
}
