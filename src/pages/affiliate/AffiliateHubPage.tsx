import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Link2,
  MessageSquare,
  Megaphone,
  Percent,
  Sparkles,
  GraduationCap,
  Wallet,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { AF, AFFILIATE_OFFERINGS } from '../../config/affiliateProgram';
import { AffiliateCommissionCalculator } from '../../components/calculators/AffiliateCommissionCalculator';
import { AffiliateCommissionOptimizer } from '../../components/affiliate/AffiliateCommissionOptimizer';
import { DenefitsContractCalculator } from '../../components/calculators/BenefitsContractCalculator';
import { AffiliateReferralToolkit } from '../../components/affiliate/AffiliateReferralToolkit';
import { AffiliateRoleAutomationPanel } from '../../components/affiliate/AffiliateRoleAutomationPanel';
import { AffiliatePitchPanel } from '../../components/affiliate/AffiliatePitchPanel';
import { AffiliateCommandStrip } from '../../components/affiliate/AffiliateCommandStrip';
import { AffiliateCampaignManager } from '../../components/affiliate/AffiliateCampaignManager';
import { AffiliateCoMarketingKit } from '../../components/affiliate/AffiliateCoMarketingKit';
import { findAffiliateByEmail, findAffiliateByPartnerId } from '../../data/affiliateRepo';
import type { Affiliate } from '../../domain/affiliate';
import { DenefitsEnrollmentPanel } from '../../components/denefits/DenefitsEnrollmentPanel';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { BackToSiteButton } from '../../components/navigation/BackToSiteButton';
import { PayoutCenterPanel } from '../../components/payouts/PayoutCenterPanel';
import { RolePromoLinksPanel } from '../../components/promotions/RolePromoLinksPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildAffiliateNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type HubTab = 'overview' | 'calculator' | 'denefits' | 'payouts' | 'training' | 'operate';

const TABS: { id: HubTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'calculator', label: 'Commission', icon: Percent },
  { id: 'denefits', label: 'Denefit', icon: Percent },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'operate', label: 'Operate', icon: LayoutDashboard },
];

