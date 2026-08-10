import { loadJson, saveJson } from '../../data/localJsonStore';

const KEY = 'finely.growth_ml_labels.v1';

export type GrowthMlLabel = 'approve' | 'reject';

export type GrowthMlLabelEntry = {
  label: GrowthMlLabel;
  at: string;
  url?: string;
  domain?: string;
};

type GrowthMlLabelStore = Record<string, GrowthMlLabelEntry>;

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function normalizeGrowthMlKey(urlOrDomain: string): string {
  const raw = (urlOrDomain || '').trim().toLowerCase();
  if (!raw) return '';
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).hostname.replace(/^www\./, '');
    }
  } catch {
    // fall through
  }
  return raw.replace(/^www\./, '').split('/')[0] ?? raw;
}

function loadStore(): GrowthMlLabelStore {
  return loadJson<GrowthMlLabelStore>(KEY, {}, 1);
}

function saveStore(store: GrowthMlLabelStore) {
  saveJson(KEY, store, 1);
  dispatchStore();
}

export function listGrowthMlLabels(): GrowthMlLabelEntry[] {
  return Object.values(loadStore()).sort((a, b) => b.at.localeCompare(a.at));
}

export function getGrowthMlLabel(urlOrDomain: string): GrowthMlLabelEntry | null {
  const key = normalizeGrowthMlKey(urlOrDomain);
  if (!key) return null;
  return loadStore()[key] ?? null;
}

export function saveLabel(args: {
  label: GrowthMlLabel;
  url?: string;
  domain?: string;
}): GrowthMlLabelEntry {
  const url = args.url?.trim();
  const domain = args.domain?.trim();
  const key = normalizeGrowthMlKey(url || domain || '');
  if (!key) {
    throw new Error('URL or domain required to save ML label');
  }
  const entry: GrowthMlLabelEntry = {
    label: args.label,
    at: new Date().toISOString(),
    url: url || undefined,
    domain: domain || key,
  };
  const store = loadStore();
  store[key] = entry;
  saveStore(store);
  return entry;
}

export function countGrowthMlLabels(): { approve: number; reject: number; total: number } {
  const all = listGrowthMlLabels();
  const approve = all.filter((e) => e.label === 'approve').length;
  const reject = all.filter((e) => e.label === 'reject').length;
  return { approve, reject, total: all.length };
}

export function saveLabelForHit(hit: { url: string; domain?: string }, label: GrowthMlLabel) {
  return saveLabel({ label, url: hit.url, domain: hit.domain });
}
