import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleHelp,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquare,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getUserDisplayName } from '../../../../auth/userProfile';
import { isAdminEmail } from '../../../../auth/admin';
import { AU_SELLER, AU_SELLER_MARKETING_HEADLINE, AU_SELLER_OFFERINGS } from '../../../../config/auSellerProgram';
import { ROLE_GUIDE_CTAS } from '../../../../config/rolePartnerPrograms';
import { listEntitlementsByPartner } from '../../../../data/billingRepo';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { findAuSellerByEmailAsync } from '../../../../data/auSellerRepo';
import type { AuSeller } from '../../../../domain/auSeller';
import { DenefitsContractCalculator } from '../../../../components/calculators/BenefitsContractCalculator';
import { DenefitsEnrollmentPanel } from '../../../../components/denefits/DenefitsEnrollmentPanel';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../../../lib/roleWorkflowProgress';
import { UnifiedTrainingPanel } from '../../../../components/training/UnifiedTrainingPanel';
import { AuSellerActivationPanel } from '../../../../components/seller/AuSellerActivationPanel';
import { AuSellerCommandStrip } from '../../../../components/seller/AuSellerCommandStrip';
import { AuSellerRoleAutomationPanel } from '../../../../components/seller/AuSellerRoleAutomationPanel';
import { PayoutCenterPanel } from '../../../../components/payouts/PayoutCenterPanel';
import { RoleHubToolDeck, type RoleHubTool } from '../../../../components/hubs/RoleHubToolDeck';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { resolveAuSellerHubAccess } from '../../../../lib/roleHubAccess';
import {
  AU_SELLER_TAB_TO_LAUNCHER,
  buildAuSellerHubLauncherTiles,
  type AuSellerHubLauncherId,
} from '../../../../components/partner/roleHubLauncherPresets';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { SellerWorkstationNav } from './PartnerAuSellerProductSurface';
import {
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
} from '../../../os/finelyOsLightUi';
import './partnerAuSellerHubSurface.css';

const METRICS_VARIANT = 'jewel' as const;

const AU_TOOL_DECK: RoleHubTool[] = [
  { id: 'listings', label: 'Listings', detail: 'Add / update cards', path: AU_SELLER.listingsPath, icon: CreditCard, accent: 'violet', badge: 'Primary' },
  { id: 'market', label: 'Marketplace', detail: 'Partner-facing shelf', path: AU_SELLER.marketplacePath, icon: ShoppingBag, accent: 'sky' },
  { id: 'contracts', label: 'Contracts', detail: 'Accept & fulfill', path: AU_SELLER.contractsPath, icon: Link2, accent: 'emerald' },
  { id: 'payouts', label: 'Payouts', detail: 'Placement fees', path: AU_SELLER.payoutsPath, icon: Wallet, accent: 'rose' },
  { id: 'training', label: 'Training', detail: 'Tradeline track', path: `${AU_SELLER.hubPath}?tab=training`, icon: GraduationCap, accent: 'emerald' },
  { id: 'line', label: 'AU seller line', detail: 'Message Finely', path: AU_SELLER.messagesDeepLink, icon: MessageSquare, accent: 'violet' },
];

type HubPaneId = AuSellerHubLauncherId;

