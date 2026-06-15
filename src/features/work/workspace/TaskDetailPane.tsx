import React, { useEffect, useState } from 'react';
import { CheckCircle2, ListChecks, ListTodo, Save, Target } from 'lucide-react';
import type { TaskItem, TaskKind, TaskPriority, TaskStage, TaskStatus, TaskVisibility, WorkScope } from '../../../domain/tasks';
import type { TaskResultType } from '../../../domain/workResults';
import { TASK_RESULT_LABELS } from '../../../domain/workResults';
import { upsertTask, toggleTaskChecklistItem } from '../../../data/tasksRepo';
import { completeTaskWithResult } from '../../../lib/workTaskComplete';
import { TaskTimerChip } from '../components/TaskTimerChip';
import { FinelyOsSidePanel } from '../../os/FinelyOsSidePanel';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_NOTICE_INFO, FINELY_OS_SUCCESS_BTN, finelyOsStatusChip } from '../../os/finelyOsLightUi';

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

export function TaskDetailPane({
  task,
  projectTitle,
  enabledTaskStages,
  partnerPortal = false,
  onClose,
  onSaved,
}: {
  task: TaskItem | null;
  projectTitle?: string;
  enabledTaskStages: Array<{ id: string; label: string }>;
  partnerPortal?: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>('general');
  const [stage, setStage] = useState<TaskStage>('intake');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimateMin, setEstimateMin] = useState('');
  const [actualMin, setActualMin] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [labelsRaw, setLabelsRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [scope, setScope] = useState<WorkScope>('personal');
  const [visibility, setVisibility] = useState<TaskVisibility>('hybrid');
  const [assignedTo, setAssignedTo] = useState<'partner' | 'admin' | 'both'>('both');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [resultType, setResultType] = useState<TaskResultType>('custom');
  const [targetMetric, setTargetMetric] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setKind(task.kind ?? 'general');
    setStage((task.stage ?? 'intake') as TaskStage);
    setStatus(task.status ?? 'pending');
    setPriority(task.priority ?? 'normal');
    setDueDate(toDateInput(task.dueAt));
    setStartDate(toDateInput(task.startAt));
    setEstimateMin(task.estimateMinutes != null ? String(task.estimateMinutes) : '');
    setActualMin(task.actualMinutes != null ? String(task.actualMinutes) : '');
    setTagsRaw((task.tags ?? []).join(', '));
    setLabelsRaw((task.labels ?? []).join(', '));
    setNotes(task.notes ?? '');
    setScope(task.scope ?? 'personal');
    setVisibility(task.visibility ?? (task.assignedTo === 'partner' ? 'partner' : task.assignedTo === 'admin' ? 'admin' : 'hybrid'));
    setAssignedTo(task.assignedTo ?? 'both');
    setSuccessCriteria(task.successCriteria ?? '');
    setResultType(task.resultType ?? 'custom');
    setTargetMetric(task.targetMetric ?? '');
    setActualResult(task.actualResult ?? '');
    setReminderDate(toDateInput(task.reminderAt));
    setNotice(null);
  }, [task?.id, task?.updatedAt]);

  const toggleChecklist = (itemId: string) => {
    if (!task) return;
    toggleTaskChecklistItem(task.id, itemId);
    onSaved?.();
  };

  if (!task) return null;

  const labelClass = FINELY_OS_ENTITY_SUBLABEL;

  const checklistBlock = task.checklist?.length ? (
    <div>
      <label className={labelClass}>Checklist</label>
      <ul className="mt-2 space-y-2">
        {task.checklist.map((item) => (
          <li key={item.id} className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {partnerPortal ? (
              <button
                type="button"
                onClick={() => toggleChecklist(item.id)}
                className="mt-0.5 shrink-0 text-white/50 hover:text-emerald-300 transition-colors"
                aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.done ? <CheckCircle2 size={14} className="text-emerald-400" /> : <ListChecks size={14} />}
              </button>
            ) : item.done ? (
              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <button type="button" onClick={() => toggleChecklist(item.id)} className="mt-0.5 shrink-0 text-white/35 hover:text-emerald-300">
                <ListChecks size={14} />
              </button>
            )}
            <span className={item.done ? 'line-through text-white/35' : FINELY_OS_ENTITY_VALUE}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  const save = () => {
    if (status === 'completed') {
      if (successCriteria.trim() && !actualResult.trim()) {
        setNotice('Record actual result before completing — what outcome was achieved?');
        return;
      }
      if (partnerPortal || successCriteria.trim()) {
        const res = completeTaskWithResult({
          taskId: task.id,
          actualResult: actualResult.trim() || 'Completed',
        });
        if (!res.ok) {
          setNotice(res.error);
          return;
        }
        setNotice('Task completed');
        onSaved?.();
        return;
      }
    }
    upsertTask({
      ...task,
      title: title.trim() || task.title,
      kind,
      stage,
      status,
      priority,
      dueAt: fromDateInput(dueDate),
      startAt: fromDateInput(startDate),
      reminderAt: fromDateInput(reminderDate),
      estimateMinutes: estimateMin.trim() ? Math.max(0, parseInt(estimateMin, 10) || 0) : undefined,
      actualMinutes: actualMin.trim() ? Math.max(0, parseInt(actualMin, 10) || 0) : undefined,
      successCriteria: successCriteria.trim() || undefined,
      resultType: successCriteria.trim() ? resultType : undefined,
      targetMetric: targetMetric.trim() || undefined,
      actualResult: actualResult.trim() || undefined,
      tags: tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
      labels: labelsRaw.split(',').map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      scope,
      visibility,
      assignedTo,
      completedAt: status === 'completed' ? task.completedAt ?? new Date().toISOString() : task.completedAt,
      lastTouchedAt: new Date().toISOString(),
    });
    setNotice('Saved');
    onSaved?.();
  };

  return (
    <FinelyOsSidePanel
      icon={ListTodo}
      label="Task"
      title={title.trim() || task.title}
      subtitle={projectTitle}
      accent="emerald"
      iconAccent="emerald"
      onClose={onClose}
      footer={
        <>
          {notice ? <span className={`text-xs ${finelyOsStatusChip('ok')}`}>{notice}</span> : <span />}
          <button type="button" onClick={save} className={FINELY_OS_SUCCESS_BTN}>
            <Save size={14} /> Save
          </button>
        </>
      }
    >
      <div>
        <label className={labelClass}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT} font-medium`} />
      </div>

      <TaskTimerChip task={task} onUpdate={onSaved} />

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-3">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
          <Target size={14} /> Results-driven
        </div>
        <div>
          <label className={labelClass}>Success criteria</label>
          <textarea value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} rows={2} className={FINELY_OS_ENTITY_INPUT} placeholder="What proves this is done?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Result type</label>
            <select value={resultType} onChange={(e) => setResultType(e.target.value as TaskResultType)} className={FINELY_OS_ENTITY_INPUT}>
              {Object.entries(TASK_RESULT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Target metric</label>
            <input value={targetMetric} onChange={(e) => setTargetMetric(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="+40 FICO" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Actual result (required on complete)</label>
          <textarea value={actualResult} onChange={(e) => setActualResult(e.target.value)} rows={2} className={FINELY_OS_ENTITY_INPUT} placeholder="What was achieved?" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phase</label>
          <select value={stage} onChange={(e) => setStage(e.target.value as TaskStage)} className={FINELY_OS_ENTITY_INPUT}>
            {enabledTaskStages.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={FINELY_OS_ENTITY_INPUT}>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)} className={FINELY_OS_ENTITY_INPUT}>
            <option value="general">General</option>
            <option value="upload_document">Upload</option>
            <option value="review_results">Review</option>
            <option value="mail_letter">Mail letter</option>
            <option value="follow_up">Follow up</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={FINELY_OS_ENTITY_INPUT}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
        </div>
        <div>
          <label className={labelClass}>Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Reminder date</label>
        <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Estimate (minutes)</label>
          <input type="number" min={0} value={estimateMin} onChange={(e) => setEstimateMin(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="60" />
        </div>
        <div>
          <label className={labelClass}>Actual (minutes)</label>
          <input type="number" min={0} value={actualMin} onChange={(e) => setActualMin(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="45" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {!partnerPortal ? (
          <>
        <div>
          <label className={labelClass}>Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as WorkScope)} className={FINELY_OS_ENTITY_INPUT}>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Visibility</label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as TaskVisibility)} className={FINELY_OS_ENTITY_INPUT}>
            <option value="partner">Partner only</option>
            <option value="admin">Admin only</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
          </>
        ) : null}
      </div>

      {!partnerPortal ? (
      <div>
        <label className={labelClass}>Assigned to</label>
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value as 'partner' | 'admin' | 'both')} className={FINELY_OS_ENTITY_INPUT}>
          <option value="partner">Partner</option>
          <option value="admin">Admin team</option>
          <option value="both">Both</option>
        </select>
      </div>
      ) : null}

      {!partnerPortal ? (
      <>
      <div>
        <label className={labelClass}>Tags (comma-separated)</label>
        <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="dispute, round-2, urgent" />
      </div>

      <div>
        <label className={labelClass}>Labels (comma-separated)</label>
        <input value={labelsRaw} onChange={(e) => setLabelsRaw(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="sla:48h, client-visible" />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={`${FINELY_OS_ENTITY_INPUT} resize-y`} />
      </div>

      {checklistBlock}
      {(task.tags ?? []).some((t) => t.startsWith('recurring:')) ? (
        <div className={FINELY_OS_NOTICE_INFO}>
          Recurring task — completing spawns the next instance automatically.
        </div>
      ) : null}
      </>
      ) : (
        <>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${FINELY_OS_ENTITY_INPUT} resize-y`} />
        </div>
        {checklistBlock}
        </>
      )}
    </FinelyOsSidePanel>
  );
}
