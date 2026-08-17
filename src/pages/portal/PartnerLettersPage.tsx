import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import {
  LettersCommandCenter,
  type LettersStudioTab,
} from '../../components/letters/LettersCommandCenter';
import { buildLetterStudioTrackTabs } from '../../components/letters/LetterTrackTabs';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { hasEntitlement } from '../../data/billingRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { PartnerRestoreWorkspaceDock } from '../../features/partner/PartnerRestoreWorkspaceDock';
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
    // Credit Letters: no validation / affidavits (those live under Debt Letters).
    if (t === 'validation' || t === 'court') return 'dispute';
    if (t === 'foreclosure' || t === 'repossession' || t === 'bankruptcy' || t === 'templates' || t === 'dispute' || t === 'overview') return t;
    return 'overview';
  });
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'validation' || t === 'court') {
      setStudioTab('dispute');
      navigate(`/portal/debt?tab=${t}`, { replace: true });
      window.setTimeout(() => {
        window.alert(
          t === 'court'
            ? 'Court / affidavit letters live under Debt Letters — opening that workstation.'
            : 'Validation letters live under Debt Letters — opening that workstation.',
        );
      }, 0);
      return;
    }
    if (t === 'foreclosure' || t === 'repossession' || t === 'bankruptcy' || t === 'templates' || t === 'dispute' || t === 'overview') {
      setStudioTab(t);
    }
  }, [searchParams, navigate]);

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
    () =>
      partner
        ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters) ||
          hasEntitlement(partner.id, ENTITLEMENT_KEYS.disputes)
        : false,
    [partner, storeVersion],
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

  const hasTemplates = useMemo(
    () => (partner ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates) : false),
    [partner, storeVersion],
  );

  const hubTabs = useMemo(
    () =>
      buildLetterStudioTrackTabs({ mode: 'credit', hasTemplates }).map((t) => ({
        id: t.id,
        label: t.label,
      })),
    [hasTemplates],
  );

  return (
    <PageShell
      badge="Partner Portal"
      title="Credit Letters"
      subtitle="Letter Studio — bureau disputes and credit-report letter tracks → paper preview → Letters Vault."
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
        eyebrow="Credit Letters"
        title="Credit letter workstations"
        subtitle="Bureaus, credit-focused foreclosure / repossession / bankruptcy, and templates. For validation and court affidavits, open Debt Letters."
        accent="fuchsia"
        kpis={[
          { label: 'Reports', value: String(stats.reports), hint: 'Uploaded', accent: 'violet' },
          { label: 'Cases', value: String(stats.cases), hint: 'Tracked', accent: 'amber' },
          { label: 'Vault', value: String(stats.letters), hint: 'Saved', accent: 'emerald' },
          { label: 'Track', value: studioTab, hint: 'Active', accent: 'sky' },
        ]}
        tabs={hubTabs}
        activeTab={studioTab}
        onTabChange={(id) => setStudioTab(id as LettersStudioTab)}
        primaryAction={{ label: 'Letters vault', onClick: () => navigate('/portal/letters/vault') }}
        secondaryAction={{ label: 'Debt Letters', onClick: () => navigate('/portal/debt') }}
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
      <PartnerRestoreWorkspaceDock variant="portal" className="mt-6 sticky bottom-3 z-20" />
      <FinelyOsPageFooter />
    </PageShell>
  );
}
