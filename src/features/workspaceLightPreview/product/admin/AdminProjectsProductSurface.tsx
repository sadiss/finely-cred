import React from 'react';
import {
  CalendarDays,
  FolderKanban,
  LayoutList,
  ListChecks,
  Network,
  Rows3,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { WorkProjectsHub } from '../../../work/views/WorkProjectsHub';
import { AdminProjectWorkspaceContent } from '../../../../pages/admin/AdminProjectWorkspacePage';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import {
  AdminContextCommand,
  AdminStageHero,
  AdminStageSection,
  AdminStageShell,
} from '../components/ProductAdminStage';
import { ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import '../../../work/views/workBoardCards.css';

const PROJECT_VIEWS = [
  { label: 'Journey board', icon: Network, accent: 'emerald' },
  { label: 'Project list', icon: LayoutList, accent: 'violet' },
  { label: 'Project calendar', icon: CalendarDays, accent: 'sky' },
  { label: 'Task Kanban', icon: Rows3, accent: 'rose' },
] as const;

/**
 * Projects portfolio + enhanced detail sheet.
 * `:id` deep links open the workspace sheet over the list — not a silent swap to bare legacy chrome.
 */
export default function AdminProjectsProductSurface({
  pageId,
  entityId,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: routeProjectId } = useParams<{ id?: string }>();
  const projectId = entityId ?? routeProjectId;
  const previewMode = pathname.startsWith('/preview/workspace-light');
  const projectBasePath = previewMode
    ? '/preview/workspace-light/admin/projects'
    : '/admin/projects';
  const projectsPath = projectBasePath;
  const myTasksPath = previewMode
    ? '/preview/workspace-light/admin/my-tasks'
    : '/admin/my-tasks';
  const tasksFirst = pageId === 'my-tasks' || pageId === 'tasks' || pathname.includes('/my-tasks');

  const createKind = tasksFirst ? 'task' : 'project';
  const switchPath = tasksFirst ? projectsPath : myTasksPath;

  const closeProjectSheet = () => {
    navigate(projectsPath);
  };

  return (
    <AdminStageShell family="delivery-suite" signature="projects-master-workspace" accent="emerald">
      <span hidden data-surface-kind="real" data-surface-key={`admin:${pageId}`} />
      <AdminStageHero
        tone="control"
        accent="emerald"
        eyebrow={tasksFirst ? 'Delivery operations · My tasks' : 'Delivery operations · Projects'}
        title={
          tasksFirst
            ? 'Your task queue, shown in every useful view.'
            : 'Projects lead. Every task remains attached to its master project.'
        }
        description={
          tasksFirst
            ? 'Move personal work through Kanban, list, or calendar while keeping its parent project visible.'
            : 'Create the project first, then manage its child tasks. Opening a project keeps the portfolio and opens an enhanced workspace sheet.'
        }
        status={projectId ? 'Project inspector open' : tasksFirst ? 'Task workstation' : 'Project master workspace'}
        freshness="ready now"
        icon={tasksFirst ? ListChecks : FolderKanban}
        primaryFirst
        primaryAction={
          <ProductPagePrimaryAction
            label={tasksFirst ? 'Create task' : 'Create project'}
            onClick={() => navigate(`${pathname}?create=${createKind}`)}
          />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(switchPath)}>
            {tasksFirst ? <FolderKanban size={15} /> : <ListChecks size={15} />}
            {tasksFirst ? 'Projects' : 'My tasks'}
          </button>
        }
        feature={
          <div className="fc-work-view-chips" aria-label="Available project and task views">
            {PROJECT_VIEWS.map((view) => {
              const Icon = view.icon;
              return (
                <div key={view.label} className="fc-work-view-chip" data-accent={view.accent}>
                  <Icon size={16} aria-hidden />
                  {view.label}
                </div>
              );
            })}
          </div>
        }
      />

      <AdminStageSection
        eyebrow={tasksFirst ? 'My task workstation' : 'Master project workstation'}
        title={tasksFirst ? 'Kanban, list, and calendar—without losing project context' : 'Create, stage, inspect, and deliver from one wide canvas'}
        description={
          tasksFirst
            ? 'Select a parent project at left, then move or open its child tasks in the full-width board.'
            : 'Every configured stage and existing project/task function remains available below. Card click opens the enhanced project sheet.'
        }
        tone="dark"
      >
        <WorkProjectsHub
          embedded
          initialTab={tasksFirst ? 'tasks' : 'projects'}
          workspaceBasePath={projectBasePath}
        />
      </AdminStageSection>

      {projectId ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Project workspace inspector"
          onClick={closeProjectSheet}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-project-record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-300 m-0">Enhanced project inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">Project workspace</h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                onClick={closeProjectSheet}
                aria-label="Close project inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <AdminProjectWorkspaceContent embedded />
            </div>
          </div>
        </div>
      ) : null}

      <AdminContextCommand
        title={tasksFirst ? 'Work the queue in priority order' : 'Build the parent before its child tasks'}
        description="Use the view that matches the decision: journey for stage flow, list for scanning, calendar for dates, and Kanban for movement."
        steps={
          tasksFirst
            ? ['Choose a parent project or show all.', 'Move the highest-priority task.', 'Open details to update owner, checklist, or due date.']
            : ['Create or open the master project.', 'Set its stage, scope, owner, and target.', 'Create child tasks and move them through delivery.']
        }
        prompt={tasksFirst ? 'Which task should I work on first?' : 'Help me structure a new delivery project and its child tasks.'}
        contextLabel={tasksFirst ? 'Admin My Tasks' : 'Admin Projects'}
      />
    </AdminStageShell>
  );
}
