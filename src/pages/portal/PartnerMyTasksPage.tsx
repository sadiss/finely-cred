import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FolderKanban } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listProjectsByPartner } from '../../data/projectsRepo';
import { listTasksByPartner, createTask } from '../../data/tasksRepo';
import { listPartnerPortalProjects, listPartnerPortalTasks } from '../../lib/workVisibility';
import { WorkMyTasksPanel } from '../../features/work/views/WorkMyTasksPanel';
import { VoiceToTaskButton } from '../../features/work/components/VoiceToTaskButton';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPortalWorkNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type TasksTab = 'queue' | 'overdue' | 'projects';

export default function PartnerMyTasksPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<TasksTab>('queue');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const projects = useMemo(() => {
    if (!partner) return [];
    return listPartnerPortalProjects(listProjectsByPartner(partner.id));
  }, [partner, version]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const openTasks = useMemo(() => {
    if (!partner) return [];
    return listPartnerPortalTasks(listTasksByPartner(partner.id)).filter(
      (t) => t.status === 'pending' || t.status === 'in_progress',
    );
  }, [partner, version]);

  const overdueTasks = useMemo(
    () => openTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now()),
    [openTasks],
  );

  const activeProjectId = projects[0]?.id;

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

  return (
    <PageShell badge="Partner Portal" title="My tasks" subtitle="Everything you need to do across your projects.">
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Projects
        </button>

        <FinelyNoticedStrip
          items={buildPortalWorkNoticedItems({
            overdueTasks: overdueTasks.length,
            openTasks: openTasks.length,
            projectsCount: projects.length,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={tab === 'overdue' ? 1 : tab === 'projects' ? 2 : 0} />

        <FinelyUnifiedHubLayout
          eyebrow="Work OS"
          title="Your task queue"
          subtitle="Open work across all projects — sorted by urgency and due date."
          accent="violet"
          kpis={[
            { label: 'Open', value: String(openTasks.length), hint: 'Active tasks', accent: 'violet' },
            { label: 'Overdue', value: String(overdueTasks.length), hint: 'Needs action', accent: 'rose' },
            { label: 'Projects', value: String(projects.length), hint: 'Workspaces', accent: 'emerald' },
            { label: 'Stage', value: partner?.journeyStage ?? 'intake', hint: 'Journey', accent: 'sky' },
          ]}
          tabs={[
            { id: 'queue', label: 'Queue', badge: openTasks.length || undefined },
            { id: 'overdue', label: 'Overdue', badge: overdueTasks.length || undefined },
            { id: 'projects', label: 'Projects', badge: projects.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as TasksTab)}
          primaryAction={{ label: 'Projects hub', onClick: () => navigate('/portal/projects') }}
          secondaryAction={{ label: 'Fundability', onClick: () => navigate('/fundability-readiness') }}
        >
          {tab === 'queue' && (
            <div className="space-y-4">
              {activeProjectId ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex flex-wrap items-center justify-between gap-3`}>
                  <div>
                    <div className={FINELY_OS_ENTITY_VALUE}>Voice-to-task</div>
                    <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Speak a task — it lands on your active project.</div>
                  </div>
                  <VoiceToTaskButton onCapture={handleVoiceTask} />
                </div>
              ) : null}
              <WorkMyTasksPanel
                tasks={openTasks}
                projectById={projectById}
                workspaceBasePath="/portal/projects"
                compact
                onTasksChanged={() => setVersion((v) => v + 1)}
              />
            </div>
          )}

          {tab === 'overdue' && (
            <WorkMyTasksPanel
              tasks={overdueTasks}
              projectById={projectById}
              workspaceBasePath="/portal/projects"
              title="Overdue tasks"
              compact
              onTasksChanged={() => setVersion((v) => v + 1)}
            />
          )}

          {tab === 'projects' && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No projects yet — your service bundle will spawn work here.</div>
              ) : (
                <FinelyOsPaginatedStack
                  items={projects}
                  pageSize={4}
                  itemSpacingClassName="space-y-4"
                  renderItem={(p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/portal/projects/${p.id}`)}
                      className={`text-left ${finelyOsInlineListItem()} p-5 transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center gap-2 text-violet-300">
                        <FolderKanban size={16} />
                        <span className={FINELY_OS_ENTITY_SUBLABEL}>Project</span>
                      </div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</div>
                      <div className={`mt-2 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
                        Open workspace <ArrowRight size={12} />
                      </div>
                    </button>
                  )}
                />
              )}
              <button type="button" onClick={() => navigate('/portal/projects')} className={FINELY_OS_PRIMARY_BTN}>
                All projects <ArrowRight size={14} />
              </button>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
