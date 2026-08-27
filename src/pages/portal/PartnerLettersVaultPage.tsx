import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { PartnerLettersVaultWorkspace } from '../../components/letters/PartnerLettersVaultWorkspace';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';

const PORTAL_VAULT_NAVIGATION = {
  studioPath: '/portal/letters',
  documentsPath: '/portal/documents',
  vaultPath: '/portal/letters/vault',
} as const;

export default function PartnerLettersVaultPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const email = auth.user?.email || '';
  const { partner } = usePartnerSession();

  return (
    <PageShell
      badge="Partner Portal"
      title="Letters Vault"
      subtitle="Stored letters (PDF) with status tracking. Return to Letter Studio whenever you need to build or revise a draft."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>No partner profile found for this account.</div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
          <PartnerLettersVaultWorkspace partner={partner} actorEmail={email} navigation={PORTAL_VAULT_NAVIGATION} />
          <FinelyOsPageFooter />
        </EntitlementGate>
      )}
    </PageShell>
  );
}
