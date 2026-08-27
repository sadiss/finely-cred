import React from 'react';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { StudioUxCommandDashboard } from '../../features/studioCommandOs/StudioUxCommandDashboard';

export default function AdminStudioUxCommandPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  return (
    <AdminWorkstationFrame embedded={embedded} kind="studio-ux-command-workstation" badge="Admin" title="Studio UX Command OS" subtitle="Unified command layer for Media, Comms, Automation, Lead cleanup, and site-wide layout refactors." back={{ to: -1 }}>
      <StudioUxCommandDashboard />
    </AdminWorkstationFrame>
  );
}
