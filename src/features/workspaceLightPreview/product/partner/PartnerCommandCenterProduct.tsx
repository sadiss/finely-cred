import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  FolderOpen,
  Gavel,
  Landmark,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PartnerCommandCenterModel } from '../data/workspacePreviewModels';
import {
  ProductActionList,
  ProductActivityDeck,
  ProductCommandHeader,
  ProductDrawer,
  ProductEmptyState,
  ProductIntelligenceCallout,
  ProductIntelligenceDrawer,
  ProductPanel,
  ProductProgressRail,
  ProductSectionHeader,
  ProductStatusPill,
  ProductWorkspaceDock,
} from '../components/ProductUi';
import { ProductSignalRail } from '../components/ProductSignalRail';
import { ProductCardObject } from '../components/ProductCardObject';
import {
  ProductAnimatedNumber,
  ProductReadinessGauge,
  ProductWelcomeReveal,
} from '../components/ProductMotion';
import {
  buildPartnerWorkspaceIntelligence,
  type WorkspaceIntelligenceSignal,
} from '../data/workspaceProductIntelligence';
import { resolveWorkspaceProductPath } from '../workspaceProductNav';
import { accentAt, arrangeAccents } from '../workspaceAccentArrangement';

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

const PARTNER_WORKSPACE_DOCK = [
  { id: 'reports', title: 'Credit reports', description: 'Upload bureau files, inspect tradelines, and review findings', icon: FileText, route: '/preview/workspace-light/portal/reports' },
  { id: 'evidence', title: 'Evidence vault', description: 'Source exhibits, bureau replies, and proof tied to findings', icon: ShieldCheck, route: '/preview/workspace-light/portal/evidence' },
  { id: 'disputes', title: 'Disputes', description: 'Rounds, findings, statuses, and outcomes', icon: Gavel, route: '/preview/workspace-light/portal/disputes' },
  { id: 'letters', title: 'Credit letters', description: 'Build, review, approve, download, and track letters', icon: Mail, route: '/preview/workspace-light/portal/letters' },
  { id: 'documents', title: 'Documents', description: 'ID, proof of address, statements, and your paperwork', icon: FolderOpen, route: '/preview/workspace-light/portal/documents' },
  { id: 'goals', title: 'Goals & readiness', description: 'Capital target, blockers, and lender alignment', icon: Target, route: '/preview/workspace-light/portal/readiness' },
  { id: 'calendar', title: 'Sessions & calendar', description: 'Book a session and see upcoming milestones', icon: Calendar, route: '/preview/workspace-light/portal/calendar' },
] as const;

const BUREAU_SCORE_BRIGHT_VARS = arrangeAccents(3, { columns: 3 }).map(
  (accent) => `var(--wlp-${accent}-bright)`,
);

type SelectedLender = PartnerCommandCenterModel['lenders'][number] | null;

