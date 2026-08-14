/**
 * Knowledge/RAG retrieval feedback (Phase J4) — lightweight thumbs-up/down capture so
 * `finelyKnowledgeIndex.ts`'s retrieval quality can be measured and nudged over time.
 *
 * A feedback record links the chunk(s) retrieved for a given query to whether the
 * resulting answer was marked helpful/unhelpful. `getKnowledgeFeedbackScoreAdjustment()`
 * turns the accumulated history into a small, conservative scoring nudge that
 * `scoreChunk()` (in `finelyKnowledgeIndex.ts`) adds on top of its existing
 * keyword-relevance score — never large enough to override keyword relevance, only to
 * bias among otherwise-similar candidates.
 *
 * House pattern: localStorage-first repo (`loadJson`/`saveJson`), same shape as
 * `complianceReviewRepo.ts` / `crmProspectsRepo.ts`.
 */
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.knowledgeFeedback.v1';

/** Cap stored records so this never grows unbounded in a long-lived browser session. */
const MAX_RECORDS = 1000;

export type KnowledgeFeedbackSurface = 'public_chat' | 'portal_coach' | 'help_strip' | 'other';

export type KnowledgeFeedbackRecord = {
  id: string;
  /** Chunk id(s) from `FinelyKnowledgeChunk.id` (or an equivalent KB article id) that were surfaced for this answer. */
  chunkIds: string[];
  /** Raw visitor/partner query text that produced the answer. */
  query: string;
  /** Pre-tokenized query (lowercase, stopword-free-ish) — cached so similarity checks don't re-tokenize on every read. */
  queryTokens: string[];
  helpful: boolean;
  surface?: KnowledgeFeedbackSurface;
  /** Route/pathname the feedback was captured on, for context. */
  route?: string;
  createdAt: string;
};

type Store = { records: KnowledgeFeedbackRecord[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { records: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function norm(s: unknown): string {
  return String(s ?? '').trim();
}

function uniqStrings(arr: string[]): string[] {
  return Array.from(new Set(arr.map(norm).filter(Boolean)));
}

/** Small standalone tokenizer — deliberately not shared with `finelyKnowledgeIndex.ts`'s
 * `tokenize()` to avoid a circular import (the index imports this repo, not vice versa). */
function simpleTokens(text: string): string[] {
  return norm(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export type RecordKnowledgeFeedbackInput = {
  chunkIds: string[];
  query: string;
  helpful: boolean;
  surface?: KnowledgeFeedbackSurface;
  route?: string;
};

/** Persist one feedback event. Safe to call with an empty `chunkIds` (no-op, returns null). */
export function recordKnowledgeFeedback(input: RecordKnowledgeFeedbackInput): KnowledgeFeedbackRecord | null {
  const chunkIds = uniqStrings(input.chunkIds ?? []);
  const query = norm(input.query);
  if (!chunkIds.length) return null;

  const record: KnowledgeFeedbackRecord = {
    id: newId('kbfb'),
    chunkIds,
    query,
    queryTokens: simpleTokens(query),
    helpful: Boolean(input.helpful),
    surface: input.surface,
    route: input.route,
    createdAt: new Date().toISOString(),
  };

  const store = loadStore();
  store.records = [record, ...store.records].slice(0, MAX_RECORDS);
  saveStore(store);
  return record;
}

export function listKnowledgeFeedback(): KnowledgeFeedbackRecord[] {
  return loadStore().records.slice();
}

export function listKnowledgeFeedbackForChunk(chunkId: string): KnowledgeFeedbackRecord[] {
  const id = norm(chunkId);
  if (!id) return [];
  return loadStore().records.filter((r) => r.chunkIds.includes(id));
}

/** Overlap ratio (0..1) between a feedback record's stored query tokens and a fresh query's tokens. */
function tokenOverlapRatio(recordTokens: string[], queryTokenSet: Set<string>): number {
  if (!recordTokens.length) return 0;
  const hits = recordTokens.filter((t) => queryTokenSet.has(t)).length;
  return hits / recordTokens.length;
}

/**
 * Maximum absolute adjustment `scoreChunk()` may apply. Kept small relative to that
 * function's existing per-token-match scoring (+2 per hit) so this can only nudge
 * ranking among otherwise-similar candidates — it can never turn an irrelevant chunk
 * into a top hit, nor bury a strongly keyword-relevant one.
 */
const MAX_SCORE_ADJUSTMENT = 1.5;

/** Only count a prior feedback record as "about a similar query" once its token overlap
 * with the current query clears this bar — keeps unrelated past feedback from leaking in. */
const SIMILAR_QUERY_OVERLAP_MIN = 0.34;

/**
 * Soft scoring adjustment for one chunk, given the current query's tokens (the same
 * tokens `scoreChunk()` already computed via `tokenize()`). Returns a small positive
 * number when this chunk has historically been marked helpful for similar queries, a
 * small negative number when historically unhelpful, or `0` when there is no feedback
 * history or none of it is similar enough to the current query to count.
 *
 * This same function is designed to apply unchanged to the future pgvector retrieval
 * path (`searchFinelyKnowledgeVector()` in `finelyKnowledgeIndex.ts`) once that path is
 * adopted — chunk ids are stable across both retrieval mechanisms, so the same
 * historical feedback record set is reusable as-is.
 */
export function getKnowledgeFeedbackScoreAdjustment(chunkId: string, queryTokens: string[]): number {
  if (!chunkId || !queryTokens.length) return 0;
  const records = listKnowledgeFeedbackForChunk(chunkId);
  if (!records.length) return 0;

  const queryTokenSet = new Set(queryTokens.map((t) => t.toLowerCase()));
  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of records) {
    const overlap = tokenOverlapRatio(r.queryTokens, queryTokenSet);
    if (overlap < SIMILAR_QUERY_OVERLAP_MIN) continue;
    weightedSum += (r.helpful ? 1 : -1) * overlap;
    weightTotal += overlap;
  }
  if (!weightTotal) return 0;

  const ratio = weightedSum / weightTotal; // -1..1
  return Math.max(-MAX_SCORE_ADJUSTMENT, Math.min(MAX_SCORE_ADJUSTMENT, ratio * MAX_SCORE_ADJUSTMENT));
}

/** Aggregate helpful/unhelpful counts — for future admin telemetry (retrieval-quality dashboards). */
export function knowledgeFeedbackStats(): { total: number; helpful: number; unhelpful: number; helpfulRatio: number } {
  const records = loadStore().records;
  const helpful = records.filter((r) => r.helpful).length;
  const unhelpful = records.length - helpful;
  return {
    total: records.length,
    helpful,
    unhelpful,
    helpfulRatio: records.length ? helpful / records.length : 0,
  };
}
