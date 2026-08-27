import React from 'react';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import PartnerReportsProductSurface from './PartnerReportsProductSurface';

/**
 * Native reports product — command deck + split workbench. No legacy page embed.
 */
export default function PartnerReportsProductAdapter(props: WorkspaceProductSurfaceProps) {
  return <PartnerReportsProductSurface {...props} />;
}