export default function AffiliateHubPage() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<HubTab>('overview');
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(false);

  useEffect(() => {
    if (!auth.user) return;
    setAffiliateLoading(true);
    void (async () => {
      let a: Affiliate | null = null;
      if (partner?.id) a = await findAffiliateByPartnerId(partner.id);
      if (!a && auth.user?.email) a = await findAffiliateByEmail(auth.user.email);
      setAffiliate(a);
      setAffiliateLoading(false);
    })();
  }, [auth.user?.email, partner?.id]);

  const affiliateWorkflowProgress = useMemo(
    () =>
      computeRoleWorkflowProgress('affiliate', {
        partner,
        affiliateHasReferralCode: Boolean(affiliate?.referralCode),
        affiliateActive: affiliate?.status === 'active',
        affiliateCampaignCount: affiliate?.campaigns?.length ?? 0,
      }),
    [partner, affiliate],
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'calculator' || t === 'denefits' || t === 'payouts' || t === 'training' || t === 'operate' || t === 'overview') {
      setTab(t);
    }
  }, [searchParams]);

  if (!auth.user) {
    return (
      <PageShell badge={AF.programName} title={AF.hubName} subtitle="Sign in to access commission tools, training, and referral resources.">
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

  return (
    <PageShell
      badge={AF.programName}
      title={AF.hubName}
      subtitle={`Welcome${getUserDisplayName(auth.user) ? `, ${getUserDisplayName(auth.user)}` : ''} — share your link, track referrals, and get paid.`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple max-w-5xl`}>
        <FinelyNoticedStrip
          items={buildAffiliateNoticedItems({
            hasReferralCode: Boolean(affiliate?.referralCode),
            tab,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={affiliate?.referralCode ? 1 : 0} />
        <FinelyUnifiedHubLayout
          eyebrow={AF.programName}
          title={AF.hubName}
          subtitle={`Share your link, track referrals, and get paid.`}
          accent="sky"
          kpis={[
            { label: 'Commission', value: `${AF.defaultCommissionPct}%`, accent: 'sky' },
            { label: 'Recurring', value: `${AF.defaultRecurringCommissionPct}%`, accent: 'violet' },
            { label: 'Denefit', value: `${AF.defaultDenefitsSharePct}%`, accent: 'emerald' },
            { label: 'Status', value: affiliate?.status ?? '—', accent: 'amber' },
          ]}
          tabs={TABS.map(({ id, label }) => ({ id, label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={{ label: 'Share application', onClick: () => navigate(AF.publicPath) }}
          secondaryAction={{ label: 'Messages', onClick: () => navigate(AF.messagesDeepLink) }}
        >
        {tab === 'overview' && (
          <>
            <AffiliateCommandStrip affiliate={affiliate} loading={affiliateLoading} />
            <div className={`grid md:grid-cols-3 gap-4 ${finelyOsCatalogCard('sky')} !p-5`} data-fc-accent="sky">
              <div className={finelyOsKpiTile(1)}>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-700`}>Default commission</div>
                <div className="text-3xl font-bold text-sky-700 mt-1">{AF.defaultCommissionPct}%</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>Upfront on referred packages</div>
              </div>
              <div className={finelyOsKpiTile(2)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Recurring</div>
                <div className={`text-3xl font-bold ${FINELY_OS_ENTITY_VALUE} mt-1`}>{AF.defaultRecurringCommissionPct}%</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>On membership plans (when eligible)</div>
              </div>
              <div className={finelyOsKpiTile(3)}>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-700`}>Denefit stream</div>
                <div className="text-3xl font-bold text-emerald-700 mt-1">{AF.defaultDenefitsSharePct}%</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>Example in-house contract share</div>
              </div>
            </div>

            <AffiliateReferralToolkit />
            <AffiliatePitchPanel referralUrl={affiliate?.referralCode ? `${AF.publicPath}?ref=${affiliate.referralCode}` : undefined} />
            <AffiliateCoMarketingKit />
            <RolePromoLinksPanel role="affiliate" title="Affiliate promo links: guides, ebooks, services" />
            <RoleWorkflowPanel roleId="affiliate" compact completedSteps={affiliateWorkflowProgress} />

            <FinelyOsPaginatedStack
              items={[...AFFILIATE_OFFERINGS]}
              pageSize={4}
              itemSpacingClassName="grid md:grid-cols-2 gap-4"
              renderItem={(item, idx) => (
                <div
                  key={item.title}
                  className={`space-y-2 ${finelyOsCatalogCard((['sky', 'violet', 'emerald', 'amber'] as const)[idx % 4])} !p-5`}
                  data-fc-accent={(['sky', 'violet', 'emerald', 'amber'] as const)[idx % 4]}
                >
                  <div className={FINELY_OS_ENTITY_VALUE}>{item.title}</div>
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

        {tab === 'calculator' && (
          <div className="space-y-6">
            <AffiliateCommissionCalculator />
            <AffiliateCommissionOptimizer />
          </div>
        )}

        {tab === 'denefits' && (
          <div className="space-y-6">
            <DenefitsContractCalculator audience="affiliate" />
            <DenefitsEnrollmentPanel audience="affiliate" />
          </div>
        )}

        {tab === 'payouts' && partner ? (
          <PayoutCenterPanel role="affiliate" ownerId={partner.id} ownerEmail={partner.profile.email} />
        ) : tab === 'payouts' ? (
          <div className={FINELY_OS_ENTITY_EMPTY}>Complete onboarding to link payouts to your partner profile.</div>
        ) : null}

        {tab === 'training' && <UnifiedTrainingPanel audience="affiliate" specialties={['personal_restore']} />}

        {tab === 'operate' && (
          <div className="space-y-6">
            <AffiliateRoleAutomationPanel
              partnerId={partner?.id}
              role="affiliate"
              referralUrl={affiliate?.referralCode ? `${AF.publicPath}?ref=${affiliate.referralCode}` : undefined}
            />
            {affiliate ? <AffiliateCampaignManager affiliate={affiliate} onUpdated={setAffiliate} /> : null}
            <AffiliateReferralToolkit />
            <RolePromoLinksPanel role="affiliate" compact title="Affiliate promo matrix" />
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
              <p className={FINELY_OS_ENTITY_BODY}>Quick links to run your affiliate workflow.</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Share application', path: AF.publicPath, icon: Link2 },
                  { label: 'Education library', path: '/portal/education', icon: Megaphone },
                  { label: 'Messages', path: AF.messagesDeepLink, icon: MessageSquare },
                  { label: 'Commission calc', path: `${AF.hubPath}?tab=calculator`, icon: Percent },
                  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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
