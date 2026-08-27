import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CircleHelp,
  FileText,
  GraduationCap,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { getUserDisplayName } from '../../../../auth/userProfile';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { AGENCY } from '../../../../config/agencyPartnersProgram';
import { ROLE_WORK_SPLIT } from '../../../../config/rolePartnerPrograms';
import { PayoutCenterPanel } from '../../../../components/payouts/PayoutCenterPanel';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../../../components/training/UnifiedTrainingPanel';
import { AGENCY_TAB_TO_LAUNCHER } from '../../../../components/partner/roleHubLauncherPresets';
import { getTenant, listMemberships } from '../../../../data/tenantsRepo';
import { resolveAgencyHubAccess } from '../../../../lib/roleHubAccess';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerAgencyHubSurface.css';

type AgencyDeckTile = 'partners' | 'letters' | 'team' | 'payouts' | 'training';

const COMMAND_TILES: Array<{
  id: AgencyDeckTile;
  label: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: LucideIcon;
}> = [
  { id: 'partners', label: 'Partner files', accent: 'emerald', icon: Users },
  { id: 'letters', label: 'Letters', accent: 'violet', icon: FileText },
  { id: 'team', label: 'Team seats', accent: 'sky', icon: Building2 },
  { id: 'payouts', label: 'Payouts', accent: 'rose', icon: Wallet },
  { id: 'training', label: 'Training', accent: 'violet', icon: GraduationCap },
];

const TAB_QUERY_MAP: Record<string, AgencyDeckTile> = {
  overview: 'partners',
  partners: 'partners',
  letters: 'letters',
  team: 'team',
  payouts: 'payouts',
  training: 'training',
};

