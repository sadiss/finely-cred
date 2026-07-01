import type { CmoAutopilotSettings, CmoExecutionStep, CmoRiskLevel } from '../../domain/cmoPhase3';

const riskRank: Record<CmoRiskLevel, number> = { low: 1, medium: 2, high: 3, blocked: 4 };

export interface CmoApprovalDecision {
  allowed: boolean;
  status: CmoExecutionStep['status'];
  reasons: string[];
  requiredApproval: boolean;
}

export function evaluateStepApproval(step: CmoExecutionStep, settings: CmoAutopilotSettings): CmoApprovalDecision {
  const reasons: string[] = [];
  if (step.riskLevel === 'blocked') {
    reasons.push('Blocked risk level. Rewrite or remove the action.');
    return { allowed: false, status: 'blocked', reasons, requiredApproval: true };
  }
  if (step.actionType === 'external_publish_adapter' && settings.requireHumanApprovalForExternalPublish) {
    reasons.push('External publishing requires human approval.');
  }
  if (step.actionType === 'create_comms_sequence' && settings.requireHumanApprovalForOutboundSend) {
    reasons.push('Outbound Comms sequence requires human approval before sending.');
  }
  if (riskRank[step.riskLevel] >= riskRank[settings.requireHumanApprovalForComplianceRisk]) {
    reasons.push(`Compliance risk ${step.riskLevel} meets approval threshold.`);
  }
  if (settings.autonomyLevel === 'manual') {
    reasons.push('Autonomy level is manual.');
  }
  if (settings.autonomyLevel === 'draft_only' && !['create_copy', 'generate_brief', 'score_assets', 'report'].includes(step.actionType)) {
    reasons.push('Draft-only mode can create briefs/copy/scores but not execute operational steps.');
  }
  const requiredApproval = reasons.length > 0 || step.requiresApproval;
  if (requiredApproval) return { allowed: false, status: 'needs_approval', reasons, requiredApproval };
  if (settings.autonomyLevel === 'safe_internal_auto') {
    return { allowed: true, status: 'ready', reasons: ['Safe internal automation is enabled.'], requiredApproval: false };
  }
  return { allowed: true, status: 'ready', reasons: ['Step is safe to stage.'], requiredApproval: false };
}

export function applyApprovalPolicy(steps: CmoExecutionStep[], settings: CmoAutopilotSettings): CmoExecutionStep[] {
  return steps.map((step) => {
    const decision = evaluateStepApproval(step, settings);
    return { ...step, status: decision.status, requiresApproval: decision.requiredApproval, notes: [...step.notes, ...decision.reasons] };
  });
}
