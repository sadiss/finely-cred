import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquare,
  Percent,
  ShoppingBag,
  Sparkles,
  GraduationCap,
  Wallet,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { AU_SELLER, AU_SELLER_MARKETING_HEADLINE, AU_SELLER_OFFERINGS } from '../../config/auSellerProgram';
import { isAdminEmail } from '../../auth/admin';
import { listEntitlementsByPartner } from '../../data/billingRepo';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { DenefitsContractCalculator } from '../../components/calculators/BenefitsContractCalculator';
import { DenefitsEnrollmentPanel } from '../../components/denefits/DenefitsEnrollmentPanel';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { BackToSiteButton } from '../../components/navigation/BackToSiteButton';
import { AuSellerActivationPanel } from '../../components/seller/AuSellerActivationPanel';
import { AuSellerCommandStrip } from '../../components/seller/AuSellerCommandStrip';
import { AuSellerRoleAutomationPanel } from '../../components/seller/AuSellerRoleAutomationPanel';
import { findAuSellerByEmailAsync } from '../../data/auSellerRepo';
import type { AuSeller } from '../../domain/auSeller';
import { PayoutCenterPanel } from '../../components/payouts/PayoutCenterPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FinelyUnifiedHubLayout,
  PartnerHubLauncherGrid,
  PartnerHubWorkModal,
  usePartnerHubLauncher,
} from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { RoleHubToolDeck, type RoleHubTool } from '../../components/hubs/RoleHubToolDeck';
import { RoleHubDeepenOverview } from '../../components/hubs/RoleHubDeepenOverview';
import { HUB_PRODUCT_SHOT } from '../../config/productShots';
import { ROLE_WORK_SPLIT, ROLE_GUIDE_CTAS } from '../../config/rolePartnerPrograms';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { resolveAuSellerHubAccess } from '../../lib/roleHubAccess';
import {
  AU_SELLER_TAB_TO_LAUNCHER,
  buildAuSellerHubLauncherTiles,
  ROLE_HUB_MODAL_ACCENT,
  type AuSellerHubLauncherId,
} from '../../components/partner/roleHubLauncherPresets';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const AU_TOOL_DECK: RoleHubTool[] = [
  { id: 'listings', label: 'Listings', detail: 'Add / update cards', path: AU_SELLER.listingsPath, icon: CreditCard, accent: 'violet', badge: 'Primary' },
  { id: 'market', label: 'Marketplace', detail: 'Partner-facing shelf', path: AU_SELLER.marketplacePath, icon: ShoppingBag, accent: 'sky' },
  { id: 'contracts', label: 'Contracts', detail: 'Accept & fulfill', path: AU_SELLER.contractsPath, icon: Link2, accent: 'emerald' },
  { id: 'payouts', label: 'Payouts', detail: 'Placement fees', path: AU_SELLER.payoutsPath, icon: Wallet, accent: 'rose' },
  { id: 'training', label: 'Training', detail: 'Tradeline track', path: `${AU_SELLER.hubPath}?tab=training`, icon: GraduationCap, accent: 'emerald' },
  { id: 'line', label: 'AU seller line', detail: 'Message Finely', path: AU_SELLER.messagesDeepLink, icon: MessageSquare, accent: 'violet' },
];

