import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CircleHelp,
  Crown,
  Layers,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { BusinessCreditWorkspaceHero } from '../../../../components/business/BusinessCreditWorkspaceHero';
import { BusinessFundabilityScorecard } from '../../../../components/business/BusinessFundabilityScorecard';
import { BusinessCreditRoadmapPanel } from '../../../../components/business/BusinessCreditRoadmapPanel';
import { BUSINESS_ROADMAP_STEPS } from '../../../../domain/businessCredit';
import { getBusinessCreditProfile } from '../../../../data/businessCreditRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { evaluateFoundationSteps } from '../../../../lib/businessVendorSequencing';
import type { Partner } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';

const SERVICE_LINE_ID = 'business' as const;

const MODULE_CARDS = [
  { path: '/business/profile', label: 'Business profile', body: 'Entity, EIN, NAICS, address hygiene.', cta: 'Open profile', icon: Building2, accent: 'violet' as const },
  { path: '/business/vendors', label: 'Vendor center', body: 'Tier 1–4 sequencing with foundation gates.', cta: 'Open vendors', icon: Target, accent: 'rose' as const },
  { path: '/business/bureaus', label: 'Bureau & scores', body: 'D&B, Experian Business, Equifax Business.', cta: 'Track scores', icon: TrendingUp, accent: 'sky' as const },
  { path: '/business/lender-logic', label: 'Lender logic engine', body: 'Model fit before you apply.', cta: 'Run engine', icon: Sparkles, accent: 'emerald' as const },
  { path: '/business/billion-path', label: 'Capital readiness', body: 'Entity structure and underwriting doc package.', cta: 'Open capital hub', icon: Crown, accent: 'violet' as const },
  { path: '/business/disputes', label: 'Business disputes', body: 'Challenge inaccurate commercial bureau entries.', cta: 'Dispute center', icon: ShieldCheck, accent: 'rose' as const },
];

function partnerOwnsBusinessLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; partner: Partner };

