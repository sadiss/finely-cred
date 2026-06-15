import type { WorkflowId } from './automation';
import type { TaskKind, TaskPriority, TaskStage } from './tasks';
import type { ProjectStage, ProjectStatus } from './projects';
import type { PartnerJourneyStage, PartnerLane } from './partners';

export type AgentMode = 'dry_run' | 'live';

export type AutomationTrigger =
  | { type: 'manual' }
  | { type: 'interval'; everyHours: number }
  | { type: 'form_submit'; formId?: string }
  | { type: 'crm_record_created'; pipelineId?: string; kind?: string }
  | { type: 'crm_stage_changed'; stage?: string; pipelineId?: string }
  | { type: 'crm_tag_added'; tag?: string }
  | { type: 'partner_stage_changed'; stage?: string }
  | { type: 'partner_lane_changed'; lane?: string }
  | { type: 'webhook_inbound'; provider?: string; event?: string }
  | { type: 'meta_message_received'; channel?: 'messenger' | 'instagram' }
  | { type: 'meta_lead_form'; formId?: string }
  | { type: 'funnel_signup'; funnelId?: string }
  | { type: 'funnel_session_booked'; funnelId?: string }
  | { type: 'trial_expiring'; daysBefore?: number }
  | { type: 'billing_past_due'; daysSince?: number }
  | { type: 'win_back'; daysSinceExpiry?: number }
  | { type: 'library_open'; bookSlug?: string }
  | { type: 'voice_asset_rendered'; contentType?: string }
  | { type: 'purchase_completed'; productType?: 'book' | 'package' | 'tradeline' }
  | { type: 'task_created' }
  | { type: 'task_completed' }
  | { type: 'task_result_recorded' }
  | { type: 'task_overdue' }
  | { type: 'dispute_letter_mailed'; round?: string }
  | { type: 'course_lesson_agent_run'; courseId?: string }
  | { type: 'lead_scored'; minScore?: number; band?: 'cold' | 'warm' | 'hot' | 'qualified' }
  | { type: 'report_uploaded' }
  | { type: 'dispute_evidence_ready' }
  | { type: 'complaint_detected' };

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
    }
  | {
      type: 'sla_escalation';
      maxPerRun?: number;
      minHoursLate?: number;
    }
  | {
      type: 'crm_sequence_tick';
      maxPerRun?: number;
    }
  | { type: 'send_email'; subject?: string; body: string; templateId?: string; dedupeWithinHours?: number; maxPerRun?: number }
  | { type: 'send_sms'; body: string; templateId?: string; dedupeWithinHours?: number; maxPerRun?: number }
  | { type: 'add_crm_tag'; tag: string }
  | { type: 'move_crm_stage'; stage: string }
  | { type: 'enroll_crm_sequence'; sequenceId: string }
  | { type: 'notify_admin'; title: string; body?: string }
  | { type: 'meta_reply'; body: string; templateId?: string }
  | { type: 'enroll_nurture_sequence'; sequenceId: string; leadIdField?: string }
  | { type: 'assign_agent_persona'; personaId: string; leadIdField?: string }
  | {
      type: 'draft_dispute_letter';
      maxPerRun?: number;
      bureau?: import('./creditReports').Bureau;
      round?: string;
      maxCandidates?: number;
    }
  | {
      type: 'queue_letter_review';
      title?: string;
      dueInDays?: number;
      letterIdField?: string;
    }
  | {
      type: 'request_mail_confirmation';
      letterIdField?: string;
      title?: string;
    }
  | {
      type: 'assign_staff_task';
      roleId: import('./agentPersonas').AgentPersonaId;
      title: string;
      kind: TaskKind;
      stage?: TaskStage;
      priority?: TaskPriority;
      dueInDays?: number;
      notes?: string;
      tags?: string[];
    }
  | {
      type: 'queue_compliance_escalation';
      title?: string;
      snippetField?: string;
    }
  | {
      type: 'render_voice_asset';
      contentId: string;
      title: string;
      contentType?: 'guide' | 'ebook' | 'funding_module';
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

export type AutomationFlowNodeType = 'trigger' | 'condition' | 'action' | 'wait' | 'branch' | 'goal';

export type AutomationFlowNode = {
  id: string;
  type: AutomationFlowNodeType;
  label: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
};

export type AutomationFlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type AutomationFlowGraph = {
  nodes: AutomationFlowNode[];
  edges: AutomationFlowEdge[];
  viewport?: { x: number; y: number; zoom: number };
};

export type AutomationEnrollmentStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type AutomationEnrollment = {
  id: string;
  ruleId: string;
  status: AutomationEnrollmentStatus;
  partnerId?: string;
  crmRecordId?: string;
  leadCaptureId?: string;
  currentNodeId?: string;
  enrolledAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
};

export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationActionV2[];
  /** Visual flow canvas graph (GHL-style). Synced with trigger/conditions/actions. */
  flow?: AutomationFlowGraph;
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

