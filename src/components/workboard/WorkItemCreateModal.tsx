import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

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

type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

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
    stage: TaskStage;
    priority: TaskPriority;
    dueAt?: string;
    notes?: string;
    tags?: string[];
  }) => void;
  onCreateProject: (args: {
    partnerId: string;
    scope: Scope;
    title: string;
    stage: ProjectStage;
    status: 'active' | 'paused' | 'completed';
    tags?: string[];
    description?: string;
  }) => void;
}) {
  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? '');
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsCsv, setTagsCsv] = useState('');

  const [taskStage, setTaskStage] = useState<TaskStage>('intake');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');

  const [projectStage, setProjectStage] = useState<ProjectStage>('intake');
  const [projectStatus, setProjectStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setPartnerId(defaultPartnerId ?? '');
    setScope(defaultScope);
    setProjectId(defaultProjectId ?? '');
    setTitle('');
    setNotes('');
    setTagsCsv('');
    setTaskStage('intake');
    setTaskPriority('normal');
    setDueDate('');
    setProjectStage('intake');
    setProjectStatus('active');
    setProjectDescription('');
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
    return true;
  }, [resolvedPartnerId, title]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-x-0 top-[10vh] mx-auto w-[min(920px,calc(100vw-24px))] rounded-3xl border border-white/10 bg-[#0b1110]/90 backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Create</div>
            <div className="mt-1 text-white font-semibold">
              {kind === 'task' ? 'New task' : 'New project'}
            </div>
            <div className="mt-1 text-white/60 text-sm">
              Create from anywhere — tasks can be linked to a project, and projects can be created without leaving the page.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {(allowProject && allowTask && onKindChange) ? (
            <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => onKindChange('task')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  kind === 'task' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Task
              </button>
              <button
                type="button"
                onClick={() => onKindChange('project')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  kind === 'project' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Project
              </button>
            </div>
          ) : null}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Partner</label>
              <select
                value={resolvedPartnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="personal">personal</option>
                <option value="business">business</option>
              </select>
            </div>
            {kind === 'task' ? (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Project (optional)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="">No project</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Status</label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                placeholder={kind === 'task' ? 'What needs to happen next?' : 'Name the project'}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Stage</label>
              {kind === 'task' ? (
                <select
                  value={taskStage}
                  onChange={(e) => setTaskStage(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
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
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Due date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Tags (comma)</label>
                <input
                  value={tagsCsv}
                  onChange={(e) => setTagsCsv(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  placeholder="disputes, mail, follow_up"
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Description (optional)</label>
                <input
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  placeholder="What is this project trying to accomplish?"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Tags (comma)</label>
                <input
                  value={tagsCsv}
                  onChange={(e) => setTagsCsv(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
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
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
              placeholder="Add details, links, and instructions."
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
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
                  const dueAt = dueDate ? new Date(dueDate).toISOString() : undefined;
                  onCreateTask({
                    partnerId: resolvedPartnerId,
                    scope,
                    projectId: projectId || undefined,
                    title: t,
                    stage: taskStage,
                    priority: taskPriority,
                    dueAt,
                    notes: n,
                    tags,
                  });
                } else {
                  onCreateProject({
                    partnerId: resolvedPartnerId,
                    scope,
                    title: t,
                    stage: projectStage,
                    status: projectStatus,
                    tags,
                    description: projectDescription.trim() || undefined,
                  });
                }
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

