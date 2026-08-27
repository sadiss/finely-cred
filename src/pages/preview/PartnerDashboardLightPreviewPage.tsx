import React from 'react';
import { WorkspaceLightPreviewShell } from '../../features/workspaceLightPreview';
import { PartnerDashboardProductSurface } from '../../features/workspaceLightPreview/surfaces/PartnerDashboardProductSurface';

/** Product-generation partner dashboard — `/preview/workspace-light/portal/dashboard`. */
export default function PartnerDashboardLightPreviewPage() {
  return (
    <WorkspaceLightPreviewShell surfaceId="partner-dashboard" pageBed="partner">
      <PartnerDashboardProductSurface />
    </WorkspaceLightPreviewShell>
  );
}
