import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import { usePartnerSession } from '../../../auth/PartnerSessionContext';
import { isAdminEmail } from '../../../auth/admin';
import { supabase } from '../../../lib/supabaseClient';
import { listReportsByPartner } from '../../../data/reportsRepo';
import { listEvidenceByPartner } from '../../../data/evidenceRepo';
import { listTasksByPartner } from '../../../data/tasksRepo';
import { listPartnerPortalTasks } from '../../../lib/workVisibility';
import { listCasesByPartner } from '../../../data/casesRepo';
import { listDebtByPartner } from '../../../data/debtRepo';
import { listLettersByPartner } from '../../../data/lettersRepo';
import { upsertPartner } from '../../../data/partnersRepo';
import { ensurePartnerOnboardingTasks } from '../../../lib/partnerOnboardingEngine';
import { computePartnerOverallScore } from '../../../utils/partnerOverallScore';
import { computeCreditRestorePrimaryAlert } from '../../../lib/creditRestorePrimaryAlert';
import { computeCourtPlanDashboardAlert } from '../../../lib/courtPlanDashboardAlert';
import { curatedPresetMatches, stackingSortScore } from '../../../data/localLenders';
import type { Partner } from '../../../domain/partners';
import type { Bureau } from '../../../domain/creditReports';
import { WlAppShell } from '../components';
import { useWorkspaceLightPreview } from '../useWorkspaceLightPreview';
import { PartnerDashboardCommandDeck } from '../product/partner/PartnerDashboardCommandDeck';
import { PARTNER_COMMAND_CENTER_DEMO } from '../product/data/workspacePreviewFixtures';
import type { PartnerCommandCenterModel } from '../product/data/workspacePreviewModels';
import {
  ProductCommandHeader,
  ProductDashboardSkeleton,
  ProductEmptyState,
} from '../product/components/ProductUi';

const ROUTE_LABELS: Record<string, string> = {
  personal_restore: 'Personal Credit Restore',
  personal_build: 'Personal Credit Building',
  business_build: 'Business Credit Building',
};

const STAGE_LABELS: Record<string, string> = {
  intake: 'Profile setup',
  report_upload: 'Report upload',
  report_analysis: 'Report analysis',
  strategy: 'Strategy ready',
  letters: 'Letters in progress',
  mailing: 'Mailing in progress',
  funding: 'Funding readiness',
  complete: 'Plan complete',
};

const JOURNEY_IDS = ['profile', 'reports', 'strategy', 'disputes', 'readiness'] as const;

function formatShortDate(value?: string) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function pathKind(path?: string): PartnerCommandCenterModel['actions'][number]['kind'] {
  if (path?.includes('letter')) return 'letter';
  if (path?.includes('document')) return 'document';
  if (path?.includes('report')) return 'report';
  if (path?.includes('message')) return 'message';
  return 'task';
}

function demoPartnerFromFixture(): Partner {
  const demo = PARTNER_COMMAND_CENTER_DEMO;
  return {
    id: demo.id,
    status: 'active',
    profile: { fullName: demo.name, email: 'jordan.ellis@example.com' },
    primaryRoute: 'personal_restore',
    journeyStage: 'letters',
    routes: {
      personal_restore: {
        score: demo.scores[1]?.value ?? 695,
        fundingTarget: 35_000,
        personal: { postalCode: '30301', state: 'GA', city: 'Atlanta' },
      },
    },
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  } as Partner;
}

