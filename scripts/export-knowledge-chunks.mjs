#!/usr/bin/env node
/**
 * Phase H1 — one-time/repeatable ETL: TypeScript knowledge chunks → Supabase
 * `knowledge_chunks` (pgvector) table.
 *
 * ============================================================================
 * ONGOING MAINTENANCE COST — READ BEFORE SKIPPING THIS SCRIPT (Round 3 H1 spec)
 * ============================================================================
 * This is NOT a one-time migration. `src/lib/finelyKnowledgeIndex.ts`'s
 * `build*Chunks()` functions (SOPs, tours, module playbooks, eGuides,
 * articles, and every `build*Chunks()` inside `buildFinelyReferenceChunks()`
 * — letters, debt doctrine, funding, affiliate, CRM, billing, pricing, case
 * studies, authority citations, intl/non-citizen credit, debt litigation,
 * business credit doctrine, persona psychology, content-media technique
 * library) are TypeScript source constants compiled into the client bundle.
 * Every time a human edits ANY of those source modules — adds a new SOP, a
 * new case study, a new technique entry, a new doctrine playbook, etc. — the
 * `knowledge_chunks` table silently drifts out of sync with the live
 * synchronous keyword index until this script (or an incremental successor)
 * is re-run and the embeddings are regenerated for the changed/added rows.
 *
 * There is no CI hook or build-time trigger wired up for this yet. Until one
 * exists, re-running this script after every content-repo edit is a REAL,
 * NAMED, RECURRING PROCESS COST — not a "run once and forget" migration step.
 * Whoever eventually flips the `knowledgeVectorSearch` feature flag on for a
 * live caller should also either (a) put this script on a scheduled job, or
 * (b) build a lighter incremental variant keyed off a content-hash diff, or
 * the vector-search results will quietly become stale relative to the
 * (still-live, still-authoritative) synchronous `scoreChunk()` path.
 * ============================================================================
 *
 * What this script does:
 *   1. Imports `buildFinelyKnowledgeChunks()` and `isPublicSafeKnowledgeChunk()`
 *      directly from `src/lib/finelyKnowledgeIndex.ts` (the same functions the
 *      live synchronous path uses — no re-implementation, no drift risk).
 *   2. For each chunk, computes `public_safe` by calling the REAL
 *      `isPublicSafeKnowledgeChunk()` (not a SQL re-derivation) so the
 *      public/internal split is byte-identical to what the client already
 *      enforces — see the migration file's header comment for why this
 *      matters for RLS.
 *   3. Generates an embedding per chunk via OpenAI's embeddings endpoint
 *      directly (`text-embedding-3-small`, 1536 dims — matches the
 *      `knowledge_chunks.embedding vector(1536)` column). NOTE: as of this
 *      pass, `supabase/functions/ai-gateway/index.ts` only proxies chat
 *      completions (OpenAI/Gemini/Anthropic `messages` calls) — it has no
 *      embeddings endpoint. Per the H1 spec's explicit fallback instruction
 *      ("OpenAI directly if the gateway doesn't proxy embeddings yet — confirm
 *      during implementation"), this was confirmed during this pass and the
 *      script calls OpenAI's REST API directly with `OPENAI_API_KEY` (the
 *      same secret already used by the ai-gateway edge function and by the
 *      voice/ML pipelines — see `.env.example`). If a future pass adds an
 *      `embed` task type to the ai-gateway function, swap `embedTexts()`
 *      below to call that instead and this is the only function that needs
 *      to change.
 *   4. Upserts rows into `public.knowledge_chunks` on `id` (idempotent — safe
 *      to re-run; never duplicates rows).
 *
 * Requires (server-side secrets — NEVER put these in `.env.local`'s VITE_
 * vars or commit them):
 *   - OPENAI_API_KEY               (embeddings)
 *   - SUPABASE_URL (or VITE_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY    (upsert bypasses RLS — service role only;
 *                                   this table intentionally has no
 *                                   anon/authenticated write policy)
 *
 * Usage:
 *   npx tsx scripts/export-knowledge-chunks.mjs           # dry-run if secrets missing
 *   OPENAI_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/export-knowledge-chunks.mjs --write
 *
 * Must be run with `tsx` (not plain `node`) because it dynamically imports a
 * `.ts` module (`src/lib/finelyKnowledgeIndex.ts`) — same pattern already used
 * by `scripts/extract-legacy-reasons.mjs` elsewhere in this repo. It also
 * registers `scripts/_viteRawTextLoaderHook.mjs` to handle one Vite-only
 * `?raw` text import found transitively in the chunk-builder import graph
 * (`src/legal/litigation/litigationCourtFilings.ts`) — discovered and fixed
 * during this pass; see that file's header comment for details.
 *
 * Does NOT run automatically as part of `npm run build` or any deploy step —
 * this is a manually-invoked ETL, on purpose, per the H1 spec's "evaluate and
 * scaffold, do not deploy" scope. No network calls are made unless `--write`
 * is passed AND all three secrets above are present.
 */

import { register } from 'node:module';

// finelyKnowledgeIndex.ts's import graph transitively includes a Vite-only
// `?raw` text import (src/legal/litigation/litigationCourtFilings.ts) that
// plain Node/tsx can't resolve on its own — see
// scripts/_viteRawTextLoaderHook.mjs's header comment for the full story.
// This registers a tiny composable loader that only special-cases that one
// specifier shape; everything else still goes through tsx's own loader.
register('./_viteRawTextLoaderHook.mjs', import.meta.url);

