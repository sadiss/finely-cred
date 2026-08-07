/**
 * Per-debt-account validation ladder for guided restore.
 * Wait clock starts only when mail is logged — separate from FDCPA 30-day request window.
 */

import { loadJson, saveJson } from '../data/localJsonStore';

export type ValidationAccountLadderState =
  | 'not_sent'
  | 'sent_awaiting'
  | 'response_logged'
  | 'deficient'
  | 'adequate'
  | 'no_response';

export type ValidationAccountStateRecord = {
  debtCaseId: string;
  partnerId: string;
  state: ValidationAccountLadderState;
  /** ISO when validation letter was mailed / mail logged */
  mailedAt?: string;
  /** ISO when a response was logged */
  responseLoggedAt?: string;
  updatedAt: string;
};

const KEY = 'finely.validationAccountState.v1';

type Store = { byDebtId: Record<string, ValidationAccountStateRecord> };

function loadStore(): Store {
  return loadJson<Store>(KEY, { byDebtId: {} }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getValidationAccountState(debtCaseId: string): ValidationAccountStateRecord | null {
  return loadStore().byDebtId[debtCaseId] ?? null;
}

export function listValidationAccountStatesByPartner(partnerId: string): ValidationAccountStateRecord[] {
  return Object.values(loadStore().byDebtId).filter((r) => r.partnerId === partnerId);
}

export function setValidationAccountState(args: {
  debtCaseId: string;
  partnerId: string;
  state: ValidationAccountLadderState;
  mailedAt?: string;
  responseLoggedAt?: string;
}): ValidationAccountStateRecord {
  const store = loadStore();
  const prev = store.byDebtId[args.debtCaseId];
  const now = new Date().toISOString();
  const next: ValidationAccountStateRecord = {
    debtCaseId: args.debtCaseId,
    partnerId: args.partnerId,
    state: args.state,
    mailedAt: args.mailedAt ?? prev?.mailedAt,
    responseLoggedAt: args.responseLoggedAt ?? prev?.responseLoggedAt,
    updatedAt: now,
  };
  store.byDebtId[args.debtCaseId] = next;
  saveStore(store);
  return next;
}

/** Mark validation letter mailed — starts operational wait (not the FDCPA 30-day request window). */
export function markValidationLetterMailed(args: {
  debtCaseId: string;
  partnerId: string;
  mailedAt?: string;
}): ValidationAccountStateRecord {
  const mailedAt = args.mailedAt ?? new Date().toISOString();
  return setValidationAccountState({
    debtCaseId: args.debtCaseId,
    partnerId: args.partnerId,
    state: 'sent_awaiting',
    mailedAt,
  });
}

export function isValidationWaitActive(record: ValidationAccountStateRecord | null | undefined): boolean {
  return Boolean(record?.state === 'sent_awaiting' && record.mailedAt);
}

/** Days since mail logged (operational wait). Null if not mailed. */
export function validationWaitDaysElapsed(record: ValidationAccountStateRecord | null | undefined): number | null {
  if (!record?.mailedAt) return null;
  const ms = Date.now() - Date.parse(record.mailedAt);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}
