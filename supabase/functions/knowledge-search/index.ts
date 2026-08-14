// Supabase Edge Function: knowledge-search
// Phase H1 — pgvector similarity-search read path for `knowledge_chunks`
// (scaffold/evaluation deliverable; not wired into any live caller yet — see
// `searchFinelyKnowledgeVector()` in src/lib/finelyKnowledgeIndex.ts, which is
// the only current caller and is itself feature-flagged off by default).
//
// Flow: caller sends a raw query string (never a pre-computed embedding —
// that would require shipping an OpenAI key to the browser bundle, which we
// never do). This function embeds the query server-side with the same
// `text-embedding-3-small` model scripts/export-knowledge-chunks.mjs used to
// embed the corpus, then calls the `match_knowledge_chunks` pgvector RPC
// (see supabase/migrations/20260814030000_knowledge_chunks_pgvector.sql).
//
// Public vs internal split: `mode: 'public'` (default) only returns rows
// where `public_safe = true` — computed once, at ETL time, by the REAL
// `isPublicSafeKnowledgeChunk()` TS function (not re-derived in SQL/here), so
// this mirrors that function's guarantee exactly instead of drifting from it.
// `mode: 'internal'` additionally requires a real (non-anon) authenticated
// caller — anonymous/public-key callers can never see internal_only content
// through this function, regardless of what `mode` they request.
//
// Secrets (set in Supabase):
// - SUPABASE_URL / SUPABASE_ANON_KEY (standard edge-function env)
// - OPENAI_API_KEY (query embeddings — same key the ETL script + ai-gateway use)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, rateLimit, resolveAuthContext, requireAuth } from '../_shared/edgeGuard.ts';

type ReqBody = {
  query: string;
  mode?: 'public' | 'internal';
  limit?: number;
};

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

async function embedQuery(query: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY') || '';
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: query, dimensions: EMBEDDING_DIMENSIONS }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const vector = data?.data?.[0]?.embedding;
  if (!Array.isArray(vector)) throw new Error('OpenAI embeddings response missing vector');
  return vector;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = (body.query || '').trim();
  if (!query) return json({ ok: false, error: 'query is required' }, { status: 400 });

  const requestedMode: 'public' | 'internal' = body.mode === 'internal' ? 'internal' : 'public';
  const limit = Math.max(1, Math.min(24, Number(body.limit) || 6));

  // Internal-mode reads require a real signed-in caller (never anon) — mirrors
  // how every other internal-ops edge function in this repo gates access.
  let authCtx;
  try {
    authCtx = requestedMode === 'internal' ? await requireAuth(req) : await resolveAuthContext(req);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limitCheck = await rateLimit({
    key: `knowledge_search:${authCtx.user.id}:${ip}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!limitCheck.ok) {
    return json({ ok: false, error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
  }

  try {
    const embedding = await embedQuery(query);

    // Scoped to the caller's own JWT (or anon key) — never service role. The
    // `match_knowledge_chunks` RPC is SECURITY DEFINER (see migration), so it
    // can read `knowledge_chunks` on the caller's behalf without granting
    // anon/authenticated a direct table SELECT policy.
    const supabase = createClient(authCtx.supabaseUrl, authCtx.supabaseAnonKey, {
      global: { headers: { Authorization: authCtx.authHeader } },
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_count: limit,
      only_public_safe: requestedMode !== 'internal',
    });
    if (error) throw new Error(error.message);

    const chunks = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      sourceTag: row.source_tag,
      title: row.title,
      tags: row.tags,
      route: row.route,
      content: row.content,
      similarity: row.similarity,
    }));

    return json({ ok: true, mode: requestedMode, query, chunks });
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Knowledge search failed' }, { status: 500 });
  }
});
