import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import {
  getAdminServiceLine,
  getWorkspaceProductNavItem,
  type AdminServiceLineId,
} from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { AdminLeftoverWorkstationBody } from './AdminLeftoverWorkstationsSurface';

/**
 * Every leftover admin route gets the new product header first.
 * Dedicated surfaces replace this file page-by-page; tools stay live in the body.
 */
export default function AdminGraduatedWorkstationSurface(props: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const nav = getWorkspaceProductNavItem('admin', props.pageId);
  const archetype = getWorkspaceProductArchetype('admin', props.pageId);
  const line = nav ? getAdminServiceLine(nav.service as AdminServiceLineId) : null;
  const title = nav?.label ?? 'Admin workstation';
  const description = nav?.description ?? 'Your next step is on this page.';

  return (
    <ProductHubScaffold
      role="admin"
      pageId={props.pageId}
      eyebrow={line?.label ?? 'Admin'}
      title={title}
      description={description}
      accent={nav?.accent ?? 'violet'}
      surfaceMode={nav?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={nav?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label="Ask Finely"
          onClick={() => openProductCopilot({ prompt: `What should I do next on ${title}?`, contextLabel: title })}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin')}>
          Command center
        </button>
      }
      metricTitle="What this page is for"
      metricDescription={description}
    >
      <AdminLeftoverWorkstationBody {...props} />
      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