function PartnerReadinessPass({
  readiness,
  intelligence,
  onOpen,
  onExplain,
}: {
  readiness: PartnerCommandCenterModel['readiness'];
  intelligence: WorkspaceIntelligenceSignal;
  onOpen: () => void;
  onExplain: () => void;
}) {
  return (
    <div className="fc-wlp-passport-column">
      <div className="fc-wlp-passport-heading">
        <div>
          <div className="fc-wlp-eyebrow">Funding readiness</div>
          <h3 className="fc-wlp-panel-title">Your Finely Progress Pass</h3>
          <p className="fc-wlp-panel-subtitle">{readiness.target}</p>
        </div>
        <button type="button" className="fc-wlp-btn-quiet" onClick={onOpen}>
          Full details
        </button>
      </div>

      <button
        type="button"
        className="fc-wlp-passport"
        onClick={onOpen}
        aria-label={`Open funding readiness details. Score ${readiness.score} out of 100.`}
      >
        <span className="fc-wlp-passport-top">
          <span>
            <span className="fc-wlp-passport-brand">Finely Cred</span>
            <span className="fc-wlp-passport-name">Progress Pass</span>
          </span>
          <span className="fc-wlp-passport-mark">
            <Sparkles size={20} strokeWidth={2.1} />
          </span>
        </span>

        <span className="fc-wlp-passport-main">
          <span className="fc-wlp-passport-target">
            <span>Target capital band</span>
            <strong>{readiness.capitalGoal}</strong>
          </span>
          <ProductReadinessGauge score={readiness.score} />
        </span>

        <span className="fc-wlp-passport-bottom">
          <ProductStatusPill
            status={readiness.score >= 80 ? 'ready' : 'in_progress'}
            label={readiness.label}
          />
          <span className="fc-wlp-passport-open">
            {intelligence.confidence} confidence · View profile <ArrowRight size={15} />
          </span>
        </span>
      </button>

      <div className="fc-wlp-passport-strengths">
        {readiness.strengths.slice(0, 2).map((strength) => (
          <span key={strength}>
            <CheckCircle2 size={14} strokeWidth={2.3} />
            {strength}
          </span>
        ))}
      </div>
      <ProductIntelligenceCallout signal={intelligence} onOpen={onExplain} />
      <p className="fc-wlp-passport-disclosure">Planning profile · not a credit card, approval, or offer.</p>
    </div>
  );
}

