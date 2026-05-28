import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FolderKanban, ListChecks, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getProject, setProjectStage, setProjectStatus } from '../../data/projectsRepo';
import { getPartner, listPartnersByTenant } from '../../data/partnersRepo';
import { createTask, listTasks, setTaskStatus, upsertTask } from '../../data/tasksRepo';
import type { TaskItem, TaskPriority, TaskStage, TaskStatus } from '../../domain/tasks';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { TASK_PROGRESS_STAGES, WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';
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

export default function AdminProjectDetailPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const project = useMemo(() => (id ? getProject(id) : null), [id, version]);
  const [partner, setPartner] = useState<import('../../domain/partners').Partner | null>(null);
  useEffect(() => {
    if (!project) { setPartner(null); return; }
    getPartner(project.partnerId).then(setPartner);
  }, [project?.partnerId]);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIds(new Set()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user, version]);
  const tasks = useMemo(() => {
    if (!project) return [];
    if (!partnerIds.has(project.partnerId)) return [];
    return listTasks().filter((t) => t.projectId === project.id);
  }, [partnerIds, project, version]);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const projectStageDefs = useMemo(() => getWorkboardSettings().projectStages, [version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);
  const enabledProjectStages = useMemo(() => projectStageDefs.filter((s) => !s.disabled), [projectStageDefs]);
  const categoryLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const progressStages: WorkStageDefinition[] = useMemo(() => TASK_PROGRESS_STAGES, []);

  const filteredTasks = useMemo(() => {
    if (taskCategoryFilter === 'all') return tasks;
    return tasks.filter((t) => String(t.stage ?? 'intake') === taskCategoryFilter);
  }, [tasks, taskCategoryFilter]);

  const filteredTasksById = useMemo(() => new Map(filteredTasks.map((t) => [t.id, t])), [filteredTasks]);

  const taskItems: WorkBoardItem[] = useMemo(
    () =>
      filteredTasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: `${categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake')} • ${t.kind}`,
        stage: String(t.status ?? 'pending'),
        status: t.status,
        dueAt: t.dueAt,
        updatedAt: t.updatedAt,
        tags: t.tags,
      })),
    [filteredTasks, categoryLabelById],
  );

  if (!id) {
    return <PageShell badge="Admin" title="Project not found" subtitle="" />;
  }

  if (!project) {
    return <PageShell badge="Admin" title="Project not found" subtitle="This project does not exist." />;
  }
  if (!partnerIds.has(project.partnerId)) {
    return <PageShell badge="Admin" title="Not authorized" subtitle="That project belongs to a different tenant." />;
  }

  return (
    <PageShell badge="Admin" title="Project board" subtitle="DFY ops view: move tasks, set priority, confirm completion.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin/projects')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Projects
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
              title="Create a task for this project"
            >
              <ListChecks size={14} /> New task
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/partners/${project.partnerId}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Open partner <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <WorkItemCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          kind="task"
          allowProject={false}
          allowTask
          partnerOptions={[{ id: project.partnerId, label: partner?.profile?.fullName ? `${partner.profile.fullName} (${project.partnerId.slice(0, 6)})` : project.partnerId }]}
          projectOptions={[{ id: project.id, label: project.title }]}
          defaultPartnerId={project.partnerId}
          defaultScope={(project as any).scope ?? 'personal'}
          defaultProjectId={project.id}
          enabledTaskStages={(getWorkboardSettings().taskStages || []).filter((s) => !s.disabled).map((s) => ({ id: s.id, label: s.label }))}
          enabledProjectStages={(getWorkboardSettings().projectStages || []).filter((s) => !s.disabled).map((s) => ({ id: s.id, label: s.label }))}
          onCreateTask={(args) => {
            createTask({
              partnerId: project.partnerId,
              scope: (project as any).scope ?? 'personal',
              projectId: project.id,
              title: args.title,
              kind: 'general',
              stage: args.stage as any,
              priority: args.priority as any,
              status: 'pending',
              dueAt: args.dueAt,
              notes: args.notes,
              tags: args.tags,
              assignedTo: 'both',
              visibility: 'hybrid',
            } as any);
            setVersion((v) => v + 1);
          }}
          onCreateProject={() => {}}
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400">
                <FolderKanban size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Project</span>
              </div>
              <div className="mt-2 text-white font-semibold">{project.title}</div>
              <div className="mt-1 text-white/60 text-sm">{partner?.profile.fullName ?? project.partnerId}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                stage:{project.stage} • status:{project.status} • updated {fmtWhen(project.updatedAt)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={project.stage}
                onChange={(e) => setProjectStage(project.id, e.target.value as any)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
              >
                {enabledProjectStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                value={project.status}
                onChange={(e) => setProjectStatus(project.id, e.target.value as any)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
              >
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
              </select>
            </div>
          </div>
        </div>

        <WorkBoardShell
          view={view}
          onViewChange={setView}
          stages={progressStages}
          stageFilter={taskCategoryFilter}
          onStageFilterChange={setTaskCategoryFilter}
          stageFilterStages={taskStageDefs}
        />

        {view === 'kanban' ? (
          <WorkKanbanBoard
            stages={progressStages}
            items={taskItems}
            onStageChange={(id, stageId) => {
              const t = filteredTasksById.get(id) ?? tasksById.get(id);
              if (!t) return;
              setTaskStatus(t.id, stageId as TaskStatus);
            }}
            cardMeta={(it) => {
              const t = filteredTasksById.get(it.id) ?? tasksById.get(it.id);
              if (!t) return null;
              const badge = priorityBadge(t.priority);
              const blocked = (t.blockedByTaskIds ?? []).some((bid) => tasksById.get(bid)?.status !== 'completed');
              return (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    {(categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake'))} • {t.kind} • {t.status} • due{' '}
                    {fmtWhen(t.dueAt)}
                  </div>
                  {blocked ? (
                    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-200">
                      <ShieldAlert size={12} /> Blocked by dependencies
                    </div>
                  ) : null}
                  <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
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
                    <select
                      value={(t.stage ?? 'intake') as any}
                      onChange={(e) => upsertTask({ ...t, stage: e.target.value as any })}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                      title="Move stage"
                    >
                      {enabledTaskStages.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskStatus(t.id, 'in_progress')}
                      disabled={t.status !== 'pending' || blocked}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskStatus(t.id, 'completed')}
                      disabled={t.status === 'completed'}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={14} /> Done
                    </button>
                    <button
                      type="button"
                      onClick={() => upsertTask({ ...t, notes: `${t.notes ? `${t.notes}\n` : ''}[Ops note] ` })}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                      title="Add an ops note"
                    >
                      <Sparkles size={14} /> Note
                    </button>
                  </div>
                </div>
              );
            }}
          />
        ) : view === 'calendar' ? (
          <WorkCalendarView
            items={taskItems}
            stageColorById={Object.fromEntries(progressStages.map((s) => [s.id, String((s as any).color || '')])) as any}
            dateForItem={(it) => it.dueAt}
            emptyHint="Only tasks with a due date appear here."
          />
        ) : (
          <WorkListView
            stages={progressStages}
            items={taskItems}
            onStageChange={(id, stageId) => {
              const t = filteredTasksById.get(id) ?? tasksById.get(id);
              if (!t) return;
              setTaskStatus(t.id, stageId as TaskStatus);
            }}
          />
        )}
      </div>
    </PageShell>
  );
}