function AgencyYouRunFinelyRunsSplit() {
  const split = ROLE_WORK_SPLIT.agency;
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

export default function PartnerAgencyHubProductSurface({
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
  const PageIcon = navItem?.icon ?? Building2;
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [activeTile, setActiveTile] = useState<AgencyDeckTile>('partners');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab in TAB_QUERY_MAP) {
      setActiveTile(TAB_QUERY_MAP[tab]);
      return;
    }
    if (tab && tab in AGENCY_TAB_TO_LAUNCHER) {
      const mapped = AGENCY_TAB_TO_LAUNCHER[tab];
      if (mapped in TAB_QUERY_MAP) setActiveTile(TAB_QUERY_MAP[mapped]);
      else if (mapped === 'overview') setActiveTile('partners');
    }
  }, [searchParams]);

  const selectTile = (tile: AgencyDeckTile) => {
    setActiveTile(tile);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tile);
      return next;
    });
  };

  const gate = useMemo(() => resolveAgencyHubAccess(auth.user), [auth.user]);

  const tenant = useMemo(() => {
    const mid = gate.membership?.tenantId;
    return mid ? getTenant(mid) : null;
  }, [gate.membership?.tenantId]);

  const seatCount = useMemo(() => {
    if (!gate.membership?.tenantId) return 0;
    return listMemberships(gate.membership.tenantId).filter((m) => m.status === 'active' || m.status === 'invited')
      .length;
  }, [gate.membership?.tenantId]);

  const tenantLive = tenant?.status === 'active';
  const roleLabel = gate.membership?.role === 'tenant_owner' ? 'Owner' : 'Staff';
  const whiteLabelOn = Boolean(tenant?.settings?.features?.whiteLabel);
  const partnersPath = mapPortalHref('/admin/partners');
  const teamPath = mapPortalHref('/admin/team');
  const messagesPath = mapPortalHref(AGENCY.messagesDeepLink);
  const signupPath = mapPortalHref(AGENCY.signupPath);
  const publicPath = mapPortalHref(AGENCY.publicPath);

  const demoMetrics: ProductMetric[] = [
    { label: 'Tenant', value: 'Setup', hint: 'Sign in to confirm tenant status', accent: 'emerald', icon: Building2 },
    { label: 'Seats', value: '2', hint: 'Team capacity in your workspace', accent: 'violet', icon: Users },
    { label: 'Role', value: 'Owner', hint: 'Tenant owner or staff seat', accent: 'sky', icon: Users },
    { label: 'White-label', value: 'Off', hint: 'Branding depth for your portal', accent: 'rose', icon: Building2 },
  ];

  const askFinelyPrompt = 'What should I set up first in my agency tenant?';

  const renderDeckPanel = () => (
    <>
      {activeTile === 'partners' ? (
        <>
          <div className={`${finelyOsCatalogCard('emerald')} space-y-4 p-6 lg:p-8`} data-fc-accent="emerald">
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Partner files</div>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Manage partners inside your agency tenant — restore, debt, and build lanes share Finely OS tools.
            </p>
            <button type="button" onClick={() => navigate(partnersPath)} className={FINELY_OS_PRIMARY_BTN}>
              <Users size={14} /> Open partner management
            </button>
          </div>
          <AgencyYouRunFinelyRunsSplit />
        </>
      ) : null}

      {activeTile === 'letters' ? (
        <div className={`${finelyOsCatalogCard('violet')} space-y-4 p-6 lg:p-8`} data-fc-accent="violet">
          <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Letters & disputes</div>
          <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
            Letter studio, template library, and evidence vault for partner files.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/letters'))} className={FINELY_OS_PRIMARY_BTN}>
              <FileText size={14} /> Letter studio
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/templates'))} className={FINELY_OS_SECONDARY_BTN}>
              Templates
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/disputes'))} className={FINELY_OS_SECONDARY_BTN}>
              Disputes
            </button>
          </div>
        </div>
      ) : null}

      {activeTile === 'team' ? (
        <div className={`${finelyOsCatalogCard('sky')} space-y-4 p-6 lg:p-8`} data-fc-accent="sky">
          <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Team & seats</div>
          <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
            Active and invited seats: {seatCount || 1}. Invite operators and assign partner scope from Team & Roles.
          </p>
          <button type="button" onClick={() => navigate(teamPath)} className={FINELY_OS_PRIMARY_BTN}>
            <Users size={14} /> Manage team
          </button>
        </div>
      ) : null}

      {activeTile === 'payouts' ? (
        partner ? (
          <PayoutCenterPanel role="agent" ownerId={partner.id} ownerEmail={partner.profile.email} />
        ) : (
          <div className={`${finelyOsCatalogCard('rose')} space-y-3 p-6 lg:p-8`} data-fc-accent="rose">
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Complete onboarding to link payouts to your partner profile.
            </p>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/account'))} className={FINELY_OS_PRIMARY_BTN}>
              <Wallet size={14} /> Finish profile setup
            </button>
          </div>
        )
      ) : null}

      {activeTile === 'training' ? (
        <>
          <UnifiedTrainingPanel audience="credit_specialist" specialties={['personal_restore']} />
          <RoleWorkflowPanel roleId="agency" compact />
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <GraduationCap size={14} /> Agency launch + ops tracks
          </div>
        </>
      ) : null}
    </>
  );

  const commandDeck = (
    <div className="fc-agency-command-deck" data-surface-layout="command-deck">
      <header className="fc-agency-hero">
        <div>
          <div className="fc-agency-hero-tenant">{tenant?.name || 'Agency workspace'}</div>
          <p className="fc-agency-hero-sub">
            {whiteLabelOn ? 'White-label live' : 'Finely-branded while you launch'} · {roleLabel} seat
            {getUserDisplayName(auth.user) ? ` · ${getUserDisplayName(auth.user)}` : ''}
          </p>
        </div>
        <div className="fc-agency-hero-signals">
          <div className="fc-agency-signal-chip">
            <span>Tenant</span>
            <strong>{tenantLive ? 'Live' : 'Setup'}</strong>
          </div>
          <div className="fc-agency-signal-chip">
            <span>Seats</span>
            <strong>{seatCount || 1}</strong>
          </div>
          <div className="fc-agency-signal-chip">
            <span>White-label</span>
            <strong>{whiteLabelOn ? 'On' : 'Off'}</strong>
          </div>
        </div>
      </header>
      <div className="fc-agency-command-grid" role="tablist" aria-label="Agency command deck">
        {COMMAND_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              type="button"
              role="tab"
              aria-selected={activeTile === tile.id}
              className={`fc-agency-command-tile ${finelyOsCatalogCard(tile.accent)}`}
              data-fc-accent={tile.accent}
              data-active={activeTile === tile.id ? 'true' : undefined}
              onClick={() => selectTile(tile.id)}
            >
              <span className="fc-agency-command-tile-icon" data-fc-accent={tile.accent}>
                <Icon size={18} />
              </span>
              {tile.label}
            </button>
          );
        })}
      </div>
      <div className="fc-agency-deck-panel">{renderDeckPanel()}</div>
      <button
        type="button"
        className="fc-wlp-btn-secondary"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Agency' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
    </div>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="agency-hub"
        eyebrow="Agency"
        title="Agency"
        description="Your brand out front — partners, letters, team seats, payouts, and white-label on Finely OS."
        status="Demo workspace · sample tenant metrics"
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="grid"
        primaryAction={<ProductPagePrimaryAction label="Partner files" onClick={() => navigate(partnersPath)} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => selectTile('team')}>
            Team seats
          </button>
        }
        metrics={demoMetrics}
        metricTitle="Tenant snapshot"
        metricDescription="Live, seats, role, and white-label depth for your agency workspace."
      >
        <section className="fc-wlp-section">
          {commandDeck}
          <ProductEmptyState
            title="Sign in for your agency tenant"
            description="Demo mode shows the command deck — sign in to route partner files, manage seats, and track payouts."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            }
          />
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!auth.user) {
    return <ProductDashboardSkeleton label="Loading agency workspace" />;
  }

  if (!gate.allowed) {
    const blockedMetrics: ProductMetric[] = [
      {
        label: 'Tenant',
        value: tenantLive ? 'Live' : 'Setup',
        hint: tenant?.name ?? 'Agency workspace not provisioned',
        accent: 'emerald',
        icon: Building2,
      },
      { label: 'Seats', value: String(seatCount || 1), hint: 'Active and invited operators', accent: 'violet', icon: Users },
      { label: 'Role', value: roleLabel, hint: 'Owner or staff on the tenant', accent: 'sky', icon: Users },
      {
        label: 'White-label',
        value: whiteLabelOn ? 'On' : 'Off',
        hint: whiteLabelOn ? 'Your brand on the portal' : 'Finely-branded while you launch',
        accent: 'rose',
        icon: Building2,
      },
    ];

    return (
      <ProductHubScaffold
        role={role}
        pageId="agency-hub"
        eyebrow="Agency"
        title="Agency"
        description="Your brand out front — partners, letters, team seats, payouts, and white-label on Finely OS."
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
            <ProductPagePrimaryAction label="Create agency workspace" onClick={() => navigate(signupPath)} />
          )
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(publicPath)}>
            Agency careers
          </button>
        }
        metrics={blockedMetrics}
        metricTitle="Tenant snapshot"
        metricDescription="Provision your agency tenant to unlock partner routing and team seats."
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title={gate.reason === 'unauthenticated' ? 'Sign in to open Agency' : 'Agency tenant required'}
            description={gate.message}
            action={
              gate.cta ? (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(gate.cta!.path)}>
                  {gate.cta.label}
                </button>
              ) : (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(signupPath)}>
                  Create agency workspace
                </button>
              )
            }
          />
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  const metrics: ProductMetric[] = [
    {
      label: 'Tenant',
      value: tenantLive ? 'Live' : 'Setup',
      hint: tenant?.name ?? 'Finish tenant setup',
      accent: 'emerald',
      icon: Building2,
      onClick: () => selectTile('team'),
    },
    {
      label: 'Seats',
      value: String(seatCount || 1),
      hint: seatCount <= 1 ? 'Invite your first operator' : `${seatCount} active or invited`,
      accent: 'violet',
      icon: Users,
      onClick: () => selectTile('team'),
    },
    {
      label: 'Role',
      value: roleLabel,
      hint: getUserDisplayName(auth.user) ?? 'Your agency seat',
      accent: 'sky',
      icon: Users,
    },
    {
      label: 'White-label',
      value: whiteLabelOn ? 'On' : 'Off',
      hint: whiteLabelOn ? 'Your brand on the portal' : 'Finely-branded while you launch',
      accent: 'rose',
      icon: Building2,
      onClick: () => navigate(mapPortalHref('/admin/access')),
    },
  ];

  const statusHeadline = !tenantLive
    ? 'Finish tenant setup'
    : seatCount <= 1
      ? 'Invite a team seat'
      : 'Agency tenant live';

  return (
    <ProductHubScaffold
      role={role}
      pageId="agency-hub"
      eyebrow="Agency"
      title="Agency"
      description="Your brand out front — partners, letters, team seats, payouts, and white-label on Finely OS."
      status={`${statusHeadline}${getUserDisplayName(auth.user) ? ` · ${getUserDisplayName(auth.user)}` : ''} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant="grid"
      primaryAction={<ProductPagePrimaryAction label="Partner files" onClick={() => navigate(partnersPath)} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(messagesPath)}>
          Agency line
        </button>
      }
      metrics={metrics}
      metricTitle="Tenant snapshot"
      metricDescription="Live status, seats, your role, and white-label depth at a glance."
    >
      <section className="fc-wlp-section">{commandDeck}</section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
