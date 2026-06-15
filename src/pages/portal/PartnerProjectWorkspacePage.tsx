import React, { useMemo, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { getProject, setProjectStage, setProjectStatus, upsertProject } from '../../data/projectsRepo';
import { createTask, listTasksByPartner, setTaskStatus } from '../../data/tasksRepo';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { WorkItemCreateModal } from '../../components/workboard/WorkItemCreateModal';
import { TaskCreateWizard } from '../../features/work/workspace/TaskCreateWizard';
import { useProjectWorkspace, type WorkspaceView } from '../../features/work/hooks/useProjectWorkspace';
import { ProjectWorkspaceBody } from '../../features/work/workspace/ProjectWorkspaceBody';
import { listPartnerPortalTasks, isProjectVisibleToPartner } from '../../lib/workVisibility';
import type { TaskItem } from '../../domain/tasks';
import { useNavigate } from 'react-router-dom';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FINELY_OS_BACK_LINK } from '../../features/os/finelyOsLightUi';

export default function PartnerProjectWorkspacePage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const ws = useProjectWorkspace({ listPath: '/portal/projects' });
  const [createOpen, setCreateOpen] = useState(false);
  const [aiCreateOpen, setAiCreateOpen] = useState(false);

  const project = useMemo(() => {
    if (!ws.projectId || !partner) return null;
    const p = getProject(ws.projectId);
    if (!p || p.partnerId !== partner.id || !isProjectVisibleToPartner(p)) return null;
    return p;
  }, [ws.projectId, partner, ws.version]);

  const tasks = useMemo(() => {
    if (!partner || !project) return [];
    return listPartnerPortalTasks(listTasksByPartner(partner.id)).filter((t) => t.projectId === project.id);
  }, [partner, project, ws.version]);

  const selectedTask = useMemo(() => (ws.taskId ? tasks.find((t) => t.id === ws.taskId) ?? null : null), [tasks, ws.taskId]);

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [ws.version]);
  const projectStageDefs = useMemo(() => getWorkboardSettings().projectStages, [ws.version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);
  const enabledProjectStages = useMemo(() => projectStageDefs.filter((s) => !s.disabled), [projectStageDefs]);
  const stageLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const projectStageLabel = project ? stageLabelById.get(String(project.stage)) ?? String(project.stage) : '';

  const bump = () => window.dispatchEvent(new Event('finely:store'));

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Projects" subtitle="Sign in with a partner profile to view projects.">
        <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
          Back to dashboard
        </button>
      </PageShell>
    );
  }

  if (!ws.projectId || !project) {
    return (
      <PageShell badge="Partner Portal" title="Project not found" subtitle="This project does not exist or you do not have access to it.">
        <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_BACK_LINK}>
          Back to projects
        </button>
      </PageShell>
    );
  }

  const partnerName = partner.profile?.fullName || partner.profile?.email || '';
  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  return (
    <PageShell badge="Partner Portal" title={project.title} subtitle={`Your delivery project · ${projectStageLabel}`}>
      <FinelyUnifiedHubLayout
        eyebrow="Project workspace"
        title={project.title}
        subtitle={`Phase: ${projectStageLabel} · ${openTasks} open tasks`}
        accent="violet"
        kpis={[
          { label: 'Tasks', value: String(tasks.length), hint: 'Total', accent: 'violet' },
          { label: 'Open', value: String(openTasks), hint: 'Active', accent: 'amber' },
          { label: 'Phase', value: projectStageLabel, hint: 'Stage', accent: 'emerald' },
          { label: 'Status', value: project.status, hint: 'Project', accent: 'sky' },
        ]}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'board', label: 'Board' },
          { id: 'list', label: 'List' },
          { id: 'calendar', label: 'Calendar' },
        ]}
        activeTab={ws.view}
        onTabChange={(id) => ws.setView(id as WorkspaceView)}
        primaryAction={{ label: 'All projects', onClick: ws.goToProjects }}
        secondaryAction={{ label: 'My tasks', onClick: () => navigate('/portal/my-tasks') }}
      >
      <ProjectWorkspaceBody
        project={project}
        tasks={tasks}
        partner={partner}
        partnerName={partnerName}
        projectStageLabel={projectStageLabel}
        enabledProjectStages={enabledProjectStages}
        enabledTaskStages={enabledTaskStages}
        stageLabelById={stageLabelById}
        view={ws.view}
        selectedTask={selectedTask}
        onViewChange={ws.setView}
        onBack={ws.goToProjects}
        onProjectStageChange={(stage) => { setProjectStage(project.id, stage); bump(); }}
        onProjectStatusChange={(status) => { setProjectStatus(project.id, status); bump(); }}
        onTitleChange={(title) => upsertProject({ ...project, title: title.trim() || project.title })}
        onDescriptionChange={(text) => upsertProject({ ...project, description: text.trim() || undefined })}
        onNewTask={() => setAiCreateOpen(true)}
        onVoiceTask={({ title, notes }) => {
          const task = createTask({
            partnerId: partner.id,
            scope: project.scope ?? 'personal',
            projectId: project.id,
            title,
            kind: 'general',
            stage: (enabledTaskStages[0]?.id ?? 'intake') as TaskItem['stage'],
            status: 'pending',
            notes,
            tags: ['voice-created'],
            assignedTo: 'partner',
            visibility: 'partner',
          });
          ws.openTask(task.id);
          bump();
        }}
        onOpenTask={ws.openTask}
        onCloseTask={ws.closeTask}
        onTaskStatusChange={(id, status) => { setTaskStatus(id, status); bump(); }}
        onSaved={bump}
        showCopilot
        partnerPortal
        unifiedShell
      />
      </FinelyUnifiedHubLayout>

      <FinelyOsPageFooter />

      <TaskCreateWizard
        open={aiCreateOpen}
        partnerId={partner.id}
        projectId={project.id}
        defaultStage={project.stage}
        onClose={() => setAiCreateOpen(false)}
        onCreated={(task) => {
          ws.openTask(task.id);
          bump();
        }}
      />

      <WorkItemCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind="task"
        allowProject={false}
        allowTask
        partnerOptions={[{ id: partner.id, label: partnerName || partner.id }]}
        projectOptions={[{ id: project.id, label: project.title }]}
        defaultPartnerId={partner.id}
        defaultScope={project.scope ?? 'personal'}
        defaultProjectId={project.id}
        enabledTaskStages={enabledTaskStages}
        enabledProjectStages={enabledProjectStages}
        onCreateTask={(args) => {
          createTask({
            partnerId: partner.id,
            scope: project.scope ?? 'personal',
            projectId: project.id,
            title: args.title,
            kind: 'general',
            stage: args.stage as TaskItem['stage'],
            priority: args.priority as TaskItem['priority'],
            status: 'pending',
            dueAt: args.dueAt,
            notes: args.notes,
            tags: args.tags,
            assignedTo: 'partner',
            visibility: 'partner',
          });
          setCreateOpen(false);
          bump();
        }}
        onCreateProject={() => {}}
      />
    </PageShell>
  );
}
