import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleHelp, FileText, Gavel, Landmark, LayoutDashboard, Mail, PenLine, PlayCircle, ScrollText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { hasEntitlement } from '../../../../data/billingRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { listCasesByPartner } from '../../../../data/casesRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import { LettersCommandCenter, type LettersStudioTab } from '../../../../components/letters/LettersCommandCenter';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../../../../features/os/finelyOsLightUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerLettersWritingDesk.css';

type LetterPhase = 'build' | 'review' | 'mail';

const PHASES: Array<{ id: LetterPhase; label: string; hint: string; accent: 'emerald' | 'violet' | 'sky'; icon: typeof PenLine }> = [
  { id: 'build', label: 'Build', hint: 'Pick a track and tradelines', accent: 'emerald', icon: PenLine },
  { id: 'review', label: 'Review', hint: 'Edit the paper preview', accent: 'violet', icon: ScrollText },
  { id: 'mail', label: 'Mail', hint: 'Send from Letters vault', accent: 'sky', icon: Mail },
];

const TRACK_TILES: Array<{
  id: LettersStudioTab;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof Gavel;
  needsTemplates?: boolean;
}> = [
  { id: 'overview', label: 'Overview', hint: 'What needs a letter', accent: 'emerald', icon: LayoutDashboard },
  { id: 'dispute', label: 'Bureaus', hint: 'Equifax, Experian, TransUnion', accent: 'violet', icon: Gavel },
  { id: 'foreclosure', label: 'Foreclosure', hint: 'Credit-report foreclosure items', accent: 'sky', icon: Landmark },
  { id: 'repossession', label: 'Repossession', hint: 'Credit-report repo items', accent: 'rose', icon: Landmark },
  { id: 'bankruptcy', label: 'Bankruptcy', hint: 'Credit-report bankruptcy items', accent: 'emerald', icon: Landmark },
  { id: 'templates', label: 'Templates', hint: 'Start from a saved body', accent: 'violet', icon: FileText, needsTemplates: true },
];

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

function phaseForTab(tab: LettersStudioTab): LetterPhase {
  if (tab === 'dispute') return 'review';
  return 'build';
}

function vaultUrl(base: string, args?: { letterId?: string; preview?: boolean }) {
  const qs = new URLSearchParams();
  if (args?.letterId) qs.set('letterId', args.letterId);
  if (args?.preview) qs.set('preview', '1');
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}

