import React from 'react';
import { useWorkspaceLightPreview } from '../useWorkspaceLightPreview';
import { ProductWorkspaceShell } from '../product/components/ProductWorkspaceShell';

type WorkspaceKind = 'admin' | 'partner' | 'hub';

export function WlAppShell({
  children,
  workspace = 'hub',
  pageTitle,
  partnerId,
}: {
  children: React.ReactNode;
  workspace?: WorkspaceKind;
  livePath?: string;
  pageTitle?: string;
  partnerId?: string;
}) {
  const ctx = useWorkspaceLightPreview();
  const density = ctx.density ?? 'comfortable';

  if (workspace === 'hub') {
    return (
      <div className="fc-wl-app-shell fc-wl-native-surface">
        <div className={`fc-wl-app-inner fc-wl-app-inner--${density}`}>{children}</div>
      </div>
    );
  }

  const productPreview = (
    <ProductWorkspaceShell
      role={workspace}
      pageTitle={pageTitle ?? (workspace === 'admin' ? 'Command center' : 'Your dashboard')}
      partnerId={partnerId}
      presentationMode={ctx.presentationMode}
      dataMode={ctx.dataMode}
    >
      <div className="fc-wlp-content" data-density={density}>
        {children}
      </div>
    </ProductWorkspaceShell>
  );

  return productPreview;
}
