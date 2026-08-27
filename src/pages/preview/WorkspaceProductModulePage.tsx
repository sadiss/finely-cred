import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { WorkspaceLightPreviewShell } from '../../features/workspaceLightPreview';
import { WlAppShell } from '../../features/workspaceLightPreview/components/WlAppShell';
import { WorkspaceProductModuleSurface } from '../../features/workspaceLightPreview/product/components/WorkspaceProductModuleSurface';
import { getWorkspaceProductNavItem } from '../../features/workspaceLightPreview/product/workspaceProductNav';
import type { WorkspaceProductRole } from '../../features/workspaceLightPreview/product/workspaceProductTokens';

export default function WorkspaceProductModulePage({
  role,
  pageIdOverride,
}: {
  role: WorkspaceProductRole;
  pageIdOverride?: string;
}) {
  const { pageId: routePageId } = useParams<{ pageId: string }>();
  const pageId = pageIdOverride ?? routePageId;
  const { partner } = usePartnerSession();
  const item = getWorkspaceProductNavItem(role, pageId);

  if (!item || item.id === 'dashboard') {
    return (
      <Navigate
        to={
          role === 'admin'
            ? '/preview/workspace-light/admin/dashboard'
            : '/preview/workspace-light/portal/dashboard'
        }
        replace
      />
    );
  }

  return (
    <WorkspaceLightPreviewShell
      surfaceId={`${role}-${item.id}`}
      pageBed={role === 'admin' ? 'admin' : 'partner'}
    >
      <WlAppShell
        workspace={role}
        livePath={item.livePath}
        pageTitle={item.label}
        partnerId={partner?.id}
      >
        <WorkspaceProductModuleSurface role={role} pageId={pageId} partnerId={partner?.id} />
      </WlAppShell>
    </WorkspaceLightPreviewShell>
  );
}
