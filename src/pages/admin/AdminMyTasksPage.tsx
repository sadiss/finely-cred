import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { listProjects } from '../../data/projectsRepo';
import { createTask, listTasks } from '../../data/tasksRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { WorkMyTasksPanel } from '../../features/work/views/WorkMyTasksPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { VoiceToTaskButton } from '../../features/work/components/VoiceToTaskButton';
import { FINELY_OS_BACK_LINK, FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

export default function AdminMyTasksPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartnerIds(new Set()); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user, version]);

  const projectById = useMemo(() => new Map(listProjects().map((p) => [p.id, p])), [version]);

  const openTasks = useMemo(() => {
    return listTasks()
      .filter((t) => partnerIds.has(t.partnerId))
      .filter((t) => t.status === 'pending' || t.status === 'in_progress');
  }, [partnerIds, version]);

  const activeProject = useMemo(
    () => listProjects().find((p) => partnerIds.has(p.partnerId) && p.status === 'active'),
    [partnerIds, version],
  );

  return (
    <PageShell badge="Admin" title="My tasks" subtitle="Cross-project ops queue — Finely OS 400%.">
      <div className="space-y-4">
        <button type="button" onClick={() => navigate('/admin/projects')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Projects
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <VoiceToTaskButton
            disabled={!activeProject}
            onCapture={({ title, notes }) => {
              if (!activeProject) return;
              createTask({
                partnerId: activeProject.partnerId,
                projectId: activeProject.id,
                title,
                notes,
                kind: 'general',
                status: 'pending',
                assignedTo: 'admin',
                tags: ['voice_to_task'],
              });
              window.dispatchEvent(new Event('finely:store'));
              setVersion((v) => v + 1);
            }}
          />
          {!activeProject ? (
            <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Voice task needs at least one active project.</span>
          ) : null}
        </div>
        <WorkMyTasksPanel tasks={openTasks} projectById={projectById} workspaceBasePath="/admin/projects" title="Ops task queue" />
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
