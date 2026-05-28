import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FolderKanban, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { createProject, listProjects, setProjectStage, setProjectStatus } from '../../data/projectsRepo';
import { getPartner, listPartnersByTenant } from '../../data/partnersRepo';
import { listTasks } from '../../data/tasksRepo';
import type { ProjectStage } from '../../domain/projects';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { PROJECT_PROGRESS_STAGES, WorkBoardShell, WorkCalendarView, WorkKanbanBoard } from '../../components/workboard';
import { WorkItemCreateModal } from '../../components/workboard/WorkItemCreateModal';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<ProjectStage | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [scope, setScope] = useState<'all' | 'personal' | 'business'>('all');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const projects = useMemo(() => listProjects(), [version]);
  const tasks = useMemo(() => listTasks(), [version]);

  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partnerById, setPartnerById] = useState<Map<string, import('../../domain/partners').Partner>>(new Map());
  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIds(new Set()); setPartnerById(new Map()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then((ids) => {
      setPartnerIds(ids);
      listPartnersByTenant(tenantId).then((all) => {
        setPartnerById(new Map(all.filter((p) => ids.has(p.id)).map((p) => [p.id, p])));
      });
    });
  }, [auth.user, version]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (!partnerIds.has(p.partnerId)) return false;
      if (scope !== 'all' && (p.scope ?? 'personal') !== scope) return false;
      if (stage !== 'all' && p.stage !== stage) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (!q) return true;
      const partner = partnerById.get(p.partnerId) ?? null;
      const hay = [p.title, p.partnerId, partner?.profile.fullName ?? '', p.tags.join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [partnerIds, projects, query, scope, stage, status]);

  const stageDefs = useMemo(() => getWorkboardSettings().projectStages, [version]);
  const enabledStages = useMemo(() => stageDefs.filter((s) => !s.disabled), [stageDefs]);
  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);

  const [createOpen, setCreateOpen] = useState(false);

  const taskStats = useMemo(() => {
    const byProject = new Map<string, { open: number; total: number }>();
    for (const t of tasks) {
      if (!t.partnerId || !partnerIds.has(t.partnerId)) continue;
      const pid = t.projectId;
      if (!pid) continue;
      const cur = byProject.get(pid) ?? { open: 0, total: 0 };
      cur.total++;
      if (t.status === 'pending' || t.status === 'in_progress') cur.open++;
      byProject.set(pid, cur);
    }
    return byProject;
  }, [partnerIds, tasks]);

  const projectById = useMemo(() => new Map(filtered.map((p) => [p.id, p])), [filtered]);

  return (
    <PageShell badge="Admin" title="Projects" subtitle="DFY ops board across partners: stage, status, and open tasks.">
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
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              title="Create a project"
            >
              <FolderKanban size={14} /> New project
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/workflow')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
            >
              Workflow <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <WorkItemCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          kind="project"
          allowProject
          allowTask={false}
          partnerOptions={Array.from(partnerIds)
            .map((pid) => {
              const p = partnerById.get(pid) ?? null;
              return { id: pid, label: p?.profile?.fullName ? `${p.profile.fullName} (${pid.slice(0, 6)})` : pid };
            })
            .sort((a, b) => a.label.localeCompare(b.label))}
          projectOptions={[]}
          defaultScope="personal"
          enabledTaskStages={enabledTaskStages.map((s) => ({ id: s.id, label: s.label }))}
          enabledProjectStages={enabledStages.map((s) => ({ id: s.id, label: s.label }))}
          onCreateTask={() => {}}
          onCreateProject={(args) => {
            createProject({
              partnerId: args.partnerId,
              scope: args.scope,
              title: args.title,
              stage: args.stage as any,
              status: args.status as any,
              tags: args.tags,
            } as any);
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
                placeholder="Search partner or project…"
                className="w-[360px] max-w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              showing {filtered.length} / {projects.length}
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
              value={stage}
              onChange={(e) => setStage(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="all">All stages</option>
              {enabledStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
            </select>
          </div>
        </div>

        <WorkBoardShell view={view} onViewChange={setView} stages={PROJECT_PROGRESS_STAGES} />

        {view === 'kanban' ? (
          <WorkKanbanBoard
            stages={PROJECT_PROGRESS_STAGES}
            items={filtered.map((p) => {
              const partner = partnerById.get(p.partnerId) ?? null;
              const phaseLabel = enabledStages.find((s) => s.id === p.stage)?.label ?? p.stage;
              return {
                id: p.id,
                title: p.title,
                subtitle: `${partner?.profile.fullName ?? p.partnerId} • ${phaseLabel}`,
                stage: p.status,
                status: p.status,
                updatedAt: p.updatedAt,
                tags: p.tags,
              };
            })}
            onStageChange={(id, stageId) => setProjectStatus(id, stageId as any)}
            onOpenItem={(id) => navigate(`/admin/projects/${id}`)}
            cardMeta={(it) => {
              const stat = taskStats.get(it.id) ?? { open: 0, total: 0 };
              const p = projectById.get(it.id) ?? null;
              return (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    phase:{String(p?.stage ?? '—')} • updated {fmtWhen(it.updatedAt || '')}
                  </div>
                  <div className="inline-flex items-center gap-2 text-white/70 text-sm">
                    <Sparkles size={14} className="text-amber-400" />
                    <span className="font-mono text-[11px]">
                      {stat.open} open / {stat.total}
                    </span>
                  </div>
                  <div>
                    <select
                      value={String(p?.stage ?? 'intake')}
                      onChange={(e) => setProjectStage(it.id, e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                      title="Project phase"
                    >
                      {enabledStages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={it.status ?? 'active'}
                      onChange={(e) => setProjectStatus(it.id, e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                      title="Status"
                    >
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="completed">completed</option>
                    </select>
                  </div>
                </div>
              );
            }}
          />
        ) : view === 'calendar' ? (
          <WorkCalendarView
            items={filtered.map((p) => {
              const partner = partnerById.get(p.partnerId) ?? null;
              return {
                id: p.id,
                title: p.title,
                subtitle: partner?.profile.fullName ?? p.partnerId,
                stage: p.status,
                status: p.status,
                updatedAt: p.updatedAt,
              };
            })}
            stageColorById={Object.fromEntries(PROJECT_PROGRESS_STAGES.map((s) => [s.id, String((s as any).color || '')])) as any}
            dateForItem={(it) => it.updatedAt}
            emptyHint="Calendar uses last-updated timestamps (projects don’t have due dates yet)."
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-0 px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40 font-mono">
              <div className="col-span-4">Project</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Tasks</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6 text-white/60">No projects match your filters.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {filtered.slice(0, 250).map((p) => {
                  const partner = partnerById.get(p.partnerId) ?? null;
                  const stat = taskStats.get(p.id) ?? { open: 0, total: 0 };
                  return (
                    <div key={p.id} className="px-5 py-4">
                      <div className="grid grid-cols-12 gap-3 items-start">
                        <div className="col-span-4 min-w-0">
                          <div className="text-white font-semibold truncate">{p.title}</div>
                          <div className="mt-1 text-white/60 text-sm truncate">{partner?.profile.fullName ?? p.partnerId}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            updated {fmtWhen(p.updatedAt)}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <select
                            value={p.stage}
                            onChange={(e) => setProjectStage(p.id, e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                          >
                            {enabledStages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <select
                            value={p.status}
                            onChange={(e) => setProjectStatus(p.id, e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px]"
                          >
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="completed">completed</option>
                          </select>
                        </div>
                        <div className="col-span-2 text-white/70 text-sm">
                          <div className="inline-flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="font-mono text-[11px]">
                              {stat.open} open / {stat.total}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/projects/${p.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                          >
                            <FolderKanban size={14} /> Open
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

