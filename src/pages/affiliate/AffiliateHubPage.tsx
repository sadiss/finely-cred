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
import { useSearchParams } from 'react-router-dom';
import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName, getUserProfileMeta } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { AF, AFFILIATE_OFFERINGS, AFFILIATE_WORK_SPLIT, getAffiliatePathById } from '../../config/affiliateProgram';
import { resolveFinelyCtaPath } from '../../lib/finelyCtaIntent';
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
import {
  FinelyUnifiedHubLayout,
  PartnerHubLauncherGrid,
  PartnerHubWorkModal,
  usePartnerHubLauncher,
} from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildAffiliateNoticedItems } from '../../lib/finelyProactiveSignals';
import { RoleHubToolDeck, type RoleHubTool } from '../../components/hubs/RoleHubToolDeck';
import { RoleHubDeepenOverview } from '../../components/hubs/RoleHubDeepenOverview';
import { HUB_PRODUCT_SHOT } from '../../config/productShots';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { resolveAffiliateHubAccess } from '../../lib/roleHubAccess';
import {
  AFFILIATE_TAB_TO_LAUNCHER,
  buildAffiliateHubLauncherTiles,
  ROLE_HUB_MODAL_ACCENT,
  type AffiliateHubLauncherId,
} from '../../components/partner/roleHubLauncherPresets';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const AF_TOOL_DECK: RoleHubTool[] = [
  { id: 'share', label: 'Share link', detail: 'Public apply page', path: AF.publicPath, icon: Link2, accent: 'sky', badge: 'Primary' },
  { id: 'calc', label: 'Payout calc', detail: 'Model commissions', path: `${AF.hubPath}?tab=calculator`, icon: Percent, accent: 'violet' },
  { id: 'payouts', label: 'Payouts', detail: 'Pending & paid', path: `${AF.hubPath}?tab=payouts`, icon: Wallet, accent: 'emerald' },
  { id: 'operate', label: 'Campaigns', detail: 'Attribute traffic', path: `${AF.hubPath}?tab=operate`, icon: Megaphone, accent: 'rose' },
  { id: 'training', label: 'Training', detail: 'Referral playbook', path: `${AF.hubPath}?tab=training`, icon: GraduationCap, accent: 'sky' },
  { id: 'messages', label: 'Messages', detail: 'Affiliate line', path: AF.messagesDeepLink, icon: MessageSquare, accent: 'violet' },
];

