/**
 * Structured, replayable per-agent-LLM-call trace record.
 *
 * `agentAuditLog.ts`'s `logAgentAction()` records the *business* action
 * (what the agent decided) but not the underlying LLM call's cost/latency/
 * input/output shape. This module is the structured layer underneath it —
 * one `AgentCallTrace` per `callAiGateway()` invocation, optionally linked
 * back to the business entity/outcome the call produced.
 *
 * Scaffold + pilot scope (Phase H2): wired into `aiClient.ts` as an
 * additive, optional `traceContext` argument, piloted on
 * `calebReasoningSubagents.ts` and `estherStrategySubagent.ts` only.
 * Expansion to remaining subagents is a follow-up pass once the pattern is
 * proven — see `docs/planning/round3_final_phases_K_L_H_I_J.md` (H2).
 *
 * Data-sensitivity: same class as `agentAuditLog.ts` already stores today
 * (no new PII/full-message-body category is introduced by this module).
 */
import { newId } from '../utils/ids';

export interface AgentCallTrace {
  id: string;
  agentId: string;
  taskType: string;
  provider?: string;
  model?: string;
  promptTokensEst?: number;
  completionTokensEst?: number;
  latencyMs: number;
  costUsdEst?: number;
  input: string;
  output: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  outcomeAtCapture?: string;
  createdAt: string;
}

/**
 * Additive context a caller may attach to a `callAiGateway()` invocation to
 * have it recorded as a structured trace. Omitting this argument entirely
 * must produce byte-identical behavior to today for every existing caller.
 */
export type AgentCallTraceContext = {
  agentId: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  outcomeAtCapture?: string;
};

/** Rough char-per-token heuristic — good enough for cost/latency trending, not billing-grade precision. */
export function estimateTokenCount(text: string | undefined | null): number {
  const s = String(text ?? '');
  if (!s.length) return 0;
  return Math.max(1, Math.round(s.length / 4));
}

/** Rough blended-rate cost estimate (USD per 1K tokens) — documented as an estimate, not an exact billing figure. */
const DEFAULT_COST_PER_1K_TOKENS_USD = 0.003;

export function estimateCostUsd(
  promptTokensEst: number,
  completionTokensEst: number,
  costPer1kTokensUsd = DEFAULT_COST_PER_1K_TOKENS_USD,
): number {
  const totalTokens = Math.max(0, promptTokensEst) + Math.max(0, completionTokensEst);
  return Number(((totalTokens / 1000) * costPer1kTokensUsd).toFixed(6));
}

/** Pure builder — no I/O. Callers persist the result via `agentCallTraceRepo.ts`. */
export function buildAgentCallTrace(args: {
  context: AgentCallTraceContext;
  taskType: string;
  input: string;
  output: string;
  latencyMs: number;
  provider?: string;
  model?: string;
}): AgentCallTrace {
  const promptTokensEst = estimateTokenCount(args.input);
  const completionTokensEst = estimateTokenCount(args.output);
  return {
    id: newId('trace'),
    agentId: args.context.agentId,
    taskType: args.taskType,
    provider: args.provider,
    model: args.model,
    promptTokensEst,
    completionTokensEst,
    latencyMs: Math.max(0, Math.round(args.latencyMs)),
    costUsdEst: estimateCostUsd(promptTokensEst, completionTokensEst),
    input: args.input,
    output: args.output,
    linkedEntityType: args.context.linkedEntityType,
    linkedEntityId: args.context.linkedEntityId,
    outcomeAtCapture: args.context.outcomeAtCapture,
    createdAt: new Date().toISOString(),
  };
}
