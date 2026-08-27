import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  DollarSign,
  LayoutGrid,
  List,
  PlayCircle,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { AU_SELLER } from '../../../../config/auSellerProgram';
import { computeSellerListingEarningsProjection, listPayoutEntriesByOwner } from '../../../../data/payoutLedgerRepo';
import { summarizePayoutEntries } from '../../../../domain/payoutLedger';
import { formatUsdFromCents } from '../../../../domain/partnerEconomics';
import { RolePromoLinksPanel } from '../../../../components/promotions/RolePromoLinksPanel';
import { getOrCreateSellerForSession } from '../../../../seller/getOrCreateSellerForSession';
import type { AuSeller } from '../../../../domain/auSeller';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import {
  ProductEmptyState,
  type ProductMetric,
} from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { finelyOsCatalogCard, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_PRIMARY_BTN } from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'jewel' as const;

type SellerNavKey = 'hub' | 'dashboard' | 'listings' | 'contracts' | 'payouts';
type RunwayStopId = 'contract' | 'verification' | 'listings' | 'payouts';

export function SellerWorkstationNav({
  active,
  mapHref,
  onNavigate,
}: {
  active: SellerNavKey;
  mapHref: (path: string) => string;
  onNavigate: (path: string) => void;
}) {
  const items: Array<{ key: SellerNavKey; path: string; label: string; icon: typeof Store }> = [
    { key: 'hub', path: AU_SELLER.hubPath, label: 'Seller hub', icon: Sparkles },
    { key: 'dashboard', path: AU_SELLER.dashboardPath, label: 'Dashboard', icon: LayoutGrid },
    { key: 'listings', path: AU_SELLER.listingsPath, label: 'Listings', icon: List },
    { key: 'contracts', path: AU_SELLER.contractsPath, label: 'Contracts', icon: BadgeCheck },
    { key: 'payouts', path: AU_SELLER.payoutsPath, label: 'Payouts', icon: Wallet },
  ];

  return (
    <div className="fc-wlp-workstation-tabs" role="tablist" aria-label="AU seller tools">
      {items.map((item) => {
        const Icon = item.icon;
        const activeTab = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={activeTab}
            className="fc-wlp-workstation-tab fcm-glow-ring"
            data-active={activeTab ? 'true' : undefined}
            data-fcm-accent={
              item.key === 'listings' ? 'sky' : item.key === 'contracts' ? 'emerald' : item.key === 'payouts' ? 'violet' : 'graphite'
            }
            onClick={() => onNavigate(mapHref(item.path))}
          >
            <Icon size={14} /> {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PartnerAuSellerProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const mappedNavigate = useMappedPartnerNavigate();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Store;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;
  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const [version, setVersion] = useState(0);
  const [activeStop, setActiveStop] = useState<RunwayStopId>('contract');
  const seller = useMemo(() => {
    if (isDemo) return null;
    return getOrCreateSellerForSession({ user: auth.user }) as AuSeller | null;
  }, [auth.user, isDemo, version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const projection = useMemo(
    () => (seller ? computeSellerListingEarningsProjection(seller) : null),
    [seller],
  );
  const payoutSummary = useMemo(() => {
    if (!seller) return null;
    return summarizePayoutEntries(listPayoutEntriesByOwner(seller.id, 'seller'));
  }, [seller]);

  const listingsPath = mapPortalHref(AU_SELLER.listingsPath);
  const contractsPath = mapPortalHref(AU_SELLER.contractsPath);
  const payoutsPath = mapPortalHref(AU_SELLER.payoutsPath);
  const hubPath = mapPortalHref(AU_SELLER.hubPath);

  const demoListings = 3;
  const demoVerified = 'In review';
  const demoEarnings = '$875';
  const demoPending = '$420';

  const metrics: ProductMetric[] = [
    {
      label: 'Verification',
      value: isDemo ? demoVerified : seller?.verification.status.replace(/_/g, ' ') ?? '—',
      hint: isDemo ? 'Proof submitted · admin review' : 'Submit listings with proof for review',
      accent: 'violet',
      icon: BadgeCheck,
      onClick: () => mappedNavigate(contractsPath),
    },
    {
      label: 'Listings',
      value: isDemo ? demoListings : seller?.listings.length ?? 0,
      hint: 'Draft → submit → approval → live',
      accent: 'sky',
      icon: List,
      onClick: () => mappedNavigate(listingsPath),
    },
    {
      label: 'Earnings potential',
      value: isDemo
        ? demoEarnings
        : projection
          ? formatUsdFromCents(projection.sellerShareCents)
          : '—',
      hint: `${AU_SELLER.defaultCommissionPct}% share if active slots sell`,
      accent: 'emerald',
      icon: DollarSign,
      onClick: () => mappedNavigate(payoutsPath),
    },
    {
      label: 'Pending payout',
      value: isDemo ? demoPending : payoutSummary ? formatUsdFromCents(payoutSummary.pendingCents) : '—',
      hint: payoutSummary?.nextScheduled ? `Next: ${payoutSummary.nextScheduled}` : 'Configure payout method',
      accent: 'rose',
      icon: Wallet,
      onClick: () => mappedNavigate(payoutsPath),
    },
  ];

  const contractAccepted = isDemo ? true : Boolean(seller?.contract?.acceptedAt);
  const verificationComplete = isDemo ? false : seller?.verification.status === 'verified';
  const listingCount = isDemo ? demoListings : seller?.listings.length ?? 0;
  const hasListings = listingCount > 0;

  const inferredStop: RunwayStopId = !contractAccepted
    ? 'contract'
    : !verificationComplete
      ? 'verification'
      : !hasListings
        ? 'listings'
        : 'payouts';

  const currentStop = activeStop;

  const runwayStops: Array<{
    id: RunwayStopId;
    label: string;
    meta: string;
    complete: boolean;
    current: boolean;
    path: string;
    cta: string;
  }> = [
    {
      id: 'contract',
      label: 'Seller agreement',
      meta: contractAccepted ? 'Accepted on file' : 'Required before listings',
      complete: contractAccepted,
      current: inferredStop === 'contract',
      path: contractsPath,
      cta: 'Review contracts',
    },
    {
      id: 'verification',
      label: 'Verification',
      meta: isDemo ? demoVerified : seller?.verification.status.replace(/_/g, ' ') ?? '—',
      complete: verificationComplete,
      current: inferredStop === 'verification',
      path: listingsPath,
      cta: 'Submit proof',
    },
    {
      id: 'listings',
      label: 'Card inventory',
      meta: `${listingCount} listing${listingCount === 1 ? '' : 's'} on shelf`,
      complete: hasListings,
      current: inferredStop === 'listings',
      path: listingsPath,
      cta: 'Manage listings',
    },
    {
      id: 'payouts',
      label: 'Placement fees',
      meta: isDemo ? demoPending : payoutSummary ? formatUsdFromCents(payoutSummary.pendingCents) + ' pending' : 'Configure method',
      complete: Boolean(payoutSummary && payoutSummary.pendingCents > 0),
      current: inferredStop === 'payouts',
      path: payoutsPath,
      cta: 'Set payouts',
    },
  ];

  const activeRunway = runwayStops.find((s) => s.id === currentStop) ?? runwayStops.find((s) => s.current) ?? runwayStops[0]!;

  const nextAction = contractAccepted
    ? {
        title: 'Manage your card inventory',
        detail: 'Add tradelines, attach proof, and keep slots accurate for partner orders.',
        label: 'Manage listings',
        path: listingsPath,
      }
    : {
        title: 'Accept the seller agreement',
        detail: 'You need an accepted contract before inventory can go live for partners.',
        label: 'Review contracts',
        path: contractsPath,
      };

  const askFinelyPrompt = 'What should I do next as an AU seller?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Seller dashboard' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  if (!isDemo && !auth.user) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="AU seller"
        title="Sign in to open your seller dashboard"
        description="Inventory, verification, contracts, and payouts attach here once you sign in."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState
          title="Sign in required"
          description="Seller supply tools need your account so listings and payouts stay on one profile."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
              Sign in
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  if (!isDemo && !seller) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="AU seller"
        title="Start seller onboarding"
        description="Select the AU seller lane during onboarding so inventory and payouts attach to this workspace."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Open seller hub" onClick={() => mappedNavigate(hubPath)} />}
      >
        <ProductEmptyState
          title="No seller profile yet"
          description="Finish onboarding and pick the AU seller lane, or open the seller hub to activate."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => mappedNavigate(hubPath)}>
              Open seller hub
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  const statusHeadline = isDemo
    ? `${demoListings} listings · demo data`
    : `${seller?.listings.length ?? 0} listing${seller?.listings.length === 1 ? '' : 's'} · ${seller?.verification.status.replace(/_/g, ' ')}`;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={demoSpec?.eyebrow ?? 'AU seller'}
      title={demoSpec?.title ?? 'Your seller fulfillment runway — agreement through payouts.'}
      description={
        demoSpec?.description ??
        'Four stops on a horizontal runway show where you are in supply onboarding and fulfillment.'
      }
      status={statusHeadline}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      metrics={metrics}
      metricTitle="Seller snapshot"
      metricDescription="Verification, live inventory, earnings potential, and pending placement fees."
      primaryAction={
        <ProductPagePrimaryAction label={nextAction.label} onClick={() => mappedNavigate(nextAction.path)} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => mappedNavigate(payoutsPath)}>
          Set payouts
        </button>
      }
    >
      <section className="fc-wlp-section space-y-6" data-surface-layout="journey-runway">
        <SellerWorkstationNav active="dashboard" mapHref={mapPortalHref} onNavigate={mappedNavigate} />

        {!contractAccepted && !isDemo ? (
          <div className="space-y-3">
            <FinelyOsAlertBanner
              tone="warning"
              message="Contract not accepted — accept the seller agreement to submit inventory for review."
              surface="light"
            />
            <button type="button" className="fc-wlp-btn-primary" onClick={() => mappedNavigate(contractsPath)}>
              Review contracts <ArrowRight size={14} />
            </button>
          </div>
        ) : null}

        <div className="fc-wlp-seller-runway-track" role="list" aria-label="Seller fulfillment runway">
          {runwayStops.map((stop, index) => (
            <button
              key={stop.id}
              type="button"
              role="listitem"
              className="fc-wlp-seller-runway-stop"
              data-current={currentStop === stop.id || (stop.current && currentStop === stop.id) ? 'true' : undefined}
              data-complete={stop.complete ? 'true' : undefined}
              data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
              onClick={() => setActiveStop(stop.id)}
            >
              <span className="fc-wlp-seller-runway-marker">
                {stop.complete ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <strong>{stop.label}</strong>
              <p>{stop.meta}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className={`fc-wlp-seller-runway-detail ${finelyOsCatalogCard('emerald')}`} data-fc-accent="emerald">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Current stop</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeRunway.label}</h2>
            <p className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeRunway.meta}</p>
            <p className={`mt-4 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {activeRunway.id === 'contract'
                ? 'Accept the seller agreement before inventory can go live for partners.'
                : activeRunway.id === 'verification'
                  ? 'Submit listings with proof artifacts so admin can verify age, limit, and ownership.'
                  : activeRunway.id === 'listings'
                    ? 'Add tradelines, attach proof, and keep slots accurate for partner orders.'
                    : 'Configure disbursement and track placement fees as orders fulfill.'}
            </p>
            <button type="button" className={`mt-6 ${FINELY_OS_PRIMARY_BTN}`} onClick={() => mappedNavigate(activeRunway.path)}>
              {activeRunway.cta} <ArrowRight size={14} />
            </button>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
              <div className="fc-wlp-eyebrow">Your next step</div>
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nextAction.title}</div>
              <p className={FINELY_OS_ENTITY_BODY}>{nextAction.detail}</p>
              <button type="button" className="fc-wlp-btn-primary w-full justify-center" onClick={() => mappedNavigate(nextAction.path)}>
                {nextAction.label} <ArrowRight size={14} />
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-6 space-y-3`} data-fc-accent="sky">
              <div className="fc-wlp-eyebrow">Need help?</div>
              <p className={FINELY_OS_ENTITY_BODY}>Placement windows, proof requirements, and payout timing — get a plain answer before you list.</p>
              {guideActions}
            </div>
          </aside>
        </div>

        {!contractAccepted && isDemo ? (
          <FinelyOsAlertBanner tone="info" message="Demo mode — contract acceptance is simulated as complete." />
        ) : null}

        <RolePromoLinksPanel role="seller" title="AU seller promo links: guides, ebooks, services" />
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
