import React from 'react';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { ProductDebtWorkspace } from '../components/ProductDebtWorkspace';
import '../components/productDebtWorkspace.css';

/** Debt & court — split workbench with case inspector overlay and command deck. */
export default function PartnerDebtProductSurface(props: WorkspaceProductSurfaceProps) {
  return (
    <div className="fc-partner-debt-desk-root" data-surface-layout="split-workbench" data-product="debt-court">
      <ProductDebtWorkspace {...props} pageId={props.pageId ?? 'debt'} />
    </div>
  );
}
