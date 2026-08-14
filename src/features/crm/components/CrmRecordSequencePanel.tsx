import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Plus, Workflow } from 'lucide-react';
import type { CrmRecord } from '../../../domain/crmRecords';
import {
  enrollCrmRecordInSequence,
  getCrmSequence,
  listCrmEnrollmentsByRecord,
  listCrmSequences,
  pauseCrmSequenceEnrollment,
} from '../../../data/crmSequencesRepo';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTile,} from '../../os/finelyOsLightUi';
import {
  dueCrmSequenceSteps,
  executeCrmSequenceStep,
  findNextActionStepIndex,
  getActionStepDueMs,
} from '../sequences/runCrmSequenceEngine';

export function CrmRecordSequencePanel({ record, onUpdated }: { record: CrmRecord; onUpdated?: () => void }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const enrollments = useMemo(() => listCrmEnrollmentsByRecord(record.id), [record.id, version]);
  const enrolledSequenceIds = useMemo(() => new Set(enrollments.filter((e) => !e.completedAt).map((e) => e.sequenceId)), [enrollments]);
  const sequences = useMemo(
    () => listCrmSequences().filter((s) => s.enabled && s.target === record.target),
    [record.target, version],
  );
  const dueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dueCrmSequenceSteps()) m.set(d.enrollment.id, d.stepIndex);
    return m;
  }, [version]);

  const bump = () => {
    setVersion((v) => v + 1);
    onUpdated?.();
  };

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 text-sm space-y-3`}>
      <div className="flex items-center gap-2">
        <Workflow size={14} className="text-violet-400" />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Follow-up sequences</span>
      </div>

      {sequences.length > 0 ? (
        <div className="space-y-1">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Enroll in sequence</span>
          <div className="flex flex-wrap gap-1.5">
            {sequences.map((s) => {
              const active = enrolledSequenceIds.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={active}
                  onClick={() => {
                    enrollCrmRecordInSequence({ recordId: record.id, sequenceId: s.id, currentStage: record.stage });
                    bump();
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? 'emerald' : 'violet', active)} ${active ? 'text-emerald-100' : 'text-white/70'} disabled:opacity-70`}
                >
                  {active ? null : <Plus size={11} />} {s.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <FinelyOsPaginatedStack
        items={enrollments}
        pageSize={3}
        emptyMessage="Not enrolled in any sequence."
        renderItem={(enrollment, i) => {
          const seq = getCrmSequence(enrollment.sequenceId);
          const nextIdx = seq ? findNextActionStepIndex(seq, enrollment.lastCompletedStepIndex) : -1;
          const dueMs = seq && nextIdx >= 0 ? getActionStepDueMs(seq, nextIdx, enrollment.enrolledAt) : null;
          const isDue = dueMap.has(enrollment.id);
          const status = enrollment.completedAt
            ? 'Done'
            : enrollment.pausedAt
              ? 'Paused'
              : isDue
                ? 'Due'
                : 'Running';
          return (
            <div
              key={enrollment.id}
              className={`rounded-lg border px-2.5 py-2 text-xs ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`truncate ${FINELY_OS_ENTITY_VALUE}`}>{seq?.name ?? enrollment.sequenceId}</div>
                  <div className={`mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                    {status}
                    {seq && nextIdx >= 0 && !enrollment.completedAt ? ` · next: ${seq.steps[nextIdx]?.label ?? '—'}` : null}
                    {dueMs && !enrollment.completedAt ? ` · ${new Date(dueMs).toLocaleDateString()}` : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {isDue && seq && nextIdx >= 0 ? (
                    <button
                      type="button"
                      title="Run due step"
                      onClick={async () => {
                        await executeCrmSequenceStep({ enrollment, sequence: seq, stepIndex: nextIdx });
                        bump();
                      }}
                      className={`${FINELY_OS_SUCCESS_BTN} !p-1`}
                    >
                      <Play size={12} />
                    </button>
                  ) : null}
                  {!enrollment.completedAt ? (
                    <button
                      type="button"
                      title={enrollment.pausedAt ? 'Resume' : 'Pause'}
                      onClick={() => {
                        pauseCrmSequenceEnrollment(enrollment.id, !enrollment.pausedAt);
                        bump();
                      }}
                      className={`${FINELY_OS_LUXURY_PAGINATION_BTN} !p-1`}
                    >
                      {enrollment.pausedAt ? <Play size={12} /> : <Pause size={12} />}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

export default CrmRecordSequencePanel;
