import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, FolderOpen, Gavel, ListChecks, Plus, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { createProject, ensureDefaultProjectForPartner, listProjectsByPartner, setProjectStage, setProjectStatus } from '../../data/projectsRepo';
import { createTask, listTasksByPartner, setTaskStatus, upsertTask } from '../../data/tasksRepo';
import type { TaskItem, TaskPriority, TaskStage, TaskStatus } from '../../domain/tasks';
import { getWorkboardSettings, isFeatureEnabled } from '../../data/settingsRepo';
import { callAiGateway } from '../../lib/aiClient';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';
import type { WorkStageDefinition } from '../../domain/settings';
import { WorkItemCreateModal } from '../../components/workboard/WorkItemCreateModal';

function fmtWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function priorityBadge(p?: TaskPriority) {
  if (p === 'urgent') return { label: 'Urgent', cls: 'bg-red-500/15 border-red-500/30 text-red-200' };
  if (p === 'high') return { label: 'High', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-200' };
  if (p === 'low') return { label: 'Low', cls: 'bg-white/[0.04] border-white/10 text-white/50' };
  return { label: 'Normal', cls: 'bg-white/[0.04] border-white/10 text-white/60' };
}

function stageIcon(stage: TaskStage) {
  switch (stage) {
    case 'reports':
      return <FolderOpen size={14} className="text-amber-400" />;
    case 'disputes':
      return <Gavel size={14} className="text-amber-400" />;
    case 'identity':
      return <ShieldAlert size={14} className="text-amber-400" />;
    default:
      return <ListChecks size={14} className="text-amber-400" />;
  }
}

export default function PartnerProjectsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [scope, setScope] = useState<'personal' | 'business'>('personal');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string | 'all'>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (!partner) return;
    ensureDefaultProjectForPartner({
      partnerId: partner.id,
      scope,
      fundingGoal: partner.routes?.[partner.primaryRoute || 'personal_restore']?.fundingTarget,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id, scope]);

  const projects = useMemo(() => (partner ? listProjectsByPartner(partner.id) : []), [partner, version]);
  const scopedProjects = useMemo(() => projects.filter((p) => (p.scope ?? 'personal') === scope), [projects, scope]);
  const activeProject = scopedProjects.find((p) => p.status === 'active') ?? scopedProjects[0] ?? null;
  const projectId = activeProject?.id ?? null;

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const projectFieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('projects', tenantId), [tenantId]);
  const projectFieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'projects' }), [tenantId]);
  const projectValuesRecord = useMemo(
    () => (partner && projectId ? getCustomFieldValues('projects', projectId, tenantId) : null),
    [partner?.id, projectId, tenantId],
  );
  const [projectValues, setProjectValues] = useState<Record<string, any>>(projectValuesRecord?.values ?? {});

  useEffect(() => {
    setProjectValues(projectValuesRecord?.values ?? {});
  }, [projectValuesRecord?.updatedAt, projectId]);

  const tasks = useMemo(() => {
    if (!partner) return [];
    const all = listTasksByPartner(partner.id);
    return projectId ? all.filter((t) => t.projectId === projectId) : all;
  }, [partner, version, projectId]);

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const projectStageDefs = useMemo(() => getWorkboardSettings().projectStages, [version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);
  const enabledProjectStages = useMemo(() => projectStageDefs.filter((s) => !s.disabled), [projectStageDefs]);
  const categoryLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const progressStages: WorkStageDefinition[] = useMemo(
    () => [
      { id: 'pending', label: 'To do', color: '#94a3b8', hint: 'Not started yet.' },
      { id: 'in_progress', label: 'In progress', color: '#fbbf24', hint: 'Currently active.' },
      { id: 'completed', label: 'Done', color: '#22c55e', hint: 'Completed tasks.' },
      { id: 'cancelled', label: 'Cancelled', color: '#64748b', hint: 'Not needed.' },
    ],
    [],
  );

  const filteredTasks = useMemo(() => {
    if (taskCategoryFilter === 'all') return tasks;
    return tasks.filter((t) => String(t.stage ?? 'intake') === taskCategoryFilter);
  }, [tasks, taskCategoryFilter]);

  const tasksById = useMemo(() => new Map(filteredTasks.map((t) => [t.id, t])), [filteredTasks]);
  const taskItems: WorkBoardItem[] = useMemo(
    () =>
      filteredTasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: `${categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake')} • ${t.kind}`,
        stage: (t.status ?? 'pending') as any,
        status: t.status,
        dueAt: t.dueAt,
        updatedAt: t.updatedAt,
        tags: t.tags,
      })),
    [filteredTasks, categoryLabelById],
  );

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ title: string; stage?: TaskStage; kind?: any; priority?: TaskPriority; dueInDays?: number; notes?: string; tags?: string[] }>
  >([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<'task' | 'project'>('task');

  const runAiSuggestions = async () => {
    if (!partner || !projectId) return;
    if (!isFeatureEnabled('aiGateway')) {
      setAiErr('AI Gateway is disabled (Feature Flags).');
      return;
    }
    setAiErr(null);
    setAiBusy(true);
    setAiSuggestions([]);
    try {
      const sys = `Return ONLY valid JSON.\n\nGenerate 6-10 next-best-action task suggestions for a credit dispute/funding platform.\nSchema:\n{\n  \"tasks\": [\n    {\n      \"title\": string,\n      \"stage\": \"intake\"|\"reports\"|\"evidence\"|\"disputes\"|\"debt\"|\"identity\"|\"funding\"|\"complete\",\n      \"kind\": \"mail_letter\"|\"follow_up\"|\"upload_document\"|\"review_results\"|\"general\",\n      \"priority\": \"low\"|\"normal\"|\"high\"|\"urgent\",\n      \"dueInDays\": number,\n      \"notes\": string,\n      \"tags\": string[]\n    }\n  ]\n}\n\nMake tasks specific and practical.`;
      const ctx = {
        lane: partner.lane ?? partner.primaryRoute ?? 'other',
        journeyStage: partner.journeyStage ?? 'intake',
        openTasks: tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length,
        dueSoon: tasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now() + 7 * 24 * 60 * 60 * 1000).length,
      };
      const res = await callAiGateway({
        taskType: 'next_best_actions',
        responseFormat: 'json',
        providerHint: 'openai',
        context: { partnerId: partner.id, projectId, ...ctx },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Context:\n${JSON.stringify(ctx, null, 2)}` },
        ],
      });
      const parsed = JSON.parse(res.text || '{}') as any;
      const list = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
      setAiSuggestions(
        list
          .map((t: any) => ({
            title: String(t.title || '').trim(),
            stage: t.stage,
            kind: t.kind,
            priority: t.priority,
            dueInDays: typeof t.dueInDays === 'number' ? t.dueInDays : undefined,
            notes: String(t.notes || '').trim() || undefined,
            tags: Array.isArray(t.tags) ? t.tags.map((x: any) => String(x)) : undefined,
          }))
          .filter((t: any) => t.title),
      );
    } catch (e: any) {
      setAiErr(e?.message || 'AI suggestion failed.');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Projects"
      subtitle="Your DFY workflow board: everything organized by stage, deadlines, and next steps."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Partner Dashboard"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>

            <div className="min-w-[320px] flex-1" />
          </div>

          <WorkBoardShell
            view={view}
            onViewChange={setView}
            stages={progressStages}
            stageFilter={taskCategoryFilter}
            onStageFilterChange={setTaskCategoryFilter}
            stageFilterStages={taskStageDefs}
            right={
              <>
                <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
                  <button
                    type="button"
                    onClick={() => setScope('personal')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      scope === 'personal' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    title="Personal board"
                  >
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('business')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      scope === 'business' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    title="Business board"
                  >
                    Business
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateKind('task');
                    setCreateOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  <Plus size={14} /> New task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateKind('project');
                    setCreateOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                  title="Create a new project"
                >
                  <Calendar size={14} /> New project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiOpen(true);
                    void runAiSuggestions();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                  title="AI-powered next best actions"
                >
                  <Sparkles size={14} /> AI suggestions
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal/tasks')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Tasks <Sparkles size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/portal/work')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  title="All work across projects + tasks"
                >
                  All work <ArrowRight size={14} />
                </button>
              </>
            }
          />

          {activeProject && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-white font-semibold">{activeProject.title}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    project_id:{activeProject.id} • stage:{activeProject.stage} • status:{activeProject.status}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={activeProject.stage}
                    onChange={(e) => setProjectStage(activeProject.id, e.target.value as any)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                  >
                    {enabledProjectStages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={activeProject.status}
                    onChange={(e) => setProjectStatus(activeProject.id, e.target.value as any)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>
              <div className="text-white/60 text-sm">
                Use this board to keep your file moving: upload docs, generate letters, mail, and follow up by deadlines. Tasks
                update your notifications feed automatically.
              </div>

              {projectId ? (
                <div className="pt-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Project fields</div>
                  <div className="mt-3">
                    <FieldLayoutRenderer
                      layout={projectFieldLayout}
                      definitions={projectFieldDefs}
                      values={projectValues}
                      onChangeValue={(key, next, persist) => {
                        setProjectValues((prev) => {
                          const merged = { ...(prev || {}), [key]: next };
                          if (persist && partner && projectId) upsertCustomFieldValues('projects', projectId, merged, tenantId);
                          return merged;
                        });
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <WorkItemCreateModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            kind={createKind}
            onKindChange={setCreateKind}
            allowProject
            allowTask
            partnerOptions={
              partner
                ? [{ id: partner.id, label: partner.profile?.fullName ?? partner.id }]
                : []
            }
            projectOptions={scopedProjects.map((p) => ({ id: p.id, label: p.title }))}
            defaultPartnerId={partner?.id}
            defaultScope={scope}
            defaultProjectId={projectId ?? undefined}
            enabledTaskStages={enabledTaskStages.map((s) => ({ id: s.id, label: s.label }))}
            enabledProjectStages={enabledProjectStages.map((s) => ({ id: s.id, label: s.label }))}
            onCreateTask={(args) => {
              if (!partner) return;
              createTask({
                partnerId: partner.id,
                scope,
                projectId: args.projectId ?? projectId ?? undefined,
                title: args.title,
                kind: 'general',
                stage: args.stage as any,
                priority: args.priority as any,
                status: 'pending',
                dueAt: args.dueAt,
                notes: args.notes,
                tags: args.tags,
                assignedTo: 'partner',
                visibility: 'partner',
              } as any);
              setVersion((v) => v + 1);
            }}
            onCreateProject={(args) => {
              if (!partner) return;
              createProject({
                partnerId: partner.id,
                scope,
                title: args.title,
                stage: args.stage as any,
                status: args.status as any,
                tags: args.tags,
              } as any);
              setVersion((v) => v + 1);
            }}
          />

          {aiOpen && (
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">AI suggestions</div>
                  <div className="mt-2 text-white font-semibold">Next best actions</div>
                  <div className="mt-1 text-white/60 text-sm">Accept any suggestion to create it as a real task.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiOpen(false)}
                  className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
              {aiErr ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-100 text-sm">{aiErr}</div> : null}
              {aiBusy ? (
                <div className="text-white/60 text-sm">Generating…</div>
              ) : aiSuggestions.length === 0 ? (
                <div className="text-white/60 text-sm">No suggestions yet.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                      <div className="text-white font-semibold">{s.title}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {s.stage ?? 'intake'} • {s.kind ?? 'general'} • {s.priority ?? 'normal'}
                        {typeof s.dueInDays === 'number' ? ` • due +${s.dueInDays}d` : ''}
                      </div>
                      {s.notes ? <div className="text-white/60 text-sm">{s.notes}</div> : null}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => void runAiSuggestions()}
                          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        >
                          Refresh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!partner || !projectId) return;
                            const dueAt =
                              typeof s.dueInDays === 'number'
                                ? new Date(Date.now() + s.dueInDays * 24 * 60 * 60 * 1000).toISOString()
                                : undefined;
                            createTask({
                              partnerId: partner.id,
                              scope,
                              projectId,
                              title: s.title,
                              kind: (s.kind as any) || 'general',
                              stage: (s.stage as any) || 'intake',
                              priority: (s.priority as any) || 'normal',
                              status: 'pending',
                              dueAt,
                              notes: s.notes || undefined,
                              tags: s.tags,
                              assignedTo: 'partner',
                            });
                            setVersion((v) => v + 1);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                          Accept <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'kanban' ? (
            <WorkKanbanBoard
              stages={progressStages}
              items={taskItems}
              onStageChange={(id, stageId) => {
                const t = tasksById.get(id);
                if (!t) return;
                const nextStatus = stageId as TaskStatus;
                if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(nextStatus)) return;
                setTaskStatus(t.id, nextStatus);
              }}
              cardMeta={(it) => {
                const t = tasksById.get(it.id);
                if (!t) return null;
                const badge = priorityBadge(t.priority);
                const blocked = (t.blockedByTaskIds ?? []).length > 0;
                return (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      {(categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake'))} • {t.kind} • {t.status} • due{' '}
                      {fmtWhen(t.dueAt)}
                    </div>
                    {blocked ? (
                      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-200">
                        <ShieldAlert size={12} /> Has dependencies
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTaskStatus(t.id, 'in_progress')}
                        disabled={t.status !== 'pending'}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Start
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskStatus(t.id, 'completed')}
                        disabled={t.status === 'completed'}
                        className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 size={14} /> Done
                      </button>
                      <select
                        value={t.priority ?? 'normal'}
                        onChange={(e) => upsertTask({ ...t, priority: e.target.value as any })}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                        title="Priority"
                      >
                        <option value="low">low</option>
                        <option value="normal">normal</option>
                        <option value="high">high</option>
                        <option value="urgent">urgent</option>
                      </select>
                    </div>
                  </div>
                );
              }}
            />
          ) : view === 'list' ? (
            <WorkListView
              stages={progressStages}
              items={[...taskItems].sort(
                (a, b) =>
                  (a.dueAt || '9999').localeCompare(b.dueAt || '9999') || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
              )}
              onStageChange={(id, stageId) => {
                const t = tasksById.get(id);
                if (!t) return;
                const nextStatus = stageId as TaskStatus;
                if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(nextStatus)) return;
                setTaskStatus(t.id, nextStatus);
              }}
            />
          ) : (
            <WorkCalendarView
              items={taskItems}
              stageColorById={Object.fromEntries(progressStages.map((s) => [s.id, String((s as any).color || '')])) as any}
              dateForItem={(it) => it.dueAt}
              emptyHint="Only tasks with a due date appear here."
            />
          )}
        </div>
      )}
    </PageShell>
  );
}

