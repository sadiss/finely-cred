/** Optional Supabase sync for staff roster (Phase 12B — multi-admin parity). */
import type { PortraitGender, StaffMember } from '../domain/staffMember';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { loadStaffRoster, saveStaffRoster, STAFF_ROSTER_SEED } from './staffRoster';

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
    shift_blocks: m.shiftBlocks,
    active: m.active,
    updated_at: new Date().toISOString(),
  };
}

function memberFromRow(row: Record<string, unknown>): StaffMember {
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
    shiftBlocks: Array.isArray(row.shift_blocks) ? (row.shift_blocks as StaffMember['shiftBlocks']) : [],
    active: row.active !== false,
  };
}

/** Push local roster to Supabase (admin save). */
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

/** Pull Supabase roster into local JSON when table has rows. */
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
    saveStaffRoster(members);
    return { ok: true, count: members.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

/** Boot: seed local roster, then optionally hydrate from Supabase if configured. */
export async function ensureStaffRosterSyncedOnce() {
  const local = loadStaffRoster();
  if (!local.length) saveStaffRoster(STAFF_ROSTER_SEED);

  if (!isSupabaseConfigured) return;

  const remote = await syncStaffRosterFromSupabase();
  if (remote.ok && remote.count > 0) return;

  // First-time push of seed roster when remote empty
  if (remote.ok && remote.count === 0) {
    await syncStaffRosterToSupabase({ members: loadStaffRoster().length ? loadStaffRoster() : STAFF_ROSTER_SEED });
  }
}
