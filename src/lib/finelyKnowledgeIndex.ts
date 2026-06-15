/**
 * FinelyKnowledgeIndex (Launch Part E6) — unified RAG layer.
 *
 * One searchable brain over every operating-manual source:
 *  - Platform SOPs (domain/platformSops)
 *  - Site tour scripts (config/tourManifest)
 *  - Existing knowledge corpus (knowledge/finelyKnowledgeBase + feature map)
 *
 * Keyword/token scoring with route affinity — no vector DB required at launch.
 * Returns cited chunks the copilot/brain can surface ("Source: Upload report SOP").
 * A production vector store (Supabase pgvector) can replace `scoreChunk` later
 * without changing callers.
 */

import { PLATFORM_SOP_LIBRARY } from '../domain/platformSops';
import { TOUR_MANIFEST } from '../config/tourManifest';
import { MODULE_PLAYBOOKS } from '../config/modulePlaybooks';
import { getKnowledgeCorpus } from './kbFeatureMapSync';

export type KnowledgeSource = 'sop' | 'tour' | 'article' | 'module';

export type FinelyKnowledgeChunk = {
  id: string;
  source: KnowledgeSource;
  title: string;
  /** Full searchable body */
  text: string;
  tags: string[];
  /** Primary route this chunk explains (for route-affinity boosting + deep links) */
  route?: string;
  sopId?: string;
  tourId?: string;
};

export type FinelyKnowledgeHit = FinelyKnowledgeChunk & {
  score: number;
  snippet: string;
};

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'can', 'i', 'you', 'we', 'they', 'it', 'this', 'that', 'my', 'me', 'what', 'how', 'when', 'where', 'why',
  'about', 'page', 'help',
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function snippetOf(text: string, maxLen = 200): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= maxLen ? t : `${t.slice(0, maxLen).trim()}…`;
}

let CACHE: FinelyKnowledgeChunk[] | null = null;

/** Build (and memoize) the unified chunk list across all knowledge sources. */
export function buildFinelyKnowledgeChunks(): FinelyKnowledgeChunk[] {
  if (CACHE) return CACHE;
  const chunks: FinelyKnowledgeChunk[] = [];

  for (const sop of PLATFORM_SOP_LIBRARY) {
    const text = [
      sop.title,
      sop.whenToUse,
      `Owner: ${sop.ownerRole}.`,
      ...sop.steps.map((s) => `${s.order}. ${s.label}: ${s.detail}`),
      ...(sop.complianceNotes ?? []),
    ].join('\n');
    chunks.push({
      id: `sop:${sop.id}`,
      source: 'sop',
      title: sop.title,
      text,
      tags: [sop.lane, sop.audience, ...sop.steps.map((s) => s.label.toLowerCase())],
      route: sop.relatedRoutes[0],
      sopId: sop.id,
      tourId: sop.relatedTourId,
    });
  }

  for (const tour of TOUR_MANIFEST) {
    chunks.push({
      id: `tour:${tour.id}`,
      source: 'tour',
      title: tour.title,
      text: [tour.title, ...tour.steps.map((s) => `${s.label}: ${s.narrationPlain}`)].join('\n'),
      tags: [tour.lane, 'video', 'watch how', 'tour'],
      route: tour.startPath,
      tourId: tour.id,
      sopId: tour.relatedSopId,
    });
  }

  for (const mod of MODULE_PLAYBOOKS) {
    chunks.push({
      id: `module:${mod.id}`,
      source: 'module',
      title: mod.title,
      text: [mod.title, mod.plainSummary, mod.path].join('\n'),
      tags: [mod.lane, 'module', 'how to', mod.title.toLowerCase()],
      route: mod.path,
      sopId: mod.sopId,
      tourId: mod.tourId,
    });
  }

  for (const article of getKnowledgeCorpus()) {
    chunks.push({
      id: `article:${article.id}`,
      source: 'article',
      title: article.title,
      text: `${article.title}\n${article.content}`,
      tags: [article.category, ...article.tags],
      route: article.links?.[0]?.path,
    });
  }

  CACHE = chunks;
  return chunks;
}

