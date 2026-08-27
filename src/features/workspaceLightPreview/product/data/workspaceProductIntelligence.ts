import type {
  AdminCommandCenterModel,
  PartnerCommandCenterModel,
} from './workspacePreviewModels';
import type { WorkspaceProductStatus } from '../workspaceProductTokens';

export type WorkspaceEvidenceItem = {
  label: string;
  value: string;
  source: string;
};

export type WorkspaceIntelligenceSignal = {
  id: string;
  label: string;
  headline: string;
  explanation: string;
  confidence: 'high' | 'moderate' | 'limited';
  status: WorkspaceProductStatus;
  route: string;
  evidence: WorkspaceEvidenceItem[];
};

function statusWeight(status: WorkspaceProductStatus) {
  switch (status) {
    case 'blocked':
      return 6;
    case 'needs_action':
      return 5;
    case 'ready':
      return 4;
    case 'waiting':
      return 3;
    case 'in_progress':
      return 2;
    case 'complete':
      return 1;
    default:
      return 0;
  }
}

function confidenceFromEvidence(count: number): WorkspaceIntelligenceSignal['confidence'] {
  if (count >= 3) return 'high';
  if (count >= 2) return 'moderate';
  return 'limited';
}

export function buildPartnerWorkspaceIntelligence(model: PartnerCommandCenterModel) {
  const rankedActions = [...model.actions].sort(
    (left, right) => statusWeight(right.status) - statusWeight(left.status),
  );
  const nextAction = rankedActions[0];
  const availableScores = model.scores.filter((score) => typeof score.value === 'number');
  const readinessEvidence: WorkspaceEvidenceItem[] = [
    ...model.readiness.strengths.slice(0, 2).map((strength) => ({
      label: 'Strength',
      value: strength,
      source: 'Readiness profile',
    })),
    ...model.readiness.blockers.slice(0, 1).map((blocker) => ({
      label: 'Constraint',
      value: blocker,
      source: 'Readiness profile',
    })),
  ];
  const topLender = [...model.lenders].sort((left, right) => right.match - left.match)[0];

  const priority: WorkspaceIntelligenceSignal = {
    id: 'partner-next-action',
    label: 'Why this is first',
    headline: nextAction?.title ?? model.primaryAlert.title,
    explanation:
      nextAction?.description ??
      `${model.primaryAlert.description} It is the highest-priority open item in this workspace.`,
    confidence: nextAction ? 'high' : 'moderate',
    status: nextAction?.status ?? model.primaryAlert.status,
    route: nextAction?.route ?? model.primaryAlert.route,
    evidence: [
      {
        label: 'Priority state',
        value: nextAction?.statusLabel ?? model.primaryAlert.title,
        source: 'Open action queue',
      },
      {
        label: 'Timing',
        value: nextAction?.meta ?? model.freshness,
        source: 'Workspace activity',
      },
    ],
  };

  const readiness: WorkspaceIntelligenceSignal = {
    id: 'partner-readiness',
    label: 'Score confidence',
    headline: `${model.readiness.score}/100 · ${model.readiness.label}`,
    explanation: `${availableScores.length} bureau score${availableScores.length === 1 ? '' : 's'}, ${model.readiness.strengths.length} strength${model.readiness.strengths.length === 1 ? '' : 's'}, and ${model.readiness.blockers.length} active constraint${model.readiness.blockers.length === 1 ? '' : 's'} support this planning score.`,
    confidence: confidenceFromEvidence(readinessEvidence.length),
    status: model.readiness.score >= 80 ? 'ready' : 'in_progress',
    route: '/preview/workspace-light/portal/readiness',
    evidence: readinessEvidence,
  };

  const lender: WorkspaceIntelligenceSignal | null = topLender
    ? {
        id: 'partner-lender-fit',
        label: 'Best current fit',
        headline: `${topLender.name} · ${topLender.match}% profile fit`,
        explanation: topLender.reason,
        confidence: confidenceFromEvidence(model.readiness.strengths.length),
        status: topLender.match >= 85 ? 'ready' : 'in_progress',
        route: '/preview/workspace-light/portal/lender-logic',
        evidence: [
          {
            label: 'Profile fit',
            value: `${topLender.match}%`,
            source: 'Lender logic model',
          },
          ...model.readiness.strengths.slice(0, 2).map((strength) => ({
            label: 'Supporting factor',
            value: strength,
            source: 'Readiness profile',
          })),
        ],
      }
    : null;

  return { priority, readiness, lender };
}

