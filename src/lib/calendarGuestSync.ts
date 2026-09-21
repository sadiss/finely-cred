import type { CalendarEvent } from '../domain/calendar';
import { isSupabaseConfigured, supabase } from './supabaseClient';

/** Best-effort upsert for guest lookup edge (authenticated admin session). */
export async function syncPublicCalendarEventToServer(ev: CalendarEvent): Promise<'ok' | 'skipped' | 'failed'> {
  if (!isSupabaseConfigured) return 'skipped';
  if (ev.status === 'cancelled') {
    /* still sync so guests see cancelled state */
  }
  try {
    const { error } = await supabase.from('public_calendar_guest_events').upsert({
      id: ev.id,
      title: ev.title,
      start_at: ev.startAt,
      end_at: ev.endAt,
      meeting_url: ev.meetingUrl ?? null,
      timezone: ev.timezone ?? null,
      status: ev.status,
      updated_at: new Date().toISOString(),
    });
    if (error) return 'failed';
    return 'ok';
  } catch {
    return 'failed';
  }
}
