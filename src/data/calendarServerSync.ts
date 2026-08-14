/**
 * Supabase dual-write sync for calendar events (Phase F1 — server-side meeting
 * reminders + no-show detection). Follows crmServerSync.ts's exact pattern:
 * every local calendarRepo.ts write is mirrored best-effort to Supabase; if the
 * call fails or Supabase isn't configured, the local write already succeeded
 * and nothing throws.
 *
 * Tenant id intentionally uses the literal 'finely_cred' (not FINELY_TENANT_ID)
 * so these rows line up with the same tenant_id used by platform-cron's new
 * processDueMeetingReminders.ts / processDueNoShowRecovery.ts — see migration
 * 20260814100000_calendar_events_server.sql.
 */
import type { CalendarEvent } from '../domain/calendar';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const SERVER_TENANT_ID = 'finely_cred';
const BACKFILL_FLAG_KEY = 'finely.calendarServerSync.backfilledV1';

function rowFromCalendarEvent(ev: CalendarEvent) {
  return {
    id: ev.id,
    tenant_id: SERVER_TENANT_ID,
    partner_id: ev.partnerId,
    type: ev.type,
    status: ev.status,
    title: ev.title,
    description: ev.description ?? null,
    meeting_agenda: ev.meetingAgenda ?? null,
    start_at: ev.startAt,
    end_at: ev.endAt,
    slot_duration_minutes: ev.slotDurationMinutes ?? null,
    timezone: ev.timezone ?? null,
    meeting_url: ev.meetingUrl ?? null,
    location: ev.location ?? null,
    source_request_id: ev.sourceRequestId ?? null,
    reminder_sent_at: ev.reminderSentAt ?? null,
    meeting_notes: ev.meetingNotes ?? null,
    created_at: ev.createdAt,
    updated_at: ev.updatedAt,
  };
}

/** Best-effort — call after every local calendar event create/update/status/notes write. Never throws. */
export async function syncCalendarEventToSupabase(event: CalendarEvent | null): Promise<{ ok: boolean; error?: string }> {
  if (!event) return { ok: false, error: 'No event' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('calendar_events').upsert(rowFromCalendarEvent(event), { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllCalendarEventsToSupabase(events: CalendarEvent[]): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!events.length) return { ok: true, count: 0 };
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('calendar_events').upsert(events.map(rowFromCalendarEvent), { onConflict: 'id' });
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: events.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

/**
 * One-time data migration: pushes every existing local calendar event up to
 * Supabase. Safe to call multiple times (idempotent upsert), guarded by
 * runCalendarServerBackfillOnce() below so it doesn't re-scan the full local
 * store on every page load.
 */
export async function backfillCalendarEventsToSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  // Lazy import avoids a circular import: calendarRepo.ts imports this module
  // to sync on write, so a static top-level import of calendarRepo here would cycle.
  const { listCalendarEvents } = await import('./calendarRepo');
  return syncAllCalendarEventsToSupabase(listCalendarEvents());
}

/** Guarded one-time backfill — call from an admin entry point (e.g. calendar page mount). */
export async function runCalendarServerBackfillOnce(): Promise<
  { ran: false; reason: string } | ({ ran: true } & Awaited<ReturnType<typeof backfillCalendarEventsToSupabase>>)
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
  const result = await backfillCalendarEventsToSupabase();
  if (result.ok) {
    try {
      window.localStorage.setItem(BACKFILL_FLAG_KEY, '1');
    } catch {
      // ignore — worst case we retry the backfill next load
    }
  }
  return { ran: true, ...result };
}

export function isCalendarServerBackfillDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BACKFILL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}
