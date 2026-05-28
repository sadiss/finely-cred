import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ListChecks, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { listPartnersByTenant } from '../../data/partnersRepo';
import { createTask, listTasks, setTaskStatus, upsertTask } from '../../data/tasksRepo';
import { createProject, listProjects } from '../../data/projectsRepo';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { TASK_PROGRESS_STAGES, WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';
import { WorkItemCreateModal } from '../../components/workboard/WorkItemCreateModal';

function fmtWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminTasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  const [version, setVersion] = useState(0);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'personal' | 'business'>('all');
  const [projectId, setProjectId] = useState<string | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<string | 'all'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<'task' | 'project'>('task');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const wantsCreate =
      location.pathname.endsWith('/new') ||
      new URLSearchParams(location.search).get('create') === '1';
    if (wantsCreate) {
      setCreateKind('task');
      setCreateOpen(true);
    }
  }, [location.pathname, location.search]);

  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partnerById, setPartnerById] = useState<Map<string, import('../../domain/partners').Partner>>(new Map());
  useEffect(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    if (!u) { setPartnerIds(new Set()); setPartnerById(new Map()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then((ids) => {
      setPartnerIds(ids);
      listPartnersByTenant(tenantId).then((all) => {
        setPartnerById(new Map(all.filter((p) => ids.has(p.id)).map((p) => [p.id, p])));
      });
    });
  }, [auth.user, version]);

  const tasks = useMemo(() => listTasks(), [version]);
  const projects = useMemo(() => listProjects(), [version]);

  const visibleProjects = useMemo(() => projects.filter((p) => partnerIds.has(p.partnerId)), [projects, partnerIds]);

  const categoryStageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const categoryLabelById = useMemo(() => new Map(categoryStageDefs.map((s) => [s.id, s.label])), [categoryStageDefs]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (!partnerIds.has(t.partnerId)) return false;
      if (scope !== 'all' && (t.scope ?? 'personal') !== scope) return false;
      if (projectId !== 'all' && String(t.projectId || '') !== projectId) return false;
      const st = String(t.stage ?? 'intake');
      if (stageFilter !== 'all' && st !== stageFilter) return false;
      if (!q) return true;
      const partner = partnerById.get(t.partnerId) ?? null;
      const project = t.projectId ? visibleProjects.find((p) => p.id === t.projectId) : null;
      const hay = [
        t.title,
        t.kind,
        t.partnerId,
        partner?.profile?.fullName ?? '',
        project?.title ?? '',
        st,
        (t.tags ?? []).join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [tasks, partnerIds, partnerById, query, scope, projectId, stageFilter, visibleProjects]);

  const items: WorkBoardItem[] = useMemo(
    () =>
      filteredTasks.map((t) => {
        const partner = partnerById.get(t.partnerId) ?? null;
        const proj = t.projectId ? visibleProjects.find((p) => p.id === t.projectId) : null;
        const categoryStage = String(t.stage ?? 'intake');
        return {
          id: t.id,
          title: t.title,
          subtitle: [
            partner?.profile?.fullName ?? t.partnerId,
            proj?.title ? `proj: ${proj.title}` : null,
            categoryLabelById.get(categoryStage) ?? categoryStage,
          ]
            .filter(Boolean)
            .join(' • '),
          stage: String(t.status ?? 'pending'),
          status: t.status,
          dueAt: t.dueAt,
          updatedAt: t.updatedAt,
          tags: t.tags,
        };
      }),
    [filteredTasks, categoryLabelById, visibleProjects],
  );

  const tasksById = useMemo(() => new Map(filteredTasks.map((t) => [t.id, t])), [filteredTasks]);

  const partnerOptions = useMemo(() => {
    return Array.from(partnerIds)
      .map((pid) => {
        const p = partnerById.get(pid) ?? null;
        return { id: pid, label: p?.profile?.fullName ? `${p.profile.fullName} (${pid.slice(0, 6)})` : pid };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [partnerIds, version]);

  const projectOptions = useMemo(() => {
    return visibleProjects
      .slice()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 600)
      .map((p) => {
        const partner = partnerById.get(p.partnerId) ?? null;
        const label = `${p.title} • ${(p.scope ?? 'personal')} • ${partner?.profile?.fullName ?? p.partnerId}`;
        return { id: p.id, label };
      });
  }, [visibleProjects, version]);

  return (
    <PageShell badge="Admin" title="Tasks" subtitle="Unified DFY ops task board across partners.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateKind('task');
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <ListChecks size={14} /> New task
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateKind('project');
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
            >
              New project
            </button>
          </div>
        </div>

        <WorkItemCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          kind={createKind}
          onKindChange={setCreateKind}
          allowProject
          allowTask
          partnerOptions={partnerOptions}
          projectOptions={projectOptions}
          enabledTaskStages={(getWorkboardSettings().taskStages || []).filter((s) => !s.disabled).map((s) => ({ id: s.id, label: s.label }))}
          enabledProjectStages={(getWorkboardSettings().projectStages || []).filter((s) => !s.disabled).map((s) => ({ id: s.id, label: s.label }))}
          onCreateTask={(args) => {
            createTask({
              partnerId: args.partnerId,
              scope: args.scope,
              projectId: args.projectId,
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
            window.dispatchEvent(new Event('finely:store'));
            setVersion((v) => v + 1);
          }}
          onCreateProject={(args) => {
            createProject({
              partnerId: args.partnerId,
              scope: args.scope,
              title: args.title,
              stage: args.stage as any,
              status: args.status as any,
              tags: args.tags,
            } as any);
            window.dispatchEvent(new Event('finely:store'));
            setVersion((v) => v + 1);
          }}
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              <Search size={16} className="text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search task / partner / project…"
                className="w-[360px] max-w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              showing {filteredTasks.length} / {tasks.filter((t) => partnerIds.has(t.partnerId)).length}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              title="Scope"
            >
              <option value="all">All scopes</option>
              <option value="personal">personal</option>
              <option value="business">business</option>
            </select>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
              title="Project"
            >
              <option value="all">All projects</option>
              {projectOptions.slice(0, 200).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <WorkBoardShell
          view={view}
          onViewChange={setView}
          stages={TASK_PROGRESS_STAGES}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          stageFilterStages={categoryStageDefs}
        />

        {view === 'kanban' ? (
          <WorkKanbanBoard
            stages={TASK_PROGRESS_STAGES}
            items={items}
            onOpenItem={(id) => {
              const t = tasksById.get(id);
              if (!t) return;
              if (t.projectId) navigate(`/admin/projects/${t.projectId}`);
              else navigate(`/admin/partners/${t.partnerId}?tab=tasks`);
            }}
            onStageChange={(id, stageId) => {
              const t = tasksById.get(id);
              if (!t) return;
              setTaskStatus(t.id, stageId as any);
              setVersion((v) => v + 1);
            }}
            cardMeta={(it) => {
              const t = tasksById.get(it.id);
              if (!t) return null;
              const enabledCats = (categoryStageDefs ?? []).filter((s) => !s.disabled);
              return (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    {(categoryLabelById.get(String(t.stage ?? 'intake')) ?? String(t.stage ?? 'intake'))} • {t.kind} • {t.status} • due {fmtWhen(t.dueAt)}
                  </div>
                  <select
                    value={String(t.stage ?? 'intake')}
                    onChange={(e) => {
                      upsertTask({ ...t, stage: e.target.value as any });
                      setVersion((v) => v + 1);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                    title="Task category (workflow area)"
                  >
                    {enabledCats.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }}
          />
        ) : view === 'list' ? (
          <WorkListView
            stages={TASK_PROGRESS_STAGES}
            items={items}
            onStageChange={(id, stageId) => {
              const t = tasksById.get(id);
              if (!t) return;
              setTaskStatus(t.id, stageId as any);
              setVersion((v) => v + 1);
            }}
          />
        ) : (
          <WorkCalendarView
            items={items}
            stageColorById={Object.fromEntries(TASK_PROGRESS_STAGES.map((s) => [s.id, String((s as any).color || '')])) as any}
            dateForItem={(it) => it.dueAt}
            emptyHint="Only tasks with a due date appear here."
          />
        )}
      </div>
    </PageShell>
  );
}

