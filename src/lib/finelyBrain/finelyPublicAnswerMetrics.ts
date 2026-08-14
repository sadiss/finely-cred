import { loadJson, saveJson } from '../../data/localJsonStore';

const KEY = 'finely.publicAnswerRouting.v1';

export type FinelyPublicAnswerRoute = 'canned' | 'llm';

type Store = { canned: number; llm: number; updatedAt: string | null };

const EMPTY_STORE: Store = { canned: 0, llm: 0, updatedAt: null };

function loadStore(): Store {
  return loadJson<Store>(KEY, EMPTY_STORE, 1);
}

/**
 * G1 acceptance-criteria counter: tracks the share of public-chat messages
 * resolved by a canned/local-knowledge reply (`shouldUseFinelyPublicAnswer`
 * returned true) vs. a real LLM call (`converseWithFinelyAi`), so narrowing
 * `classifyFinelyPublicTopic()` can be measured over time instead of shipped
 * unmeasured. Client-side/localStorage — same pattern as
 * `funnelExperimentsRepo.ts`'s impression/conversion counters.
 */
export function recordFinelyPublicAnswerRoute(route: FinelyPublicAnswerRoute) {
  const store = loadStore();
  store[route] += 1;
  store.updatedAt = new Date().toISOString();
  saveJson(KEY, store, 1);
}

export function getFinelyPublicAnswerRoutingStats(): Store & { total: number; llmSharePct: number } {
  const store = loadStore();
  const total = store.canned + store.llm;
  const llmSharePct = total > 0 ? Math.round((store.llm / total) * 1000) / 10 : 0;
  return { ...store, total, llmSharePct };
}
