import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { hasEntitlement } from '../../data/billingRepo';
import { PartnerCreditLettersStudioWorkspace } from '../../components/letters/PartnerCreditLettersStudioWorkspace';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_OS_LUXURY_EMPTY, FINELY_OS_PAGE, FINELY_OS_SUCCESS_BTN } from '../../features/os/finelyOsLightUi';

const PORTAL_LETTERS_NAVIGATION = {
  lettersPath: '/portal/letters',
  vaultPath: '/portal/letters/vault',
  reportsPath: '/portal/reports',
  disputesPath: '/portal/disputes',
  debtPath: '/portal/debt',
} as const;

export default function PartnerLettersPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();

  const unlocked = useMemo(
    () =>
      partner
        ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters) ||
          hasEntitlement(partner.id, ENTITLEMENT_KEYS.disputes)
        : false,
    [partner],
  );

  if (!partner) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Credit Letters"
        subtitle="Bureau disputes, credit-focused foreclosure/repo/bankruptcy letters, and templates."
      >
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>No partner profile found for this account.</div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SUCCESS_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </PageShell>
    );
  }

  if (!unlocked) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Credit Letters"
        subtitle="Credit letter workstations are locked on your current plan. Upgrade or ask your specialist to grant access."
      >
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
          <div />
        </EntitlementGate>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Partner Portal"
      title="Credit Letters"
      subtitle="Letter Studio — bureau disputes and credit-report letter tracks → paper preview → Letters Vault."
    >
      <PartnerCreditLettersStudioWorkspace partner={partner} navigation={PORTAL_LETTERS_NAVIGATION} />
      <FinelyOsPageFooter />
    </PageShell>
  );
}
