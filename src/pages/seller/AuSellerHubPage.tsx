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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { AU_SELLER, AU_SELLER_ACTIVATION_BULLETS, AU_SELLER_MARKETING_HEADLINE, AU_SELLER_OFFERINGS } from '../../config/auSellerProgram';
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
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,

  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type HubTab = 'overview' | 'marketplace' | 'economics' | 'training' | 'operate';

const TABS: { id: HubTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'economics', label: 'Economics', icon: Percent },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'operate', label: 'Operate', icon: LayoutDashboard },
];

export default function AuSellerHubPage() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<HubTab>('overview');
  const [seller, setSeller] = useState<AuSeller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);

  useEffect(() => {
    const email = auth.user?.email;
    if (!email) return;
    setSellerLoading(true);
    void findAuSellerByEmailAsync(email).then((s) => {
      setSeller(s);
      setSellerLoading(false);
    });
  }, [auth.user?.email]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'marketplace' || t === 'economics' || t === 'training' || t === 'operate' || t === 'overview') {
      setTab(t);
    }
  }, [searchParams]);

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

  if (!auth.user) {
    return (
      <PageShell badge={AU_SELLER.programName} title={AU_SELLER.hubName} subtitle="Sign in to manage AU listings, contracts, and payouts.">
        <div className={`${FINELY_OS_PAGE} flex flex-wrap gap-4`}>
          <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_PRIMARY_BTN}>
            Sign in
          </button>
          <BackToSiteButton />
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  if (partner && !hasActivation) {
    return (
      <PageShell
        badge={AU_SELLER.programName}
        title={AU_SELLER_MARKETING_HEADLINE}
        subtitle={`${AU_SELLER.startupFeeLabel} one-time activation — first ${AU_SELLER.listingSeasonDays}-day marketing season included.`}
        back={{ to: '/dashboard', label: 'Dashboard' }}
      >
        <div className={`${FINELY_OS_PAGE} max-w-3xl space-y-6`}>
          <AuSellerActivationPanel variant="paywall" activated={false} />
          <BackToSiteButton />
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  const marketplaceShare = typeof window !== 'undefined' ? `${window.location.origin}${AU_SELLER.marketplacePath}` : AU_SELLER.marketplacePath;

  return (
    <PageShell
      badge={AU_SELLER.programName}
      title={AU_SELLER.hubName}
      subtitle={`${AU_SELLER_MARKETING_HEADLINE}${getUserDisplayName(auth.user) ? ` — welcome, ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl`}>
        <FinelyUnifiedHubLayout
          eyebrow={AU_SELLER.programName}
          title={AU_SELLER.hubName}
          subtitle={AU_SELLER_MARKETING_HEADLINE}
          accent="violet"
          kpis={[
            { label: 'Listings', value: String(listingsCount), accent: 'violet' },
            { label: 'Verified', value: seller?.verification?.status === 'verified' ? 'Yes' : 'Pending', accent: 'emerald' },
            { label: 'Profile', value: seller ? 'Active' : 'Setup', accent: 'amber' },
            { label: 'Marketplace', value: 'Live', accent: 'sky' },
          ]}
          tabs={TABS.map(({ id, label }) => ({ id, label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={{ label: 'Manage listings', onClick: () => navigate(AU_SELLER.listingsPath) }}
          secondaryAction={{ label: 'AU seller line', onClick: () => navigate(AU_SELLER.messagesDeepLink) }}
        >
        {tab === 'overview' && (
          <>
            <AuSellerActivationPanel variant="hub" activated={hasActivation} />
            <AuSellerCommandStrip seller={seller} loading={sellerLoading} />
            <div className={`grid md:grid-cols-3 gap-4 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
              <div className={finelyOsKpiTile(3)}>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Seller workspace</div>
                <div className="text-3xl font-bold text-violet-700 mt-1">Live</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>Listings, contracts, payouts</div>
              </div>
              <div className={finelyOsKpiTile(0)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Marketplace</div>
                <button type="button" onClick={() => navigate(AU_SELLER.marketplacePath)} className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}>
                  View buyer marketplace
                </button>
              </div>
              <div className={finelyOsKpiTile(1)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Support</div>
                <button type="button" onClick={() => navigate(AU_SELLER.messagesDeepLink)} className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}>
                  <MessageSquare size={14} /> AU seller line
                </button>
              </div>
            </div>
            <RoleWorkflowPanel roleId="au_seller" compact completedSteps={auSellerWorkflowProgress} />
            <FinelyOsPaginatedStack
              items={[...AU_SELLER_OFFERINGS]}
              pageSize={4}
              itemSpacingClassName="grid md:grid-cols-2 gap-4"
              renderItem={(item, idx) => (
                <div
                  key={item.title}
                  className={`space-y-2 ${finelyOsCatalogCard((['violet', 'emerald', 'sky', 'amber'] as const)[idx % 4])} !p-5`}
                  data-fc-accent={(['violet', 'emerald', 'sky', 'amber'] as const)[idx % 4]}
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
          </>
        )}

        {tab === 'marketplace' && (
          <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
            <p className={FINELY_OS_ENTITY_BODY}>Share your marketplace presence and manage buyer-facing inventory.</p>
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-700`}>Public marketplace link</div>
              <div className={`mt-2 font-mono text-sm ${FINELY_OS_ENTITY_BODY} break-all`}>{marketplaceShare}</div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Manage listings', path: AU_SELLER.listingsPath, icon: CreditCard },
                { label: 'Buyer marketplace', path: AU_SELLER.marketplacePath, icon: ShoppingBag },
                { label: 'Seller dashboard', path: AU_SELLER.dashboardPath, icon: LayoutDashboard },
              ].map(({ label, path, icon: Icon }) => (
                <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'economics' && (
          <div className="space-y-4">
            <div className={`${finelyOsCatalogCard('emerald')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
              Many AU sellers also refer clients into Denefit in-house contracts for restoration packages — model that recurring stream alongside AU placement fees.
            </div>
            {seller ? <PayoutCenterPanel role="seller" ownerId={seller.id} ownerEmail={seller.email} seller={seller} /> : null}
            <DenefitsContractCalculator audience="affiliate" compact />
            <DenefitsEnrollmentPanel audience="affiliate" compact />
          </div>
        )}

        {tab === 'training' && <UnifiedTrainingPanel audience="affiliate" specialties={['tradelines']} />}

        {tab === 'operate' && (
          <div className="space-y-6">
            <AuSellerRoleAutomationPanel partnerId={partner?.id} listingsCount={listingsCount} />
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
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
        )}

        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
