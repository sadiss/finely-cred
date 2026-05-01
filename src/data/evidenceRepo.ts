import type { EvidenceItem } from '../domain/evidence';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

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
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === item.id);
  if (idx >= 0) store.items[idx] = item;
  else store.items.push(item);
  saveStore(store);

  // Best-effort: sync to Supabase for cross-device persistence.
  if (isSupabaseConfigured) {
    queueMicrotask(() => {
      void supabase.from('evidence').upsert(
        {
          id: item.id,
          partner_id: item.partnerId,
          report_id: item.reportId ?? null,
          type: item.type,
          source: item.source ?? null,
          section_key: (item as any).sectionKey ?? null,
          creditor_name: (item as any).creditorName ?? null,
          caption: (item as any).caption ?? null,
          filename: item.filename ?? null,
          mime_type: item.mimeType ?? null,
          size_bytes: item.sizeBytes ?? null,
          blob_ref: item.blobRef ?? null,
          created_at: item.createdAt,
        },
        { onConflict: 'id' },
      );
    });
  }

  return item;
}

export function deleteEvidence(id: string) {
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
  store.items = [...store.items.filter((i) => i.partnerId !== args.partnerId), ...(args.items ?? [])];
  saveStore(store);
}

