/**
 * Human-like automation catalog — 20× expansion with persona cadence + lane/stage coverage.
 */
import type { AutomationRule } from '../../domain/automationStudio';
import type { PartnerJourneyStage, PartnerLane } from '../../domain/partners';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import type { AutomationRecipe } from './automationRecipeLibrary';

const LANES: PartnerLane[] = [
  'funding_readiness',
  'business_credit',
  'debt_kill',
  'au_tradelines',
  'primary_tradeline',
  'other',
];

const STAGES: PartnerJourneyStage[] = ['intake', 'report_upload', 'analysis', 'evidence', 'letters', 'mailing', 'funding'];

const PERSONAS: AgentPersonaId[] = [
  'finely_advisor',
  'dispute_coach',
  'processing_agent',
  'letter_ops_agent',
  'support_specialist',
  'debt_strategist',
  'appointment_setter',
  'sales_closer',
  'nurture_concierge',
  'compliance_agent',
  'funding_strategist',
];

function humanMeta(args: {
  key: string;
  personaId?: AgentPersonaId;
  humanDelayMinutes?: number;
  tone?: 'warm' | 'urgent' | 'compliance' | 'celebratory';
}) {
  return {
    recipeId: args.key,
    humanAutomation: true,
    personaId: args.personaId,
    humanDelayMinutes: args.humanDelayMinutes ?? 0,
    humanTone: args.tone ?? 'warm',
    seed: true,
    seedKey: args.key,
  };
}

function mkHumanNotify(args: {
  key: string;
  name: string;
  everyHours: number;
  title: string;
  body: string;
  personaId: AgentPersonaId;
  lanes?: PartnerLane[];
  stages?: PartnerJourneyStage[];
  enabled?: boolean;
}): AutomationRecipe {
  return {
    id: args.key,
    title: args.name,
    description: `Human-style ${args.personaId.replace(/_/g, ' ')} check-in.`,
    category: 'ops',
    makeRule: (): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> => ({
      name: args.name,
      enabled: args.enabled ?? false,
      trigger: { type: 'interval', everyHours: args.everyHours },
      conditions: [
        ...(args.lanes?.length ? [{ type: 'partner_lane_in' as const, lanes: args.lanes }] : []),
        ...(args.stages?.length ? [{ type: 'partner_stage_in' as const, stages: args.stages }] : []),
        { type: 'always' as const },
      ],
      actions: [
        { type: 'assign_agent_persona', personaId: args.personaId, leadIdField: 'partnerId' },
        { type: 'notify_admin', title: args.title, body: args.body },
      ],
      rollingHorizonDays: 21,
      meta: humanMeta({ key: args.key, personaId: args.personaId, humanDelayMinutes: 12, tone: 'warm' }),
    }),
  };
}

const CORE_HUMAN_RECIPES: AutomationRecipe[] = [
  mkHumanNotify({
    key: 'human_fundability_weekly_scan',
    name: 'Human: weekly fundability readiness scan',
    everyHours: 168,
    title: 'Fundability scan due',
    body: 'Review utilization, inquiries, and entity signals — assign funding strategist if green.',
    personaId: 'funding_strategist',
    lanes: ['funding_readiness', 'business_credit'],
    enabled: true,
  }),
  mkHumanNotify({
    key: 'human_dispute_round_followup',
    name: 'Human: dispute round follow-up (72h)',
    everyHours: 72,
    title: 'Dispute follow-up window',
    body: 'Check bureau responses — escalate factual findings if no movement.',
    personaId: 'dispute_coach',
    lanes: ['funding_readiness', 'debt_kill'],
    stages: ['letters', 'mailing'],
    enabled: true,
  }),
  mkHumanNotify({
    key: 'human_evidence_nudge',
    name: 'Human: evidence upload nudge',
    everyHours: 48,
    title: 'Evidence still missing',
    body: 'Partner stalled on evidence — send portal checklist and assign processing agent.',
    personaId: 'processing_agent',
    stages: ['evidence'],
    enabled: true,
  }),
  mkHumanNotify({
    key: 'human_session_no_show',
    name: 'Human: enlightenment no-show recovery',
    everyHours: 24,
    title: 'Session no-show',
    body: 'Reschedule slot + assign appointment setter within 24h.',
    personaId: 'appointment_setter',
    enabled: true,
  }),
  mkHumanNotify({
    key: 'human_compliance_escalation_watch',
    name: 'Human: compliance escalation watch',
    everyHours: 12,
    title: 'Compliance watch',
    body: 'Scan complaint queue — compliance agent reviews before any outbound.',
    personaId: 'compliance_agent',
    enabled: true,
  }),
];

