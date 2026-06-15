import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.referralGrowth.v1';

export type ReferralClickEvent = {
  id: string;
  code: string;
  path: string;
  createdAt: string;
};

export type ReferralConversionEvent = {
  id: string;
  code: string;
  leadId?: string;
  partnerId?: string;
  funnelId?: string;
  createdAt: string;
};

type Store = {
  clicks: ReferralClickEvent[];
  conversions: ReferralConversionEvent[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { clicks: [], conversions: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function logReferralClick(args: { code: string; path: string }): ReferralClickEvent {
  const store = loadStore();
  const evt: ReferralClickEvent = {
    id: newId('rclk'),
    code: args.code.trim().toUpperCase(),
    path: args.path,
    createdAt: new Date().toISOString(),
  };
  store.clicks.unshift(evt);
  store.clicks = store.clicks.slice(0, 5000);
  saveStore(store);
  return evt;
}

export function logReferralConversion(args: {
  code: string;
  leadId?: string;
  partnerId?: string;
  funnelId?: string;
}): ReferralConversionEvent {
  const store = loadStore();
  const evt: ReferralConversionEvent = {
    id: newId('rconv'),
    code: args.code.trim().toUpperCase(),
    leadId: args.leadId,
    partnerId: args.partnerId,
    funnelId: args.funnelId,
    createdAt: new Date().toISOString(),
  };
  store.conversions.unshift(evt);
  store.conversions = store.conversions.slice(0, 2000);
  saveStore(store);
  return evt;
}

export function listReferralClicks(limit = 500): ReferralClickEvent[] {
  return loadStore().clicks.slice(0, limit);
}

export function listReferralConversions(limit = 500): ReferralConversionEvent[] {
  return loadStore().conversions.slice(0, limit);
}

export function referralStatsForCode(code: string, days = 30) {
  const normalized = code.trim().toUpperCase();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const clicks = loadStore().clicks.filter(
    (c) => c.code === normalized && Date.parse(c.createdAt) >= cutoff,
  );
  const conversions = loadStore().conversions.filter(
    (c) => c.code === normalized && Date.parse(c.createdAt) >= cutoff,
  );
  return {
    code: normalized,
    clicks: clicks.length,
    conversions: conversions.length,
    conversionRate: clicks.length ? conversions.length / clicks.length : 0,
  };
}
