import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CircleHelp,
  Clock3,
  CreditCard,
  PlayCircle,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { listAuBuyerOrdersByPartner } from '../../../../data/auBuyerOrdersRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { tradelinePromoPackages, formatPrice } from '../../../../config/pricingCatalog';
import { completeTradelinePurchase } from '../../../../lib/commerceHub';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import type { AuBuyerOrder } from '../../../../domain/auBuyerOrders';
import { PricingPackageCatalog } from '../../../../components/pricing/PricingPackageCatalog';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductCardObject, productCardTierAt } from '../components/ProductCardObject';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

const SERVICE_LINE_ID = 'tradelines' as const;
const POSTING_SOON_STATUSES = new Set(['draft', 'submitted', 'awaiting_docs', 'in_review', 'scheduled']);

type MosaicZone = 'orders' | 'catalog';

function formatFreshness(iso?: string): string {
  if (!iso) return 'no orders yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function prettyStatus(status: string): string {
  return String(status || '').replaceAll('_', ' ');
}

function partnerOwnsTradelinesLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; orders: AuBuyerOrder[] };

export default function PartnerTradelinesProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? CreditCard;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/tradelines');
  const scaffoldAccent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [zone, setZone] = useState<MosaicZone>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [lane, setLane] = useState<'all' | 'au' | 'primary'>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!partnerOwnsTradelinesLine(partnerId!)) {
        if (!cancelled) setState({ status: 'locked' });
        return;
      }
      const orders = listAuBuyerOrdersByPartner(partnerId!);
      if (!cancelled) setState({ status: 'ready', orders });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your tradeline placements right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);
  const packages = useMemo(() => tradelinePromoPackages.filter((p) => p.isPublic), []);
  const filteredPackages = useMemo(() => {
    if (lane === 'all') return packages;
    if (lane === 'au') {
      return packages.filter(
        (p) =>
          /authorized|au/i.test(p.name + p.tagline + p.description) ||
          (p.highlights ?? []).some((h) => /authorized|au/i.test(h)),
      );
    }
    return packages.filter(
      (p) =>
        /primary|installment/i.test(p.name + p.tagline + p.description) ||
        (p.highlights ?? []).some((h) => /primary|installment/i.test(h)),
    );
  }, [lane, packages]);

  const handleDemoPurchase = (packageId: string) => {
    if (!partner) return;
    setBusyId(packageId);
    setNotice(null);
    try {
      const result = completeTradelinePurchase({
        partnerId: partner.id,
        packageId,
        tenantId: partner.tenantId ?? FINELY_TENANT_ID,
        rail: 'in_house',
      });
      setNotice(result.ok ? result.message : result.message);
      setRetryToken((v) => v + 1);
    } catch (e: unknown) {
      setNotice((e as Error)?.message || 'Purchase failed.');
    } finally {
      setBusyId(null);
    }
  };

  const askFinelyPrompt = 'How do authorized user placements support my credit plan?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Tradelines' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderInspector = (order: AuBuyerOrder | null, selectedPkg: (typeof packages)[number] | null) => {
    if (zone === 'catalog' && selectedPkg) {
      const priceLine = selectedPkg.priceAmount <= 0 ? 'Free' : `${formatPrice(selectedPkg.priceAmount)}${selectedPkg.interval === 'month' ? ' / mo' : ''}`;
      return (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-5 lg:sticky lg:top-4`} data-fc-accent="violet">
          <Sparkles size={22} className="text-violet-500" />
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedPkg.name}</h2>
          <div className="text-lg font-extrabold text-violet-700">{priceLine}</div>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selectedPkg.description}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(mapPortalHref(`/portal/checkout?package=${encodeURIComponent(selectedPkg.id)}&category=tradeline_promo&rail=in_house`))}
              className={FINELY_OS_SUCCESS_BTN}
            >
              Checkout <ArrowRight size={14} />
            </button>
            <button type="button" disabled={busyId === selectedPkg.id || !partner} onClick={() => handleDemoPurchase(selectedPkg.id)} className={FINELY_OS_SECONDARY_BTN}>
              <CreditCard size={14} /> Demo activate
            </button>
          </div>
        </div>
      );
    }

    if (!order) {
      return (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 min-h-[320px] flex flex-col justify-center`} data-fc-accent="violet">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Inspector</p>
          <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
            {zone === 'catalog' ? 'Select a package tile' : 'Select a placement'}
          </h2>
          <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            {zone === 'catalog'
              ? 'Pick a catalog tile to compare price, lane, and checkout options.'
              : 'Pick a tile from the mosaic to review bank, age, limit, and posting status.'}
          </p>
          <button type="button" onClick={() => navigate(mapPortalHref('/au/marketplace'))} className={`mt-4 ${FINELY_OS_PRIMARY_BTN}`}>
            Browse marketplace
          </button>
        </div>
      );
    }

    const needsAction = POSTING_SOON_STATUSES.has(order.status) && order.status !== 'completed';
    return (
      <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5 lg:sticky lg:top-4`} data-fc-accent="emerald">
        <ProductCardObject
          tier={productCardTierAt(0)}
          label={order.listing.bank}
          sublabel={`${order.listing.age} · ${order.listing.limit}`}
          issuer="Authorized user"
          status={prettyStatus(order.status)}
          size="md"
          showChip
        />
        <div className="grid grid-cols-2 gap-3">
          <div className={`${finelyOsCatalogCard('sky')} p-4`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Status</div>
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{prettyStatus(order.status)}</div>
          </div>
          <div className={`${finelyOsCatalogCard('rose')} p-4`} data-fc-accent="rose">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Posting</div>
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{needsAction ? 'Action needed' : 'On track'}</div>
          </div>
        </div>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          {needsAction
            ? 'Complete intake or document steps before the reporting cutoff.'
            : 'Track monthly while this line reports — note removal timing in your build plan.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(mapPortalHref('/au/orders'))} className={FINELY_OS_SUCCESS_BTN}>
            Open AU orders <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/projects'))} className={FINELY_OS_SECONDARY_BTN}>
            Work tasks
          </button>
        </div>
      </div>
    );
  };

  const renderOrdersMosaic = (orders: AuBuyerOrder[]) => {
    if (orders.length === 0) {
      return (
        <ProductEmptyState
          title="No tradeline orders yet"
          description="Browse authorized user placements — intake, documents, and posting dates are tracked in AU orders."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/au/marketplace'))}>
              Open marketplace
            </button>
          }
        />
      );
    }

    const selected = orders.find((o) => o.id === selectedOrderId) ?? orders[0] ?? null;

    return (
      <div className="fc-wlp-tradeline-mosaic">
        <FinelyOsPaginatedStack
          items={orders}
          pageSize={9}
          itemSpacingClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          emptyMessage="No orders yet."
          renderItem={(order, idx) => {
            const active = (selectedOrderId ?? orders[0]?.id) === order.id;
            const needsAction = POSTING_SOON_STATUSES.has(order.status) && order.status !== 'completed';
            const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className={`${finelyOsCatalogCard(cardAccent)} text-left p-6 lg:p-8 min-h-[200px] space-y-3 transition-all ${active ? 'ring-2 ring-white/25 scale-[1.01]' : 'opacity-90 hover:opacity-100'}`}
                data-fc-accent={cardAccent}
                data-active={active ? 'true' : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{order.listing.bank}</div>
                  <span className={needsAction ? finelyOsStatusChip('warn') : finelyOsStatusChip('ok')}>
                    {needsAction ? 'Action' : prettyStatus(order.status)}
                  </span>
                </div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>
                  {order.listing.age} · {order.listing.limit}
                </div>
                <ProductCardObject tier={productCardTierAt(idx)} label={order.listing.bank} sublabel={order.listing.age} issuer="AU" size="sm" showChip />
              </button>
            );
          }}
        />
        {renderInspector(selected, null)}
      </div>
    );
  };

  const renderCatalogMosaic = () => {
    const selectedPkg = filteredPackages.find((p) => p.id === selectedPackageId) ?? filteredPackages[0] ?? null;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {(['all', 'au', 'primary'] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLane(l)} className={lane === l ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}>
              {l === 'all' ? 'All packages' : l === 'au' ? 'Authorized user' : 'Primary'}
            </button>
          ))}
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/checkout?category=tradeline_promo'))} className={FINELY_OS_SECONDARY_BTN}>
            Full checkout
          </button>
        </div>

        <div className="fc-wlp-tradeline-mosaic">
          <div className="min-w-0 space-y-4">
            <PricingPackageCatalog
              packages={filteredPackages}
              pageSize={6}
              searchPlaceholder="Search tradeline packages…"
              selectLabel="Inspect"
              onSelect={(pkgId) => setSelectedPackageId(pkgId)}
            />
            {filteredPackages.slice(0, 3).map((pkg) => (
              <button key={pkg.id} type="button" disabled={busyId === pkg.id || !partner} onClick={() => handleDemoPurchase(pkg.id)} className={FINELY_OS_SECONDARY_BTN}>
                <CreditCard size={14} /> Demo: {pkg.name.split('—')[0]?.trim() || pkg.name}
              </button>
            ))}
          </div>
          {renderInspector(null, selectedPkg)}
        </div>
      </div>
    );
  };

  const mosaicBody = (orders: AuBuyerOrder[]) => (
    <section className="fc-wlp-section space-y-6" data-surface-layout="catalog-mosaic">
      {notice ? <div className={notice.includes('activated') ? FINELY_OS_NOTICE_SUCCESS : FINELY_OS_NOTICE_WARN}>{notice}</div> : null}

      <div className="fc-wlp-tradeline-bento" role="tablist" aria-label="Tradeline mosaic zones">
        <button
          type="button"
          role="tab"
          aria-selected={zone === 'orders'}
          className={`fc-wlp-tradeline-bento-tile ${finelyOsCatalogCard('emerald')}`}
          data-fc-accent="emerald"
          data-active={zone === 'orders' ? 'true' : undefined}
          onClick={() => setZone('orders')}
        >
          <Store size={22} className="text-emerald-600" />
          <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{orders.length}</div>
          <div className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>My placements</div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Active AU orders and posting status</div>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={zone === 'catalog'}
          className={`fc-wlp-tradeline-bento-tile ${finelyOsCatalogCard('violet')}`}
          data-fc-accent="violet"
          data-active={zone === 'catalog' ? 'true' : undefined}
          onClick={() => setZone('catalog')}
        >
          <Sparkles size={22} className="text-violet-600" />
          <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{filteredPackages.length}</div>
          <div className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>Package catalog</div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>AU + primary installment lanes</div>
        </button>
      </div>

      {zone === 'orders' ? renderOrdersMosaic(orders) : renderCatalogMosaic()}

      <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="sky">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-sky-600" />
          <span className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>After purchase, open Work tasks for intake and posting watch.</span>
        </div>
        <button type="button" onClick={() => navigate(mapPortalHref('/portal/projects'))} className={FINELY_OS_SUCCESS_BTN}>
          Open projects
        </button>
      </div>
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Tradelines'}
        title={demoSpec?.title ?? 'Add seasoned history through compliant placements.'}
        description={demoSpec?.description ?? 'Bento zone picker with catalog mosaic and inspector.'}
        status={`${demoSpec?.status ?? '1 active placement'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="inline"
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Browse tradelines'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {mosaicBody([])}
        <aside className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="violet">
          <div className="fc-wlp-eyebrow">What to do next</div>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Placements support restore and build — they are not a shortcut.</p>
          {guideActions}
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading your tradeline placements" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Tradelines"
        title="Add seasoned history through compliant placements."
        description="Bento zone picker with catalog mosaic and inspector."
        status="Could not load your tradelines"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your tradelines"
          description={state.message}
          action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>Try again</button>}
        />
      </ProductHubScaffold>
    );
  }

  if (state.status === 'locked') {
    const inviteMetrics: ProductMetric[] = [
      { label: 'Active placements', value: '—', hint: 'Reporting lines', accent: 'emerald', icon: CreditCard, onClick: () => navigate(serviceLine.upsellPath) },
      { label: 'Posting soon', value: '—', hint: 'Scheduled orders', accent: 'violet', icon: Clock3, onClick: () => navigate(serviceLine.upsellPath) },
      { label: 'Seasoned history', value: '—', hint: 'Age on file', accent: 'sky', icon: TrendingUp, onClick: () => navigate(serviceLine.upsellPath) },
      { label: 'Order history', value: '—', hint: 'Past placements', accent: 'rose', icon: BarChart3, onClick: () => navigate(serviceLine.upsellPath) },
    ];

    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Tradelines"
        title="Add seasoned history through compliant placements."
        description="Bento zone picker with catalog mosaic and inspector."
        status="Not started yet · live data"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="inline"
        primaryAction={<ProductPagePrimaryAction label="Browse tradelines" onClick={() => navigate(serviceLine.upsellPath)} />}
        metrics={inviteMetrics}
        metricTitle="What tradelines unlock"
        metricDescription="AU placements, posting tracking, and order history."
      >
        <ProductEmptyState
          title="Not started yet"
          description={serviceLine.upsellHeadline}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>
              See tradeline options
            </button>
          }
        />
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  const { orders } = state;
  const activePlacements = orders.filter((o) => o.status === 'completed').length;
  const postingSoon = orders.filter((o) => POSTING_SOON_STATUSES.has(o.status) && o.status !== 'completed').length;
  const latestOrder = orders[0] ?? null;

  const ageValues = orders
    .map((order) => {
      const match = String(order.listing.age || '').match(/(\d+)/);
      return match ? Number(match[1]) : null;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const avgAgeAdded = ageValues.length ? `${Math.round(ageValues.reduce((sum, v) => sum + v, 0) / ageValues.length)} yr` : '—';

  const metrics: ProductMetric[] = [
    { label: 'Active placements', value: activePlacements, hint: activePlacements ? 'Reporting' : 'None yet', accent: 'emerald', icon: CreditCard, onClick: () => setZone('orders') },
    { label: 'Posting soon', value: postingSoon, hint: postingSoon ? 'Confirm before cutoff' : 'Queue clear', accent: 'violet', icon: Clock3, onClick: () => navigate(mapPortalHref('/au/orders')) },
    { label: 'Order history', value: orders.length, hint: 'Tracked in AU orders', accent: 'sky', icon: Store, onClick: () => navigate(mapPortalHref('/au/orders')) },
    { label: 'Avg age added', value: avgAgeAdded, hint: 'From listing age', accent: 'rose', icon: TrendingUp, onClick: () => setZone('catalog') },
  ];

  const statusHeadline =
    orders.length === 0 ? 'No tradeline orders yet' : postingSoon ? `${postingSoon} posting soon` : activePlacements ? `${activePlacements} active` : `${orders.length} on file`;

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Tradelines"
      title="Add seasoned history through compliant placements."
      description="Bento zone tiles, catalog mosaic, and sticky inspector — no generic tab strip."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestOrder?.updatedAt)}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="inline"
      primaryAction={<ProductPagePrimaryAction label="Browse tradelines" onClick={() => navigate(livePath)} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/au/marketplace'))}>
          AU marketplace
        </button>
      }
      metrics={metrics}
      metricTitle="Placement status"
      metricDescription="Posting dates matter while lines report."
    >
      {mosaicBody(orders)}
      <aside className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="violet">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">
          {postingSoon ? 'Confirm before posting cutoff' : orders.length ? 'Track reporting dates' : 'Browse the marketplace'}
        </h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Placements strengthen a profile already being repaired and built.</p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
