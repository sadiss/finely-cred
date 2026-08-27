import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleHelp,
  Crown,
  Landmark,
  Lock,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { computeReadinessScore } from '../../../../domain/capitalReadiness';
import { buildReadinessScoreExtras, getOrCreateCapitalPlan } from '../../../../data/capitalReadinessRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import { listTasksByPartner } from '../../../../data/tasksRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { hasEntitlement } from '../../../../data/billingRepo';
import { getFeatureFlags, isNoraCapitalConfigured } from '../../../../data/settingsRepo';
import { saveFundingLaneFocus, getFundingLaneFocus } from '../../../../data/fundingLaneStateRepo';
import { computePartnerOverallScore } from '../../../../utils/partnerOverallScore';
import { submitPartnerFundingHandoff } from '../../../../lib/noraFundingHandoff';
import { PartnerFundingCommandStrip } from '../../../../components/partner/PartnerFundingCommandStrip';
import { PartnerLaneCoachPanel } from '../../../../components/chat/PartnerLaneCoachPanel';
import { FundingLadderPanel } from '../../../../components/funding/FundingLadderPanel';
import { FinelyBridgeConnectorPanel } from '../../../../components/bridge/FinelyBridgeConnectorPanel';
import { ProfileGoalsReadinessPanel } from '../../../../components/profile/ProfileGoalsReadinessPanel';
import type { CapitalReadinessPlan } from '../../../../domain/capitalReadiness';
import type { Partner } from '../../../../domain/partners';
import type { PartnerOverallScoreResult } from '../../../../utils/partnerOverallScore';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

const RUNWAY_NODES = [
  { id: 'overview', label: 'Overview', accent: 'emerald' },
  { id: 'lanes', label: 'Wealth lanes', accent: 'violet' },
  { id: 'ladder', label: 'Funding ladder', accent: 'sky' },
  { id: 'score', label: 'Readiness score', accent: 'rose' },
] as const;

type RunwayView = (typeof RUNWAY_NODES)[number]['id'];

const LANES = [
  {
    id: 'lane_funding_readiness',
    title: 'Funding Readiness',
    subtitle: 'Blueprint → scorecard → execution',
    description: 'Structured readiness milestones, lender-facing packaging, and execution checklists.',
    entitlementKey: 'wealth_paths_access',
    icon: <Sparkles size={18} className="text-emerald-300" />,
  },
  {
    id: 'lane_business_credit',
    title: 'Business Credit Build',
    subtitle: 'Vendor sequencing + fundability',
    description: 'Corporate credit build steps, vendor sequencing, compliance, and reporting milestones.',
    entitlementKey: 'wealth_builder_dfy',
    icon: <Building2 size={18} className="text-fuchsia-300" />,
  },
  {
    id: 'lane_capital_deployment',
    title: 'Capital Deployment',
    subtitle: 'Where wealth paths begin',
    description: 'Plan and deploy funding into wealth-building vehicles with structured guardrails.',
    entitlementKey: 'wealth_paths_premium',
    icon: <Landmark size={18} className="text-sky-300" />,
  },
  {
    id: 'lane_nora_capital',
    title: 'Nora Capital Group (Connected Path)',
    subtitle: 'Funding applications + accelerator',
    description: 'Connect to Nora Capital Group for funding applications when your credit file is funding-ready.',
    entitlementKey: 'wealth_paths_premium',
    icon: <BriefcaseBusiness size={18} className="text-violet-300" />,
  },
] as const;

