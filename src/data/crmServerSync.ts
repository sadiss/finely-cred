/**
 * Supabase sync for CRM prospects + the materialized CRM record read-model
 * (Phase 2 — real server-side execution engine). Follows the dual-write
 * pattern in nurtureSupabaseSync.ts / automationSupabaseSync.ts: every local
 * write is mirrored best-effort to Supabase; if the call fails or Supabase
 * isn't configured, the local write already succeeded and nothing throws.
 *
 * Tenant id intentionally uses the literal 'finely_cred' (not the
 * FINELY_TENANT_ID constant) so these rows line up with the same tenant_id
 * used by automation-runner / platform-cron / meta-webhook edge functions —
 * see migration 20260813200000_crm_server_sync_and_suppression.sql.
 */
import type { Prospect } from '../domain/crmProspects';
import { nowIso } from '../domain/crmProspects';
import type { CrmRecord, CrmRecordContact, CrmTimelineEntry } from '../domain/crmRecords';
import { listProspects, mergeProspectsFromServer } from './crmProspectsRepo';
import { listCrmRecords, mergeCrmRecordsFromServer } from './crmRecordsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const SERVER_TENANT_ID = 'finely_cred';
const BACKFILL_FLAG_KEY = 'finely.crmServerSync.backfilledV1';

function safeStr(v: unknown): string {
  return String(v ?? '').trim();
}

