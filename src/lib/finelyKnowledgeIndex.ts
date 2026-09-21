/**
 * Finely knowledge index — canonical corpus for retrieval (academy + KB docs).
 * Vector path: searchFinelyKnowledgeVector (off until ETL + flag).
 */

import { listKnowledgeBaseDocs, type KbDoc } from './knowledgeBase/kbContent';

const VECTOR_ENABLED = (import.meta.env.VITE_FINELY_KB_VECTOR as string | undefined) === '1';

export function isFinelyKnowledgeVectorEnabled() {
  return VECTOR_ENABLED;
}

/** ETL hook: ingest markdown into pgvector (no-op until edge worker ships). */
export async function searchFinelyKnowledgeVector(_query: string, _lang: 'en' | 'ht'): Promise<KbDoc[]> {
  if (!VECTOR_ENABLED) return [];
  return [];
}

export function listFinelyKnowledgeDocs(): KbDoc[] {
  return listKnowledgeBaseDocs();
}

export function excerptFinelyKnowledge(docs: KbDoc[], limitChars = 2200): string {
  return docs.map((d, i) => `### ${d.topic} (${d.lang})\n${d.body.slice(0, limitChars)}`).join('\n\n');
}