export default function AuSellerHubPage({ embedded = false }: PartnerEmbeddablePageProps = {}) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useMappedPartnerNavigate();
  const [searchParams] = useSearchParams();
  const hubLauncher = usePartnerHubLauncher<AuSellerHubLauncherId>();
  const [seller, setSeller] = useState<AuSeller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(true);

  useEffect(() => {
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
  }, [auth.user?.email]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t in AU_SELLER_TAB_TO_LAUNCHER) {
      hubLauncher.open(AU_SELLER_TAB_TO_LAUNCHER[t]);
    }
  }, [searchParams, hubLauncher.open]);

  const listingsCount = useMemo(
    () => seller?.listings?.filter((l) => l.status !== 'draft').length ?? 0,
    [seller?.listings],
  );

  const hasActivation = useMemo(() => {
    if (!partner?.id) return false;
    if (isAdminEmail(auth.user?.email)) return true;
    return listEntitlementsByPartner(partner.id).some(
      (e) => e.key === ENTITLEMENT_KEYS.auSeller && e.status === 'active',
    );
  }, [partner?.id, auth.user?.email]);

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
        hasSellerProfile: Boolean(seller),
      }),
    [listingsCount, seller],
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
            ? 'Check how buyers see your shelf.'
            : 'KYC unlocks live marketplace listings.',
        to: seller?.verification?.status === 'verified' ? AU_SELLER.marketplacePath : AU_SELLER.contractsPath,
      },
      { label: 'Open AU seller line', detail: 'Ask Finely about payouts or fulfillment blockers.', to: AU_SELLER.messagesDeepLink },
    ],
    [listingsCount, seller?.verification?.status],
  );

  const noticedItems = useMemo(() => {
    type Item = { id: string; tone: 'info' | 'warn' | 'success'; text: string; actionLabel: string; to: string };
    const items: Item[] = [];
    if (!seller) {
      items.push({
        id: 'au-profile',
        tone: 'warn',
        text: 'Seller profile incomplete. Finish onboarding so listings and payouts attach here.',
        actionLabel: 'Open listings',
        to: AU_SELLER.listingsPath,
      });
    } else if (seller.verification?.status !== 'verified') {
      items.push({
        id: 'au-kyc',
        tone: 'warn',
        text: 'Verification pending. Submit KYC so approved listings can go live.',
        actionLabel: 'Open contracts',
        to: AU_SELLER.contractsPath,
      });
    } else if (listingsCount === 0) {
      items.push({
        id: 'au-list',
        tone: 'info',
        text: 'No live listings yet. Add inventory — Finely markets seats to partners.',
        actionLabel: 'Add listing',
        to: AU_SELLER.listingsPath,
      });
    } else {
      items.push({
        id: 'au-ok',
        tone: 'success',
        text: `Seller workspace live with ${listingsCount} listing${listingsCount === 1 ? '' : 's'} on file.`,
        actionLabel: 'View marketplace',
        to: AU_SELLER.marketplacePath,
      });
    }
    return items;
  }, [seller, listingsCount]);

  const gate = useMemo(
    () => resolveAuSellerHubAccess({ user: auth.user, seller }),
    [auth.user, seller],
  );
  const auGuide = ROLE_GUIDE_CTAS.au_seller;
  const workSplit = ROLE_WORK_SPLIT.au_seller;

  if (!auth.user || (!sellerLoading && !gate.allowed)) {
    return (
      <PartnerWorkstationFrame embedded={embedded} kind="au-seller-hub-workstation"
        badge={AU_SELLER.programName}
        title={AU_SELLER.hubName}
        subtitle="Listings, marketplace, contracts, and payouts — after you join as an AU seller."
        back={{ to: AU_SELLER.publicPath, label: 'AU seller careers' }}
      >
        <div className={`${FINELY_OS_COMPACT_PAGE} max-w-3xl space-y-3`}>
          <FinelyOsAlertBanner
            tone={!auth.user || gate.reason === 'unauthenticated' ? 'info' : 'warning'}
            message={gate.message}
          />
          <div className="flex flex-wrap gap-2">
            {gate.cta ? (
              <button type="button" onClick={() => navigate(gate.cta!.path)} className={FINELY_OS_PRIMARY_BTN}>
                {gate.cta.label}
              </button>
            ) : null}
            <button type="button" onClick={() => navigate(auGuide.path)} className={FINELY_OS_SECONDARY_BTN}>
              {auGuide.label}
            </button>
            {!auth.user ? <BackToSiteButton /> : null}
          </div>
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  if (partner && !hasActivation) {
    return (
      <PartnerWorkstationFrame embedded={embedded} kind="au-seller-hub-workstation"
        badge={AU_SELLER.programName}
        title={AU_SELLER_MARKETING_HEADLINE}
        subtitle={`${AU_SELLER.startupFeeLabel} one-time activation — first ${AU_SELLER.listingSeasonDays}-day marketing season included.`}
        back={{ to: '/dashboard', label: 'Dashboard' }}
      >
        <div className={`${FINELY_OS_COMPACT_PAGE} max-w-3xl`}>
          <AuSellerActivationPanel variant="paywall" activated={false} />
          <BackToSiteButton />
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  const marketplaceShare = typeof window !== 'undefined' ? `${window.location.origin}${AU_SELLER.marketplacePath}` : AU_SELLER.marketplacePath;

  return (
    <PartnerWorkstationFrame embedded={embedded} kind="au-seller-hub-workstation"
      badge={AU_SELLER.programName}
      title={AU_SELLER.hubName}
      subtitle={`${AU_SELLER_MARKETING_HEADLINE}${getUserDisplayName(auth.user) ? ` — welcome, ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_COMPACT_PAGE} max-w-5xl`}>
        <FinelyNoticedStrip items={noticedItems} />
        <FinelyNowDoThisStrip
          items={nowDoItems}
          currentIndex={listingsCount === 0 ? 0 : seller?.verification?.status === 'verified' ? 0 : 1}
          className=""
        />
        <FinelyUnifiedHubLayout
          eyebrow={AU_SELLER.programName}
          title={AU_SELLER.hubName}
          subtitle={AU_SELLER_MARKETING_HEADLINE}
          accent="violet"
          kpis={[
            { label: 'Listings', value: String(listingsCount), accent: 'emerald' },
            { label: 'Verified', value: seller?.verification?.status === 'verified' ? 'Yes' : 'Pending', accent: 'violet' },
            { label: 'Profile', value: seller ? 'Active' : 'Setup', accent: 'sky' },
            { label: 'Marketplace', value: 'Live', accent: 'rose' },
          ]}
          primaryAction={{ label: 'Manage listings', onClick: () => navigate(AU_SELLER.listingsPath) }}
          secondaryAction={{ label: 'AU seller line', onClick: () => navigate(AU_SELLER.messagesDeepLink) }}
          launcherSlot={<PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />}
        >
          {null}
        </FinelyUnifiedHubLayout>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('overview')}
          onClose={hubLauncher.close}
          title="AU seller overview"
          subtitle="Activation, tools, offerings, and seller workflow."
          accent={ROLE_HUB_MODAL_ACCENT.overview}
        >
          <AuSellerActivationPanel variant="hub" activated={hasActivation} />
          <AuSellerCommandStrip seller={seller} loading={sellerLoading} />
          <RoleHubDeepenOverview
            split={workSplit}
            accent="violet"
            nextStep={nowDoItems[0]}
            shotKey={HUB_PRODUCT_SHOT.au_seller}
            guide={{ label: auGuide.label, path: auGuide.path }}
          />
          <RoleHubToolDeck tools={AU_TOOL_DECK} title="AU seller tools" subtitle="List → verify → fulfill → get paid." />
          <RoleWorkflowPanel roleId="au_seller" compact completedSteps={auSellerWorkflowProgress} />
          <FinelyOsPaginatedStack
            items={[...AU_SELLER_OFFERINGS]}
            pageSize={4}
            itemSpacingClassName="grid md:grid-cols-2 gap-3"
            renderItem={(item, idx) => (
              <div
                key={item.title}
                className={`space-y-2 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])}`}
                data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
              >
                <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{item.title}</div>
                <p className={FINELY_OS_ENTITY_BODY}>{item.description}</p>
                <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                  {item.included.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              </div>
            )}
          />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('marketplace')}
          onClose={hubLauncher.close}
          title="Marketplace"
          subtitle="Share your shelf and manage partner-facing inventory."
          accent={ROLE_HUB_MODAL_ACCENT.marketplace}
        >
          <div className={`space-y-3 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
            <p className={FINELY_OS_ENTITY_BODY}>Share your marketplace presence and manage partner-facing inventory.</p>
            <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony`} data-fc-accent="sky">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Public marketplace link</div>
              <div className={`mt-2 font-mono text-sm ${FINELY_OS_ENTITY_BODY} break-all`}>{marketplaceShare}</div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Manage listings', path: AU_SELLER.listingsPath, icon: CreditCard },
                { label: 'Partner marketplace', path: AU_SELLER.marketplacePath, icon: ShoppingBag },
                { label: 'Seller dashboard', path: AU_SELLER.dashboardPath, icon: LayoutDashboard },
              ].map(({ label, path, icon: Icon }) => (
                <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('economics')}
          onClose={hubLauncher.close}
          title="Economics & payouts"
          subtitle="Placement fees, Denefit share, and payout center."
          accent={ROLE_HUB_MODAL_ACCENT.economics}
        >
          <div className="space-y-4">
            <div className={`${finelyOsCatalogCard('emerald')} ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="emerald">
              Many AU sellers also refer partners into Denefit in-house contracts for restoration packages — model that recurring stream alongside AU placement fees.
            </div>
            {seller ? <PayoutCenterPanel role="seller" ownerId={seller.id} ownerEmail={seller.email} seller={seller} /> : null}
            <DenefitsContractCalculator audience="affiliate" compact />
            <DenefitsEnrollmentPanel audience="affiliate" compact />
          </div>
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('training')}
          onClose={hubLauncher.close}
          title="AU seller training"
          subtitle="Tradeline seller academy and fulfillment playbook."
          accent={ROLE_HUB_MODAL_ACCENT.training}
        >
          <UnifiedTrainingPanel audience="affiliate" specialties={['tradelines']} />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('operate')}
          onClose={hubLauncher.close}
          title="Operate"
          subtitle="Listings, contracts, automation, and day-to-day seller ops."
          accent={ROLE_HUB_MODAL_ACCENT.operate}
        >
          <div className="space-y-6">
            <AuSellerRoleAutomationPanel partnerId={partner?.id} listingsCount={listingsCount} />
            <div className={`space-y-3 ${finelyOsCatalogCard('violet')}`} data-fc-accent="violet">
              <p className={FINELY_OS_ENTITY_BODY}>Day-to-day AU seller operations.</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Listings', path: AU_SELLER.listingsPath, icon: CreditCard },
                  { label: 'Contracts', path: AU_SELLER.contractsPath, icon: Link2 },
                  { label: 'Payouts', path: AU_SELLER.payoutsPath, icon: Wallet },
                  { label: 'Education', path: '/portal/education', icon: Megaphone },
                  { label: 'Messages', path: AU_SELLER.messagesDeepLink, icon: MessageSquare },
                ].map(({ label, path, icon: Icon }) => (
                  <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              {partner ? <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Partner ID: {partner.id}</div> : null}
            </div>
          </div>
        </PartnerHubWorkModal>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </PartnerWorkstationFrame>
  );
}
