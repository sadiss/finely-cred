import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import {
  getPartnerServiceLine,
  getWorkspaceProductNavItem,
  type PartnerServiceLineId,
} from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { PartnerLeftoverWorkstationBody } from './PartnerLeftoverWorkstationsSurface';

/**
 * Every leftover partner route gets the new product header first.
 * Dedicated surfaces replace this file page-by-page; tools stay live in the body.
 */
export default function PartnerGraduatedWorkstationSurface(props: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const nav = getWorkspaceProductNavItem('partner', props.pageId);
  const archetype = getWorkspaceProductArchetype('partner', props.pageId);
  const line = nav ? getPartnerServiceLine(nav.service as PartnerServiceLineId) : null;
  const title = nav?.label ?? 'Your workspace';
  const description = nav?.description ?? 'Your next step is on this page.';

  return (
    <ProductHubScaffold
      role="partner"
      pageId={props.pageId}
      eyebrow={line?.label ?? 'Workspace'}
      title={title}
      description={description}
      accent={nav?.accent ?? 'emerald'}
      surfaceMode={nav?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={nav?.icon}
      primaryAction={
        <ProductPagePrimaryAction
          label="Ask Finely"
          onClick={() => openProductCopilot({ prompt: `What should I do next on ${title}?`, contextLabel: title })}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/portal/dashboard')}>
          Dashboard
        </button>
      }
      metricTitle="What this page is for"
      metricDescription={description}
    >
      <PartnerLeftoverWorkstationBody {...props} />
      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
