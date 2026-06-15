import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FolderKanban, Inbox, LayoutGrid, List, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createProject, listProjects, setProjectStage, setProjectStatus } from '../../../data/projectsRepo';
import { listPartnersByTenant } from '../../../data/partnersRepo';
import { listTasks } from '../../../data/tasksRepo';
import type { ProjectHealth, ProjectPriority, ProjectStage } from '../../../domain/projects';
import type { Partner } from '../../../domain/partners';
import { getWorkboardSettings } from '../../../data/settingsRepo';
import { getActiveTenantId } from '../../../tenancy/activeTenant';
import { useAuth } from '../../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../../tenancy/adminPartnerScope';
import { WorkItemCreateModal } from '../../../components/workboard/WorkItemCreateModal';
import type { AdminVisibilityFilter } from '../../../lib/workVisibility';
import { filterProjectsForAdminView } from '../../../lib/workVisibility';
import { listAllSlaBreaches } from '../sla/listSlaBreaches';
import { WorkProjectJourneyBoard, WorkProjectsListTable } from './WorkProjectJourneyBoard';
import { FINELY_OS_BACK_LINK, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_INPUT, FINELY_OS_PAGE, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, FINELY_OS_TOOLBAR, FINELY_OS_BOARD_SHELL, FINELY_OS_BANNER, FINELY_OS_KPI_ACCENTS, FINELY_OS_VIEW_TABS, finelyOsViewTab } from '../../os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../os/FinelyOsPageFooter';

type HubView = 'journey' | 'list';

