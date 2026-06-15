/** Sync dynamic KB articles from platform feature map (Phases 34 + 46). */
import { PLATFORM_FEATURE_MAP } from '../data/platformFeatureMap';
import type { KnowledgeArticle } from '../knowledge/finelyKnowledgeBase';
import { FINELY_KNOWLEDGE_BASE } from '../knowledge/finelyKnowledgeBase';
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.kb.dynamic.v1';

type Store = { articles: KnowledgeArticle[]; syncedAt: string };

function articlesFromFeatureMap(): KnowledgeArticle[] {
  return PLATFORM_FEATURE_MAP.map((f) => ({
    id: `feature_${f.id}`,
    title: f.title,
    category: f.kbCategory,
    tags: [...f.tags, `phase${f.phase}`],
    content: `${f.summary} (Phase ${f.phase} — live on platform.)`,
    links: f.route ? [{ label: f.title, path: f.route }] : undefined,
  }));
}

export function syncKbFromPlatformFeatureMap(): KnowledgeArticle[] {
  const articles = articlesFromFeatureMap();
  saveJson<Store>(KEY, { articles, syncedAt: new Date().toISOString() }, 1);
  return articles;
}

export function getDynamicKnowledgeArticles(): KnowledgeArticle[] {
  const store = loadJson<Store>(KEY, { articles: [], syncedAt: '' }, 1);
  if (!store.articles.length) return syncKbFromPlatformFeatureMap();
  return store.articles;
}

/** Static corpus + feature-map articles for retrieval. */
export function getKnowledgeCorpus(): KnowledgeArticle[] {
  const dynamic = getDynamicKnowledgeArticles();
  const staticIds = new Set(FINELY_KNOWLEDGE_BASE.map((a) => a.id));
  const extra = dynamic.filter((a) => !staticIds.has(a.id));
  return [...FINELY_KNOWLEDGE_BASE, ...extra];
}

let synced = false;

export function wireKbFeatureMapSync() {
  if (synced || typeof window === 'undefined') return;
  synced = true;
  syncKbFromPlatformFeatureMap();
}

if (typeof window !== 'undefined') {
  wireKbFeatureMapSync();
}
