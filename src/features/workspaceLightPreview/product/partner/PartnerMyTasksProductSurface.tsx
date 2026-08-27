import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CircleHelp,
  Clock3,
  FolderKanban,
  ListChecks,
  PlayCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../../../domain/projects';
import type { TaskItem } from '../../../../domain/tasks';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { listProjectsByPartner } from '../../../../data/projectsRepo';
import { createTask, listTasksByPartner } from '../../../../data/tasksRepo';
import { VoiceToTaskButton } from '../../../work/components/VoiceToTaskButton';
import { TaskTimerChip } from '../../../work/components/TaskTimerChip';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { listPartnerPortalProjects, listPartnerPortalTasks } from '../../../../lib/workVisibility';
import { pickMostOverdueTask, partnerTaskDeepLink } from '../../../../lib/partnerWorkNavigation';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'grid' as const;
const QUEUE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

type QueueLane = 'open' | 'overdue' | 'projects';

function priorityWeight(p?: string) {
  if (p === 'urgent') return 4;
  if (p === 'high') return 3;
  if (p === 'normal') return 2;
  return 1;
}

function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks.slice().sort((a, b) => {
    const aDue = a.dueAt ? Date.parse(a.dueAt) : Infinity;
    const bDue = b.dueAt ? Date.parse(b.dueAt) : Infinity;
    const aOver = a.dueAt && aDue < Date.now() ? 1 : 0;
    const bOver = b.dueAt && bDue < Date.now() ? 1 : 0;
    if (bOver !== aOver) return bOver - aOver;
    const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (pw !== 0) return pw;
    return aDue - bDue;
  });
}

function fmtDue(iso?: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return {
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      overdue: d.getTime() < Date.now(),
    };
  } catch {
    return null;
  }
}

