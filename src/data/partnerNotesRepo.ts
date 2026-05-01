import type { PartnerNote } from '../domain/partnerNotes';
import { nowIso } from '../domain/partnerNotes';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.partnerNotes.v1';

type Store = { notes: PartnerNote[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { notes: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listPartnerNotesByPartner(partnerId: string): PartnerNote[] {
  return loadStore()
    .notes
    .filter((n) => n.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertPartnerNote(note: PartnerNote): PartnerNote {
  const store = loadStore();
  const idx = store.notes.findIndex((x) => x.id === note.id);
  const next = { ...note, updatedAt: nowIso() };
  if (idx >= 0) store.notes[idx] = next;
  else store.notes.push(next);
  saveStore(store);
  return next;
}

export function createPartnerNote(args: Omit<PartnerNote, 'id' | 'createdAt' | 'updatedAt'>): PartnerNote {
  const now = nowIso();
  return upsertPartnerNote({
    id: newId('note'),
    createdAt: now,
    updatedAt: now,
    ...args,
  });
}

export function deletePartnerNote(id: string) {
  const store = loadStore();
  store.notes = store.notes.filter((n) => n.id !== id);
  saveStore(store);
}

