import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ListChecks, Plus } from 'lucide-react';
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
import { tasksToBoardItems } from '../../../lib/workBoardItems';
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
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../os/finelyOsLightUi';

export type WorkHubRole = 'partner' | 'admin';
export type WorkHubTab = 'projects' | 'tasks';
export type WorkHubScope = 'personal' | 'business' | 'all';

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
  const [version, setVersion] = useState(0);
  const [internalTab, setInternalTab] = useState<WorkHubTab>(initialTab);
  const tab = controlledTab ?? internalTab;
  const setTab = (next: WorkHubTab) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };
  const [taskView, setTaskView] = useState<WorkViewMode>('kanban');
  const [projectView, setProjectView] = useState<'journey' | 'list'>('journey');
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

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [version]);
  const projectStageDefs = useMemo(() => getWorkboardSettings().projectStages, [version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);
  const enabledProjectStages = useMemo(() => projectStageDefs.filter((s) => !s.disabled), [projectStageDefs]);
  const taskStageLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const projectStageLabelById = useMemo(() => new Map(projectStageDefs.map((s) => [s.id, s.label])), [projectStageDefs]);

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
        stageLabelById: taskStageLabelById,
        categoryFilter: taskCategoryFilter,
      }),
    [scopedTasks, projectTitleById, taskStageLabelById, taskCategoryFilter],
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

  const tabClass = (active: boolean, accent: 'emerald' | 'violet' = 'emerald') => finelyOsViewTab(active, accent);

  const partnerOptions =
    role === 'admin'
      ? Array.from(partnerById.values()).map((p) => ({
          id: p.id,
          label: p.profile.fullName || p.profile.email || p.id,
        }))
      : partner
        ? [{ id: partner.id, label: partner.profile.fullName || partner.profile.email || partner.id }]
        : [];

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-3">
        {!controlledTab ? (
          <div className={FINELY_OS_VIEW_TABS}>
            <button type="button" onClick={() => setTab('projects')} className={tabClass(tab === 'projects', 'violet')}>
              <FolderKanban size={14} /> Projects
            </button>
            <button type="button" onClick={() => setTab('tasks')} className={tabClass(tab === 'tasks', 'emerald')}>
              <ListChecks size={14} /> Tasks
            </button>
          </div>
        ) : null}

        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as WorkHubScope)}
          className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          title="Credit scope"
        >
          {role === 'admin' ? <option value="all">All scopes</option> : null}
          <option value="personal">Personal credit</option>
          <option value="business">Business credit</option>
        </select>

        {tab === 'tasks' ? (
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {openTasks.length} open · {scopedTasks.length} total
          </span>
        ) : (
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {scopedProjects.length} project{scopedProjects.length === 1 ? '' : 's'}
          </span>
        )}

        {role === 'admin' ? (
          <button type="button" onClick={() => setCreateOpen(true)} className={`${FINELY_OS_PRIMARY_BTN} ml-auto`}>
            <Plus size={14} /> New {tab === 'tasks' ? 'task' : 'project'}
          </button>
        ) : null}
      </div>

      {tab === 'projects' ? (
        <div className="space-y-4">
          {role === 'admin' ? (
            <div className={FINELY_OS_VIEW_TABS}>
              <button type="button" onClick={() => setProjectView('journey')} className={tabClass(projectView === 'journey', 'emerald')}>
                Journey board
              </button>
              <button type="button" onClick={() => setProjectView('list')} className={tabClass(projectView === 'list', 'violet')}>
                List
              </button>
            </div>
          ) : null}

          <div className={FINELY_OS_BOARD_SHELL}>
            {scopedProjects.length === 0 ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-6 text-center ${FINELY_OS_ENTITY_BODY}`}>
                No projects in this scope yet.
              </div>
            ) : projectView === 'journey' || role === 'partner' ? (
              <WorkProjectJourneyBoard
                projects={scopedProjects}
                partnerById={partnerById}
                taskStats={taskStats}
                enabledStages={enabledProjectStages}
                slaByProject={slaByProject}
                onOpenProject={(id) => navigate(`${workspaceBasePath}/${id}`)}
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
              <WorkProjectsListTable
                projects={scopedProjects}
                partnerById={partnerById}
                taskStats={taskStats}
                enabledStages={enabledProjectStages}
                onOpenProject={(id) => navigate(`${workspaceBasePath}/${id}`)}
                onProjectStageChange={(id, st) => {
                  setProjectStage(id, st);
                  bump();
                }}
                onProjectStatusChange={(id, st) => {
                  setProjectStatus(id, st);
                  bump();
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <ProjectsTasksMasterPanel
            projects={scopedProjects}
            selectedId={selectedProjectId}
            onSelect={setSelectedProjectId}
            onOpenProject={(id) => navigate(`${workspaceBasePath}/${id}`)}
            onCreateProject={role === 'admin' ? () => setCreateOpen(true) : undefined}
            showCreateButton={role === 'admin'}
            stageLabelById={projectStageLabelById}
            taskCountByProject={taskCountByProject}
          />

          <div className={`flex-1 min-w-0 ${finelyOsCatalogCard('emerald')} !p-4 space-y-4`}>
            <WorkBoardShell
              view={taskView}
              onViewChange={setTaskView}
              stages={TASK_PROGRESS_STAGES}
              stageFilter={taskCategoryFilter}
              onStageFilterChange={setTaskCategoryFilter}
              stageFilterStages={enabledTaskStages}
              allowedViews={role === 'partner' ? ['kanban', 'calendar', 'list'] : ['kanban', 'list', 'calendar']}
            />

            {scopedTasks.length === 0 ? (
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm py-8 text-center`}>
                No tasks yet{selectedProjectId ? ' for this project' : ''}.{' '}
                {role === 'partner' ? 'Your coach will add action items here.' : 'Create one or generate from Letters.'}
              </div>
            ) : taskView === 'kanban' ? (
              <WorkKanbanBoard
                stages={TASK_PROGRESS_STAGES}
                items={taskItems}
                onStageChange={handleTaskStageChange}
                onOpenItem={handleOpenTask}
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
                stageColorById={Object.fromEntries(TASK_PROGRESS_STAGES.map((s) => [s.id, String((s as { color?: string }).color || '')]))}
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
