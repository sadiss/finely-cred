import type { CalendarEvent } from '../domain/calendar';
import { listCalendarEvents } from '../data/calendarRepo';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { syncPublicCalendarEventToServer } from './calendarGuestSync';

export type GuestCalendarLookupResult = {
  event: CalendarEvent | null;
  source: 'server' | 'local_demo' | 'synthetic' | 'server_missing';
  demoWarning?: string;
  cancelled?: boolean;
  blockJoin?: boolean;
};

function mapServerRow(row: Record<string, unknown>): CalendarEvent {
  return {
    id: String(row.id),
    partnerId: 'public:guest',
    type: 'ops',
    status: (row.status as CalendarEvent['status']) || 'confirmed',
    title: String(row.title || 'Meeting'),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    meetingUrl: row.meeting_url ? String(row.meeting_url) : undefined,
    timezone: row.timezone ? String(row.timezone) : undefined,
    createdAt: String(row.start_at),
    updatedAt: String(row.updated_at || row.start_at),
  };
}

async function lookupServer(eventId: string): Promise<GuestCalendarLookupResult | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.functions.invoke('calendar-guest-lookup', {
      body: { eventId },
    });
    if (error) return null;
    if (data?.ok && data.found && data.event) {
      const ev = mapServerRow(data.event as Record<string, unknown>);
      return {
        event: ev,
        source: 'server',
        cancelled: Boolean(data.cancelled),
      };
    }
    if (data?.ok && !data.found) {
      return {
        event: null,
        source: 'server_missing',
        blockJoin: true,
        demoWarning:
          'This invite is not on the Finely server calendar yet. Ask your host to save the event in Admin Calendar (syncs to guest lookup). Demo browser calendars are not used when Supabase is configured.',
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Guest lookup: when Supabase is configured, **server only** (no silent localStorage fallback).
 * Local demo fallback only when Supabase is not configured (offline dev).
 */
export async function lookupGuestCalendarEvent(eventId: string): Promise<GuestCalendarLookupResult> {
  const id = eventId.trim();
  if (!id) return { event: null, source: 'synthetic', blockJoin: true };

  if (isSupabaseConfigured) {
    const server = await lookupServer(id);
    if (server) return server;
    return {
      event: null,
      source: 'server_missing',
      blockJoin: true,
      demoWarning:
        'Could not load meeting details from the server. Confirm the host published this event to the guest calendar service before joining.',
    };
  }

  const local = listCalendarEvents().find((e) => e.id === id) ?? null;
  if (local) {
    return {
      event: local,
      source: 'local_demo',
      demoWarning:
        '**Demo mode:** event loaded from this browser only. Configure Supabase + calendar-guest-lookup for real guest invites.',
      cancelled: local.status === 'cancelled',
    };
  }

  return {
    event: null,
    source: 'synthetic',
    blockJoin: true,
    demoWarning: 'Event not found. In production, hosts must sync calendar events to the server.',
  };
}

/** Admin save hook — best-effort server publish for guest links. */
export function publishCalendarEventForGuests(ev: CalendarEvent) {
  void syncPublicCalendarEventToServer(ev);
}
