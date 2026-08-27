import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Home,
  Link2,
  Percent,
  Sparkles,
  Target,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { AffiliateReferralToolkit } from '../../../../components/affiliate/AffiliateReferralToolkit';
import { AffiliateCommandStrip } from '../../../../components/affiliate/AffiliateCommandStrip';
import { RealEstatePlaybookPanel } from '../../../../components/realEstate/RealEstatePlaybookPanel';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../../../components/training/UnifiedTrainingPanel';
import { AF } from '../../../../config/affiliateProgram';
import { RE } from '../../../../config/realEstateProgram';
import { ROLE_WORK_SPLIT } from '../../../../config/rolePartnerPrograms';
import { REAL_ESTATE_TAB_TO_LAUNCHER } from '../../../../components/partner/roleHubLauncherPresets';
import { findAffiliateByEmail, findAffiliateByPartnerId } from '../../../../data/affiliateRepo';
import type { Affiliate } from '../../../../domain/affiliate';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import { resolveRealEstateHubAccess } from '../../../../lib/roleHubAccess';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerRealEstateHubSurface.css';

type ReRunwayStage = 'referrals' | 'playbook' | 'training';

const RUNWAY_MILESTONES: Array<{ id: ReRunwayStage; label: string; hint: string; dot: string }> = [
  { id: 'referrals', label: 'Referrals', hint: 'Tracked handoff links', dot: '1' },
  { id: 'playbook', label: 'Playbook', hint: 'Underwriting readiness', dot: '2' },
  { id: 'training', label: 'Training', hint: 'Operator handbook', dot: '3' },
];

const TAB_QUERY_MAP: Record<string, ReRunwayStage> = {
  referrals: 'referrals',
  playbook: 'playbook',
  training: 'training',
  workflow: 'training',
  overview: 'referrals',
};

