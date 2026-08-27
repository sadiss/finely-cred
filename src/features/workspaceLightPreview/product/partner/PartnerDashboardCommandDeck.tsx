import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileText,
  FolderOpen,
  Landmark,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import type { Partner } from '../../../../domain/partners';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { listTasksByPartner } from '../../../../data/tasksRepo';
import { listPartnerPortalTasks } from '../../../../lib/workVisibility';
import { listCasesByPartner } from '../../../../data/casesRepo';
import { listDebtByPartner } from '../../../../data/debtRepo';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import { computeMiddleScore } from '../../../../domain/creditScoreMiddle';
import { openCommunicationHub } from '../../../../components/chat/communicationHubModel';
import { DashboardFundingPanel } from '../../../../components/dashboard/DashboardFundingPanel';
import { FinelyNoticedStrip } from '../../../../components/tours/FinelyNoticedStrip';
import { PartnerDashboardWorkstationMosaic } from './PartnerDashboardWorkstationMosaic';
import { PartnerDashboardPartnerFileStrip } from './PartnerDashboardPartnerFileStrip';
import { FinelyNowDoThisStrip } from '../../../../components/tours/FinelyNowDoThisStrip';
import { buildPortalNoticedItems } from '../../../../lib/finelyProactiveSignals';
import { computePartnerOverallScore } from '../../../../utils/partnerOverallScore';
import type { PartnerCommandCenterModel } from '../data/workspacePreviewModels';
import { buildPartnerWorkspaceIntelligence, type WorkspaceIntelligenceSignal } from '../data/workspaceProductIntelligence';
import { resolveWorkspaceProductPath } from '../workspaceProductNav';
import { accentAt, arrangeAccents } from '../workspaceAccentArrangement';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import {
  ProductActionList,
  ProductActivityDeck,
  ProductCommandHeader,
  ProductIntelligenceCallout,
  ProductIntelligenceDrawer,
  ProductPanel,
  ProductProgressRail,
  ProductSectionHeader,
  ProductStatusPill,
} from '../components/ProductUi';
import { ProductSignalRail } from '../components/ProductSignalRail';
import { ProductAnimatedNumber, ProductReadinessGauge, ProductWelcomeReveal } from '../components/ProductMotion';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PAGE,
} from '../../../os/finelyOsLightUi';
import './partnerDashboardCommandDeck.css';

const ACTION_ICONS: Record<PartnerCommandCenterModel['actions'][number]['kind'], LucideIcon> = {
  report: FileText,
  letter: Mail,
  document: UploadCloud,
  message: MessageSquare,
  task: CheckCircle2,
};

const PARTNER_METRIC_ICONS: Record<string, LucideIcon> = {
  reports: FileText,
  letters: Mail,
  evidence: FolderOpen,
  tasks: CheckCircle2,
};

const BUREAU_SCORE_BRIGHT_VARS = arrangeAccents(3, { columns: 3 }).map(
  (accent) => `var(--wlp-${accent}-bright)`,
);

type PartnerDashboardCommandDeckProps = {
  partner: Partner;
  model: PartnerCommandCenterModel;
  dataMode: 'demo' | 'real';
  onRefresh?: () => void;
};

