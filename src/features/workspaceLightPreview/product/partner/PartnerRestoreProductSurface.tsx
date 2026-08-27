import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { PartnerRestoreWorkspace } from '../../../../features/partner/PartnerRestoreWorkspace';
import {
  DEFAULT_PARTNER_RESTORE_NAVIGATION,
  type PartnerRestoreNavigation,
} from '../../../../features/partner/partnerRestoreNavigation';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { ProductEmptyState } from '../components/ProductUi';
import { FINELY_OS_PAGE } from '../../../../features/os/finelyOsLightUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';

function restoreNavigation(map: (href: string) => string): PartnerRestoreNavigation {
  return {
    reportsPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.reportsPath),
    evidencePath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.evidencePath),
    documentsPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.documentsPath),
    disputesPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.disputesPath),
    lettersPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.lettersPath),
    letterVaultPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.letterVaultPath),
    projectsPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.projectsPath),
    dashboardPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.dashboardPath),
    debtPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.debtPath),
    myTasksPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.myTasksPath),
    checklistPath: map(DEFAULT_PARTNER_RESTORE_NAVIGATION.checklistPath),
  };
}

/** Full Personal Credit Restore entry station inside the workspace product shell — no nested PageShell. */
export default function PartnerRestoreProductSurface({ partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const mapPortalHref = usePartnerProductPathResolver();

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const navigation = useMemo(() => restoreNavigation(mapPortalHref), [mapPortalHref]);

  if (isDemo && !partner) {
    return (
      <ProductEmptyState
        title="Sign in to open Restore workspace"
        description="Your restore sequence needs a partner profile — sign in to walk reports, evidence, disputes, letters, and vault in order."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
            Sign in
          </button>
        }
      />
    );
  }

  if (!partner) {
    return (
      <ProductEmptyState
        title="Partner profile not found"
        description="Return to the command center and pick a partner context, or sign in with a partner account."
        action={
          <button
            type="button"
            className="fc-wlp-btn-primary"
            onClick={() => navigate(mapPortalHref('/portal/dashboard'))}
          >
            Return to dashboard
          </button>
        }
      />
    );
  }

  return (
    <section className={`fc-wlp-restore-workspace-embed ${FINELY_OS_PAGE}`} data-room="restore" data-surface-layout="timeline">
      <PartnerRestoreWorkspace
        partner={partner}
        embedded
        navigation={navigation}
        surface="light"
        showTours
        showDock={false}
      />
      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </section>
  );
}