export default function AffiliateHubPage({ embedded = false }: PartnerEmbeddablePageProps = {}) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useMappedPartnerNavigate();
  const [searchParams] = useSearchParams();
  const hubLauncher = usePartnerHubLauncher<AffiliateHubLauncherId>();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) {
      setAffiliate(null);
      setAffiliateLoading(false);
      return;
    }
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
    if (t && t in AFFILIATE_TAB_TO_LAUNCHER) {
      hubLauncher.open(AFFILIATE_TAB_TO_LAUNCHER[t]);
    }
  }, [searchParams, hubLauncher.open]);

  const nowDoItems = useMemo(
    () => [
      {
        label: affiliate?.referralCode ? 'Share your referral link' : 'Confirm your affiliate profile',
        detail: affiliate?.referralCode
          ? 'Send the tagged apply link — track clicks and conversions here.'
          : 'Finish signup so your referral code and payouts attach to this hub.',
        to: affiliate?.referralCode ? AF.publicPath : resolveFinelyCtaPath('affiliate_intake'),
      },
      { label: 'Create a campaign', detail: 'Attribute traffic in Operate so payouts stay clean.', to: `${AF.hubPath}?tab=operate` },
      { label: 'Model a payout', detail: 'Use the calculator before you pitch a package.', to: `${AF.hubPath}?tab=calculator` },
    ],
    [affiliate?.referralCode],
  );

  const gate = useMemo(
    () => resolveAffiliateHubAccess({ user: auth.user, affiliate }),
    [auth.user, affiliate],
  );

  const pathBadge = useMemo(() => {
    const meta = getUserProfileMeta(auth.user) as Record<string, unknown>;
    const fromAff = String((affiliate?.meta as Record<string, unknown> | undefined)?.path ?? '');
    const fromUser = String(meta.affiliatePathId || meta.path || '');
    const pathId = fromAff || fromUser;
    const path = pathId ? getAffiliatePathById(pathId) : undefined;
    return path ? `${path.ladderLabel} · ${path.name}` : null;
  }, [auth.user, affiliate]);

  const hubLauncherTiles = useMemo(
    () =>
      buildAffiliateHubLauncherTiles({
        commissionPct: AF.defaultCommissionPct,
        recurringPct: AF.defaultRecurringCommissionPct,
        status: affiliate?.status,
        hasReferralCode: Boolean(affiliate?.referralCode),
        campaignCount: affiliate?.campaigns?.length ?? 0,
      }),
    [affiliate?.referralCode, affiliate?.status, affiliate?.campaigns?.length],
  );

  if (!auth.user || (!affiliateLoading && !gate.allowed)) {
    return (
      <PartnerWorkstationFrame embedded={embedded} kind="affiliate-hub-workstation"
        badge={AF.programName}
        title={AF.hubName}
        subtitle="Share your link, track referred partners, and get paid."
        back={{ to: AF.publicPath, label: 'Affiliate careers' }}
      >
        <div className={`${FINELY_OS_PAGE} max-w-3xl space-y-3`}>
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
            <button type="button" onClick={() => navigate('/affiliate-toolkit')} className={FINELY_OS_SECONDARY_BTN}>
              Open Affiliate Toolkit
            </button>
            {!auth.user ? <BackToSiteButton /> : null}
          </div>
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  return (
    <PartnerWorkstationFrame embedded={embedded} kind="affiliate-hub-workstation"
      badge={AF.programName}
      title={AF.hubName}
      subtitle={`Welcome${getUserDisplayName(auth.user) ? `, ${getUserDisplayName(auth.user)}` : ''} — share your link, track referrals, and get paid.`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple max-w-5xl`}>
        <FinelyNoticedStrip
          items={buildAffiliateNoticedItems({
            hasReferralCode: Boolean(affiliate?.referralCode),
            tab: hubLauncher.openId ?? 'overview',
          })}
        />
        <FinelyNowDoThisStrip items={nowDoItems} currentIndex={affiliate?.referralCode ? 0 : 0} />
        <FinelyUnifiedHubLayout
          eyebrow={AF.programName}
          title={AF.hubName}
          subtitle="Share your link, track referred partners, and get paid."
          accent="sky"
          kpis={[
            { label: 'Payout', value: `${AF.defaultCommissionPct}%`, accent: 'sky' },
            { label: 'Recurring', value: `${AF.defaultRecurringCommissionPct}%`, accent: 'violet' },
            { label: 'Denefit', value: `${AF.defaultDenefitsSharePct}%`, accent: 'emerald' },
            { label: 'Status', value: affiliate?.status ?? '—', accent: 'rose' },
          ]}
          primaryAction={{ label: 'Share application', onClick: () => navigate(AF.publicPath) }}
          secondaryAction={{ label: 'Messages', onClick: () => navigate(AF.messagesDeepLink) }}
          launcherSlot={<PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />}
        >
          {null}
        </FinelyUnifiedHubLayout>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('overview')}
          onClose={hubLauncher.close}
          title="Affiliate overview"
          subtitle="Command strip, referral toolkit, pitch deck, and workflow."
          accent={ROLE_HUB_MODAL_ACCENT.overview}
        >
          <AffiliateCommandStrip affiliate={affiliate} loading={affiliateLoading} />
          <RoleHubDeepenOverview
            split={AFFILIATE_WORK_SPLIT}
            accent="sky"
            pathBadge={pathBadge}
            nextStep={nowDoItems[0]}
            shotKey={HUB_PRODUCT_SHOT.affiliate}
            guide={{ label: 'Open Affiliate Toolkit', path: '/affiliate-toolkit' }}
          />
          <RoleHubToolDeck tools={AF_TOOL_DECK} title="Affiliate tools" subtitle="Share → attribute → model → get paid." />
          <AffiliateReferralToolkit />
          <AffiliatePitchPanel referralUrl={affiliate?.referralCode ? `${AF.publicPath}?ref=${affiliate.referralCode}` : undefined} />
          <AffiliateCoMarketingKit />
          <RolePromoLinksPanel role="affiliate" title="Affiliate promo links: guides, ebooks, services" />
          <RoleWorkflowPanel roleId="affiliate" compact completedSteps={affiliateWorkflowProgress} />
          <FinelyOsPaginatedStack
            items={[...AFFILIATE_OFFERINGS]}
            pageSize={4}
            itemSpacingClassName="grid md:grid-cols-2 gap-3"
            renderItem={(item, idx) => (
              <div
                key={item.title}
                className={`space-y-3 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])}`}
                data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
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
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('calculator')}
          onClose={hubLauncher.close}
          title="Payout calculator"
          subtitle="Model commissions and optimize package mix."
          accent={ROLE_HUB_MODAL_ACCENT.calculator}
        >
          <AffiliateCommissionCalculator />
          <AffiliateCommissionOptimizer />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('denefits')}
          onClose={hubLauncher.close}
          title="Denefit share"
          subtitle="Benefits revenue on referred partners."
          accent={ROLE_HUB_MODAL_ACCENT.denefits}
        >
          <DenefitsContractCalculator audience="affiliate" />
          <DenefitsEnrollmentPanel audience="affiliate" />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('payouts')}
          onClose={hubLauncher.close}
          title="Payouts"
          subtitle="Pending, paid, and payout history."
          accent={ROLE_HUB_MODAL_ACCENT.payouts}
        >
          {partner ? (
            <PayoutCenterPanel role="affiliate" ownerId={partner.id} ownerEmail={partner.profile.email} />
          ) : (
            <div className={FINELY_OS_ENTITY_BODY}>Complete onboarding to link payouts to your partner profile.</div>
          )}
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('training')}
          onClose={hubLauncher.close}
          title="Affiliate training"
          subtitle="Referral playbook and academy tracks."
          accent={ROLE_HUB_MODAL_ACCENT.training}
        >
          <UnifiedTrainingPanel audience="affiliate" specialties={['personal_restore']} />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('operate')}
          onClose={hubLauncher.close}
          title="Operate"
          subtitle="Campaigns, automation, and day-to-day affiliate workflow."
          accent={ROLE_HUB_MODAL_ACCENT.operate}
        >
          <AffiliateRoleAutomationPanel
            partnerId={partner?.id}
            role="affiliate"
            referralUrl={affiliate?.referralCode ? `${AF.publicPath}?ref=${affiliate.referralCode}` : undefined}
          />
          {affiliate ? <AffiliateCampaignManager affiliate={affiliate} onUpdated={setAffiliate} /> : null}
          <AffiliateReferralToolkit />
          <RolePromoLinksPanel role="affiliate" compact title="Affiliate promo matrix" />
          <div className={`space-y-4 ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
            <p className={FINELY_OS_ENTITY_BODY}>Quick links to run your affiliate workflow.</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Share application', path: AF.publicPath, icon: Link2 },
                { label: 'Education library', path: '/portal/education', icon: Megaphone },
                { label: 'Messages', path: AF.messagesDeepLink, icon: MessageSquare },
                { label: 'Payout calc', path: `${AF.hubPath}?tab=calculator`, icon: Percent },
                { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
              ].map(({ label, path, icon: Icon }) => (
                <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            {partner ? <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Partner ID: {partner.id}</div> : null}
          </div>
        </PartnerHubWorkModal>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </PartnerWorkstationFrame>
  );
}
