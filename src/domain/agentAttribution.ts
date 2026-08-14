/**
 * Agent-action → CRM-outcome attribution — shared data model.
 *
 * `AttributionTouch`/`AttributionOutcome` are intentionally generic (not CRM-specific in shape)
 * so a future Phase E2 channel-level view can reuse them without redefining a parallel model
 * (per the enhancement plan's explicit "one model, two views" instruction). `agentAttributionEngine.ts`
 * builds `AgentAttributionSummary[]` (the per-agent join/aggregation) on top of these two types, and is
 * structured so G2b ("why didn't this convert" post-mortems) and G4a (conversion-likelihood scoring)
 * can extend it additively without touching the core join logic.
 */
import type { CrmRecordStage } from './crmRecords';

/** One logged agent action against a CRM record (from `agentAuditLog.ts`'s `logAgentAction()` calls). */
export type AttributionTouch = {
  /** Growth agent registry id, e.g. 'crm-sequence-engine', 'appointment-setter', or a sub-agent id. */
  agentId: string;
  action: string;
  entityId: string;
  entityType: string;
  occurredAt: string;
  auditEventId: string;
};

/** The eventual outcome of the entity a touch was made against, at read time. */
export type AttributionOutcome = {
  entityId: string;
  finalStage: CrmRecordStage;
  resolvedAt?: string;
};

/** Per-agent last-touch attribution rollup (G2's core output). */
export type AgentAttributionSummary = {
  agentId: string;
  agentDisplayName: string;
  touches: number;
  entitiesTouched: number;
  entitiesWon: number;
  conversionRate: number;
  /**
   * Mandatory (not optional) — every rendered summary must surface this so the UI can never
   * silently present localStorage-only data as ground-truth, cross-device attribution.
   */
  dataCompletenessNote: string;
};

/** Stages counted as a "win" for last-touch attribution purposes. */
export const ATTRIBUTION_WON_STAGES: ReadonlySet<CrmRecordStage> = new Set<CrmRecordStage>([
  'won',
  'active_client',
  'converted',
]);

export const ATTRIBUTION_DATA_COMPLETENESS_NOTE =
  "Reflects activity from this browser's history — full cross-device attribution ships with the server-side automation upgrade.";

/**
 * G2b — "why didn't this convert" post-mortem finding. One row per logged `no_action`/skip
 * decision an agent made against a CRM record, joined forward in time to that record's actual
 * eventual outcome. `wasLikelyMisjudged` is true when the record reached a "won" stage anyway
 * (via a different path/agent/channel) after the agent chose not to act — a real signal that
 * the hold-back decision may have been too conservative, not proof the decision was wrong.
 */
export type PostMortemFinding = {
  agentId: string;
  agentDisplayName: string;
  entityId: string;
  entityLabel: string;
  decisionAction: string;
  decisionAt: string;
  decisionReasoning: string;
  actualOutcome: CrmRecordStage;
  wasLikelyMisjudged: boolean;
};

/** G4a — internal-only, rule-based conversion-likelihood bucket for a single CRM record. */
export type ConversionLikelihoodBucket = 'low' | 'medium' | 'high';

export type ConversionLikelihoodSignal = {
  bucket: ConversionLikelihoodBucket;
  /** 0-100 raw heuristic score backing the bucket — for tooltips/debugging, not shown as a "percent chance." */
  score: number;
  /** Names the top factors that drove the score — never a black-box number alone. */
  reasoning: string;
  factors: string[];
};

/** Shared lookup tables `computeConversionLikelihood()` needs, built once per render pass. */
export type ConversionLikelihoodContext = {
  touchesByEntity: Map<string, AttributionTouch[]>;
  agentConversionRateById: Map<string, number>;
  sourceWinRate: Map<string, number>;
  medianDaysToWin: number;
};
