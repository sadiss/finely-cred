import type { Affiliate, AffiliateAttributionEvent, AffiliateCampaign } from '../domain/affiliate';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function rowToAffiliate(row: any, campaigns: AffiliateCampaign[] = []): Affiliate {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    fullName: row.full_name ?? undefined,
    referralCode: row.referral_code,
    commissionPct: Number(row.commission_pct ?? 20),
    recurringCommissionPct: Number(row.recurring_commission_pct ?? 15),
    denefitsSharePct: Number(row.denefits_share_pct ?? 8),
    status: row.status,
    claimedUserId: row.claimed_user_id ?? undefined,
    partnerId: row.partner_id ?? undefined,
    meta: row.meta ?? {},
    campaigns,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function affiliateToRow(a: Affiliate): any {
  return {
    id: a.id,
    tenant_id: a.tenantId || FINELY_TENANT_ID,
    email: a.email,
    full_name: a.fullName ?? null,
    referral_code: a.referralCode,
    commission_pct: a.commissionPct,
    recurring_commission_pct: a.recurringCommissionPct,
    denefits_share_pct: a.denefitsSharePct,
    status: a.status,
    claimed_user_id: a.claimedUserId ?? null,
    partner_id: a.partnerId ?? null,
    meta: a.meta ?? {},
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

function rowToCampaign(row: any): AffiliateCampaign {
  return {
    id: row.id,
    affiliateId: row.affiliate_id,
    name: row.name,
    utmSource: row.utm_source ?? undefined,
    utmMedium: row.utm_medium ?? undefined,
    utmCampaign: row.utm_campaign ?? undefined,
    landingPath: row.landing_path ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function supabaseListAffiliatesByTenant(tenantId: string): Promise<Affiliate[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('affiliates').select('*').eq('tenant_id', tenantId);
  if (error) { console.warn(error.message); return []; }
  const ids = (data ?? []).map((a) => a.id);
  const { data: camps } = ids.length
    ? await supabase.from('affiliate_campaigns').select('*').in('affiliate_id', ids)
    : { data: [] as any[] };
  const byAff = new Map<string, AffiliateCampaign[]>();
  for (const c of camps ?? []) {
    const arr = byAff.get(c.affiliate_id) ?? [];
    arr.push(rowToCampaign(c));
    byAff.set(c.affiliate_id, arr);
  }
  return (data ?? []).map((r) => rowToAffiliate(r, byAff.get(r.id) ?? []));
}

export async function supabaseFindAffiliateByEmail(email: string): Promise<Affiliate | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.from('affiliates').select('*').eq('email', email).maybeSingle();
  if (!data) return null;
  const { data: camps } = await supabase.from('affiliate_campaigns').select('*').eq('affiliate_id', data.id);
  return rowToAffiliate(data, (camps ?? []).map(rowToCampaign));
}

export async function supabaseFindAffiliateByPartnerId(partnerId: string): Promise<Affiliate | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.from('affiliates').select('*').eq('partner_id', partnerId).maybeSingle();
  if (!data) return null;
  const { data: camps } = await supabase.from('affiliate_campaigns').select('*').eq('affiliate_id', data.id);
  return rowToAffiliate(data, (camps ?? []).map(rowToCampaign));
}

export async function supabaseUpsertAffiliate(a: Affiliate): Promise<Affiliate> {
  const { error } = await supabase.from('affiliates').upsert(affiliateToRow(a), { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return a;
}

export async function supabaseCreateAffiliate(args: {
  tenantId?: string;
  email: string;
  fullName?: string;
  partnerId?: string;
  referralCode: string;
}): Promise<Affiliate> {
  const now = new Date().toISOString();
  const affiliate: Affiliate = {
    id: `affiliate_${crypto.randomUUID?.() ?? Date.now()}`,
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    email: args.email.trim().toLowerCase(),
    fullName: args.fullName,
    referralCode: args.referralCode,
    commissionPct: 20,
    recurringCommissionPct: 15,
    denefitsSharePct: 8,
    status: 'active',
    partnerId: args.partnerId,
    campaigns: [],
    createdAt: now,
    updatedAt: now,
  };
  return supabaseUpsertAffiliate(affiliate);
}

export async function supabaseUpsertCampaign(c: AffiliateCampaign): Promise<AffiliateCampaign> {
  const row = {
    id: c.id,
    affiliate_id: c.affiliateId,
    name: c.name,
    utm_source: c.utmSource ?? null,
    utm_medium: c.utmMedium ?? null,
    utm_campaign: c.utmCampaign ?? null,
    landing_path: c.landingPath ?? null,
    status: c.status,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
  const { error } = await supabase.from('affiliate_campaigns').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return c;
}

export async function supabaseLogAttribution(event: AffiliateAttributionEvent): Promise<AffiliateAttributionEvent> {
  const { error } = await supabase.from('affiliate_attributions').insert({
    id: event.id,
    affiliate_id: event.affiliateId,
    campaign_id: event.campaignId ?? null,
    event_type: event.eventType,
    partner_id: event.partnerId ?? null,
    amount_cents: event.amountCents ?? null,
    meta: event.meta ?? {},
    created_at: event.createdAt,
  });
  if (error) throw new Error(error.message);
  return event;
}