function LedgerBoard({
  active,
  tiles,
  onSelect,
}: {
  active: HubPaneId;
  tiles: ReturnType<typeof buildAuSellerHubLauncherTiles>;
  onSelect: (id: HubPaneId) => void;
}) {
  return (
    <div className="fc-au-ledger-board" role="tablist" aria-label="AU seller fulfillment ledger">
      {tiles.map((tile) => {
        const Icon = tile.icon ?? Sparkles;
        return (
          <div key={tile.id} className="fc-au-ledger-column" data-fc-accent={tile.accent}>
            <div className="fc-au-ledger-column-head">{tile.label}</div>
            <button
              type="button"
              role="tab"
              aria-selected={active === tile.id}
              className="fc-au-ledger-row"
              data-active={active === tile.id ? 'true' : undefined}
              onClick={() => onSelect(tile.id)}
            >
              <span className="inline-flex items-center gap-2 text-base font-extrabold">
                <Icon size={18} /> {tile.stat}
              </span>
              <span className="fc-au-ledger-row-meta">{tile.description}</span>
              {tile.badge ? (
                <span className="mt-1 inline-flex w-fit rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  {tile.badge}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function PartnerAuSellerHubProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapPortalHref = usePartnerProductPathResolver();
  const mappedNavigate = useMappedPartnerNavigate();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Sparkles;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [seller, setSeller] = useState<AuSeller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) {
      setSeller(null);
      setSellerLoading(false);
      return;
    }
    const email = auth.user?.email;
    if (!email) {
      setSeller(null);
      setSellerLoading(false);
      return;
    }
    setSellerLoading(true);
    void findAuSellerByEmailAsync(email).then((s) => {
      setSeller(s);
      setSellerLoading(false);
    });
  }, [auth.user?.email, isDemo]);

  const activePane = useMemo<HubPaneId>(() => {
    const tab = searchParams.get('tab');
    if (tab && tab in AU_SELLER_TAB_TO_LAUNCHER) return AU_SELLER_TAB_TO_LAUNCHER[tab];
    return 'overview';
  }, [searchParams]);

  const setActivePane = (id: HubPaneId) => {
    const tabEntry = Object.entries(AU_SELLER_TAB_TO_LAUNCHER).find(([, launcherId]) => launcherId === id);
    setSearchParams(tabEntry ? { tab: tabEntry[0] } : {});
  };

  const listingsCount = useMemo(
    () => (isDemo ? 2 : seller?.listings?.filter((l) => l.status !== 'draft').length ?? 0),
    [isDemo, seller?.listings],
  );

  const hasActivation = useMemo(() => {
    if (isDemo) return true;
    if (!partner?.id) return false;
    if (isAdminEmail(auth.user?.email)) return true;
    return listEntitlementsByPartner(partner.id).some((e) => e.key === ENTITLEMENT_KEYS.auSeller && e.status === 'active');
  }, [isDemo, partner?.id, auth.user?.email]);

  const auSellerWorkflowProgress = useMemo(
    () =>
      computeRoleWorkflowProgress('au_seller', {
        partner,
        hasSellerProfile: Boolean(seller),
        listingsCount,
        sellerContractAccepted: Boolean(seller?.contract?.acceptedAt),
        sellerVerified: seller?.verification?.status === 'verified',
      }),
    [partner, seller, listingsCount],
  );

  const hubLauncherTiles = useMemo(
    () =>
      buildAuSellerHubLauncherTiles({
        listingsCount,
        verified: seller?.verification?.status === 'verified',
        hasSellerProfile: Boolean(seller) || isDemo,
      }),
    [listingsCount, seller, isDemo],
  );

  const nowDoItems = useMemo(
    () => [
      {
        label: listingsCount === 0 ? 'List your first tradeline' : 'Fulfill open placements',
        detail:
          listingsCount === 0
            ? 'Add card inventory so Finely can market seats to partners.'
            : 'Keep listings accurate and complete AU adds when orders route.',
        to: AU_SELLER.listingsPath,
      },
      {
        label: seller?.verification?.status === 'verified' ? 'Review marketplace' : 'Finish seller verification',
        detail:
          seller?.verification?.status === 'verified'
            ? 'Check how partners see your shelf.'
            : 'KYC unlocks live marketplace listings.',
        to: seller?.verification?.status === 'verified' ? AU_SELLER.marketplacePath : AU_SELLER.contractsPath,
      },
      { label: 'Open AU seller line', detail: 'Ask Finely about payouts or fulfillment blockers.', to: AU_SELLER.messagesDeepLink },
    ],
    [listingsCount, seller?.verification?.status],
  );

  const gate = useMemo(() => resolveAuSellerHubAccess({ user: auth.user, seller }), [auth.user, seller]);
  const auGuide = ROLE_GUIDE_CTAS.au_seller;

  const marketplaceShare =
    typeof window !== 'undefined' ? `${window.location.origin}${AU_SELLER.marketplacePath}` : AU_SELLER.marketplacePath;

  const metrics: ProductMetric[] = [
    { label: 'Listings', value: listingsCount, hint: 'Non-draft inventory', accent: 'emerald', onClick: () => mappedNavigate(mapPortalHref(AU_SELLER.listingsPath)) },
    {
      label: 'Verified',
      value: isDemo ? 'Demo' : seller?.verification?.status === 'verified' ? 'Yes' : 'Pending',
      hint: 'KYC + proof review',
      accent: 'violet',
      onClick: () => setActivePane('overview'),
    },
    {
      label: 'Profile',
      value: isDemo ? 'Demo' : seller ? 'Active' : 'Setup',
      hint: 'Seller file status',
      accent: 'sky',
      onClick: () => setActivePane('operate'),
    },
    {
      label: 'Marketplace',
      value: isDemo ? 'Preview' : listingsCount > 0 ? 'Live' : 'Empty',
      hint: 'Partner-facing shelf',
      accent: 'rose',
      onClick: () => setActivePane('marketplace'),
    },
  ];

  const renderPane = () => {
    if (activePane === 'overview') {
      return (
        <div className="space-y-6">
          <AuSellerActivationPanel variant="hub" activated={hasActivation} />
          <AuSellerCommandStrip seller={seller} loading={sellerLoading && !isDemo} />
          <div className={`${finelyOsCatalogCard('violet')} space-y-4 p-6 lg:p-8`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Your next step</div>
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nowDoItems[0]?.label}</div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{nowDoItems[0]?.detail}</p>
            <button
              type="button"
              onClick={() => mappedNavigate(mapPortalHref(nowDoItems[0]?.to ?? AU_SELLER.listingsPath))}
              className="fc-wlp-btn-primary"
            >
              {listingsCount === 0 ? 'Add a listing' : 'Open listings'}
            </button>
          </div>
        </div>
      );
    }

    if (activePane === 'marketplace') {
      const shelfTiles = isDemo
        ? [
            { bank: 'Chase', limit: '$25k', status: 'Preview', accent: 'violet' as const },
            { bank: 'Amex', limit: '$15k', status: 'Preview', accent: 'emerald' as const },
          ]
        : (seller?.listings ?? [])
            .filter((l) => l.status !== 'draft')
            .slice(0, 4)
            .map((l, idx) => ({
              bank: l.bank,
              limit: l.limit,
              status: l.status,
              accent: (['violet', 'emerald', 'sky', 'rose'] as const)[idx % 4],
            }));

      return (
        <div className="space-y-6">
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Share your shelf with partners and keep inventory accurate for marketplace placement.
          </p>
          <div className="fc-au-marketplace-link-band" data-fc-accent="sky">
            <div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-700`}>Public marketplace link</div>
              <code className="mt-2 block">{marketplaceShare}</code>
            </div>
            <button
              type="button"
              onClick={() => mappedNavigate(mapPortalHref(AU_SELLER.marketplacePath))}
              className="fc-wlp-btn-primary"
            >
              <ShoppingBag size={16} /> Open shelf
            </button>
          </div>
          <div>
            <div className={`mb-3 ${FINELY_OS_ENTITY_SUBLABEL}`}>Shelf preview</div>
            <div className="fc-au-marketplace-shelf">
              {shelfTiles.length === 0 ? (
                <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="rose">
                  No live listings yet — add inventory to appear on the partner marketplace.
                </div>
              ) : (
                shelfTiles.map((tile) => (
                  <div
                    key={`${tile.bank}-${tile.limit}`}
                    className={`${finelyOsCatalogCard(tile.accent)} p-5 lg:p-6 space-y-2`}
                    data-fc-accent={tile.accent}
                  >
                    <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.bank}</div>
                    <div className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{tile.limit}</div>
                    <div className={`text-xs font-extrabold uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      {tile.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="fc-au-hub-action-deck">
            {[
              { label: 'Manage listings', path: AU_SELLER.listingsPath, icon: CreditCard },
              { label: 'Partner marketplace', path: AU_SELLER.marketplacePath, icon: ShoppingBag },
              { label: 'Seller dashboard', path: AU_SELLER.dashboardPath, icon: LayoutDashboard },
            ].map(({ label, path, icon: Icon }) => (
              <button key={path} type="button" onClick={() => mappedNavigate(mapPortalHref(path))} className="fc-wlp-btn-secondary">
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activePane === 'economics') {
      return (
        <div className="space-y-4">
          <div className={`p-5 ${finelyOsCatalogCard('emerald')}`} data-fc-accent="emerald">
            <p className={FINELY_OS_ENTITY_BODY}>
              Many AU sellers also refer partners into Denefit in-house contracts for restoration packages — model that recurring stream alongside AU placement fees.
            </p>
          </div>
          {seller ? (
            <PayoutCenterPanel role="seller" ownerId={seller.id} ownerEmail={seller.email} seller={seller} />
          ) : isDemo ? (
            <ProductEmptyState title="Demo payouts" description="Sign in to connect payout methods and view placement fees." />
          ) : null}
          <DenefitsContractCalculator audience="affiliate" compact />
          <DenefitsEnrollmentPanel audience="affiliate" compact />
        </div>
      );
    }

    if (activePane === 'training') {
      return (
        <div>
          <UnifiedTrainingPanel audience="affiliate" specialties={['tradelines']} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AuSellerRoleAutomationPanel partnerId={partner?.id} listingsCount={listingsCount} />
        <RoleHubToolDeck tools={AU_TOOL_DECK} title="Seller tools" subtitle="List, verify, fulfill, and get paid." />
        <RoleWorkflowPanel roleId="au_seller" compact completedSteps={auSellerWorkflowProgress} />
        <FinelyOsPaginatedStack
          items={[...AU_SELLER_OFFERINGS]}
          pageSize={4}
          itemSpacingClassName="grid md:grid-cols-2 gap-3"
          renderItem={(item, idx) => (
            <div
              key={item.title}
              className={`space-y-2 p-5 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])}`}
              data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
            >
              <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{item.title}</div>
              <p className={FINELY_OS_ENTITY_BODY}>{item.description}</p>
              <ul className={`text-sm ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                {item.included.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          )}
        />
        <div className={`space-y-3 p-6 lg:p-8 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Jump to a seller room.</p>
          <div className="fc-au-hub-action-deck">
            {[
              { label: 'Listings', path: AU_SELLER.listingsPath, icon: CreditCard },
              { label: 'Contracts', path: AU_SELLER.contractsPath, icon: Link2 },
              { label: 'Payouts', path: AU_SELLER.payoutsPath, icon: Wallet },
              { label: 'Education', path: '/portal/education', icon: Megaphone },
              { label: 'Messages', path: AU_SELLER.messagesDeepLink, icon: MessageSquare },
            ].map(({ label, path, icon: Icon }) => (
              <button key={path} type="button" onClick={() => mappedNavigate(mapPortalHref(path))} className="fc-wlp-btn-secondary">
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isDemo && !auth.user) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={AU_SELLER.programName}
        title={AU_SELLER.hubName}
        description="Listings, marketplace, contracts, and payouts — after you join as an AU seller."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState title="Sign in to open the seller hub" description="Activation, inventory, and payouts live here." />
      </ProductHubScaffold>
    );
  }

  if (!isDemo && !sellerLoading && !gate.allowed) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={AU_SELLER.programName}
        title={AU_SELLER.hubName}
        description="Listings, marketplace, contracts, and payouts — after you join as an AU seller."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={
          gate.cta ? (
            <ProductPagePrimaryAction label={gate.cta.label} onClick={() => mappedNavigate(mapPortalHref(gate.cta!.path))} />
          ) : (
            <ProductPagePrimaryAction label={auGuide.label} onClick={() => mappedNavigate(auGuide.path)} />
          )
        }
      >
        <FinelyOsAlertBanner tone={gate.reason === 'unauthenticated' ? 'info' : 'warning'} message={gate.message} surface="light" />
      </ProductHubScaffold>
    );
  }

  if (!isDemo && partner && !hasActivation) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={AU_SELLER.programName}
        title={AU_SELLER_MARKETING_HEADLINE}
        description={`${AU_SELLER.startupFeeLabel} one-time activation — first ${AU_SELLER.listingSeasonDays}-day marketing season included.`}
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Activate seller program" onClick={() => setActivePane('overview')} />}
      >
        <AuSellerActivationPanel variant="paywall" activated={false} />
      </ProductHubScaffold>
    );
  }

  if (!isDemo && sellerLoading) {
    return <ProductDashboardSkeleton label="Loading your seller hub" />;
  }

  const welcomeName = getUserDisplayName(auth.user);

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={AU_SELLER.programName}
      title={AU_SELLER.hubName}
      description={`${AU_SELLER_MARKETING_HEADLINE}${welcomeName ? ` — welcome, ${welcomeName}` : ''}`}
      status={`${listingsCount} listing${listingsCount === 1 ? '' : 's'} · ${isDemo ? 'demo data' : 'live data'}`}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      metrics={metrics}
      metricTitle="Seller hub snapshot"
      metricDescription="Pick a ledger column — detail room updates below."
      primaryAction={
        <ProductPagePrimaryAction
          label="Manage listings"
          onClick={() => mappedNavigate(mapPortalHref(AU_SELLER.listingsPath))}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => mappedNavigate(mapPortalHref(AU_SELLER.messagesDeepLink))}>
          AU seller line
        </button>
      }
    >
      <section className="fc-wlp-section fc-au-ledger" data-surface-layout="ledger-board">
        <SellerWorkstationNav active="hub" mapHref={mapPortalHref} onNavigate={mappedNavigate} />

        <LedgerBoard active={activePane} tiles={hubLauncherTiles} onSelect={setActivePane} />

        <div
          className="fc-au-ledger-detail"
          data-fc-accent={hubLauncherTiles.find((t) => t.id === activePane)?.accent ?? 'violet'}
        >
          <div className="fc-au-ledger-detail-title">
            {hubLauncherTiles.find((t) => t.id === activePane)?.label ?? 'Overview'}
          </div>
          {renderPane()}
        </div>

        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => openProductCopilot({ prompt: 'What should I do next in the AU seller hub?', contextLabel: AU_SELLER.hubName })}
        >
          <CircleHelp size={14} /> Ask Finely
        </button>
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/resources#presenter-demo')}>
          <PlayCircle size={14} /> Watch how
        </button>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