const WRITE = process.argv.includes('--write');
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBED_BATCH_SIZE = 96;
const UPSERT_BATCH_SIZE = 200;

/**
 * Hard guard (Round 3 H1 file-ownership note): this ETL must never silently
 * upsert a chunk whose TS-side tags were dropped/mangled on the way to the
 * DB row, because that would silently undo Phase A7/K2's `internal_only`
 * tagging fix on `buildContentMediaEngineChunks()`'s four chunk types.
 * Refuses (throws, aborts the whole run) rather than upserting a bad row.
 */
function assertTagsPreserved(chunk, row) {
  if (!Array.isArray(chunk.tags) || chunk.tags.length === 0) {
    throw new Error(
      `Refusing to upsert "${chunk.id}" — source chunk has no tags array. ` +
        'An empty/missing tags array would silently drop TS-side classification ' +
        '(e.g. internal_only) once it lands in knowledge_chunks.',
    );
  }
  const same =
    Array.isArray(row.tags) &&
    row.tags.length === chunk.tags.length &&
    row.tags.every((t, i) => t === chunk.tags[i]);
  if (!same) {
    throw new Error(
      `Refusing to upsert "${chunk.id}" — row.tags diverged from the source chunk's ` +
        'tags array. This ETL must pass tags through verbatim, never re-derive them.',
    );
  }
  // Extra named guard for the exact Phase A7/K2 dependency this file's
  // header calls out: content-media-engine chunks must still carry
  // `internal_only` by the time they reach this table.
  if (chunk.id.startsWith('reference:media_technique:') && !chunk.tags.includes('internal_only')) {
    throw new Error(
      `Refusing to upsert "${chunk.id}" — media-technique chunk is missing the ` +
        '"internal_only" tag. Phase A7/K2 tags these on the TS side; H1 is sequenced ' +
        'to run AFTER that fix lands. Re-check buildContentMediaEngineChunks() in ' +
        'src/lib/finelyKnowledgeIndex.ts before re-running this ETL.',
    );
  }
}

async function embedTexts(texts) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required to generate embeddings.');
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts, dimensions: EMBEDDING_DIMENSIONS }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings error: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const vectors = (json.data ?? []).sort((a, b) => a.index - b.index).map((d) => d.embedding);
  if (vectors.length !== texts.length) {
    throw new Error(`Embedding count mismatch: sent ${texts.length}, got ${vectors.length}.`);
  }
  return vectors;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function embeddingText(chunk) {
  // Keep prompt-time formatting cheap: title + body is what scoreChunk()
  // already weights most heavily client-side, so mirror that priority here.
  return `${chunk.title}\n\n${chunk.text}`.slice(0, 8000);
}

async function main() {
  console.log(`[export-knowledge-chunks] mode: ${WRITE ? 'WRITE' : 'DRY-RUN (pass --write to persist)'}`);

  const { buildFinelyKnowledgeChunks, isPublicSafeKnowledgeChunk } = await import('../src/lib/finelyKnowledgeIndex.ts');

  const chunks = buildFinelyKnowledgeChunks();
  console.log(`[export-knowledge-chunks] built ${chunks.length} chunks from finelyKnowledgeIndex.ts`);

  const rows = chunks.map((chunk) => {
    const row = {
      id: chunk.id,
      source_tag: chunk.source,
      title: chunk.title,
      tags: [...chunk.tags],
      route: chunk.route ?? null,
      content: chunk.text,
      public_safe: isPublicSafeKnowledgeChunk(chunk),
      updated_at: new Date().toISOString(),
    };
    assertTagsPreserved(chunk, row);
    return row;
  });

  const internalOnlyCount = rows.filter((r) => r.tags.includes('internal_only')).length;
  const publicSafeCount = rows.filter((r) => r.public_safe).length;
  console.log(
    `[export-knowledge-chunks] ${internalOnlyCount} chunk(s) tagged internal_only; ` +
      `${publicSafeCount}/${rows.length} chunk(s) computed public_safe=true.`,
  );

  if (!WRITE) {
    console.log('[export-knowledge-chunks] Dry-run complete — no embeddings generated, nothing written.');
    console.log('[export-knowledge-chunks] Re-run with --write (+ OPENAI_API_KEY + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) to persist.');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to write (service role bypasses RLS by design — see migration).');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  let embedded = 0;
  const batches = chunkArray(rows, EMBED_BATCH_SIZE);
  for (const batch of batches) {
    const vectors = await embedTexts(batch.map(embeddingText));
    batch.forEach((row, i) => {
      row.embedding = vectors[i];
    });
    embedded += batch.length;
    console.log(`[export-knowledge-chunks] embedded ${embedded}/${rows.length}...`);
  }

  let upserted = 0;
  for (const batch of chunkArray(rows, UPSERT_BATCH_SIZE)) {
    const { error } = await supabase.from('knowledge_chunks').upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    upserted += batch.length;
    console.log(`[export-knowledge-chunks] upserted ${upserted}/${rows.length}...`);
  }

  console.log(`[export-knowledge-chunks] Done. ${upserted} chunk(s) upserted into public.knowledge_chunks.`);
  console.log('[export-knowledge-chunks] Reminder: re-run this script after any future build*Chunks() content edit.');
}

main().catch((err) => {
  console.error('[export-knowledge-chunks] FAILED:', err?.message || err);
  process.exitCode = 1;
});
