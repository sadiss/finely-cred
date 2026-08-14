/**
 * Agent-action → CRM-outcome attribution engine (Phase G2).
 *
 * Joins `logAgentAction()`'s audit trail (`auditRepo.ts`, 100% localStorage today) against
 * CRM records' current `stage` (`crmRecordsRepo.ts`) to build a last-touch attribution view:
 * which agent's action was the most recent one against a CRM record before it reached its
 * current stage, and did that record end up "won."
 *
 * Deliberately split into small, exported building blocks (`listAttributionTouches`,
 * `resolveAttributionOutcome`, `computeLastTouchByEntity`) rather than one monolithic function,
 * so G2b (post-mortem loop) and G4a (conversion-likelihood scoring) can both extend this file
 * by reusing the join primitives without needing to touch `computeAgentAttribution()` itself.
 *
 * HONESTY NOTE: `auditRepo.ts` is client-side/localStorage only — this data reflects one
 * browser's history, not cross-device ground truth. `ATTRIBUTION_DATA_COMPLETENESS_NOTE`
 * must be rendered wherever this engine's output is shown (see `AgentAttributionPanel.tsx`).
 */
import type { AuditEvent } from '../domain/audit';
import { listAuditEvents } from '../data/auditRepo';
import { getCrmRecord, listCrmRecords } from '../data/crmRecordsRepo';
import { crmRecordDisplayName, type CrmRecord } from '../domain/crmRecords';
import { resolveAgentDisplayName } from './agentAuditLog';
import {
  ATTRIBUTION_DATA_COMPLETENESS_NOTE,
  ATTRIBUTION_WON_STAGES,
  type AgentAttributionSummary,
  type AttributionOutcome,
  type AttributionTouch,
  type ConversionLikelihoodBucket,
  type ConversionLikelihoodContext,
  type ConversionLikelihoodSignal,
  type PostMortemFinding,
} from '../domain/agentAttribution';

const CRM_ENTITY_TYPE = 'crm_record';

export { ATTRIBUTION_DATA_COMPLETENESS_NOTE };

