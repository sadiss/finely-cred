import type { User } from '@supabase/supabase-js';
import type { Partner } from '../domain/partners';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { upsertPartner } from './partnersRepo';

function safeStr(v: any) {
  return String(v ?? '').trim();
}

export async function upsertPartnerToSupabase(args: { partner: Partner; user: User | null }) {
  if (!isSupabaseConfigured) return;
  const p = args.partner;
  const userId = safeStr(args.user?.id || (p as any).claimedUserId);
  if (!p?.id || !userId) return;

  const row: any = {
    id: p.id,
    tenant_id: safeStr(p.tenantId) || FINELY_TENANT_ID,
    status: safeStr(p.status) || 'active',
    profile: p.profile ?? {},
    primary_route: p.primaryRoute ?? null,
    lane: p.lane ?? null,
    journey_stage: p.journeyStage ?? null,
    assigned_agent_id: p.assignedAgentId ?? null,
    claimed_user_id: userId,
    claimed_at: p.claimedAt ?? new Date().toISOString(),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };

  try {
    const { error } = await supabase.from('partners').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Failed to upsert partner to Supabase:', error.message);
    }
  } catch (err: any) {
    console.warn('Error upserting partner to Supabase:', err?.message || String(err));
  }
}

/** Persist claimed partner locally and sync claimed_user_id to Supabase (RLS / letter writes). */
export async function syncClaimedPartnerRecord(args: { partner: Partner; user: User | null }): Promise<Partner> {
  const userId = safeStr(args.user?.id || args.partner.claimedUserId);
  const next: Partner = {
    ...args.partner,
    claimedUserId: userId || args.partner.claimedUserId,
    claimedAt: args.partner.claimedAt ?? (userId ? new Date().toISOString() : undefined),
  };
  const local = await upsertPartner(next);
  await upsertPartnerToSupabase({ partner: local, user: args.user });
  return local;
}

/**
 * Sync partners from Supabase into local storage
 * Called on page load to ensure all partners are available locally
 */
export async function syncPartnersFromSupabase(args: { tenantId: string }): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  
  try {
    console.log(`[Sync] Starting sync for tenant: ${args.tenantId}`);
    
    // First test: Try to query all partners (no filter)
    console.log('[Sync] Testing unrestricted query (all partners)...');
    const { data: testData, error: testError } = await supabase
      .from('partners')
      .select('id, tenant_id', { count: 'exact' });
    
    if (testError) {
      console.error('[Sync] RLS TEST FAILED - Cannot read partners table at all:', testError.message);
    } else {
      console.log(`[Sync] RLS TEST OK - Found ${testData?.length || 0} total partners in system`);
      if (testData && testData.length > 0) {
        console.log('[Sync] Sample tenants:', testData.slice(0, 3).map((p: any) => p.tenant_id));
      }
    }
    
    // Now try with tenant filter
    console.log(`[Sync] Querying for tenant: ${args.tenantId}`);
    let { data, error, count } = await supabase
      .from('partners')
      .select('*', { count: 'exact' })
      .eq('tenant_id', args.tenantId);

    if (error) {
      console.error('[Sync] Query error with tenant filter:', error.message);
      return { ok: false, count: 0, error: error.message };
    }

    console.log(`[Sync] Query returned: ${data?.length || 0} partners (count: ${count})`);

    if (!data || data.length === 0) {
      console.log('[Sync] ⚠️ No partners found in Supabase for tenant:', args.tenantId);
      console.log('[Sync] DEBUG: Checking if tenant_id field exists and has correct value...');
      
      // Try a simpler query to debug
      const { data: debugData } = await supabase
        .from('partners')
        .select('id, tenant_id, profile->email as email')
        .limit(5);
      
      if (debugData && debugData.length > 0) {
        console.log('[Sync] DEBUG: Sample rows from partners table:');
        debugData.forEach((row: any) => {
          console.log(`  - ID: ${row.id}, Tenant: ${row.tenant_id}, Email: ${row.email}`);
        });
      }
      
      return { ok: true, count: 0 };
    }

    console.log(`[Sync] ✅ Found ${data.length} partners in Supabase, importing...`);

    // Convert Supabase rows to Partner objects and upsert into local storage
    let importCount = 0;
    let errors = [];
    
    for (const row of data) {
      try {
        const partner: Partner = {
          id: row.id,
          tenantId: row.tenant_id,
          status: row.status || 'active',
          profile: row.profile || { fullName: 'Partner', email: undefined, phone: undefined },
          primaryRoute: row.primary_route || undefined,
          lane: row.lane || undefined,
          journeyStage: row.journey_stage || undefined,
          journeySignals: row.journey_signals || {},
          importSource: row.import_source || undefined,
          importExternalId: row.import_external_id || undefined,
          claimedUserId: row.claimed_user_id || undefined,
          claimedAt: row.claimed_at || undefined,
          routes: row.routes || {},
          consents: row.consents || {},
          assignedAdminId: row.assigned_admin_id || undefined,
          assignedAgentId: row.assigned_agent_id || undefined,
          notes: row.notes || undefined,
          financial: row.financial || undefined,
          denefits: row.denefits || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        upsertPartner(partner);
        importCount++;
        console.log(`[Sync] ✓ Imported partner: ${partner.profile.fullName} (${partner.profile.email})`);
      } catch (e: any) {
        const errMsg = `Failed to import partner ${row.id}: ${e?.message}`;
        console.error('[Sync]', errMsg);
        errors.push(errMsg);
      }
    }

    console.log(`[Sync] ✅ Completed: ${importCount}/${data.length} partners imported successfully`);
    
    if (errors.length > 0) {
      return { ok: false, count: importCount, error: `Imported ${importCount} partners but ${errors.length} failed` };
    }

    return { ok: true, count: importCount };
  } catch (e: any) {
    console.error('[Sync] ❌ Unexpected error:', e);
    return { ok: false, count: 0, error: e?.message || 'Unknown error syncing partners' };
  }
}