function rowFromProspect(p: Prospect) {
  return {
    id: p.id,
    tenant_id: SERVER_TENANT_ID,
    target: p.target,
    stage: p.stage,
    source: p.source,
    score: Math.max(0, Math.min(100, Math.round(Number(p.score) || 0))),
    tags: p.tags ?? [],
    company: p.company ?? {},
    contact: p.contact ?? { emails: [], phones: [] },
    intel: p.intel ?? {},
    notes: p.notes ?? [],
    touches: p.touches ?? [],
    assigned_to: p.assignedTo ?? null,
    next_action: p.nextAction ?? null,
    consent_basis: p.consentBasis ?? null,
    lead_type: p.leadType ?? null,
    email_marketing_allowed: p.emailMarketingAllowed ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

function rowFromCrmRecord(r: CrmRecord) {
  return {
    id: r.id,
    tenant_id: SERVER_TENANT_ID,
    kind: r.kind,
    target: r.target,
    stage: r.stage,
    source: r.source,
    score: r.score ?? null,
    tags: r.tags ?? [],
    contact: r.contact ?? {},
    partner_id: r.partnerId ?? null,
    project_ids: r.projectIds ?? [],
    package_interest: r.packageInterest ?? null,
    deal_value_cents: r.dealValueCents ?? null,
    assigned_to: r.assignedTo ?? null,
    next_action: r.nextAction ?? null,
    attribution: r.attribution ?? null,
    category_ids: r.categoryIds ?? null,
    source_ref: r.sourceRef ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function prospectFromRow(r: Record<string, unknown>): Prospect {
  return {
    id: safeStr(r.id),
    createdAt: safeStr(r.created_at) || nowIso(),
    updatedAt: safeStr(r.updated_at) || safeStr(r.created_at) || nowIso(),
    target: (safeStr(r.target) as Prospect['target']) || 'clients',
    stage: (safeStr(r.stage) as Prospect['stage']) || 'new',
    source: (safeStr(r.source) as Prospect['source']) || 'manual',
    score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    company: (r.company as Prospect['company']) || {},
    contact: (r.contact as Prospect['contact']) || { emails: [], phones: [] },
    intel: (r.intel as Prospect['intel']) || undefined,
    assignedTo: (r.assigned_to as Prospect['assignedTo']) || undefined,
    nextAction: (r.next_action as Prospect['nextAction']) || undefined,
    notes: Array.isArray(r.notes) ? (r.notes as Prospect['notes']) : [],
    touches: Array.isArray(r.touches) ? (r.touches as Prospect['touches']) : [],
    consentBasis: (safeStr(r.consent_basis) as Prospect['consentBasis']) || undefined,
    leadType: (safeStr(r.lead_type) as Prospect['leadType']) || undefined,
    emailMarketingAllowed: r.email_marketing_allowed == null ? undefined : Boolean(r.email_marketing_allowed),
  };
}

function crmRecordFromRow(r: Record<string, unknown>): CrmRecord {
  return {
    id: safeStr(r.id),
    kind: (safeStr(r.kind) as CrmRecord['kind']) || 'inbound_lead',
    target: (safeStr(r.target) as CrmRecord['target']) || 'clients',
    stage: (safeStr(r.stage) as CrmRecord['stage']) || 'new',
    source: (safeStr(r.source) as CrmRecord['source']) || 'manual',
    score: r.score == null ? undefined : Number(r.score),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    contact: (r.contact as CrmRecordContact) || {},
    partnerId: safeStr(r.partner_id) || undefined,
    projectIds: Array.isArray(r.project_ids) ? (r.project_ids as string[]) : undefined,
    packageInterest: safeStr(r.package_interest) || undefined,
    dealValueCents: r.deal_value_cents == null ? undefined : Number(r.deal_value_cents),
    assignedTo: (r.assigned_to as CrmRecord['assignedTo']) || undefined,
    nextAction: (r.next_action as CrmRecord['nextAction']) || undefined,
    attribution: (r.attribution as CrmRecord['attribution']) || undefined,
    categoryIds: Array.isArray(r.category_ids) ? (r.category_ids as string[]) : undefined,
    // `crm_records` doesn't persist a `timeline` column server-side — the
    // durable source for prospect-kind timelines is crm_prospects'
    // notes/touches (restored via mergeProspectsFromServer). Non-prospect
    // rows restore with an empty timeline; acceptable since this cache path
    // exists to restore the record's identity/stage/contact, not its history.
    timeline: [] as CrmTimelineEntry[],
    createdAt: safeStr(r.created_at) || nowIso(),
    updatedAt: safeStr(r.updated_at) || safeStr(r.created_at) || nowIso(),
    sourceRef: (r.source_ref as CrmRecord['sourceRef']) || undefined,
  };
}

/**
 * Pull path (Phase F4) — restores this browser's CRM data from Supabase.
 * Follows `billingSupabaseSync.ts`'s `pullBillingSnapshotFromSupabase`
 * pattern: read-and-merge, best-effort, never throws. Not real-time sync —
 * call on demand (e.g. an admin "restore from server" action) or on load.
 */
export async function pullCrmSnapshotFromSupabase(): Promise<{
  ok: boolean;
  prospects: { added: number; updated: number };
  records: { cached: number };
  error?: string;
}> {
  const empty = { prospects: { added: 0, updated: 0 }, records: { cached: 0 } };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured', ...empty };

  try {
    const [prospectsRes, recordsRes] = await Promise.all([
      supabase.from('crm_prospects').select('*').eq('tenant_id', SERVER_TENANT_ID).order('updated_at', { ascending: false }).limit(2000),
      supabase.from('crm_records').select('*').eq('tenant_id', SERVER_TENANT_ID).order('updated_at', { ascending: false }).limit(2000),
    ]);

    if (prospectsRes.error) {
      console.warn('Error fetching crm_prospects from Supabase:', prospectsRes.error.message);
      return { ok: false, error: prospectsRes.error.message, ...empty };
    }
    if (recordsRes.error) {
      console.warn('Error fetching crm_records from Supabase:', recordsRes.error.message);
      return { ok: false, error: recordsRes.error.message, ...empty };
    }

    const prospects = (prospectsRes.data ?? []).map(prospectFromRow);
    const records = (recordsRes.data ?? []).map(crmRecordFromRow);

    const prospectResult = mergeProspectsFromServer(prospects);
    const recordResult = mergeCrmRecordsFromServer(records);

    return { ok: true, prospects: prospectResult, records: recordResult };
  } catch (err: unknown) {
    console.warn('Error pulling CRM snapshot from Supabase:', (err as Error)?.message || String(err));
    return { ok: false, error: (err as Error)?.message ?? String(err), ...empty };
  }
}

/** Best-effort — call after every local prospect create/update. Never throws. */
export async function syncProspectToSupabase(prospect: Prospect): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_prospects').upsert(rowFromProspect(prospect), { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

/** Best-effort — call after every local CRM record mutation (stage move, tag, convert, consent). Never throws. */
export async function syncCrmRecordToSupabase(record: CrmRecord | null): Promise<{ ok: boolean; error?: string }> {
  if (!record) return { ok: false, error: 'No record' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_records').upsert(rowFromCrmRecord(record), { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllProspectsToSupabase(prospects?: Prospect[]): Promise<{ ok: boolean; count: number; error?: string }> {
  const rows = prospects ?? listProspects();
  if (!rows.length) return { ok: true, count: 0 };
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_prospects').upsert(rows.map(rowFromProspect), { onConflict: 'id' });
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: rows.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllCrmRecordsToSupabase(records?: CrmRecord[]): Promise<{ ok: boolean; count: number; error?: string }> {
  const rows = records ?? listCrmRecords();
  if (!rows.length) return { ok: true, count: 0 };
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_records').upsert(rows.map(rowFromCrmRecord), { onConflict: 'id' });
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: rows.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

/**
 * One-time data migration: pushes every existing local prospect + materialized
 * CRM record up to Supabase. Safe to call multiple times (idempotent upsert),
 * but callers should guard with runCrmServerBackfillOnce() below so it doesn't
 * re-scan the full local store on every page load.
 */
export async function backfillCrmRecordsToSupabase(): Promise<{
  ok: boolean;
  prospects: { ok: boolean; count: number; error?: string };
  records: { ok: boolean; count: number; error?: string };
}> {
  const prospects = await syncAllProspectsToSupabase();
  const records = await syncAllCrmRecordsToSupabase();
  return { ok: prospects.ok && records.ok, prospects, records };
}

/** Guarded one-time backfill — call from an admin entry point on first load. */
export async function runCrmServerBackfillOnce(): Promise<
  { ran: false; reason: string } | ({ ran: true } & Awaited<ReturnType<typeof backfillCrmRecordsToSupabase>>)
> {
  if (typeof window === 'undefined') return { ran: false, reason: 'no window' };
  if (!isSupabaseConfigured) return { ran: false, reason: 'Supabase not configured' };
  try {
    if (window.localStorage.getItem(BACKFILL_FLAG_KEY) === '1') {
      return { ran: false, reason: 'Already migrated' };
    }
  } catch {
    // localStorage unavailable — fall through and attempt anyway
  }
  const result = await backfillCrmRecordsToSupabase();
  if (result.ok) {
    try {
      window.localStorage.setItem(BACKFILL_FLAG_KEY, '1');
    } catch {
      // ignore — worst case we retry the backfill next load
    }
  }
  return { ran: true, ...result };
}

export function isCrmServerBackfillDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BACKFILL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}
