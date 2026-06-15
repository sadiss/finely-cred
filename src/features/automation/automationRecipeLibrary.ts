import type { AutomationRule } from '../../domain/automationStudio';

export type AutomationRecipe = {
  id: string;
  title: string;
  description: string;
  category: 'events' | 'ops' | 'nurture' | 'work_os';
  makeRule: () => Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>;
};

/** One-click recipes for Automation Studio library (Phase 10). */
export const AUTOMATION_EVENT_RECIPES: AutomationRecipe[] = [
  {
    id: 'recipe_meta_lead_notify',
    title: 'Meta Lead Ad → notify + assign closer',
    description: 'When a Meta lead form fires, notify admin and tag sales closer persona.',
    category: 'events',
    makeRule: () => ({
      name: 'Meta lead → sales follow-up',
      enabled: true,
      trigger: { type: 'meta_lead_form' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'sales_closer', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'Meta / hot lead', body: 'Review in Leads OS → Social tab.' },
      ],
      meta: { recipeId: 'recipe_meta_lead_notify', source: 'meta_lead' },
    }),
  },
  {
    id: 'recipe_funnel_nurture',
    title: 'Funnel signup → nurture concierge',
    description: 'Assign nurture persona when a lead magnet form completes.',
    category: 'nurture',
    makeRule: () => ({
      name: 'Funnel signup → nurture concierge',
      enabled: true,
      trigger: { type: 'funnel_signup' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'nurture_concierge', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'New funnel signup', body: 'Lead enrolled — verify nurture sequence.' },
      ],
      meta: { recipeId: 'recipe_funnel_nurture' },
    }),
  },
  {
    id: 'recipe_funnel_session_closer',
    title: 'Funnel session booked → appointment setter',
    description: 'When a lead books a strategy call from funnel success, assign appointment setter and alert admin.',
    category: 'nurture',
    makeRule: () => ({
      name: 'Funnel session → appointment setter',
      enabled: true,
      trigger: { type: 'funnel_session_booked' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'appointment_setter', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'Funnel session booked', body: 'Confirm slot in Calendar OS and send prep email.' },
        { type: 'send_comms_template', templateId: 'funnel_session_confirmation', channel: 'email', dedupeWithinHours: 24 },
      ],
      meta: { recipeId: 'recipe_funnel_session_closer' },
    }),
  },
  {
    id: 'recipe_task_overdue_escalation',
    title: 'Task overdue → Work OS escalation',
    description: 'Notify admin when Work OS SLA timer breaches.',
    category: 'work_os',
    makeRule: () => ({
      name: 'Task overdue escalation',
      enabled: true,
      trigger: { type: 'task_overdue' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'notify_admin', title: 'Task overdue', body: 'Check Work OS board and reassign.' },
        { type: 'sla_escalation', maxPerRun: 10, minHoursLate: 1 },
      ],
      meta: { recipeId: 'recipe_task_overdue_escalation' },
    }),
  },
  {
    id: 'recipe_dispute_mailed_webhook',
    title: 'Dispute mailed → webhook + admin',
    description: 'FCRA window started — fan out to webhooks and admin inbox.',
    category: 'events',
    makeRule: () => ({
      name: 'Dispute letter mailed',
      enabled: true,
      trigger: { type: 'dispute_letter_mailed' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Letter mailed', body: 'Start bureau response timer in Work OS.' }],
      meta: { recipeId: 'recipe_dispute_mailed_webhook' },
    }),
  },
  {
    id: 'recipe_task_completed_outcome',
    title: 'Task completed → notify admin + CRM note',
    description: 'When a partner completes a results-driven task, notify ops to verify outcome.',
    category: 'work_os',
    makeRule: () => ({
      name: 'Task completed → ops review',
      enabled: true,
      trigger: { type: 'task_completed' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Task outcome recorded', body: 'Review actual result in Work OS project workspace.' }],
      meta: { recipeId: 'recipe_task_completed_outcome' },
    }),
  },
  {
    id: 'recipe_task_result_nurture',
    title: 'Task result recorded → nurture check-in',
    description: 'When a partner documents an actual result, assign nurture concierge for follow-up.',
    category: 'work_os',
    makeRule: () => ({
      name: 'Task result → nurture check-in',
      enabled: false,
      trigger: { type: 'task_result_recorded' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'nurture_concierge', leadIdField: 'partnerId' },
        { type: 'notify_admin', title: 'Task result logged', body: 'Partner recorded outcome — verify in Work OS.' },
      ],
      meta: { recipeId: 'recipe_task_result_nurture' },
    }),
  },
  {
    id: 'recipe_course_lesson_agent',
    title: 'Course lesson agent → notify + Work OS',
    description: 'When lesson agent runs (narration + checklist tasks), notify admin to review course delivery.',
    category: 'events',
    makeRule: () => ({
      name: 'Course lesson agent run',
      enabled: false,
      trigger: { type: 'course_lesson_agent_run' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Lesson agent ran', body: 'Check Voice Studio render + spawned Work OS tasks.' }],
      meta: { recipeId: 'recipe_course_lesson_agent' },
    }),
  },
  {
    id: 'recipe_crm_qualified_closer',
    title: 'CRM booked → assign closer',
    description: 'When a record hits booked stage, assign sales closer persona.',
    category: 'events',
    makeRule: () => ({
      name: 'CRM booked → closer',
      enabled: false,
      trigger: { type: 'crm_stage_changed', stage: 'booked' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'sales_closer', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'CRM booked', body: 'Hot lead in pipeline — book call within 24h.' },
      ],
      meta: { recipeId: 'recipe_crm_qualified_closer' },
    }),
  },
  {
    id: 'recipe_partner_funding_stage',
    title: 'Partner → funding stage → notify ops',
    description: 'When partner journey advances to funding, notify admin for Nora handoff.',
    category: 'events',
    makeRule: () => ({
      name: 'Partner funding stage',
      enabled: false,
      trigger: { type: 'partner_stage_changed', stage: 'funding' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Partner funding ready', body: 'Review funding path + Nora Capital queue.' }],
      meta: { recipeId: 'recipe_partner_funding_stage' },
    }),
  },
  {
    id: 'recipe_billing_dunning',
    title: 'Billing past due → partner nudge',
    description: 'Dunning email + portal notification when payment is overdue.',
    category: 'nurture',
    makeRule: () => ({
      name: 'Billing dunning nudge',
      enabled: true,
      trigger: { type: 'billing_past_due', daysSince: 3 },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'send_comms_template', templateId: 'billing_past_due', channel: 'email', dedupeWithinHours: 48 },
        { type: 'notify_admin', title: 'Payment past due', body: 'Partner billing needs follow-up.' },
      ],
      meta: { recipeId: 'recipe_billing_dunning' },
    }),
  },
  {
    id: 'recipe_trial_win_back',
    title: 'Trial expired → win-back closer',
    description: 'Assign sales closer when DIY trial ends without upgrade.',
    category: 'nurture',
    makeRule: () => ({
      name: 'Trial win-back',
      enabled: true,
      trigger: { type: 'win_back', daysSinceExpiry: 1 },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'sales_closer', leadIdField: 'partnerId' },
        { type: 'send_comms_template', templateId: 'trial_win_back', channel: 'email', dedupeWithinHours: 72 },
        { type: 'notify_admin', title: 'Trial win-back', body: 'Expired trial — outreach in CRM.' },
      ],
      meta: { recipeId: 'recipe_trial_win_back' },
    }),
  },
];

