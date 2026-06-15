import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ListChecks, Save, X } from 'lucide-react';
import type { TaskItem, TaskKind, TaskPriority, TaskStage, TaskStatus } from '../../domain/tasks';
import { upsertTask } from '../../data/tasksRepo';
import {
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

function toDateInput(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function fromDateInput(v: string) {
  if (!v) return undefined;
  return new Date(`${v}T12:00:00`).toISOString();
}

export function TaskDetailModal({
  open,
  task,
  projectTitle,
  enabledTaskStages,
  onClose,
  onSaved,
}: {
  open: boolean;
  task: TaskItem | null;
  projectTitle?: string;
  enabledTaskStages: Array<{ id: string; label: string }>;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>('general');
  const [stage, setStage] = useState<TaskStage>('intake');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsCsv, setTagsCsv] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setKind(task.kind ?? 'general');
    setStage((task.stage ?? 'intake') as TaskStage);
    setStatus(task.status ?? 'pending');
    setPriority(task.priority ?? 'normal');
    setStartDate(toDateInput(task.startAt));
    setDueDate(toDateInput(task.dueAt));
    setEstimateMinutes(task.estimateMinutes ? String(task.estimateMinutes) : '');
    setNotes(task.notes ?? '');
    setTagsCsv((task.tags ?? []).join(', '));
    setNotice(null);
  }, [open, task?.id, task?.updatedAt]);

  if (!open || !task) return null;

  const save = () => {
    const tags = tagsCsv.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
    upsertTask({
      ...task,
      title: title.trim() || task.title,
      kind,
      stage,
      status,
      priority,
      startAt: fromDateInput(startDate),
      dueAt: fromDateInput(dueDate),
      estimateMinutes: estimateMinutes ? Math.max(0, Math.round(Number(estimateMinutes) || 0)) : undefined,
      notes: notes.trim() || undefined,
      tags,
    });
    setNotice('Task saved.');
    onSaved?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-[241]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`absolute inset-x-0 top-[7vh] mx-auto w-[min(820px,calc(100vw-20px))] max-h-[86vh] ${finelyOsCatalogCard('violet')} !p-0 flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl`}>
        <div className="shrink-0 p-6 border-b border-white/[0.08] flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Task details</div>
            <div className={`mt-1 text-lg ${FINELY_OS_ENTITY_VALUE}`}>{task.title}</div>
            <div className={`mt-1 font-mono ${FINELY_OS_ENTITY_SUBLABEL}`}>
              {projectTitle || 'Project'} • {task.id}
            </div>
          </div>
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Task title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="fc-input w-full" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Workflow stage</span>
              <select value={stage} onChange={(e) => setStage(e.target.value as TaskStage)} className="fc-input w-full">
                {enabledTaskStages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="fc-input w-full">
                <option value="pending">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Kind</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)} className="fc-input w-full">
                <option value="general">General</option>
                <option value="follow_up">Follow up</option>
                <option value="mail_letter">Mail letter</option>
                <option value="upload_document">Upload document</option>
                <option value="review_results">Review results</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="fc-input w-full">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Start</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="fc-input w-full" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Due</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="fc-input w-full" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Estimate minutes</span>
              <input type="number" min={0} value={estimateMinutes} onChange={(e) => setEstimateMinutes(e.target.value)} className="fc-input w-full" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Tags</span>
              <input value={tagsCsv} onChange={(e) => setTagsCsv(e.target.value)} className="fc-input w-full" placeholder="mail, dispute, follow-up" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="fc-input w-full resize-y" />
            </label>
          </div>

          {task.checklist?.length ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
              <div className="text-[10px] uppercase tracking-widest text-white/45 font-black flex items-center gap-2">
                <ListChecks size={14} /> Checklist
              </div>
              {task.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 size={14} className={item.done ? 'text-emerald-400' : 'text-white/25'} />
                  {item.text}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 p-4 border-t border-white/[0.08] bg-white/[0.07] flex justify-end gap-2">
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
            Close
          </button>
          <button type="button" onClick={save} className={`inline-flex items-center gap-2 ${FINELY_OS_PRIMARY_BTN}`}>
            <Save size={14} /> Save task
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
