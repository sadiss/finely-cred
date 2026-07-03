import type { DebtCase } from '../domain/debt';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.debt.v1';
type Store = { cases: DebtCase[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { cases: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listDebtByPartner(partnerId: string): DebtCase[] {
  return loadStore().cases
    .filter((c) => c.partnerId === partnerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAllDebtCases(): DebtCase[] {
  return loadStore().cases.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDebt(id: string): DebtCase | null {
  return loadStore().cases.find((c) => c.id === id) ?? null;
}

export function upsertDebt(c: DebtCase): DebtCase {
  const store = loadStore();
  const idx = store.cases.findIndex((x) => x.id === c.id);
  const next = { ...c, updatedAt: nowIso() };
  if (idx >= 0) store.cases[idx] = next;
  else store.cases.push(next);
  saveStore(store);
  return next;
}

export function createDebtCase(args: {
  partnerId: string;
  type: 'debt' | 'summons';
  name: string;
  amountCents: number;
  status?: DebtCase['status'];
  dueDate?: string;
  courtCaseNumber?: string;
  notes?: string;
  firstContactDate?: string;
  lastPaymentDate?: string;
  dateServed?: string;
  stateJurisdiction?: string;
  collectorName?: string;
  originalCreditor?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  accountNumberMasked?: string;
  reportId?: string;
  tradelineIndex?: number;
  linkedEvidenceIds?: string[];
  processedDocumentIds?: string[];
  source?: DebtCase['source'];
  senderSnapshot?: DebtCase['senderSnapshot'];
}): DebtCase {
  const now = nowIso();
  const debt: DebtCase = {
    id: newId('debt'),
    partnerId: args.partnerId,
    type: args.type,
    name: args.name,
    amountCents: args.amountCents,
    status: args.status ?? 'open',
    dueDate: args.dueDate,
    courtCaseNumber: args.courtCaseNumber,
    notes: args.notes,
    firstContactDate: args.firstContactDate,
    lastPaymentDate: args.lastPaymentDate,
    dateServed: args.dateServed,
    stateJurisdiction: args.stateJurisdiction,
    collectorName: args.collectorName,
    originalCreditor: args.originalCreditor,
    recipientName: args.recipientName,
    recipientAddress: args.recipientAddress,
    recipientPhone: args.recipientPhone,
    accountNumberMasked: args.accountNumberMasked,
    reportId: args.reportId,
    tradelineIndex: args.tradelineIndex,
    linkedEvidenceIds: args.linkedEvidenceIds,
    processedDocumentIds: args.processedDocumentIds,
    source: args.source ?? 'manual',
    senderSnapshot: args.senderSnapshot,
    createdAt: now,
    updatedAt: now,
  };
  const store = loadStore();
  store.cases.push(debt);
  saveStore(store);
  return debt;
}
