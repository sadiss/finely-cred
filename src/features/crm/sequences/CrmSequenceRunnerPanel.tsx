import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RefreshCw, Workflow } from 'lucide-react';
import type { CrmSequence } from '../../../domain/crmSequences';
import { getCrmRecord } from '../../../data/crmRecordsRepo';
import {
  listCrmEnrollmentsBySequence,
  pauseCrmSequenceEnrollment,
} from '../../../data/crmSequencesRepo';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';
import {
  countActionSteps,
  dueCrmSequenceSteps,
  findNextActionStepIndex,
  getActionStepDueMs,
  runDueCrmSequenceSteps,
} from './runCrmSequenceEngine';

export function CrmSequenceRunnerPanel({ sequence }: { sequence: CrmSequence | null }) {
  const [version, setVersion] = useState(0);
  const [lastRun, setLastRun] = useState<string[]>([]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const enrollments = useMemo(
    () => (sequence ? listCrmEnrollmentsBySequence(sequence.id) : []),
    [sequence, version],
  );
  const dueAll = useMemo(() => dueCrmSequenceSteps(), [version]);
  const dueForSequence = useMemo(
    () => (sequence ? dueAll.filter((d) => d.sequence.id === sequence.id) : []),
    [dueAll, sequence],
  );

  const activeCount = enrollments.filter((e) => !e.completedAt && !e.pausedAt).length;

  if (!sequence) return null;

  return (
    <div className={`${FINELY_OS_CATALOG_SHELL} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Workflow size={16} className="text-violet-400" />
          <span className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>Sequence runner</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={finelyOsStatusChip('ok')}>{activeCount} active</span>
          <span className={finelyOsStatusChip('warn')}>{dueForSequence.length} due now</span>
          <button
            type="button"
            onClick={() => {
              const results = runDueCrmSequenceSteps({ maxPerRun: 50 });
              setLastRun(results.map((r) => r.message));
              setVersion((v) => v + 1);
            }}
            className={`${FINELY_OS_PRIMARY_BTN} !text-[10px] !py-1.5 !px-2.5`}
          >
            <Play size={12} /> Run due steps
          </button>
        </div>
      </div>

      {lastRun.length ? (
        <div className={`${FINELY_OS_NOTICE_SUCCESS} text-xs space-y-1`}>
          {lastRun.slice(0, 5).map((line) => (
            <div key={line}>{line}</div>
          ))}
          {lastRun.length > 5 ? <div className="text-emerald-300">+{lastRun.length - 5} more</div> : null}
        </div>
      ) : null}

      <FinelyOsPaginatedStack
        items={enrollments}
        pageSize={6}
        emptyMessage="No enrollments yet — enroll records from the CRM pipeline drawer."
        renderItem={(enrollment, i) => {
          const record = getCrmRecord(enrollment.recordId);
          const nextIdx = findNextActionStepIndex(sequence, enrollment.lastCompletedStepIndex);
          const dueMs = nextIdx >= 0 ? getActionStepDueMs(sequence, nextIdx, enrollment.enrolledAt) : null;
          const isDue = dueMs != null && Date.now() >= dueMs && !enrollment.completedAt && !enrollment.pausedAt;
          const status = enrollment.completedAt
            ? 'Completed'
            : enrollment.pausedAt
              ? 'Paused'
              : isDue
                ? 'Due now'
                : 'Active';
          return (
            <div
              key={enrollment.id}
              className={`rounded-xl border p-3 text-xs ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`truncate ${FINELY_OS_ENTITY_VALUE}`}>
                    {record ? crmRecordDisplayName(record) : enrollment.recordId}
                  </div>
                  <div className={`mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                    {status}
                    {nextIdx >= 0 && !enrollment.completedAt
                      ? ` · step ${Math.min(nextIdx + 1, sequence.steps.length)}/${sequence.steps.length}`
                      : null}
                    {dueMs && !enrollment.completedAt ? ` · due ${new Date(dueMs).toLocaleString()}` : null}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono`}>
                    {countActionSteps(sequence)} action steps · enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </div>
                </div>
                {!enrollment.completedAt ? (
                  <button
                    type="button"
                    title={enrollment.pausedAt ? 'Resume' : 'Pause'}
                    onClick={() => {
                      pauseCrmSequenceEnrollment(enrollment.id, !enrollment.pausedAt);
                      setVersion((v) => v + 1);
                    }}
                    className={`shrink-0 ${FINELY_OS_LUXURY_PAGINATION_BTN} !p-1.5`}
                  >
                    {enrollment.pausedAt ? <Play size={12} /> : <Pause size={12} />}
                  </button>
                ) : null}
              </div>
            </div>
          );
        }}
      />

      <p className={`text-[10px] flex items-center gap-1 ${FINELY_OS_ENTITY_BODY}`}>
        <RefreshCw size={10} /> Wait steps schedule email, task, and stage moves. Task steps create Work OS tasks when a partner is linked.
      </p>
    </div>
  );
}

export default CrmSequenceRunnerPanel;
