import React, { useMemo, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import WorkTasksProjectsHub from '../../features/work/views/WorkTasksProjectsHub';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listProjectsByPartner } from '../../data/projectsRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listPartnerPortalProjects, listPartnerPortalTasks } from '../../lib/workVisibility';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_OS_PAGE } from '../../features/os/finelyOsLightUi';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPortalWorkNoticedItems } from '../../lib/finelyProactiveSignals';
import { pickMostOverdueTask, partnerTaskDeepLink } from '../../lib/partnerWorkNavigation';

type HubTab = 'projects' | 'tasks';

export default function PartnerProjectsPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<HubTab>('projects');
  const projects = useMemo(
    () => (partner ? listPartnerPortalProjects(listProjectsByPartner(partner.id)) : []),
    [partner],
  );
  const tasks = useMemo(
    () => (partner ? listPartnerPortalTasks(listTasksByPartner(partner.id)) : []),
    [partner],
  );
  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = openTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < Date.now());

  const mostOverdue = useMemo(() => pickMostOverdueTask(overdueTasks), [overdueTasks]);

  return (
    <PageShell badge="Partner Portal" title="Your projects" subtitle="Track the work Finely and your specialist assigned to you — start with what's overdue.">
      <div className={FINELY_OS_PAGE}>
        <FinelyNoticedStrip
          items={buildPortalWorkNoticedItems({
            overdueTasks: overdueTasks.length,
            openTasks: openTasks.length,
            projectsCount: projects.length,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={tab === 'tasks' && overdueTasks.length > 0 ? 1 : 0} />

        <FinelyUnifiedHubLayout
          eyebrow="Projects & tasks"
          title="Your assigned work"
          subtitle="See what is due, what is waiting, and what Finely already finished for you."
          accent="violet"
          kpis={[
            { label: 'Projects', value: String(projects.length), hint: 'Active lanes', accent: 'violet' },
            { label: 'Open tasks', value: String(openTasks.length), hint: 'Needs action', accent: 'rose' },
            { label: 'Overdue', value: String(overdueTasks.length), hint: 'Due past', accent: 'rose' },
            { label: 'Scope', value: 'Personal + biz', hint: 'Filter below', accent: 'sky' },
          ]}
          tabs={[
            { id: 'projects', label: 'Projects', badge: projects.length || undefined },
            { id: 'tasks', label: 'Tasks', badge: openTasks.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={
            mostOverdue
              ? {
                  label: 'Open your most overdue task',
                  onClick: () => navigate(partnerTaskDeepLink(mostOverdue)),
                }
              : { label: 'My tasks', onClick: () => navigate('/portal/my-tasks') }
          }
          secondaryAction={{ label: 'Dashboard', onClick: () => navigate('/portal/dashboard') }}
        >
          {partner ? (
            <WorkTasksProjectsHub
              role="partner"
              partnerId={partner.id}
              partner={partner}
              partnerById={new Map([[partner.id, partner]])}
              controlledTab={tab}
              onTabChange={setTab}
              workspaceBasePath="/portal/projects"
              compactHero
            />
          ) : null}
        </FinelyUnifiedHubLayout>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
