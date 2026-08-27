import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CircleHelp,
  FileText,
  Gavel,
  MessageSquare,
  Scale,
  Users,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { getUserDisplayName } from '../../../../auth/userProfile';
import { CASE_HELP } from '../../../../config/caseHelpProgram';
import { ROLE_WORK_SPLIT } from '../../../../config/rolePartnerPrograms';
import { RoleWorkflowPanel } from '../../../../components/workflow/RoleWorkflowPanel';
import { UnifiedTrainingPanel } from '../../../../components/training/UnifiedTrainingPanel';
import { EcfrLiveCitePanel } from '../../../debt/EcfrLiveCitePanel';
import { LawHelpByZipHelper } from '../../../debt/LawHelpByZipHelper';
import { CASE_HELP_TAB_TO_LAUNCHER } from '../../../../components/partner/roleHubLauncherPresets';
import { resolveCaseHelpHubAccess } from '../../../../lib/roleHubAccess';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
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
import './partnerCaseHelpHubSurface.css';

type CaseHelpTimelineStep = 'matters' | 'debt' | 'letters' | 'guide';

const TIMELINE_STEPS: Array<{ id: CaseHelpTimelineStep; label: string; hint: string; marker: string }> = [
  { id: 'matters', label: 'Assigned matters', hint: 'Partner files in scope', marker: '1' },
  { id: 'debt', label: 'Debt desk', hint: 'Summons & validation', marker: '2' },
  { id: 'letters', label: 'Packets & letters', hint: 'Studio + vault', marker: '3' },
  { id: 'guide', label: 'Desk guide', hint: 'Handbook & workflow', marker: '4' },
];

const TAB_QUERY_MAP: Record<string, CaseHelpTimelineStep> = {
  overview: 'matters',
  matters: 'matters',
  debt: 'debt',
  'debt-desk': 'debt',
  letters: 'letters',
  guide: 'guide',
  training: 'guide',
  operate: 'guide',
};

