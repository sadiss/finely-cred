import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Calendar, CheckCircle2, FolderOpen, ListChecks, Sparkles, User, X } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import type { Project, ProjectHealth, ProjectPriority, ProjectStage, ProjectStatus } from '../../domain/projects';
import { upsertProject } from '../../data/projectsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../fields/FieldLayoutRenderer';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';
import { callAiGateway } from '../../lib/aiClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import { FINELY_TEAM_CONTACTS } from '../../lib/teamContacts';
import {
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

function fmtWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

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

type Props = {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  partner: Partner | null;
  tenantId: string;
  enabledProjectStages: Array<{ id: string; label: string }>;
  projectFieldDefs: CustomFieldDefinition[];
  projectFieldLayout: FieldLayout | null;
  taskCounts?: { open: number; done: number };
  onSaved?: () => void;
  onViewTasks?: () => void;
};

export function ProjectDetailModal({
  open,
  onClose,
  project,
  partner,
  tenantId,
  enabledProjectStages,
  projectFieldDefs,
  projectFieldLayout,
  taskCounts,
  onSaved,
  onViewTasks,
}: Props) {
  const [tab, setTab] = useState<'details' | 'tasks'>('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [stage, setStage] = useState<ProjectStage>('intake');
  const [priority, setPriority] = useState<ProjectPriority>('normal');
  const [health, setHealth] = useState<ProjectHealth>('green');
  const [targetCloseDate, setTargetCloseDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [tagsCsv, setTagsCsv] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const assigneeOptions = useMemo(() => {
    const opts: Array<{ id: string; label: string; emoji?: string }> = [];
    if (partner) {
      opts.push({ id: `partner:${partner.id}`, label: partner.profile?.fullName ?? 'You (partner)', emoji: '👤' });
    }
    for (const c of FINELY_TEAM_CONTACTS) {
      opts.push({ id: `team:${c.id}`, label: c.name, emoji: c.emoji });
    }
    return opts;
  }, [partner]);

  useEffect(() => {
    if (!open || !project) return;
    setTab('details');
    setTitle(project.title);
    setDescription(project.description ?? '');
    setStatus(project.status);
    setStage(project.stage);
    setPriority(project.priority ?? 'normal');
    setHealth(project.health ?? 'green');
    setTargetCloseDate(toDateInput(project.targetCloseAt));
    setStartDate(toDateInput(project.startAt));
    setTagsCsv((project.tags ?? []).join(', '));
    const ids = (project.assigneeUserIds ?? []).slice();
    if (!ids.length && partner) ids.push(`partner:${partner.id}`);
    setAssigneeIds(ids);
    const rec = getCustomFieldValues('projects', project.id, tenantId);
    setCustomValues(rec?.values ?? {});
    setNotice(null);
    setAiErr(null);
  }, [open, project?.id, project?.updatedAt, partner?.id, tenantId]);

  if (!open || !project || !partner) return null;

  const tags = tagsCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const save = () => {
    upsertProject({
      ...project,
      title: title.trim() || project.title,
      description: description.trim() || undefined,
      status,
      stage,
      priority,
      health,
      targetCloseAt: fromDateInput(targetCloseDate),
      startAt: fromDateInput(startDate),
      tags: tags.length ? tags : project.tags,
      assigneeUserIds: assigneeIds,
      scope: project.scope ?? 'personal',
    });
    upsertCustomFieldValues('projects', project.id, customValues, tenantId);
    setNotice('Project saved.');
    onSaved?.();
  };

  const runAiFields = async () => {
    if (!isFeatureEnabled('aiGateway')) {
      setAiErr('AI Gateway is disabled.');
      return;
    }
    setAiBusy(true);
    setAiErr(null);
    try {
      const res = await callAiGateway({
        taskType: 'project.field_suggestions',
        responseFormat: 'json',
        providerHint: 'openai',
        context: { projectId: project.id, partnerId: partner.id, stage, status },
        messages: [
          {
            role: 'system',
            content:
              'Return JSON only: { "description": string, "tags": string[], "riskFlags": string[], "health": "green"|"amber"|"red", "priority": "low"|"normal"|"high"|"urgent" }. Suggest practical credit-restore project fields.',
          },
          {
            role: 'user',
            content: `Project: ${title}\nStage: ${stage}\nStatus: ${status}\nCurrent description: ${description || '(empty)'}`,
          },
        ],
      });
      const obj = extractFirstJsonObject(res.text) as any;
      if (obj?.description) setDescription(String(obj.description));
      if (Array.isArray(obj?.tags) && obj.tags.length) setTagsCsv(obj.tags.map(String).join(', '));
      if (obj?.health === 'green' || obj?.health === 'amber' || obj?.health === 'red') setHealth(obj.health);
      if (['low', 'normal', 'high', 'urgent'].includes(obj?.priority)) setPriority(obj.priority);
      setNotice('AI suggestions applied — review and save.');
    } catch (e: any) {
      setAiErr(e?.message || 'AI suggestion failed.');
    } finally {
      setAiBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[240]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`absolute inset-x-0 top-[6vh] mx-auto w-[min(960px,calc(100vw-20px))] max-h-[88vh] ${finelyOsCatalogCard('violet')} !p-0 flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl`}>
        <div className="shrink-0 p-6 border-b border-white/[0.08] flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Project details</div>
            <div className={`mt-1 text-lg truncate ${FINELY_OS_ENTITY_VALUE}`}>{project.title}</div>
            <div className={`mt-1 font-mono ${FINELY_OS_ENTITY_SUBLABEL}`}>
              {project.id} • created {fmtWhen(project.createdAt)}
            </div>
          </div>
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
            <X size={16} />
          </button>
        </div>

        <div className="shrink-0 flex border-b border-white/[0.08] px-4 bg-white/[0.07]">
          <button
            type="button"
            onClick={() => setTab('details')}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              tab === 'details' ? 'border-amber-400 text-amber-200' : 'border-transparent text-white/45 hover:text-white/70'
            }`}
          >
            <FolderOpen size={12} className="inline mr-1.5" /> Details
          </button>
          <button
            type="button"
            onClick={() => setTab('tasks')}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              tab === 'tasks' ? 'border-amber-400 text-amber-200' : 'border-transparent text-white/45 hover:text-white/70'
            }`}
          >
            <ListChecks size={12} className="inline mr-1.5" /> Tasks
            {taskCounts ? ` (${taskCounts.open} open)` : ''}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
          {aiErr ? <div className={FINELY_OS_NOTICE_ERROR}>{aiErr}</div> : null}

          {tab === 'details' ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runAiFields()}
                  disabled={aiBusy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <Sparkles size={14} /> {aiBusy ? 'Thinking…' : 'AI field suggestions'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Project name</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="fc-input w-full" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="fc-input w-full resize-y"
                    placeholder="What this project is trying to accomplish…"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Workflow stage</span>
                  <select value={stage} onChange={(e) => setStage(e.target.value as ProjectStage)} className="fc-input w-full">
                    {enabledProjectStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="fc-input w-full">
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Priority</span>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)} className="fc-input w-full">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Health</span>
                  <select value={health} onChange={(e) => setHealth(e.target.value as ProjectHealth)} className="fc-input w-full">
                    <option value="green">On track</option>
                    <option value="amber">At risk</option>
                    <option value="red">Blocked</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Start date</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="fc-input w-full" />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Target close / due</span>
                  <input type="date" value={targetCloseDate} onChange={(e) => setTargetCloseDate(e.target.value)} className="fc-input w-full" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/45 font-black">Tags (comma-separated)</span>
                  <input value={tagsCsv} onChange={(e) => setTagsCsv(e.target.value)} className="fc-input w-full" placeholder="disputes, mail, funding" />
                </label>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/45 font-black">
                  <User size={14} /> Assigned to
                </div>
                <div className="flex flex-wrap gap-2">
                  {assigneeOptions.map((opt) => {
                    const on = assigneeIds.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setAssigneeIds((ids) => (on ? ids.filter((x) => x !== opt.id) : [...ids, opt.id]))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-semibold transition-all ${
                          on ? 'border-amber-500/40 bg-amber-500/15 text-amber-100' : 'border-white/[0.08] bg-white/[0.05] text-white/55 hover:text-white/80'
                        }`}
                      >
                        {opt.emoji ? <span>{opt.emoji}</span> : null} {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Created for</div>
                  <div className="mt-1 text-white/80">{partner.profile?.fullName ?? partner.id}</div>
                </div>
                <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Scope</div>
                  <div className="mt-1 text-white/80 capitalize">{project.scope ?? 'personal'}</div>
                </div>
                <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Last updated</div>
                  <div className="mt-1 text-white/80">{fmtWhen(project.updatedAt)}</div>
                </div>
                <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1">
                    <Calendar size={12} /> Target close
                  </div>
                  <div className="mt-1 text-white/80">{targetCloseDate || '—'}</div>
                </div>
              </div>

              {projectFieldLayout && projectFieldDefs.length ? (
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Custom project fields</div>
                  <FieldLayoutRenderer
                    layout={projectFieldLayout}
                    definitions={projectFieldDefs}
                    values={customValues}
                    onChangeValue={(key, next, persist) => {
                      setCustomValues((prev) => {
                        const merged = { ...(prev || {}), [key]: next };
                        if (persist) upsertCustomFieldValues('projects', project.id, merged, tenantId);
                        return merged;
                      });
                    }}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className="text-white font-semibold">Tasks in this project</div>
                <p className="mt-2 text-white/60 text-sm">
                  Use the Kanban board to move tasks through To do → In progress → Done. This project is the master container for every task.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {taskCounts ? (
                    <>
                      <span className="px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-[10px] font-black uppercase text-amber-100">
                        {taskCounts.open} open
                      </span>
                      <span className="px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-black uppercase text-emerald-100 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> {taskCounts.done} done
                      </span>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onViewTasks?.();
                    onClose();
                  }}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110"
                >
                  Open task board <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {tab === 'details' ? (
          <div className="shrink-0 p-4 border-t border-white/[0.08] bg-white/[0.07] flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
              Close
            </button>
            <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
              Save project
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
