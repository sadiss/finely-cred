import type { AuBuyerOrder, AuBuyerOrderEvidence, AuBuyerOrderEvent, AuBuyerOrderStatus } from '../domain/auBuyerOrders';
import { nowIso } from '../domain/auBuyerOrders';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';
import { recordSellerPayoutOnAuOrderComplete } from './payoutLedgerRepo';

const KEY = 'finely.au_buyer_orders.v1';

type Store = { orders: AuBuyerOrder[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { orders: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listAuBuyerOrdersByPartner(partnerId: string): AuBuyerOrder[] {
  const p = (partnerId || '').trim();
  if (!p) return [];
  return loadStore()
    .orders.filter((o) => o.partnerId === p)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAuBuyerOrdersByTenant(tenantId: string): AuBuyerOrder[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .orders.filter((o) => o.tenantId === t)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAuBuyerOrder(id: string): AuBuyerOrder | null {
  return loadStore().orders.find((o) => o.id === id) ?? null;
}

export function upsertAuBuyerOrder(order: AuBuyerOrder): AuBuyerOrder {
  const store = loadStore();
  const idx = store.orders.findIndex((x) => x.id === order.id);
  const next: AuBuyerOrder = { ...order, updatedAt: nowIso() };
  if (idx >= 0) store.orders[idx] = next;
  else store.orders.push(next);
  saveStore(store);
  return next;
}

export function createAuBuyerOrder(args: Omit<AuBuyerOrder, 'id' | 'createdAt' | 'updatedAt' | 'events' | 'status' | 'eligibility' | 'terms' | 'evidence'>): AuBuyerOrder {
  const now = nowIso();
  const created: AuBuyerOrder = {
    id: newId('au_order'),
    status: 'draft',
    buyer: (args as any).buyer ?? {},
    eligibility: {
      checked: false,
      hasNoRecentLatePayments: false,
      understandsNoGuarantees: false,
      agreesNotToMisrepresentIdentity: false,
      understandsRemovalTimingVaries: false,
    },
    terms: {},
    evidence: [],
    events: [{ at: now, kind: 'created', title: 'Order created' }],
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  return upsertAuBuyerOrder(created);
}

export function addAuBuyerOrderEvent(orderId: string, event: Omit<AuBuyerOrderEvent, 'at'> & { at?: string }): AuBuyerOrder | null {
  const cur = getAuBuyerOrder(orderId);
  if (!cur) return null;
  const next: AuBuyerOrder = {
    ...cur,
    events: [{ at: event.at ?? nowIso(), kind: event.kind, title: event.title, note: event.note }, ...cur.events].slice(0, 120),
  };
  return upsertAuBuyerOrder(next);
}

export function addAuBuyerOrderEvidence(orderId: string, ev: Omit<AuBuyerOrderEvidence, 'id' | 'uploadedAt'>): AuBuyerOrder | null {
  const cur = getAuBuyerOrder(orderId);
  if (!cur) return null;
  const item: AuBuyerOrderEvidence = {
    id: newId('au_ev'),
    uploadedAt: nowIso(),
    ...ev,
  };
  const next: AuBuyerOrder = { ...cur, evidence: [item, ...cur.evidence].slice(0, 40) };
  return upsertAuBuyerOrder(next);
}

export function setAuBuyerOrderStatus(orderId: string, status: AuBuyerOrderStatus, note?: string): AuBuyerOrder | null {
  const cur = getAuBuyerOrder(orderId);
  if (!cur) return null;
  const next: AuBuyerOrder = { ...cur, status };
  const saved = upsertAuBuyerOrder(next);
  addAuBuyerOrderEvent(orderId, { kind: 'status_changed', title: `Status: ${status.replaceAll('_', ' ')}`, note });
  if (status === 'completed') recordSellerPayoutOnAuOrderComplete(saved);
  return saved;
}

