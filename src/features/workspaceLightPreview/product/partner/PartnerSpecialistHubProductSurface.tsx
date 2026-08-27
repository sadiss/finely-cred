import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CircleHelp,
  GraduationCap,
  ListTodo,
  MessageSquare,
  PenLine,
  Percent,
  Rocket,
  ScrollText,
  UserCog,
  Users,
  Zap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getUserDisplayName, getUserProfileMeta } from '../../../../auth/userProfile';
import { AgentSplitCalculator } from '../../../../components/agent/AgentSplitCalculator';
import { AgentWhiteLabelSetup } from '../../../../components/agent/AgentWhiteLabelSetup';
import { DenefitsContractCalculator } from '../../../../components/calculators/BenefitsContractCalculator';
import { SpecialistLeadGrowthPanel } from '../../../../components/specialist/SpecialistLeadGrowthPanel';
import { DenefitsEnrollmentPanel } from '../../../../components/denefits/DenefitsEnrollmentPanel';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../../../lib/roleWorkflowProgress';
import { UnifiedTrainingPanel } from '../../../../components/training/UnifiedTrainingPanel';
import { CreditSpecialistLeadCommitmentPanel } from '../../../../components/creditSpecialist/CreditSpecialistLeadCommitmentPanel';
import { CreditSpecialistCommsPanel } from '../../../../components/creditSpecialist/CreditSpecialistCommsPanel';
import { CreditSpecialistHubCommandStrip } from '../../../../components/creditSpecialist/CreditSpecialistHubCommandStrip';
import { CreditSpecialistOfferingsPanel } from '../../../../components/creditSpecialist/CreditSpecialistOfferingsPanel';
import { loadCreditSpecialistJoinIntent } from '../../../../lib/creditSpecialistJoinIntent';
import { listTasksByPartner } from '../../../../data/tasksRepo';
import { listPartnersForCareMember } from '../../../../data/partnersRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import {
  agentModelFromMetadata,
  getAgentOperatingModel,
  saveAgentOperatingModel,
} from '../../../../data/agentProgramRepo';
import type { AgentOperatingModel, PlatformLeverId } from '../../../../domain/agentProgram';
import { computeAgentRevenueSplit, defaultAgentOperatingModel } from '../../../../domain/agentProgram';
import { getAgencyTierById } from '../../../../config/pricingCatalog';
import { CS } from '../../../../config/creditSpecialistProgram';
import { AGENCY_TIER_IDS } from '../../../../lib/partnerGoals';
import { ROLE_GUIDE_CTAS } from '../../../../config/rolePartnerPrograms';
import { onboardCreditSpecialistCommunication } from '../../../../lib/creditSpecialistComms';
import { PayoutCenterPanel } from '../../../../components/payouts/PayoutCenterPanel';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { resolveCreditSpecialistHubAccess } from '../../../../lib/roleHubAccess';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../../os/finelyOsLightUi';
import './partnerSpecialistHubSurface.css';

const METRICS_VARIANT = 'jewel' as const;
const CS_PURPOSE =
  'Revenue-share partnership — train with Finely, grow leads, configure your workspace, and run assigned partner files on one stack.';

type SpecialistToolId = 'partners' | 'letters' | 'growth' | 'training' | 'economics' | 'comms';

const TOOL_RAIL: Array<{ id: SpecialistToolId; label: string }> = [
  { id: 'partners', label: 'Partner files' },
  { id: 'letters', label: 'Letters' },
  { id: 'growth', label: 'Growth' },
  { id: 'training', label: 'Training' },
  { id: 'economics', label: 'Economics' },
  { id: 'comms', label: 'Partnership line' },
];

const TAB_QUERY_ALIASES: Record<string, SpecialistToolId> = {
  overview: 'partners',
  partners: 'partners',
  operate: 'partners',
  letters: 'letters',
  growth: 'growth',
  training: 'training',
  setup: 'training',
  economics: 'economics',
  comms: 'comms',
  communications: 'comms',
};

type LetterToolListAccent = 'violet' | 'sky' | 'rose' | 'emerald';

const LETTER_TOOL_LIST_ACCENT: Record<LetterToolListAccent, 'violet' | 'fuchsia' | 'emerald'> = {
  violet: 'violet',
  sky: 'violet',
  rose: 'fuchsia',
  emerald: 'emerald',
};