/** Force a rebuild (e.g. after dynamic KB sync). */
export function invalidateFinelyKnowledgeIndex(): void {
  CACHE = null;
}

function routeAffinity(chunkRoute: string | undefined, contextRoute: string | undefined): number {
  if (!chunkRoute || !contextRoute) return 0;
  const a = chunkRoute.split('?')[0];
  const b = contextRoute.split('?')[0];
  if (a === b) return 6;
  if (b.startsWith(a) || a.startsWith(b)) return 4;
  // Same top-level lane (e.g. both /portal/*)
  const aTop = a.split('/').filter(Boolean)[0];
  const bTop = b.split('/').filter(Boolean)[0];
  if (aTop && aTop === bTop) return 1.5;
  return 0;
}

function scoreChunk(chunk: FinelyKnowledgeChunk, queryTokens: string[], contextRoute?: string): number {
  const hay = `${chunk.title} ${chunk.text} ${chunk.tags.join(' ')}`.toLowerCase();
  const tagHay = chunk.tags.join(' ').toLowerCase();
  let score = 0;
  for (const qt of queryTokens) {
    if (hay.includes(qt)) score += 2;
    if (tagHay.includes(qt)) score += 2;
    if (chunk.title.toLowerCase().includes(qt)) score += 2;
  }
  score += routeAffinity(chunk.route, contextRoute);
  return score;
}

export type FinelyKnowledgeSearchOpts = {
  limit?: number;
  /** Current route — boosts chunks that explain this page */
  contextRoute?: string;
  /** Restrict to certain sources */
  sources?: KnowledgeSource[];
  minScore?: number;
};

/** Top-k retrieval across the unified index. Empty query → route-relevant defaults. */
export function searchFinelyKnowledge(query: string, opts: FinelyKnowledgeSearchOpts = {}): FinelyKnowledgeHit[] {
  const limit = Math.max(1, Math.min(12, opts.limit ?? 5));
  const minScore = opts.minScore ?? 1;
  let chunks = buildFinelyKnowledgeChunks();
  if (opts.sources?.length) {
    const allow = new Set(opts.sources);
    chunks = chunks.filter((c) => allow.has(c.source));
  }
  const tokens = tokenize(query);

  // Empty query → best route-relevant chunks so the copilot always has context.
  if (!tokens.length) {
    return chunks
      .map((c) => ({ ...c, score: routeAffinity(c.route, opts.contextRoute), snippet: snippetOf(c.text) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  return chunks
    .map((c) => ({ ...c, score: scoreChunk(c, tokens, opts.contextRoute), snippet: snippetOf(c.text) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Format hits for injection into an AI system prompt (cited, authoritative). */
export function formatFinelyKnowledgeForPrompt(hits: FinelyKnowledgeHit[]): string {
  if (!hits.length) return '';
  const lines = hits.map((h, i) => {
    const where = h.route ? ` (open: ${h.route})` : '';
    return `[${i + 1}] ${h.title} — ${sourceLabel(h.source)}${where}\n${h.snippet}`;
  });
  return `FINELY CRED OPERATING KNOWLEDGE (authoritative — prefer over general knowledge):\n\n${lines.join('\n\n')}`;
}

export function sourceLabel(source: KnowledgeSource): string {
  if (source === 'sop') return 'SOP';
  if (source === 'tour') return 'Video tour';
  if (source === 'module') return 'Module guide';
  return 'Guide';
}

/** Count of indexed chunks per source — for launch gates / admin telemetry. */
export function finelyKnowledgeIndexStats(): { total: number; bySource: Record<KnowledgeSource, number> } {
  const chunks = buildFinelyKnowledgeChunks();
  const bySource: Record<KnowledgeSource, number> = { sop: 0, tour: 0, article: 0, module: 0 };
  for (const c of chunks) bySource[c.source] += 1;
  return { total: chunks.length, bySource };
}
