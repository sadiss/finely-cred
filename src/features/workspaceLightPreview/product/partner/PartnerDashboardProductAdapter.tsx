import React from 'react';
import { PartnerDashboardProductSurface } from '../../surfaces/PartnerDashboardProductSurface';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';

/** Live partner home — command deck with restore HUD, live signals, lender fit, and service rooms. */
export default function PartnerDashboardProductAdapter({ dataMode }: WorkspaceProductSurfaceProps) {
  return (
    <>
      <span hidden data-surface-kind="real" data-surface-key="partner:dashboard" data-surface-layout="command-deck" />
      <PartnerDashboardProductSurface embedded dataMode={dataMode} />
    </>
  );
}
