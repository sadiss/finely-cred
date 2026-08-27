import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, FolderKanban, ListChecks, Plus, Shield, UserRound } from 'lucide-react';
import type { Partner } from '../../../domain/partners';
import type { Project } from '../../../domain/projects';
import type { TaskItem, TaskStatus } from '../../../domain/tasks';
import { listProjects, listProjectsByPartner, createProject, setProjectStage, setProjectStatus } from '../../../data/projectsRepo';
import { listTasks, listTasksByPartner, createTask, setTaskStatus } from '../../../data/tasksRepo';
import { getWorkboardSettings } from '../../../data/settingsRepo';
import {
  AdminOpsWorkHubPanel,
  PartnerWorkHubPanel,
  ProjectsTasksMasterPanel,
  PROJECT_PROGRESS_STAGES,
  TASK_PROGRESS_STAGES,
  TaskDetailModal,
  WorkBoardShell,
  WorkCalendarView,
  WorkKanbanBoard,
  WorkListView,
  type WorkBoardItem,
  type WorkViewMode,
} from '../../../components/workboard';
import { WorkProjectJourneyBoard, WorkProjectsListTable } from './WorkProjectJourneyBoard';
import { WorkItemCreateModal } from '../../../components/workboard/WorkItemCreateModal';
import { projectsToBoardItems, tasksToBoardItems } from '../../../lib/workBoardItems';
import type { AdminVisibilityFilter } from '../../../lib/workVisibility';
import {
  filterProjectsForAdminView,
  filterTasksForAdminView,
  listPartnerPortalProjects,
  listPartnerPortalTasks,
} from '../../../lib/workVisibility';
import { listAllSlaBreaches } from '../sla/listSlaBreaches';
import {
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCardCompact,
  finelyOsViewTab,
} from '../../os/finelyOsLightUi';
import './workBoardCards.css';

export type WorkHubRole = 'partner' | 'admin';
export type WorkHubTab = 'projects' | 'tasks';
export type WorkHubScope = 'personal' | 'business' | 'all';
export type WorkProjectViewMode = 'journey' | 'list' | 'calendar';

type Props = {
  role: WorkHubRole;
  /** Partner portal — required when role=partner */
  partnerId?: string;
  partner?: Partner | null;
  /** Admin — scoped partner ids */
  partnerIds?: Set<string>;
  partnerById?: Map<string, Partner>;
  initialTab?: WorkHubTab;
  /** When set, hub tab is controlled by parent (hides internal tab bar). */
  controlledTab?: WorkHubTab;
  onTabChange?: (tab: WorkHubTab) => void;
  workspaceBasePath: string;
  /** Hide role hero when nested in FinelyUnifiedHubLayout */
  compactHero?: boolean;
};

function taskCountsByProject(tasks: TaskItem[]) {
  const map = new Map<string, { open: number; done: number }>();
  for (const t of tasks) {
    if (!t.projectId) continue;
    const cur = map.get(t.projectId) ?? { open: 0, done: 0 };
    if (t.status === 'completed') cur.done++;
    else cur.open++;
    map.set(t.projectId, cur);
  }
  return map;
}

function partnerLabelById(partnerById: Map<string, Partner>) {
  return new Map(
    Array.from(partnerById.entries()).map(([id, p]) => [id, p.profile.fullName || p.profile.email || id]),
  );
}

