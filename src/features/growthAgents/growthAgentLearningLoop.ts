/**
 * Outcome-based learning-loop confidence indicator (Phase 3).
 *
 * Honest framing: this tracks each agent's *decision confidence* — how often its
 * AI-gateway reasoning step produces a clear, actionable, high-confidence
 * directive vs. bailing to no_action — trending week over week, fed by real
 * logged outcomes (`growthAgentBrain.ts` calls `recordAgentOutcome` after every
 * reasoning step). It is not a claim of revenue/conversion causality; it is a
 * visible, provable "is this agent getting more decisive over time" signal that
 * a human can inspect, which is what closes the "agents don't visibly get
 * smarter" gap without asserting more than the data supports.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';

const KEY = 'finely.growth_agent_learning_log.v1';
const MAX_PER_AGENT = 500;

export type AgentOutcomeEntry = {
  at: string;
  directive: string;
  autoExecuted: boolean;
  hadDirective: boolean;
};

type Store = Record<string, AgentOutcomeEntry[]>;

function loadStore(): Store {
  return loadJson<Store>(KEY, {}, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function recordAgentOutcome(agentId: string, entry: Omit<AgentOutcomeEntry, 'at'>) {
  const store = loadStore();
  const rows = store[agentId] ?? [];
  rows.unshift({ at: new Date().toISOString(), ...entry });
  store[agentId] = rows.slice(0, MAX_PER_AGENT);
  saveStore(store);
}

export type AgentConfidence = {
  agentId: string;
  sampleSize: number;
  decisiveRate: number;
  autoExecuteRate: number;
  /** decisiveRate this window minus prior window — positive means visibly improving. */
  trendDelta: number;
  label: 'new' | 'learning' | 'confident' | 'highly confident';
};

function windowStats(rows: AgentOutcomeEntry[], sinceMs: number, untilMs: number) {
  const windowRows = rows.filter((r) => {
    const t = Date.parse(r.at);
    return t >= sinceMs && t < untilMs;
  });
  const decisive = windowRows.filter((r) => r.hadDirective && r.directive !== 'no_action').length;
  const auto = windowRows.filter((r) => r.autoExecuted).length;
  return { count: windowRows.length, decisive, auto };
}

/** Visible per-agent confidence score for the Growth Command Hub agent cards. */
export function getAgentConfidence(agentId: string): AgentConfidence {
  const rows = loadStore()[agentId] ?? [];
  const now = Date.now();
  const week = 7 * 86_400_000;

  const thisWeek = windowStats(rows, now - week, now);
  const lastWeek = windowStats(rows, now - 2 * week, now - week);

  const decisiveRate = thisWeek.count ? thisWeek.decisive / thisWeek.count : 0;
  const autoExecuteRate = thisWeek.count ? thisWeek.auto / thisWeek.count : 0;
  const lastDecisiveRate = lastWeek.count ? lastWeek.decisive / lastWeek.count : decisiveRate;
  const trendDelta = decisiveRate - lastDecisiveRate;

  let label: AgentConfidence['label'] = 'new';
  if (thisWeek.count >= 30 && decisiveRate >= 0.75) label = 'highly confident';
  else if (thisWeek.count >= 12 && decisiveRate >= 0.5) label = 'confident';
  else if (thisWeek.count >= 3) label = 'learning';

  return {
    agentId,
    sampleSize: thisWeek.count,
    decisiveRate,
    autoExecuteRate,
    trendDelta,
    label,
  };
}

export function getAllAgentConfidences(agentIds: string[]): AgentConfidence[] {
  return agentIds.map(getAgentConfidence);
}
