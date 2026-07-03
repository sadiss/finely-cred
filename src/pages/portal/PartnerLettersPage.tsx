import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import {
  LettersCommandCenter,
  type LettersStudioTab,
} from '../../components/letters/LettersCommandCenter';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { hasEntitlement } from '../../data/billingRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildLettersNoticedItems } from '../../lib/finelyProactiveSignals';
import { FINELY_OS_LUXURY_EMPTY, FINELY_OS_PAGE, FINELY_OS_SUCCESS_BTN } from '../../features/os/finelyOsLightUi';

export default function PartnerLettersPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [storeVersion, setStoreVersion] = useState(0);
  const [searchParams] = useSearchParams();
  const [studioTab, setStudioTab] = useState<LettersStudioTab>(() => {
    const t = searchParams.get('tab');
    if (t === 'validation' || t === 'court' || t === 'foreclosure' || t === 'repossession' || t === 'bankruptcy' || t === 'templates' || t === 'dispute') return t;
    return 'dispute';
  });

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const stats = useMemo(() => {
    if (!partner) return { reports: 0, cases: 0, letters: 0 };
    return {
      reports: listReportsByPartner(partner.id).length,
      cases: listCasesByPartner(partner.id).length,
      letters: listLettersByPartner(partner.id).length,
    };
  }, [partner, storeVersion]);

  const unlocked = useMemo(
    () => (partner ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters) : false),
    [partner, storeVersion],
  );
  if (!partner) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Letter Studio"
        subtitle="Bureau letters, validation, court affidavits, and bankruptcy — paper preview and vault save."
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
        title="Letter Studio"
        subtitle="Letter workstations are locked on your current plan. Upgrade to generate and save letters."
      >
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
          <div />
        </EntitlementGate>
      </PageShell>
    );
  }

  const hasDebt = useMemo(
    () => (partner ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.debt) : false),
    [partner, storeVersion],
  );

  const hubTabs = useMemo(() => {
    const tabs: Array<{ id: string; label: string }> = [{ id: 'dispute', label: 'Bureaus' }];
    if (hasDebt) {
      tabs.push({ id: 'validation', label: 'Validation' });
      tabs.push({ id: 'court', label: 'Affidavits & Court' });
      tabs.push({ id: 'foreclosure', label: 'Foreclosure' });
      tabs.push({ id: 'repossession', label: 'Repossession' });
    }
    tabs.push({ id: 'bankruptcy', label: 'Bankruptcy' });
    return tabs;
  }, [hasDebt]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Letter Studio"
      subtitle="Pick context → build a draft → paper preview → save to Letters Vault."
    >
      <FinelyNoticedStrip
        items={buildLettersNoticedItems({
          reportsCount: stats.reports,
          casesCount: stats.cases,
          lettersCount: stats.letters,
        })}
      />
      <FinelyNowDoThisStrip currentIndex={1} />
      <FinelyUnifiedHubLayout
        eyebrow="Letter Studio"
        title="Letter workstations"
        subtitle="Bureaus, FDCPA validation, court affidavits, and bankruptcy — each with proof upload, paper preview, and vault save."
        accent="fuchsia"
        kpis={[
          { label: 'Reports', value: String(stats.reports), hint: 'Uploaded', accent: 'violet' },
          { label: 'Cases', value: String(stats.cases), hint: 'Tracked', accent: 'amber' },
          { label: 'Vault', value: String(stats.letters), hint: 'Saved', accent: 'emerald' },
          { label: 'Studio', value: studioTab, hint: 'Tab', accent: 'sky' },
        ]}
        tabs={hubTabs}
        activeTab={studioTab}
        onTabChange={(id) => setStudioTab(id as LettersStudioTab)}
        primaryAction={{ label: 'Letters vault', onClick: () => navigate('/portal/letters/vault') }}
        contentVariant={studioTab === 'foreclosure' || studioTab === 'repossession' ? 'flush' : 'card'}
        tabDensity="comfortable"
      >
        <LettersCommandCenter
          partner={partner}
          layout="standalone"
          unifiedShell
          activeTab={studioTab}
          onTabChange={setStudioTab}
        />
      </FinelyUnifiedHubLayout>
      <FinelyOsPageFooter />
    </PageShell>
  );
}
