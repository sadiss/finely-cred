import type { FunnelExperiment, FunnelExperimentVariant } from '../domain/funnelExperiments';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.funnelExperiments.v1';

type Store = { experiments: FunnelExperiment[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { experiments: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listFunnelExperiments(): FunnelExperiment[] {
  return loadStore().experiments.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getExperimentForFunnel(funnelId: string): FunnelExperiment | null {
  return listFunnelExperiments().find((e) => e.funnelId === funnelId && e.enabled) ?? null;
}

export function upsertFunnelExperiment(exp: FunnelExperiment): FunnelExperiment {
  const store = loadStore();
  const next = { ...exp, updatedAt: new Date().toISOString() };
  const idx = store.experiments.findIndex((e) => e.id === exp.id);
  if (idx >= 0) store.experiments[idx] = next;
  else store.experiments.push(next);
  saveStore(store);
  return next;
}

/** Deterministic variant from session (sticky per funnel). */
export function assignFunnelVariant(funnelId: string): FunnelExperimentVariant {
  const exp = getExperimentForFunnel(funnelId);
  if (!exp) return 'control';
  const key = `finely.ab.${funnelId}`;
  try {
    const saved = sessionStorage.getItem(key) as FunnelExperimentVariant | null;
    if (saved === 'control' || saved === 'variant_a' || saved === 'variant_b') return saved;
  } catch {
    // ignore
  }
  const roll = Math.random();
  const variant: FunnelExperimentVariant = roll < 0.34 ? 'control' : roll < 0.67 ? 'variant_a' : 'variant_b';
  try {
    sessionStorage.setItem(key, variant);
  } catch {
    // ignore
  }
  recordImpression(exp.id, variant);
  return variant;
}

function recordImpression(experimentId: string, variant: FunnelExperimentVariant) {
  const store = loadStore();
  const idx = store.experiments.findIndex((e) => e.id === experimentId);
  if (idx < 0) return;
  const exp = store.experiments[idx]!;
  const stats = { ...(exp.stats ?? {}) };
  const cur = stats[variant] ?? { impressions: 0, conversions: 0 };
  stats[variant] = { ...cur, impressions: cur.impressions + 1 };
  store.experiments[idx] = { ...exp, stats, updatedAt: new Date().toISOString() };
  saveStore(store);
}

export function recordFunnelConversion(funnelId: string, variant: FunnelExperimentVariant) {
  const store = loadStore();
  const idx = store.experiments.findIndex((e) => e.funnelId === funnelId);
  if (idx < 0) return;
  const exp = store.experiments[idx]!;
  const stats = { ...(exp.stats ?? {}) };
  const cur = stats[variant] ?? { impressions: 0, conversions: 0 };
  stats[variant] = { ...cur, conversions: cur.conversions + 1 };
  store.experiments[idx] = { ...exp, stats, updatedAt: new Date().toISOString() };
  saveStore(store);
}

export function ensureDefaultExperiments() {
  const store = loadStore();
  if (store.experiments.length) return;
  const defaults: FunnelExperiment[] = [
    {
      id: newId('exp'),
      funnelId: 'credit_dispute',
      name: 'Credit funnel headline test',
      enabled: true,
      headlines: {
        control: 'Free dispute letter guide + DIY trial',
        variant_a: 'Download the insider dispute playbook (free)',
        variant_b: 'Start your credit restoration trial today',
      },
      ctaLabels: { control: 'Get the guide', variant_a: 'Send my guide', variant_b: 'Start free trial' },
      stats: {},
      updatedAt: new Date().toISOString(),
    },
  ];
  store.experiments = defaults;
  saveStore(store);
}
