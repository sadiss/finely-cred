import type { AutomationCondition } from '../domain/automationStudio';

export type AutomationConditionCategory = 'partner' | 'tasks' | 'billing' | 'invites';

export type AutomationConditionDef = {
  type: AutomationCondition['type'];
  label: string;
  category: AutomationConditionCategory;
};

export const AUTOMATION_CONDITION_DEFS: AutomationConditionDef[] = [
  { type: 'always', label: 'Always', category: 'partner' },
  { type: 'partner_lane_in', label: 'Partner lane in', category: 'partner' },
  { type: 'partner_stage_in', label: 'Partner stage in', category: 'partner' },
  { type: 'has_open_tasks', label: 'Has open tasks', category: 'tasks' },
  { type: 'has_unclaimed_invite', label: 'Has unclaimed invite', category: 'invites' },
  { type: 'has_active_bundle', label: 'Has active bundle', category: 'billing' },
];

export function conditionDef(type: AutomationCondition['type']): AutomationConditionDef | undefined {
  return AUTOMATION_CONDITION_DEFS.find((d) => d.type === type);
}

