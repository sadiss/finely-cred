import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import '../../workspaceLightPreview.css';
import '../../workspaceLightSurfaces.css';
import '../workspaceProduct.css';
import '../../../os/finelyOsLuxuryGlassInk.css';
import type { WorkspaceProductRole } from '../workspaceProductTokens';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductWorkspaceShell } from './ProductWorkspaceShell';

function isChromeLessProductPath(pathname: string): boolean {
  return (
    pathname === '/developer' ||
    pathname.startsWith('/developer/') ||
    pathname.includes('/meeting/') ||
    pathname.includes('/video/')
  );
}

/**
 * Live-route layout for the new workspace product shell — no preview review toolbar or split view.
 */
export function ProductPageLayout({
  role,
  pageId,
  children,
}: {
  role: WorkspaceProductRole;
  pageId?: string;
  children?: React.ReactNode;
}) {
  const { partner } = usePartnerSession();
  const { pathname } = useLocation();
  const navItem = getWorkspaceProductNavItem(role, pageId);
  const pageTitle = navItem?.label ?? (role === 'admin' ? 'Command center' : 'Partner portal');

  if (isChromeLessProductPath(pathname)) {
    return <>{children ?? <Outlet />}</>;
  }

  return (
    <div data-fc-wlp-live-shell="1" className="fc-wl-preview-root min-h-screen">
      <ProductWorkspaceShell
        role={role}
        pageTitle={pageTitle}
        partnerId={partner?.id}
        presentationMode
        dataMode="real"
        navigationMode="live"
      >
        <div className="fc-wlp-content" data-density="comfortable">
          {children ?? <Outlet />}
        </div>
      </ProductWorkspaceShell>
    </div>
  );
}
