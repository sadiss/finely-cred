import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';

/**
 * In-house financing rail (Denefit). User-facing brand: Denefit — contracts that report to Equifax as customers pay.
 * Internal settings keys may still use `denefits` for API compatibility.
 */

export type FinancingContractStatus = 'pending_review' | 'active' | 'cancelled';

export type FinancingContract = {
  id: string;
  agreementId: string;
  partnerId: string;
  amount: number;
  termMonths: number;
  status: FinancingContractStatus;
  createdAt: string;
  updatedAt: string;
};

const KEY = 'finely.in_house_financing.v1';

type Store = { contracts: FinancingContract[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { contracts: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export async function createFinancingContract(args: {
  agreementId: string;
  partnerId: string;
  amount: number;
  termMonths: number;
}): Promise<{ contractId: string; status: FinancingContractStatus }> {
  const store = loadStore();
  const now = nowIso();
  const contract: FinancingContract = {
    id: `fin_${newId('contract')}`,
    agreementId: args.agreementId,
    partnerId: args.partnerId,
    amount: args.amount,
    termMonths: args.termMonths,
    status: 'pending_review',
    createdAt: now,
    updatedAt: now,
  };
  store.contracts.push(contract);
  saveStore(store);
  return { contractId: contract.id, status: contract.status };
}

export async function getFinancingContract(contractId: string): Promise<FinancingContract | null> {
  return loadStore().contracts.find((c) => c.id === contractId) ?? null;
}

export async function setFinancingContractStatus(
  contractId: string,
  status: FinancingContractStatus,
): Promise<FinancingContract | null> {
  const store = loadStore();
  const idx = store.contracts.findIndex((c) => c.id === contractId);
  if (idx < 0) return null;
  const now = nowIso();
  const updated: FinancingContract = { ...store.contracts[idx]!, status, updatedAt: now };
  store.contracts[idx] = updated;
  saveStore(store);
  return updated;
}

