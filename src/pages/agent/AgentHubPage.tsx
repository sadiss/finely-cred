import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calculator,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Rocket,
  Settings2,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { AgentSplitCalculator } from '../../components/agent/AgentSplitCalculator';
import { AgentWhiteLabelSetup } from '../../components/agent/AgentWhiteLabelSetup';
import { DenefitsContractCalculator } from '../../components/calculators/BenefitsContractCalculator';
import { SpecialistLeadGrowthPanel } from '../../components/specialist/SpecialistLeadGrowthPanel';
import { DenefitsEnrollmentPanel } from '../../components/denefits/DenefitsEnrollmentPanel';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { UnifiedTrainingPanel } from '../../components/training/UnifiedTrainingPanel';
import { CreditSpecialistCommsPanel } from '../../components/creditSpecialist/CreditSpecialistCommsPanel';
import { CreditSpecialistOfferingsPanel } from '../../components/creditSpecialist/CreditSpecialistOfferingsPanel';
import { CreditSpecialistHubCommandStrip } from '../../components/creditSpecialist/CreditSpecialistHubCommandStrip';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listPartnersByAgent } from '../../data/partnersRepo';
import { useAuth } from '../../auth/AuthProvider';
import { getUserDisplayName, getUserProfileMeta } from '../../auth/userProfile';
import { agentModelFromMetadata, getAgentOperatingModel, saveAgentOperatingModel } from '../../data/agentProgramRepo';
import type { AgentOperatingModel, PlatformLeverId } from '../../domain/agentProgram';
import { computeAgentRevenueSplit, defaultAgentOperatingModel } from '../../domain/agentProgram';
import { getAgencyTierById } from '../../config/pricingCatalog';
import { CS } from '../../config/creditSpecialistProgram';
import { AGENCY_TIER_IDS } from '../../lib/partnerGoals';
import { AgentCommandCenter } from '../../components/agent/AgentCommandCenter';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { onboardCreditSpecialistCommunication } from '../../lib/creditSpecialistComms';
import { PayoutCenterPanel } from '../../components/payouts/PayoutCenterPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildAgentNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

type HubTab = 'overview' | 'economics' | 'growth' | 'communications' | 'setup' | 'training' | 'operate' | 'command';

const QUICK_TOOLS = [
  { label: 'Customer dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'Partnership line', path: CS.messagesDeepLink, icon: MessageSquare },
  { label: 'Template library', path: '/portal/templates', icon: BookOpen },
  { label: 'Letter studio', path: '/portal/letters', icon: Rocket },
  { label: 'Courses & academy', path: '/portal/courses', icon: BookOpen },
  { label: 'Marketing resources', path: '/portal/education', icon: Megaphone },
  { label: 'Team & roles', path: '/admin/team', icon: Users },
];

const TABS: { id: HubTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'economics', label: 'Economics', icon: Calculator },
  { id: 'growth', label: 'Growth', icon: Target },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'setup', label: 'Setup & white-label', icon: Settings2 },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'command', label: 'Command center', icon: Rocket },
  { id: 'operate', label: 'Operate', icon: LayoutDashboard },
];

