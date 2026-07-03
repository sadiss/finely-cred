import type { BankruptcyCase, BankruptcyChapter, BankruptcyCaseStatus } from '../domain/bankruptcyCase';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.bankruptcy_cases.v1';

type Store = { cases: BankruptcyCase[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { cases: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listBankruptcyByPartner(partnerId: string): BankruptcyCase[] {
  return loadStore()
    .cases.filter((c) => c.partnerId === partnerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getBankruptcyCase(id: string): BankruptcyCase | null {
  return loadStore().cases.find((c) => c.id === id) ?? null;
}

export function upsertBankruptcyCase(c: BankruptcyCase): BankruptcyCase {
  const store = loadStore();
  const idx = store.cases.findIndex((x) => x.id === c.id);
  const next = { ...c, updatedAt: new Date().toISOString() };
  if (idx >= 0) store.cases[idx] = next;
  else store.cases.push(next);
  saveStore(store);
  return next;
}

export function createBankruptcyCase(args: {
  partnerId: string;
  chapter?: BankruptcyChapter;
  status?: BankruptcyCaseStatus;
  district?: string;
  businessName?: string;
  notes?: string;
}): BankruptcyCase {
  const now = new Date().toISOString();
  return upsertBankruptcyCase({
    id: newId('bk'),
    partnerId: args.partnerId,
    chapter: args.chapter ?? 'unknown',
    status: args.status ?? 'considering',
    district: args.district,
    businessName: args.businessName,
    notes: args.notes,
    createdAt: now,
    updatedAt: now,
  });
}