function TaskDetailPanel({
  task,
  project,
  onOpen,
  onTasksChanged,
}: {
  task: TaskItem;
  project: Project | null;
  onOpen: () => void;
  onTasksChanged: () => void;
}) {
  const due = fmtDue(task.dueAt);

  return (
    <div className={`${finelyOsCatalogCard('violet')} fc-wlp-task-detail-panel fc-surface-harmony`} data-fc-accent="violet">
      <div className="text-xs font-black uppercase tracking-widest text-violet-700">Selected task</div>
      <h2 className="mt-4">{task.title}</h2>
      {task.notes?.trim() ? (
        <p className="mt-4 text-base font-semibold text-slate-600">{task.notes}</p>
      ) : (
        <p className="mt-4 text-base font-semibold text-slate-500">No extra notes on this task yet.</p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <span className={finelyOsStatusChip(task.status === 'in_progress' ? 'warn' : 'ok')}>
          {task.status.replace(/_/g, ' ')}
        </span>
        {task.priority && task.priority !== 'normal' ? (
          <span className={finelyOsStatusChip('warn')}>{task.priority}</span>
        ) : null}
        <span className={finelyOsStatusChip('ok')}>{task.kind.replace(/_/g, ' ')}</span>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Project</dt>
          <dd className="mt-1 text-base font-bold text-slate-900">{project?.title ?? 'No project linked'}</dd>
        </div>
        <div>
          <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Due</dt>
          <dd className={`mt-1 text-base font-bold flex items-center gap-2 ${due?.overdue ? 'text-rose-600' : 'text-slate-900'}`}>
            <Calendar size={16} />
            {due ? due.label : 'No due date'}
          </dd>
        </div>
      </dl>
      <div className="mt-5">
        <TaskTimerChip task={task} onUpdate={onTasksChanged} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onOpen}>
          Open in project <ArrowRight size={14} />
        </button>
        {project ? (
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onOpen}>
            View board
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProjectDetailPanel({
  project,
  openTaskCount,
  onOpen,
}: {
  project: Project;
  openTaskCount: number;
  onOpen: () => void;
}) {
  return (
    <div className={`${finelyOsCatalogCard('sky')} fc-wlp-task-detail-panel fc-surface-harmony`} data-fc-accent="sky">
      <div className="text-xs font-black uppercase tracking-widest text-sky-700">Selected project</div>
      <h2 className="mt-4">{project.title}</h2>
      <p className="mt-4 text-base font-semibold text-slate-600">
        Open this workspace to see tasks, files, and notes for this project.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className={finelyOsStatusChip('ok')}>Project workspace</span>
        <span className={finelyOsStatusChip(openTaskCount ? 'warn' : 'ok')}>
          {openTaskCount} open task{openTaskCount === 1 ? '' : 's'}
        </span>
      </div>
      <button type="button" className={`${FINELY_OS_PRIMARY_BTN} mt-8`} onClick={onOpen}>
        Open workspace <ArrowRight size={14} />
      </button>
      <button type="button" className={`${FINELY_OS_SECONDARY_BTN} mt-3`} onClick={() => onOpen()}>
        All projects
      </button>
    </div>
  );
}

export default function PartnerMyTasksProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = partnerId ? sessionPartner : sessionPartner;
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? ListChecks;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [version, setVersion] = useState(0);
  const [lane, setLane] = useState<QueueLane>('open');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const projects = useMemo(() => {
    if (isDemo) return [];
    if (!partner) return [];
    return listPartnerPortalProjects(listProjectsByPartner(partner.id));
  }, [isDemo, partner, version]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const openTasks = useMemo(() => {
    if (isDemo) return [];
    if (!partner) return [];
    return listPartnerPortalTasks(listTasksByPartner(partner.id)).filter(
      (t) => t.status === 'pending' || t.status === 'in_progress',
    );
  }, [isDemo, partner, version]);

  const overdueTasks = useMemo(
    () => openTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now()),
    [openTasks],
  );

  const sortedOpen = useMemo(() => sortTasks(openTasks), [openTasks]);
  const sortedOverdue = useMemo(() => sortTasks(overdueTasks), [overdueTasks]);

  const activeProjectId = projects[0]?.id;
  const mostOverdue = useMemo(() => pickMostOverdueTask(overdueTasks), [overdueTasks]);
  const projectsPath = mapPortalHref('/portal/projects');

  const queueTasks = lane === 'overdue' ? sortedOverdue : sortedOpen;

  const selectedTask = useMemo(
    () => queueTasks.find((t) => t.id === selectedTaskId) ?? queueTasks[0] ?? null,
    [queueTasks, selectedTaskId],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (lane === 'projects') return;
    if (!selectedTaskId && queueTasks[0]) setSelectedTaskId(queueTasks[0].id);
    if (selectedTaskId && !queueTasks.some((t) => t.id === selectedTaskId) && queueTasks[0]) {
      setSelectedTaskId(queueTasks[0].id);
    }
  }, [lane, queueTasks, selectedTaskId]);

  useEffect(() => {
    if (lane !== 'projects') return;
    if (!selectedProjectId && projects[0]) setSelectedProjectId(projects[0].id);
    if (selectedProjectId && !projects.some((p) => p.id === selectedProjectId) && projects[0]) {
      setSelectedProjectId(projects[0].id);
    }
  }, [lane, projects, selectedProjectId]);

  const handleVoiceTask = ({ title, notes }: { title: string; notes?: string }) => {
    if (!partner || !activeProjectId) return;
    createTask({
      partnerId: partner.id,
      projectId: activeProjectId,
      title,
      notes,
      kind: 'general',
      status: 'pending',
      priority: 'normal',
      tags: ['voice_to_task'],
    });
    setVersion((v) => v + 1);
  };

  const openTask = (task: TaskItem) => {
    navigate(mapPortalHref(partnerTaskDeepLink(task, projectsPath)));
  };

  const askFinelyPrompt = 'Which task should I finish first?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'My tasks' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const demoOpen = 5;
  const demoOverdue = 2;
  const demoProjects = 3;

  const metrics: ProductMetric[] = [
    {
      label: 'Open tasks',
      value: isDemo ? demoOpen : openTasks.length,
      hint: isDemo ? 'Across your projects' : openTasks.length ? 'Active right now' : 'Nothing open',
      accent: 'emerald',
      icon: ListChecks,
      onClick: () => setLane('open'),
    },
    {
      label: 'Overdue',
      value: isDemo ? demoOverdue : overdueTasks.length,
      hint: isDemo ? 'Needs action today' : overdueTasks.length ? 'Sort by due date' : 'Nothing overdue',
      accent: 'rose',
      icon: Clock3,
      onClick: () => setLane('overdue'),
    },
    {
      label: 'Projects',
      value: isDemo ? demoProjects : projects.length,
      hint: isDemo ? 'Workspaces' : projects.length ? 'With open work' : 'No projects yet',
      accent: 'sky',
      icon: FolderKanban,
      onClick: () => setLane('projects'),
    },
    {
      label: 'Stage',
      value: partner?.journeyStage ?? 'intake',
      hint: 'Your journey step',
      accent: 'violet',
      icon: ListChecks,
      onClick: () => navigate(mapPortalHref('/portal/dashboard')),
    },
  ];

  const statusHeadline = (isDemo ? demoOverdue : overdueTasks.length)
    ? `${isDemo ? demoOverdue : overdueTasks.length} overdue task${(isDemo ? demoOverdue : overdueTasks.length) === 1 ? '' : 's'}`
    : (isDemo ? demoOpen : openTasks.length)
      ? `${isDemo ? demoOpen : openTasks.length} open task${(isDemo ? demoOpen : openTasks.length) === 1 ? '' : 's'}`
      : 'No open tasks';

  const guideTitle = mostOverdue
    ? 'Finish your most overdue task'
    : overdueTasks.length
      ? 'Clear overdue work first'
      : openTasks.length
        ? 'Work through your queue'
        : 'Your queue is clear';
  const guideDescription = mostOverdue
    ? `${mostOverdue.title} is past due — open it and finish the step it describes.`
    : openTasks.length
      ? 'Pick a task on the left to see details, then open it in the project board.'
      : 'New tasks appear when your specialist or plan assigns work.';
  const guideSteps = mostOverdue
    ? ['Select the overdue task in your queue.', 'Gather anything it asks for.', 'Mark it done when finished.']
    : ['Start with the top task in your queue.', 'Use voice-to-task for quick captures.', 'Open the project for full context.'];

  const workbenchBody = isDemo ? (
    <ProductEmptyState
      title="Sign in to manage your tasks"
      description="Demo mode shows the layout — sign in to see your live queue, voice capture, and project links."
      action={
        <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
      }
    />
  ) : !partner ? (
    <ProductEmptyState
      title="No partner session"
      description="Sign in to your partner portal to see your task queue."
      action={
        <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
      }
    />
  ) : (
    <div className="fc-wlp-task-workbench" data-surface-layout="queue-detail">
      <div className="space-y-4">
        {lane !== 'projects' && activeProjectId ? (
          <div className="fc-wlp-task-voice-band" data-fcm-accent="emerald">
            <div>
              <strong>Voice-to-task</strong>
              <p>Speak a task — it lands on your active project.</p>
            </div>
            <VoiceToTaskButton onCapture={handleVoiceTask} />
          </div>
        ) : null}

        <div className="fc-wlp-task-queue-panel" data-fcm-accent={lane === 'overdue' ? 'rose' : lane === 'projects' ? 'sky' : 'emerald'}>
          <div className="fc-wlp-task-queue-head">
            <strong>{lane === 'projects' ? 'Project queue' : lane === 'overdue' ? 'Overdue queue' : 'Task queue'}</strong>
            <p>
              {lane === 'projects'
                ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
                : `${queueTasks.length} task${queueTasks.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="fc-wlp-lane-chips px-5 pt-4">
            <button
              type="button"
              className="fc-wlp-lane-chip"
              data-active={lane === 'open' ? 'true' : undefined}
              data-fcm-accent="emerald"
              onClick={() => setLane('open')}
            >
              Open
              <span className="fc-wlp-lane-chip-count">{openTasks.length || undefined}</span>
            </button>
            <button
              type="button"
              className="fc-wlp-lane-chip"
              data-active={lane === 'overdue' ? 'true' : undefined}
              data-fcm-accent="rose"
              onClick={() => setLane('overdue')}
            >
              Overdue
              <span className="fc-wlp-lane-chip-count">{overdueTasks.length || undefined}</span>
            </button>
            <button
              type="button"
              className="fc-wlp-lane-chip"
              data-active={lane === 'projects' ? 'true' : undefined}
              data-fcm-accent="sky"
              onClick={() => setLane('projects')}
            >
              Projects
              <span className="fc-wlp-lane-chip-count">{projects.length || undefined}</span>
            </button>
          </div>

          <div className="fc-wlp-task-queue-scroll">
            {lane === 'projects' ? (
              projects.length === 0 ? (
                <div className="p-8 text-center text-base font-bold text-slate-500">
                  No projects yet — your service bundle will create workspaces here.
                </div>
              ) : (
                <FinelyOsPaginatedStack
                  items={projects}
                  pageSize={8}
                  itemSpacingClassName="divide-y divide-black/[0.06]"
                  renderItem={(p, idx) => {
                    const cardAccent = QUEUE_ACCENTS[idx % QUEUE_ACCENTS.length];
                    const openCount = openTasks.filter((t) => t.projectId === p.id).length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="fc-wlp-task-queue-row"
                        data-fcm-accent={cardAccent}
                        data-selected={selectedProject?.id === p.id ? 'true' : undefined}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        <span className="fc-wlp-task-queue-row-icon" aria-hidden>
                          <FolderKanban size={20} strokeWidth={2.1} />
                        </span>
                        <div>
                          <strong>{p.title}</strong>
                          <p>Open workspace for tasks, files, and notes.</p>
                          <em>{openCount} open task{openCount === 1 ? '' : 's'}</em>
                        </div>
                      </button>
                    );
                  }}
                />
              )
            ) : queueTasks.length === 0 ? (
              <div className="p-8 text-center text-base font-bold text-slate-500">
                {lane === 'overdue' ? 'No overdue tasks — you are caught up.' : 'All caught up — no open tasks in queue.'}
              </div>
            ) : (
              <FinelyOsPaginatedStack
                items={queueTasks}
                pageSize={15}
                itemSpacingClassName="divide-y divide-black/[0.06]"
                renderItem={(t, idx) => {
                  const proj = t.projectId ? projectById.get(t.projectId) : null;
                  const due = fmtDue(t.dueAt);
                  const cardAccent = QUEUE_ACCENTS[idx % QUEUE_ACCENTS.length];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="fc-wlp-task-queue-row"
                      data-fcm-accent={cardAccent}
                      data-selected={selectedTask?.id === t.id ? 'true' : undefined}
                      onClick={() => setSelectedTaskId(t.id)}
                    >
                      <span className="fc-wlp-task-queue-row-icon" aria-hidden>
                        <ListChecks size={20} strokeWidth={2.1} />
                      </span>
                      <div>
                        <strong>{t.title}</strong>
                        <p>{proj?.title ?? 'No project'} · {t.kind.replace(/_/g, ' ')}</p>
                        <em>
                          {due ? (
                            <>
                              <Calendar size={11} className="inline mr-1" />
                              {due.label}
                              {due.overdue ? ' · overdue' : ''}
                            </>
                          ) : (
                            'No due date'
                          )}
                        </em>
                      </div>
                    </button>
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div>
        {lane === 'projects' ? (
          selectedProject ? (
            <ProjectDetailPanel
              project={selectedProject}
              openTaskCount={openTasks.filter((t) => t.projectId === selectedProject.id).length}
              onOpen={() => navigate(`${projectsPath}/${selectedProject.id}`)}
            />
          ) : (
            <ProductEmptyState
              title="Select a project"
              description="Choose a project from the queue to open its workspace."
              action={
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(projectsPath)}>
                  Open projects hub
                </button>
              }
            />
          )
        ) : selectedTask ? (
          <TaskDetailPanel
            task={selectedTask}
            project={selectedTask.projectId ? projectById.get(selectedTask.projectId) ?? null : null}
            onOpen={() => openTask(selectedTask)}
            onTasksChanged={() => setVersion((v) => v + 1)}
          />
        ) : (
          <ProductEmptyState
            title="Select a task"
            description="Pick a task from your queue to see due dates, notes, and the project link."
            action={
              activeProjectId ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <VoiceToTaskButton onCapture={handleVoiceTask} />
                  <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(projectsPath)}>
                    Open projects
                  </button>
                </div>
              ) : (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(projectsPath)}>
                  Open projects hub
                </button>
              )
            }
          />
        )}
      </div>
    </div>
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId="my-tasks"
      eyebrow="My tasks"
      title="Everything on your plate, sorted by urgency."
      description="Your queue on the left, full task detail on the right — overdue work rises to the top."
      status={`${statusHeadline} · ${isDemo ? 'demo' : 'live'} data`}
      freshness="ready now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={
        mostOverdue ? (
          <ProductPagePrimaryAction
            label="Open overdue task"
            onClick={() => navigate(mapPortalHref(partnerTaskDeepLink(mostOverdue, projectsPath)))}
          />
        ) : (
          <ProductPagePrimaryAction label="Open projects" onClick={() => navigate(projectsPath)} />
        )
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/fundability-readiness'))}>
          Fundability
        </button>
      }
      metrics={metrics}
      metricTitle="Task summary"
      metricDescription="Four counts so you know what matters before you pick from the queue."
    >
      <section className="fc-wlp-section space-y-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>{workbenchBody}</div>
          <aside className="fc-wlp-page-guide lg:sticky lg:top-4">
            <div className="fc-wlp-page-guide-icon">
              <PageIcon size={22} strokeWidth={2.05} />
            </div>
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2>{guideTitle}</h2>
            <p>{guideDescription}</p>
            <ol>
              {guideSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {guideActions}
          </aside>
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