export default function PartnerLettersProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { partner: sessionPartner } = usePartnerSession();
  const isDemo = dataMode === 'demo' || !partnerId;
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Mail;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);

  const lettersPath = mapPortalHref('/portal/letters');
  const vaultPath = mapPortalHref('/portal/letters/vault');
  const reportsPath = mapPortalHref('/portal/reports');
  const disputesPath = mapPortalHref('/portal/disputes');
  const debtPath = mapPortalHref('/portal/debt');

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const [storeVersion, setStoreVersion] = useState(0);
  const [studioTab, setStudioTab] = useState<LettersStudioTab>(() => {
    const parsed = parseStudioTab(new URLSearchParams(location.search).get('tab'));
    return parsed && parsed !== 'validation' && parsed !== 'court' ? parsed : 'overview';
  });

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t === 'validation' || t === 'court') {
      setStudioTab('dispute');
      navigate(`${debtPath}?tab=${t}`, { replace: true });
      return;
    }
    const parsed = parseStudioTab(t);
    if (parsed) setStudioTab(parsed);
  }, [debtPath, location.search, navigate]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const unlocked = useMemo(
    () =>
      partner
        ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.letters) ||
          hasEntitlement(partner.id, ENTITLEMENT_KEYS.disputes)
        : false,
    [partner],
  );

  const hasTemplates = useMemo(
    () => (partner ? hasEntitlement(partner.id, ENTITLEMENT_KEYS.templates) : false),
    [partner, storeVersion],
  );

  const stats = useMemo(() => {
    if (!partner) return { reports: 0, cases: 0, letters: 0 };
    return {
      reports: listReportsByPartner(partner.id).length,
      cases: listCasesByPartner(partner.id).length,
      letters: listLettersByPartner(partner.id).length,
    };
  }, [partner, storeVersion]);

  const visibleTracks = TRACK_TILES.filter((tile) => !tile.needsTemplates || hasTemplates || isDemo);
  const activePhase = phaseForTab(studioTab);

  const selectTrack = (tab: LettersStudioTab) => {
    setStudioTab(tab);
    const next = new URLSearchParams(location.search);
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    const qs = next.toString();
    navigate(qs ? `${lettersPath}?${qs}` : lettersPath, { replace: true });
  };

  const selectPhase = (phase: LetterPhase) => {
    if (phase === 'mail') {
      navigate(vaultPath);
      return;
    }
    selectTrack(phase === 'review' ? 'dispute' : 'overview');
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Reports',
      value: isDemo ? 2 : stats.reports,
      hint: stats.reports ? 'Ready to pull tradelines' : 'Upload a bureau report first',
      accent: 'emerald',
      icon: FileText,
      onClick: () => navigate(reportsPath),
    },
    {
      label: 'Cases',
      value: isDemo ? 1 : stats.cases,
      hint: 'Tracked dispute rounds',
      accent: 'violet',
      icon: Gavel,
      onClick: () => navigate(disputesPath),
    },
    {
      label: 'Vault',
      value: isDemo ? 3 : stats.letters,
      hint: 'Saved letters',
      accent: 'sky',
      icon: ScrollText,
      onClick: () => navigate(vaultPath),
    },
    {
      label: 'Track',
      value: visibleTracks.find((t) => t.id === studioTab)?.label ?? 'Overview',
      hint: 'Active writing room',
      accent: 'rose',
      icon: PenLine,
    },
  ];

  const writingDesk = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-wlp-letters-desk`} data-surface-layout="writing-desk">
      <div className="fc-wlp-letters-blotter" role="group" aria-label="Letter workflow">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const active = activePhase === phase.id;
          const done = PHASES.findIndex((p) => p.id === activePhase) > PHASES.findIndex((p) => p.id === phase.id);
          return (
            <button
              key={phase.id}
              type="button"
              className={`fc-wlp-letters-phase ${finelyOsCatalogCard(phase.accent)} p-5 lg:p-6`}
              data-fc-accent={phase.accent}
              data-active={active ? 'true' : undefined}
              onClick={() => selectPhase(phase.id)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  {done ? <Check size={20} /> : <Icon size={20} />}
                </span>
                <div>
                  <div className={`fc-wlp-letters-phase-label font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{phase.label}</div>
                  <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{phase.hint}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="fc-wlp-letters-inks" role="tablist" aria-label="Letter tracks">
        {visibleTracks.map((track) => {
          const Icon = track.icon;
          const active = studioTab === track.id;
          return (
            <button
              key={track.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`fc-wlp-letters-ink ${finelyOsCatalogCard(track.accent)} p-5 lg:p-6`}
              data-fc-accent={track.accent}
              data-active={active ? 'true' : undefined}
              onClick={() => selectTrack(track.id)}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{track.label}</div>
                  <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{track.hint}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className={`fc-wlp-letters-paper ${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
        <div className="mb-5">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Writing paper</p>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
            {visibleTracks.find((t) => t.id === studioTab)?.label ?? 'Overview'}
          </h2>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Debt validation and court letters live on the Debt desk — this paper is for bureau disputes.
          </p>
        </div>
        {partner ? (
          <LettersCommandCenter
            partner={partner}
            layout="standalone"
            unifiedShell
            activeTab={studioTab}
            onTabChange={selectTrack}
            mapPortalHref={mapPortalHref}
            onOpenVault={(args) => navigate(vaultUrl(vaultPath, args))}
            onOpenReports={() => navigate(reportsPath)}
            onOpenDisputeCenter={() => navigate(disputesPath)}
            onOpenDebtCenter={() => navigate(debtPath)}
          />
        ) : (
          <ProductEmptyState
            title="Sign in to write letters"
            description="Credit Letters needs your partner profile to pull tradelines and save drafts."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            }
          />
        )}
      </div>
    </section>
  );

  if (isDemo && !partner) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="letters"
        eyebrow="Credit letters"
        title="Build bureau dispute letters"
        description="Pick tradelines, attach screenshot proof, edit the paper, and save PDFs to your Letters vault."
        status="Demo desk · sample letter workflow"
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="jewel"
        metrics={metrics}
        metricTitle="Letter desk"
        metricDescription="Reports, cases, and saved letters that feed this paper."
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        {writingDesk}
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductEmptyState
        title="Partner profile not found"
        description="Return to Home and pick a partner context, or sign in with a partner account."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/portal/dashboard'))}>
            Return to Home
          </button>
        }
      />
    );
  }

  if (!unlocked) {
    return (
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
        <div />
      </EntitlementGate>
    );
  }

  return (
    <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.letters]}>
      <ProductHubScaffold
        role={role}
        pageId="letters"
        eyebrow="Credit letters"
        title="Build bureau dispute letters"
        description="Pick tradelines, attach screenshot proof, edit the paper, and save PDFs to your Letters vault."
        status={`${stats.letters} saved letter${stats.letters === 1 ? '' : 's'} · ${isDemo ? 'demo data' : 'live data'}`}
        freshness={isDemo ? 'demo snapshot' : 'just now'}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="jewel"
        metrics={metrics}
        metricTitle="Letter desk"
        metricDescription="Reports, cases, and saved letters that feed this paper."
        primaryAction={<ProductPagePrimaryAction label="Open vault" onClick={() => navigate(vaultPath)} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(debtPath)}>
            Debt letters
          </button>
        }
      >
        {writingDesk}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon">
            <PageIcon size={22} strokeWidth={2.05} />
          </div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{stats.reports ? 'Pick a bureau track and draft' : 'Upload a credit report first'}</h2>
          <p>
            {stats.reports
              ? 'Open Bureaus, attach screenshot proof, then mark the letter final so it lands in the vault.'
              : 'Letter Studio pulls tradelines from your uploaded bureau reports.'}
          </p>
          <ol>
            <li>Choose Overview or Bureaus on the desk.</li>
            <li>Attach proof and edit the paper preview.</li>
            <li>Save the PDF, then mail from Letters vault.</li>
          </ol>
          <div className="fc-wlp-page-guide-actions">
            <button
              type="button"
              onClick={() =>
                openProductCopilot({
                  prompt: 'How do I build and mail a bureau dispute letter?',
                  contextLabel: 'Credit letters',
                })
              }
            >
              <CircleHelp size={15} /> Ask Finely
            </button>
            <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
              <PlayCircle size={15} /> Watch how
            </button>
          </div>
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line mt-4">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    </EntitlementGate>
  );
}