function YouRunFinelyRunsSplit() {
  const split = ROLE_WORK_SPLIT.re;
  const accents = ['emerald', 'violet', 'sky'] as const;
  return (
    <div className={`${finelyOsCatalogCard('emerald')} space-y-4 p-6 lg:p-8`} data-fc-accent="emerald">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>You run / Finely runs</div>
      <p className={`text-base font-bold ${FINELY_OS_ENTITY_VALUE}`}>{split.headline}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'You do', rows: split.youDo },
          { title: 'Finely runs', rows: split.finelyRuns },
          { title: 'Not your job', rows: split.notYourJob },
        ].map((col, index) => (
          <div
            key={col.title}
            className={`${finelyOsCatalogCard(accents[index])} space-y-2 p-5`}
            data-fc-accent={accents[index]}
          >
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>{col.title}</div>
            <ul className={`space-y-1.5 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              {col.rows.slice(0, 3).map((row) => (
                <li key={row}>• {row}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReHandoffLinksCard({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className={`${finelyOsCatalogCard('sky')} space-y-4 p-6 lg:p-8`} data-fc-accent="sky">
      <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>RE handoff links</div>
      <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
        Send buyers and sellers into restore or funding readiness — tracked to your affiliate code when present.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate('/pricing/personal-credit-restore')} className={FINELY_OS_PRIMARY_BTN}>
          <Target size={14} /> Restore path
        </button>
        <button type="button" onClick={() => navigate('/free-score-roadmap')} className={FINELY_OS_SECONDARY_BTN}>
          Score roadmap
        </button>
        <button type="button" onClick={() => navigate('/tradelines?focus=au')} className={FINELY_OS_SECONDARY_BTN}>
          AU education
        </button>
        <button type="button" onClick={() => navigate(`${AF.hubPath}?tab=calculator`)} className={FINELY_OS_SECONDARY_BTN}>
          <Percent size={14} /> Payout calc
        </button>
      </div>
    </div>
  );
}

export default function PartnerRealEstateHubProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useMappedPartnerNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const [searchParams, setSearchParams] = useSearchParams();

  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Home;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(() => !isDemo && Boolean(auth.user));
  const [activeStage, setActiveStage] = useState<ReRunwayStage>('referrals');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab in TAB_QUERY_MAP) {
      setActiveStage(TAB_QUERY_MAP[tab]);
      return;
    }
    if (tab && tab in REAL_ESTATE_TAB_TO_LAUNCHER) {
      const mapped = REAL_ESTATE_TAB_TO_LAUNCHER[tab];
      if (mapped === 'playbook') setActiveStage('playbook');
      else if (mapped === 'training') setActiveStage('training');
      else if (mapped === 'referrals') setActiveStage('referrals');
    }
  }, [searchParams]);

  const selectStage = (stage: ReRunwayStage) => {
    setActiveStage(stage);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', stage);
      return next;
    });
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
    let cancelled = false;
    setAffiliateLoading(true);
    void (async () => {
      let loaded: Affiliate | null = null;
      if (partner?.id) loaded = await findAffiliateByPartnerId(partner.id);
      if (!loaded && auth.user?.email) loaded = await findAffiliateByEmail(auth.user.email);
      if (cancelled) return;
      setAffiliate(loaded);
      setAffiliateLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.user?.email, isDemo, partner?.id]);

  const gate = useMemo(
    () => resolveRealEstateHubAccess({ user: auth.user, partner, affiliate }),
    [affiliate, auth.user, partner],
  );

  const hasReferralCode = Boolean(affiliate?.referralCode);
  const affiliateHubPath = mapPortalHref(AF.hubPath);
  const guideReadPath = mapPortalHref(RE.guideReadPath);
  const signupPath = mapPortalHref(RE.signupPath);

  const demoMetrics: ProductMetric[] = [
    { label: 'Referral code', value: 'Setup', hint: 'Sign in to confirm your code', accent: 'emerald', icon: Link2 },
    { label: 'Affiliate status', value: '—', hint: 'RE-tagged lane', accent: 'violet', icon: Percent },
    { label: 'Lane', value: 'RE', hint: 'interest=real_estate', accent: 'sky', icon: Home },
    { label: 'Handoffs', value: '3', hint: 'Restore, score, AU education', accent: 'rose', icon: Target },
  ];

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="real-estate-hub"
        eyebrow="Real estate"
        title="Real estate"
        description="RE-tagged affiliate hub — tracked referrals, underwriting playbook, and partner handoffs."
        status="Demo workspace · sample metrics"
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="grid"
        primaryAction={<ProductPagePrimaryAction label="Open playbook" onClick={() => selectStage('playbook')} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(signupPath)}>
            RE affiliate signup
          </button>
        }
        metrics={demoMetrics}
        metricTitle="Affiliate lane"
        metricDescription="Referral tracking and RE handoff tools for tagged affiliates."
      >
        <section className="fc-wlp-section fc-re-runway" data-surface-layout="journey-runway">
          <div className="fc-re-runway-track" role="tablist" aria-label="RE journey runway">
            {RUNWAY_MILESTONES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={activeStage === m.id}
                className="fc-re-runway-milestone"
                data-active={activeStage === m.id ? 'true' : undefined}
                onClick={() => selectStage(m.id)}
              >
                <span className="fc-re-runway-milestone-dot">{m.dot}</span>
                <span className="fc-re-runway-milestone-label">{m.label}</span>
                <span className="fc-re-runway-milestone-hint">{m.hint}</span>
              </button>
            ))}
          </div>
          <ProductEmptyState
            title="Sign in for live referrals"
            description="Demo mode shows the hub layout — sign in to copy tracked links and open your playbook."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            }
          />
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding and underwriting subject to lender approval · not income or closing guarantees
        </p>
      </ProductHubScaffold>
    );
  }

  if (affiliateLoading && !gate.allowed) {
    return <ProductDashboardSkeleton label="Loading your RE affiliate lane" />;
  }

  if (!gate.allowed) {
    const blockedMetrics: ProductMetric[] = [
      {
        label: 'Referral code',
        value: hasReferralCode ? 'Live' : 'Setup',
        hint: hasReferralCode ? affiliate?.referralCode ?? 'Live' : 'Finish affiliate profile',
        accent: 'emerald',
        icon: Link2,
      },
      {
        label: 'Affiliate status',
        value: affiliate?.status ?? '—',
        hint: 'RE interest tag required',
        accent: 'violet',
        icon: Percent,
      },
      { label: 'Lane', value: 'RE', hint: RE.interest, accent: 'sky', icon: Home },
      {
        label: 'Next step',
        value: gate.cta ? 'Open' : '—',
        hint: gate.cta?.label ?? 'RE affiliate signup',
        accent: 'rose',
        icon: Target,
        onClick: gate.cta ? () => navigate(gate.cta!.path) : undefined,
      },
    ];

    return (
      <ProductHubScaffold
        role={role}
        pageId="real-estate-hub"
        eyebrow="Real estate"
        title="Real estate"
        description="RE-tagged affiliate hub — tracked referrals, underwriting playbook, and partner handoffs."
        status={gate.message}
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="grid"
        primaryAction={
          gate.cta ? (
            <ProductPagePrimaryAction label={gate.cta.label} onClick={() => navigate(gate.cta!.path)} />
          ) : (
            <ProductPagePrimaryAction label="RE affiliate signup" onClick={() => navigate(signupPath)} />
          )
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref(RE.publicPath))}>
            RE careers
          </button>
        }
        metrics={blockedMetrics}
        metricTitle="Affiliate lane"
        metricDescription="This hub is for real-estate tagged affiliates — same affiliate role, RE-filtered tools."
      >
        <section className="fc-wlp-section fc-re-runway" data-surface-layout="journey-runway">
          <div className="fc-re-runway-track" role="tablist" aria-label="RE journey runway">
            {RUNWAY_MILESTONES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={activeStage === m.id}
                className="fc-re-runway-milestone"
                data-active={activeStage === m.id ? 'true' : undefined}
                onClick={() => selectStage(m.id)}
              >
                <span className="fc-re-runway-milestone-dot">{m.dot}</span>
                <span className="fc-re-runway-milestone-label">{m.label}</span>
                <span className="fc-re-runway-milestone-hint">{m.hint}</span>
              </button>
            ))}
          </div>
          <ProductEmptyState
            title={gate.reason === 'unauthenticated' ? 'Sign in to open the RE hub' : 'RE interest tag required'}
            description={gate.message}
            action={
              gate.cta ? (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(gate.cta!.path)}>
                  {gate.cta.label}
                </button>
              ) : (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(signupPath)}>
                  RE affiliate signup
                </button>
              )
            }
          />
        </section>
        <p className={`fc-wlp-section-description fc-wlp-compliance-line ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Results vary · not legal advice · funding and underwriting subject to lender approval · not income or closing guarantees
        </p>
      </ProductHubScaffold>
    );
  }

  const metrics: ProductMetric[] = [
    {
      label: 'Referral code',
      value: hasReferralCode ? 'Live' : 'Setup',
      hint: hasReferralCode ? affiliate?.referralCode ?? 'Live' : 'Finish affiliate profile',
      accent: 'emerald',
      icon: Link2,
      onClick: () => selectStage('referrals'),
    },
    {
      label: 'Affiliate status',
      value: affiliate?.status ?? '—',
      hint: 'RE-tagged affiliate lane',
      accent: 'violet',
      icon: Percent,
      onClick: () => navigate(affiliateHubPath),
    },
    { label: 'Lane', value: 'RE', hint: `interest=${RE.interest}`, accent: 'sky', icon: Home },
    {
      label: 'Handoffs',
      value: hasReferralCode ? 'Ready' : 'Setup',
      hint: 'Restore, score, AU education',
      accent: 'rose',
      icon: Target,
      onClick: () => selectStage('referrals'),
    },
  ];

  const statusHeadline = hasReferralCode
    ? 'Referral code live — share tracked handoffs'
    : 'Confirm affiliate profile for tracked referrals';

  const primaryLabel = hasReferralCode ? 'Share referral' : 'Open playbook';
  const primaryAction = hasReferralCode
    ? () => selectStage('referrals')
    : () => selectStage('playbook');

  const renderRunwayStage = () => (
    <>
      {activeStage === 'referrals' ? (
        <>
          <AffiliateCommandStrip affiliate={affiliate} loading={affiliateLoading} />
          <AffiliateReferralToolkit />
          <ReHandoffLinksCard navigate={navigate} />
        </>
      ) : null}

      {activeStage === 'playbook' ? (
        <RealEstatePlaybookPanel mode="full" />
      ) : null}

      {activeStage === 'training' ? (
        <>
          <YouRunFinelyRunsSplit />
          <UnifiedTrainingPanel audience="affiliate" specialties={['personal_restore']} />
          <RoleWorkflowPanel roleId="real_estate" compact />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(guideReadPath)} className={FINELY_OS_PRIMARY_BTN}>
              <BookOpen size={14} /> Read the handbook
            </button>
            <button type="button" onClick={() => navigate(affiliateHubPath)} className={FINELY_OS_SECONDARY_BTN}>
              <Sparkles size={14} /> Affiliate hub
            </button>
          </div>
        </>
      ) : null}
    </>
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId="real-estate-hub"
      eyebrow="Real estate"
      title="Real estate"
      description="RE-tagged affiliate hub — tracked referrals, underwriting playbook, and partner handoffs."
      status={`${statusHeadline} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant="grid"
      primaryAction={<ProductPagePrimaryAction label={primaryLabel} onClick={primaryAction} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(affiliateHubPath)}>
          Full affiliate hub
        </button>
      }
      metrics={metrics}
      metricTitle="Affiliate lane"
      metricDescription="Referral tracking, status, and RE handoff readiness at a glance."
    >
      <section className="fc-wlp-section fc-re-runway" data-surface-layout="journey-runway">
        <div className="fc-re-runway-track" role="tablist" aria-label="RE journey runway">
          {RUNWAY_MILESTONES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={activeStage === m.id}
              className="fc-re-runway-milestone"
              data-active={activeStage === m.id ? 'true' : undefined}
              onClick={() => selectStage(m.id)}
            >
              <span className="fc-re-runway-milestone-dot">{m.dot}</span>
              <span className="fc-re-runway-milestone-label">{m.label}</span>
              <span className="fc-re-runway-milestone-hint">{m.hint}</span>
            </button>
          ))}
        </div>
        <div className="fc-re-runway-stage">{renderRunwayStage()}</div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding and underwriting subject to lender approval · payouts subject to verification · not income or closing guarantees
      </p>
    </ProductHubScaffold>
  );
}