const LETTER_TOOLS: Array<{
  label: string;
  path: string;
  icon: typeof PenLine;
  note: string;
  accent: LetterToolListAccent;
}> = [
  {
    label: 'Letter studio',
    path: '/portal/letters',
    icon: PenLine,
    note: 'Draft dispute letters for partner files',
    accent: 'violet',
  },
  {
    label: 'Template library',
    path: '/portal/templates',
    icon: BookOpen,
    note: 'Vault templates and reasons library for demos',
    accent: 'sky',
  },
  {
    label: 'Letters vault',
    path: '/portal/letters/vault',
    icon: ScrollText,
    note: 'Mailed and approved letters',
    accent: 'emerald',
  },
  {
    label: 'Dispute center',
    path: '/portal/disputes',
    icon: Zap,
    note: 'Bureau cases and dispute rounds',
    accent: 'rose',
  },
];

function resolveActiveTool(raw: string | null): SpecialistToolId {
  if (!raw) return 'partners';
  return TAB_QUERY_ALIASES[raw] ?? 'partners';
}

export default function PartnerSpecialistHubProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const { partner: sessionPartner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? UserCog;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;
  const csGuide = ROLE_GUIDE_CTAS.cs;

  const partner = useMemo(() => {
    if (partnerId) return getPartnerSync(partnerId) ?? sessionPartner;
    return sessionPartner;
  }, [partnerId, sessionPartner]);

  const meta = getUserProfileMeta(auth.user);

  const [model, setModel] = useState<AgentOperatingModel>(() => defaultAgentOperatingModel());
  const [saved, setSaved] = useState(false);
  const [caseload, setCaseload] = useState<Partner[]>([]);
  const [caseloadLoading, setCaseloadLoading] = useState(!isDemo);
  const [modelReady, setModelReady] = useState(isDemo);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const activeTool = resolveActiveTool(searchParams.get('tab'));

  const setActiveTool = (tool: SpecialistToolId) => {
    const next = new URLSearchParams(searchParams);
    if (tool === 'partners') next.delete('tab');
    else next.set('tab', tool);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!auth.user?.id) {
      setModel(defaultAgentOperatingModel());
      setModelReady(true);
      return;
    }
    const fromStore = getAgentOperatingModel(auth.user.id);
    const fromMeta = agentModelFromMetadata(meta as Record<string, unknown>);
    const tierId = meta.agentTierId as string | undefined;
    setModel(
      defaultAgentOperatingModel(
        fromStore ??
          fromMeta ?? {
            capacityTierId: tierId || 'agency_solo',
          },
      ),
    );
    setModelReady(true);
  }, [auth.user?.id, meta]);

  useEffect(() => {
    if (isDemo) {
      setCaseload([]);
      setCaseloadLoading(false);
      return;
    }
    if (!partner?.id || !partner.tenantId) {
      setCaseload([]);
      setCaseloadLoading(false);
      return;
    }
    setCaseloadLoading(true);
    void listPartnersForCareMember(partner.tenantId, partner.id).then((rows) => {
      setCaseload(rows);
      setCaseloadLoading(false);
      setSelectedPartnerId((current) => current ?? rows[0]?.id ?? null);
    });
  }, [isDemo, partner?.id, partner?.tenantId]);

  const managedPartnerCount = caseload.length;
  const selectedPartner = useMemo(
    () => caseload.find((c) => c.id === selectedPartnerId) ?? null,
    [caseload, selectedPartnerId],
  );

  const hasOperatingModel = useMemo(() => {
    if (!auth.user?.id) return false;
    return Boolean(getAgentOperatingModel(auth.user.id));
  }, [auth.user?.id, model, saved]);

  const agentWorkflowProgress = useMemo(
    () =>
      computeRoleWorkflowProgress('agent', {
        partner,
        hasOperatingModel,
        managedClientsCount: managedPartnerCount,
      }),
    [partner, hasOperatingModel, managedPartnerCount],
  );

  const tier = useMemo(() => getAgencyTierById(model.capacityTierId), [model.capacityTierId]);
  const split = useMemo(() => computeAgentRevenueSplit(model), [model]);

  const openTasks = useMemo(() => {
    if (!partner?.id) return 0;
    return listTasksByPartner(partner.id).filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  }, [partner?.id]);

  const specialistReferralCode = useMemo(() => {
    const metaCode = (meta as Record<string, unknown>).affiliateReferralCode as string | undefined;
    const base = metaCode || partner?.profile?.email?.split('@')[0] || auth.user?.email?.split('@')[0] || 'specialist';
    return `agent-${String(base)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 28)}`;
  }, [auth.user?.email, meta, partner?.profile?.email]);

  const commitmentWindowStart =
    loadCreditSpecialistJoinIntent()?.createdAt || (partner as { createdAt?: string } | null)?.createdAt || null;

  useEffect(() => {
    if (!partner?.id || isDemo) return;
    onboardCreditSpecialistCommunication({
      partnerId: partner.id,
      specialistName: getUserDisplayName(auth.user),
      tierName: tier?.name,
    });
  }, [partner?.id, auth.user, tier?.name, isDemo]);

  const patchModel = (patch: Partial<AgentOperatingModel>) => {
    setModel((m: AgentOperatingModel) => defaultAgentOperatingModel({ ...m, ...patch }));
    setSaved(false);
  };

  const setLever = (leverId: string, performer: 'platform' | 'agent' | 'shared') => {
    patchModel({ levers: { ...model.levers, [leverId as PlatformLeverId]: performer } });
  };

  const persist = async () => {
    if (!auth.user?.id) return;
    saveAgentOperatingModel(auth.user.id, model);
    await auth.updateUserProfile({
      agentOperatingModel: model as unknown as Record<string, unknown>,
      agentTierId: model.capacityTierId,
      agentSpecialties: model.specialties,
      agentTrainingPhase: model.trainingPhase,
    });
    setSaved(true);
  };

  const gate = useMemo(
    () =>
      isDemo
        ? { allowed: true, message: 'Demo Credit Specialist workspace.', reason: 'ok' as const }
        : resolveCreditSpecialistHubAccess(auth.user),
    [auth.user, isDemo],
  );

  const primaryLabel =
    managedPartnerCount === 0 ? 'Grow your first partner leads' : "Open today's partner file";

  const runPrimaryAction = () => {
    if (managedPartnerCount === 0) setActiveTool('growth');
    else if (caseload[0]) {
      setSelectedPartnerId(caseload[0].id);
      setActiveTool('partners');
      navigate(mapPortalHref(`/admin/partners/${caseload[0].id}`));
    } else navigate(mapPortalHref('/admin/partners'));
  };

  const metrics: ProductMetric[] = useMemo(
    () => [
      {
        label: 'Your keep',
        value: `${split.agentSharePct}%`,
        hint: `${split.phaseLabel} revenue share`,
        accent: 'emerald',
        icon: Percent,
        onClick: () => setActiveTool('economics'),
      },
      {
        label: 'Partners',
        value: isDemo ? 0 : caseloadLoading ? '…' : managedPartnerCount,
        hint:
          managedPartnerCount === 0
            ? 'No partners assigned yet'
            : `${managedPartnerCount} on your caseload`,
        accent: 'rose',
        icon: Users,
        onClick: () => setActiveTool('partners'),
      },
      {
        label: 'Open tasks',
        value: isDemo ? 0 : openTasks,
        hint: openTasks ? 'Clear blockers on partner files' : 'Nothing open right now',
        accent: 'sky',
        icon: ListTodo,
        onClick: () => setActiveTool('letters'),
      },
      {
        label: 'Training',
        value: split.phaseLabel,
        hint: tier?.name ?? CS.singular,
        accent: 'violet',
        icon: GraduationCap,
        onClick: () => setActiveTool('training'),
      },
    ],
    [
      caseloadLoading,
      isDemo,
      managedPartnerCount,
      navigate,
      openTasks,
      split.agentSharePct,
      split.phaseLabel,
      tier?.name,
      mapPortalHref,
    ],
  );

  const inspectorTitle =
    activeTool === 'letters'
      ? 'Letter inspector'
      : activeTool === 'growth'
        ? 'Lead growth'
        : activeTool === 'training'
          ? 'Training & white-label'
          : activeTool === 'economics'
            ? 'Economics & payouts'
            : activeTool === 'comms'
              ? 'Partnership line'
              : selectedPartnerId
                ? caseload.find((c) => c.id === selectedPartnerId)?.profile.fullName || 'Partner file'
                : 'Assigned partners';

  const renderInspector = () => {
    if (isDemo) {
      return (
        <ProductEmptyState
          title="Sign in to run your Credit Specialist hub"
          description="Demo mode shows the layout — sign in to manage assigned partners, growth, training, and economics."
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
          ) : (
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref(csGuide.path))}>
              {csGuide.label}
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="fc-cs-caseload-board space-y-6">
        {saved ? <div className={FINELY_OS_NOTICE_SUCCESS}>Operating model saved.</div> : null}

        {activeTool === 'partners' ? (
          <div className={`${finelyOsCatalogCard('emerald')} space-y-4 p-6 lg:p-8`} data-fc-accent="emerald">
            {caseloadLoading ? (
              <p className={FINELY_OS_ENTITY_BODY}>Loading caseload…</p>
            ) : selectedPartner ? (
              <>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>This file</div>
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {selectedPartner.profile.fullName || selectedPartner.profile.email}
                </div>
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Open this file to keep restore, letters, and tasks moving.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(mapPortalHref(`/admin/partners/${selectedPartner.id}`))}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  Open file
                </button>
              </>
            ) : (
              <>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Your caseload</div>
                <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>No partners assigned yet</div>
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Capture a lead, or wait for an assignment. The list on the left stays empty until a file is yours.
                </p>
                <button type="button" onClick={() => setActiveTool('growth')} className={FINELY_OS_PRIMARY_BTN}>
                  Find partners
                </button>
              </>
            )}
          </div>
        ) : null}

        {activeTool === 'letters' ? (
          <div className="space-y-4">
            <div className={`${finelyOsCatalogCard('violet')} space-y-3`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Letter tools</div>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Draft dispute letters, pull templates, and mail from the vault — one stack for every partner file you run.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {LETTER_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.path}
                    type="button"
                    onClick={() => navigate(mapPortalHref(tool.path))}
                    className={`${finelyOsListItem(false, LETTER_TOOL_LIST_ACCENT[tool.accent])} text-left`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl border border-current/20 p-2">
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{tool.label}</div>
                        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{tool.note}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => navigate(mapPortalHref('/portal/letters'))}
              className={FINELY_OS_PRIMARY_BTN}
            >
              <Rocket size={14} /> Open letter studio
            </button>
          </div>
        ) : null}

        {activeTool === 'growth' ? (
          <>
            <CreditSpecialistLeadCommitmentPanel
              referralCode={specialistReferralCode}
              windowStartedAt={commitmentWindowStart}
            />
            <SpecialistLeadGrowthPanel model={model} />
          </>
        ) : null}

        {activeTool === 'training' ? (
          <>
            <AgentWhiteLabelSetup capacityTierId={model.capacityTierId} />
            <div className={`space-y-4 ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Upgrade path</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FinelyOsPaginatedStack
                  items={[...AGENCY_TIER_IDS]}
                  pageSize={6}
                  itemSpacingClassName="grid sm:grid-cols-2 gap-3"
                  renderItem={(id) => {
                    const t = getAgencyTierById(id);
                    if (!t) return null;
                    const active = model.capacityTierId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          patchModel({
                            capacityTierId: id,
                            trainingPhase: t.recommendedTrainingPhase ?? model.trainingPhase,
                          })
                        }
                        className={`text-left ${finelyOsListItem(active, 'emerald')}`}
                      >
                        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{t.name}</div>
                        <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1 capitalize`}>
                          {(t.whiteLabelLevel ?? '').replace(/_/g, ' ')}
                        </div>
                      </button>
                    );
                  }}
                />
              </div>
              <button type="button" onClick={() => void persist()} className={FINELY_OS_PRIMARY_BTN}>
                Save tier selection
              </button>
            </div>
            <UnifiedTrainingPanel specialties={model.specialties} audience="credit_specialist" />
            <CreditSpecialistOfferingsPanel compact />
            <RoleWorkflowPanel roleId="agent" compact completedSteps={agentWorkflowProgress} />
          </>
        ) : null}

        {activeTool === 'economics' ? (
          <>
            <AgentSplitCalculator
              model={model}
              onChangeModel={patchModel}
              onChangeLever={setLever}
              onChangeSampleFee={(cents: number) => patchModel({ sampleClientFeeCents: cents })}
            />
            <DenefitsContractCalculator defaultSpecialistSharePct={12} />
            <DenefitsEnrollmentPanel audience="specialist" compact />
            {auth.user?.id ? (
              <PayoutCenterPanel role="agent" ownerId={auth.user.id} ownerEmail={auth.user.email ?? undefined} />
            ) : null}
            <button type="button" onClick={() => void persist()} className={FINELY_OS_PRIMARY_BTN}>
              Save operating model
            </button>
          </>
        ) : null}

        {activeTool === 'comms' ? (
          partner?.id ? (
            <CreditSpecialistCommsPanel
              partnerId={partner.id}
              specialistName={getUserDisplayName(auth.user)}
              tierName={tier?.name}
            />
          ) : (
            <ProductEmptyState
              title="Complete onboarding"
              description="Finish onboarding to open your partnership line with Finely."
              action={
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(mapPortalHref('/onboarding'))}>
                  Finish onboarding
                </button>
              }
            />
          )
        ) : null}
      </div>
    );
  };

  const statusHeadline =
    managedPartnerCount === 0
      ? openTasks
        ? `${openTasks} open task${openTasks === 1 ? '' : 's'} · grow leads`
        : 'No partners assigned yet'
      : openTasks
        ? `${managedPartnerCount} partner${managedPartnerCount === 1 ? '' : 's'} · ${openTasks} open task${openTasks === 1 ? '' : 's'}`
        : `${managedPartnerCount} assigned partner${managedPartnerCount === 1 ? '' : 's'}`;

  if (!isDemo && (caseloadLoading || !modelReady) && gate.allowed) {
    return <ProductDashboardSkeleton label="Loading your Credit Specialist hub" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId="specialist-hub"
      eyebrow={CS.programName}
      title="Train, grow leads, and run assigned partner files."
      description={CS_PURPOSE}
      status={`${statusHeadline} · ${isDemo ? 'demo data' : 'live data'}`}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label={primaryLabel} onClick={runPrimaryAction} />}
      secondaryAction={
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => openProductCopilot({ prompt: 'What should I do next in the Credit Specialist program?', contextLabel: navItem?.label ?? CS.singular })}
        >
          <CircleHelp size={15} /> Ask Finely
        </button>
      }
      metrics={metrics}
      metricTitle="Program snapshot"
      metricDescription="Your keep %, caseload, open tasks, and training phase — tap a signal to jump in."
    >
      <section className="fc-wlp-section fc-cs-workbench" data-surface-layout="caseload-board">
        {!isDemo && gate.allowed ? (
          <CreditSpecialistHubCommandStrip clientCount={managedPartnerCount} openTasks={openTasks} />
        ) : null}
        <div className="fc-cs-workbench-grid">
        <aside className="fc-cs-partner-nav">
          <div className="fc-cs-partner-nav-head">Caseload · {managedPartnerCount} partner{managedPartnerCount === 1 ? '' : 's'}</div>
          {caseloadLoading ? (
            <p className={FINELY_OS_ENTITY_BODY}>Loading…</p>
          ) : caseload.length === 0 ? (
            <p className={FINELY_OS_ENTITY_EMPTY}>No partners assigned yet.</p>
          ) : (
            caseload.slice(0, 12).map((c) => (
              <button
                key={c.id}
                type="button"
                className="fc-cs-partner-nav-item"
                data-active={selectedPartnerId === c.id && activeTool === 'partners' ? 'true' : undefined}
                onClick={() => {
                  setSelectedPartnerId(c.id);
                  setActiveTool('partners');
                }}
              >
                <span>{c.profile.fullName || c.profile.email}</span>
                <span className="fc-cs-partner-nav-item-meta">{c.profile.email || c.id}</span>
              </button>
            ))
          )}
          <button type="button" className="fc-wlp-btn-secondary mt-2" onClick={() => navigate(mapPortalHref('/admin/partners'))}>
            <Users size={14} /> All partner files
          </button>
        </aside>
        <div className="fc-cs-inspector">
          <div className="fc-cs-tool-rail" role="tablist" aria-label="Specialist tools">
            {TOOL_RAIL.map((tool) => (
              <button
                key={tool.id}
                type="button"
                role="tab"
                aria-selected={activeTool === tool.id}
                data-active={activeTool === tool.id ? 'true' : undefined}
                onClick={() => setActiveTool(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <h2 className="fc-cs-inspector-title">{inspectorTitle}</h2>
          {renderInspector()}
        </div>
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
