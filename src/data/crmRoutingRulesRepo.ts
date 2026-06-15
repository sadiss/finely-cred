import type { CrmRoutingRule } from '../domain/crmRoutingRules';
import { nowIso } from '../domain/crmRoutingRules';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.crm_routing_rules.v1';
const VERSION = 1;

type Store = { rules: CrmRoutingRule[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { rules: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
  window.dispatchEvent(new Event('finely:store'));
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_RULES: CrmRoutingRule[] = [
  {
    id: 'route_affiliate_lead',
    name: 'Affiliate-attributed → contacted',
    enabled: true,
    priority: 10,
    when: { kind: 'inbound_lead', referralCode: '*' },
    then: { moveStage: 'contacted', addTags: ['affiliate-attributed'], note: 'Auto-routed: affiliate referral' },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'route_business_interest',
    name: 'Business interest → booked lane',
    enabled: true,
    priority: 20,
    when: { kind: 'inbound_lead', interestContains: 'business' },
    then: { moveStage: 'booked', addTags: ['lane:business'], note: 'Auto-routed: business lane' },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'route_guide_funnel',
    name: 'Free guide funnel → nurture',
    enabled: true,
    priority: 30,
    when: { offer: 'dispute_letter_guide' },
    then: { moveStage: 'contacted', addTags: ['funnel:guide'], note: 'Auto-routed: guide lead' },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

export function listCrmRoutingRules(): CrmRoutingRule[] {
  const store = loadStore();
  if (!store.rules.length) {
    store.rules = DEFAULT_RULES;
    saveStore(store);
  }
  return store.rules.slice().sort((a, b) => a.priority - b.priority);
}

export function upsertCrmRoutingRule(rule: CrmRoutingRule): CrmRoutingRule {
  const store = loadStore();
  const idx = store.rules.findIndex((r) => r.id === rule.id);
  const next = { ...rule, updatedAt: nowIso() };
  if (idx >= 0) store.rules[idx] = next;
  else store.rules.push(next);
  saveStore(store);
  return next;
}

export function createCrmRoutingRule(name: string): CrmRoutingRule {
  const now = nowIso();
  return upsertCrmRoutingRule({
    id: newId('route'),
    name,
    enabled: true,
    priority: (listCrmRoutingRules().length + 1) * 10,
    when: { kind: 'inbound_lead' },
    then: {},
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteCrmRoutingRule(id: string): boolean {
  const store = loadStore();
  const before = store.rules.length;
  store.rules = store.rules.filter((r) => r.id !== id);
  if (store.rules.length !== before) saveStore(store);
  return store.rules.length !== before;
}
