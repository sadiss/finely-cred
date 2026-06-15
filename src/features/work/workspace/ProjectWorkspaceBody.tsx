import React, { useState } from 'react';
import type { Project } from '../../../domain/projects';
import type { TaskItem, TaskStatus } from '../../../domain/tasks';
import type { Partner } from '../../../domain/partners';
import type { WorkspaceView } from '../hooks/useProjectWorkspace';
import { needsResultToComplete } from '../../../lib/workTaskComplete';
import { TaskCompleteModal } from '../components/TaskCompleteModal';
import { ProjectHeader } from '../workspace/ProjectHeader';
import { ProjectOverviewPanel } from '../workspace/ProjectOverviewPanel';
import { TaskDetailPane } from '../workspace/TaskDetailPane';
import { WorkAICopilotPanel } from '../components/WorkAICopilotPanel';
import { WorkTaskCalendarPanel, WorkTaskListPanel, WorkTaskStatusBoard } from '../views/WorkTaskViews';
import { FINELY_OS_CATALOG_SHELL } from '../../os/finelyOsLightUi';

export function ProjectWorkspaceBody({
  project,
  tasks,
  partner,
  partnerName,
  projectStageLabel,
  enabledProjectStages,
  enabledTaskStages,
  stageLabelById,
  view,
  selectedTask,
  onViewChange,
  onBack,
  onProjectStageChange,
  onProjectStatusChange,
  onTitleChange,
  onDescriptionChange,
  onNewTask,
  onVoiceTask,
  onOpenTask,
  onCloseTask,
  onTaskStatusChange,
  onSaved,
  showCopilot = true,
  partnerPortal = false,
  unifiedShell,
}: {
  project: Project;
  tasks: TaskItem[];
  partner?: Partner | null;
  partnerName?: string;
  projectStageLabel: string;
  enabledProjectStages: Array<{ id: string; label: string }>;
  enabledTaskStages: Array<{ id: string; label: string }>;
  stageLabelById: Map<string, string>;
  view: WorkspaceView;
  selectedTask: TaskItem | null;
  onViewChange: (v: WorkspaceView) => void;
  onBack: () => void;
  onProjectStageChange: (stage: Project['stage']) => void;
  onProjectStatusChange: (status: Project['status']) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange?: (text: string) => void;
  onNewTask: () => void;
  onVoiceTask?: (payload: { title: string; notes?: string; raw: string }) => void;
  onOpenTask: (id: string) => void;
  onCloseTask: () => void;
  onTaskStatusChange: (id: string, status: TaskStatus) => void;
  onSaved?: () => void;
  showCopilot?: boolean;
  partnerPortal?: boolean;
  unifiedShell?: boolean;
}) {
  const [completeTask, setCompleteTask] = useState<TaskItem | null>(null);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    if (status === 'completed') {
      const task = tasks.find((t) => t.id === id);
      if (task && !task.actualResult?.trim() && (needsResultToComplete(task) || partnerPortal)) {
        setCompleteTask(task);
        return;
      }
    }
    onTaskStatusChange(id, status);
  };

  return (
    <div className="space-y-4">
      <ProjectHeader
        project={project}
        partnerName={partnerName}
        stageLabel={projectStageLabel}
        enabledProjectStages={enabledProjectStages}
        view={view}
        onViewChange={onViewChange}
        onBack={onBack}
        onStageChange={onProjectStageChange}
        onStatusChange={onProjectStatusChange}
        onTitleChange={onTitleChange}
        onNewTask={onNewTask}
        onVoiceTask={onVoiceTask}
        hideViewTabs={unifiedShell}
      />

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0 fc-light-glass-panel fc-light-chrome-panel ring-1 ring-inset ring-white/5 p-4">
          {view === 'overview' ? (
            <div className="space-y-4">
              <ProjectOverviewPanel
                project={project}
                tasks={tasks}
                stageLabel={projectStageLabel}
                onEditDescription={onDescriptionChange}
              />
              {showCopilot ? (
                <WorkAICopilotPanel
                  project={project}
                  tasks={tasks}
                  partnerLane={partner?.lane}
                  onApplied={onSaved}
                />
              ) : null}
            </div>
          ) : view === 'board' ? (
            <WorkTaskStatusBoard
              tasks={tasks}
              stageLabelById={stageLabelById}
              onOpenTask={onOpenTask}
              onStatusChange={handleStatusChange}
            />
          ) : view === 'list' ? (
            <div className={FINELY_OS_CATALOG_SHELL}>
              <WorkTaskListPanel tasks={tasks} stageLabelById={stageLabelById} onOpenTask={onOpenTask} />
            </div>
          ) : (
            <div className={FINELY_OS_CATALOG_SHELL}>
              <WorkTaskCalendarPanel tasks={tasks} onOpenTask={onOpenTask} />
            </div>
          )}
        </div>

        {selectedTask ? (
          <TaskDetailPane
            task={selectedTask}
            projectTitle={project.title}
            enabledTaskStages={enabledTaskStages}
            partnerPortal={partnerPortal}
            onClose={onCloseTask}
            onSaved={onSaved}
          />
        ) : null}
      </div>

      <TaskCompleteModal
        task={completeTask}
        partnerId={partner?.id ?? completeTask?.partnerId}
        open={Boolean(completeTask)}
        onClose={() => setCompleteTask(null)}
        onCompleted={() => {
          setCompleteTask(null);
          onSaved?.();
        }}
      />
    </div>
  );
}
