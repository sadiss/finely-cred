import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Inbox,
  ListOrdered,
  PlayCircle,
  Workflow,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { listAuBuyerOrdersByPartner } from '../../../../data/auBuyerOrdersRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { AuBuyerOrder } from '../../../../domain/auBuyerOrders';
import { computeRoleWorkflowProgress } from '../../../../lib/roleWorkflowProgress';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { accentAt } from '../workspaceAccentArrangement';
import type { WorkspaceProductStatus } from '../workspaceProductTokens';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import type { ProductCollectionItem } from '../components/ProductCollectionSurface';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, ProductStatusPill, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

const METRICS_VARIANT = 'grid' as const;

const NON_TERMINAL_STATUSES = new Set(['draft', 'submitted', 'awaiting_docs', 'in_review', 'scheduled']);

type OrdersView = 'ledger' | 'workflow';

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

function formatShortDate(iso?: string): string {
  if (!iso) return 'unscheduled';
  const parsed = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'unscheduled';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatUsdCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
}

function prettyStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

function isNonTerminal(order: AuBuyerOrder): boolean {
  return NON_TERMINAL_STATUSES.has(order.status);
}

function isPostingOverdue(order: AuBuyerOrder): boolean {
  const desired = order.buyer?.desiredPostByDate;
  if (!desired || !isNonTerminal(order)) return false;
  return desired.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function mapOrderStatus(order: AuBuyerOrder): WorkspaceProductStatus {
  if (order.status === 'completed') return 'complete';
  if (order.status === 'cancelled') return 'blocked';
  if (isPostingOverdue(order)) return 'needs_action';
  if (isNonTerminal(order)) return order.status === 'draft' ? 'waiting' : 'needs_action';
  return 'in_progress';
}

function latestEventTitle(order: AuBuyerOrder): string | null {
  if (!order.events.length) return null;
  return [...order.events].sort((a, b) => b.at.localeCompare(a.at))[0]?.title ?? null;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; orders: AuBuyerOrder[] };

function OrdersLedgerBook({
  orders,
  summary,
  onOpenOrder,
}: {
  orders: AuBuyerOrder[];
  summary: { active: number; awaiting: number; overdue: number; completed: number };
  onOpenOrder: (orderId: string) => void;
}) {
  return (
    <div className="fc-wlp-orders-ledger" aria-label="AU order ledger">
      <div className="fc-wlp-au-orders-summary">
        <div><strong>{summary.active}</strong><em>Active</em></div>
        <div><strong>{summary.awaiting}</strong><em>Awaiting post</em></div>
        <div><strong>{summary.overdue}</strong><em>Posting overdue</em></div>
        <div><strong>{summary.completed}</strong><em>Completed</em></div>
      </div>
      <div className="fc-wlp-orders-ledger-head">
        <span>Placement</span>
        <span>Status</span>
        <span>Post by</span>
        <span>Intake</span>
        <span>Latest event</span>
      </div>
      {orders.map((order) => {
        const overdue = isPostingOverdue(order);
        const status = mapOrderStatus(order);
        const desired = order.buyer?.desiredPostByDate;
        const docs = order.evidence.length;
        const elig = order.eligibility.checked;
        const terms = Boolean(order.terms.acceptedAt);
        const intakeLabel = elig && terms && docs > 0 ? 'Ready' : [elig ? 'Eligibility ✓' : 'Eligibility', terms ? 'Terms ✓' : 'Terms', docs ? `${docs} docs` : 'Docs'].join(' · ');
        return (
          <button
            key={order.id}
            type="button"
            className="fc-wlp-orders-ledger-row"
            data-overdue={overdue ? 'true' : undefined}
            onClick={() => onOpenOrder(order.id)}
          >
            <div>
              <strong>{order.listing.bank || 'AU placement'}</strong>
              <span>{order.listing.limit} limit · {formatUsdCents(order.listing.priceCents)} · {order.listing.age}</span>
            </div>
            <div>
              <ProductStatusPill status={status} label={overdue ? 'Posting overdue' : undefined} />
            </div>
            <div>{desired ? formatShortDate(desired) : '—'}</div>
            <div>{intakeLabel}</div>
            <div>
              <span>{latestEventTitle(order) ?? prettyStatus(order.status)}</span>
              {order.events[0]?.note ? <span>{order.events[0].note}</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DemoOrdersLedger({ items, onOpen }: { items: ProductCollectionItem[]; onOpen: () => void }) {
  return (
    <div className="fc-wlp-orders-ledger" aria-label="AU order ledger demo">
      <div className="fc-wlp-au-orders-summary">
        <div><strong>2</strong><em>Active</em></div>
        <div><strong>1</strong><em>Awaiting post</em></div>
        <div><strong>0</strong><em>Posting overdue</em></div>
        <div><strong>1</strong><em>Completed</em></div>
      </div>
      <div className="fc-wlp-orders-ledger-head">
        <span>Placement</span>
        <span>Status</span>
        <span>Post by</span>
        <span>Intake</span>
        <span>Latest event</span>
      </div>
      {items.map((item) => (
        <button key={item.id} type="button" className="fc-wlp-orders-ledger-row" onClick={onOpen}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
          <div><ProductStatusPill status={item.status} label={item.statusLabel} /></div>
          <div>{item.meta}</div>
          <div>{item.tags?.[0] ?? 'Intake'}</div>
          <div><span>{item.meta}</span></div>
        </button>
      ))}
    </div>
  );
}

export default function PartnerAuOrdersProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Inbox;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/au/orders');
  const marketplacePath = mapPortalHref('/au/marketplace');
  const requestPath = mapPortalHref('/au/request');
  const scaffoldAccent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [view, setView] = useState<OrdersView>('ledger');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => {
      setVersion((v) => v + 1);
      setRetryToken((t) => t + 1);
    };
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const orders = listAuBuyerOrdersByPartner(partnerId!);
      if (!cancelled) setState({ status: 'ready', orders });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your AU orders right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken, version]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const demoCollectionItems = useMemo<ProductCollectionItem[]>(
    () =>
      demoSpec?.items.map((item, index) => ({
        ...item,
        accent: accentAt(index, { parent: scaffoldAccent }),
        icon: PageIcon,
        onOpen: () => navigate(item.target ?? livePath),
      })) ?? [],
    [PageIcon, demoSpec, livePath, navigate, scaffoldAccent],
  );

  const askFinelyPrompt = 'Which of my AU orders needs attention before its posting date?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'AU orders' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const openOrder = (orderId: string) => navigate(mapPortalHref(`/au/request?orderId=${encodeURIComponent(orderId)}`));

  const liveOrders = state.status === 'ready' ? state.orders : [];
  const isEmpty = !isDemo && state.status === 'ready' && liveOrders.length === 0;

  const activeOrders = liveOrders.filter((o) => o.status !== 'cancelled');
  const awaitingPost = liveOrders.filter((o) => isNonTerminal(o));
  const overdueOrders = liveOrders.filter((o) => isPostingOverdue(o));
  const completedOrders = liveOrders.filter((o) => o.status === 'completed');

  const auWorkflowProgress = useMemo(
    () => computeRoleWorkflowProgress('au_buyer', { partner: partnerId ? getPartnerSync(partnerId) : null, auOrdersCount: liveOrders.length }),
    [partnerId, liveOrders.length, isDemo],
  );

  const latestActivity = liveOrders.reduce<string | undefined>((latest, o) => {
    if (!latest || o.updatedAt > latest) return o.updatedAt;
    return latest;
  }, undefined);

  const summary = {
    active: activeOrders.length,
    awaiting: awaitingPost.length,
    overdue: overdueOrders.length,
    completed: completedOrders.length,
  };

  const metrics: ProductMetric[] = isDemo
    ? (demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) })) ?? [])
    : [
        { label: 'Active orders', value: summary.active, hint: `${summary.completed} completed`, accent: 'emerald', icon: Inbox, onClick: () => setView('ledger') },
        { label: 'Awaiting post', value: summary.awaiting, hint: 'Intake or review', accent: 'violet', icon: Clock3, onClick: () => setView('ledger') },
        { label: 'Posting overdue', value: summary.overdue, hint: 'Past post-by date', accent: 'rose', icon: AlertTriangle, onClick: () => setView('ledger') },
        { label: 'Completed', value: summary.completed, hint: 'Reporting on file', accent: 'sky', icon: CheckCircle2, onClick: () => setView('ledger') },
      ];

  const statusHeadline = isDemo
    ? (demoSpec?.status ?? '2 orders active')
    : isEmpty
      ? 'No AU orders yet'
      : overdueOrders.length
        ? `${overdueOrders.length} order${overdueOrders.length === 1 ? '' : 's'} posting overdue`
        : awaitingPost.length
          ? `${awaitingPost.length} order${awaitingPost.length === 1 ? '' : 's'} awaiting post`
          : `${activeOrders.length} active order${activeOrders.length === 1 ? '' : 's'}`;

  const guideTitle = isEmpty ? 'Browse the marketplace to start' : overdueOrders.length ? 'Contact support on the overdue order' : 'Confirm details before the cutoff';
  const guideDescription = isEmpty
    ? 'Once you place an order from the AU marketplace, intake, documents, and posting status track here.'
    : overdueOrders.length
      ? `${overdueOrders[0]?.listing.bank ?? 'An order'} passed its post-by date — message support with the order details.`
      : `${awaitingPost.length} order${awaitingPost.length === 1 ? ' is' : 's are'} still in intake or review — confirm before the cutoff.`;

  const ledgerContent = isEmpty ? (
    <ProductEmptyState
      title="No AU orders yet"
      description="Browse the marketplace to place your first authorized user order — intake, documents, and posting status track here."
      action={
        <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(marketplacePath)}>
          Open marketplace <ArrowRight size={15} />
        </button>
      }
    />
  ) : isDemo ? (
    <DemoOrdersLedger items={demoCollectionItems} onOpen={() => navigate(livePath)} />
  ) : (
    <OrdersLedgerBook orders={liveOrders} summary={summary} onOpenOrder={openOrder} />
  );

  const bookBody = (
    <div className="fc-wlp-au-orders-book" data-surface-layout="orders-ledger">
      <div className="fc-wlp-au-orders-spine" data-fcm-accent="emerald">
        <button
          type="button"
          className="fc-wlp-au-orders-spine-item"
          data-active={view === 'ledger' ? 'true' : undefined}
          onClick={() => setView('ledger')}
        >
          <ListOrdered size={16} /> Ledger
        </button>
        <button
          type="button"
          className="fc-wlp-au-orders-spine-item"
          data-active={view === 'workflow' ? 'true' : undefined}
          onClick={() => setView('workflow')}
        >
          <Workflow size={16} /> Workflow
        </button>
        <button type="button" className="fc-wlp-au-orders-spine-item" onClick={() => navigate(marketplacePath)}>
          <Inbox size={16} /> Marketplace
        </button>
        <button type="button" className="fc-wlp-au-orders-spine-item" onClick={() => navigate(requestPath)}>
          <ArrowRight size={16} /> Start intake
        </button>
      </div>
      <div className="min-w-0">
        {view === 'workflow' ? (
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h3 className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Buyer workflow</h3>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Browse → intake → documents → posting confirmation.</p>
            <RoleWorkflowPanel roleId="au_buyer" completedSteps={auWorkflowProgress} />
          </div>
        ) : (
          ledgerContent
        )}
      </div>
    </div>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'AU orders'}
        title={demoSpec?.title ?? 'Track every placement from purchase to posting to removal.'}
        description={demoSpec?.description ?? 'Each order shows where it is in the reporting cycle, so nothing is a surprise.'}
        status={`${statusHeadline} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'View orders'} onClick={() => navigate(livePath)} />}
        metrics={metrics}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        <section className="fc-wlp-section">{bookBody}</section>
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon"><PageIcon size={22} strokeWidth={2.05} /></div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{guideTitle}</h2>
          <p>{guideDescription}</p>
          {guideActions}
        </aside>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading your AU orders" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="AU orders"
        title="Track every placement from purchase to posting to removal."
        description="Each order shows where it is in the reporting cycle, so nothing is a surprise."
        status="Could not load your AU orders"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant={METRICS_VARIANT}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((value) => value + 1)} />}
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title="We couldn't load your AU orders"
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
      eyebrow="AU orders"
      title="Track every placement from purchase to posting to removal."
      description="Each order shows where it is in the reporting cycle, so nothing is a surprise."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestActivity)}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label="View orders" onClick={() => navigate(livePath)} />}
      metrics={metrics}
      metricTitle="Order status"
      metricDescription="Posting and removal timing drive everything else on this page."
    >
      <section className="fc-wlp-section">
        {bookBody}
        <aside className="fc-wlp-page-guide mt-6">
          <div className="fc-wlp-page-guide-icon"><PageIcon size={22} strokeWidth={2.05} /></div>
          <div className="fc-wlp-eyebrow">What to do next</div>
          <h2>{guideTitle}</h2>
          <p>{guideDescription}</p>
          {guideActions}
        </aside>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
