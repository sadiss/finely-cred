import React, { useEffect, useMemo, useState } from 'react';
import {
  CircleHelp,
  Link2,
  Megaphone,
  MessageSquare,
  Percent,
  PlayCircle,
  Share2,
  Wallet,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { AffiliateCommissionCalculator } from '../../../../components/calculators/AffiliateCommissionCalculator';
import { AffiliateCampaignManager } from '../../../../components/affiliate/AffiliateCampaignManager';
import { AffiliateCoMarketingKit } from '../../../../components/affiliate/AffiliateCoMarketingKit';
import { AffiliateCommandStrip } from '../../../../components/affiliate/AffiliateCommandStrip';
import { AffiliateCommissionOptimizer } from '../../../../components/affiliate/AffiliateCommissionOptimizer';
import { AffiliatePitchPanel } from '../../../../components/affiliate/AffiliatePitchPanel';
import { DenefitsEnrollmentPanel } from '../../../../components/denefits/DenefitsEnrollmentPanel';
import { DenefitsContractCalculator } from '../../../../components/calculators/BenefitsContractCalculator';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../../../lib/roleWorkflowProgress';
import { AffiliateReferralToolkit } from '../../../../components/affiliate/AffiliateReferralToolkit';
import { AffiliateRoleAutomationPanel } from '../../../../components/affiliate/AffiliateRoleAutomationPanel';
import { RolePromoLinksPanel } from '../../../../components/promotions/RolePromoLinksPanel';
import { PayoutCenterPanel } from '../../../../components/payouts/PayoutCenterPanel';
import { UnifiedTrainingPanel } from '../../../../components/training/UnifiedTrainingPanel';
import { AF, AFFILIATE_OFFERINGS } from '../../../../config/affiliateProgram';
import { findAffiliateByEmail, findAffiliateByPartnerId } from '../../../../data/affiliateRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { Affiliate } from '../../../../domain/affiliate';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { resolveFinelyCtaPath } from '../../../../lib/finelyCtaIntent';
import { resolveAffiliateHubAccess } from '../../../../lib/roleHubAccess';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerAffiliateHubSurface.css';

const METRICS_VARIANT = 'jewel' as const;
const AFFILIATE_PURPOSE =
  'Share your tagged apply link, attribute traffic with campaigns, and track referred partners through payout.';

type AffiliateFloorTileId = 'share' | 'calculator' | 'payouts' | 'operate' | 'training';

const FLOOR_TILES: Array<{
  id: AffiliateFloorTileId;
  label: string;
  hint: string;
  accent: 'violet' | 'emerald' | 'sky' | 'rose';
  icon: typeof Link2;
}> = [
  { id: 'share', label: 'Share link', hint: 'Referral toolkit & pitch', accent: 'emerald', icon: Link2 },
  { id: 'calculator', label: 'Payout calc', hint: 'Model commissions', accent: 'violet', icon: Percent },
  { id: 'payouts', label: 'Payouts', hint: 'Pending & paid', accent: 'rose', icon: Wallet },
  { id: 'operate', label: 'Campaigns', hint: 'Attribute traffic', accent: 'sky', icon: Megaphone },
  { id: 'training', label: 'Training', hint: 'Referral playbook', accent: 'emerald', icon: Share2 },
];

const TAB_QUERY_ALIASES: Record<string, AffiliateFloorTileId> = {
  overview: 'share',
  share: 'share',
  calculator: 'calculator',
  payouts: 'payouts',
  operate: 'operate',
  training: 'training',
};

function resolveActiveTile(raw: string | null): AffiliateFloorTileId {
  if (!raw) return 'share';
  return TAB_QUERY_ALIASES[raw] ?? 'share';
}

const FLOOR_TILE_LABELS: Record<AffiliateFloorTileId, string> = {
  share: 'Share & referrals',
  calculator: 'Payout calculator',
  payouts: 'Payout center',
  operate: 'Campaigns & automation',
  training: 'Affiliate training',
};

export default function PartnerAffiliateHubProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Share2;
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(!isDemo);

  const activeTile = resolveActiveTile(searchParams.get('tab'));

  const setActiveTile = (tile: AffiliateFloorTileId) => {
    const next = new URLSearchParams(searchParams);
    if (tile === 'share') next.delete('tab');
    else next.set('tab', tile);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (isDemo) {
      setAffiliate(null);
      setAffiliateLoading(false);
      return;
    }
    if (!auth.user) {
      setAffiliate(null);
      setAffiliateLoading(false);
      return;
    }
    setAffiliateLoading(true);
    void (async () => {
      let record: Affiliate | null = null;
      if (partner?.id) record = await findAffiliateByPartnerId(partner.id);
      if (!record && auth.user?.email) record = await findAffiliateByEmail(auth.user.email);
      setAffiliate(record);
      setAffiliateLoading(false);
    })();
  }, [auth.user?.email, isDemo, partner?.id]);

  const gate = useMemo(
    () => (isDemo ? { allowed: true, message: 'Demo affiliate workspace.', reason: 'ok' as const } : resolveAffiliateHubAccess({ user: auth.user, affiliate })),
    [affiliate, auth.user, isDemo],
  );

  const referralUrl = affiliate?.referralCode
    ? `${AF.publicPath}?ref=${encodeURIComponent(affiliate.referralCode)}`
    : undefined;

  const sharePath = referralUrl ?? AF.publicPath;

  const primaryShare = () => {
    if (affiliate?.referralCode) {
      navigate(mapPortalHref(sharePath));
      return;
    }
    navigate(mapPortalHref(resolveFinelyCtaPath('affiliate_intake')));
  };

  const primaryLabel = affiliate?.referralCode ? 'Share referral link' : 'Share application';

  const campaignCount = affiliate?.campaigns?.filter((c) => c.status === 'active').length ?? 0;

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

  const messagesPath = mapPortalHref(AF.messagesDeepLink);

  const metrics: ProductMetric[] = useMemo(
    () => [
      {
        label: 'Package payout',
        value: `${AF.defaultCommissionPct}%`,
        hint: 'Upfront on qualified referral sales',
        accent: 'emerald',
        icon: Percent,
        onClick: () => setActiveTile('calculator'),
      },
      {
        label: 'Recurring share',
        value: `${AF.defaultRecurringCommissionPct}%`,
        hint: 'While referred partners stay active',
        accent: 'violet',
        icon: Wallet,
        onClick: () => setActiveTile('calculator'),
      },
      {
        label: 'Affiliate status',
        value: affiliate?.status ?? (affiliateLoading ? '…' : '—'),
        hint: affiliate?.status === 'active' ? 'Referral lane is live' : 'Finish setup to go live',
        accent: 'rose',
        icon: Megaphone,
        onClick: () => setActiveTile('share'),
      },
      {
        label: 'Referral code',
        value: affiliate?.referralCode ? 'Live' : 'Setup',
        hint: affiliate?.referralCode ? affiliate.referralCode : 'Confirm profile to attach payouts',
        accent: 'sky',
        icon: Link2,
        onClick: () => setActiveTile('share'),
      },
    ],
    [affiliate?.referralCode, affiliate?.status, affiliateLoading],
  );

  const statusHeadline = affiliate?.referralCode
    ? `Referral code live · ${campaignCount} active campaign${campaignCount === 1 ? '' : 's'}`
    : affiliateLoading
      ? 'Loading affiliate profile'
      : 'Referral setup needed';

  const renderTabBody = () => {
    if (isDemo) {
      return (
        <ProductEmptyState
          title="Sign in to run your affiliate hub"
          description="Demo mode shows the layout — sign in to copy referral links, manage campaigns, and view payouts."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
              Sign in
            </button>
          }
        />
      );
    }

    if (!gate.allowed) {
      return (
        <div className="space-y-4">
          <FinelyOsAlertBanner
            tone={!auth.user || gate.reason === 'unauthenticated' ? 'info' : 'warning'}
            message={gate.message}
          />
          {gate.cta ? (
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref(gate.cta!.path))}>
              {gate.cta.label}
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {activeTile === 'share' ? (
          <>
            <AffiliateCommandStrip affiliate={affiliate} loading={affiliateLoading} />
            <AffiliateReferralToolkit />
            <AffiliatePitchPanel referralUrl={referralUrl} />
            <AffiliateCoMarketingKit />
          </>
        ) : null}

        {activeTile === 'calculator' ? (
          <>
            <AffiliateCommissionCalculator />
            <AffiliateCommissionOptimizer />
            <DenefitsContractCalculator audience="affiliate" />
            <DenefitsEnrollmentPanel audience="affiliate" />
          </>
        ) : null}

        {activeTile === 'payouts' ? (
          partner ? (
            <PayoutCenterPanel role="affiliate" ownerId={partner.id} ownerEmail={partner.profile.email} />
          ) : (
            <ProductEmptyState
              title="Link your partner profile"
              description="Complete onboarding so payouts attach to your partner file."
              action={
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/onboarding'))}>
                  Finish onboarding
                </button>
              }
            />
          )
        ) : null}

        {activeTile === 'operate' ? (
          <>
            <AffiliateRoleAutomationPanel partnerId={partner?.id} role="affiliate" referralUrl={referralUrl} />
            {affiliate ? <AffiliateCampaignManager affiliate={affiliate} onUpdated={setAffiliate} /> : null}
            <RolePromoLinksPanel role="affiliate" compact title="Promo links" />
          </>
        ) : null}

        {activeTile === 'training' ? (
          <>
            <UnifiedTrainingPanel audience="affiliate" specialties={['personal_restore']} />
            <RoleWorkflowPanel roleId="affiliate" compact completedSteps={affiliateWorkflowProgress} />
            <FinelyOsPaginatedStack
              items={[...AFFILIATE_OFFERINGS]}
              pageSize={4}
              itemSpacingClassName="grid md:grid-cols-2 gap-3"
              renderItem={(item, idx) => (
                <div
                  key={item.title}
                  className={`space-y-3 p-6 lg:p-8 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])}`}
                  data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
                >
                  <div className={FINELY_OS_ENTITY_VALUE}>{item.title}</div>
                  <p className={FINELY_OS_ENTITY_BODY}>{item.description}</p>
                  <ul className={`text-sm ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                    {item.included.map((line) => (
                      <li key={line}>• {line}</li>
                    ))}
                  </ul>
                </div>
              )}
            />
          </>
        ) : null}
      </div>
    );
  };

  if (!isDemo && affiliateLoading && gate.allowed) {
    return <ProductDashboardSkeleton label="Loading your affiliate hub" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId="affiliate-hub"
      eyebrow="Affiliate"
      title="Share your link, track referred partners, and get paid."
      description={AFFILIATE_PURPOSE}
      status={`${statusHeadline} · ${isDemo ? 'demo data' : 'live data'}`}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label={isDemo ? 'Share application' : primaryLabel} onClick={primaryShare} />}
      secondaryAction={
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => openProductCopilot({ prompt: 'How do I share my affiliate link and track conversions?', contextLabel: navItem?.label ?? 'Affiliate' })}
        >
          <CircleHelp size={15} /> Ask Finely
        </button>
      }
      metrics={metrics}
      metricTitle="Program snapshot"
      metricDescription="Published payout rates, your status, and whether your referral code is live."
    >
      <section className="fc-wlp-section fc-affiliate-trading-floor" data-surface-layout="trading-floor">
        <div className="fc-affiliate-ticker">
          {metrics.map((m) => (
            <button
              key={m.label}
              type="button"
              className="fc-affiliate-ticker-cell text-left"
              onClick={m.onClick}
            >
              <span className="fc-affiliate-ticker-label">{m.label}</span>
              <span className="fc-affiliate-ticker-value">{m.value}</span>
            </button>
          ))}
        </div>
        <div className="fc-affiliate-mosaic" role="tablist" aria-label="Affiliate trading floor">
          {FLOOR_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                type="button"
                role="tab"
                aria-selected={activeTile === tile.id}
                className={`fc-affiliate-mosaic-tile ${finelyOsCatalogCard(tile.accent)}`}
                data-fc-accent={tile.accent}
                data-active={activeTile === tile.id ? 'true' : undefined}
                onClick={() => setActiveTile(tile.id)}
              >
                <span className="fc-affiliate-mosaic-tile-icon" data-fc-accent={tile.accent}>
                  <Icon size={20} />
                </span>
                <span className="fc-affiliate-mosaic-tile-label">{tile.label}</span>
                <span className="fc-affiliate-mosaic-tile-hint">
                  {tile.id === 'operate' && campaignCount ? `${campaignCount} active campaign${campaignCount === 1 ? '' : 's'}` : tile.hint}
                </span>
              </button>
            );
          })}
        </div>
        <div className="fc-affiliate-floor-panel">
          <div className="fc-affiliate-floor-panel-head">
            <h2 className="fc-affiliate-floor-panel-title">{FLOOR_TILE_LABELS[activeTile]}</h2>
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/resources#presenter-demo')}>
              <PlayCircle size={15} /> Watch how
            </button>
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(messagesPath)}>
              <MessageSquare size={15} /> Affiliate line
            </button>
          </div>
          {renderTabBody()}
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
