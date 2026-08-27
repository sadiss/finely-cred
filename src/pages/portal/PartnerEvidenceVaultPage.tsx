import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import {
  PartnerEvidenceVaultWorkspace,
  type PartnerEvidenceVaultNavigation,
} from '../../components/evidence/PartnerEvidenceVaultWorkspace';
import { PageShell } from '../../components/layout/PageShell';
import { PartnerRestoreWorkspaceDock } from '../../features/partner/PartnerRestoreWorkspaceDock';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';

const PORTAL_EVIDENCE_NAVIGATION: PartnerEvidenceVaultNavigation = {
  evidenceVaultPath: '/portal/evidence',
  reportsPath: '/portal/reports',
  lettersPath: '/portal/letters',
  disputesPath: '/portal/disputes',
  documentsPath: '/portal/documents',
  dashboardPath: '/portal/dashboard',
};

export default function PartnerEvidenceVaultPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();

  return (
    <PageShell
      badge="Partner Portal"
      title="Evidence Vault"
      subtitle="Keep report crops, bureau replies, collector correspondence, and source proof tied to the dispute finding they support."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you’re an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
          <div className={FINELY_OS_PAGE}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/portal/dashboard')}
                className={FINELY_OS_BACK_LINK}
                title="Back to Partner Dashboard"
              >
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={FINELY_OS_BACK_LINK}
                title="Back to Finely Cred Dashboard"
              >
                <ArrowLeft size={16} /> Finely Cred
              </button>
            </div>

            <PartnerEvidenceVaultWorkspace
              partner={partner}
              actorEmail={auth.user?.email || ''}
              navigation={PORTAL_EVIDENCE_NAVIGATION}
            />

            <PartnerRestoreWorkspaceDock variant="portal" className="mt-6 sticky bottom-3 z-20" />
            <FinelyOsPageFooter />
          </div>
        </EntitlementGate>
      )}
    </PageShell>
  );
}
