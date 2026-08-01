/** Durable per-partner store for post-hearing outcomes (payment plans, dismissals, judgments). */

import type { PartnerCourtOutcome } from '../domain/courtOutcomes';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.courtOutcomes.v1';
type Store = { outcomes: PartnerCourtOutcome[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { outcomes: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listCourtOutcomesByPartner(partnerId: string): PartnerCourtOutcome[] {
  return loadStore()
    .outcomes.filter((o) => o.partnerId === partnerId)
    .sort((a, b) => b.decidedIso.localeCompare(a.decidedIso));
}

export function getCourtOutcomeByDebtCase(debtCaseId: string): PartnerCourtOutcome | null {
  if (!debtCaseId) return null;
  return loadStore().outcomes.find((o) => o.debtCaseId === debtCaseId) ?? null;
}

export function upsertCourtOutcome(
  outcome: Omit<PartnerCourtOutcome, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
  },
): PartnerCourtOutcome {
  const store = loadStore();
  const now = nowIso();
  const idx = store.outcomes.findIndex(
    (o) => (outcome.id && o.id === outcome.id) || o.debtCaseId === outcome.debtCaseId,
  );
  const next: PartnerCourtOutcome = {
    ...(idx >= 0 ? store.outcomes[idx]! : {}),
    ...outcome,
    id: outcome.id || (idx >= 0 ? store.outcomes[idx]!.id : newId('outcome')),
    createdAt: outcome.createdAt || (idx >= 0 ? store.outcomes[idx]!.createdAt : now),
    updatedAt: now,
  };
  if (idx >= 0) store.outcomes[idx] = next;
  else store.outcomes.push(next);
  saveStore(store);
  return next;
}

/** Record a confirmed monthly payment (idempotent per due date). */
export function confirmCourtPlanPayment(outcomeId: string, dueIso: string): PartnerCourtOutcome | null {
  const store = loadStore();
  const idx = store.outcomes.findIndex((o) => o.id === outcomeId);
  if (idx < 0) return null;
  const current = store.outcomes[idx]!;
  const confirmed = new Set(current.confirmedPaymentIsos || []);
  confirmed.add(dueIso.slice(0, 10));
  const next: PartnerCourtOutcome = {
    ...current,
    confirmedPaymentIsos: [...confirmed].sort(),
    updatedAt: nowIso(),
  };
  store.outcomes[idx] = next;
  saveStore(store);
  return next;
}

export function setCourtOutcomeOrderOnFile(outcomeId: string, onFile: boolean): PartnerCourtOutcome | null {
  const store = loadStore();
  const idx = store.outcomes.findIndex((o) => o.id === outcomeId);
  if (idx < 0) return null;
  const next: PartnerCourtOutcome = { ...store.outcomes[idx]!, writtenOrderOnFile: onFile, updatedAt: nowIso() };
  store.outcomes[idx] = next;
  saveStore(store);
  return next;
}