export function PartnerCommandCenterProduct({
  model,
  dataMode,
}: {
  model: PartnerCommandCenterModel;
  dataMode: 'demo' | 'real';
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navigationMode = pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';
  const go = useCallback(
    (target: string) => navigate(resolveWorkspaceProductPath('partner', target, navigationMode)),
    [navigate, navigationMode],
  );
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [selectedLender, setSelectedLender] = useState<SelectedLender>(null);
  const [selectedInsight, setSelectedInsight] = useState<WorkspaceIntelligenceSignal | null>(null);
  const intelligence = useMemo(() => buildPartnerWorkspaceIntelligence(model), [model]);
  const workspaceDockAccents = useMemo(() => arrangeAccents(PARTNER_WORKSPACE_DOCK.length, { columns: 3 }), []);
  const lenderAccents = useMemo(
    () => arrangeAccents(model.lenders.length, { columns: 3 }),
    [model.lenders.length],
  );

  const metricAccents = useMemo(() => arrangeAccents(model.metrics.length), [model.metrics.length]);

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

  const firstName = model.name.trim().split(/\s+/)[0] || 'Partner';

  return (
    <>
      <div className="fc-wlp-stack">
        <ProductCommandHeader
          roleLabel={`${model.planLabel} · ${dataMode === 'demo' ? 'demo data' : 'your live data'}`}
          title={<ProductWelcomeReveal text={`Welcome back, ${firstName}.`} storageKey={`partner-${model.id}`} />}
          description={`${model.primaryAlert.title}. ${model.primaryAlert.description}`}
          status={model.stageLabel}
          freshness={model.freshness}
          primaryAction={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => go(model.primaryAlert.route)}>
              Take next action <ArrowRight size={15} />
            </button>
          }
          secondaryAction={
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => go('/preview/workspace-light/portal/messages')}>
              <MessageSquare size={15} /> Message specialist
            </button>
          }
          insight={
            <ProductIntelligenceCallout
              signal={intelligence.priority}
              dark
              onOpen={() => setSelectedInsight(intelligence.priority)}
            />
          }
          aside={
            <ProductCardObject
              tier="platinum"
              label={model.name}
              sublabel={model.planLabel}
              issuer="Finely Cred · Member"
              status={model.readiness.label}
              size="lg"
              showChip
              showHologram
              onClick={() => setReadinessOpen(true)}
              className="fc-wlp-dashboard-member-card"
            />
          }
        >
          <div className="fc-wlp-score-grid" aria-label="Latest credit scores">
            {model.scores.map((score, index) => (
              <div
                key={score.bureau}
                className="fc-wlp-score"
                style={{
                  ['--wlp-score-accent' as string]: BUREAU_SCORE_BRIGHT_VARS[index],
                } as React.CSSProperties}
              >
                <div className="fc-wlp-score-label">
                  <ShieldCheck size={13} strokeWidth={2.2} />
                  {score.bureau}
                </div>
                <div className="fc-wlp-score-value">
                  {typeof score.value === 'number' ? <ProductAnimatedNumber value={score.value} /> : '—'}
                </div>
                {typeof score.change === 'number' ? (
                  <div className="fc-wlp-command-meta" style={{ marginTop: 4, color: score.change >= 0 ? '#e8fff8' : '#ffd0dc' }}>
                    {score.change >= 0 ? '+' : ''}{score.change} points
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </ProductCommandHeader>

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Your credit workspace"
            title="Reports, letters, and tasks"
            description="Open a metric to go to the report, letter, document, or task behind it."
          />
          <ProductSignalRail
            label="Credit workspace signals"
            items={signalItems}
          />
        </section>

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Journey"
            title="Where you are and what comes next"
            description="Completed steps stay visible, the current step is highlighted, and future work stays secondary."
          />
          <ProductProgressRail steps={model.journey} />
        </section>

        <div className="fc-wlp-focus-band" data-fcm-accent="violet">
          <section className="fc-wlp-section">
            <ProductSectionHeader
              eyebrow="Your next move"
              title="Your next step"
              description="Start with the featured action. Other steps stay nearby until you need them."
            />
            <div className="fc-wlp-grid-7-5">
              <ProductActionList items={actions} />
              <PartnerReadinessPass
                readiness={model.readiness}
                intelligence={intelligence.readiness}
                onOpen={() => setReadinessOpen(true)}
                onExplain={() => setSelectedInsight(intelligence.readiness)}
              />
            </div>
          </section>

          <section className="fc-wlp-section">
            <ProductSectionHeader
              eyebrow="Readiness intelligence"
              title="Recommended lender paths"
              description="Recommendations explain the fit and open to supporting detail. They are not approvals or guarantees."
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/preview/workspace-light/portal/lender-logic')}>
                  Full lender logic <ArrowRight size={13} />
                </button>
              }
            />
            <div className="fc-wlp-grid-8-4">
              {model.lenders.length ? (
                <div className="fc-wlp-lender-grid">
                  {model.lenders.map((lender, index) => (
                    <button
                      key={lender.id}
                      type="button"
                      className="fc-wlp-lender"
                      data-accent={lenderAccents[index]}
                      onClick={() => setSelectedLender(lender)}
                    >
                      <div className="fc-wlp-lender-head">
                        <span className="fc-wlp-lender-icon">
                          <Landmark size={21} strokeWidth={2.05} />
                        </span>
                        <ArrowRight size={16} style={{ color: 'var(--wlp-accent-ink)', opacity: 0.7 }} />
                      </div>
                      <div className="fc-wlp-lender-name">{lender.name}</div>
                      <div className="fc-wlp-lender-product">{lender.product}</div>
                      {index === 0 ? <span className="fc-wlp-lender-signal">Best current fit</span> : null}
                      <div className="fc-wlp-lender-match-row">
                        <div className="fc-wlp-lender-match">{lender.match}%</div>
                        <span className="fc-wlp-lender-match-label">Profile fit</span>
                      </div>
                      <div className="fc-wlp-lender-meter" aria-hidden>
                        <span style={{ width: `${lender.match}%` }} />
                      </div>
                      <div className="fc-wlp-metric-hint">{lender.reason}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <ProductEmptyState
                  title="Lender matches need more profile data"
                  description="Complete your goals and financial basics to unlock evidence-backed recommendations."
                  action={
                    <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/preview/workspace-light/portal/readiness')}>
                      Complete readiness profile <ArrowRight size={13} />
                    </button>
                  }
                />
              )}

              <ProductPanel
                title="Recent progress"
                subtitle="Changes across your workspace"
                accent="sky"
                action={
                  <button type="button" className="fc-wlp-btn-quiet" onClick={() => go('/portal/dashboard')}>
                    View all
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
                      accent: accentAt(index, { parent: 'sky' }),
                      onClick: () => go(item.route),
                    }))}
                  />
                ) : (
                  <ProductEmptyState
                    title="No recent progress yet"
                    description="Uploads, completed tasks, and mailed letters will appear here."
                  />
                )}
              </ProductPanel>
            </div>
          </section>
        </div>

        <section className="fc-wlp-section">
          <ProductSectionHeader
            eyebrow="Your workspace"
            title="Open the right tool in one step"
            description="Frequently used destinations stay visible. Everything else is searchable from the header."
          />
          <ProductWorkspaceDock
            items={PARTNER_WORKSPACE_DOCK.map((item, index) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              accent: workspaceDockAccents[index],
              icon: item.icon,
              onClick: () => go(item.route),
            }))}
          />
        </section>

        <p className="fc-wlp-section-description" style={{ textAlign: 'center', maxWidth: 'none' }}>
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </div>

      <ProductDrawer
        open={readinessOpen}
        title="Funding readiness details"
        subtitle={`${model.readiness.score}/100 · ${model.readiness.label}`}
        onClose={() => setReadinessOpen(false)}
      >
        <div className="fc-wlp-stack">
          <ProductPanel title="What is working" accent="emerald">
            <div className="fc-wlp-chip-mosaic">
              {model.readiness.strengths.map((strength) => (
                <span key={strength} className="fc-wlp-chip-mosaic-item" data-tone="emerald">
                  <CheckCircle2 size={15} strokeWidth={2.3} />
                  {strength}
                </span>
              ))}
            </div>
          </ProductPanel>
          <ProductPanel title="What to improve next" accent="rose">
            <div className="fc-wlp-chip-mosaic">
              {model.readiness.blockers.map((blocker) => (
                <span key={blocker} className="fc-wlp-chip-mosaic-item" data-tone="rose">
                  <Target size={15} strokeWidth={2.3} />
                  {blocker}
                </span>
              ))}
            </div>
          </ProductPanel>
          <button type="button" className="fc-wlp-btn-primary" onClick={() => go('/preview/workspace-light/portal/readiness')}>
            Open readiness plan <ArrowRight size={15} />
          </button>
        </div>
      </ProductDrawer>

      <ProductDrawer
        open={Boolean(selectedLender)}
        title={selectedLender?.name ?? 'Lender path'}
        subtitle={selectedLender?.product}
        onClose={() => setSelectedLender(null)}
      >
        {selectedLender ? (
          <div className="fc-wlp-stack">
            <div
              className="fc-wlp-panel"
              data-accent={
                selectedLender
                  ? lenderAccents[model.lenders.findIndex((lender) => lender.id === selectedLender.id)] ?? 'violet'
                  : 'violet'
              }
            >
              <div className="fc-wlp-panel-body">
                <div className="fc-wlp-eyebrow">Readiness match</div>
                <div className="fc-wlp-metric-value">{selectedLender.match}%</div>
                <p className="fc-wlp-panel-subtitle">{selectedLender.reason}</p>
              </div>
            </div>
            <p className="fc-wlp-panel-subtitle">
              This is a planning recommendation based on the information available in your workspace. Approval and terms are determined by the lender.
            </p>
            <button type="button" className="fc-wlp-btn-primary" onClick={() => go('/preview/workspace-light/portal/lender-logic')}>
              Review full lender logic <ArrowRight size={15} />
            </button>
          </div>
        ) : null}
      </ProductDrawer>

      <ProductIntelligenceDrawer signal={selectedInsight} onClose={() => setSelectedInsight(null)} />
    </>
  );
}
