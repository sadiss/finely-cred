import type { WorkflowId } from './automation';
import type { TaskKind, TaskPriority, TaskStage } from './tasks';
import type { ProjectStage, ProjectStatus } from './projects';
import type { PartnerJourneyStage, PartnerLane } from './partners';

export type AgentMode = 'dry_run' | 'live';

export type AutomationTrigger =
  | { type: 'manual' }
  | { type: 'interval'; everyHours: number };

export type AutomationCondition =
  | { type: 'always' }
  | { type: 'partner_lane_in'; lanes: PartnerLane[] }
  | { type: 'partner_stage_in'; stages: PartnerJourneyStage[] }
  | { type: 'has_open_tasks'; minOpenTasks?: number }
  | { type: 'has_unclaimed_invite'; olderThanHours?: number }
  | { type: 'has_active_bundle'; bundleId: string };

export type AutomationAction =
  | { type: 'run_workflow'; workflowId: WorkflowId }
  | {
      type: 'send_comms_template';
      templateId: string;
      /** Optional: override template channel */
      channel?: 'portal' | 'email' | 'sms';
      /** Safety to prevent spam */
      dedupeWithinHours?: number;
      maxPerRun?: number;
    }
  | {
      type: 'create_task';
      title: string;
      kind: TaskKind;
      stage?: TaskStage;
      priority?: TaskPriority;
      dueInDays?: number;
      notes?: string;
      tags?: string[];
    }
  | {
      type: 'send_invite_reminder';
      channel: 'email' | 'sms' | 'both';
      maxPerRun?: number;
      olderThanHours?: number;
    }
  | {
      type: 'bundle_nudge';
      maxPerRun?: number;
      dueSoonDays?: number;
    };
  // Workboard + ops actions (registry-driven expansion)
export type AutomationWorkboardAction =
  | {
      type: 'create_project';
      title: string;
      scope?: 'personal' | 'business';
      stage?: ProjectStage;
      status?: ProjectStatus;
      tags?: string[];
      fundingGoal?: number;
    }
  | {
      type: 'set_project_stage';
      stage: ProjectStage;
      /** Optional: only apply to projects with any of these tags */
      matchTagsAny?: string[];
      scope?: 'personal' | 'business';
      maxPerPartner?: number;
    }
  | {
      type: 'set_project_status';
      status: ProjectStatus;
      matchTagsAny?: string[];
      scope?: 'personal' | 'business';
      maxPerPartner?: number;
    }
  | {
      type: 'add_project_note';
      note: string;
      matchTagsAny?: string[];
      scope?: 'personal' | 'business';
      maxPerPartner?: number;
    }
  | {
      type: 'set_task_stage';
      stage: TaskStage;
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      scope?: 'personal' | 'business';
      maxPerPartner?: number;
    }
  | {
      type: 'set_task_status';
      status: import('./tasks').TaskStatus;
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      scope?: 'personal' | 'business';
      maxPerPartner?: number;
    }
  | {
      type: 'add_task_checklist_items';
      items: string[];
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'append_task_notes';
      note: string;
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'add_task_tags';
      tags: string[];
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'add_task_labels';
      labels: string[];
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'assign_task_users';
      assigneeUserIds: string[];
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'add_task_comment';
      comment: string;
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'set_task_priority';
      priority: TaskPriority;
      matchKindsAny?: TaskKind[];
      matchTagsAny?: string[];
      maxPerPartner?: number;
    }
  | {
      type: 'create_notification';
      audience: 'partner' | 'admin' | 'both';
      title: string;
      body?: string;
      href?: string;
      maxPerRun?: number;
    }
  | {
      type: 'upsert_partner_signal';
      key: string;
      value: any;
    };

export type AutomationActionV2 = AutomationAction | AutomationWorkboardAction;

export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationActionV2[];
  /** If set, agent only creates tasks within this rolling window (days). */
  rollingHorizonDays?: number;
  meta?: Record<string, any>;
};

export type AutomationRunLog = {
  id: string;
  ruleId: string;
  mode: AgentMode;
  startedAt: string;
  finishedAt: string;
  summary: string;
  actions: Array<
    | { type: 'info' | 'warn'; message: string; meta?: Record<string, any> }
    | { type: 'created_task'; partnerId: string; title: string; meta?: Record<string, any> }
    | { type: 'sent_invite'; partnerId: string; channel: 'email' | 'sms'; to: string; meta?: Record<string, any> }
  >;
};

