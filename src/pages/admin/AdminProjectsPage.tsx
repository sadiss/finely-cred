import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import WorkProjectsHub from '../../features/work/views/WorkProjectsHub';

export default function AdminProjectsPage() {
  return (
    <PageShell badge="Admin" title="Work OS" subtitle="Delivery projects by journey phase — open any card for the full Asana-style workspace.">
      <WorkProjectsHub />
    </PageShell>
  );
}
