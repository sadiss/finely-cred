import type { AgentPersonaId } from '../domain/agentPersonas';
import type { LeadMagnetFunnelConfig } from '../domain/leadMagnetFunnels';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.leadMagnetFunnels.v1';

export type LeadMagnetFunnelOverride = Partial<
  Pick<
    LeadMagnetFunnelConfig,
    | 'urgencyText'
    | 'heroHeadline'
    | 'heroHighlight'
    | 'heroSub'
    | 'metaTitle'
    | 'metaDesc'
    | 'offer'
    | 'agentDisplayName'
    | 'agentRole'
  >
> & {
  agentPersonaId?: AgentPersonaId;
};

type Store = { overrides: Record<string, LeadMagnetFunnelOverride> };

function loadStore(): Store {
  return loadJson(KEY, { overrides: {} }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function loadFunnelOverrides(): Record<string, LeadMagnetFunnelOverride> {
  return loadStore().overrides;
}

export function getFunnelOverride(funnelKey: string): LeadMagnetFunnelOverride | undefined {
  return loadStore().overrides[funnelKey];
}

export function saveFunnelOverride(funnelKey: string, patch: LeadMagnetFunnelOverride) {
  const store = loadStore();
  store.overrides[funnelKey] = { ...(store.overrides[funnelKey] ?? {}), ...patch };
  saveStore(store);
}

export function clearFunnelOverride(funnelKey: string) {
  const store = loadStore();
  delete store.overrides[funnelKey];
  saveStore(store);
}

/** Merge admin overrides onto static funnel config (by funnelId, then id). */
export function resolveLeadMagnetConfig(base: LeadMagnetFunnelConfig): LeadMagnetFunnelConfig {
  const overrides = loadFunnelOverrides();
  const patch = overrides[base.funnelId] ?? overrides[base.id];
  if (!patch) return base;
  return { ...base, ...patch };
}