function buildPartnerModel(partner: Partner): PartnerCommandCenterModel {
  const reports = listReportsByPartner(partner.id);
  const evidence = listEvidenceByPartner(partner.id);
  const tasks = listPartnerPortalTasks(listTasksByPartner(partner.id));
  const cases = listCasesByPartner(partner.id);
  const debt = listDebtByPartner(partner.id);
  const letters = listLettersByPartner(partner.id);
  const openTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress');
  const doneTasks = tasks.filter((task) => task.status === 'completed');
  const openCases = cases.filter((item) => item.status === 'open');
  const openDebt = debt.filter((item) => item.status === 'open' || item.status === 'in_review');

  const readiness = computePartnerOverallScore({
    partner,
    counts: {
      reports: reports.length,
      evidence: evidence.length,
      tasksOpen: openTasks.length,
      tasksDone: doneTasks.length,
      casesOpen: openCases.length + openDebt.length,
      lettersGenerated: letters.length,
    },
  });

  const restoreAlert = computeCreditRestorePrimaryAlert({
    reportsCount: reports.length,
    hasParsedReport: reports.some((report) => Boolean(report.parsed)),
    letters,
    debtCases: debt,
    partnerId: partner.id,
  });
  const courtPlanAlert = computeCourtPlanDashboardAlert(partner.id);
  const dashboardAlert = restoreAlert.show ? restoreAlert : courtPlanAlert.show ? courtPlanAlert : null;

  const scores = reports[0]?.parsed?.scores ?? [];
  const scoreFor = (bureau: Bureau) => {
    const values = scores.filter((score) => score.bureau === bureau).map((score) => score.value);
    return values.length ? Math.max(...values) : null;
  };

  const topAction = readiness.topActions[0];
  const primaryAlert = dashboardAlert
    ? {
        title: dashboardAlert.ctaLabel ?? 'Review your next credit step',
        description: dashboardAlert.message,
        route: dashboardAlert.ctaPath ?? '/portal/dashboard',
        status:
          dashboardAlert.tone === 'blocking'
            ? ('blocked' as const)
            : dashboardAlert.tone === 'warning'
              ? ('needs_action' as const)
              : dashboardAlert.tone === 'success'
                ? ('ready' as const)
                : ('in_progress' as const),
      }
    : topAction
      ? {
          title: topAction.title,
          description: topAction.desc,
          route: topAction.path ?? '/portal/dashboard',
          status: topAction.severity === 'warn' ? ('needs_action' as const) : ('in_progress' as const),
        }
      : {
          title: 'Your credit plan is on track',
          description: 'Review your latest report movement and keep your profile details current.',
          route: '/portal/reports',
          status: 'ready' as const,
        };

  const parsedReport = reports.some((report) => Boolean(report.parsed));
  const stageIndex =
    openCases.length + openDebt.length + letters.length > 0
      ? 3
      : parsedReport
        ? 2
        : reports.length > 0
          ? 1
          : 0;

  const journeyDescriptions = [
    'Identity and goals',
    'Current bureau data',
    'Findings and plan',
    'Rounds and letters',
    'Funding path',
  ];
  const journeyLabels = ['Profile', 'Reports', 'Strategy', 'Disputes', 'Readiness'];

  const actionModels = readiness.topActions.slice(0, 4).map((action, index) => ({
    id: action.key || `readiness-action-${index}`,
    title: action.title,
    description: action.desc,
    status: action.severity === 'warn' ? ('needs_action' as const) : ('in_progress' as const),
    statusLabel: action.severity === 'warn' ? 'Needs action' : 'Recommended',
    route: action.path ?? '/portal/dashboard',
    meta: index === 0 ? 'Next' : 'This week',
    kind: pathKind(action.path),
  }));

  const activity: PartnerCommandCenterModel['activity'] = [
    ...reports.slice(0, 2).map((report) => ({
      id: `report-${report.id}`,
      title: 'Credit report added',
      description: `${report.provider}${report.reportDate ? ` · report dated ${formatShortDate(report.reportDate)}` : ''}`,
      time: formatShortDate(report.receivedAt),
      status: 'ready' as const,
      route: '/portal/reports',
    })),
    ...letters
      .filter((letter) => letter.status === 'mailed' || letter.mailing?.providerId)
      .slice(0, 2)
      .map((letter) => ({
        id: `letter-${letter.id}`,
        title: 'Letter mailed',
        description: letter.title,
        time: formatShortDate(letter.mailing?.createdAt ?? letter.createdAt),
        status: 'complete' as const,
        route: '/portal/letters',
      })),
    ...doneTasks.slice(0, 2).map((task) => ({
      id: `task-${task.id}`,
      title: 'Task completed',
      description: task.title,
      time: formatShortDate(task.completedAt ?? task.updatedAt ?? task.createdAt),
      status: 'complete' as const,
      route: '/portal/projects',
    })),
  ].slice(0, 4);

  const routeKey = partner.primaryRoute ?? 'personal_restore';
  const route = partner.routes?.[routeKey];
  const capitalTarget =
    Number(route?.fundingTarget ?? 0) > 0
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
          Number(route?.fundingTarget),
        )
      : 'Set a capital goal';
  const strengths = readiness.categories
    .filter((category) => category.score >= 75)
    .map((category) => category.label)
    .slice(0, 4);
  const blockers = readiness.categories
    .flatMap((category) => category.missing)
    .filter(Boolean)
    .slice(0, 5);

  return {
    id: partner.id,
    name: partner.profile.fullName || 'Partner',
    planLabel: ROUTE_LABELS[routeKey] ?? 'Credit plan',
    stageLabel: STAGE_LABELS[partner.journeyStage ?? 'intake'] ?? 'Plan in progress',
    freshness: formatShortDate(partner.updatedAt),
    primaryAlert,
    scores: [
      { bureau: 'Equifax', value: scoreFor('EQF') },
      { bureau: 'Experian', value: scoreFor('EXP') },
      { bureau: 'TransUnion', value: scoreFor('TUC') },
    ],
    metrics: [
      { id: 'reports', label: 'Reports on file', value: reports.length, hint: parsedReport ? 'Analysis available' : 'Upload for analysis', accent: 'sky', route: '/portal/reports' },
      { id: 'letters', label: 'Letters prepared', value: letters.length, hint: `${letters.filter((letter) => letter.status === 'mailed').length} mailed`, accent: 'violet', route: '/portal/letters' },
      { id: 'evidence', label: 'Evidence items', value: evidence.length, hint: 'Saved documents and proof', accent: 'emerald', route: '/portal/documents' },
      { id: 'tasks', label: 'Open actions', value: openTasks.length, hint: `${doneTasks.length} completed`, accent: 'rose', route: '/portal/projects' },
    ],
    journey: JOURNEY_IDS.map((id, index) => ({
      id,
      label: journeyLabels[index],
      description: journeyDescriptions[index],
      complete: index < stageIndex,
      current: index === stageIndex,
    })),
    readiness: {
      score: readiness.overall,
      label: readiness.overall >= 80 ? 'Ready' : readiness.overall >= 55 ? 'Building' : 'Foundation',
      target: readiness.overall >= 80 ? 'Strong profile foundation' : 'Complete the next blockers to strengthen lender alignment',
      capitalGoal: capitalTarget,
      strengths: strengths.length ? strengths : ['Credit plan created'],
      blockers: blockers.length ? blockers : ['Keep profile and report data current'],
    },
    lenders: curatedPresetMatches()
      .slice()
      .sort((a, b) => stackingSortScore(b) - stackingSortScore(a))
      .slice(0, 3)
      .map((lender, index) => {
        const scoreValues = (['EQF', 'EXP', 'TUC'] as const)
          .map((bureau) => scoreFor(bureau))
          .filter((value): value is number => typeof value === 'number');
        const mid = scoreValues.length
          ? scoreValues.slice().sort((a, b) => a - b)[Math.floor(scoreValues.length / 2)]
          : 640;
        let match = 58;
        if (mid >= 720) match += 18;
        else if (mid >= 680) match += 12;
        else if (mid >= 640) match += 6;
        if (lender.relationshipFriendly) match += 6;
        if (lender.stackingTier === 'primary') match += 6;
        const accents = ['emerald', 'violet', 'sky'] as const;
        return {
          id: lender.id,
          name: lender.bank,
          product: lender.product,
          match: Math.min(99, match),
          reason: lender.projectedLimit,
          accent: accents[index],
        };
      }),
    actions: actionModels,
    activity,
  };
}