/** Every logged agent action against a CRM record, oldest first. */
export function listAttributionTouches(): AttributionTouch[] {
  return listAuditEvents()
    .filter((e) => e.actorType === 'agent' && e.entityType === CRM_ENTITY_TYPE && !!e.entityId && !!e.actorUserId)
    .map((e) => ({
      agentId: e.actorUserId as string,
      action: e.action,
      entityId: e.entityId as string,
      entityType: e.entityType as string,
      occurredAt: e.createdAt,
      auditEventId: e.id,
    }))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

/** Current outcome (stage) for a CRM record, read live from `crmRecordsRepo.ts`. */
export function resolveAttributionOutcome(entityId: string): AttributionOutcome | null {
  const record = getCrmRecord(entityId);
  if (!record) return null;
  return { entityId, finalStage: record.stage, resolvedAt: record.updatedAt };
}

/** Most recent touch per entity — the last-touch attribution join key. */
export function computeLastTouchByEntity(touches: AttributionTouch[]): Map<string, AttributionTouch> {
  const map = new Map<string, AttributionTouch>();
  for (const touch of touches) {
    const existing = map.get(touch.entityId);
    if (!existing || touch.occurredAt >= existing.occurredAt) map.set(touch.entityId, touch);
  }
  return map;
}

/** All touches for a given entity, oldest first — used by G4a (touch-count feature) and G2b (decision history). */
export function listTouchesForEntity(touches: AttributionTouch[], entityId: string): AttributionTouch[] {
  return touches.filter((t) => t.entityId === entityId);
}

export function isWonOutcome(outcome: Pick<AttributionOutcome, 'finalStage'>): boolean {
  return ATTRIBUTION_WON_STAGES.has(outcome.finalStage);
}

/**
 * Per-agent last-touch attribution rollup: for every CRM record with at least one logged agent
 * touch, credit whichever agent made the most recent touch; if the record's current stage is a
 * "won" stage, credit that agent with a win.
 */
export function computeAgentAttribution(): AgentAttributionSummary[] {
  const touches = listAttributionTouches();
  const lastTouchByEntity = computeLastTouchByEntity(touches);

  const byAgent = new Map<string, { touches: number; entities: Set<string>; won: Set<string> }>();
  const ensureBucket = (agentId: string) => {
    let bucket = byAgent.get(agentId);
    if (!bucket) {
      bucket = { touches: 0, entities: new Set(), won: new Set() };
      byAgent.set(agentId, bucket);
    }
    return bucket;
  };

  for (const touch of touches) {
    const bucket = ensureBucket(touch.agentId);
    bucket.touches += 1;
    bucket.entities.add(touch.entityId);
  }

  for (const [entityId, lastTouch] of lastTouchByEntity) {
    const outcome = resolveAttributionOutcome(entityId);
    if (!outcome || !isWonOutcome(outcome)) continue;
    ensureBucket(lastTouch.agentId).won.add(entityId);
  }

  return Array.from(byAgent.entries())
    .map(([agentId, bucket]) => {
      const entitiesTouched = bucket.entities.size;
      const entitiesWon = bucket.won.size;
      return {
        agentId,
        agentDisplayName: resolveAgentDisplayName(agentId),
        touches: bucket.touches,
        entitiesTouched,
        entitiesWon,
        conversionRate: entitiesTouched > 0 ? entitiesWon / entitiesTouched : 0,
        dataCompletenessNote: ATTRIBUTION_DATA_COMPLETENESS_NOTE,
      } satisfies AgentAttributionSummary;
    })
    .sort((a, b) => b.touches - a.touches);
}

// ──────────────────────────────────────────────────────────────────────────
// G2b — "Why didn't this convert" post-mortem loop
// ──────────────────────────────────────────────────────────────────────────

/** Matches every no_action/held/skip action string this codebase logs (e.g. `handoff.no_action`, `brain.directive.no_action`). */
const NO_ACTION_ACTION_RE = /no_action|\bskip/i;

export function isNoActionTouch(touch: Pick<AttributionTouch, 'action'>): boolean {
  return NO_ACTION_ACTION_RE.test(touch.action);
}

/**
 * G2b — for every logged no_action/held decision an agent made against a CRM record, revisits
 * what actually happened to that record later: did it convert anyway (via a different agent or
 * channel), go cold, or genuinely stay dead. This is a backward-looking sibling of
 * `computeAgentAttribution()`'s forward last-touch view, sharing the same join primitives
 * (`resolveAttributionOutcome`, `isWonOutcome`) rather than re-deriving them.
 *
 * PREREQUISITE (verified/fixed as part of this pass): `calebReasoningSubagents.ts`'s Handoff
 * Router previously only logged its positive (`handoff.routed_to_alex`) branch — the held/negative
 * branch now logs `handoff.no_action` on the same `crm_record` entity, so this join has real data.
 */
export function runDecisionPostMortem(lookbackDays = 180): PostMortemFinding[] {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const noActionEvents: (AuditEvent & { entityId: string; actorUserId: string })[] = listAuditEvents().filter(
    (e): e is AuditEvent & { entityId: string; actorUserId: string } =>
      e.actorType === 'agent' &&
      e.entityType === CRM_ENTITY_TYPE &&
      !!e.entityId &&
      !!e.actorUserId &&
      isNoActionTouch({ action: e.action }) &&
      Date.parse(e.createdAt) >= cutoff,
  );

  const findings: PostMortemFinding[] = [];
  for (const event of noActionEvents) {
    const outcome = resolveAttributionOutcome(event.entityId);
    if (!outcome) continue; // record no longer resolvable (deleted/merged) — nothing to post-mortem
    const record = getCrmRecord(event.entityId);
    const won = isWonOutcome(outcome);
    findings.push({
      agentId: event.actorUserId,
      agentDisplayName: resolveAgentDisplayName(event.actorUserId),
      entityId: event.entityId,
      entityLabel: record ? crmRecordDisplayName(record) : event.entityId,
      decisionAction: event.action,
      decisionAt: event.createdAt,
      decisionReasoning: String(event.meta?.reasoning || '').trim() || 'No reasoning captured for this decision.',
      actualOutcome: outcome.finalStage,
      wasLikelyMisjudged: won,
    });
  }

  return findings.sort((a, b) => {
    if (a.wasLikelyMisjudged !== b.wasLikelyMisjudged) return a.wasLikelyMisjudged ? -1 : 1;
    return b.decisionAt.localeCompare(a.decisionAt);
  });
}

// ──────────────────────────────────────────────────────────────────────────
// G4a — internal CRM-record conversion-probability signal
// ──────────────────────────────────────────────────────────────────────────

/**
 * Builds the shared lookup tables `computeConversionLikelihood()` needs once per render pass
 * (touches-by-entity, per-agent conversion rate from G2's join, per-source win rate, and the
 * median days-to-win across records that already converted) so a board/list view doesn't
 * re-scan `auditRepo`/`crmRecordsRepo` on every card.
 */
export function buildConversionLikelihoodContext(): ConversionLikelihoodContext {
  const touches = listAttributionTouches();
  const touchesByEntity = new Map<string, AttributionTouch[]>();
  for (const touch of touches) {
    const list = touchesByEntity.get(touch.entityId);
    if (list) list.push(touch);
    else touchesByEntity.set(touch.entityId, [touch]);
  }

  const agentConversionRateById = new Map<string, number>();
  for (const summary of computeAgentAttribution()) {
    agentConversionRateById.set(summary.agentId, summary.conversionRate);
  }

  const records = listCrmRecords();
  const sourceTotals = new Map<string, { total: number; won: number }>();
  const daysToWin: number[] = [];
  for (const record of records) {
    const bucket = sourceTotals.get(record.source) ?? { total: 0, won: 0 };
    bucket.total += 1;
    if (ATTRIBUTION_WON_STAGES.has(record.stage)) {
      bucket.won += 1;
      const created = Date.parse(record.createdAt);
      const updated = Date.parse(record.updatedAt);
      if (Number.isFinite(created) && Number.isFinite(updated) && updated > created) {
        daysToWin.push((updated - created) / 86_400_000);
      }
    }
    sourceTotals.set(record.source, bucket);
  }
  const sourceWinRate = new Map<string, number>();
  for (const [source, bucket] of sourceTotals) {
    sourceWinRate.set(source, bucket.total > 0 ? bucket.won / bucket.total : 0);
  }
  daysToWin.sort((a, b) => a - b);
  const medianDaysToWin = daysToWin.length ? daysToWin[Math.floor(daysToWin.length / 2)]! : 21;

  return { touchesByEntity, agentConversionRateById, sourceWinRate, medianDaysToWin };
}

/**
 * Named, auditable weights behind `computeConversionLikelihood()` — every factor below is
 * surfaced in the returned `reasoning`/`factors`, so this stays a transparent heuristic score,
 * never an opaque ML prediction (no ML training infra exists in this codebase by design).
 */
const CONVERSION_SCORE_WEIGHTS = {
  noTouches: -15,
  perTouch: 4,
  perTouchCap: 20,
  recentTouchWithinDays: 3,
  recentTouchBoost: 10,
  staleTouchAfterDays: 14,
  staleTouchPenalty: -12,
  strongAgentConversionFloor: 0.2,
  strongAgentConversionBoost: 10,
  weakAgentConversionCeiling: 0.1,
  weakAgentConversionPenalty: -5,
  onPaceStageBoost: 8,
  stallingStageMultiplier: 1.5,
  stallingStagePenalty: -15,
  strongSourceWinRateFloor: 0.15,
  strongSourceWinRateBoost: 6,
  weakSourceWinRateCeiling: 0.05,
  weakSourceWinRatePenalty: -4,
} as const;

/**
 * G4a — internal-only, rule-based "how likely is this CRM record to convert" signal, derived
 * from G2's attribution join (touch count + recency + last-touch agent's conversion rate),
 * the record's source-channel win rate, and stage velocity vs. the historical median
 * time-to-win for records that actually converted. Explicitly heuristic/transparent — never
 * shown to a partner, staff-triage only (see G4a in `docs/planning/round3_final_phases_C0_C_G_D.md`).
 */
export function computeConversionLikelihood(
  record: CrmRecord,
  context?: ConversionLikelihoodContext,
): ConversionLikelihoodSignal {
  if (record.stage === 'lost' || record.stage === 'disqualified') {
    return {
      bucket: 'low',
      score: 0,
      reasoning: `Already reached a closed-lost stage (${record.stage}).`,
      factors: [`Closed stage: ${record.stage}`],
    };
  }
  if (ATTRIBUTION_WON_STAGES.has(record.stage)) {
    return {
      bucket: 'high',
      score: 100,
      reasoning: `Already converted (${record.stage}).`,
      factors: [`Closed stage: ${record.stage}`],
    };
  }

  const ctx = context ?? buildConversionLikelihoodContext();
  const w = CONVERSION_SCORE_WEIGHTS;
  const factors: string[] = [];
  let score = 50;

  const touches = ctx.touchesByEntity.get(record.id) ?? [];
  if (touches.length === 0) {
    score += w.noTouches;
    factors.push('No agent touches logged yet');
  } else {
    score += Math.min(touches.length * w.perTouch, w.perTouchCap);
    factors.push(`${touches.length} agent touch${touches.length === 1 ? '' : 'es'} logged`);

    const lastTouch = touches.reduce((latest, t) => (t.occurredAt > latest.occurredAt ? t : latest));
    const daysSinceLastTouch = (Date.now() - Date.parse(lastTouch.occurredAt)) / 86_400_000;
    if (Number.isFinite(daysSinceLastTouch)) {
      if (daysSinceLastTouch <= w.recentTouchWithinDays) {
        score += w.recentTouchBoost;
        factors.push(`Touched in the last ${w.recentTouchWithinDays} days`);
      } else if (daysSinceLastTouch > w.staleTouchAfterDays) {
        score += w.staleTouchPenalty;
        factors.push(`${Math.round(daysSinceLastTouch)}d since last agent touch — going cold`);
      }
    }

    const agentRate = ctx.agentConversionRateById.get(lastTouch.agentId);
    if (agentRate != null) {
      if (agentRate >= w.strongAgentConversionFloor) {
        score += w.strongAgentConversionBoost;
        factors.push(`${resolveAgentDisplayName(lastTouch.agentId)} converts ${Math.round(agentRate * 100)}% of last-touch records`);
      } else if (agentRate < w.weakAgentConversionCeiling) {
        score += w.weakAgentConversionPenalty;
      }
    }
  }

  const daysInPipeline = (Date.now() - Date.parse(record.createdAt)) / 86_400_000;
  if (Number.isFinite(daysInPipeline) && ctx.medianDaysToWin > 0) {
    if (daysInPipeline > ctx.medianDaysToWin * w.stallingStageMultiplier) {
      score += w.stallingStagePenalty;
      factors.push(`${Math.round(daysInPipeline)}d in pipeline vs ${Math.round(ctx.medianDaysToWin)}d median time-to-win — stalling`);
    } else if (daysInPipeline <= ctx.medianDaysToWin) {
      score += w.onPaceStageBoost;
      factors.push(`Within the typical ${Math.round(ctx.medianDaysToWin)}d time-to-win window`);
    }
  }

  const sourceRate = ctx.sourceWinRate.get(record.source);
  if (sourceRate != null) {
    if (sourceRate >= w.strongSourceWinRateFloor) {
      score += w.strongSourceWinRateBoost;
      factors.push(`${record.source} channel converts ${Math.round(sourceRate * 100)}% overall`);
    } else if (sourceRate < w.weakSourceWinRateCeiling) {
      score += w.weakSourceWinRatePenalty;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const bucket: ConversionLikelihoodBucket = score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';
  const reasoning = factors.length ? factors.slice(0, 3).join(' · ') : 'Not enough signal yet.';

  return { bucket, score, reasoning, factors };
}
