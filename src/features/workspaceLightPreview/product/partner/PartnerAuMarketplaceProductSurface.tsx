import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CircleHelp,
  Clock3,
  PlayCircle,
  Sparkles,
  Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { listApprovedMarketplaceListingsAsync, type ApprovedMarketplaceListing } from '../../../../data/auSellerRepo';
import { listAuBuyerOrdersByPartner } from '../../../../data/auBuyerOrdersRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { computeRoleWorkflowProgress } from '../../../../lib/roleWorkflowProgress';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'grid' as const;

type MosaicFilter = 'all' | 'strong' | 'available';

const BUREAU_LABEL: Record<string, string> = {
  experian: 'Experian',
  equifax: 'Equifax',
  transunion: 'TransUnion',
  all: 'All 3 bureaus',
};

function formatUsdCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
}

function formatShortDate(iso?: string): string {
  if (!iso) return 'unscheduled';
  const parsed = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'unscheduled';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function parseAgeYears(age: string | undefined): number | null {
  if (!age) return null;
  const match = age.match(/([\d.]+)/);
  return match ? Number.parseFloat(match[1]!) : null;
}

function bureauLabel(bureau?: string): string {
  if (!bureau) return 'Not specified';
  return BUREAU_LABEL[bureau] ?? bureau;
}

function matchScore(listing: ApprovedMarketplaceListing): number {
  const ageYears = parseAgeYears(listing.age) ?? 0;
  const utilization = listing.utilizationPct ?? 25;
  const soldOut = listing.slotsAvailable === 0;
  return Math.round(ageYears * 6 - utilization * 0.6 - (soldOut ? 200 : 0));
}

function isStrongMatch(listing: ApprovedMarketplaceListing): boolean {
  const ageYears = parseAgeYears(listing.age);
  return ageYears !== null && ageYears >= 7 && listing.slotsAvailable !== 0 && (listing.utilizationPct ?? 0) <= 20;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; listings: ApprovedMarketplaceListing[] };

export default function PartnerAuMarketplaceProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Store;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/au/marketplace');
  const requestPath = mapPortalHref('/au/request');
  const ordersPath = mapPortalHref('/au/orders');
  const scaffoldAccent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [filter, setFilter] = useState<MosaicFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const partner = getPartnerSync(partnerId!);
        const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
        const listings = await listApprovedMarketplaceListingsAsync(tenantId);
        if (!cancelled) setState({ status: 'ready', listings });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not load the marketplace right now.';
        if (!cancelled) setState({ status: 'error', message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken, version]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const liveListings = state.status === 'ready' ? state.listings : [];
  const ordersCount = !isDemo && partnerId ? listAuBuyerOrdersByPartner(partnerId).length : 0;
  const auWorkflowProgress = useMemo(
    () => computeRoleWorkflowProgress('au_buyer', { partner: partnerId ? getPartnerSync(partnerId) : null, auOrdersCount: ordersCount }),
    [partnerId, ordersCount, isDemo],
  );

  const rankedListings = useMemo(
    () => [...liveListings].sort((left, right) => matchScore(right) - matchScore(left)),
    [liveListings],
  );

  const filteredListings = useMemo(() => {
    if (filter === 'strong') return rankedListings.filter(isStrongMatch);
    if (filter === 'available') return rankedListings.filter((l) => l.slotsAvailable !== 0);
    return rankedListings;
  }, [filter, rankedListings]);

  const strongMatches = liveListings.filter(isStrongMatch);
  const availableCount = liveListings.filter((l) => l.slotsAvailable !== 0).length;

  const ageValues = liveListings.map((l) => parseAgeYears(l.age)).filter((v): v is number => v !== null);
  const avgAge = ageValues.length ? Math.round(ageValues.reduce((sum, v) => sum + v, 0) / ageValues.length) : null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingCutoffs = liveListings
    .map((l) => l.statementDate)
    .filter((d): d is string => typeof d === 'string' && d >= today)
    .sort();
  const nextCutoff = upcomingCutoffs[0];

  const selectedListing =
    filteredListings.find((l) => l.id === selectedId) ?? filteredListings[0] ?? null;

  const askFinelyPrompt = 'Which AU placement fits my profile gaps best right now?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'AU marketplace' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const startIntake = (listing: ApprovedMarketplaceListing) => {
    const p = new URLSearchParams();
    p.set('listingId', listing.id);
    if (listing.bank) p.set('bank', listing.bank);
    navigate(mapPortalHref(`/au/request?${p.toString()}`));
  };

  const renderInspector = (listing: ApprovedMarketplaceListing | null) => {
    if (!listing) {
      return (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 min-h-[320px] flex flex-col justify-center`} data-fc-accent="violet">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Placement inspector</p>
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Select a listing tile</h2>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Compare age, utilization, bureau coverage, and cutoff before price.</p>
        </div>
      );
    }

    const strong = isStrongMatch(listing);
    const soldOut = listing.slotsAvailable === 0;
    return (
      <div className={`${finelyOsCatalogCard(strong ? 'emerald' : 'sky')} p-6 lg:p-8 space-y-5 lg:sticky lg:top-4`} data-fc-accent={strong ? 'emerald' : 'sky'}>
        <Store size={22} className={strong ? 'text-emerald-600' : 'text-sky-600'} />
        <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{listing.bank || 'AU placement'}</h2>
        <div className="text-lg font-extrabold text-sky-700">{formatUsdCents(listing.priceCents)}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`${finelyOsCatalogCard('violet')} p-4`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Limit</div>
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{listing.limit}</div>
          </div>
          <div className={`${finelyOsCatalogCard('rose')} p-4`} data-fc-accent="rose">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Age</div>
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{listing.age ?? '—'}</div>
          </div>
        </div>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          Reports to {bureauLabel(listing.bureau)} · cutoff {formatShortDate(listing.statementDate)} · {listing.slotsAvailable ?? 0} slots
          {listing.utilizationPct != null ? ` · ${listing.utilizationPct}% utilization` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={soldOut} onClick={() => startIntake(listing)} className={FINELY_OS_SUCCESS_BTN}>
            {soldOut ? 'Sold out' : 'Start intake'} <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate(ordersPath)} className={FINELY_OS_PRIMARY_BTN}>
            My orders
          </button>
        </div>
      </div>
    );
  };

  const mosaicBody = (listings: ApprovedMarketplaceListing[], demo: boolean) => {
    if (!demo && listings.length === 0) {
      return (
        <ProductEmptyState
          title="No listings available right now"
          description="Approved seller listings will appear here as soon as they are live — check back soon or ask your specialist."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(ordersPath)}>
              View order history
            </button>
          }
        />
      );
    }

    return (
      <section data-surface-layout="marketplace-mosaic" className="space-y-5">
        <div className="fc-wlp-au-market-bento" role="tablist" aria-label="Marketplace filters">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'strong'}
            className={`fc-wlp-au-market-bento-tile ${finelyOsCatalogCard('emerald')}`}
            data-fc-accent="emerald"
            data-active={filter === 'strong' ? 'true' : undefined}
            onClick={() => setFilter('strong')}
          >
            <Sparkles size={22} className="text-emerald-600" />
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{strongMatches.length}</div>
            <div className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>Strong matches</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Seasoned · low utilization · open slots</div>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'available'}
            className={`fc-wlp-au-market-bento-tile ${finelyOsCatalogCard('violet')}`}
            data-fc-accent="violet"
            data-active={filter === 'available' ? 'true' : undefined}
            onClick={() => setFilter('available')}
          >
            <Store size={22} className="text-violet-600" />
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{availableCount}</div>
            <div className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>Open slots</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Listings you can order today</div>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`fc-wlp-au-market-bento-tile ${finelyOsCatalogCard('sky')}`}
            data-fc-accent="sky"
            data-active={filter === 'all' ? 'true' : undefined}
            onClick={() => setFilter('all')}
          >
            <Calendar size={22} className="text-sky-600" />
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nextCutoff ? formatShortDate(nextCutoff) : '—'}</div>
            <div className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>Next cutoff</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Soonest posting date on file</div>
          </button>
        </div>

        <div className="fc-wlp-au-market-mosaic">
          <FinelyOsPaginatedStack
            items={filteredListings}
            pageSize={9}
            itemSpacingClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
            emptyMessage="No listings match this filter."
            renderItem={(listing, idx) => {
              const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
              const active = (selectedId ?? filteredListings[0]?.id) === listing.id;
              const strong = isStrongMatch(listing);
              const soldOut = listing.slotsAvailable === 0;
              return (
                <button
                  key={listing.id}
                  type="button"
                  onClick={() => setSelectedId(listing.id)}
                  className={`fc-wlp-au-market-tile ${finelyOsCatalogCard(cardAccent)}`}
                  data-fc-accent={cardAccent}
                  data-active={active ? 'true' : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{listing.bank || 'Placement'}</div>
                    <span className={soldOut ? finelyOsStatusChip('warn') : strong ? finelyOsStatusChip('ok') : finelyOsStatusChip('ok')}>
                      {soldOut ? 'Sold out' : strong ? 'Strong match' : 'Listing'}
                    </span>
                  </div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>
                    {formatUsdCents(listing.priceCents)} · {listing.limit} · {listing.age ?? '—'}
                  </div>
                  <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {bureauLabel(listing.bureau)} · cutoff {formatShortDate(listing.statementDate)}
                  </p>
                </button>
              );
            }}
          />
          {renderInspector(selectedListing)}
        </div>

        <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Buyer workflow</div>
          <RoleWorkflowPanel roleId="au_buyer" compact completedSteps={auWorkflowProgress} />
        </div>
      </section>
    );
  };

  const demoStrong = demoSpec?.metrics.find((m) => m.label === 'Strong matches')?.value ?? 2;
  const demoTotal = demoSpec?.metrics.find((m) => m.label === 'Total listings')?.value ?? 14;

  const metrics: ProductMetric[] = isDemo
    ? (demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) })) ?? [])
    : [
        { label: 'Strong matches', value: strongMatches.length, hint: 'Seasoned history, low utilization', accent: 'emerald', icon: Sparkles, onClick: () => setFilter('strong') },
        { label: 'Total listings', value: liveListings.length, hint: 'Available now', accent: 'sky', icon: Store, onClick: () => setFilter('all') },
        { label: 'Avg age', value: avgAge !== null ? `${avgAge} yr` : '—', hint: 'Across current listings', accent: 'violet', icon: Clock3, onClick: () => navigate(livePath) },
        { label: 'Next cutoff', value: nextCutoff ? formatShortDate(nextCutoff) : '—', hint: 'Posting cutoff', accent: 'rose', icon: Calendar, onClick: () => setFilter('available') },
      ];

  const statusHeadline = isDemo
    ? `${demoStrong} strong matches available`
    : liveListings.length === 0
      ? 'No listings available right now'
      : strongMatches.length
        ? `${strongMatches.length} strong match${strongMatches.length === 1 ? '' : 'es'} available`
        : `${liveListings.length} listing${liveListings.length === 1 ? '' : 's'} available`;

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'AU marketplace'}
        title={demoSpec?.title ?? 'Placements matched to what your profile is missing.'}
        description={demoSpec?.description ?? 'Listings are filtered by age, limit, and utilization so you are not guessing at fit.'}
        status={`${demoSpec?.status ?? '14 listings available'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Open marketplace'} onClick={() => navigate(livePath)} />}
        metrics={metrics}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        <section className="fc-wlp-section">
          {mosaicBody([], true)}
          <aside className="fc-wlp-page-guide mt-6">
            <div className="fc-wlp-page-guide-icon"><PageIcon size={22} strokeWidth={2.05} /></div>
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2>Match the gap, not the price</h2>
            <p>{demoTotal} listings ranked by fit — seasoned history closes more profile gaps than price alone.</p>
            {guideActions}
          </aside>
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading the AU marketplace" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="AU marketplace"
        title="Placements matched to what your profile is missing."
        description="Listings are filtered by age, limit, and utilization so you are not guessing at fit."
        status="Could not load the marketplace"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((value) => value + 1)} />}
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title="We couldn't load the marketplace"
            description={state.message}
            action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((value) => value + 1)}>Try again</button>}
          />
        </section>
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="AU marketplace"
      title="Placements matched to what your profile is missing."
      description="Listings are filtered by age, limit, and utilization so you are not guessing at fit."
      status={`${statusHeadline} · live data`}
      freshness="just now"
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label="Start intake" onClick={() => navigate(requestPath)} />}
      metrics={metrics}
      metricTitle="Matching"
      metricDescription="Fit is based on the gaps in your current profile, not on price alone."
    >
      <section className="fc-wlp-section">
        {mosaicBody(liveListings, false)}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon"><PageIcon size={22} strokeWidth={2.05} /></div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{strongMatches.length ? 'Match the gap, not the price' : 'Compare what is available'}</h2>
          <p>Confirm posting cutoff before it passes — then track the order in AU orders.</p>
          {guideActions}
        </aside>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
