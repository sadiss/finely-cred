import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LettersCommandCenter,
  type LettersStudioTab,
} from './LettersCommandCenter';
import { buildLetterStudioTrackTabs } from './LetterTrackTabs';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement } from '../../data/billingRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { PartnerRestoreWorkspaceDock } from '../../features/partner/PartnerRestoreWorkspaceDock';
import { PartnerLetterStudioChrome } from './PartnerLetterStudioChrome';
import type { Partner } from '../../domain/partners';

export type PartnerCreditLettersNavigation = {
  lettersPath: string;
  vaultPath: string;
  reportsPath: string;
  disputesPath: string;
  debtPath: string;
};

function vaultUrl(base: string, args?: { letterId?: string; preview?: boolean }) {
  const qs = new URLSearchParams();
  if (args?.letterId) qs.set('letterId', args.letterId);
  if (args?.preview) qs.set('preview', '1');
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}

function parseStudioTab(raw: string | null): LettersStudioTab | null {
  if (raw === 'validation' || raw === 'court') return raw;
  if (
    raw === 'foreclosure' ||
    raw === 'repossession' ||
    raw === 'bankruptcy' ||
    raw === 'templates' ||
    raw === 'dispute' ||
    raw === 'overview'
  ) {
    return raw;
  }
  return null;
}

/**
 * Shared Credit Letters studio — bureau disputes, credit-focused foreclosure/repo/bankruptcy,
 * templates, evidence capture, build/edit, review, and vault handoff. Used by the live portal
 * page and the workspace-light product preview without nested PageShells.
 */
export function PartnerCreditLettersStudioWorkspace({
  partner,
  navigation,
  mapPortalHref,
  showTours: _showTours = false,
  showDock = true,
  showKpis = true,
  surface = 'dark',
}: {
  partner: Partner;
  navigation: PartnerCreditLettersNavigation;
  mapPortalHref?: (href: string) => string;
  showTours?: boolean;
  showDock?: boolean;
  showKpis?: boolean;
  surface?: 'dark' | 'light';
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeVersion, setStoreVersion] = useState(0);
  const [studioTab, setStudioTab] = useState<LettersStudioTab>(() => {
    const t = new URLSearchParams(location.search).get('tab');
    const parsed = parseStudioTab(t);
    if (t === 'validation' || t === 'court') return 'dispute';
    return parsed ?? 'overview';
  });

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t === 'validation' || t === 'court') {
      setStudioTab('dispute');
      navigate(`${navigation.debtPath}?tab=${t}`, { replace: true });
      window.setTimeout(() => {
        window.alert(
          t === 'court'
            ? 'Court / affidavit letters live under Debt Letters — opening that workstation.'
            : 'Validation letters live under Debt Letters — opening that workstation.',
        );
      }, 0);
      return;
    }
    const parsed = parseStudioTab(t);
    if (parsed) setStudioTab(parsed);
  }, [location.search, navigate, navigation.debtPath]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const stats = useMemo(
    () => ({
      reports: listReportsByPartner(partner.id).length,
      cases: listCasesByPartner(partner.id).length,
      letters: listLettersByPartner(partner.id).length,
    }),
    [partner.id, storeVersion],
  );

  const hasTemplates = useMemo(
    () => hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates),
    [partner.id, storeVersion],
  );

  const trackTabs = useMemo(
    () => buildLetterStudioTrackTabs({ mode: 'credit', hasTemplates }),
    [hasTemplates],
  );

  return (
    <>
      <PartnerLetterStudioChrome
        studioTab={studioTab}
        trackTabs={trackTabs}
        onTabChange={setStudioTab}
        surface={surface}
        showKpis={showKpis}
        kpis={[
          { label: 'Reports', value: String(stats.reports), hint: 'Uploaded', accent: 'violet' },
          { label: 'Cases', value: String(stats.cases), hint: 'Tracked', accent: 'rose' },
          { label: 'Vault', value: String(stats.letters), hint: 'Saved', accent: 'emerald' },
          { label: 'Track', value: studioTab, hint: 'Active', accent: 'sky' },
        ]}
        primaryAction={{ label: 'Letters vault', onClick: () => navigate(navigation.vaultPath) }}
        secondaryAction={{ label: 'Debt Letters', onClick: () => navigate(navigation.debtPath) }}
        onOpenVault={() => navigate(navigation.vaultPath)}
        onPhaseChange={(phase) => {
          if (phase === 'build') setStudioTab('overview');
          else if (phase === 'review') setStudioTab('dispute');
        }}
        contentFlush={studioTab === 'foreclosure' || studioTab === 'repossession'}
      >
        <LettersCommandCenter
          partner={partner}
          layout="standalone"
          unifiedShell
          activeTab={studioTab}
          onTabChange={setStudioTab}
          mapPortalHref={mapPortalHref}
          onOpenVault={(args) => navigate(vaultUrl(navigation.vaultPath, args))}
          onOpenReports={() => navigate(navigation.reportsPath)}
          onOpenDisputeCenter={() => navigate(navigation.disputesPath)}
          onOpenDebtCenter={() => navigate(navigation.debtPath)}
        />
      </PartnerLetterStudioChrome>
      {showDock ? <PartnerRestoreWorkspaceDock variant="portal" className="mt-6 sticky bottom-3 z-20" /> : null}
    </>
  );
}
