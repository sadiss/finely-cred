import React from 'react';
import { Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HAITIAN_HELPER_COMPLIANCE_EN } from '../../../../lib/haitianHelperPlaybook';
import { openHaitianCompanionChat } from '../../../../lib/haitianCompanionDesk';
import { FINELY_OS_COMPLIANCE_FOOTNOTE } from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { HaitianMarketingKitLibrary } from '../components/HaitianMarketingKitLibrary';
import './adminHaitianCommunityProductSurface.css';

export default function AdminHaitianCommunityProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Team · Haitian community"
      title="Haitian community"
      description="Download one page. Send it to a person’s email. City flyers are about a city — Send still needs a person."
      accent={navItem?.accent ?? 'emerald'}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? Languages}
      status="Closet ready — send one piece"
      primaryAction={
        <ProductPagePrimaryAction label="Pale Kreyòl" onClick={() => openHaitianCompanionChat()} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/haitian')}>
          View public page
        </button>
      }
    >
      <HaitianMarketingKitLibrary />
      <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{HAITIAN_HELPER_COMPLIANCE_EN}</p>
    </ProductHubScaffold>
  );
}