export const AUTOMATION_OPS_RECIPES: AutomationRecipe[] = [
  {
    id: 'recipe_daily_partner_nudge',
    title: 'Daily partner nudge (all lanes)',
    description: 'Interval rule — bundle nudge for partners with open tasks.',
    category: 'ops',
    makeRule: () => ({
      name: 'Daily partner nudge',
      enabled: false,
      trigger: { type: 'interval', everyHours: 24 },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'bundle_nudge', maxPerRun: 40, dueSoonDays: 3 }],
      rollingHorizonDays: 14,
      meta: { recipeId: 'recipe_daily_partner_nudge' },
    }),
  },
  {
    id: 'recipe_report_upload_auto_draft',
    title: 'Report uploaded → auto-draft dispute letter',
    description: 'When a partner report is uploaded, draft factual dispute letters and queue human review.',
    category: 'ops',
    makeRule: () => ({
      name: 'Report upload → auto-draft',
      enabled: false,
      trigger: { type: 'report_uploaded' },
      conditions: [{ type: 'partner_stage_in', stages: ['intake', 'report_upload', 'analysis', 'evidence', 'letters'] }],
      actions: [
        { type: 'draft_dispute_letter', maxPerRun: 5, maxCandidates: 3, round: '1' },
        { type: 'assign_staff_task', roleId: 'processing_agent', title: 'Triage new report negatives', kind: 'review_results', priority: 'high', dueInDays: 2 },
        { type: 'notify_admin', title: 'Auto-draft queued', body: 'Review in Hands-Free Ops → Draft queue.' },
      ],
      meta: { recipeId: 'recipe_report_upload_auto_draft' },
    }),
  },
  {
    id: 'recipe_evidence_ready_draft',
    title: 'Evidence ready → draft + letter ops review',
    description: 'Dispute evidence complete — auto-draft and assign Letter Operations review task.',
    category: 'ops',
    makeRule: () => ({
      name: 'Evidence ready → draft letter',
      enabled: false,
      trigger: { type: 'dispute_evidence_ready' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'draft_dispute_letter', maxPerRun: 3, maxCandidates: 5 },
        { type: 'queue_letter_review', title: 'Review auto-drafted dispute letter', dueInDays: 1 },
      ],
      meta: { recipeId: 'recipe_evidence_ready_draft' },
    }),
  },
  {
    id: 'recipe_complaint_compliance',
    title: 'Complaint keyword → compliance review',
    description: 'Public chat or portal message with CFPB/FTC/escalation language queues Compliance Review Agent.',
    category: 'ops',
    makeRule: () => ({
      name: 'Complaint detected → compliance',
      enabled: true,
      trigger: { type: 'complaint_detected' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'queue_compliance_escalation', title: 'Review complaint escalation language' },
        { type: 'notify_admin', title: 'Complaint keyword flagged', body: 'Hands-Free Ops → Complaints queue.' },
      ],
      meta: { recipeId: 'recipe_complaint_compliance' },
    }),
  },
];

export const ALL_AUTOMATION_RECIPES: AutomationRecipe[] = [...AUTOMATION_EVENT_RECIPES, ...AUTOMATION_OPS_RECIPES];
