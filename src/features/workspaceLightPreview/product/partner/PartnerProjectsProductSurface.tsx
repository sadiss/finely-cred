import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FolderKanban,
  Inbox,
  ListChecks,
  PlayCircle,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Project } from '../../../../domain/projects';
import type { TaskItem, TaskStatus } from '../../../../domain/tasks';
import type { Partner } from '../../../../domain/partners';
import { listProjectsByPartner, setProjectStage, setProjectStatus } from '../../../../data/projectsRepo';
import { listTasksByPartner, setTaskStatus } from '../../../../data/tasksRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { getWorkboardSettings } from '../../../../data/settingsRepo';
import { listPartnerPortalProjects, listPartnerPortalTasks } from '../../../../lib/workVisibility';
import { pickMostOverdueTask, partnerTaskDeepLink } from '../../../../lib/partnerWorkNavigation';
import { projectsToBoardItems, tasksToBoardItems } from '../../../../lib/workBoardItems';
import {
  PROJECT_PROGRESS_STAGES,
  TASK_PROGRESS_STAGES,
  TaskDetailModal,
  WorkBoardShell,
  WorkCalendarView,
  WorkKanbanBoard,
  WorkListView,
  type WorkBoardItem,
  type WorkViewMode,
} from '../../../../components/workboard';
import { WorkProjectJourneyBoard } from '../../../../features/work/views/WorkProjectJourneyBoard';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import PartnerProjectWorkspacePage from '../../../../pages/portal/PartnerProjectWorkspacePage';
import {
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

const MS_WEEK = 7 * 86_400_000;
const METRICS_VARIANT = 'jewel' as const;
const QUEUE_ACCENTS = ['violet', 'emerald', 'sky', 'rose'] as const;

type HubTab = 'projects' | 'tasks';
type ProjectViewMode = 'journey' | 'calendar';

function formatShortDate(iso?: string): string {
  if (!iso) return 'soon';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'soon';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFreshness(iso?: string): string {
  if (!iso) return 'no activity yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function isOpenTask(task: TaskItem): boolean {
  return task.status === 'pending' || task.status === 'in_progress';
}

function isAssignedToPartner(task: TaskItem): boolean {
  return task.assignedTo === 'partner' || task.assignedTo === 'both' || !task.assignedTo;
}

function isOverdue(task: TaskItem): boolean {
  if (!isOpenTask(task) || !task.dueAt) return false;
  return Date.parse(task.dueAt) < Date.now();
}

function isDueSoon(task: TaskItem): boolean {
  if (!isOpenTask(task) || !task.dueAt || isOverdue(task)) return false;
  const dueMs = Date.parse(task.dueAt);
  const now = Date.now();
  return dueMs >= now && dueMs - now <= MS_WEEK;
}

function isCompletedThisMonth(task: TaskItem): boolean {
  if (task.status !== 'completed') return false;
  const at = task.completedAt ?? task.updatedAt;
  const d = new Date(at);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function latestActivityIso(tasks: TaskItem[]): string | undefined {
  const stamps = tasks.map((task) => task.lastTouchedAt ?? task.updatedAt).filter(Boolean);
  if (!stamps.length) return undefined;
  return stamps.sort().reverse()[0];
}

function projectOpenTasks(projectId: string, tasks: TaskItem[]): number {
  return tasks.filter((t) => t.projectId === projectId && isOpenTask(t)).length;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; partner: Partner; tasks: TaskItem[]; projects: Project[] };

export default function PartnerProjectsProductSurface({ role, pageId, partnerId, entityId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? BriefcaseBusiness;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/projects');
  const projectId = entityId || searchParams.get('projectId') || undefined;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [hubTab, setHubTab] = useState<HubTab>((searchParams.get('tab') as HubTab) || 'projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId ?? null);
  const [taskView, setTaskView] = useState<WorkViewMode>('kanban');
  const [projectView, setProjectView] = useState<ProjectViewMode>('journey');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string | 'all'>('all');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [boardVersion, setBoardVersion] = useState(0);

  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const partner = getPartnerSync(partnerId!);
      if (!partner) throw new Error('Partner profile not found.');
      const allTasks = listTasksByPartner(partnerId!);
      const tasks = listPartnerPortalTasks(allTasks);
      const projects = listPartnerPortalProjects(listProjectsByPartner(partnerId!));
      if (!cancelled) setState({ status: 'ready', partner, tasks, projects });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your projects right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  useEffect(() => {
    const onStore = () => setBoardVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const openProjectInspector = (id: string) => {
    setSelectedProjectId(id);
    navigate(`${livePath}?projectId=${encodeURIComponent(id)}`);
  };

  const closeProject = () => {
    setSelectedProjectId(null);
    navigate(livePath);
  };

  const selectHubTab = (tab: HubTab) => {
    setHubTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const askFinelyPrompt = 'What should I work on next in my projects?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Projects & tasks' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderSplitWorkbench = (
    partner: Partner | null,
    tasks: TaskItem[],
    projects: Project[],
    demoMode: boolean,
  ) => {
    void boardVersion;
    const openTasks = tasks.filter(isOpenTask);
    const overdueTasks = openTasks.filter(isOverdue);
    const mostOverdue = pickMostOverdueTask(overdueTasks);
    const scopedProjects = projects.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const scopedTasks = selectedProjectId ? tasks.filter((t) => t.projectId === selectedProjectId) : tasks;
    const projectStageDefs = getWorkboardSettings().projectStages;
    const taskStageDefs = getWorkboardSettings().taskStages;
    const enabledProjectStages = projectStageDefs.filter((s) => !s.disabled);
    const enabledTaskStages = taskStageDefs.filter((s) => !s.disabled);
    const projectStageLabelById = new Map(projectStageDefs.map((s) => [s.id, s.label]));
    const taskStageLabelById = new Map(taskStageDefs.map((s) => [s.id, s.label]));
    const projectTitleById = new Map(scopedProjects.map((p) => [p.id, p.title]));
    const taskStats = new Map<string, { open: number; total: number }>();
    for (const t of tasks) {
      if (!t.projectId) continue;
      const cur = taskStats.get(t.projectId) ?? { open: 0, total: 0 };
      cur.total++;
      if (isOpenTask(t)) cur.open++;
      taskStats.set(t.projectId, cur);
    }
    const taskItems: WorkBoardItem[] = tasksToBoardItems(scopedTasks, {
      projectTitleById,
      stageLabelById: taskStageLabelById,
      categoryFilter: taskCategoryFilter,
    });
    const projectBoardItems = projectsToBoardItems(scopedProjects, { stageLabelById: projectStageLabelById });
    const detailTask = detailTaskId ? scopedTasks.find((t) => t.id === detailTaskId) ?? null : null;
    const tabClass = (active: boolean, tabAccent: 'emerald' | 'violet' | 'sky' = 'emerald') => finelyOsViewTab(active, tabAccent);

    const bumpBoard = () => {
      window.dispatchEvent(new Event('finely:store'));
      setBoardVersion((v) => v + 1);
      setRetryToken((v) => v + 1);
    };

    const handleOpenProject = (id: string) => openProjectInspector(id);
    const handleOpenTask = (id: string) => {
      const t = scopedTasks.find((x) => x.id === id);
      if (t?.projectId) {
        navigate(`${mapPortalHref('/portal/projects')}/${t.projectId}?task=${id}&view=board`);
        return;
      }
      setDetailTaskId(id);
    };

    return (
      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="pipeline-board">
        <div className="fc-wlp-task-workbench">
          <div className="fc-wlp-task-queue-panel" data-fc-accent="violet">
            <div className="fc-wlp-task-queue-head">
              <strong>{hubTab === 'projects' ? 'Projects' : 'Tasks'}</strong>
              <p>{projects.length} project{projects.length === 1 ? '' : 's'} · {openTasks.length} open</p>
            </div>
            <div className={FINELY_OS_VIEW_TABS + ' px-4 pt-3'}>
              <button type="button" onClick={() => selectHubTab('projects')} className={tabClass(hubTab === 'projects', 'violet')}>
                <FolderKanban size={14} /> Projects
              </button>
              <button type="button" onClick={() => selectHubTab('tasks')} className={tabClass(hubTab === 'tasks', 'emerald')}>
                <ListChecks size={14} /> Tasks
              </button>
            </div>
            <div className="fc-wlp-task-queue-scroll">
              {hubTab === 'projects' ? (
                projects.length === 0 ? (
                  <div className={`m-4 p-4 rounded-xl text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No projects yet.</div>
                ) : (
                  scopedProjects.map((project, idx) => {
                    const openCount = projectOpenTasks(project.id, tasks);
                    const active = selectedProjectId === project.id;
                    const queueAccent = QUEUE_ACCENTS[idx % QUEUE_ACCENTS.length];
                    return (
                      <button
                        key={project.id}
                        type="button"
                        className="fc-wlp-task-queue-row"
                        data-selected={active ? 'true' : undefined}
                        data-fcm-accent={queueAccent}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          handleOpenProject(project.id);
                        }}
                      >
                        <span className="fc-wlp-task-queue-row-icon" aria-hidden>
                          <FolderKanban size={18} />
                        </span>
                        <div>
                          <strong>{project.title}</strong>
                          <p>{project.stage?.replaceAll('_', ' ') ?? project.status}</p>
                          <em>{openCount ? `${openCount} open task${openCount === 1 ? '' : 's'}` : 'No open tasks'}</em>
                        </div>
                        {openCount > 0 ? <span className={finelyOsStatusChip('warn')}>{openCount}</span> : null}
                      </button>
                    );
                  })
                )
              ) : (
                scopedTasks.filter(isOpenTask).map((task, idx) => {
                  const active = detailTaskId === task.id;
                  const queueAccent = QUEUE_ACCENTS[idx % QUEUE_ACCENTS.length];
                  const due = task.dueAt ? formatShortDate(task.dueAt) : 'No due date';
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className="fc-wlp-task-queue-row"
                      data-selected={active ? 'true' : undefined}
                      data-fcm-accent={queueAccent}
                      onClick={() => setDetailTaskId(task.id)}
                    >
                      <span className="fc-wlp-task-queue-row-icon" aria-hidden>
                        <ListChecks size={18} />
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <p>{projectTitleById.get(task.projectId ?? '') ?? 'Personal task'}</p>
                        <em>{due}</em>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {mostOverdue && !demoMode ? (
              <div className="p-4 border-t border-slate-200/60">
                <button type="button" onClick={() => navigate(mapPortalHref(partnerTaskDeepLink(mostOverdue)))} className={`w-full ${FINELY_OS_SECONDARY_BTN}`}>
                  Open most overdue <ArrowRight size={14} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4">
            {partner && !demoMode ? (
              <>
                <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Workspace</div>
                  <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                    {selectedProjectId
                      ? projects.find((p) => p.id === selectedProjectId)?.title ?? 'Project'
                      : hubTab === 'tasks'
                        ? 'Your task board'
                        : 'Project journey'}
                  </div>
                  <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {hubTab === 'projects' ? 'Stages show where each project sits today.' : 'Drag cards or open a task for details.'}
                  </p>
                </div>

                {hubTab === 'projects' ? (
                  <div className="space-y-3">
                    <div className={FINELY_OS_VIEW_TABS}>
                      <button type="button" onClick={() => setProjectView('journey')} className={tabClass(projectView === 'journey', 'emerald')}>
                        Journey board
                      </button>
                      <button type="button" onClick={() => setProjectView('calendar')} className={tabClass(projectView === 'calendar', 'sky')}>
                        <CalendarDays size={14} /> Calendar
                      </button>
                    </div>
                    <div className={FINELY_OS_BOARD_SHELL}>
                      {scopedProjects.length === 0 ? (
                        <div className={`${finelyOsCatalogCard('violet')} p-8 text-center ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="violet">
                          No projects in this scope yet. Your specialist will add restoration projects here.
                        </div>
                      ) : projectView === 'journey' ? (
                        <WorkProjectJourneyBoard
                          projects={scopedProjects}
                          partnerById={new Map([[partner.id, partner]])}
                          taskStats={taskStats}
                          enabledStages={enabledProjectStages}
                          slaByProject={new Map()}
                          onOpenProject={handleOpenProject}
                          onProjectStageChange={(id, st) => {
                            setProjectStage(id, st);
                            bumpBoard();
                          }}
                          onProjectStatusChange={(id, st) => {
                            setProjectStatus(id, st);
                            bumpBoard();
                          }}
                        />
                      ) : (
                        <WorkCalendarView
                          items={projectBoardItems}
                          stageColorById={Object.fromEntries(PROJECT_PROGRESS_STAGES.map((s) => [s.id, String((s as { color?: string }).color || '')]))}
                          dateForItem={(it) => it.dueAt || it.updatedAt}
                          emptyHint="Calendar uses target close dates for projects, else last updated."
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
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
                      <div className={`${FINELY_OS_ENTITY_BODY} text-base font-bold py-8 text-center`}>
                        No tasks yet{selectedProjectId ? ' for this project' : ''}. Your specialist will add action items here.
                      </div>
                    ) : taskView === 'kanban' ? (
                      <WorkKanbanBoard
                        stages={TASK_PROGRESS_STAGES}
                        items={taskItems}
                        onStageChange={(id, stageId) => {
                          setTaskStatus(id, stageId as TaskStatus);
                          bumpBoard();
                        }}
                        onOpenItem={handleOpenTask}
                        enableDnd
                      />
                    ) : taskView === 'list' ? (
                      <WorkListView
                        stages={TASK_PROGRESS_STAGES}
                        items={taskItems}
                        onStageChange={(id, stageId) => {
                          setTaskStatus(id, stageId as TaskStatus);
                          bumpBoard();
                        }}
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
                )}

                {detailTask ? (
                  <TaskDetailModal
                    open
                    task={detailTask}
                    projectTitle={detailTask.projectId ? projectTitleById.get(detailTask.projectId) : undefined}
                    enabledTaskStages={enabledTaskStages}
                    onClose={() => setDetailTaskId(null)}
                    onSaved={bumpBoard}
                  />
                ) : null}
              </>
            ) : (
              <ProductEmptyState
                title="Sign in for live project board"
                description="Demo mode shows the queue + board layout — sign in to manage assigned projects and tasks."
                action={
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/login')}>
                    Sign in
                  </button>
                }
              />
            )}
          </div>
        </div>

        <aside className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-3`} data-fc-accent="rose">
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2 className="text-2xl font-extrabold">Finish first, then expand</h2>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Due work stays short and ordered — completed milestones move into history.</p>
          {guideActions}
        </aside>
      </section>
    );
  };

  const openNextAction = useCallback(() => navigate(livePath), [livePath, navigate]);

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Projects & tasks'}
        title={demoSpec?.title ?? 'One clear next action, with every later task on deck.'}
        description={demoSpec?.description ?? 'Due work stays short and ordered; completed milestones move into history instead of lengthening the page.'}
        status={`${demoSpec?.status ?? '3 open actions'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Open your most overdue task'} onClick={openNextAction} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {renderSplitWorkbench(null, [], [], true)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your projects" />;
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Projects & tasks"
        title="One clear next action, with every later task on deck."
        description="Due work stays short and ordered; completed milestones move into history instead of lengthening the page."
        status="Could not load your projects"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your projects"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  const { tasks, projects, partner } = state;
  const inspectorProject = projectId ? projects.find((p) => p.id === projectId) : null;
  const openTasks = tasks.filter(isOpenTask);
  const partnerOpenTasks = openTasks.filter(isAssignedToPartner);
  const overdueTasks = openTasks.filter(isOverdue);
  const dueThisWeekTasks = openTasks.filter(isDueSoon);
  const completedThisMonth = tasks.filter(isCompletedThisMonth);
  const latestActivity = latestActivityIso(tasks);
  const mostOverdue = pickMostOverdueTask(overdueTasks);

  const metrics: ProductMetric[] = [
    {
      label: 'Your open tasks',
      value: partnerOpenTasks.length,
      hint: `${projects.length} active project${projects.length === 1 ? '' : 's'} behind this work`,
      accent: 'violet',
      icon: Inbox,
      onClick: () => selectHubTab('tasks'),
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      hint: overdueTasks.length ? `${overdueTasks[0]?.title ?? 'Task'} needs attention first` : 'Nothing past due right now',
      accent: 'rose',
      icon: Clock3,
      onClick: () => (mostOverdue ? navigate(mapPortalHref(partnerTaskDeepLink(mostOverdue))) : selectHubTab('tasks')),
    },
    {
      label: 'Due this week',
      value: dueThisWeekTasks.length,
      hint: dueThisWeekTasks.length
        ? `Next due ${formatShortDate(dueThisWeekTasks.sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))[0]?.dueAt)}`
        : 'No deadlines in the next seven days',
      accent: 'sky',
      icon: Calendar,
      onClick: () => selectHubTab('tasks'),
    },
    {
      label: 'Completed this month',
      value: completedThisMonth.length,
      hint: completedThisMonth.length ? 'Milestones stay in history' : 'Finish a task to see progress here',
      accent: 'emerald',
      icon: CheckCircle2,
      onClick: () => selectHubTab('tasks'),
    },
  ];

  const statusHeadline = tasks.length === 0
    ? 'No tasks on your board yet'
    : overdueTasks.length > 0
      ? `${overdueTasks.length} overdue action${overdueTasks.length === 1 ? '' : 's'}`
      : partnerOpenTasks.length > 0
        ? `${partnerOpenTasks.length} open action${partnerOpenTasks.length === 1 ? '' : 's'} for you`
        : 'Work in progress — nothing due from you right now';

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Projects & tasks"
      title="One clear next action, with every later task on deck."
      description="Track the work Finely and your specialist assigned to you — start with what's overdue."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestActivity)}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={
        <ProductPagePrimaryAction
          label={mostOverdue ? mostOverdue.title : 'Open your most overdue task'}
          onClick={() => (mostOverdue ? navigate(mapPortalHref(partnerTaskDeepLink(mostOverdue))) : selectHubTab('tasks'))}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/portal/dashboard'))}>
          Dashboard
        </button>
      }
      metrics={metrics}
      metricTitle="Work progress"
      metricDescription="Open, due, waiting, and completed work are separated clearly."
    >
      {renderSplitWorkbench(partner, tasks, projects, false)}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      {projectId ? (
        <div className="fc-wlp-local-modal-overlay" role="dialog" aria-modal="true" aria-label="Project workspace inspector" onClick={closeProject}>
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-project-record-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-violet-300 m-0">Project inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">{inspectorProject?.title ?? 'Project workspace'}</h3>
              </div>
              <button type="button" className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs" onClick={closeProject} aria-label="Close project inspector">
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <PartnerProjectWorkspacePage embedded />
            </div>
          </div>
        </div>
      ) : null}
    </ProductHubScaffold>
  );
}