export function PartnerDashboardProductSurface({
  dataMode: productDataMode,
  embedded = false,
}: {
  dataMode?: 'demo' | 'real';
  embedded?: boolean;
} = {}) {
  const preview = useWorkspaceLightPreview();
  const dataMode = productDataMode ?? preview.dataMode;
  const auth = useAuth();
  const { partner, refresh, loading: partnerLoading, error: partnerSessionError } = usePartnerSession();
  const [isAdmin, setIsAdmin] = useState(() => isAdminEmail(auth.user?.email));
  const shell = (content: React.ReactNode, pageTitle: string, partnerId?: string) =>
    embedded ? (
      <>{content}</>
    ) : (
      <WlAppShell workspace="partner" livePath="/portal/dashboard" pageTitle={pageTitle} partnerId={partnerId}>
        {content}
      </WlAppShell>
    );

  useEffect(() => {
    const email = auth.user?.email;
    if (!email) {
      setIsAdmin(false);
      return;
    }
    if (isAdminEmail(email)) {
      setIsAdmin(true);
      return;
    }
    supabase
      .from('admin_emails')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsAdmin(true);
      });
  }, [auth.user?.email]);

  const realModel = useMemo(() => (partner ? buildPartnerModel(partner) : null), [partner]);

  useEffect(() => {
    if (dataMode !== 'real' || !partner) return;
    const reports = listReportsByPartner(partner.id);
    const evidence = listEvidenceByPartner(partner.id);
    const tasks = listPartnerPortalTasks(listTasksByPartner(partner.id));
    const cases = listCasesByPartner(partner.id);
    const openTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress');
    const openCases = cases.filter((item) => item.status === 'open');
    const signals = {
      ...(partner.journeySignals ?? {}),
      reports: reports.length,
      evidence: evidence.length,
      openTasks: openTasks.length,
      openCases: openCases.length,
    };
    if (JSON.stringify(signals) !== JSON.stringify(partner.journeySignals ?? {})) {
      void upsertPartner({ ...partner, journeySignals: signals });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode, partner?.id, realModel]);

  useEffect(() => {
    if (dataMode !== 'real' || !partner) return;
    try {
      ensurePartnerOnboardingTasks(partner);
    } catch {
      // non-blocking
    }
  }, [dataMode, partner?.id]);

  const model = realModel ?? (dataMode === 'demo' ? PARTNER_COMMAND_CENTER_DEMO : null);

  if (dataMode === 'real' && partnerLoading) {
    return shell(<ProductDashboardSkeleton label="Loading partner dashboard" />, 'Your dashboard');
  }

  if (!model) {
    if (isAdmin && dataMode === 'real') {
      return <Navigate to="/admin/partners" replace />;
    }

    return shell(
        <div className="fc-wlp-stack">
          <ProductCommandHeader
            roleLabel="Partner portal · connected workspace"
            title="No partner profile is connected."
            description="Sign in with the account connected to your partner profile, or ask your Credit Specialist for help."
            primaryAction={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => window.history.back()}>
                <ArrowLeft size={15} /> Go back
              </button>
            }
          />

          {partnerSessionError ? (
            <ProductEmptyState
              title="Partner session could not load"
              description={partnerSessionError}
              action={
                <button type="button" className="fc-wlp-btn-quiet" onClick={refresh}>
                  <RefreshCcw size={14} /> Retry session
                </button>
              }
            />
          ) : (
            <ProductEmptyState
              title="Partner profile unavailable"
              description="No partner profile was found for this account."
            />
          )}
        </div>
      ,
      'Your dashboard',
    );
  }

  return shell(
    <PartnerDashboardCommandDeck
      partner={partner ?? demoPartnerFromFixture()}
      model={model}
      dataMode={dataMode}
      onRefresh={refresh}
    />,
    'Your dashboard',
    model.id,
  );
}
