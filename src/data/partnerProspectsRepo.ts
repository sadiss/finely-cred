import {
  addIdentity,
  emptyDedupeIndex,
  type DedupeIndex,
  type PartnerProspect,
  type PartnerProspectStatus,
  type PartnerVertical,
  type ProspectorRunResult,
} from '../domain/partnerProspector/index.ts';
import { nameCityKey } from '../domain/partnerProspector/normalize.ts';
import { nowIso } from '../domain/crmProspects';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.partner_prospects.v1';

type Store = {
  prospects: PartnerProspect[];
  runs: Array<{
    batchId: string;
    createdAt: string;
    params: ProspectorRunResult['params'];
    stats: ProspectorRunResult['stats'];
    source: ProspectorRunResult['source'];
  }>;
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { prospects: [], runs: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listPartnerProspects(args?: {
  batchId?: string;
  vertical?: PartnerVertical | 'all';
  fit?: 'strong' | 'maybe' | 'skip' | 'all';
  q?: string;
}): PartnerProspect[] {
  const store = loadStore();
  const q = String(args?.q || '').trim().toLowerCase();
  return store.prospects
    .filter((p) => {
      if (args?.batchId && p.batchId !== args.batchId) return false;
      if (args?.vertical && args.vertical !== 'all' && p.vertical !== args.vertical) return false;
      if (args?.fit && args.fit !== 'all' && p.icpFit !== args.fit) return false;
      if (!q) return true;
      const hay = [p.businessName, p.city, p.category, p.website, p.email, p.phone, p.whyFit, p.personName].join(' ').toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listProspectorRuns() {
  return loadStore().runs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function latestProspectorBatchId(): string | null {
  return listProspectorRuns()[0]?.batchId ?? null;
}

export function persistProspectorRun(result: ProspectorRunResult) {
  const store = loadStore();
  const incoming = [...result.prospects];
  const byId = new Map(store.prospects.map((p) => [p.id, p]));
  for (const row of incoming) byId.set(row.id, row);
  store.prospects = [...byId.values()];
  store.runs = [{ batchId: result.batchId, createdAt: result.createdAt, params: result.params, stats: result.stats, source: result.source }, ...store.runs.filter((r) => r.batchId !== result.batchId)].slice(0, 40);
  saveStore(store);
}

export function patchPartnerProspect(id: string, patch: Partial<Pick<PartnerProspect, 'status' | 'notes' | 'personName' | 'title'>>): PartnerProspect | null {
  const store = loadStore();
  const idx = store.prospects.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = { ...store.prospects[idx]!, ...patch, updatedAt: nowIso() };
  store.prospects[idx] = next;
  saveStore(store);
  return next;
}

export function markProspectsStatus(ids: string[], status: PartnerProspectStatus) {
  const store = loadStore();
  const set = new Set(ids);
  const now = nowIso();
  store.prospects = store.prospects.map((p) => (set.has(p.id) ? { ...p, status, updatedAt: now } : p));
  saveStore(store);
}

export function localDedupeIndex(): DedupeIndex {
  const index = emptyDedupeIndex();
  for (const p of loadStore().prospects) {
    addIdentity(index, {
      emails: p.email ? [p.email] : [],
      phones: p.phone ? [p.phone] : [],
      domains: p.website ? [p.website] : [],
      names: [nameCityKey(p.businessName, p.city)].filter(Boolean),
    });
  }
  return index;
}

export function newProspectorId(prefix: string) {
  return newId(prefix);
}