export default function AgentHubPage() {
  const auth = useAuth();
  const { partner } = usePartnerSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meta = getUserProfileMeta(auth.user);

  const [tab, setTab] = useState<HubTab>('overview');
  const [model, setModel] = useState<AgentOperatingModel>(() => defaultAgentOperatingModel());
  const [saved, setSaved] = useState(false);
  const [managedClientsCount, setManagedClientsCount] = useState(0);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (
      t === 'overview' ||
      t === 'economics' ||
      t === 'growth' ||
      t === 'communications' ||
      t === 'setup' ||
      t === 'training' ||
      t === 'command' ||
      t === 'operate'
    ) {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!auth.user?.id) return;
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
  }, [auth.user?.id, meta]);

  useEffect(() => {
    if (!partner?.id || !partner.tenantId) {
      setManagedClientsCount(0);
      return;
    }
    void listPartnersByAgent(partner.tenantId, partner.id).then((rows) => setManagedClientsCount(rows.length));
  }, [partner?.id, partner?.tenantId]);

  const hasOperatingModel = useMemo(() => {
    if (!auth.user?.id) return false;
    return Boolean(getAgentOperatingModel(auth.user.id));
  }, [auth.user?.id, model, saved]);

  const agentWorkflowProgress = useMemo(
    () =>
      computeRoleWorkflowProgress('agent', {
        partner,
        hasOperatingModel,
        managedClientsCount,
      }),
    [partner, hasOperatingModel, managedClientsCount],
  );

  const tier = useMemo(() => getAgencyTierById(model.capacityTierId), [model.capacityTierId]);
  const split = useMemo(() => computeAgentRevenueSplit(model), [model]);

  const openTasks = useMemo(() => {
    if (!partner?.id) return 0;
    return listTasksByPartner(partner.id).filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  }, [partner?.id]);

  useEffect(() => {
    if (!partner?.id) return;
    onboardCreditSpecialistCommunication({
      partnerId: partner.id,
      specialistName: getUserDisplayName(auth.user),
      tierName: tier?.name,
    });
  }, [partner?.id, auth.user, tier?.name]);

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

  if (!auth.user) {
    return (
      <PageShell badge={CS.plural} title={CS.hubName} subtitle="Sign in to access training, split calculator, partnership line, and tools.">
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_PRIMARY_BTN}>
            Sign in
          </button>
          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge={CS.programName}
      title={CS.hubName}
      subtitle="Revenue-share partnership — train, message Finely, configure white-label, and run customer files on one stack."
      back={{ to: '/dashboard', label: 'Dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl`}>
        {saved ? <div className={FINELY_OS_NOTICE_SUCCESS}>Operating model saved.</div> : null}

        <CreditSpecialistHubCommandStrip clientCount={managedClientsCount} openTasks={openTasks} />

        <FinelyNoticedStrip
          items={buildAgentNoticedItems({
            managedCustomers: managedClientsCount,
            openTasks,
            hasOperatingModel,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={managedClientsCount === 0 ? 0 : 1} />

        <FinelyUnifiedHubLayout
          eyebrow={CS.programName}
          title={CS.hubName}
          subtitle="Revenue-share partnership — train, message Finely, configure white-label, and run customer files on one stack."
          accent="emerald"
          kpis={[
            { label: 'Your keep', value: `${split.agentSharePct}%`, accent: 'emerald' },
            { label: 'Customers', value: String(managedClientsCount), accent: 'amber' },
            { label: 'Open tasks', value: String(openTasks), accent: 'sky' },
            { label: 'Training', value: split.phaseLabel, accent: 'violet' },
          ]}
          tabs={TABS.map(({ id, label }) => ({ id, label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          primaryAction={{ label: 'Customer dashboard', onClick: () => navigate('/portal/dashboard') }}
          secondaryAction={{ label: 'Partnership line', onClick: () => navigate(CS.messagesDeepLink) }}
        >
        {tab === 'overview' && (
          <>
            <div className={`grid md:grid-cols-3 gap-4 ${finelyOsCatalogCard('emerald')} !p-5`} data-fc-accent="emerald">
              <div className={finelyOsKpiTile(1)}>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-700`}>Your keep</div>
                <div className="text-4xl font-bold text-emerald-700 mt-1">{split.agentSharePct}%</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2`}>Revenue share only — no platform fee</div>
              </div>
              <div className={finelyOsKpiTile(4)}>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-700`}>Training</div>
                <div className={`text-xl font-semibold ${FINELY_OS_ENTITY_VALUE} mt-1`}>{split.phaseLabel}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2 capitalize`}>{(tier?.whiteLabelLevel ?? '').replace(/_/g, ' ') || tier?.name}</div>
              </div>
              <div className={finelyOsKpiTile(0)}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Capacity</div>
                <div className={`text-xl font-semibold ${FINELY_OS_ENTITY_VALUE} mt-1`}>
                  {tier?.activeClientLimit === -1 ? 'Unlimited' : tier?.activeClientLimit ?? 25} clients
                </div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2`}>{tier?.seatLimit === -1 ? 'Unlimited' : tier?.seatLimit ?? 1} seats</div>
              </div>
            </div>
            <CreditSpecialistOfferingsPanel compact />
            <RoleWorkflowPanel roleId="agent" compact completedSteps={agentWorkflowProgress} />
            <AgentSplitCalculator
              model={model}
              onChangeModel={patchModel}
              onChangeLever={setLever}
              onChangeSampleFee={(cents: number) => patchModel({ sampleClientFeeCents: cents })}
            />
            <button type="button" onClick={() => void persist()} className={FINELY_OS_PRIMARY_BTN}>
              Save operating model
            </button>
          </>
        )}

        {tab === 'economics' && (
          <div className="space-y-6">
            <AgentSplitCalculator
              model={model}
              onChangeModel={patchModel}
              onChangeLever={setLever}
              onChangeSampleFee={(cents: number) => patchModel({ sampleClientFeeCents: cents })}
            />
            <DenefitsContractCalculator defaultSpecialistSharePct={12} />
            <DenefitsEnrollmentPanel audience="specialist" compact />
            {auth.user?.id ? <PayoutCenterPanel role="agent" ownerId={auth.user.id} ownerEmail={auth.user.email ?? undefined} /> : null}
            <button type="button" onClick={() => void persist()} className={FINELY_OS_PRIMARY_BTN}>
              Save operating model
            </button>
          </div>
        )}

        {tab === 'growth' && <SpecialistLeadGrowthPanel model={model} />}

        {tab === 'communications' && partner?.id ? (
          <CreditSpecialistCommsPanel partnerId={partner.id} specialistName={getUserDisplayName(auth.user)} tierName={tier?.name} />
        ) : tab === 'communications' ? (
          <div className={FINELY_OS_ENTITY_EMPTY}>Complete onboarding to open your partnership line with Finely.</div>
        ) : null}

        {tab === 'setup' && (
          <>
            <AgentWhiteLabelSetup capacityTierId={model.capacityTierId} />
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Upgrade path</div>
              <div className="grid sm:grid-cols-2 gap-3">
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
                        className={`text-left ${finelyOsListItem(active, 'amber')}`}
                      >
                        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{t.name}</div>
                        <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1 capitalize`}>{(t.whiteLabelLevel ?? '').replace(/_/g, ' ')}</div>
                      </button>
                    );
                  }}
                />
              </div>
              <button type="button" onClick={() => void persist()} className={FINELY_OS_PRIMARY_BTN}>
                Save tier selection
              </button>
            </div>
          </>
        )}

        {tab === 'training' && <UnifiedTrainingPanel specialties={model.specialties} audience="credit_specialist" />}

        {tab === 'command' && <AgentCommandCenter model={model} />}

        {tab === 'operate' && (
          <div className={`space-y-4 ${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
            <p className={FINELY_OS_ENTITY_BODY}>
              Day-to-day tools for running customer files — disputes, comms, documents, and tasks. Your revenue share improves as you
              move levers from Finely → Shared → You.
            </p>
            <div className="flex flex-wrap gap-3">
              {QUICK_TOOLS.map(({ label, path, icon: Icon }) => (
                <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        )}

        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
