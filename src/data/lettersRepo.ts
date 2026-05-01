import type { LetterRecord } from '../domain/letters';
import { loadJson, saveJson } from './localJsonStore';
import { createNotification } from './notificationsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEY = 'finely.letters.v1';

type Store = { letters: LetterRecord[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { letters: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listLettersByPartner(partnerId: string): LetterRecord[] {
  return loadStore().letters.filter((l) => l.partnerId === partnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertLetter(letter: LetterRecord): LetterRecord {
  const store = loadStore();
  const idx = store.letters.findIndex((x) => x.id === letter.id);
  if (idx >= 0) {
    store.letters[idx] = letter;
  } else {
    store.letters.push(letter);
    createNotification({
      partnerId: letter.partnerId,
      audience: 'both',
      kind: 'letter_generated',
      title: `Letter generated: ${letter.title}`,
      body:
        letter.type === 'dispute' && letter.meta && 'bureau' in letter.meta
          ? `${letter.type} • ${letter.meta.bureau} • round ${letter.meta.round}`
          : `${letter.type} letter saved to vault`,
      href: '/portal/letters/vault',
      meta: { letterId: letter.id, type: letter.type, status: letter.status ?? 'generated' },
    });
  }
  saveStore(store);

  // Best-effort: sync to Supabase for cross-device persistence.
  if (isSupabaseConfigured) {
    queueMicrotask(() => {
      void supabase.from('letters').upsert(
        {
          id: letter.id,
          partner_id: letter.partnerId,
          type: letter.type,
          title: letter.title,
          body: letter.body,
          status: (letter as any).status ?? null,
          meta: (letter as any).meta ?? null,
          pdf_blob_ref: (letter as any).pdfBlobRef ?? null,
          pdf_filename: (letter as any).pdfFilename ?? null,
          related_evidence_ids: (letter as any).relatedEvidenceIds ?? null,
          mailing: (letter as any).mailing ?? null,
          archived_at: (letter as any).archivedAt ?? null,
          created_at: letter.createdAt,
        },
        { onConflict: 'id' },
      );
    });
  }

  return letter;
}

export function setLetterArchived(args: { letterId: string; archived: boolean }): LetterRecord | null {
  const store = loadStore();
  const idx = store.letters.findIndex((x) => x.id === args.letterId);
  if (idx < 0) return null;
  const cur = store.letters[idx];
  const next: LetterRecord = { ...cur, archivedAt: args.archived ? new Date().toISOString() : null };
  store.letters[idx] = next;
  saveStore(store);

  if (isSupabaseConfigured) {
    queueMicrotask(() => {
      void supabase
        .from('letters')
        .update({ archived_at: args.archived ? new Date().toISOString() : null })
        .eq('id', args.letterId);
    });
  }
  return next;
}

export function deleteLetter(args: { letterId: string }): boolean {
  const store = loadStore();
  const before = store.letters.length;
  store.letters = store.letters.filter((l) => l.id !== args.letterId);
  if (store.letters.length === before) return false;
  saveStore(store);

  if (isSupabaseConfigured) {
    queueMicrotask(() => {
      void supabase.from('letters').delete().eq('id', args.letterId);
    });
  }
  return true;
}

export function replaceLettersSnapshotForPartner(args: { partnerId: string; letters: LetterRecord[] }) {
  const store = loadStore();
  store.letters = [...store.letters.filter((l) => l.partnerId !== args.partnerId), ...(args.letters ?? [])];
  saveStore(store);
}