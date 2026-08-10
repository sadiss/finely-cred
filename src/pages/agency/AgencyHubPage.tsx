import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { AGENCY } from '../../config/agencyPartnersProgram';
import { ROLE_WORK_SPLIT } from '../../config/rolePartnerPrograms';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { BackToSiteButton } from '../../components/navigation/BackToSiteButton';
import { PayoutCenterPanel } from '../../components/payouts/PayoutCenterPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { RoleHubToolDeck, type RoleHubTool } from '../../components/hubs/RoleHubToolDeck';
import { getTenant, listMemberships } from '../../data/tenantsRepo';
import { resolveAgencyHubAccess } from '../../lib/roleHubAccess';
import { buildAgencyHubNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

type HubTab = 'overview' | 'partners' | 'letters' | 'team' | 'payouts' | 'training';

const TABS: { id: HubTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'partners', label: 'Partners' },
  { id: 'letters', label: 'Letters' },
  { id: 'team', label: 'Team' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'training', label: 'Training' },
];

const AGENCY_TOOL_DECK: RoleHubTool[] = [
  { id: 'partners', label: 'Partners', detail: 'Route partner files', path: '/admin/partners', icon: Users, accent: 'amber', badge: 'Primary' },
  { id: 'letters', label: 'Letters', detail: 'Studio + vault', path: '/portal/letters', icon: FileText, accent: 'violet' },
  { id: 'team', label: 'Team seats', detail: 'Invite operators', path: '/admin/team', icon: Building2, accent: 'sky' },
  { id: 'payouts', label: 'Payouts', detail: 'Keep % center', path: `${AGENCY.hubPath}?tab=payouts`, icon: Wallet, accent: 'emerald' },
  { id: 'training', label: 'Training', detail: 'Agency launch', path: `${AGENCY.hubPath}?tab=training`, icon: GraduationCap, accent: 'sky' },
  { id: 'line', label: 'Agency line', detail: 'Message Finely', path: AGENCY.messagesDeepLink, icon: MessageSquare, accent: 'fuchsia' },
];

