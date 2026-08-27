import type { WorkspaceProductAccent, WorkspaceProductStatus } from '../workspaceProductTokens';

export type AdminMetricModel = {
  id: string;
  label: string;
  value: number | string;
  hint: string;
  accent: WorkspaceProductAccent;
  route: string;
};

export type AdminPriorityModel = {
  id: string;
  title: string;
  description: string;
  status: WorkspaceProductStatus;
  statusLabel?: string;
  meta: string;
  route: string;
  kind: 'partner' | 'case' | 'report' | 'task' | 'message';
};

export type AdminCommandCenterModel = {
  freshness: string;
  overviewStatus: string;
  metrics: AdminMetricModel[];
  priorities: AdminPriorityModel[];
  pipeline: Array<{
    id: string;
    label: string;
    value: number;
    detail: string;
    route: string;
    accent: WorkspaceProductAccent;
  }>;
  health: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    status: WorkspaceProductStatus;
  }>;
  activity: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    status: WorkspaceProductStatus;
    route: string;
  }>;
};

export type PartnerCommandCenterModel = {
  id: string;
  name: string;
  planLabel: string;
  stageLabel: string;
  freshness: string;
  primaryAlert: {
    title: string;
    description: string;
    route: string;
    status: WorkspaceProductStatus;
  };
  scores: Array<{
    bureau: string;
    value: number | null;
    change?: number | null;
  }>;
  metrics: Array<{
    id: string;
    label: string;
    value: number | string;
    hint: string;
    accent: WorkspaceProductAccent;
    route: string;
  }>;
  journey: Array<{
    id: string;
    label: string;
    description: string;
    complete?: boolean;
    current?: boolean;
  }>;
  readiness: {
    score: number;
    label: string;
    target: string;
    capitalGoal: string;
    strengths: string[];
    blockers: string[];
  };
  lenders: Array<{
    id: string;
    name: string;
    product: string;
    match: number;
    reason: string;
    accent: WorkspaceProductAccent;
  }>;
  actions: Array<{
    id: string;
    title: string;
    description: string;
    status: WorkspaceProductStatus;
    statusLabel?: string;
    route: string;
    meta: string;
    kind: 'report' | 'letter' | 'document' | 'message' | 'task';
  }>;
  activity: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    status: WorkspaceProductStatus;
    route: string;
  }>;
};
