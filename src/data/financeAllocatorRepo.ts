import type { FinancePlan } from '../domain/financeAllocator';
import { nowIso } from '../domain/financeAllocator';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.financeAllocator.v1';

type Store = {
  plans: FinancePlan[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { plans: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getOrCreateFinancePlanForTenant(tenantId: string): FinancePlan {
  const t = (tenantId || '').trim();
  if (!t) throw new Error('Missing tenantId');
  const store = loadStore();
  const existing = store.plans.find((p) => p.tenantId === t) ?? null;
  if (existing) return existing;

  const now = nowIso();
  const plan: FinancePlan = {
    id: newId('fin_plan'),
    tenantId: t,
    title: 'Operating split (Monthly)',
    currency: 'USD',
    cadence: 'monthly',
    incomeMonthlyCents: 0,
    buckets: [
      { id: newId('bucket'), kind: 'marketing', name: 'Marketing' },
      { id: newId('bucket'), kind: 'payroll', name: 'Payroll' },
      { id: newId('bucket'), kind: 'agents', name: 'Agent commissions' },
      { id: newId('bucket'), kind: 'affiliates', name: 'Affiliate commissions' },
      { id: newId('bucket'), kind: 'ops', name: 'Operating expenses' },
      { id: newId('bucket'), kind: 'taxes', name: 'Taxes' },
      { id: newId('bucket'), kind: 'profit', name: 'Profit / Owner draw' },
      { id: newId('bucket'), kind: 'reserve', name: 'Reserve' },
    ],
    recipients: [],
    rules: [],
    createdAt: now,
    updatedAt: now,
  };
  store.plans.push(plan);
  saveStore(store);
  return plan;
}

export function upsertFinancePlan(plan: FinancePlan): FinancePlan {
  const store = loadStore();
  const idx = store.plans.findIndex((p) => p.id === plan.id);
  const next: FinancePlan = { ...plan, updatedAt: nowIso() };
  if (idx >= 0) store.plans[idx] = next;
  else store.plans.push(next);
  saveStore(store);
  return next;
}