export function PartnerDashboardCommandDeck({
  partner,
  model,
  dataMode,
  onRefresh,
}: PartnerDashboardCommandDeckProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationMode = pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';
  const [selectedInsight, setSelectedInsight] = useState<WorkspaceIntelligenceSignal | null>(null);

  const go = useCallback(
    (target: string) => navigate(resolveWorkspaceProductPath('partner', target, navigationMode)),
    [navigate, navigationMode],
  );

  useEffect(() => {
    if (searchParams.get('chat') !== '1') return;
    openCommunicationHub({ tab: 'ai', expanded: true });
    const next = new URLSearchParams(searchParams);
    next.delete('chat');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);
  const evidence = useMemo(() => listEvidenceByPartner(partner.id), [partner.id]);
  const tasks = useMemo(() => listPartnerPortalTasks(listTasksByPartner(partner.id)), [partner.id]);
  const cases = useMemo(() => listCasesByPartner(partner.id), [partner.id]);
  const debtCases = useMemo(() => listDebtByPartner(partner.id), [partner.id]);
  const letters = useMemo(() => listLettersByPartner(partner.id), [partner.id]);

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'completed');
  const openCases = cases.filter((c) => c.status === 'open');
  const openDebt = debtCases.filter((d) => d.status === 'open' || d.status === 'in_review');

  const overallScore = useMemo(
    () =>
      computePartnerOverallScore({
        partner,
        counts: {
          reports: reports.length,
          evidence: evidence.length,
          tasksOpen: openTasks.length,
          tasksDone: doneTasks.length,
          casesOpen: openCases.length + openDebt.length,
          lettersGenerated: letters.length,
        },
      }),
    [partner, reports.length, evidence.length, openTasks.length, doneTasks.length, openCases.length, openDebt.length, letters.length],
  );

  const middleScore = useMemo(() => {
    const parsed = reports[0]?.parsed?.scores ?? [];
    return parsed.length ? computeMiddleScore(parsed).value : null;
  }, [reports]);

  const intelligence = useMemo(() => buildPartnerWorkspaceIntelligence(model), [model]);
  const metricAccents = useMemo(() => arrangeAccents(model.metrics.length), [model.metrics.length]);
  const lenderAccents = useMemo(() => arrangeAccents(model.lenders.length, { columns: 3 }), [model.lenders.length]);
  const doNextIndex = reports.length === 0 ? 0 : openCases.length === 0 ? 1 : letters.length === 0 ? 2 : 3;
  const displayName = partner.profile.fullName?.trim() || 'Partner';
  const askFinelyPrompt = 'What should I do next on my credit plan?';

  const signalItems = useMemo(
    () =>
      model.metrics.map((metric, index) => ({
        id: metric.id,
        label: metric.label,
        value: metric.value,
        hint: metric.hint,
        accent: metricAccents[index],
        icon: PARTNER_METRIC_ICONS[metric.id] ?? Sparkles,
        onClick: () => go(metric.route),
        featured: index === 0,
      })),
    [go, metricAccents, model.metrics],
  );

  const actions = model.actions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    status: action.status,
    statusLabel: action.statusLabel,
    meta: action.meta,
    icon: ACTION_ICONS[action.kind],
    onClick: () => go(action.route),
  }));

  const livePulse = [
    { accent: 'emerald' as const, label: `${reports.length} report${reports.length === 1 ? '' : 's'}` },
    { accent: 'violet' as const, label: `${letters.length} letter${letters.length === 1 ? '' : 's'}` },
    { accent: 'sky' as const, label: `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}` },
    { accent: 'rose' as const, label: `${openCases.length + openDebt.length} active case${openCases.length + openDebt.length === 1 ? '' : 's'}` },
  ];

  return (
    <div className={`fc-partner-command-deck ${FINELY_OS_PAGE}`} data-surface-layout="command-deck" data-fc-partner-portal="1">
      <ProductCommandHeader
        roleLabel={`${model.planLabel} · ${dataMode === 'demo' ? 'demo snapshot' : 'live partner file'}`}
        title={
          <span className="fc-partner-welcome-stack">
            <span className="fc-partner-welcome-name">{displayName}</span>
            <ProductWelcomeReveal
              text="Welcome back."
              storageKey={`partner-deck-${model.id}`}
            />
          </span>
        }
        description={model.primaryAlert.description}
        status={model.stageLabel}
        freshness={model.freshness}
        primaryAction={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => go(model.primaryAlert.route)}>
            {model.primaryAlert.title} <ArrowRight size={15} />
          </button>
        }
        secondaryAction={
          <button
            type="button"
            className="fc-wlp-btn-secondary"
            onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Dashboard' })}
          >
            <CircleHelp size={15} /> Ask Finely
          </button>
        }
        insight={
          <ProductIntelligenceCallout
            signal={intelligence.priority}
            dark
            onOpen={() => setSelectedInsight(intelligence.priority)}
          />
        }
      >
        <div className="fc-partner-command-pulse" aria-label="Live workspace signals">
          {livePulse.map((item) => (
            <span key={item.label}>
              <i data-accent={item.accent} /> {item.label}
            </span>
          ))}
          <em>Live partner file</em>
        </div>
        <div className="fc-wlp-score-grid" aria-label="Latest credit scores">
          {model.scores.map((score, index) => (
            <button
              key={score.bureau}
              type="button"
              className="fc-wlp-score fc-partner-score-tap"
              style={
                {
                  ['--wlp-score-accent' as string]: BUREAU_SCORE_BRIGHT_VARS[index],
                } as React.CSSProperties
              }
              onClick={() => go('/portal/reports')}
            >
              <div className="fc-wlp-score-label">
                <ShieldCheck size={13} strokeWidth={2.2} />
                {score.bureau}
              </div>
              <div className="fc-wlp-score-value">
                {typeof score.value === 'number' ? <ProductAnimatedNumber value={score.value} /> : '—'}
              </div>
              {typeof score.change === 'number' ? (
                <div
                  className="fc-wlp-command-meta"
                  style={{ marginTop: 4, color: score.change >= 0 ? '#e8fff8' : '#ffd0dc' }}
                >
                  {score.change >= 0 ? '+' : ''}
                  {score.change} points
                </div>
              ) : (
                <div className="fc-wlp-command-meta" style={{ marginTop: 4 }}>
                  Open reports
                </div>
              )}
            </button>
          ))}
        </div>
      </ProductCommandHeader>

      <section className="fc-wlp-section space-y-4" aria-label="What matters now">
        <ProductSectionHeader
          eyebrow="Partner home"
          title="What matters now"
          description="Signals from your file and one guided step to keep your restore plan moving."
        />
        <FinelyNoticedStrip
          surface="light"
          items={buildPortalNoticedItems({
            reportsCount: reports.length,
            lettersCount: letters.length,
            openCasesCount: openCases.length,
            evidenceCount: evidence.length,
            overallScore: overallScore?.overall ?? null,
          })}
        />
        <FinelyNowDoThisStrip surface="light" currentIndex={doNextIndex} />
      </section>

      <section className="fc-wlp-section">
        <ProductSectionHeader
          eyebrow="Credit workspace"
          title="Reports, letters, and open work"
          description="Each signal opens the report, letter, document, or task behind it."
        />
        <ProductSignalRail label="Live workspace signals" items={signalItems} />
      </section>

      <section className="fc-wlp-section">
        <ProductSectionHeader
          eyebrow="Restore journey"
          title="Where you are in the plan"
          description="Completed steps stay visible. Your current step is highlighted."
        />
        <ProductProgressRail steps={model.journey} />
      </section>

      <div className="fc-wlp-focus-band" data-fcm-accent="violet">
        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Your next step"
            title="Priority actions"
            description="Start with the featured action. Other steps stay nearby until you need them."
            action={
              <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/portal/reports')}>
                Open reports <ArrowRight size={13} />
              </button>
            }
          />
          <div className="fc-wlp-grid-7-5">
            <ProductActionList items={actions} />
            <div className="fc-wlp-passport-column">
              <div className="fc-wlp-passport-heading">
                <div>
                  <div className="fc-wlp-eyebrow">Funding readiness</div>
                  <h3 className="fc-wlp-panel-title">Your progress pass</h3>
                  <p className="fc-wlp-panel-subtitle">{model.readiness.target}</p>
                </div>
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/portal/readiness')}>
                  Full details
                </button>
              </div>
              <button
                type="button"
                className="fc-wlp-passport"
                onClick={() => go('/portal/readiness')}
                aria-label={`Open funding readiness. Score ${model.readiness.score} out of 100.`}
              >
                <span className="fc-wlp-passport-top">
                  <span>
                    <span className="fc-wlp-passport-brand">Finely Cred</span>
                    <span className="fc-wlp-passport-name">Progress pass</span>
                  </span>
                  <span className="fc-wlp-passport-mark">
                    <Sparkles size={20} strokeWidth={2.1} />
                  </span>
                </span>
                <span className="fc-wlp-passport-main">
                  <span className="fc-wlp-passport-target">
                    <span>Capital target</span>
                    <strong>{model.readiness.capitalGoal}</strong>
                  </span>
                  <ProductReadinessGauge score={model.readiness.score} />
                </span>
                <span className="fc-wlp-passport-bottom">
                  <ProductStatusPill
                    status={model.readiness.score >= 80 ? 'ready' : 'in_progress'}
                    label={model.readiness.label}
                  />
                  <span className="fc-wlp-passport-open">
                    {intelligence.readiness.confidence} confidence · View plan <ArrowRight size={15} />
                  </span>
                </span>
              </button>
              <ProductIntelligenceCallout
                signal={intelligence.readiness}
                onOpen={() => setSelectedInsight(intelligence.readiness)}
              />
            </div>
          </div>
        </section>

        <section className="fc-wlp-section" aria-label="Funding overview">
          <DashboardFundingPanel
            partner={partner}
            creditScore={middleScore}
            creditScoreLabel="Middle bureau score"
            scoreFromReport={Boolean(reports[0]?.parsed?.scores?.length)}
            overallScore={overallScore}
            onSaved={onRefresh}
          />
        </section>
      </div>

      <section className="fc-wlp-section" aria-label="Lender fit signals">
        <ProductSectionHeader
          eyebrow="Lender fit"
          title="Live lender signals"
          description={
            dataMode === 'demo'
              ? 'Demo snapshot — connect a partner file for live lender planning signals.'
              : 'Based on your score, utilization, and location. Not an approval or guarantee.'
          }
          action={
            <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/portal/lender-logic')}>
              Full lender logic <ArrowRight size={13} />
            </button>
          }
        />
        {model.lenders.length ? (
          <ProductSignalRail
            label="Lender fit signals"
            items={model.lenders.map((lender, index) => ({
              id: lender.id,
              label: lender.name,
              value: `${lender.match}%`,
              hint: `${lender.product} · ${lender.reason}`,
              accent: lenderAccents[index] ?? lender.accent,
              icon: Landmark,
              onClick: () => go('/portal/lender-logic'),
              featured: index === 0,
            }))}
          />
        ) : (
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Complete your goals and report upload to unlock lender fit signals.
          </p>
        )}
      </section>

      <section className="fc-wlp-section">
        <ProductPanel
          title="Recent progress"
          subtitle="Changes across your workspace"
          accent="rose"
          action={
            <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/portal/messages')}>
              Message specialist <MessageSquare size={13} />
            </button>
          }
        >
          {model.activity.length ? (
            <ProductActivityDeck
              items={model.activity.map((item, index) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                time: item.time,
                status: item.status,
                icon: TrendingUp,
                accent: accentAt(index, { parent: 'rose' }),
                onClick: () => go(item.route),
              }))}
            />
          ) : (
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Uploads, completed tasks, and mailed letters will appear here.
            </p>
          )}
        </ProductPanel>
      </section>

      <PartnerDashboardWorkstationMosaic
        partnerId={partner.id}
        dataMode={dataMode}
        stats={{
          reports: reports.length,
          openCases: openCases.length,
          openDebt: openDebt.length,
          letters: letters.length,
          readinessScore: model.readiness.score,
        }}
        onOpen={go}
      />

      <PartnerDashboardPartnerFileStrip
        partner={partner}
        reportCount={reports.length}
        letterCount={letters.length}
        onRefresh={onRefresh}
      />

      <p className="fc-wlp-section-description fc-partner-command-disclosure">
        Results vary · not legal advice · funding subject to underwriting
      </p>

      <ProductIntelligenceDrawer signal={selectedInsight} onClose={() => setSelectedInsight(null)} />
    </div>
  );
}
