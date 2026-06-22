import type { EvidenceItem } from '../domain/evidence';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { enrichEvidenceMetadata } from '../lib/evidenceFieldExtract';
import { addTombstone, filterTombstoned } from './deleteTombstoneStore';

const KEY = 'finely.evidence.v1';

type Store = { items: EvidenceItem[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listEvidenceByPartner(partnerId: string): EvidenceItem[] {
  return loadStore().items.filter((i) => i.partnerId === partnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertEvidence(item: EvidenceItem): EvidenceItem {
  const enriched = enrichEvidenceMetadata(item);
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === enriched.id);
  if (idx >= 0) store.items[idx] = enriched;
  else store.items.push(enriched);
  saveStore(store);

  // Best-effort: sync to Supabase for cross-device persistence.
  // Surface failures (RLS, etc.) instead of swallowing them so blocked writes
  // are visible rather than silently lost.
  if (isSupabaseConfigured) {
    queueMicrotask(async () => {
      const { error } = await supabase.from('evidence').upsert(
        {
          id: enriched.id,
          partner_id: enriched.partnerId,
          report_id: enriched.reportId ?? null,
          type: enriched.type,
          source: enriched.source ?? null,
          section_key: (enriched as any).sectionKey ?? null,
          creditor_name: (enriched as any).creditorName ?? null,
          caption: (enriched as any).caption ?? null,
          filename: enriched.filename ?? null,
          mime_type: enriched.mimeType ?? null,
          size_bytes: enriched.sizeBytes ?? null,
          blob_ref: enriched.blobRef ?? null,
          created_at: enriched.createdAt,
        },
        { onConflict: 'id' },
      );
      if (error) {
        console.warn(
          `Failed to sync evidence "${enriched.filename ?? enriched.id}" to Supabase (kept locally): ${error.message}. ` +
            `This usually means RLS blocked the write — check that the partner is claimed (claimed_user_id) or the user is an admin.`,
        );
      }
    });
  }

  return enriched;
}

export function deleteEvidence(id: string) {
  addTombstone(id, 'evidence');
  const store = loadStore();
  store.items = store.items.filter((i) => i.id !== id);
  saveStore(store);

  if (isSupabaseConfigured) {
    queueMicrotask(() => {
      void supabase.from('evidence').delete().eq('id', id);
    });
  }
}

export function replaceEvidenceSnapshotForPartner(args: { partnerId: string; items: EvidenceItem[] }) {
  const store = loadStore();
  const incoming = filterTombstoned(args.items ?? [], 'evidence');
  store.items = [...store.items.filter((i) => i.partnerId !== args.partnerId), ...incoming];
  saveStore(store);
}

/**
 * Non-destructive sync from the server: keep any local evidence for this partner
 * that the server doesn't have yet (e.g. an item whose server upsert was blocked
 * or failed). Prevents a failed background sync from erasing evidence the user
 * just captured. See mergeLettersSnapshotForPartner for the same rationale.
 */
export function mergeEvidenceSnapshotForPartner(args: { partnerId: string; items: EvidenceItem[] }) {
  const store = loadStore();
  const serverItems = filterTombstoned(args.items ?? [], 'evidence');
  const serverIds = new Set(serverItems.map((i) => i.id));
  const localOnly = store.items.filter((i) => i.partnerId === args.partnerId && !serverIds.has(i.id));
  store.items = [
    ...store.items.filter((i) => i.partnerId !== args.partnerId),
    ...serverItems,
    ...localOnly,
  ];
  saveStore(store);
}

