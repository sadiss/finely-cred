-- Phase H1 — pgvector-backed knowledge_chunks table (evaluation/scaffold pass).
--
-- This is an ADDITIVE, opt-in retrieval path alongside the existing in-browser
-- synchronous keyword index in src/lib/finelyKnowledgeIndex.ts. Nothing reads
-- from this table today — it is populated by scripts/export-knowledge-chunks.mjs
-- and queried only by the (not-yet-wired-into-any-live-caller)
-- searchFinelyKnowledgeVector() function via the knowledge-search edge function,
-- itself gated behind the `knowledgeVectorSearch` feature flag (default OFF).
--
-- Row-level security note (Round 3 H1 acceptance criteria): this table is NOT
-- given a public/authenticated direct-SELECT policy. The public/internal split
-- that `isPublicSafeKnowledgeChunk()` enforces client-side is non-trivial to
-- reproduce as a single RLS predicate (it branches on source + several tag
-- sets), so instead of re-deriving that logic in SQL (and risking drift), the
-- ETL script computes `public_safe` directly by calling the real
-- `isPublicSafeKnowledgeChunk()` TS function per chunk before upsert — the
-- single source of truth stays in TypeScript. The `match_knowledge_chunks` RPC
-- below is the only sanctioned non-admin read path, and it always filters on
-- `public_safe` unless the caller explicitly requests `internal` mode (which
-- the knowledge-search edge function only honors for authenticated, non-anon
-- callers — see supabase/functions/knowledge-search/index.ts).

create extension if not exists vector;

create table if not exists public.knowledge_chunks (
  id text primary key,
  source_tag text not null,
  title text not null default '',
  tags text[] not null default '{}',
  route text,
  content text not null default '',
  -- true when isPublicSafeKnowledgeChunk() (finelyKnowledgeIndex.ts) allowed this
  -- chunk through for public/partner-facing retrieval at ETL time.
  public_safe boolean not null default false,
  -- text-embedding-3-small (OpenAI) — 1536 dimensions. If the embedding model
  -- changes, this column and every stored row must be rebuilt (see ETL script
  -- header comment for the "any embedding-model change requires a full
  -- re-embed" note).
  embedding vector(1536),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_source_tag_idx
  on public.knowledge_chunks (source_tag);
create index if not exists knowledge_chunks_tags_gin_idx
  on public.knowledge_chunks using gin (tags);
create index if not exists knowledge_chunks_public_safe_idx
  on public.knowledge_chunks (public_safe);

-- Approximate nearest-neighbor index for cosine similarity search. `lists` is
-- tuned small (this corpus is expected to be low-thousands of chunks, not
-- millions) — re-tune (and re-ANALYZE) if the corpus grows an order of
-- magnitude. Requires at least one row to build cleanly on some PG versions;
-- safe to run before any data is loaded (falls back to a not-yet-optimized
-- index that self-corrects after the first bulk ETL run + ANALYZE).
create index if not exists knowledge_chunks_embedding_ivfflat_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.knowledge_chunks enable row level security;

-- Admins may read directly (debugging/ops only). No anon/authenticated
-- direct-SELECT policy is granted — see header comment above.
drop policy if exists knowledge_chunks_admin_select on public.knowledge_chunks;
create policy knowledge_chunks_admin_select on public.knowledge_chunks
for select to authenticated
using (public.is_admin());

-- Writes (ETL upserts) happen via the service-role key from
-- scripts/export-knowledge-chunks.mjs, which bypasses RLS — no
-- authenticated/anon write policy is granted here on purpose.
drop policy if exists knowledge_chunks_admin_write on public.knowledge_chunks;
create policy knowledge_chunks_admin_write on public.knowledge_chunks
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Cosine-similarity top-K RPC used by supabase/functions/knowledge-search.
-- SECURITY DEFINER + explicit EXECUTE grants below let it serve anon/public
-- callers (Ask Finely strip/chat/voice) without granting them table SELECT —
-- this function is the only non-admin read path into knowledge_chunks.
create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  only_public_safe boolean default true
)
returns table (
  id text,
  source_tag text,
  title text,
  tags text[],
  route text,
  content text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.id,
    k.source_tag,
    k.title,
    k.tags,
    k.route,
    k.content,
    1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks k
  where k.embedding is not null
    and (only_public_safe = false or k.public_safe = true)
  order by k.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;

revoke all on function public.match_knowledge_chunks(vector, int, boolean) from public;
grant execute on function public.match_knowledge_chunks(vector, int, boolean) to anon, authenticated;
