import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { CapitalDocItem, CapitalDocKey, CapitalDocStatus, CapitalEntity, CapitalReadinessPlan, LenderRelationship, RelationshipStage } from '../domain/capitalReadiness';
import { computeReadinessScore, defaultDocs, nowIso } from '../domain/capitalReadiness';

const KEY = 'finely.capital_readiness.v1';

type Store = { plans: CapitalReadinessPlan[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { plans: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getOrCreateCapitalPlan(partnerId: string): CapitalReadinessPlan {
  const store = loadStore();
  const id = String(partnerId || '').trim();
  const existing = store.plans.find((p) => p.partnerId === id);
  if (existing) return existing;
  const now = nowIso();
  const plan: CapitalReadinessPlan = {
    partnerId: id,
    createdAt: now,
    updatedAt: now,
    targetBand: 'seven_fig',
    entities: [],
    docs: defaultDocs(),
    relationships: [],
  };
  store.plans.push(plan);
  saveStore(store);
  return plan;
}

export function upsertCapitalPlan(plan: CapitalReadinessPlan): CapitalReadinessPlan {
  const store = loadStore();
  const now = nowIso();
  const next: CapitalReadinessPlan = { ...plan, updatedAt: now };
  const idx = store.plans.findIndex((p) => p.partnerId === next.partnerId);
  if (idx >= 0) store.plans[idx] = next;
  else store.plans.push(next);
  saveStore(store);
  return next;
}

export function setCapitalTargetBand(partnerId: string, band: CapitalReadinessPlan['targetBand']) {
  const plan = getOrCreateCapitalPlan(partnerId);
  return upsertCapitalPlan({ ...plan, targetBand: band });
}

export function setDocStatus(partnerId: string, key: CapitalDocKey, status: CapitalDocStatus) {
  const plan = getOrCreateCapitalPlan(partnerId);
  const nextDocs: CapitalDocItem[] = plan.docs.map((d) => (d.key === key ? { ...d, status, updatedAt: nowIso() } : d));
  return upsertCapitalPlan({ ...plan, docs: nextDocs });
}

export function setDocNotes(partnerId: string, key: CapitalDocKey, notes: string) {
  const plan = getOrCreateCapitalPlan(partnerId);
  const nextDocs: CapitalDocItem[] = plan.docs.map((d) => (d.key === key ? { ...d, notes: (notes || '').trim() || undefined, updatedAt: nowIso() } : d));
  return upsertCapitalPlan({ ...plan, docs: nextDocs });
}

export function addEntity(partnerId: string, args: { role: CapitalEntity['role']; legalName: string; state?: string; einLast4?: string }) {
  const plan = getOrCreateCapitalPlan(partnerId);
  const now = nowIso();
  const ent: CapitalEntity = {
    id: newId('ent'),
    role: args.role,
    legalName: (args.legalName || '').trim() || 'New Entity',
    state: (args.state || '').trim() || undefined,
    einLast4: (args.einLast4 || '').trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  return upsertCapitalPlan({ ...plan, entities: [ent, ...plan.entities] });
}

export function updateEntity(partnerId: string, entityId: string, patch: Partial<Omit<CapitalEntity, 'id' | 'createdAt'>>) {
  const plan = getOrCreateCapitalPlan(partnerId);
  const now = nowIso();
  const nextEntities = plan.entities.map((e) => (e.id === entityId ? { ...e, ...patch, updatedAt: now } : e));
  return upsertCapitalPlan({ ...plan, entities: nextEntities });
}

export function deleteEntity(partnerId: string, entityId: string) {
  const plan = getOrCreateCapitalPlan(partnerId);
  return upsertCapitalPlan({ ...plan, entities: plan.entities.filter((e) => e.id !== entityId) });
}

export function addRelationship(partnerId: string, args: { lenderName: string; type: LenderRelationship['type'] }) {
  const plan = getOrCreateCapitalPlan(partnerId);
  const now = nowIso();
  const rel: LenderRelationship = {
    id: newId('rel'),
    lenderName: (args.lenderName || '').trim() || 'New Lender',
    type: args.type,
    stage: 'research',
    createdAt: now,
    updatedAt: now,
  };
  return upsertCapitalPlan({ ...plan, relationships: [rel, ...plan.relationships] });
}

export function updateRelationship(partnerId: string, id: string, patch: Partial<Omit<LenderRelationship, 'id' | 'createdAt'>>) {
  const plan = getOrCreateCapitalPlan(partnerId);
  const now = nowIso();
  const next = plan.relationships.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now } : r));
  return upsertCapitalPlan({ ...plan, relationships: next });
}

export function setRelationshipStage(partnerId: string, id: string, stage: RelationshipStage) {
  return updateRelationship(partnerId, id, { stage });
}

export function deleteRelationship(partnerId: string, id: string) {
  const plan = getOrCreateCapitalPlan(partnerId);
  return upsertCapitalPlan({ ...plan, relationships: plan.relationships.filter((r) => r.id !== id) });
}

export function getPlanScore(partnerId: string): number {
  return computeReadinessScore(getOrCreateCapitalPlan(partnerId));
}

