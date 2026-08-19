/** Supabase sync for staff roster (multi-admin parity) — source of truth is staff_members table. */
import type { PortraitGender, StaffMember } from '../domain/staffMember';
import { clampStaffShiftBlocks } from '../domain/staffMember';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { isAdminEmail } from '../auth/admin';
import { FINELY_TENANT_ID } from '../domain/tenants';
import {
  forceStaffShiftPolicyResync,
  loadStaffRoster,
  seedStaffRoster,
  STAFF_ROSTER_SEED,
} from './staffRoster';
import { migrateLegacyLocalJson } from './tenantStateRepo';

function rowFromMember(m: StaffMember, tenantId: string) {
  return {
    id: m.id,
    tenant_id: tenantId,
    first_name: m.firstName,
    last_name: m.lastName,
    primary_role_id: m.primaryRoleId,
    department: m.department,
    display_title: m.displayTitle ?? null,
    avatar_path: m.avatarPath,
    portrait_gender: m.portraitGender,
    bio_line: m.bioLine,
    shift_blocks: clampStaffShiftBlocks(m.shiftBlocks),
    active: m.active,
    updated_at: new Date().toISOString(),
  };
}

function memberFromRow(row: Record<string, unknown>): StaffMember {
  const rawBlocks = Array.isArray(row.shift_blocks) ? (row.shift_blocks as StaffMember['shiftBlocks']) : [];
  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    primaryRoleId: row.primary_role_id as StaffMember['primaryRoleId'],
    department: row.department as StaffMember['department'],
    displayTitle: row.display_title ? String(row.display_title) : undefined,
    avatarPath: String(row.avatar_path ?? ''),
    portraitGender: (row.portrait_gender as PortraitGender) ?? 'neutral',
    bioLine: String(row.bio_line ?? ''),
    shiftBlocks: clampStaffShiftBlocks(rawBlocks),
    active: row.active !== false,
  };
}

function migrateLegacyLocalRoster(): StaffMember[] | null {
  const v2 = migrateLegacyLocalJson<StoreShape>('finely.staffRoster.v2', { members: [] }, 1);
  if (v2?.members?.length) return v2.members;
  const v1 = migrateLegacyLocalJson<{ members?: StaffMember[] }>('finely.staffRoster.v1', { members: [] }, 1);
  return v1?.members?.length ? v1.members : null;
}

type StoreShape = { members: StaffMember[]; version?: number };

/** Push roster to Supabase (admin save). */
export async function syncStaffRosterToSupabase(args?: { tenantId?: string; members?: StaffMember[] }) {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  const tenantId = args?.tenantId ?? FINELY_TENANT_ID;
  const members = args?.members ?? loadStaffRoster();
  if (!members.length) return { ok: true, count: 0 };

  try {
    const rows = members.map((m) => rowFromMember(m, tenantId));
    const { error } = await supabase.from('staff_members').upsert(rows, { onConflict: 'id' });
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: rows.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

/** Pull Supabase roster into memory when table has rows. */
export async function syncStaffRosterFromSupabase(args?: { tenantId?: string }): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  const tenantId = args?.tenantId ?? FINELY_TENANT_ID;

  try {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });

    if (error) return { ok: false, count: 0, error: error.message };
    if (!data?.length) return { ok: true, count: 0 };

    const members = data.map((row) => memberFromRow(row as Record<string, unknown>));
    seedStaffRoster(members);
    // Re-apply max-8h seed windows and push corrected shifts (stale Cameron 8–21 rows, etc.).
    forceStaffShiftPolicyResync();
    return { ok: true, count: members.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

/** Boot: seed memory roster, migrate legacy localStorage once, hydrate from Supabase. */
export async function ensureStaffRosterSyncedOnce() {
  const legacy = migrateLegacyLocalRoster();
  if (legacy?.length) {
    seedStaffRoster(legacy);
  } else if (!loadStaffRoster().length) {
    seedStaffRoster(STAFF_ROSTER_SEED);
  }

  if (!isSupabaseConfigured) return;

  // Writing to staff_members is admin-only per RLS — skip sync writes for
  // non-admin sessions so we don't fire requests guaranteed to be rejected.
  const { data } = await supabase.auth.getUser();
  const canWrite = isAdminEmail(data?.user?.email);

  if (legacy?.length && canWrite) {
    await syncStaffRosterToSupabase({ members: legacy });
  }

  const remote = await syncStaffRosterFromSupabase();
  if (remote.ok && remote.count > 0) return;

  if (remote.ok && remote.count === 0 && canWrite) {
    await syncStaffRosterToSupabase({ members: loadStaffRoster().length ? loadStaffRoster() : STAFF_ROSTER_SEED });
  }
}
