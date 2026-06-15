import type { Affiliate, AffiliateAttributionEvent, AffiliateCampaign } from '../domain/affiliate';
import { nowIso } from '../domain/affiliate';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import {
  supabaseCreateAffiliate,
  supabaseFindAffiliateByEmail,
  supabaseFindAffiliateByPartnerId,
  supabaseListAffiliatesByTenant,
  supabaseLogAttribution,
  supabaseUpsertAffiliate,
  supabaseUpsertCampaign,
} from './affiliateSupabaseRepo';

const KEY = 'finely.affiliates.v1';
type Store = { affiliates: Affiliate[]; events: AffiliateAttributionEvent[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { affiliates: [], events: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export async function listAffiliatesByTenant(tenantId: string): Promise<Affiliate[]> {
  if (isSupabaseConfigured) {
    const remote = await supabaseListAffiliatesByTenant(tenantId);
    if (remote.length) return remote;
  }
  return loadStore().affiliates.filter((a) => a.tenantId === tenantId);
}

export async function findAffiliateByEmail(email: string): Promise<Affiliate | null> {
  const e = email.trim().toLowerCase();
  if (isSupabaseConfigured) {
    const remote = await supabaseFindAffiliateByEmail(e);
    if (remote) return remote;
  }
  return loadStore().affiliates.find((a) => a.email === e) ?? null;
}

export async function findAffiliateByPartnerId(partnerId: string): Promise<Affiliate | null> {
  if (isSupabaseConfigured) {
    const remote = await supabaseFindAffiliateByPartnerId(partnerId);
    if (remote) return remote;
  }
  return loadStore().affiliates.find((a) => a.partnerId === partnerId) ?? null;
}

export async function upsertAffiliate(affiliate: Affiliate): Promise<Affiliate> {
  const next = { ...affiliate, updatedAt: nowIso() };
  if (isSupabaseConfigured) {
    try {
      return await supabaseUpsertAffiliate(next);
    } catch (e) {
      console.warn('supabaseUpsertAffiliate fallback local', e);
    }
  }
  const store = loadStore();
  const idx = store.affiliates.findIndex((a) => a.id === next.id);
  if (idx >= 0) store.affiliates[idx] = next;
  else store.affiliates.push(next);
  saveStore(store);
  return next;
}

export async function createAffiliate(args: {
  tenantId?: string;
  email: string;
  fullName?: string;
  partnerId?: string;
  referralCode?: string;
}): Promise<Affiliate> {
  const code = args.referralCode ?? `FC-${newId('ref').slice(-8).toUpperCase()}`;
  if (isSupabaseConfigured) {
    try {
      return await supabaseCreateAffiliate({ ...args, referralCode: code });
    } catch (e) {
      console.warn('supabaseCreateAffiliate fallback local', e);
    }
  }
  const now = nowIso();
  const affiliate: Affiliate = {
    id: newId('affiliate'),
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    email: args.email.trim().toLowerCase(),
    fullName: args.fullName,
    referralCode: code,
    commissionPct: 20,
    recurringCommissionPct: 15,
    denefitsSharePct: 8,
    status: 'active',
    partnerId: args.partnerId,
    campaigns: [],
    createdAt: now,
    updatedAt: now,
  };
  return upsertAffiliate(affiliate);
}

export async function upsertAffiliateCampaign(campaign: AffiliateCampaign): Promise<AffiliateCampaign> {
  if (isSupabaseConfigured) {
    try {
      return await supabaseUpsertCampaign(campaign);
    } catch (e) {
      console.warn('supabaseUpsertCampaign fallback local', e);
    }
  }
  const store = loadStore();
  const aff = store.affiliates.find((a) => a.id === campaign.affiliateId);
  if (!aff) throw new Error('Affiliate not found');
  const idx = aff.campaigns.findIndex((c) => c.id === campaign.id);
  const next = { ...campaign, updatedAt: nowIso() };
  if (idx >= 0) aff.campaigns[idx] = next;
  else aff.campaigns.push(next);
  aff.updatedAt = nowIso();
  saveStore(store);
  return next;
}

export async function logAffiliateAttribution(event: Omit<AffiliateAttributionEvent, 'id' | 'createdAt'>): Promise<AffiliateAttributionEvent> {
  const full: AffiliateAttributionEvent = { ...event, id: newId('attr'), createdAt: nowIso() };
  if (isSupabaseConfigured) {
    try {
      return await supabaseLogAttribution(full);
    } catch (e) {
      console.warn('supabaseLogAttribution fallback local', e);
    }
  }
  const store = loadStore();
  store.events.push(full);
  saveStore(store);
  return full;
}

export async function listAffiliateAttributionsAsync(affiliateId: string): Promise<AffiliateAttributionEvent[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('affiliate_attributions')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });
    if (!error && data?.length) {
      const events = data.map((r) => ({
        id: r.id,
        affiliateId: r.affiliate_id,
        campaignId: r.campaign_id ?? undefined,
        eventType: r.event_type,
        partnerId: r.partner_id ?? undefined,
        amountCents: r.amount_cents ?? undefined,
        meta: r.meta ?? {},
        createdAt: r.created_at,
      })) as AffiliateAttributionEvent[];
      const store = loadStore();
      const others = store.events.filter((e) => e.affiliateId !== affiliateId);
      store.events = [...events, ...others];
      saveStore(store);
      return events;
    }
  }
  return listAffiliateAttributions(affiliateId);
}

export function listAffiliateAttributions(affiliateId: string): AffiliateAttributionEvent[] {
  return loadStore().events.filter((e) => e.affiliateId === affiliateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function affiliateConversionStats(affiliateId: string) {
  const events = listAffiliateAttributions(affiliateId);
  const payoutCents = events.filter((e) => e.eventType === 'payout').reduce((s, e) => s + (e.amountCents ?? 0), 0);
  const earnedCents = events.filter((e) => e.eventType === 'conversion').reduce((s, e) => s + (e.amountCents ?? 0), 0);
  return {
    clicks: events.filter((e) => e.eventType === 'click').length,
    leads: events.filter((e) => e.eventType === 'lead').length,
    signups: events.filter((e) => e.eventType === 'signup').length,
    conversions: events.filter((e) => e.eventType === 'conversion').length,
    payoutCents,
    pendingPayoutCents: Math.max(0, earnedCents - payoutCents),
  };
}