export default function PartnerBusinessProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = useMemo(
    () => (partnerId ? getPartnerSync(partnerId) ?? sessionPartner : sessionPartner),
    [partnerId, sessionPartner],
  );
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Building2;
  const scaffoldAccent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!partnerOwnsBusinessLine(partnerId!)) {
        if (!cancelled) setState({ status: 'locked' });
        return;
      }
      const loaded = getPartnerSync(partnerId!);
      if (!loaded) throw new Error('Partner profile not found.');
      if (!cancelled) setState({ status: 'ready', partner: loaded });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your business credit workspace right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);
  const activePartner = state.status === 'ready' ? state.partner : partner;

  const profileMetrics = useMemo(() => {
    if (!activePartner) {
      return { foundationPct: 0, roadmapDone: 0, vendorTierDone: false, fundingReady: false };
    }
    const profile = getBusinessCreditProfile(activePartner.id);
    const roadmapDone = BUSINESS_ROADMAP_STEPS.filter((s) => profile.roadmap?.[s.id]?.done).length;
    const foundation = evaluateFoundationSteps({
      business: (activePartner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business,
      partnerId: activePartner.id,
    });
    return {
      foundationPct: foundation.percent,
      roadmapDone,
      vendorTierDone: Boolean(profile.roadmap?.vendor_tier1?.done),
      fundingReady: Boolean(profile.roadmap?.funding_package?.done),
    };
  }, [activePartner]);

  const metrics: ProductMetric[] = useMemo(
    () => [
      { label: 'Foundation', value: `${profileMetrics.foundationPct}%`, hint: 'Entity + EIN', accent: 'emerald', icon: Building2, onClick: () => navigate(mapPortalHref('/business/profile')) },
      { label: 'Vendor stack', value: profileMetrics.vendorTierDone ? 'Tier 1+' : 'Start', hint: 'Reporting vendors', accent: 'rose', icon: Target, onClick: () => navigate(mapPortalHref('/business/vendors')) },
      { label: 'Roadmap', value: `${profileMetrics.roadmapDone}/10`, hint: '10-step path', accent: 'sky', icon: TrendingUp, onClick: () => navigate(mapPortalHref('/business/dashboard')) },
      { label: 'Capital', value: profileMetrics.fundingReady ? 'Ready' : 'Building', hint: 'Doc package', accent: 'violet', icon: Crown, onClick: () => navigate(mapPortalHref('/business/billion-path')) },
    ],
    [mapPortalHref, navigate, profileMetrics],
  );

  const askFinelyPrompt = 'What foundation gap should I close first for business credit?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Business credit' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const commandDeckBody = (
    <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="command-hero-rooms">
      <BusinessCreditWorkspaceHero partner={activePartner ?? null} />

      <div className="grid gap-6 xl:grid-cols-3 items-start">
        <article className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4 min-w-0`} data-fc-accent="emerald">
          <p className="fc-wlp-eyebrow">Score</p>
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Fundability</h2>
          {activePartner ? <BusinessFundabilityScorecard partner={activePartner} /> : (
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Sign in to see your fundability score.</p>
          )}
        </article>

        <article className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4 min-w-0`} data-fc-accent="violet">
          <p className="fc-wlp-eyebrow">Next vendors</p>
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Roadmap</h2>
          {activePartner ? <BusinessCreditRoadmapPanel partnerId={activePartner.id} /> : (
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Your vendor roadmap opens after the entity file is linked.</p>
          )}
        </article>

        <article className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4 min-w-0`} data-fc-accent="sky">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-sky-400" />
            <div>
              <p className="fc-wlp-eyebrow">Workstations</p>
              <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Jump</h2>
            </div>
          </div>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Open profile, vendors, bureaus, capital, or disputes.</p>
          <div className="grid gap-3">
            {MODULE_CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(mapPortalHref(item.path))}
                  className={`text-left ${finelyOsCatalogCard(item.accent)} p-4 lg:p-5`}
                  data-fc-accent={item.accent}
                >
                  <Icon size={16} className="mb-2 opacity-80" />
                  <div className={`font-extrabold text-lg ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
                  <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{item.body}</div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
                    {item.cta} <ArrowRight size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Business credit'}
        title={demoSpec?.title ?? 'Business Credit OS'}
        description={demoSpec?.description ?? 'Entity fundability, vendor sequencing, bureau scores, and capital readiness.'}
        status={`${demoSpec?.status ?? 'Foundation in progress'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="instrument"
        metrics={demoSpec?.metrics?.map((m) => ({ ...m, onClick: () => navigate(mapPortalHref('/business/dashboard')) })) ?? metrics}
        metricTitle={demoSpec?.metricTitle ?? 'Fundability pulse'}
        metricDescription={demoSpec?.metricDescription ?? 'Foundation, vendors, roadmap, and capital package on one deck.'}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Open business profile'} onClick={() => navigate(mapPortalHref('/business/profile'))} />}
      >
        {commandDeckBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your business credit workspace" />;
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Business credit"
        title="Business Credit OS"
        description="Entity fundability, vendor sequencing, bureau scores, and capital readiness."
        status="Could not load workspace"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your business workspace"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  if (state.status === 'locked') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Business credit"
        title="Business Credit OS"
        description="Entity fundability, vendor sequencing, bureau scores, and capital readiness."
        status="Not started yet · live data"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="instrument"
        primaryAction={<ProductPagePrimaryAction label="Explore business credit" onClick={() => navigate(serviceLine.upsellPath)} />}
        metrics={metrics}
        metricTitle="What business credit unlocks"
        metricDescription="Entity fundability, vendor tiers, bureau reporting, and capital readiness on the EIN."
      >
        <ProductEmptyState
          title="Not started yet"
          description={serviceLine.upsellHeadline}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>
              See business options <ArrowRight size={15} />
            </button>
          }
        />
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  const { partner: loadedPartner } = state;
  const profile = getBusinessCreditProfile(loadedPartner.id);
  const foundation = evaluateFoundationSteps({
    business: (loadedPartner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business,
    partnerId: loadedPartner.id,
  });
  const statusHeadline = foundation.complete
    ? `${profileMetrics.roadmapDone}/10 roadmap · Tier ${profileMetrics.vendorTierDone ? '1+' : 'locked'}`
    : `Foundation ${foundation.percent}% · ${profileMetrics.roadmapDone}/10 roadmap`;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Business credit"
      title="Business Credit OS"
      description="Entity fundability, vendor sequencing, bureau scores, and capital readiness — one execution layer."
      status={`${statusHeadline} · live data`}
      freshness={profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'just now'}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="instrument"
      metrics={metrics}
      metricTitle="Fundability pulse"
      metricDescription="Foundation, vendors, roadmap, and capital package on one deck."
      primaryAction={<ProductPagePrimaryAction label="Business profile" onClick={() => navigate(mapPortalHref('/business/profile'))} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/business/vendors'))}>
          Vendor center
        </button>
      }
    >
      {commandDeckBody}
      <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="emerald">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">{foundation.complete ? 'Open tier vendors' : 'Close foundation gaps'}</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          {foundation.complete
            ? 'Foundation is aligned — open tier-appropriate vendors and track bureau scores.'
            : 'Complete entity name, EIN, and address on your profile before vendor tiers unlock.'}
        </p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
