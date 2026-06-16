/** Auto-created underwriting tasks when a partner hits fund-ready (Bridge handoff). */

export type BridgeUnderwritingTaskTemplate = {
  id: string;
  title: string;
  kind: string;
  stage: string;
  priority: string;
  notes: string;
  tags: string[];
};

export const BRIDGE_UNDERWRITING_TASKS: BridgeUnderwritingTaskTemplate[] = [
  {
    id: 'bridge_pre_qual',
    title: 'Pre-qual underwriting review',
    kind: 'underwriting',
    stage: 'pre_qual',
    priority: 'high',
    notes: 'Review fund-ready profile, DTI inputs, and dispute posture before lender routing.',
    tags: ['bridge', 'underwriting', 'pre-qual'],
  },
  {
    id: 'bridge_ml_funding_path',
    title: 'ML funding path scan',
    kind: 'underwriting',
    stage: 'ml_scan',
    priority: 'high',
    notes: 'Run ml.funding_path advisory and attach recommended sequencing to CRM.',
    tags: ['bridge', 'underwriting', 'ml'],
  },
  {
    id: 'bridge_lender_match',
    title: 'Lender match',
    kind: 'underwriting',
    stage: 'lender_match',
    priority: 'medium',
    notes: 'Match partner profile to Nora / Bridge lender criteria and note blockers.',
    tags: ['bridge', 'underwriting', 'lender'],
  },
  {
    id: 'bridge_leg201_consent',
    title: 'LEG-201 consent verification',
    kind: 'compliance',
    stage: 'consent',
    priority: 'high',
    notes: 'Confirm LEG-201 consent, e-sign, and communication opt-ins before packet export.',
    tags: ['bridge', 'compliance', 'leg-201'],
  },
  {
    id: 'bridge_packet_export',
    title: 'Underwriting packet export (v2)',
    kind: 'underwriting',
    stage: 'packet_export',
    priority: 'medium',
    notes: 'Export underwriting packet v2 with Finely Cred credit program section for Bridge origination.',
    tags: ['bridge', 'underwriting', 'packet'],
  },
];

export function bridgeTaskRow(partnerId: string, template: BridgeUnderwritingTaskTemplate, batchAt: string) {
  const id = `bridge_${template.id}_${partnerId}_${batchAt.slice(0, 10)}`;
  return {
    id,
    tenant_id: 'finely_cred',
    partner_id: partnerId,
    title: template.title,
    kind: template.kind,
    stage: template.stage,
    priority: template.priority,
    status: 'pending',
    notes: template.notes,
    tags: template.tags,
    assigned_to: 'admin',
    visibility: 'admin',
    source_rule_id: 'finely_bridge_fund_ready',
    task: { bridgeTemplateId: template.id, batchAt },
  };
}

export type BridgeHandoffSuggestion = {
  suggested: boolean;
  reason: string;
  phase: string;
  tasks: BridgeUnderwritingTaskTemplate[];
};

export function buildBridgeSuggestion(creditPhase: string): BridgeHandoffSuggestion {
  const fundReady = creditPhase === 'fund_ready' || creditPhase === 'bridge_handoff';
  return {
    suggested: fundReady,
    reason: fundReady
      ? 'Partner reached fund-ready — queue Bridge underwriting tasks and notify origination.'
      : 'Partner not yet fund-ready — complete restore and monitoring phases first.',
    phase: creditPhase,
    tasks: fundReady ? BRIDGE_UNDERWRITING_TASKS : [],
  };
}