export function buildAdminWorkspaceIntelligence(model: AdminCommandCenterModel) {
  const rankedPriorities = [...model.priorities].sort(
    (left, right) => statusWeight(right.status) - statusWeight(left.status),
  );
  const firstPriority = rankedPriorities[0];
  const atRiskHealth = model.health.filter(
    (item) => item.status === 'needs_action' || item.status === 'blocked',
  );
  const urgentPriorities = model.priorities.filter(
    (item) => item.status === 'needs_action' || item.status === 'blocked',
  );
  const dueMetric = model.metrics.find((metric) => metric.id === 'tasks');

  const serviceRisk: WorkspaceIntelligenceSignal = {
    id: 'admin-service-risk',
    label: 'Service risk',
    headline:
      atRiskHealth.length || urgentPriorities.length
        ? `${atRiskHealth.length + urgentPriorities.length} risk signal${atRiskHealth.length + urgentPriorities.length === 1 ? '' : 's'} need attention`
        : 'No urgent service risk detected',
    explanation:
      firstPriority?.description ??
      'The command center found no blocked or needs-action items in the current model.',
    confidence: confidenceFromEvidence(atRiskHealth.length + urgentPriorities.length),
    status: atRiskHealth.length || urgentPriorities.length ? 'needs_action' : 'ready',
    route: firstPriority?.route ?? '/preview/workspace-light/admin/workflow',
    evidence: [
      ...atRiskHealth.slice(0, 2).map((item) => ({
        label: item.label,
        value: item.value,
        source: 'Service health',
      })),
      ...urgentPriorities.slice(0, 2).map((item) => ({
        label: item.statusLabel ?? 'Priority',
        value: item.title,
        source: 'Priority queue',
      })),
    ],
  };

  const queue: WorkspaceIntelligenceSignal = {
    id: 'admin-queue-priority',
    label: 'Queue rationale',
    headline: firstPriority?.title ?? 'Priority queue is clear',
    explanation:
      firstPriority
        ? `${firstPriority.meta}. It ranks first because its current state carries the highest action weight in this view.`
        : 'No open priority item is available in the current workspace model.',
    confidence: firstPriority ? 'high' : 'limited',
    status: firstPriority?.status ?? 'ready',
    route: firstPriority?.route ?? '/preview/workspace-light/admin/workflow',
    evidence: firstPriority
      ? [
          { label: 'Current state', value: firstPriority.statusLabel ?? firstPriority.status, source: 'Priority queue' },
          { label: 'Timing', value: firstPriority.meta, source: 'Service clock' },
        ]
      : [],
  };

  const workload: WorkspaceIntelligenceSignal = {
    id: 'admin-workload',
    label: 'Workload signal',
    headline: dueMetric ? `${dueMetric.value} ${dueMetric.label.toLowerCase()}` : 'Workload metric unavailable',
    explanation:
      dueMetric?.hint ??
      'Add current task and service-clock data to calculate workload pressure.',
    confidence: dueMetric ? 'moderate' : 'limited',
    status: urgentPriorities.length ? 'needs_action' : 'in_progress',
    route: dueMetric?.route ?? '/preview/workspace-light/admin/workflow',
    evidence: dueMetric
      ? [{ label: dueMetric.label, value: String(dueMetric.value), source: 'Admin metric model' }]
      : [],
  };

  return { serviceRisk, queue, workload };
}
