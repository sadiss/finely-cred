import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type Scope = 'personal' | 'business';

type Option = { id: string; label: string };

type TaskStage =
  | 'intake'
  | 'reports'
  | 'evidence'
  | 'disputes'
  | 'debt'
  | 'identity'
  | 'funding'
  | 'complete';

type ProjectStage = TaskStage;

type TaskKind = 'mail_letter' | 'follow_up' | 'upload_document' | 'review_results' | 'general';
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
type ProjectPriority = TaskPriority;
type ProjectHealth = 'green' | 'amber' | 'red';

export function WorkItemCreateModal({
  open,
  onClose,
  kind,
  onKindChange,
  allowProject = true,
  allowTask = true,
  partnerOptions,
  projectOptions,
  defaultPartnerId,
  defaultScope = 'personal',
  defaultProjectId,
  enabledTaskStages,
  enabledProjectStages,
  onCreateTask,
  onCreateProject,
  opsMode = false,
}: {
  open: boolean;
  onClose: () => void;
  kind: 'task' | 'project';
  onKindChange?: (k: 'task' | 'project') => void;
  allowProject?: boolean;
  allowTask?: boolean;
  partnerOptions: Option[];
  projectOptions: Option[];
  defaultPartnerId?: string;
  defaultScope?: Scope;
  defaultProjectId?: string;
  enabledTaskStages: Array<{ id: string; label: string }>;
  enabledProjectStages: Array<{ id: string; label: string }>;
  onCreateTask: (args: {
    partnerId: string;
    scope: Scope;
    projectId?: string;
    title: string;
    kind: TaskKind;
    stage: TaskStage;
    priority: TaskPriority;
    dueAt?: string;
    startAt?: string;
    estimateMinutes?: number;
    notes?: string;
    tags?: string[];
    visibility?: 'partner' | 'admin' | 'hybrid';
  }) => void;
  onCreateProject: (args: {
    partnerId: string;
    scope: Scope;
    title: string;
    stage: ProjectStage;
    status: 'active' | 'paused' | 'completed';
    priority?: ProjectPriority;
    health?: ProjectHealth;
    targetCloseAt?: string;
    tags?: string[];
    description?: string;
    visibility?: 'partner' | 'admin' | 'hybrid';
  }) => void;
  /** Admin ops: choose who sees the item on partner portal vs internal-only. */
  opsMode?: boolean;
}) {
  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? '');
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsCsv, setTagsCsv] = useState('');

  const [taskStage, setTaskStage] = useState<TaskStage>('intake');
  const [taskKind, setTaskKind] = useState<TaskKind>('general');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState('');

  const [projectStage, setProjectStage] = useState<ProjectStage>('intake');
  const [projectStatus, setProjectStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [projectPriority, setProjectPriority] = useState<ProjectPriority>('normal');
  const [projectHealth, setProjectHealth] = useState<ProjectHealth>('green');
  const [targetCloseDate, setTargetCloseDate] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [visibility, setVisibility] = useState<'partner' | 'admin' | 'hybrid'>('hybrid');

  useEffect(() => {
    if (!open) return;
    setPartnerId(defaultPartnerId ?? '');
    setScope(defaultScope);
    setProjectId(defaultProjectId ?? '');
    setTitle('');
    setNotes('');
    setTagsCsv('');
    setTaskStage('intake');
    setTaskKind('general');
    setTaskPriority('normal');
    setDueDate('');
    setStartDate('');
    setEstimateMinutes('');
    setProjectStage('intake');
    setProjectStatus('active');
    setProjectPriority('normal');
    setProjectHealth('green');
    setTargetCloseDate('');
    setProjectDescription('');
    setVisibility('hybrid');
  }, [open, defaultPartnerId, defaultProjectId, defaultScope]);

  const resolvedPartnerId = partnerId || partnerOptions[0]?.id || '';

  const tags = useMemo(() => {
    const raw = tagsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return raw.length ? raw.slice(0, 20) : undefined;
  }, [tagsCsv]);

  const canSubmit = useMemo(() => {
    if (!resolvedPartnerId) return false;
    if (!title.trim()) return false;
    if (kind === 'task' && !projectId && projectOptions.length > 0) return false;
    if (kind === 'task' && projectOptions.length === 0) return false;
    return true;
  }, [resolvedPartnerId, title, kind, projectId, projectOptions.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`absolute inset-x-0 top-[10vh] mx-auto w-[min(920px,calc(100vw-24px))] ${finelyOsCatalogCard('violet')} !p-0 overflow-hidden shadow-2xl backdrop-blur-xl`}>
        <div className="p-6 border-b border-white/[0.08] flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Create</div>
            <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>
              {kind === 'task' ? 'New task' : 'New project'}
            </div>
            <div className={FINELY_OS_ENTITY_BODY}>
              Create from anywhere — tasks can be linked to a project, and projects can be created without leaving the page.
            </div>
          </div>
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {(allowProject && allowTask && onKindChange) ? (
            <div className={`${FINELY_OS_TOOLBAR} !p-1 inline-flex`}>
              <button type="button" onClick={() => onKindChange('task')} className={finelyOsViewTab(kind === 'task', 'emerald')}>
                Task
              </button>
              <button type="button" onClick={() => onKindChange('project')} className={finelyOsViewTab(kind === 'project', 'emerald')}>
                Project
              </button>
            </div>
          ) : null}

          {opsMode ? (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Who can see this?</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'partner' | 'admin' | 'hybrid')}
                className="w-full max-w-md bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="hybrid">Shared — partner + ops (action items)</option>
                <option value="partner">Partner only — self-service reminders</option>
                <option value="admin">Internal ops only — hidden from partner portal</option>
              </select>
              <p className="mt-1 text-xs text-white/40">Partners never see internal ops tasks. Shared items appear on their simplified board.</p>
            </div>
          ) : null}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Partner</label>
              <select
                value={resolvedPartnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                {partnerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="personal">personal</option>
                <option value="business">business</option>
              </select>
            </div>
            {kind === 'task' ? (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Project (required)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                  required
                >
                  {projectOptions.length === 0 ? (
                    <option value="">Create a project first</option>
                  ) : (
                    projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Status</label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as any)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                {kind === 'task' ? 'Task title' : 'Project title'}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                placeholder={kind === 'task' ? 'What needs to happen next?' : 'Name the project'}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Stage</label>
              {kind === 'task' ? (
                <select
                  value={taskStage}
                  onChange={(e) => setTaskStage(e.target.value as any)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  {enabledTaskStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={projectStage}
                  onChange={(e) => setProjectStage(e.target.value as any)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  {enabledProjectStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {kind === 'task' ? (
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Kind</label>
                <select
                  value={taskKind}
                  onChange={(e) => setTaskKind(e.target.value as TaskKind)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="general">General</option>
                  <option value="follow_up">Follow up</option>
                  <option value="mail_letter">Mail letter</option>
                  <option value="upload_document">Upload document</option>
                  <option value="review_results">Review results</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Start (optional)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Due (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Estimate (min)</label>
                <input
                  type="number"
                  min={0}
                  value={estimateMinutes}
                  onChange={(e) => setEstimateMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Tags (comma)</label>
                <input
                  value={tagsCsv}
                  onChange={(e) => setTagsCsv(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  placeholder="disputes, mail, follow_up"
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Description (optional)</label>
                <input
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  placeholder="What is this project trying to accomplish?"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Priority</label>
                <select
                  value={projectPriority}
                  onChange={(e) => setProjectPriority(e.target.value as ProjectPriority)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Health</label>
                <select
                  value={projectHealth}
                  onChange={(e) => setProjectHealth(e.target.value as ProjectHealth)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="green">On track</option>
                  <option value="amber">At risk</option>
                  <option value="red">Blocked</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Target close</label>
                <input
                  type="date"
                  value={targetCloseDate}
                  onChange={(e) => setTargetCloseDate(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Tags (comma)</label>
                <input
                  value={tagsCsv}
                  onChange={(e) => setTagsCsv(e.target.value)}
                  className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  placeholder="dfy, baseline, business"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
              {kind === 'task' ? 'Notes (optional)' : 'Notes (optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
              placeholder="Add details, links, and instructions."
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!resolvedPartnerId) return;
                const t = title.trim();
                if (!t) return;
                const n = notes.trim() || undefined;
                if (kind === 'task') {
                  if (!projectId && projectOptions.length > 0) return;
                  const dueAt = dueDate ? new Date(dueDate).toISOString() : undefined;
                  const startAt = startDate ? new Date(startDate).toISOString() : undefined;
                  const est = estimateMinutes.trim() ? Number(estimateMinutes) : undefined;
                  onCreateTask({
                    partnerId: resolvedPartnerId,
                    scope,
                    projectId: projectId || undefined,
                    title: t,
                    kind: taskKind,
                    stage: taskStage,
                    priority: taskPriority,
                    dueAt,
                    startAt,
                    estimateMinutes: est && Number.isFinite(est) ? est : undefined,
                    notes: n,
                    tags,
                    visibility: opsMode ? visibility : undefined,
                  });
                } else {
                  const targetCloseAt = targetCloseDate ? new Date(targetCloseDate).toISOString() : undefined;
                  onCreateProject({
                    partnerId: resolvedPartnerId,
                    scope,
                    title: t,
                    stage: projectStage,
                    status: projectStatus,
                    priority: projectPriority,
                    health: projectHealth,
                    targetCloseAt,
                    tags,
                    description: projectDescription.trim() || undefined,
                    visibility: opsMode ? visibility : undefined,
                  });
                }
                onClose();
              }}
              className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