const GENERATED_LANE_STAGE: AutomationRecipe[] = LANES.flatMap((lane) =>
  STAGES.slice(0, 5).map((stage, idx) => {
    const persona = PERSONAS[(LANES.indexOf(lane) + idx) % PERSONAS.length]!;
    const key = `human_${lane}_${stage}`;
    return mkHumanNotify({
      key,
      name: `Human: ${lane.replace(/_/g, ' ')} @ ${stage.replace(/_/g, ' ')}`,
      everyHours: 24 + (idx % 3) * 12,
      title: `${stage.replace(/_/g, ' ')} nudge`,
      body: `${persona.replace(/_/g, ' ')} reviews ${lane.replace(/_/g, ' ')} partners at ${stage}.`,
      personaId: persona,
      lanes: [lane],
      stages: [stage],
      enabled: idx === 0 && lane === 'funding_readiness',
    });
  }),
);

const FUNDABILITY_REASON_RECIPES: AutomationRecipe[] = [
  {
    id: 'human_reason_rank_review',
    title: 'Human: AI reason ranking review',
    description: 'When dispute reasons are ranked, letter ops verifies factual tone before send.',
    category: 'ops',
    makeRule: () => ({
      name: 'Reason rank → letter ops review',
      enabled: true,
      trigger: { type: 'report_uploaded' },
      conditions: [{ type: 'partner_lane_in', lanes: ['funding_readiness', 'debt_kill'] }],
      actions: [
        { type: 'assign_staff_task', roleId: 'letter_ops_agent', title: 'Review AI-ranked dispute reasons', kind: 'review_results', priority: 'high', dueInDays: 1 },
        { type: 'notify_admin', title: 'Reasons ranked', body: 'Verify factual findings in Reasons OS before mailing.' },
      ],
      meta: humanMeta({ key: 'human_reason_rank_review', personaId: 'letter_ops_agent', tone: 'compliance' }),
    }),
  },
  {
    id: 'human_funding_stage_handoff',
    title: 'Human: funding stage Nora handoff',
    description: 'Partner hits funding journey — ops briefing for capital team.',
    category: 'events',
    makeRule: () => ({
      name: 'Funding stage → Nora handoff',
      enabled: true,
      trigger: { type: 'partner_stage_changed', stage: 'funding' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'funding_strategist', leadIdField: 'partnerId' },
        { type: 'create_task', title: 'Prepare funding readiness packet', kind: 'general', priority: 'high', dueInDays: 2, tags: ['fundability', 'nora'] },
        { type: 'notify_admin', title: 'Funding lane active', body: 'Review fundability score + entity docs before lender outreach.' },
      ],
      meta: humanMeta({ key: 'human_funding_stage_handoff', personaId: 'funding_strategist', tone: 'celebratory' }),
    }),
  },
  {
    id: 'human_onboarding_welcome_sequence',
    title: 'Human: onboarding welcome + lane assign',
    description: 'New partner signup — assign advisor and first-week tasks.',
    category: 'nurture',
    makeRule: () => ({
      name: 'Onboarding → advisor welcome',
      enabled: true,
      trigger: { type: 'funnel_signup' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'finely_advisor', leadIdField: 'leadId' },
        { type: 'create_task', title: 'Complete onboarding profile + upload first report', kind: 'upload_document', priority: 'high', dueInDays: 3, tags: ['onboarding'] },
        { type: 'notify_admin', title: 'New partner onboarding', body: 'Verify lane selection and fundability goal in CRM record.' },
      ],
      meta: humanMeta({ key: 'human_onboarding_welcome_sequence', personaId: 'finely_advisor', humanDelayMinutes: 5, tone: 'warm' }),
    }),
  },
];

