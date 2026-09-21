/**
 * Single retrieval router for chat agents (portal, academy coach, lounge helper).
 */

import { detectKbLang } from './knowledgeBase/kbLang';
import { excerptFinelyKnowledge, listFinelyKnowledgeDocs, searchFinelyKnowledgeVector } from './finelyKnowledgeIndex';
import type { KbDoc } from './knowledgeBase/kbContent';

const SCORE_INTEL_TOPICS = new Set(['fico-score-models-literacy', 'credit-score-intelligence-overview']);
const SCORE_QUERY_HINTS =
  /\b(fico|vantage|beacon|tri-?merge|mortgage score|ultrafico|bankcard|middle score|10t|score model)\b/i;

function pinScoreIntelDocs(query: string, lang: 'en' | 'ht', ranked: KbDoc[], limit: number): KbDoc[] {
  if (!SCORE_QUERY_HINTS.test(query)) return ranked.slice(0, limit);
  const pinned = listFinelyKnowledgeDocs().filter(
    (d) => SCORE_INTEL_TOPICS.has(d.topic) && (d.lang === lang || lang === 'en'),
  );
  const seen = new Set<string>();
  const merged: KbDoc[] = [];
  for (const d of [...pinned, ...ranked]) {
    if (seen.has(d.path)) continue;
    seen.add(d.path);
    merged.push(d);
    if (merged.length >= limit) break;
  }
  return merged;
}

function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export { detectKbLang };

export async function retrieveKnowledge(query: string, lang: 'en' | 'ht', limit = 6): Promise<string> {
  const vectorHits = await searchFinelyKnowledgeVector(query, lang);
  if (vectorHits.length) {
    return excerptFinelyKnowledge(vectorHits.slice(0, limit));
  }

  const docs = listFinelyKnowledgeDocs().filter((d) => d.lang === lang || lang === 'en');
  const tokens = tokenize(query);
  if (!tokens.length) return '';

  const scored = docs
    .map((d) => {
      const hay = d.body.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (hay.includes(t)) score += 1;
      }
      if (d.lang === lang) score += 2;
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!scored.length) return '';
  const picked = pinScoreIntelDocs(query, lang, scored.map((x) => x.d), limit);
  return excerptFinelyKnowledge(picked);
}

/** Sync wrapper for UI paths that cannot await (uses local index only). */
export function retrieveKnowledgeSync(query: string, lang: 'en' | 'ht', limit = 6): string {
  const docs = listFinelyKnowledgeDocs().filter((d) => d.lang === lang || lang === 'en');
  const tokens = tokenize(query);
  if (!tokens.length) return '';
  const scored = docs
    .map((d) => {
      const hay = d.body.toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += 1;
      if (d.lang === lang) score += 2;
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (!scored.length) return '';
  const picked = pinScoreIntelDocs(query, lang, scored.map((x) => x.d), limit);
  return excerptFinelyKnowledge(picked);
}
