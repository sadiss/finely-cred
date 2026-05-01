import type { User } from '@supabase/supabase-js';
import type { Partner } from '../domain/partners';
import { FINELY_TENANT_ID } from '../domain/partners';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function safeStr(v: any) {
  return String(v ?? '').trim();
}

export async function upsertPartnerToSupabase(args: { partner: Partner; user: User | null }) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  const p = args.partner;
  const userId = safeStr(args.user?.id || p.claimedUserId);
  if (!p?.id || !userId) return { ok: false as const, error: 'Missing partner/user id' };

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
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };

  const { error } = await supabase.from('partners').upsert(row, { onConflict: 'id' });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

