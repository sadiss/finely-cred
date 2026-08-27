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
import { useSearchParams } from 'react-router-dom';
import { PartnerWorkstationFrame, type PartnerEmbeddablePageProps } from '../../features/workspaceLightPreview/product/partner/PartnerWorkstationFrame';
import { useMappedPartnerNavigate } from '../../features/workspaceLightPreview/product/partner/usePartnerProductNavigation';
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
import {
  FinelyUnifiedHubLayout,
  PartnerHubLauncherGrid,
  PartnerHubWorkModal,
  usePartnerHubLauncher,
} from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { RoleHubToolDeck, type RoleHubTool } from '../../components/hubs/RoleHubToolDeck';
import { findAffiliateByEmail, findAffiliateByPartnerId } from '../../data/affiliateRepo';
import type { Affiliate } from '../../domain/affiliate';
import { resolveRealEstateHubAccess } from '../../lib/roleHubAccess';
import { buildRealEstateHubNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  REAL_ESTATE_TAB_TO_LAUNCHER,
  buildRealEstateHubLauncherTiles,
  ROLE_HUB_MODAL_ACCENT,
  type RealEstateHubLauncherId,
} from '../../components/partner/roleHubLauncherPresets';
import {
  FINELY_OS_PAGE,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const RE_TOOL_DECK: RoleHubTool[] = [
  { id: 'ref', label: 'Referrals', detail: 'Tracked handoff links', path: `${RE.hubPath}?tab=referrals`, icon: Link2, accent: 'emerald', badge: 'Primary' },
  { id: 'restore', label: 'Restore path', detail: 'Partner credit handoff', path: '/pricing/personal-credit-restore', icon: Target, accent: 'violet' },
  { id: 'playbook', label: 'Playbook', detail: 'Underwriting readiness', path: `${RE.hubPath}?tab=playbook`, icon: BookOpen, accent: 'sky' },
  { id: 'aff', label: 'Affiliate hub', detail: 'Campaigns & payouts', path: AF.hubPath, icon: Percent, accent: 'rose' },
  { id: 'guide', label: 'Operator guide', detail: 'RE handbook', path: RE.guideReadPath, icon: GraduationCap, accent: 'emerald' },
  { id: 'line', label: 'Messages', detail: 'Affiliate line', path: RE.messagesDeepLink, icon: MessageSquare, accent: 'violet' },
];

export default function RealEstateHubPage({ embedded = false }: PartnerEmbeddablePageProps = {}) {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useMappedPartnerNavigate();
  const [searchParams] = useSearchParams();
  const hubLauncher = usePartnerHubLauncher<RealEstateHubLauncherId>();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(() => Boolean(auth.user));

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t in REAL_ESTATE_TAB_TO_LAUNCHER) {
      hubLauncher.open(REAL_ESTATE_TAB_TO_LAUNCHER[t]);
    }
  }, [searchParams, hubLauncher.open]);

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

  const hubLauncherTiles = useMemo(
    () =>
      buildRealEstateHubLauncherTiles({
        hasReferralCode: Boolean(affiliate?.referralCode),
        affiliateStatus: affiliate?.status,
      }),
    [affiliate?.referralCode, affiliate?.status],
  );

  const noticedItems = useMemo(
    () => buildRealEstateHubNoticedItems({ hasReferralCode: Boolean(affiliate?.referralCode), tab: hubLauncher.openId ?? 'overview' }),
    [affiliate?.referralCode, hubLauncher.openId],
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
      <PartnerWorkstationFrame embedded={embedded} kind="real-estate-hub-workstation" badge={RE.programName} title={RE.hubName} subtitle="Tagged affiliate lane for real-estate referrals — not a separate auth role.">
        <div className={`${FINELY_OS_PAGE} flex flex-wrap gap-3`}>
          <button type="button" onClick={() => navigate(RE.signupPath)} className={FINELY_OS_PRIMARY_BTN}>
            RE affiliate signup
          </button>
          <BackToSiteButton />
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  if (affiliateLoading && !gate.allowed) {
    return (
      <PartnerWorkstationFrame embedded={embedded} kind="real-estate-hub-workstation"
        badge={RE.programName}
        title={RE.hubName}
        subtitle="Checking real-estate affiliate tag…"
        back={{ to: AF.hubPath, label: 'Affiliate Hub' }}
      >
        <div className={`${FINELY_OS_PAGE} max-w-3xl space-y-3`}>
          <FinelyOsAlertBanner tone="info" message="Loading your affiliate lane — RE hub uses interest=real_estate (no separate auth role)." />
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  if (!gate.allowed) {
    return (
      <PartnerWorkstationFrame embedded={embedded} kind="real-estate-hub-workstation"
        badge={RE.programName}
        title={RE.hubName}
        subtitle="Real-estate filtered affiliate view (interest=real_estate)."
        back={{ to: AF.hubPath, label: 'Affiliate Hub' }}
      >
        <div className={`${FINELY_OS_PAGE} max-w-3xl space-y-3`}>
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
          {!embedded ? <FinelyOsPageFooter /> : null}
        </div>
      </PartnerWorkstationFrame>
    );
  }

  return (
    <PartnerWorkstationFrame embedded={embedded} kind="real-estate-hub-workstation"
      badge={RE.programName}
      title={RE.hubName}
      subtitle={`Affiliate · interest=${RE.interest}${getUserDisplayName(auth.user) ? ` — ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl`}>
        <FinelyNoticedStrip items={noticedItems} />
        <FinelyNowDoThisStrip
          items={nowDoItems}
          currentIndex={affiliate?.referralCode ? 0 : 0}
          className=""
        />
        <FinelyUnifiedHubLayout
          eyebrow="Tagged affiliate · Role OS 2.0"
          title={RE.hubName}
          subtitle="Referrals, partner handoff, and underwriting readiness — same affiliate role, RE-filtered tools."
          accent="emerald"
          kpis={[
            { label: 'Lane', value: 'RE', accent: 'emerald' },
            { label: 'Code', value: affiliate?.referralCode ? 'Live' : 'Setup', accent: 'sky' },
            { label: 'Status', value: affiliate?.status ?? '—', accent: 'rose' },
            { label: 'Auth role', value: 'affiliate', accent: 'violet' },
          ]}
          primaryAction={{ label: 'Share referral', onClick: () => navigate(AF.publicPath) }}
          secondaryAction={{ label: 'Full affiliate hub', onClick: () => navigate(AF.hubPath) }}
          launcherSlot={<PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />}
        >
          {null}
        </FinelyUnifiedHubLayout>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('overview')}
          onClose={hubLauncher.close}
          title="RE affiliate overview"
          subtitle="Command center, tools, workflow, and you-run / Finely-runs split."
          accent={ROLE_HUB_MODAL_ACCENT.overview}
        >
          <AffiliateCommandStrip affiliate={affiliate} loading={affiliateLoading} />
          <FinelyOsRoleCommandCenter
            roleLabel="Real Estate · tagged affiliate"
            headline="What matters now"
            subline="Spot the credit block, hand off with a tracked link, stay on milestones — Finely runs the file."
            tiles={[
              { id: 'ref', label: 'Referrals', value: affiliate?.referralCode ? 'Ready' : 'Setup', accent: 'emerald', onClick: () => hubLauncher.open('referrals') },
              { id: 'restore', label: 'Handoff', value: 'Restore', accent: 'rose', onClick: () => navigate('/pricing/personal-credit-restore') },
              { id: 'score', label: 'Score path', value: 'CTA', accent: 'sky', onClick: () => navigate('/free-score-roadmap') },
              { id: 'au', label: 'AU optics', value: 'Educate', accent: 'violet', onClick: () => navigate('/tradelines?focus=au') },
            ]}
            primaryAction={{ label: 'Partner restore path', onClick: () => navigate('/pricing/personal-credit-restore') }}
            secondaryAction={{ label: 'RE operator guide', onClick: () => navigate(RE.guideReadPath) }}
          />
          <RoleHubToolDeck tools={RE_TOOL_DECK} title="RE affiliate tools" subtitle="Tag → hand off → educate — same affiliate role, filtered hub." />
          <div className={`${finelyOsCatalogCard('emerald')} space-y-3`} data-fc-accent="emerald">
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
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('referrals')}
          onClose={hubLauncher.close}
          title="Referrals"
          subtitle="Tracked handoff links for restore and score readiness."
          accent={ROLE_HUB_MODAL_ACCENT.referrals}
        >
          <div className="space-y-3">
            <AffiliateReferralToolkit />
            <div className={`${finelyOsCatalogCard('sky')} space-y-3`} data-fc-accent="sky">
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
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('playbook')}
          onClose={hubLauncher.close}
          title="Underwriting playbook"
          subtitle="AU / DTI / rescore levers for RE partners."
          accent={ROLE_HUB_MODAL_ACCENT.playbook}
        >
          <RealEstatePlaybookPanel mode="full" />
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('training')}
          onClose={hubLauncher.close}
          title="RE training"
          subtitle="Operator handbook and affiliate academy tracks."
          accent={ROLE_HUB_MODAL_ACCENT.training}
        >
          <UnifiedTrainingPanel audience="affiliate" specialties={['personal_restore']} />
          <button type="button" onClick={() => navigate(RE.guideReadPath)} className={FINELY_OS_SECONDARY_BTN}>
            <BookOpen size={14} /> <GraduationCap size={14} /> Operator handbook
          </button>
        </PartnerHubWorkModal>

        <PartnerHubWorkModal
          open={hubLauncher.isOpen('operate')}
          onClose={hubLauncher.close}
          title="Operate"
          subtitle="Full affiliate hub, messages, and day-to-day RE links."
          accent={ROLE_HUB_MODAL_ACCENT.operate}
        >
          <div className={`${finelyOsCatalogCard('violet')} space-y-4`} data-fc-accent="violet">
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
        </PartnerHubWorkModal>

        <p className={`mt-3 ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Results vary · not legal advice · funding and underwriting subject to lender approval · payouts subject to verification · not income or closing guarantees
        </p>
        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </PartnerWorkstationFrame>
  );
}
