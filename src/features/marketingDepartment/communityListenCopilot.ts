/**
 * Community listen + reply-draft copilot — read-only Serper search, human posts ($0).
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { getGrowthWeekFocus } from '../growthAgents/growthWeekFocus';
import { createMarketingTask } from '../marketingDesk/marketingDeskTasks';
import { isFeatureEnabled } from '../../data/settingsRepo';

const DRAFTS_KEY = 'finely.community_listen_drafts.v1';

export type CommunityListenDraft = {
  id: string;
  query: string;
  sourceTitle: string;
  sourceUrl: string;
  snippet: string;
  suggestedReply: string;
  leadMagnetPath: string;
  createdAt: string;
  status: 'draft' | 'posted';
};

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listCommunityListenDrafts(limit = 20): CommunityListenDraft[] {
  const rows = loadJson<{ rows?: CommunityListenDraft[] }>(DRAFTS_KEY, {}, 1).rows ?? [];
  return rows.filter((r) => r.status === 'draft').slice(0, limit);
}

function saveDraft(row: CommunityListenDraft) {
  const prev = loadJson<{ rows?: CommunityListenDraft[] }>(DRAFTS_KEY, {}, 1).rows ?? [];
  saveJson(DRAFTS_KEY, { rows: [row, ...prev.filter((r) => r.id !== row.id)].slice(0, 40) }, 1);
  dispatchStore();
}

function buildReplyDraft(title: string, snippet: string, city: string): string {
  const hook = snippet.slice(0, 120).replace(/\s+/g, ' ').trim();
  return [
    `I saw your question about "${title.slice(0, 60)}".`,
    hook ? `You mentioned: "${hook}…"` : '',
    `We put together a free guide for ${city || 'your area'} partners on disputing errors and reading reports — no pitch, just steps.`,
    `If it helps: [paste your Hannah tracked guide link here]`,
    'Happy to answer one follow-up in the thread.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

const COMMUNITY_QUERIES = [
  'site:reddit.com credit repair help',
  'site:reddit.com dispute credit report',
  'credit score help forum',
  'debt validation question',
];

/** Scan public forums via lead-intel / Serper — drafts only, you post manually. */
export async function runCommunityListenScan(opts?: {
  city?: string;
  leadMagnetPath?: string;
}): Promise<{ ok: boolean; message: string; added: number }> {
  if (!isFeatureEnabled('leadIntel') || !isSupabaseConfigured) {
    return { ok: false, message: 'Connect Supabase + enable leadIntel first (same as Caleb find).', added: 0 };
  }

  const focus = getGrowthWeekFocus();
  const city = opts?.city || focus.city || 'United States';
  const leadMagnetPath = opts?.leadMagnetPath || focus.ctaPath || '/guides/dispute-letters';
  const query = `${COMMUNITY_QUERIES[Math.floor(Date.now() / 86400000) % COMMUNITY_QUERIES.length]} ${city}`;
  let added = 0;

  try {
    const { data, error } = await supabase.functions.invoke('lead-intel', {
      body: {
        target: 'clients',
        queries: [query],
        location: city,
        limit: 8,
        enrich: false,
        searchMode: 'search',
        country: 'us',
      },
    });

    if (error) {
      return { ok: false, message: error.message || 'Search failed — check SERPER_API_KEY on edge.', added: 0 };
    }

    const results = (data?.results ?? []) as Array<{ title?: string; link?: string; snippet?: string }>;
    for (const hit of results.slice(0, 5)) {
      if (!hit.link || !hit.title) continue;
      const id = `cl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      saveDraft({
        id,
        query,
        sourceTitle: hit.title,
        sourceUrl: hit.link,
        snippet: hit.snippet || '',
        suggestedReply: buildReplyDraft(hit.title, hit.snippet || '', city),
        leadMagnetPath,
        createdAt: new Date().toISOString(),
        status: 'draft',
      });
      createMarketingTask({
        kind: 'nurture',
        title: `Community reply — ${hit.title.slice(0, 48)}`,
        notes: `Draft ready. Post manually on: ${hit.link}\n\n${buildReplyDraft(hit.title, hit.snippet || '', city)}`,
        href: hit.link,
        tags: ['community-listen', 'persona:social'],
        growthAgentId: 'social',
        priority: 'normal',
        dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        meta: { communityDraftId: id, sourceUrl: hit.link },
        dedupe: false,
      });
      added++;
    }

    return {
      ok: true,
      message: added > 0 ? `Drafted ${added} helpful reply(ies) — copy and post yourself ($0).` : 'Search ran but no forum threads found — try another city.',
      added,
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Community scan failed', added: 0 };
  }
}

export function markCommunityDraftPosted(id: string) {
  const rows = loadJson<{ rows?: CommunityListenDraft[] }>(DRAFTS_KEY, {}, 1).rows ?? [];
  saveJson(
    DRAFTS_KEY,
    { rows: rows.map((r) => (r.id === id ? { ...r, status: 'posted' as const } : r)) },
    1,
  );
  dispatchStore();
}