export function WorkProjectsHub() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<HubView>('journey');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<ProjectStage | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [scope, setScope] = useState<'all' | 'personal' | 'business'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<AdminVisibilityFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<ProjectHealth | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partnerById, setPartnerById] = useState<Map<string, Partner>>(new Map());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

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

  const projects = useMemo(() => listProjects(), [version]);
  const tasks = useMemo(() => listTasks(), [version]);
  const stageDefs = useMemo(() => getWorkboardSettings().projectStages, [version]);
  const enabledStages = useMemo(() => stageDefs.filter((s) => !s.disabled), [stageDefs]);
  const enabledTaskStages = useMemo(() => getWorkboardSettings().taskStages.filter((s) => !s.disabled), [version]);

  const scopedProjects = useMemo(() => projects.filter((p) => partnerIds.has(p.partnerId)), [projects, partnerIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterProjectsForAdminView(
      scopedProjects.filter((p) => {
        if (scope !== 'all' && (p.scope ?? 'personal') !== scope) return false;
        if (stage !== 'all' && p.stage !== stage) return false;
        if (status !== 'all' && p.status !== status) return false;
        if (priorityFilter !== 'all' && (p.priority ?? 'normal') !== priorityFilter) return false;
        if (healthFilter !== 'all' && (p.health ?? 'green') !== healthFilter) return false;
        if (!q) return true;
        const partner = partnerById.get(p.partnerId) ?? null;
        const hay = [p.title, p.partnerId, partner?.profile.fullName ?? '', p.tags.join(' '), ...(p.labels ?? [])].join(' ').toLowerCase();
        return hay.includes(q);
      }),
      visibilityFilter,
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [scopedProjects, partnerById, query, scope, stage, status, visibilityFilter, priorityFilter, healthFilter]);

  const taskStats = useMemo(() => {
    const byProject = new Map<string, { open: number; total: number }>();
    for (const t of tasks) {
      if (!t.partnerId || !partnerIds.has(t.partnerId) || !t.projectId) continue;
      const cur = byProject.get(t.projectId) ?? { open: 0, total: 0 };
      cur.total++;
      if (t.status === 'pending' || t.status === 'in_progress') cur.open++;
      byProject.set(t.projectId, cur);
    }
    return byProject;
  }, [partnerIds, tasks]);

  const slaByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of listAllSlaBreaches(partnerIds)) {
      if (b.projectId) map.set(b.projectId, (map.get(b.projectId) ?? 0) + 1);
    }
    return map;
  }, [partnerIds, version]);

  const stats = useMemo(() => ({
    projects: scopedProjects.length,
    active: scopedProjects.filter((p) => p.status === 'active').length,
    openTasks: tasks.filter((t) => t.partnerId && partnerIds.has(t.partnerId) && (t.status === 'pending' || t.status === 'in_progress')).length,
    sla: listAllSlaBreaches(partnerIds).length,
  }), [scopedProjects, tasks, partnerIds, version]);

  const tabClass = (active: boolean, accent: 'emerald' | 'violet' = 'emerald') => finelyOsViewTab(active, accent);

  return (
    <div className={FINELY_OS_PAGE}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setCreateOpen(true)} className={FINELY_OS_PRIMARY_BTN}>
            <FolderKanban size={14} /> New project
          </button>
          <button type="button" onClick={() => navigate('/admin/my-tasks')} className={FINELY_OS_SECONDARY_BTN}>
            My tasks
          </button>
          <button type="button" onClick={() => navigate('/admin/projects/portfolio')} className={FINELY_OS_SECONDARY_BTN}>Portfolio</button>
          <button type="button" onClick={() => navigate('/admin/projects/templates')} className={FINELY_OS_SECONDARY_BTN}>
            <Sparkles size={14} className="inline" /> Templates
          </button>
          <button type="button" onClick={() => navigate('/admin/workflow')} className={FINELY_OS_SECONDARY_BTN}>
            Ops inbox <ArrowRight size={14} className="inline" />
          </button>
        </div>
      </div>

      <div className={FINELY_OS_BANNER}>
        <Inbox className="text-emerald-300 shrink-0 mt-0.5" size={18} />
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Work OS — journey pipeline by credit phase. <strong className="text-white/90">Drag cards</strong> to the next phase or open the workspace for tasks & Copilot Pro.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Projects', value: stats.projects },
          { label: 'Active', value: stats.active },
          { label: 'Open tasks', value: stats.openTasks },
          { label: 'SLA breaches', value: stats.sla, tone: stats.sla ? 'text-rose-700' : 'text-slate-900' },
        ].map((m, i) => (
          <div key={m.label} className={`rounded-xl border p-4 shadow-sm ${FINELY_OS_KPI_ACCENTS[i % FINELY_OS_KPI_ACCENTS.length]}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.label}</div>
            <div className={`text-2xl font-bold mt-1 ${m.tone ?? 'text-slate-900'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className={`${FINELY_OS_TOOLBAR} flex-wrap`}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search partner, project, tags…"
          className={`flex-1 min-w-[200px] ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}
        />
        <select value={stage} onChange={(e) => setStage(e.target.value as ProjectStage | 'all')} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All phases</option>
          {enabledStages.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All scopes</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>
        <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value as AdminVisibilityFilter)} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All visibility</option>
          <option value="partner_visible">Partner visible</option>
          <option value="internal">Internal only</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ProjectPriority | 'all')} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value as ProjectHealth | 'all')} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All health</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="red">Red</option>
        </select>
      </div>

      <div className={FINELY_OS_VIEW_TABS}>
        <button type="button" onClick={() => setView('journey')} className={tabClass(view === 'journey', 'emerald')}>
          <LayoutGrid size={14} /> Journey board
        </button>
        <button type="button" onClick={() => setView('list')} className={tabClass(view === 'list', 'violet')}>
          <List size={14} /> List
        </button>
      </div>

      <div className={FINELY_OS_BOARD_SHELL}>
        {view === 'journey' ? (
          <WorkProjectJourneyBoard
            projects={filtered}
            partnerById={partnerById}
            taskStats={taskStats}
            enabledStages={enabledStages}
            slaByProject={slaByProject}
            onOpenProject={(id) => navigate(`/admin/projects/${id}`)}
            onProjectStageChange={(id, st) => { setProjectStage(id, st); setVersion((v) => v + 1); }}
            onProjectStatusChange={(id, st) => { setProjectStatus(id, st); setVersion((v) => v + 1); }}
          />
        ) : (
          <WorkProjectsListTable
            projects={filtered}
            partnerById={partnerById}
            taskStats={taskStats}
            enabledStages={enabledStages}
            onOpenProject={(id) => navigate(`/admin/projects/${id}`)}
            onProjectStageChange={(id, st) => { setProjectStage(id, st); setVersion((v) => v + 1); }}
            onProjectStatusChange={(id, st) => { setProjectStatus(id, st); setVersion((v) => v + 1); }}
          />
        )}
      </div>

      <WorkItemCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind="project"
        allowProject
        allowTask={false}
        partnerOptions={Array.from(partnerById.values()).map((p) => ({ id: p.id, label: p.profile.fullName || p.profile.email || p.id }))}
        projectOptions={[]}
        enabledTaskStages={enabledTaskStages}
        enabledProjectStages={enabledStages}
        onCreateProject={(args) => {
          createProject({
            partnerId: args.partnerId,
            title: args.title,
            scope: args.scope,
            stage: args.stage,
            status: args.status,
            priority: args.priority,
            health: args.health,
            targetCloseAt: args.targetCloseAt,
            description: args.description,
            tags: args.tags,
            visibility: args.visibility,
          });
          setCreateOpen(false);
          setVersion((v) => v + 1);
        }}
        onCreateTask={() => {}}
      />

      <FinelyOsPageFooter />
    </div>
  );
}

export default WorkProjectsHub;