export function WorkTasksProjectsHub({
  role,
  partnerId,
  partner,
  partnerIds = new Set(),
  partnerById = new Map(),
  initialTab = 'projects',
  controlledTab,
  onTabChange,
  workspaceBasePath,
  compactHero = false,
}: Props) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [version, setVersion] = useState(0);
  const [internalTab, setInternalTab] = useState<WorkHubTab>(initialTab);
  const tab = controlledTab ?? internalTab;
  const setTab = (next: WorkHubTab) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };

  useEffect(() => {
    if (controlledTab === undefined) setInternalTab(initialTab);
  }, [controlledTab, initialTab]);

  const [taskView, setTaskView] = useState<WorkViewMode>('kanban');
  const [projectView, setProjectView] = useState<WorkProjectViewMode>('journey');
  const [scope, setScope] = useState<WorkHubScope>(role === 'partner' ? 'personal' : 'all');
  const [visibilityFilter, setVisibilityFilter] = useState<AdminVisibilityFilter>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string | 'all'>('all');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const createKind = new URLSearchParams(search).get('create');
    if (role !== 'admin' || (createKind !== 'project' && createKind !== 'task' && createKind !== '1')) return;
    const nextTab: WorkHubTab = createKind === 'task' ? 'tasks' : 'projects';
    if (controlledTab === undefined) setInternalTab(nextTab);
    else onTabChange?.(nextTab);
    setCreateOpen(true);
  }, [controlledTab, onTabChange, role, search]);

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const projectStageDefs = useMemo(() => getWorkboardSettings().projectStages, [version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);
  const enabledProjectStages = useMemo(() => projectStageDefs.filter((s) => !s.disabled), [projectStageDefs]);
  const taskStageLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const projectStageLabelById = useMemo(() => new Map(projectStageDefs.map((s) => [s.id, s.label])), [projectStageDefs]);
  const partnerLabels = useMemo(() => partnerLabelById(partnerById), [partnerById]);

  const allProjects = useMemo(() => {
    if (role === 'partner' && partnerId) {
      return listPartnerPortalProjects(listProjectsByPartner(partnerId));
    }
    return listProjects().filter((p) => partnerIds.has(p.partnerId));
  }, [role, partnerId, partnerIds, version]);

  const scopedProjects = useMemo(() => {
    let list = allProjects;
    if (scope !== 'all') list = list.filter((p) => (p.scope ?? 'personal') === scope);
    if (role === 'admin') list = filterProjectsForAdminView(list, visibilityFilter);
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [allProjects, scope, role, visibilityFilter]);

  const allTasks = useMemo(() => {
    if (role === 'partner' && partnerId) {
      return listPartnerPortalTasks(listTasksByPartner(partnerId));
    }
    return listTasks().filter((t) => partnerIds.has(t.partnerId));
  }, [role, partnerId, partnerIds, version]);

  const scopedTasks = useMemo(() => {
    let list = allTasks;
    if (selectedProjectId) list = list.filter((t) => t.projectId === selectedProjectId);
    if (scope !== 'all') {
      const projectIds = new Set(scopedProjects.map((p) => p.id));
      list = list.filter((t) => !t.projectId || projectIds.has(t.projectId));
    }
    if (role === 'admin') list = filterTasksForAdminView(list, visibilityFilter);
    return list;
  }, [allTasks, selectedProjectId, scope, scopedProjects, role, visibilityFilter]);

  const openTasks = useMemo(
    () => scopedTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [scopedTasks],
  );
  const doneTasks = useMemo(() => scopedTasks.filter((t) => t.status === 'completed'), [scopedTasks]);

  const projectTitleById = useMemo(() => new Map(scopedProjects.map((p) => [p.id, p.title])), [scopedProjects]);
  const taskCountByProject = useMemo(() => taskCountsByProject(allTasks), [allTasks]);

  const taskItems: WorkBoardItem[] = useMemo(
    () =>
      tasksToBoardItems(scopedTasks, {
        projectTitleById,
        partnerLabelById: role === 'admin' ? partnerLabels : undefined,
        stageLabelById: taskStageLabelById,
        categoryFilter: taskCategoryFilter,
      }),
    [scopedTasks, projectTitleById, partnerLabels, taskStageLabelById, taskCategoryFilter, role],
  );

  const projectBoardItems = useMemo(
    () =>
      projectsToBoardItems(scopedProjects, {
        partnerLabelById: role === 'admin' ? partnerLabels : undefined,
        stageLabelById: projectStageLabelById,
      }),
    [scopedProjects, partnerLabels, projectStageLabelById, role],
  );

  const taskStats = useMemo(() => {
    const byProject = new Map<string, { open: number; total: number }>();
    for (const t of allTasks) {
      if (!t.projectId) continue;
      const cur = byProject.get(t.projectId) ?? { open: 0, total: 0 };
      cur.total++;
      if (t.status === 'pending' || t.status === 'in_progress') cur.open++;
      byProject.set(t.projectId, cur);
    }
    return byProject;
  }, [allTasks]);

  const slaByProject = useMemo(() => {
    if (role !== 'admin') return new Map<string, number>();
    const map = new Map<string, number>();
    for (const b of listAllSlaBreaches(partnerIds)) {
      if (b.projectId) map.set(b.projectId, (map.get(b.projectId) ?? 0) + 1);
    }
    return map;
  }, [role, partnerIds, version]);

  const detailTask = useMemo(
    () => (detailTaskId ? scopedTasks.find((t) => t.id === detailTaskId) ?? null : null),
    [detailTaskId, scopedTasks],
  );

  const sharedTaskCount = useMemo(() => allTasks.filter((t) => t.visibility !== 'admin').length, [allTasks]);
  const internalTaskCount = allTasks.length - sharedTaskCount;
  const sharedProjectCount = useMemo(
    () => allProjects.filter((p) => (p as Project & { visibility?: string }).visibility !== 'admin').length,
    [allProjects],
  );
  const internalProjectCount = allProjects.length - sharedProjectCount;

  const bump = () => {
    window.dispatchEvent(new Event('finely:store'));
    setVersion((v) => v + 1);
  };

  const handleTaskStageChange = (id: string, stageId: string) => {
    setTaskStatus(id, stageId as TaskStatus);
    bump();
  };

  const handleOpenTask = (id: string) => {
    const t = scopedTasks.find((x) => x.id === id);
    if (t?.projectId) {
      navigate(`${workspaceBasePath}/${t.projectId}?task=${id}&view=board`);
      return;
    }
    setDetailTaskId(id);
  };

  const handleOpenProject = (id: string) => {
    navigate(`${workspaceBasePath}/${id}`);
  };

  const tabClass = (active: boolean, accent: 'emerald' | 'violet' | 'sky' = 'emerald') => finelyOsViewTab(active, accent);

  const partnerOptions =
    role === 'admin'
      ? Array.from(partnerById.values()).map((p) => ({
          id: p.id,
          label: p.profile.fullName || p.profile.email || p.id,
        }))
      : partner
        ? [{ id: partner.id, label: partner.profile.fullName || partner.profile.email || partner.id }]
        : [];

  const roleBadge =
    role === 'admin' ? (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-violet-200">
        <Shield size={12} /> All partners
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
        <UserRound size={12} /> Your items
      </span>
    );

  return (
    <div className={`${FINELY_OS_COMPACT_PAGE} fc-work-board-page`}>
      {!compactHero ? (
        role === 'partner' ? (
          <PartnerWorkHubPanel
            kind={tab}
            scope={scope === 'all' ? 'personal' : scope}
            openCount={openTasks.length}
            doneCount={doneTasks.length}
          />
        ) : (
          <AdminOpsWorkHubPanel
            kind={tab}
            visibilityFilter={visibilityFilter}
            onVisibilityFilterChange={setVisibilityFilter}
            totalCount={tab === 'tasks' ? allTasks.length : allProjects.length}
            sharedCount={tab === 'tasks' ? sharedTaskCount : sharedProjectCount}
            internalCount={tab === 'tasks' ? internalTaskCount : internalProjectCount}
            partnerCount={partnerIds.size}
          />
        )
      ) : null}

      <div className={`${finelyOsCatalogCardCompact('sky')} flex flex-wrap items-center gap-3 !py-3`}>
        {role === 'admin' ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-gradient-to-r from-emerald-700 to-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_14px_28px_-18px_rgba(16,185,129,0.9)] transition hover:brightness-110"
          >
            <Plus size={16} /> Create {tab === 'tasks' ? 'task' : 'project'}
          </button>
        ) : null}

        {!controlledTab ? (
          <div className={FINELY_OS_VIEW_TABS}>
            <button type="button" onClick={() => setTab('projects')} className={tabClass(tab === 'projects', 'violet')}>
              <FolderKanban size={14} /> Projects
            </button>
            <button type="button" onClick={() => setTab('tasks')} className={tabClass(tab === 'tasks', 'emerald')}>
              <ListChecks size={14} /> My tasks
            </button>
          </div>
        ) : null}

        {roleBadge}

        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as WorkHubScope)}
          className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          title="Credit scope"
          aria-label="Credit scope"
        >
          {role === 'admin' ? <option value="all">All scopes</option> : null}
          <option value="personal">Personal credit</option>
          <option value="business">Business credit</option>
        </select>

        {tab === 'tasks' ? (
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {openTasks.length} open · {scopedTasks.length} total
            {selectedProjectId ? ' · filtered' : ''}
          </span>
        ) : (
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {scopedProjects.length} project{scopedProjects.length === 1 ? '' : 's'}
          </span>
        )}

      </div>

      {tab === 'projects' ? (
        <div className="space-y-3">
          <div className={FINELY_OS_VIEW_TABS}>
            <button type="button" onClick={() => setProjectView('journey')} className={tabClass(projectView === 'journey', 'emerald')}>
              Journey board
            </button>
            {role === 'admin' ? (
              <button type="button" onClick={() => setProjectView('list')} className={tabClass(projectView === 'list', 'violet')}>
                List
              </button>
            ) : null}
            <button type="button" onClick={() => setProjectView('calendar')} className={tabClass(projectView === 'calendar', 'sky')}>
              <CalendarDays size={14} /> Calendar
            </button>
          </div>

          <div className={FINELY_OS_BOARD_SHELL}>
            {scopedProjects.length === 0 ? (
              <div className={`${finelyOsCatalogCardCompact('violet')} text-center ${FINELY_OS_ENTITY_BODY}`}>
                No projects in this scope yet.
                {role === 'partner' ? ' Your coach will add restoration projects here.' : ' Create one to get started.'}
              </div>
            ) : projectView === 'journey' ? (
              <WorkProjectJourneyBoard
                projects={scopedProjects}
                partnerById={partnerById}
                taskStats={taskStats}
                enabledStages={enabledProjectStages}
                slaByProject={slaByProject}
                onOpenProject={handleOpenProject}
                onProjectStageChange={(id, st) => {
                  setProjectStage(id, st);
                  bump();
                }}
                onProjectStatusChange={(id, st) => {
                  setProjectStatus(id, st);
                  bump();
                }}
              />
            ) : projectView === 'list' ? (
              <WorkProjectsListTable
                projects={scopedProjects}
                partnerById={partnerById}
                taskStats={taskStats}
                enabledStages={enabledProjectStages}
                onOpenProject={handleOpenProject}
                onProjectStageChange={(id, st) => {
                  setProjectStage(id, st);
                  bump();
                }}
                onProjectStatusChange={(id, st) => {
                  setProjectStatus(id, st);
                  bump();
                }}
              />
            ) : (
              <WorkCalendarView
                items={projectBoardItems}
                stageColorById={Object.fromEntries(
                  PROJECT_PROGRESS_STAGES.map((s) => [s.id, String((s as { color?: string }).color || '')]),
                )}
                dateForItem={(it) => it.dueAt || it.updatedAt}
                emptyHint="Calendar uses target close dates for projects, else last updated."
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-3">
          <ProjectsTasksMasterPanel
            projects={scopedProjects}
            selectedId={selectedProjectId}
            onSelect={setSelectedProjectId}
            onOpenProject={handleOpenProject}
            onCreateProject={role === 'admin' ? () => setCreateOpen(true) : undefined}
            showCreateButton={role === 'admin'}
            stageLabelById={projectStageLabelById}
            taskCountByProject={taskCountByProject}
          />

          <div className={`flex-1 min-w-0 ${finelyOsCatalogCardCompact('emerald')} space-y-3`}>
            <WorkBoardShell
              view={taskView}
              onViewChange={setTaskView}
              stages={TASK_PROGRESS_STAGES}
              stageFilter={taskCategoryFilter}
              onStageFilterChange={setTaskCategoryFilter}
              stageFilterStages={enabledTaskStages}
              allowedViews={['kanban', 'list', 'calendar']}
            />

            {scopedTasks.length === 0 ? (
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm py-6 text-center`}>
                No tasks yet{selectedProjectId ? ' for this project' : ''}.{' '}
                {role === 'partner' ? 'Your coach will add action items here.' : 'Create one or generate from Letters.'}
              </div>
            ) : taskView === 'kanban' ? (
              <WorkKanbanBoard
                stages={TASK_PROGRESS_STAGES}
                items={taskItems}
                onStageChange={handleTaskStageChange}
                onOpenItem={handleOpenTask}
                enableDnd
              />
            ) : taskView === 'list' ? (
              <WorkListView
                stages={TASK_PROGRESS_STAGES}
                items={taskItems}
                onStageChange={handleTaskStageChange}
                onOpenItem={handleOpenTask}
              />
            ) : (
              <WorkCalendarView
                items={taskItems}
                stageColorById={Object.fromEntries(
                  TASK_PROGRESS_STAGES.map((s) => [s.id, String((s as { color?: string }).color || '')]),
                )}
                dateForItem={(it) => it.dueAt || it.updatedAt}
                emptyHint="Calendar uses due dates for tasks, else updatedAt."
              />
            )}
          </div>
        </div>
      )}

      {detailTask ? (
        <TaskDetailModal
          open
          task={detailTask}
          projectTitle={detailTask.projectId ? projectTitleById.get(detailTask.projectId) : undefined}
          enabledTaskStages={enabledTaskStages}
          onClose={() => setDetailTaskId(null)}
          onSaved={bump}
        />
      ) : null}

      {role === 'admin' ? (
        <WorkItemCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          kind={tab === 'tasks' ? 'task' : 'project'}
          allowProject={tab === 'projects'}
          allowTask={tab === 'tasks'}
          partnerOptions={partnerOptions}
          projectOptions={scopedProjects.map((p) => ({ id: p.id, label: p.title }))}
          defaultPartnerId={partnerOptions[0]?.id}
          defaultProjectId={selectedProjectId ?? scopedProjects[0]?.id}
          enabledTaskStages={enabledTaskStages}
          enabledProjectStages={enabledProjectStages}
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
            bump();
          }}
          onCreateTask={(args) => {
            createTask({
              partnerId: args.partnerId,
              scope: args.scope,
              projectId: args.projectId,
              title: args.title,
              kind: args.kind,
              stage: args.stage,
              priority: args.priority,
              status: 'pending',
              dueAt: args.dueAt,
              notes: args.notes,
              tags: args.tags,
              visibility: args.visibility,
              assignedTo: 'both',
            });
            setCreateOpen(false);
            bump();
          }}
        />
      ) : null}
    </div>
  );
}

export default WorkTasksProjectsHub;
