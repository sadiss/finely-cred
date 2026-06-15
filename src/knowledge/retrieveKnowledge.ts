import { FINELY_KNOWLEDGE_BASE, type KnowledgeArticle, type KnowledgeCategory } from './finelyKnowledgeBase';
import { getKnowledgeCorpus } from '../lib/kbFeatureMapSync';

export type RetrievedKnowledgeChunk = {
  article: KnowledgeArticle;
  score: number;
  excerpt: string;
};

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'can', 'i', 'you', 'we', 'they', 'it', 'this', 'that', 'my', 'me', 'what', 'how', 'when', 'where', 'why',
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function scoreArticle(article: KnowledgeArticle, queryTokens: string[], categoryBoost?: KnowledgeCategory): number {
  if (!queryTokens.length) return 0;
  const hay = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
  const hayTokens = new Set(tokenize(hay));
  let score = 0;
  for (const qt of queryTokens) {
    if (hay.includes(qt)) score += 2;
    if (article.tags.some((t) => t.toLowerCase().includes(qt))) score += 3;
    if (hayTokens.has(qt)) score += 1;
  }
  if (categoryBoost && article.category === categoryBoost) score += 4;
  return score;
}

function excerpt(content: string, maxLen = 320): string {
  const t = content.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

/** Retrieve top knowledge articles for a user query (keyword scoring — no vector DB required). */
export function retrieveKnowledge(args: {
  query: string;
  limit?: number;
  categoryBoost?: KnowledgeCategory;
  minScore?: number;
}): RetrievedKnowledgeChunk[] {
  const limit = Math.max(1, Math.min(8, args.limit ?? 5));
  const minScore = args.minScore ?? 2;
  const queryTokens = tokenize(args.query);
  if (!queryTokens.length) {
    return getKnowledgeCorpus().slice(0, limit).map((article) => ({
      article,
      score: 1,
      excerpt: excerpt(article.content),
    }));
  }

  const ranked = getKnowledgeCorpus().map((article) => ({
    article,
    score: scoreArticle(article, queryTokens, args.categoryBoost),
    excerpt: excerpt(article.content),
  }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (ranked.length) return ranked;

  return getKnowledgeCorpus().slice(0, Math.min(3, limit)).map((article) => ({
    article,
    score: 1,
    excerpt: excerpt(article.content),
  }));
}

/** Format retrieved chunks for injection into AI system prompts. */
export function formatKnowledgeForPrompt(chunks: RetrievedKnowledgeChunk[]): string {
  if (!chunks.length) return '';
  const lines = chunks.map(
    (c, i) =>
      `[${i + 1}] ${c.article.title} (${c.article.category})\n${c.excerpt}${
        c.article.links?.length ? `\nLinks: ${c.article.links.map((l) => `${l.label} → ${l.path}`).join('; ')}` : ''
      }`,
  );
  return `FINELY CRED KNOWLEDGE BASE (authoritative — prefer over general knowledge):\n\n${lines.join('\n\n')}`;
}

/** Suggested follow-up chips derived from retrieved articles. */
export function suggestFollowUps(chunks: RetrievedKnowledgeChunk[]): string[] {
  const out: string[] = [];
  for (const c of chunks) {
    if (c.article.links?.[0]) out.push(`Open ${c.article.links[0].label}`);
    out.push(`Tell me more about ${c.article.title.toLowerCase()}`);
  }
  return [...new Set(out)].slice(0, 4);
}
