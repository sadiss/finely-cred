import type { Agreement, Entitlement } from '../domain/billing';
import { FINELY_TENANT_ID } from '../domain/billing';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { replaceBillingSnapshotForPartner } from './billingRepo';

function nowIso() {
  return new Date().toISOString();
}

function safeStr(v: any) {
  return String(v ?? '').trim();
}

export async function pullBillingSnapshotFromSupabase(args: { partnerId: string }) {
  const partnerId = safeStr(args.partnerId);
  if (!partnerId) return { ok: false as const, error: 'Missing partnerId' };
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };

  const [agreementsRes, entRes] = await Promise.all([
    supabase
      .from('agreements')
      .select('*')
      .eq('partner_id', partnerId)
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase.from('entitlements').select('*').eq('partner_id', partnerId).order('starts_at', { ascending: false }).limit(400),
  ]);

  if (agreementsRes.error) return { ok: false as const, error: agreementsRes.error.message };
  if (entRes.error) return { ok: false as const, error: entRes.error.message };

  const agreements: Agreement[] = (agreementsRes.data ?? []).map((r: any) => ({
    id: safeStr(r.id),
    tenantId: safeStr(r.tenant_id) || FINELY_TENANT_ID,
    billingAccountId: safeStr(r.billing_account_id),
    partnerId: safeStr(r.partner_id),
    packageId: safeStr(r.package_id),
    rail: (safeStr(r.rail) as any) || 'stripe',
    status: (safeStr(r.status) as any) || 'draft',
    amountCents: Number(r.amount_cents ?? 0) || 0,
    externalRef: safeStr(r.external_ref) || undefined,
    denefitsContractUrl: safeStr(r.denefits_contract_url) || undefined,
    createdAt: safeStr(r.created_at) || nowIso(),
    updatedAt: safeStr(r.updated_at) || safeStr(r.created_at) || nowIso(),
    startedAt: safeStr(r.started_at) || undefined,
    endedAt: safeStr(r.ended_at) || undefined,
  }));

  const entitlements: Entitlement[] = (entRes.data ?? []).map((r: any) => ({
    id: safeStr(r.id),
    tenantId: safeStr(r.tenant_id) || FINELY_TENANT_ID,
    partnerId: safeStr(r.partner_id),
    key: safeStr(r.key),
    sourceAgreementId: safeStr(r.source_agreement_id) || undefined,
    status: (safeStr(r.status) as any) || 'active',
    startsAt: safeStr(r.starts_at) || nowIso(),
    endsAt: safeStr(r.ends_at) || undefined,
  }));

  replaceBillingSnapshotForPartner({ partnerId, agreements, entitlements });
  return { ok: true as const, agreements: agreements.length, entitlements: entitlements.length };
}

