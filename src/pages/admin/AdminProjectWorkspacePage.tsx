import React, { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { getProject, setProjectStage, setProjectStatus, upsertProject } from '../../data/projectsRepo';
import { getPartner } from '../../data/partnersRepo';
import { createTask, listTasks, setTaskStatus } from '../../data/tasksRepo';
import { getWorkboardSettings } from '../../data/settingsRepo';
import { useAuth } from '../../auth/AuthProvider';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { WorkItemCreateModal } from '../../components/workboard/WorkItemCreateModal';
import { TaskCreateWizard } from '../../features/work/workspace/TaskCreateWizard';
import { useProjectWorkspace } from '../../features/work/hooks/useProjectWorkspace';
import { ProjectWorkspaceBody } from '../../features/work/workspace/ProjectWorkspaceBody';
import type { TaskItem, TaskStatus } from '../../domain/tasks';
import type { Partner } from '../../domain/partners';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';

export default function AdminProjectWorkspacePage() {
  const auth = useAuth();
  const ws = useProjectWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [aiCreateOpen, setAiCreateOpen] = useState(false);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partnerName, setPartnerName] = useState<string>('');
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIds(new Set()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user, ws.version]);

  const project = useMemo(() => (ws.projectId ? getProject(ws.projectId) : null), [ws.projectId, ws.version]);

  useEffect(() => {
    if (!project) { setPartnerName(''); return; }
    getPartner(project.partnerId).then((p) => {
      setPartner(p);
      setPartnerName(p?.profile?.fullName || p?.profile?.email || '');
    });
  }, [project?.partnerId]);

  const tasks = useMemo(() => {
    if (!project || !partnerIds.has(project.partnerId)) return [];
    return listTasks().filter((t) => t.projectId === project.id);
  }, [project, partnerIds, ws.version]);

  const selectedTask = useMemo(() => (ws.taskId ? tasks.find((t) => t.id === ws.taskId) ?? null : null), [tasks, ws.taskId]);

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [ws.version]);
  const projectStageDefs = useMemo(() => getWorkboardSettings().projectStages, [ws.version]);
  const enabledTaskStages = useMemo(() => taskStageDefs.filter((s) => !s.disabled), [taskStageDefs]);
  const enabledProjectStages = useMemo(() => projectStageDefs.filter((s) => !s.disabled), [projectStageDefs]);
  const stageLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const projectStageLabel = project ? stageLabelById.get(String(project.stage)) ?? String(project.stage) : '';

  const bump = () => window.dispatchEvent(new Event('finely:store'));

  if (!ws.projectId) return <PageShell badge="Admin" title="Project not found" subtitle="" />;
  if (!project) return <PageShell badge="Admin" title="Project not found" subtitle="This project does not exist." />;
  if (!partnerIds.has(project.partnerId)) return <PageShell badge="Admin" title="Not authorized" subtitle="That project belongs to a different tenant." />;

  return (
    <PageShell badge="Admin" title={project.title} subtitle={`Work OS workspace · ${partnerName || project.partnerId}`}>
      <div className="space-y-6">
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
            partnerId: project.partnerId,
            scope: project.scope ?? 'personal',
            projectId: project.id,
            title,
            kind: 'general',
            stage: (enabledTaskStages[0]?.id ?? 'intake') as TaskItem['stage'],
            status: 'pending',
            notes,
            tags: ['voice-created'],
            assignedTo: 'both',
            visibility: 'hybrid',
          });
          ws.openTask(task.id);
          bump();
        }}
        onOpenTask={ws.openTask}
        onCloseTask={ws.closeTask}
        onTaskStatusChange={(id, status) => { setTaskStatus(id, status); bump(); }}
        onSaved={bump}
      />

      <TaskCreateWizard
        open={aiCreateOpen}
        partnerId={project.partnerId}
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
        partnerOptions={[{ id: project.partnerId, label: partnerName || project.partnerId }]}
        projectOptions={[{ id: project.id, label: project.title }]}
        defaultPartnerId={project.partnerId}
        defaultScope={project.scope ?? 'personal'}
        defaultProjectId={project.id}
        enabledTaskStages={enabledTaskStages}
        enabledProjectStages={enabledProjectStages}
        onCreateTask={(args) => {
          createTask({
            partnerId: project.partnerId,
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
            assignedTo: 'both',
            visibility: 'hybrid',
          });
          setCreateOpen(false);
          bump();
        }}
        onCreateProject={() => {}}
      />
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
