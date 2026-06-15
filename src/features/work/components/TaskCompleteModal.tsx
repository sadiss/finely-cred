import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Paperclip, Target, X } from 'lucide-react';
import type { TaskItem } from '../../../domain/tasks';
import { listEvidenceByPartner } from '../../../data/evidenceRepo';
import { listLettersByPartner } from '../../../data/lettersRepo';
import { completeTaskWithResult } from '../../../lib/workTaskComplete';
import { checkMailLetterTaskEvidenceGate } from '../../../lib/evidenceGates';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsGlassShell,
} from '../../os/finelyOsLightUi';

export function TaskCompleteModal({
  task,
  partnerId,
  open,
  onClose,
  onCompleted,
}: {
  task: TaskItem | null;
  partnerId?: string;
  open: boolean;
  onClose: () => void;
  onCompleted?: (task: TaskItem) => void;
}) {
  const [actualResult, setActualResult] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [vaultVersion, setVaultVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVaultVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const vaultItems = useMemo(() => {
    const pid = partnerId ?? task?.partnerId;
    if (!pid) return [];
    return listEvidenceByPartner(pid).slice(0, 40);
  }, [partnerId, task?.partnerId, vaultVersion]);

  const mailGate = useMemo(() => {
    if (!task) return null;
    const pid = partnerId ?? task.partnerId;
    const letter = task.relatedLetterId
      ? listLettersByPartner(pid).find((l) => l.id === task.relatedLetterId)
      : null;
    return checkMailLetterTaskEvidenceGate({
      task,
      letter,
      evidence: vaultItems,
      soft: true,
    });
  }, [task, partnerId, vaultItems]);

  useEffect(() => {
    if (!task) return;
    setActualResult(task.actualResult ?? '');
    setEvidenceNote('');
    setSelectedEvidenceIds(task.resultEvidenceIds ?? []);
    setErr(null);
  }, [task?.id, open]);

  if (!open || !task) return null;

  const toggleEvidence = (id: string) => {
    setSelectedEvidenceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    setBusy(true);
    setErr(null);
    const res = completeTaskWithResult({
      taskId: task.id,
      actualResult,
      evidenceNote,
      resultEvidenceIds: selectedEvidenceIds.length ? selectedEvidenceIds : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onCompleted?.(res.task);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`${finelyOsGlassShell('panel', 'emerald')} w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
              <Target size={14} /> Complete task
            </div>
            <h3 className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{task.title}</h3>
          </div>
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {task.successCriteria ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-200`}>Success criteria</div>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{task.successCriteria}</p>
          </div>
        ) : (
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Record what you achieved before marking this done.</p>
        )}

        {task.kind === 'mail_letter' && mailGate?.message ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {mailGate.message}
          </div>
        ) : null}

        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Actual result {task.successCriteria ? '(required)' : ''}</label>
          <textarea
            value={actualResult}
            onChange={(e) => setActualResult(e.target.value)}
            rows={3}
            className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
            placeholder="e.g. Uploaded Experian report, deleted 2 collections, mailed Round 1 with tracking #9400…"
          />
        </div>

        <div>
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Evidence note (optional)</label>
          <textarea
            value={evidenceNote}
            onChange={(e) => setEvidenceNote(e.target.value)}
            rows={2}
            className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
            placeholder="Tracking number, screenshot filename, bureau confirmation…"
          />
        </div>

        {vaultItems.length ? (
          <div>
            <label className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5`}>
              <Paperclip size={12} /> Link vault evidence (optional)
            </label>
            <div className="mt-2 flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {vaultItems.map((item) => {
                const on = selectedEvidenceIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleEvidence(item.id)}
                    className={`${FINELY_OS_ENTITY_CHIP} text-left max-w-full truncate ${
                      on ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100' : ''
                    }`}
                    title={item.filename}
                  >
                    {on ? '✓ ' : ''}{item.filename}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={submit} className={FINELY_OS_SUCCESS_BTN}>
            <CheckCircle2 size={14} /> Mark complete
          </button>
        </div>
      </div>
    </div>
  );
}
