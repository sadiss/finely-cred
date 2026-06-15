/**
 * Ruth unified execution registry — every automation Ruth can run, with handler metadata.
 */

export type CoOwnerHandlerKind = 'data_action' | 'navigate_prompt' | 'prompt_only' | 'dev_studio';

export type CoOwnerExecutionEntry = {
  executeKey: string;
  label: string;
  domain: string;
  description: string;
  handlerKind: CoOwnerHandlerKind;
  schedule?: string;
  navigateTo?: string;
  superhuman?: boolean;
};

const REGISTRY: CoOwnerExecutionEntry[] = [
  { executeKey: 'daily_ops', label: 'Deep daily ops', domain: 'operations', description: 'Nine-lens synthesis + tenant snapshot', handlerKind: 'data_action', schedule: '08:00 local', navigateTo: '/admin/workflow', superhuman: true },
  { executeKey: 'co_ceo_brief', label: 'Deep executive brief', domain: 'leadership', description: '48h priorities + 2-week risk projection', handlerKind: 'navigate_prompt', navigateTo: '/admin/ops-agent', superhuman: true },
  { executeKey: 'launch_audit', label: 'Launch readiness audit', domain: 'operations', description: 'Full launch OS rollup punchlist', handlerKind: 'data_action', navigateTo: '/admin/launch-os#go-live', superhuman: true },
  { executeKey: 'auto_hire_staff', label: 'Autonomous hiring', domain: 'people_ops', description: 'Fill C-suite + coverage gaps', handlerKind: 'data_action', schedule: '07:30 daily', navigateTo: '/admin/staff-roles', superhuman: true },
  { executeKey: 'executive_org', label: 'Executive org scan', domain: 'leadership', description: 'Vacant hats + division coverage', handlerKind: 'data_action', schedule: 'weekly', navigateTo: '/admin/staff-roles', superhuman: true },
  { executeKey: 'validation_clocks', label: 'Validation deadlines', domain: 'credit_ops', description: 'FDCPA windows + summons clocks', handlerKind: 'data_action', schedule: 'daily', navigateTo: '/admin/workflow', superhuman: true },
  { executeKey: 'dispute_workflow', label: 'Dispute orchestration', domain: 'credit_ops', description: 'Reports → evidence → letters → mail', handlerKind: 'data_action', navigateTo: '/admin/dispute-collaboration', superhuman: true },
  { executeKey: 'phone_sla', label: 'Phone queue SLA', domain: 'phone', description: 'Missed calls + voicemail backlog', handlerKind: 'data_action', schedule: 'every 5 min', navigateTo: '/admin/phone-hub', superhuman: true },
  { executeKey: 'social_content_ops', label: 'Social autopilot', domain: 'marketing', description: 'SOP drafts + compliance queue', handlerKind: 'data_action', schedule: '09:00 daily', navigateTo: '/admin/social-hub', superhuman: true },
  { executeKey: 'nurture_health', label: 'Nurture health', domain: 'comms', description: 'Sequence dry-run + dedupe audit', handlerKind: 'data_action', schedule: 'hourly', navigateTo: '/admin/comms', superhuman: true },
  { executeKey: 'billing_dunning', label: 'Billing dunning', domain: 'billing', description: 'Past-due partners + reminder cadence', handlerKind: 'data_action', schedule: 'daily', navigateTo: '/admin/billing', superhuman: true },
  { executeKey: 'it_health', label: 'Platform health', domain: 'platform', description: 'Launch gates + ops health snapshot', handlerKind: 'data_action', navigateTo: '/admin/launch-os#go-live', superhuman: true },
  { executeKey: 'dev_triage', label: 'Dev triage', domain: 'platform', description: 'Engineering priorities + regression signals', handlerKind: 'data_action', navigateTo: '/admin/monitoring', superhuman: true },
  { executeKey: 'site_map_scan', label: 'Site map scan', domain: 'platform', description: 'Full surface + knowledge index audit', handlerKind: 'data_action', navigateTo: '/admin/ops-agent', superhuman: true },
  { executeKey: 'code_studio', label: 'Dev Studio session', domain: 'engineering', description: 'Author code, agents, external scaffolds', handlerKind: 'dev_studio', navigateTo: '/admin/ops-agent#dev-studio', superhuman: true },
  { executeKey: 'create_agent', label: 'Create AI agent spec', domain: 'engineering', description: 'New specialist agent persona + roster wire', handlerKind: 'dev_studio', navigateTo: '/admin/ops-agent#dev-studio', superhuman: true },
  { executeKey: 'superhuman_sweep', label: 'Superhuman sweep', domain: 'operations', description: 'Parallel validation + phone + social + hiring + health', handlerKind: 'data_action', schedule: 'hourly', navigateTo: '/admin/ops-agent', superhuman: true },
  { executeKey: 'affiliate_residual', label: 'Affiliate residual', domain: 'revenue', description: 'Commission accrual + payout readiness', handlerKind: 'prompt_only', schedule: 'weekly', navigateTo: '/admin/affiliates' },
  { executeKey: 'route_comms', label: 'Comms routing', domain: 'comms', description: 'Partner message routing audit', handlerKind: 'prompt_only', navigateTo: '/admin/comms' },
  { executeKey: 'course_build', label: 'Course builder', domain: 'training', description: 'Training Academy module proposal', handlerKind: 'prompt_only', navigateTo: '/admin/training-academy' },
  { executeKey: 'hire_staff', label: 'Hire staff', domain: 'people_ops', description: 'Single roster hire via action block', handlerKind: 'data_action', navigateTo: '/admin/staff-roles' },
  { executeKey: 'promote_staff', label: 'Promote staff', domain: 'people_ops', description: 'Advance staff primary role', handlerKind: 'prompt_only' },
  { executeKey: 'promote_agent', label: 'Promote agent phase', domain: 'people_ops', description: 'Advance credit specialist training', handlerKind: 'prompt_only' },
  { executeKey: 'train_role', label: 'Train role', domain: 'training', description: 'Role-specific curriculum coaching', handlerKind: 'prompt_only', navigateTo: '/admin/training-academy' },
];

export function listCoOwnerExecutionRegistry(): CoOwnerExecutionEntry[] {
  return REGISTRY;
}

export function getCoOwnerExecutionEntry(executeKey: string): CoOwnerExecutionEntry | undefined {
  return REGISTRY.find((e) => e.executeKey === executeKey);
}

export function summarizeExecutionRegistryForCoOwner(): string {
  const superhuman = REGISTRY.filter((e) => e.superhuman);
  const real = REGISTRY.filter((e) => e.handlerKind === 'data_action' || e.handlerKind === 'dev_studio');
  return [
    `EXECUTION REGISTRY: ${REGISTRY.length} keys · ${real.length} with side effects · ${superhuman.length} superhuman`,
    `Superhuman automations: ${superhuman.map((e) => e.executeKey).join(', ')}`,
  ].join('\n');
}
