import { CmoAutonomyPolicy, DEFAULT_CMO_AUTONOMY_POLICY } from '../../domain/cmoPhase5';

export function buildCmoAutonomyPolicy(level: CmoAutonomyPolicy['level']): CmoAutonomyPolicy {
  const now = new Date().toISOString();
  if (level === 'manual_only') {
    return { ...DEFAULT_CMO_AUTONOMY_POLICY, id: `policy_${level}`, level, allowCreateDrafts: true, allowCreateInternalTasks: false, updatedAt: now };
  }
  if (level === 'drafts_auto') {
    return { ...DEFAULT_CMO_AUTONOMY_POLICY, id: `policy_${level}`, level, allowCreateDrafts: true, allowCreateInternalTasks: true, updatedAt: now };
  }
  if (level === 'internal_auto') {
    return { ...DEFAULT_CMO_AUTONOMY_POLICY, id: `policy_${level}`, level, allowCreateDrafts: true, allowCreateInternalTasks: true, allowMoveCrmStages: false, maxDailyOutboundMessages: 0, updatedAt: now };
  }
  if (level === 'approved_external_auto') {
    return {
      ...DEFAULT_CMO_AUTONOMY_POLICY,
      id: `policy_${level}`,
      level,
      allowCreateDrafts: true,
      allowCreateInternalTasks: true,
      allowMoveCrmStages: true,
      allowSendComms: true,
      allowExternalPublish: true,
      allowBudgetChanges: false,
      maxDailyOutboundMessages: 200,
      maxDailyExternalPosts: 30,
      maxDailyBudgetChangePct: 5,
      requireHumanApprovalFor: ['budget_change', 'high_risk_claim', 'new_external_account', 'new_offer_claim'],
      updatedAt: now,
    };
  }
  return { ...DEFAULT_CMO_AUTONOMY_POLICY, id: `policy_${level}`, level: 'blocked', allowCreateDrafts: false, allowCreateInternalTasks: false, updatedAt: now };
}

export function canCmoPerformAction(policy: CmoAutonomyPolicy, action: string): { allowed: boolean; reason: string } {
  if (policy.blockedActions.includes(action)) return { allowed: false, reason: 'Action is explicitly blocked by CMO policy.' };
  if (policy.requireHumanApprovalFor.includes(action)) return { allowed: false, reason: 'Human approval required.' };
  if (action === 'external_publish' && !policy.allowExternalPublish) return { allowed: false, reason: 'External publishing is not enabled.' };
  if (action === 'outbound_email' || action === 'outbound_sms') {
    if (!policy.allowSendComms) return { allowed: false, reason: 'Outbound Comms require approval.' };
  }
  if (action === 'crm_stage_move' && !policy.allowMoveCrmStages) return { allowed: false, reason: 'CRM stage moves require approval.' };
  if (action === 'budget_change' && !policy.allowBudgetChanges) return { allowed: false, reason: 'Budget changes require approval.' };
  return { allowed: true, reason: 'Allowed under current CMO policy.' };
}