const CRM_HUMAN_RECIPES: AutomationRecipe[] = (
  ['lead_scored', 'crm_stage_changed', 'purchase_completed', 'task_overdue', 'meta_lead_form'] as const
).map((triggerType, i) => {
  const persona = PERSONAS[i % PERSONAS.length]!;
  const key = `human_crm_${triggerType}`;
  return {
    id: key,
    title: `Human: ${triggerType.replace(/_/g, ' ')} response`,
    description: `Persona ${persona} responds with human cadence.`,
    category: 'events' as const,
    makeRule: (): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> => ({
      name: `Human CRM: ${triggerType}`,
      enabled: triggerType === 'meta_lead_form' || triggerType === 'lead_scored',
      trigger:
        triggerType === 'crm_stage_changed'
          ? { type: 'crm_stage_changed', stage: 'qualified' }
          : triggerType === 'lead_scored'
            ? { type: 'lead_scored', minScore: 40, band: 'warm' }
            : ({ type: triggerType } as AutomationRule['trigger']),
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: persona, leadIdField: 'leadId' },
        { type: 'notify_admin', title: `Human touch: ${triggerType}`, body: `${persona} assigned — follow up like a human.` },
      ],
      meta: humanMeta({ key, personaId: persona, humanDelayMinutes: 8 + i * 3 }),
    }),
  };
});

const ROLE_INCOME_RECIPES: AutomationRecipe[] = [
  {
    id: 'human_affiliate_residual_monthly',
    title: 'Human: affiliate residual accrual review',
    description: 'Monthly review of recurring commission accruals for active referrals.',
    category: 'events',
    makeRule: (): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> => ({
      name: 'Human: affiliate residual accrual',
      enabled: true,
      trigger: { type: 'interval', everyHours: 720 },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'affiliate_specialist', leadIdField: 'partnerId' },
        { type: 'notify_admin', title: 'Affiliate residual accrual', body: 'Review monthly recurring commissions and payout ledger.' },
        { type: 'enroll_nurture_sequence', sequenceId: 'seq_affiliate_residual', leadIdField: 'leadId' },
      ],
      meta: humanMeta({ key: 'human_affiliate_residual_monthly', personaId: 'affiliate_specialist', humanDelayMinutes: 30 }),
    }),
  },
  {
    id: 'human_invoice_reminder_ops',
    title: 'Human: invoice reminder ops',
    description: 'Ops review of overdue invoices before automated reminders fire.',
    category: 'ops',
    makeRule: (): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> => ({
      name: 'Human: invoice reminder ops',
      enabled: true,
      trigger: { type: 'interval', everyHours: 24 },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'support_specialist', leadIdField: 'partnerId' },
        { type: 'notify_admin', title: 'Invoice reminder batch', body: 'Run invoice reminder tick — verify comms delivery.' },
      ],
      meta: humanMeta({ key: 'human_invoice_reminder_ops', personaId: 'support_specialist', humanDelayMinutes: 5 }),
    }),
  },
  {
    id: 'human_au_seller_listing_review',
    title: 'Human: AU listing compliance review',
    description: 'Compliance agent spot-checks new seller listings before marketplace publish.',
    category: 'ops',
    makeRule: (): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> => ({
      name: 'Human: AU listing review',
      enabled: true,
      trigger: { type: 'purchase_completed' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'compliance_agent', leadIdField: 'partnerId' },
        { type: 'notify_admin', title: 'AU listing review', body: 'New seller activity — verify listing compliance.' },
        { type: 'enroll_nurture_sequence', sequenceId: 'seq_au_seller_onboard', leadIdField: 'leadId' },
      ],
      meta: humanMeta({ key: 'human_au_seller_listing_review', personaId: 'compliance_agent', humanDelayMinutes: 15 }),
    }),
  },
];

export const HUMAN_AUTOMATION_RECIPES: AutomationRecipe[] = [
  ...CORE_HUMAN_RECIPES,
  ...GENERATED_LANE_STAGE,
  ...FUNDABILITY_REASON_RECIPES,
  ...CRM_HUMAN_RECIPES,
  ...ROLE_INCOME_RECIPES,
];

export const HUMAN_AUTOMATION_RECIPE_COUNT = HUMAN_AUTOMATION_RECIPES.length;
