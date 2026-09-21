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

/** Library case for Anna Charlotin playbook — not a site form lead. */
export function ensureAnnaCharlotinLibraryCase() {
  const tag = 'anna-charlotin-playbook';
  const existing = loadStore().prospects.find((p) => p.libraryTag === tag);
  if (existing) return existing;
  const id = newId('wprospect');
  return upsertWarmProspect({
    id,
    createdAt: nowWarmIso(),
    updatedAt: nowWarmIso(),
    heat: 'warm',
    source: 'library',
    libraryTag: tag,
    fullName: 'Anna Charlotin',
    email: undefined,
    phone: undefined,
    company: 'Apparel / design-tech concept',
    title: 'Partner playbook case',
    notes: [
      'Warm→hot pipeline library entry — partner coaching case, NOT inbound form capture.',
      'Tracks: restore (AUs logged), Nora fundability handoff, business build / concept studio.',
      'See docs/partners/ANNA-CHARLOTIN-PLAYBOOK.md',
    ],
    sequenceDraftId: 'warm-intro-educational',
    nextAction: { label: 'Review Partner Playbook tab + restore AU log', dueAt: undefined },
  });
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
