import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Percent,
  Sparkles,
  Target,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { RE } from '../../config/realEstateProgram';
import { AF } from '../../config/affiliateProgram';
import { ROLE_WORK_SPLIT } from '../../config/rolePartnerPrograms';
import { RealEstatePlaybookPanel } from '../../components/realEstate/RealEstatePlaybookPanel';
import { AffiliateReferralToolkit } from '../../components/affiliate/AffiliateReferralToolkit';
import { AffiliateCommandStrip } from '../../components/affiliate/AffiliateCommandStrip';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { BackToSiteButton } from '../../components/navigation/BackToSiteButton';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { RoleHubToolDeck, type RoleHubTool } from '../../components/hubs/RoleHubToolDeck';
import { findAffiliateByEmail, findAffiliateByPartnerId } from '../../data/affiliateRepo';
import type { Affiliate } from '../../domain/affiliate';
import { resolveRealEstateHubAccess } from '../../lib/roleHubAccess';
import { buildRealEstateHubNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

type HubTab = 'overview' | 'referrals' | 'playbook' | 'training' | 'operate';

const TABS: { id: HubTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'training', label: 'Training' },
  { id: 'operate', label: 'Operate' },
];

const RE_TOOL_DECK: RoleHubTool[] = [
  { id: 'ref', label: 'Referrals', detail: 'Tracked handoff links', path: `${RE.hubPath}?tab=referrals`, icon: Link2, accent: 'emerald', badge: 'Primary' },
  { id: 'restore', label: 'Restore path', detail: 'Partner credit handoff', path: '/pricing/personal-credit-restore', icon: Target, accent: 'amber' },
  { id: 'playbook', label: 'Playbook', detail: 'Underwriting readiness', path: `${RE.hubPath}?tab=playbook`, icon: BookOpen, accent: 'sky' },
  { id: 'aff', label: 'Affiliate hub', detail: 'Campaigns & payouts', path: AF.hubPath, icon: Percent, accent: 'violet' },
  { id: 'guide', label: 'Operator guide', detail: 'RE handbook', path: RE.guideReadPath, icon: GraduationCap, accent: 'sky' },
  { id: 'line', label: 'Messages', detail: 'Affiliate line', path: RE.messagesDeepLink, icon: MessageSquare, accent: 'fuchsia' },
];

