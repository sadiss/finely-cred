import type { Agreement, Entitlement } from '../domain/billing';
import { FINELY_TENANT_ID } from '../domain/billing';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { listEntitlementsByPartner, replaceBillingSnapshotForPartner } from './billingRepo';

function nowIso() {
  return new Date().toISOString();
}

function safeStr(v: unknown) {
  return String(v ?? '').trim();
}

/** Real agreement ids from billingRepo use prefixes like agr_; admin grant tags are not FKs. */
function agreementIdForDb(sourceAgreementId: string | undefined): string | null {
  const s = safeStr(sourceAgreementId);
  if (!s) return null;
  if (s.startsWith('admin_') || s.startsWith('trial_') || s === 'manual_admin') return null;
  return s;
}

function isAdminLocalGrant(e: Entitlement): boolean {
  const src = safeStr(e.sourceAgreementId);
  return (
    e.status === 'active' &&
    (src.startsWith('admin_') || src === 'manual_admin' || src.startsWith('trial_'))
  );
}

export async function pullBillingSnapshotFromSupabase(args: { partnerId: string }) {
  try {
    const partnerId = safeStr(args.partnerId);
    if (!partnerId) return;
    if (!isSupabaseConfigured) return;

    const [agreementsRes, entRes] = await Promise.all([
      supabase
        .from('agreements')
        .select('*')
        .eq('partner_id', partnerId)
        .order('updated_at', { ascending: false })
        .limit(200),
      supabase.from('entitlements').select('*').eq('partner_id', partnerId).order('starts_at', { ascending: false }).limit(400),
    ]);

    if (agreementsRes.error) {
      console.warn('Error fetching agreements from Supabase:', agreementsRes.error.message);
      return;
    }
    if (entRes.error) {
      console.warn('Error fetching entitlements from Supabase:', entRes.error.message);
      return;
    }

    const agreements: Agreement[] = (agreementsRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: safeStr(r.id),
      tenantId: safeStr(r.tenant_id) || FINELY_TENANT_ID,
      billingAccountId: safeStr(r.billing_account_id),
      partnerId: safeStr(r.partner_id),
      packageId: safeStr(r.package_id),
      rail: (safeStr(r.rail) as Agreement['rail']) || 'stripe',
      status: (safeStr(r.status) as Agreement['status']) || 'draft',
      amountCents: Number(r.amount_cents ?? 0) || 0,
      externalRef: safeStr(r.external_ref) || undefined,
      denefitsContractUrl: safeStr(r.denefits_contract_url) || undefined,
      createdAt: safeStr(r.created_at) || nowIso(),
      updatedAt: safeStr(r.updated_at) || safeStr(r.created_at) || nowIso(),
      startedAt: safeStr(r.started_at) || undefined,
      endedAt: safeStr(r.ended_at) || undefined,
    }));

    const serverEntitlements: Entitlement[] = (entRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: safeStr(r.id),
      tenantId: safeStr(r.tenant_id) || FINELY_TENANT_ID,
      partnerId: safeStr(r.partner_id),
      key: safeStr(r.key),
      sourceAgreementId: safeStr(r.source_agreement_id) || undefined,
      status: (safeStr(r.status) as Entitlement['status']) || 'active',
      startsAt: safeStr(r.starts_at) || nowIso(),
      endsAt: safeStr(r.ends_at) || undefined,
    }));

    // Keep local admin/trial grants that have not landed on the server yet (race / offline).
    const serverKeys = new Set(serverEntitlements.map((e) => e.key));
    const localPending = listEntitlementsByPartner(partnerId).filter(
      (e) => isAdminLocalGrant(e) && !serverKeys.has(e.key),
    );

    replaceBillingSnapshotForPartner({
      partnerId,
      agreements,
      entitlements: [...serverEntitlements, ...localPending],
    });
  } catch (err: unknown) {
    console.warn('Error syncing billing from Supabase:', (err as Error)?.message || String(err));
  }
}

/**
 * Upsert this partner's local entitlements to Supabase so portal sessions see admin grants.
 * Requires entitlements_admin_write RLS (is_admin).
 */
export async function pushPartnerEntitlementsToSupabase(args: { partnerId: string }): Promise<{
  ok: boolean;
  error?: string;
  pushed: number;
}> {
  const partnerId = safeStr(args.partnerId);
  if (!partnerId) return { ok: false, error: 'Missing partnerId', pushed: 0 };
  if (!isSupabaseConfigured) return { ok: true, pushed: 0 };

  const local = listEntitlementsByPartner(partnerId);
  if (!local.length) return { ok: true, pushed: 0 };

  const rows = local.map((e) => ({
    id: e.id,
    tenant_id: e.tenantId || FINELY_TENANT_ID,
    partner_id: e.partnerId,
    key: e.key,
    source_agreement_id: agreementIdForDb(e.sourceAgreementId),
    status: e.status,
    starts_at: e.startsAt || nowIso(),
    ends_at: e.endsAt || null,
  }));

  const { error } = await supabase.from('entitlements').upsert(rows, { onConflict: 'partner_id,key' });
  if (error) {
    console.warn('Error pushing entitlements to Supabase:', error.message);
    return { ok: false, error: error.message, pushed: 0 };
  }
  return { ok: true, pushed: rows.length };
}
