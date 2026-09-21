import type { WarmProspect, WarmProspectHeat, WarmProspectSource } from '../domain/warmProspects';
import { nowWarmIso } from '../domain/warmProspects';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.crm.warmProspects.v1';

type Store = { prospects: WarmProspect[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { prospects: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function norm(s: unknown) {
  return String(s ?? '').trim();
}

export function listWarmProspects(args?: {
  q?: string;
  heat?: WarmProspectHeat | 'all';
  source?: WarmProspectSource | 'all';
}): WarmProspect[] {
  const store = loadStore();
  const q = norm(args?.q).toLowerCase();
  const heat = args?.heat ?? 'all';
  const source = args?.source ?? 'all';
  return store.prospects
    .filter((p) => {
      if (heat !== 'all' && p.heat !== heat) return false;
      if (source !== 'all' && p.source !== source) return false;
      if (!q) return true;
      const hay = [p.fullName, p.email, p.phone, p.company, p.title, p.libraryTag, p.id].join(' ').toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertWarmProspect(p: WarmProspect): WarmProspect {
  const store = loadStore();
  const now = nowWarmIso();
  const next: WarmProspect = { ...p, updatedAt: now };
  const idx = store.prospects.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.prospects[idx] = next;
  else store.prospects.unshift(next);
  saveStore(store);
  window.dispatchEvent(new CustomEvent('finely:store'));
  return next;
}

export function patchWarmProspect(id: string, patch: Partial<WarmProspect>): WarmProspect | null {
  const cur = loadStore().prospects.find((p) => p.id === id);
  if (!cur) return null;
  return upsertWarmProspect({ ...cur, ...patch, id: cur.id, createdAt: cur.createdAt });
}

export function importWarmProspectsFromRows(
  rows: Array<Record<string, string>>,
  meta: { source: WarmProspectSource; libraryTag: string },
): number {
  let n = 0;
  for (const row of rows) {
    const fullName = norm(row.name || row.full_name || row.fullName);
    if (fullName.length < 2) continue;
    const heatRaw = norm(row.heat || row.status || 'warm').toLowerCase();
    const heat: WarmProspectHeat =
      heatRaw === 'hot' ? 'hot' : heatRaw === 'nurture' ? 'nurture' : 'warm';
    const id = newId('wprospect');
    upsertWarmProspect({
      id,
      createdAt: nowWarmIso(),
      updatedAt: nowWarmIso(),
      heat,
      source: meta.source,
      libraryTag: meta.libraryTag,
      fullName,
      email: norm(row.email) || undefined,
      phone: norm(row.phone) || undefined,
      company: norm(row.company) || undefined,
      title: norm(row.title) || undefined,
      notes: row.notes ? [norm(row.notes)] : [],
    });
    n++;
  }
  return n;
}
