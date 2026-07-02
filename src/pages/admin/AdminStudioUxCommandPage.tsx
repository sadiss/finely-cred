import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { StudioUxCommandDashboard } from '../../features/studioCommandOs/StudioUxCommandDashboard';

export default function AdminStudioUxCommandPage() {
  return (
    <PageShell badge="Admin" title="Studio UX Command OS" subtitle="Unified command layer for Media, Comms, Automation, Lead cleanup, and site-wide layout refactors." back={{ to: -1 }}>
      <StudioUxCommandDashboard />
    </PageShell>
  );
}
