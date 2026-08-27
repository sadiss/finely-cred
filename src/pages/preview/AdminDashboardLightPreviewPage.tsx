import React from 'react';
import { WorkspaceLightPreviewShell } from '../../features/workspaceLightPreview';
import { AdminDashboardProductSurface } from '../../features/workspaceLightPreview/surfaces/AdminDashboardProductSurface';

/** Product-generation admin dashboard — `/preview/workspace-light/admin/dashboard`. */
export default function AdminDashboardLightPreviewPage() {
  return (
    <WorkspaceLightPreviewShell surfaceId="admin-dashboard" pageBed="admin">
      <AdminDashboardProductSurface />
    </WorkspaceLightPreviewShell>
  );
}
