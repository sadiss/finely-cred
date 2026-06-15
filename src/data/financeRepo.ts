import type { FinanceIncomeEvent, FinanceTemplate } from '../domain/finance';
import { nowIso } from '../domain/finance';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.finance.v1';

type Store = {
  templates: FinanceTemplate[];
  income: FinanceIncomeEvent[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { templates: [], income: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listFinanceTemplatesByTenant(tenantId: string): FinanceTemplate[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .templates
    .filter((x) => x.tenantId === t)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getFinanceTemplate(id: string): FinanceTemplate | null {
  return loadStore().templates.find((t) => t.id === id) ?? null;
}

export function upsertFinanceTemplate(template: FinanceTemplate): FinanceTemplate {
  const store = loadStore();
  const idx = store.templates.findIndex((x) => x.id === template.id);
  const next: FinanceTemplate = { ...template, updatedAt: nowIso() };
  if (idx >= 0) store.templates[idx] = next;
  else store.templates.push(next);
  saveStore(store);
  return next;
}

export function createFinanceTemplate(args: { tenantId: string; name: string; description?: string }): FinanceTemplate {
  const now = nowIso();
  return upsertFinanceTemplate({
    id: newId('fin_tpl'),
    tenantId: args.tenantId,
    name: args.name,
    description: args.description,
    enabled: true,
    buckets: [
      { id: newId('bucket'), name: 'Taxes (reserve)', category: 'tax', mode: 'pct_gross', value: 25 },
      { id: newId('bucket'), name: 'Marketing', category: 'marketing', mode: 'pct_gross', value: 10 },
      { id: newId('bucket'), name: 'Payroll', category: 'payroll', mode: 'pct_gross', value: 20 },
      { id: newId('bucket'), name: 'Ops reserve', category: 'reserve', mode: 'pct_remaining', value: 10 },
    ],
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteFinanceTemplate(id: string) {
  const store = loadStore();
  store.templates = store.templates.filter((t) => t.id !== id);
  // Keep income events but remove template linkage if it pointed here.
  store.income = store.income.map((e) => (e.templateId === id ? { ...e, templateId: undefined, updatedAt: nowIso() } : e));
  saveStore(store);
}

export function listIncomeEventsByTenant(tenantId: string): FinanceIncomeEvent[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .income
    .filter((x) => x.tenantId === t)
    .slice()
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export function upsertIncomeEvent(event: FinanceIncomeEvent): FinanceIncomeEvent {
  const store = loadStore();
  const idx = store.income.findIndex((x) => x.id === event.id);
  const next: FinanceIncomeEvent = { ...event, updatedAt: nowIso() };
  if (idx >= 0) store.income[idx] = next;
  else store.income.push(next);
  saveStore(store);
  return next;
}

export function createIncomeEvent(args: Omit<FinanceIncomeEvent, 'id' | 'createdAt' | 'updatedAt'>): FinanceIncomeEvent {
  const now = nowIso();
  return upsertIncomeEvent({
    id: newId('fin_income'),
    createdAt: now,
    updatedAt: now,
    ...args,
  });
}

export function deleteIncomeEvent(id: string) {
  const store = loadStore();
  store.income = store.income.filter((e) => e.id !== id);
  saveStore(store);
}