function CaseHelpYouRunFinelyRunsSplit() {
  const split = ROLE_WORK_SPLIT.case_help;
  const accents = ['emerald', 'violet', 'rose'] as const;
  return (
    <div className={`${finelyOsCatalogCard('rose')} space-y-4 p-6 lg:p-8`} data-fc-accent="rose">
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

export default function PartnerCaseHelpHubProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navigate = useMappedPartnerNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const [searchParams, setSearchParams] = useSearchParams();

  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Gavel;
  const accent = navItem?.accent ?? 'rose';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [activeStep, setActiveStep] = useState<CaseHelpTimelineStep>('matters');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab in TAB_QUERY_MAP) {
      setActiveStep(TAB_QUERY_MAP[tab]);
      return;
    }
    if (tab && tab in CASE_HELP_TAB_TO_LAUNCHER) {
      const mapped = CASE_HELP_TAB_TO_LAUNCHER[tab];
      if (mapped === 'matters') setActiveStep('matters');
      else if (mapped === 'letters') setActiveStep('letters');
      else if (mapped === 'training' || mapped === 'operate' || mapped === 'overview') setActiveStep('guide');
    }
  }, [searchParams]);

  const selectStep = (step: CaseHelpTimelineStep) => {
    setActiveStep(step);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', step);
      return next;
    });
  };

  const gate = useMemo(() => resolveCaseHelpHubAccess(auth.user), [auth.user]);

  const assignedCount = useMemo(() => {
    const ids = gate.membership?.permissions?.assignedPartnerIds;
    return Array.isArray(ids) ? ids.length : 0;
  }, [gate.membership]);

  const roleLabel = gate.membership?.role
    ? String(gate.membership.role).replace(/_/g, ' ')
    : gate.application?.roleTitle || 'Case desk';

  const partnersPath = mapPortalHref('/admin/partners');
  const debtPath = mapPortalHref('/portal/debt');
  const casesPath = mapPortalHref('/admin/cases');
  const messagesPath = mapPortalHref(CASE_HELP.messagesDeepLink);
  const guidePath = mapPortalHref(CASE_HELP.guidePath);
  const guideReadPath = mapPortalHref(CASE_HELP.guideReadPath);
  const publicPath = mapPortalHref(CASE_HELP.publicPath);

  const demoMetrics: ProductMetric[] = [
    { label: 'Matters', value: '2', hint: 'Assigned partner files in scope', accent: 'emerald', icon: Users },
    { label: 'Scope', value: 'Assigned', hint: 'Per-partner access only', accent: 'violet', icon: Scale },
    { label: 'Status', value: 'active', hint: 'Case desk membership', accent: 'rose', icon: Gavel },
  ];

  const renderTimelinePanel = () => (
    <>
      {activeStep === 'matters' ? (
        <div className={`${finelyOsCatalogCard('emerald')} space-y-4 p-6 lg:p-8`} data-fc-accent="emerald">
          <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Assigned matters</div>
          <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
            {assignedCount > 0
              ? `${assignedCount} partner file${assignedCount === 1 ? '' : 's'} in your scope. Open partner management or debt desk for court timelines.`
              : 'Waiting for scoped assignment. You never get raw platform-wide access.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(partnersPath)} className={FINELY_OS_PRIMARY_BTN}>
              <Users size={14} /> Partner files
            </button>
            <button type="button" onClick={() => navigate(debtPath)} className={FINELY_OS_SECONDARY_BTN}>
              <Gavel size={14} /> Debt & summons
            </button>
            <button type="button" onClick={() => navigate(casesPath)} className={FINELY_OS_SECONDARY_BTN}>
              <Scale size={14} /> Cases
            </button>
          </div>
        </div>
      ) : null}

      {activeStep === 'debt' ? (
        <div className="space-y-6">
          <div className={`${finelyOsCatalogCard('rose')} space-y-4 p-6 lg:p-8`} data-fc-accent="rose">
            <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Debt desk</div>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Court timelines, summons validation, and debt workflows for assigned partners only.
            </p>
            <button type="button" onClick={() => navigate(debtPath)} className={FINELY_OS_PRIMARY_BTN}>
              <Gavel size={14} /> Open debt & summons desk
            </button>
          </div>
          <EcfrLiveCitePanel />
          <LawHelpByZipHelper />
        </div>
      ) : null}

      {activeStep === 'letters' ? (
        <div className={`${finelyOsCatalogCard('violet')} space-y-4 p-6 lg:p-8`} data-fc-accent="violet">
          <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Packets & letters</div>
          <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
            Assemble letter and evidence packets for assigned partners. Non-attorney roles do not give legal advice.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/letters'))} className={FINELY_OS_PRIMARY_BTN}>
              <FileText size={14} /> Letter studio
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_SECONDARY_BTN}>
              Evidence vault
            </button>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/templates'))} className={FINELY_OS_SECONDARY_BTN}>
              Templates
            </button>
          </div>
        </div>
      ) : null}

      {activeStep === 'guide' ? (
        <>
          <CaseHelpYouRunFinelyRunsSplit />
          <UnifiedTrainingPanel audience="credit_specialist" specialties={['debt_legal']} />
          <RoleWorkflowPanel roleId="case_help" compact />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(guideReadPath)} className={FINELY_OS_PRIMARY_BTN}>
              <BookOpen size={14} /> Read the handbook
            </button>
            <button type="button" onClick={() => navigate(messagesPath)} className={FINELY_OS_SECONDARY_BTN}>
              <MessageSquare size={14} /> Case desk line
            </button>
          </div>
        </>
      ) : null}
    </>
  );

  const timelineLayout = (
    <div className="fc-casehelp-timeline-layout" data-surface-layout="timeline">
      <nav className="fc-casehelp-timeline" aria-label="Matter timeline">
        {TIMELINE_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className="fc-casehelp-timeline-step"
            data-active={activeStep === step.id ? 'true' : undefined}
            onClick={() => selectStep(step.id)}
          >
            <span className="fc-casehelp-timeline-marker">{step.marker}</span>
            <span>
              <div className="fc-casehelp-timeline-label">{step.label}</div>
              <div className="fc-casehelp-timeline-hint">
                {step.id === 'matters' && assignedCount ? `${assignedCount} in scope` : step.hint}
              </div>
            </span>
          </button>
        ))}
      </nav>
      <div className="fc-casehelp-timeline-panel">
        <h2 className="fc-casehelp-timeline-panel-title">
          {TIMELINE_STEPS.find((s) => s.id === activeStep)?.label}
        </h2>
        {renderTimelinePanel()}
      </div>
    </div>
  );

  const askFinelyPrompt = 'What should I prepare on my next assigned matter?';

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="case-help-hub"
        eyebrow="Case Help"
        title="Case Help"
        description="Scoped partner matters — packets, letters, and logged sessions. Not platform-wide access."
        status="Demo workspace · sample desk metrics"
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label="Open matters" onClick={() => selectStep('matters')} />}
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(guideReadPath)}>
            Case desk guide
          </button>
        }
        metrics={demoMetrics}
        metricTitle="Desk snapshot"
        metricDescription="Assigned matters, scope, and membership status for your seat."
      >
        <section className="fc-wlp-section">
          {timelineLayout}
          <ProductEmptyState
            title="Sign in for assigned matters"
            description="Demo mode shows the matter timeline — sign in after admin approval to work scoped partner files."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                Sign in
              </button>
            }
          />
        </section>
        <p className={`fc-wlp-section-description fc-wlp-compliance-line ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Educational platform roles · not an offer of employment · results vary · not legal advice
        </p>
      </ProductHubScaffold>
    );
  }

  if (!auth.user) {
    return <ProductDashboardSkeleton label="Loading case desk workspace" />;
  }

  if (!gate.allowed) {
    const blockedMetrics: ProductMetric[] = [
      { label: 'Matters', value: String(assignedCount), hint: 'Assigned partner files', accent: 'emerald', icon: Users },
      { label: 'Scope', value: 'Assigned', hint: 'Per-partner access only', accent: 'violet', icon: Scale },
      {
        label: 'Status',
        value: gate.membership?.status ?? '—',
        hint: CASE_HELP.accessNote,
        accent: 'rose',
        icon: Gavel,
      },
    ];

    return (
      <ProductHubScaffold
        role={role}
        pageId="case-help-hub"
        eyebrow="Case Help"
        title="Case Help"
        description="Scoped partner matters — packets, letters, and logged sessions. Not platform-wide access."
        status={gate.message}
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant="jewel"
        primaryAction={
          gate.cta ? (
            <ProductPagePrimaryAction label={gate.cta.label} onClick={() => navigate(gate.cta!.path)} />
          ) : (
            <ProductPagePrimaryAction label="Case desk guide" onClick={() => navigate(guidePath)} />
          )
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(publicPath)}>
            Case desk careers
          </button>
        }
        metrics={blockedMetrics}
        metricTitle="Desk snapshot"
        metricDescription="Hub access opens after admin approval and account claim."
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title="Case desk access required"
            description={gate.message}
            action={
              gate.cta ? (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(gate.cta!.path)}>
                  {gate.cta.label}
                </button>
              ) : (
                <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(guidePath)}>
                  <BookOpen size={14} /> Case desk guide
                </button>
              )
            }
          />
        </section>
        <p className={`fc-wlp-section-description fc-wlp-compliance-line ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
          Educational platform roles · not an offer of employment · results vary · not legal advice
        </p>
      </ProductHubScaffold>
    );
  }

  const metrics: ProductMetric[] = [
    {
      label: 'Matters',
      value: String(assignedCount),
      hint:
        assignedCount > 0
          ? `${assignedCount} partner file${assignedCount === 1 ? '' : 's'} in your scope`
          : 'Waiting for scoped assignment',
      accent: 'emerald',
      icon: Users,
      onClick: () => selectStep('matters'),
    },
    {
      label: 'Scope',
      value: 'Assigned',
      hint: 'Per-partner access — never platform-wide',
      accent: 'violet',
      icon: Scale,
    },
    {
      label: 'Status',
      value: gate.membership?.status || 'active',
      hint: roleLabel,
      accent: 'rose',
      icon: Gavel,
    },
  ];

  const statusHeadline =
    assignedCount > 0
      ? `${assignedCount} assigned matter${assignedCount === 1 ? '' : 's'}`
      : 'Waiting for scoped assignment';

  const primaryLabel = assignedCount > 0 ? 'Open matters' : 'Wait for assignment';
  const primaryAction = assignedCount > 0 ? () => selectStep('matters') : () => navigate(guideReadPath);

  return (
    <ProductHubScaffold
      role={role}
      pageId="case-help-hub"
      eyebrow="Case Help"
      title="Case Help"
      description="Scoped partner matters — packets, letters, and logged sessions. Not platform-wide access."
      status={`${statusHeadline}${getUserDisplayName(auth.user) ? ` · ${getUserDisplayName(auth.user)}` : ''} · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant="jewel"
      primaryAction={<ProductPagePrimaryAction label={primaryLabel} onClick={primaryAction} />}
      secondaryAction={
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Case Help' })}
        >
          <CircleHelp size={15} /> Ask Finely
        </button>
      }
      metrics={metrics}
      metricTitle="Desk snapshot"
      metricDescription="Assigned count, scope discipline, and membership status at a glance."
    >
      <section className="fc-wlp-section">{timelineLayout}</section>
      <p className={`fc-wlp-section-description fc-wlp-compliance-line ${FINELY_OS_COMPLIANCE_FOOTNOTE}`}>
        Educational platform roles · attorney applicants must be licensed where they practice · results vary · not legal advice
      </p>
    </ProductHubScaffold>
  );
}
