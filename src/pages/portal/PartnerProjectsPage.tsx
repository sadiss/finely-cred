import React, { useMemo, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import WorkPartnerProjectsHub from '../../features/work/views/WorkPartnerProjectsHub';
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

export default function PartnerProjectsPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
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

  return (
    <PageShell badge="Partner Portal" title="Your projects" subtitle="Work OS — open any project for tasks, progress, and AI playbook help.">
      <div className={FINELY_OS_PAGE}>
        <FinelyNoticedStrip
          items={buildPortalWorkNoticedItems({
            overdueTasks: overdueTasks.length,
            openTasks: openTasks.length,
            projectsCount: projects.length,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={overdueTasks.length > 0 ? 1 : 0} />
        <FinelyUnifiedHubLayout
          eyebrow="Work OS"
          title="Projects & delivery"
          subtitle="Personal and business credit projects — tap a card for the full workspace."
          accent="violet"
          kpis={[
            { label: 'Projects', value: String(projects.length), hint: 'Active lanes', accent: 'violet' },
            { label: 'Open tasks', value: String(openTasks.length), hint: 'Needs action', accent: 'amber' },
            { label: 'Completed', value: String(tasks.filter((t) => t.status === 'completed').length), hint: 'Done', accent: 'emerald' },
            { label: 'Scope', value: 'Personal + biz', hint: 'Filter below', accent: 'sky' },
          ]}
          tabs={[{ id: 'projects', label: 'Projects' }]}
          activeTab="projects"
          primaryAction={{ label: 'My tasks', onClick: () => navigate('/portal/my-tasks') }}
          secondaryAction={{ label: 'Dashboard', onClick: () => navigate('/portal/dashboard') }}
        >
          <WorkPartnerProjectsHub />
        </FinelyUnifiedHubLayout>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