export default function RealEstateHubPage() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<HubTab>('overview');
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(() => Boolean(auth.user));

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t as HubTab);
  }, [searchParams]);

  useEffect(() => {
    if (!auth.user) {
      setAffiliate(null);
      setAffiliateLoading(false);
      return;
    }
    let cancelled = false;
    setAffiliateLoading(true);
    void (async () => {
      let a: Affiliate | null = null;
      if (partner?.id) a = await findAffiliateByPartnerId(partner.id);
      if (!a && auth.user?.email) a = await findAffiliateByEmail(auth.user.email);
      if (cancelled) return;
      setAffiliate(a);
      setAffiliateLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.user?.email, partner?.id]);

  const gate = useMemo(
    () => resolveRealEstateHubAccess({ user: auth.user, partner, affiliate }),
    [auth.user, partner, affiliate],
  );

  const split = ROLE_WORK_SPLIT.re;
  const noticedItems = useMemo(
    () => buildRealEstateHubNoticedItems({ hasReferralCode: Boolean(affiliate?.referralCode), tab }),
    [affiliate?.referralCode, tab],
  );
  const nowDoItems = useMemo(
    () => [
      {
        label: affiliate?.referralCode ? 'Share a tracked RE handoff' : 'Confirm affiliate referral code',
        detail: affiliate?.referralCode
          ? 'Send restore or score-readiness links tagged to your affiliate code.'
          : 'Same affiliate role — finish profile so RE referrals track cleanly.',
        to: affiliate?.referralCode ? `${RE.hubPath}?tab=referrals` : AF.hubPath,
      },
      {
        label: 'Open underwriting playbook',
        detail: 'AU / DTI / rescore levers — lender-dependent, educate then hand off.',
        to: `${RE.hubPath}?tab=playbook`,
      },
      {
        label: 'Full affiliate campaigns',
        detail: 'Campaigns and payouts stay on Affiliate Hub — RE is a filtered view.',
        to: AF.hubPath,
      },
    ],
    [affiliate?.referralCode],
  );

  if (!auth.user) {
    return (
      <PageShell badge={RE.programName} title={RE.hubName} subtitle="Tagged affiliate lane for real-estate referrals — not a separate auth role.">
        <div className={`${FINELY_OS_COMPACT_PAGE} flex flex-wrap gap-3`}>
          <button type="button" onClick={() => navigate(RE.signupPath)} className={FINELY_OS_PRIMARY_BTN}>
            RE affiliate signup
          </button>
          <BackToSiteButton />
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  if (affiliateLoading && !gate.allowed) {
    return (
      <PageShell
        badge={RE.programName}
        title={RE.hubName}
        subtitle="Checking real-estate affiliate tag…"
        back={{ to: AF.hubPath, label: 'Affiliate Hub' }}
      >
        <div className={`${FINELY_OS_COMPACT_PAGE} max-w-3xl space-y-3`}>
          <FinelyOsAlertBanner tone="info" message="Loading your affiliate lane — RE hub uses interest=real_estate (no separate auth role)." />
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  if (!gate.allowed) {
    return (
      <PageShell
        badge={RE.programName}
        title={RE.hubName}
        subtitle="Real-estate filtered affiliate view (interest=real_estate)."
        back={{ to: AF.hubPath, label: 'Affiliate Hub' }}
      >
        <div className={`${FINELY_OS_COMPACT_PAGE} max-w-3xl space-y-3`}>
          <FinelyOsAlertBanner tone="warning" message={gate.message} />
          <div className="flex flex-wrap gap-2">
            {gate.cta ? (
              <button type="button" onClick={() => navigate(gate.cta!.path)} className={FINELY_OS_PRIMARY_BTN}>
                {gate.cta.label}
              </button>
            ) : null}
            <button type="button" onClick={() => navigate(RE.publicPath)} className={FINELY_OS_SECONDARY_BTN}>
              RE careers
            </button>
            <button type="button" onClick={() => navigate(RE.guidePath)} className={FINELY_OS_SECONDARY_BTN}>
              Operator guide
            </button>
          </div>
          <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
            Results vary · not legal advice · funding and underwriting subject to lender approval · not income or closing guarantees
          </p>
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge={RE.programName}
      title={RE.hubName}
      subtitle={`Affiliate · interest=${RE.interest}${getUserDisplayName(auth.user) ? ` — ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_COMPACT_PAGE} max-w-5xl`}>
        <FinelyNoticedStrip items={noticedItems} />
        <FinelyNowDoThisStrip
          items={nowDoItems}
          currentIndex={affiliate?.referralCode ? 0 : 0}
          className="!p-4"
        />
        <FinelyUnifiedHubLayout
          eyebrow="Tagged affiliate · Role OS 2.0"
          title={RE.hubName}
          subtitle="Referrals, partner handoff, and underwriting readiness — same affiliate role, RE-filtered tools."
          accent="emerald"
          kpis={[
            { label: 'Lane', value: 'RE', accent: 'emerald' },
            { label: 'Code', value: affiliate?.referralCode ? 'Live' : 'Setup', accent: 'sky' },
            { label: 'Status', value: affiliate?.status ?? '—', accent: 'amber' },
            { label: 'Auth role', value: 'affiliate', accent: 'violet' },
          ]}
          tabs={TABS}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={{ label: 'Share referral', onClick: () => navigate(AF.publicPath) }}
          secondaryAction={{ label: 'Full affiliate hub', onClick: () => navigate(AF.hubPath) }}
        >
          {tab === 'overview' && (
            <div className="space-y-3">
              <AffiliateCommandStrip affiliate={affiliate} loading={affiliateLoading} />
              <FinelyOsRoleCommandCenter
                roleLabel="Real Estate · tagged affiliate"
                headline="What matters now"
                subline="Spot the credit block, hand off with a tracked link, stay on milestones — Finely runs the file."
                tiles={[
                  { id: 'ref', label: 'Referrals', value: affiliate?.referralCode ? 'Ready' : 'Setup', accent: 'emerald', onClick: () => setTab('referrals') },
                  { id: 'restore', label: 'Handoff', value: 'Restore', accent: 'amber', onClick: () => navigate('/pricing/personal-credit-restore') },
                  { id: 'score', label: 'Score path', value: 'CTA', accent: 'sky', onClick: () => navigate('/free-score-roadmap') },
                  { id: 'au', label: 'AU optics', value: 'Educate', accent: 'violet', onClick: () => navigate('/tradelines?focus=au') },
                ]}
                primaryAction={{ label: 'Partner restore path', onClick: () => navigate('/pricing/personal-credit-restore') }}
                secondaryAction={{ label: 'RE operator guide', onClick: () => navigate(RE.guideReadPath) }}
              />
              <RoleHubToolDeck
                tools={RE_TOOL_DECK}
                title="RE affiliate tools"
                subtitle="Tag → hand off → educate — same affiliate role, filtered hub."
              />
              <div className={`${finelyOsCatalogCardCompact('emerald')} !p-4 space-y-2`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>You run / Finely runs</div>
                <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{split.headline}</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { t: 'You do', rows: split.youDo },
                    { t: 'Finely runs', rows: split.finelyRuns },
                    { t: 'Not your job', rows: split.notYourJob },
                  ].map((col) => (
                    <div key={col.t}>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>{col.t}</div>
                      <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                        {col.rows.slice(0, 3).map((r) => (
                          <li key={r}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <RoleWorkflowPanel roleId="real_estate" compact />
            </div>
          )}

          {tab === 'referrals' && (
            <div className="space-y-3">
              <AffiliateReferralToolkit />
              <div className={`${finelyOsCatalogCardCompact('sky')} !p-4 space-y-2`}>
                <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>RE handoff links</div>
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Send buyers/sellers into restore or funding readiness — tracked to your affiliate code when present.
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
            </div>
          )}

          {tab === 'playbook' && <RealEstatePlaybookPanel mode="full" />}

          {tab === 'training' && (
            <div className="space-y-3">
              <UnifiedTrainingPanel audience="affiliate" specialties={['personal_restore']} />
              <button type="button" onClick={() => navigate(RE.guideReadPath)} className={FINELY_OS_SECONDARY_BTN}>
                <BookOpen size={14} /> <GraduationCap size={14} /> Operator handbook
              </button>
            </div>
          )}

          {tab === 'operate' && (
            <div className={`${finelyOsCatalogCardCompact('violet')} !p-4 space-y-3`}>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Same affiliate role — RE hub is a filtered view. Full campaigns and payouts live on Affiliate Hub.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Affiliate hub', path: AF.hubPath, icon: Link2 },
                  { label: 'RE careers', path: RE.publicPath, icon: Home },
                  { label: 'Messages', path: RE.messagesDeepLink, icon: MessageSquare },
                  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                  { label: 'Overview', path: `${RE.hubPath}?tab=overview`, icon: Sparkles },
                ].map(({ label, path, icon: Icon }) => (
                  <button key={label} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>
        <p className={`mt-3 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Results vary · not legal advice · funding and underwriting subject to lender approval · payouts subject to verification · not income or closing guarantees
        </p>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
