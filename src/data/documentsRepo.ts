import type { ProcessedDocument } from '../domain/documents';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.documents.v1';

type Store = { docs: ProcessedDocument[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { docs: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listProcessedDocumentsByPartner(partnerId: string): ProcessedDocument[] {
  return loadStore().docs.filter((d) => d.partnerId === partnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertProcessedDocument(doc: ProcessedDocument): ProcessedDocument {
  const store = loadStore();
  const idx = store.docs.findIndex((x) => x.id === doc.id);
  const next = { ...doc, updatedAt: nowIso() };
  if (idx >= 0) store.docs[idx] = next;
  else store.docs.push(next);
  saveStore(store);
  return next;
}

export function createProcessedDocument(args: Omit<ProcessedDocument, 'id' | 'createdAt' | 'updatedAt'>): ProcessedDocument {
  const now = nowIso();
  return upsertProcessedDocument({
    id: newId('doc'),
    createdAt: now,
    updatedAt: now,
    ...args,
  });
}

