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

/**
 * Resolves the destination route for a CTA-destination experiment (e.g. the
 * homepage hero). Assigns/reuses the sticky per-session variant (recording an
 * impression on first call, same as `assignFunnelVariant`) and looks up that
 * variant's `ctaDestinations` entry, falling back to `fallback` when no
 * experiment is configured/enabled or the variant has no destination set.
 */
export function getAssignedCtaDestination(funnelId: string, fallback: string): string {
  const exp = getExperimentForFunnel(funnelId);
  if (!exp) return fallback;
  const variant = assignFunnelVariant(funnelId);
  return exp.ctaDestinations?.[variant] ?? fallback;
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

/**
 * Default experiment definitions, keyed by `funnelId`. Additive: any
 * funnelId not already present in the store gets seeded, so shipping a new
 * default here (e.g. `homepage_hero`) reaches existing installs too, not
 * just brand-new ones — unlike the old "only seed if store is empty" logic.
 */
function buildDefaultExperiments(): FunnelExperiment[] {
  return [
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
    {
      id: newId('exp'),
      funnelId: 'homepage_hero',
      name: 'Homepage hero CTA destination test',
      enabled: true,
      headlines: {},
      ctaLabels: {},
      ctaDestinations: {
        control: '/pricing/business-credit',
        variant_a: '/pricing/personal-credit-restore',
        variant_b: '/start-here',
      },
      stats: {},
      updatedAt: new Date().toISOString(),
    },
    {
      id: newId('exp'),
      funnelId: 'debt_freedom',
      name: 'Free debt guide headline test',
      enabled: true,
      headlines: {
        control: 'Annihilate Your Debt. Take Back Control.',
        variant_a: 'Stop the Collection Calls — Starting Today',
        variant_b: 'Your Fight-Back Validation Playbook Is Ready',
      },
      ctaLabels: {
        control: 'Get the free guide',
        variant_a: 'Send me the playbook',
        variant_b: 'Unlock my validation kit',
      },
      stats: {},
      updatedAt: new Date().toISOString(),
    },
    {
      id: newId('exp'),
      funnelId: 'business_credit',
      name: 'Free business guide headline test',
      enabled: true,
      headlines: {
        control: 'Business Credit Power Guide',
        variant_a: 'Build Business Credit Funders Respect',
        variant_b: 'The Fundability Sequencing Blueprint — Free',
      },
      ctaLabels: {
        control: 'Download Free Guide',
        variant_a: 'Send me the guide',
        variant_b: 'Get my fundability blueprint',
      },
      stats: {},
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function ensureDefaultExperiments() {
  const store = loadStore();
  const existingFunnelIds = new Set(store.experiments.map((e) => e.funnelId));
  const missing = buildDefaultExperiments().filter((exp) => !existingFunnelIds.has(exp.funnelId));
  if (!missing.length) return;
  store.experiments = [...store.experiments, ...missing];
  saveStore(store);
}