export default function AgencyHubPage() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<HubTab>('overview');
  const gate = useMemo(() => resolveAgencyHubAccess(auth.user), [auth.user]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.id === t)) setTab(t as HubTab);
  }, [searchParams]);

  const tenant = useMemo(() => {
    const mid = gate.membership?.tenantId;
    return mid ? getTenant(mid) : null;
  }, [gate.membership?.tenantId]);

  const seatCount = useMemo(() => {
    if (!gate.membership?.tenantId) return 0;
    return listMemberships(gate.membership.tenantId).filter((m) => m.status === 'active' || m.status === 'invited')
      .length;
  }, [gate.membership?.tenantId]);

  const split = ROLE_WORK_SPLIT.agency;
  const tenantLive = tenant?.status === 'active';
  const noticedItems = useMemo(
    () => buildAgencyHubNoticedItems({ seatCount, tenantLive: Boolean(tenantLive), tab }),
    [seatCount, tenantLive, tab],
  );
  const nowDoItems = useMemo(
    () => [
      {
        label: 'Open partner files',
        detail: 'Route restore, debt, and build lanes inside your agency tenant.',
        to: '/admin/partners',
      },
      {
        label: seatCount <= 1 ? 'Invite a team seat' : 'Review team seats',
        detail: 'Operators share Finely OS tools under your white-label workspace.',
        to: '/admin/team',
      },
      {
        label: 'Check payouts',
        detail: 'Confirm keep % and payout status for partner volume.',
        to: `${AGENCY.hubPath}?tab=payouts`,
      },
    ],
    [seatCount],
  );

  if (!auth.user) {
    return (
      <PageShell badge={AGENCY.programName} title={AGENCY.hubName} subtitle="Sign in to run your white-label agency workspace.">
        <div className={`${FINELY_OS_COMPACT_PAGE} flex flex-wrap gap-3`}>
          <button type="button" onClick={() => navigate(gate.cta?.path || AGENCY.signupPath)} className={FINELY_OS_PRIMARY_BTN}>
            Sign in
          </button>
          <BackToSiteButton />
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  if (!gate.allowed) {
    return (
      <PageShell
        badge={AGENCY.programName}
        title={AGENCY.hubName}
        subtitle="Partners, letters, team, payouts, and white-label — after your agency tenant is live."
        back={{ to: '/dashboard', label: 'Dashboard' }}
      >
        <div className={`${FINELY_OS_COMPACT_PAGE} max-w-3xl space-y-3`}>
          <FinelyOsAlertBanner tone="warning" message={gate.message} />
          <div className="flex flex-wrap gap-2">
            {gate.cta ? (
              <button type="button" onClick={() => navigate(gate.cta!.path)} className={FINELY_OS_PRIMARY_BTN}>
                {gate.cta.label}
              </button>
            ) : null}
            <button type="button" onClick={() => navigate(AGENCY.publicPath)} className={FINELY_OS_SECONDARY_BTN}>
              Agency careers
            </button>
          </div>
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge={AGENCY.programName}
      title={AGENCY.hubName}
      subtitle={`${tenant?.name || 'Agency workspace'}${getUserDisplayName(auth.user) ? ` — ${getUserDisplayName(auth.user)}` : ''}`}
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_COMPACT_PAGE} max-w-5xl`}>
        <FinelyNoticedStrip items={noticedItems} />
        <FinelyNowDoThisStrip
          items={nowDoItems}
          currentIndex={!tenantLive ? 0 : seatCount <= 1 ? 1 : 0}
          className="!p-4"
        />
        <FinelyUnifiedHubLayout
          eyebrow={AGENCY.programName}
          title={AGENCY.hubName}
          subtitle="Your brand out front. Finely OS behind it — partners, letters, team, payouts, white-label."
          accent="amber"
          kpis={[
            { label: 'Tenant', value: tenant?.status === 'active' ? 'Live' : 'Setup', accent: 'amber' },
            { label: 'Seats', value: String(seatCount || 1), accent: 'violet' },
            { label: 'Role', value: gate.membership?.role === 'tenant_owner' ? 'Owner' : 'Staff', accent: 'sky' },
            { label: 'WL', value: tenant?.settings?.features?.whiteLabel ? 'On' : 'Finely', accent: 'emerald' },
          ]}
          tabs={TABS}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={{ label: 'Partner files', onClick: () => navigate('/admin/partners') }}
          secondaryAction={{ label: 'Agency line', onClick: () => navigate(AGENCY.messagesDeepLink) }}
        >
          {tab === 'overview' && (
            <div className="space-y-3">
              <FinelyOsRoleCommandCenter
                roleLabel="Agency · Role OS 2.0"
                headline="What matters now"
                subline="Route partners, run letters, manage seats — one obvious next step."
                tiles={[
                  { id: 'partners', label: 'Partners', value: 'Files', accent: 'amber', onClick: () => navigate('/admin/partners') },
                  { id: 'letters', label: 'Letters', value: 'Studio', accent: 'violet', onClick: () => navigate('/portal/letters') },
                  { id: 'team', label: 'Team', value: String(seatCount || 1), accent: 'sky', onClick: () => setTab('team') },
                  { id: 'payouts', label: 'Payouts', value: 'Open', accent: 'emerald', onClick: () => setTab('payouts') },
                ]}
                primaryAction={{ label: 'Open partners', onClick: () => navigate('/admin/partners') }}
                secondaryAction={{ label: 'White-label settings', onClick: () => navigate('/admin/access') }}
              />
              <RoleHubToolDeck
                tools={AGENCY_TOOL_DECK}
                title="Agency tools"
                subtitle="Partners → letters → seats → payouts."
              />
              <div className={`${finelyOsCatalogCardCompact('amber')} !p-4 space-y-2`}>
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
              <RoleWorkflowPanel roleId="agency" compact />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Partners', path: '/admin/partners', icon: Users },
                  { label: 'Letter studio', path: '/portal/letters', icon: FileText },
                  { label: 'Team & roles', path: '/admin/team', icon: Building2 },
                  { label: 'Messages', path: AGENCY.messagesDeepLink, icon: MessageSquare },
                  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                ].map(({ label, path, icon: Icon }) => (
                  <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'partners' && (
            <div className={`${finelyOsCatalogCardCompact('sky')} !p-4 space-y-3`}>
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Partner files</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Manage partners inside your agency tenant — restore, debt, and build lanes share Finely OS tools.
              </p>
              <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_PRIMARY_BTN}>
                Open partner management
              </button>
            </div>
          )}

          {tab === 'letters' && (
            <div className={`${finelyOsCatalogCardCompact('violet')} !p-4 space-y-3`}>
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Letters & disputes</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Letter studio, template library, and evidence vault for partner files.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate('/portal/letters')} className={FINELY_OS_PRIMARY_BTN}>
                  Letter studio
                </button>
                <button type="button" onClick={() => navigate('/portal/templates')} className={FINELY_OS_SECONDARY_BTN}>
                  Templates
                </button>
                <button type="button" onClick={() => navigate('/portal/disputes')} className={FINELY_OS_SECONDARY_BTN}>
                  Disputes
                </button>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className={`${finelyOsCatalogCardCompact('emerald')} !p-4 space-y-3`}>
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Team & seats</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Active / invited seats: {seatCount}. Invite operators and assign partner scope from Team & Roles.
              </p>
              <button type="button" onClick={() => navigate('/admin/team')} className={FINELY_OS_PRIMARY_BTN}>
                <Users size={14} /> Manage team
              </button>
            </div>
          )}

          {tab === 'payouts' && partner ? (
            <PayoutCenterPanel role="agent" ownerId={partner.id} ownerEmail={partner.profile.email} />
          ) : tab === 'payouts' ? (
            <div className={`${finelyOsCatalogCardCompact('amber')} !p-4`}>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Complete onboarding to link payouts to your partner profile.</p>
            </div>
          ) : null}

          {tab === 'training' && (
            <div className="space-y-3">
              <UnifiedTrainingPanel audience="credit_specialist" specialties={['personal_restore']} />
              <div className="flex items-center gap-2 text-xs text-white/50">
                <GraduationCap size={14} /> <Sparkles size={14} /> <Wallet size={14} /> Agency launch + ops tracks
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