function formatFreshness(iso?: string): string {
  if (!iso) return 'profile not updated yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; partner: Partner; overallScore: PartnerOverallScoreResult; plan: CapitalReadinessPlan };

export default function PartnerReadinessProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner, refresh } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Target;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/wealth-paths');
  const scaffoldAccent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [runwayView, setRunwayView] = useState<RunwayView>('overview');
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [coachVersion, setCoachVersion] = useState(0);

  const features = getFeatureFlags();
  const noraOn = isNoraCapitalConfigured();

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const partner = getPartnerSync(partnerId!);
      if (!partner) throw new Error('Partner profile not found.');
      const tasks = listTasksByPartner(partnerId!);
      const openTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').length;
      const doneTasks = tasks.filter((task) => task.status === 'completed').length;
      const overallScore = computePartnerOverallScore({
        partner,
        counts: {
          reports: listReportsByPartner(partnerId!).length,
          evidence: listEvidenceByPartner(partnerId!).length,
          tasksOpen: openTasks,
          tasksDone: doneTasks,
        },
      });
      const plan = getOrCreateCapitalPlan(partnerId!);
      if (!cancelled) setState({ status: 'ready', partner, overallScore, plan });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your readiness profile right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const partner = state.status === 'ready' ? state.partner : sessionPartner;
  const reportCount = useMemo(() => Number(partner?.journeySignals?.legacyReportCount ?? 0), [partner]);
  const letterCount = useMemo(() => Number(partner?.journeySignals?.legacyLetterCount ?? 0), [partner]);

  const hasAnyAccess = useMemo(() => {
    if (!partner) return false;
    return hasEntitlement(partner.id, 'wealth_paths_access') || hasEntitlement(partner.id, 'wealth_paths_premium');
  }, [partner]);

  const fundingFocusId = useMemo(() => {
    void coachVersion;
    if (!partner) return 'lane_funding_readiness';
    return getFundingLaneFocus(partner.id)?.laneId ?? 'lane_funding_readiness';
  }, [partner, coachVersion]);

  const unlockPath = partner ? mapPortalHref('/portal/billing#plans-section') : '/pricing';

  const selectLane = (lane: (typeof LANES)[number]) => {
    if (!partner) return;
    saveFundingLaneFocus(partner.id, { laneId: lane.id, laneTitle: lane.title });
    setCoachVersion((v) => v + 1);
  };

  const runHandoff = () => {
    if (!partner || handoffBusy) return;
    setHandoffBusy(true);
    void submitPartnerFundingHandoff(partner).then((r) => {
      setHandoffBusy(false);
      if (r.ok) {
        refresh();
        const next = r.doThisNext?.length ? `\n\nNext:\n• ${r.doThisNext.join('\n• ')}` : '';
        window.alert(`${r.title}\n\n${r.message}${next}`);
      } else {
        window.alert(`${r.title || 'Funding handoff'}\n\n${r.message || r.error}${r.hint ? `\n\n${r.hint}` : ''}`);
      }
    });
  };

  const askFinelyPrompt = 'What is blocking my funding readiness score right now?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Goals & readiness' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderRunwayBody = (
    overallScore: PartnerOverallScoreResult | null,
    plan: CapitalReadinessPlan | null,
    demoMode: boolean,
  ) => {
    const capitalScore = plan && partner ? computeReadinessScore(plan, buildReadinessScoreExtras(partner.id, partner)) : 0;
    const readinessScore = overallScore?.overall || capitalScore;
    const blockers = overallScore?.topActions ?? [];
    const strengths = overallScore?.categories.filter((c) => c.score >= 80 && c.missing.length === 0) ?? [];
    const lenderPaths = plan?.relationships.filter(
      (r) => r.stage === 'targeted' || r.stage === 'active_applications',
    ) ?? [];

    return (
      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="passport-focus">
        <div className="fc-wlp-readiness-workbench">
          <nav className="fc-wlp-readiness-nav" aria-label="Readiness sections">
            {RUNWAY_NODES.map((node, index) => {
              const active = runwayView === node.id;
              const meta =
                node.id === 'score' && plan
                  ? `${readinessScore}/100`
                  : node.id === 'lanes'
                    ? `${LANES.length} programs`
                    : node.id === 'ladder'
                      ? 'Vendor ladder'
                      : 'Funding strip';
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`fc-wlp-readiness-nav-item ${finelyOsCatalogCard(node.accent)}`}
                  data-fc-accent={node.accent}
                  data-active={active ? 'true' : undefined}
                  onClick={() => setRunwayView(node.id)}
                >
                  <span className="fc-wlp-readiness-nav-marker">{index + 1}</span>
                  <span>
                    <strong>{node.label}</strong>
                    <em>{meta}</em>
                  </span>
                </button>
              );
            })}

            {blockers.length > 0 ? (
              <div className={`${finelyOsCatalogCard('rose')} p-4 lg:p-5`} data-fc-accent="rose">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Blockers</div>
                <div className="fc-wlp-readiness-blocker-stack">
                  {blockers.slice(0, 3).map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      className="fc-wlp-readiness-blocker-btn"
                      onClick={() => navigate(action.path ?? livePath)}
                    >
                      {action.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>

          <div className="fc-wlp-readiness-stage space-y-6">
            {runwayView === 'overview' && partner ? (
          <div className="space-y-6">
            <PartnerFundingCommandStrip
              partner={partner}
              reportCount={reportCount}
              letterCount={letterCount}
              onApply={runHandoff}
            />
            <FinelyBridgeConnectorPanel
              partner={partner}
              reportCount={reportCount}
              letterCount={letterCount}
              mode="origination"
              onPartnerRefresh={() => refresh()}
            />
            {!features.wealthPaths ? (
              <div className={`${FINELY_OS_NOTICE_WARN} space-y-2 p-4`}>
                <div className="inline-flex items-center gap-2 text-fuchsia-200">
                  <Lock size={18} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Module gated</span>
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  Wealth Paths are currently disabled in settings. Enable them in admin settings → Features.
                </div>
              </div>
            ) : null}
            {features.wealthPaths && !hasAnyAccess && !demoMode ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>
                You don&apos;t have access to Wealth Paths yet. Choose a Wealth Builder program to unlock lanes.
              </div>
            ) : null}
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
              <div className={`inline-flex items-center gap-2 ${finelyOsStatusChip('warn')}`}>
                <Crown size={14} /> Wealth Builder
              </div>
              <p className={`max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Lane-based programs unlock after your build — funding readiness, business credit, and Nora Capital connection.
              </p>
              <button type="button" onClick={() => navigate(unlockPath)} className={FINELY_OS_SUCCESS_BTN}>
                {partner ? 'Unlock in Billing' : 'View Wealth Builder pricing'} <ArrowRight size={14} />
              </button>
            </div>
            {overallScore ? (
              <ProfileGoalsReadinessPanel partner={partner} overallScore={overallScore} onSaved={() => refresh()} surface="light" />
            ) : null}
          </div>
        ) : null}

        {runwayView === 'lanes' && partner ? (
          <div className="space-y-6">
            <PartnerLaneCoachPanel
              partnerId={partner.id}
              partnerName={partner.profile.fullName}
              lane="funding"
              focusId={fundingFocusId}
              compact
              coachSubtitle="Wealth path specialist — funding readiness, vendor ladder, or Nora handoff"
            />
            <div className="grid md:grid-cols-2 gap-6">
              {LANES.map((lane, idx) => {
                const locked = lane.entitlementKey ? !hasEntitlement(partner.id, lane.entitlementKey) : false;
                const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
                return (
                  <div key={lane.id} className={`${finelyOsCatalogCard(accent)} p-6 lg:p-8 ${locked ? 'opacity-80' : ''}`} data-fc-accent={accent}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-sky-500 text-white grid place-items-center shrink-0 shadow-[0_10px_18px_-12px_rgba(14,165,233,0.95)]">
                          {lane.icon}
                        </div>
                        <div className="space-y-1">
                          <div className={FINELY_OS_ENTITY_VALUE}>{lane.title}</div>
                          <div className={FINELY_OS_ENTITY_BODY}>{lane.subtitle}</div>
                        </div>
                      </div>
                      {locked ? (
                        <div className={`inline-flex items-center gap-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          <Lock size={14} /> Locked
                        </div>
                      ) : null}
                    </div>
                    <p className={`mt-4 ${FINELY_OS_ENTITY_BODY} leading-relaxed`}>{lane.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {locked ? (
                        <button type="button" onClick={() => navigate(unlockPath)} className={FINELY_OS_SECONDARY_BTN}>
                          Unlock in Billing <ArrowRight size={14} />
                        </button>
                      ) : lane.id === 'lane_nora_capital' && noraOn ? (
                        <>
                          <button type="button" disabled={handoffBusy} onClick={runHandoff} className={FINELY_OS_SUCCESS_BTN}>
                            Apply for funding <ArrowRight size={14} />
                          </button>
                          <button type="button" onClick={() => setRunwayView('score')} className={FINELY_OS_SECONDARY_BTN}>
                            View readiness <ArrowRight size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            selectLane(lane);
                            setRunwayView('overview');
                          }}
                          className={FINELY_OS_SUCCESS_BTN}
                        >
                          Open lane <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {runwayView === 'ladder' && partner ? <FundingLadderPanel partnerId={partner.id} /> : null}

        {runwayView === 'score' && plan ? (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Planning profile</div>
              <div className={`text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{readinessScore}/100</div>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Readiness is a planning profile — not an approval. Every recommendation links to evidence.
              </p>
              <button type="button" onClick={() => navigate(mapPortalHref('/portal/lender-logic'))} className={FINELY_OS_PRIMARY_BTN}>
                Open lender logic <ArrowRight size={14} />
              </button>
            </div>
            <div className={`lg:col-span-7 space-y-4`}>
              {blockers.length > 0 ? (
                <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-3`} data-fc-accent="rose">
                  <div className="inline-flex items-center gap-2"><ShieldCheck size={18} /><span className={FINELY_OS_ENTITY_SUBLABEL}>Active blockers</span></div>
                  {blockers.slice(0, 5).map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => navigate(action.path ?? livePath)}
                      className={`w-full text-left ${finelyOsInlineListItem()} p-4`}
                    >
                      <div className={FINELY_OS_ENTITY_VALUE}>{action.title}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{action.desc}</div>
                    </button>
                  ))}
                </div>
              ) : null}
              {strengths.length > 0 ? (
                <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
                  <div className="inline-flex items-center gap-2"><CheckCircle2 size={18} /><span className={FINELY_OS_ENTITY_SUBLABEL}>Current strengths</span></div>
                  {strengths.slice(0, 4).map((cat) => (
                    <div key={cat.key} className={finelyOsInlineListItem()}>
                      <div className={FINELY_OS_ENTITY_VALUE}>{cat.label}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Score {cat.score}/100 — evidence supported.</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {lenderPaths.length > 0 ? (
                <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
                  <div className="inline-flex items-center gap-2"><Landmark size={18} /><span className={FINELY_OS_ENTITY_SUBLABEL}>Lender paths</span></div>
                  {lenderPaths.slice(0, 3).map((rel) => (
                    <div key={rel.id} className={finelyOsInlineListItem()}>
                      <div className={FINELY_OS_ENTITY_VALUE}>{rel.lenderName}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{rel.notes?.trim() || 'Planning match — not an approval.'}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
          </div>

          <aside className="fc-wlp-readiness-inspector">
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Readiness score</div>
              <div className={`text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{readinessScore}/100</div>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Planning profile — not an approval. Every recommendation links to evidence.
              </p>
              <button type="button" onClick={() => setRunwayView('score')} className={FINELY_OS_SECONDARY_BTN}>
                Score breakdown <ArrowRight size={14} />
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Strengths</div>
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{strengths.length}</div>
              <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {strengths.length ? strengths.slice(0, 2).map((i) => i.label).join(' · ') : 'Complete profile fields'}
              </p>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Lender paths</div>
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{lenderPaths.length}</div>
              <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {lenderPaths.length ? 'Planning matches — not approvals' : 'Add relationships in wealth paths'}
              </p>
            </div>

            <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-3`} data-fc-accent="rose">
              <div className="fc-wlp-eyebrow">Next step</div>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Every recommendation shows the reason and source behind it.</p>
              {guideActions}
              <button type="button" onClick={() => navigate(livePath)} className={FINELY_OS_PRIMARY_BTN}>
                Update readiness profile
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  };

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Goals & readiness'}
        title={demoSpec?.title ?? 'Understand the score, the evidence, and the next improvement.'}
        description={demoSpec?.description ?? 'Readiness is a planning profile—not an approval—and every recommendation explains what supports it.'}
        status={`${demoSpec?.status ?? '72/100 · Building'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Update readiness profile'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {renderRunwayBody(null, null, true)}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your readiness profile" />;
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Goals & readiness"
        title="Understand the score, the evidence, and the next improvement."
        description="Readiness is a planning profile—not an approval—and every recommendation explains what supports it."
        status="Could not load your readiness profile"
        freshness="just now"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your readiness profile"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  const { overallScore, plan } = state;
  const capitalScore = computeReadinessScore(plan, buildReadinessScoreExtras(state.partner.id, state.partner));
  const readinessScore = overallScore.overall || capitalScore;
  const blockers = overallScore.topActions;
  const strengths = overallScore.categories.filter((c) => c.score >= 80 && c.missing.length === 0);
  const lenderPaths = plan.relationships.filter(
    (r) => r.stage === 'targeted' || r.stage === 'active_applications',
  );

  const metrics: ProductMetric[] = [
    { label: 'Readiness score', value: readinessScore, hint: readinessScore >= 80 ? 'Strong planning profile' : 'Target 80+ for most lender paths', accent: 'violet', icon: Target, onClick: () => setRunwayView('score') },
    { label: 'Current strengths', value: strengths.length, hint: strengths.length ? strengths.slice(0, 2).map((i) => i.label).join(' · ') : 'Complete profile fields', accent: 'emerald', icon: CheckCircle2, onClick: () => setRunwayView('score') },
    { label: 'Active blockers', value: blockers.length, hint: blockers.length ? blockers[0]?.title ?? 'See readiness plan' : 'No blockers flagged', accent: 'rose', icon: ShieldCheck, onClick: () => setRunwayView('score') },
    { label: 'Lender paths', value: lenderPaths.length, hint: lenderPaths.length ? 'Planning matches — not approvals' : 'Add relationships in wealth paths', accent: 'sky', icon: Landmark, onClick: () => setRunwayView('lanes') },
  ];

  const statusHeadline = blockers.length
    ? `${blockers.length} blocker${blockers.length === 1 ? '' : 's'} to clear`
    : readinessScore >= 80
      ? `${readinessScore}/100 · Strong planning profile`
      : `${readinessScore}/100 · Building`;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Goals & readiness"
      title="Understand the score, the evidence, and the next improvement."
      description="Readiness is a planning profile—not an approval—and every recommendation explains what supports it."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(plan.updatedAt)}
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="jewel"
      primaryAction={
        <ProductPagePrimaryAction
          label={blockers.length ? `Clear: ${blockers[0]?.title ?? 'top blocker'}` : 'Update readiness profile'}
          onClick={() => {
            if (blockers[0]?.path) navigate(blockers[0].path);
            else setRunwayView('overview');
          }}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/fundability-readiness'))}>
          Fundability hub
        </button>
      }
      metrics={metrics}
      metricTitle="Readiness factors"
      metricDescription="Strengths and constraints are shown as evidence, not decorative scores."
    >
      {renderRunwayBody(overallScore, plan, false)}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
