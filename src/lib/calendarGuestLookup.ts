import type { CalendarEvent } from '../domain/calendar';
import { listCalendarEvents } from '../data/calendarRepo';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { syncPublicCalendarEventToServer } from './calendarGuestSync';

export type GuestCalendarLookupResult = {
  event: CalendarEvent | null;
  source: 'server' | 'local_demo' | 'synthetic';
  demoWarning?: string;
  cancelled?: boolean;
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

/** Guest-safe lookup: server edge first, then local browser calendar (demo) with explicit banner. */
export async function lookupGuestCalendarEvent(eventId: string): Promise<GuestCalendarLookupResult> {
  const id = eventId.trim();
  if (!id) return { event: null, source: 'synthetic' };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-guest-lookup', {
        body: { eventId: id },
      });
      if (!error && data?.ok && data.found && data.event) {
        const ev = mapServerRow(data.event as Record<string, unknown>);
        return {
          event: ev,
          source: 'server',
          cancelled: Boolean(data.cancelled),
        };
      }
    } catch {
      /* fall through */
    }
  }

  const local = listCalendarEvents().find((e) => e.id === id) ?? null;
  if (local) {
    void syncPublicCalendarEventToServer(local);
    return {
      event: local,
      source: 'local_demo',
      demoWarning:
        'This meeting title/time is loaded from the **demo calendar in your browser** — not a shared server calendar. Hosts must sync events to Supabase (auto-attempt on admin save) for real guests on other devices.',
      cancelled: local.status === 'cancelled',
    };
  }

  return {
    event: {
      id,
      partnerId: 'public:guest',
      type: 'consultation',
      status: 'confirmed',
      title: 'Finely video session',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    source: 'synthetic',
    demoWarning:
      'Event details were not found on the server or in local demo storage. You can still join the stable video room for this link ID — confirm time with your host.',
  };
}
