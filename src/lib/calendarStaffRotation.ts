import type { CalendarStaffAssignee } from '../domain/calendar';
import { getCalendarBookingSettings } from '../data/calendarSettingsRepo';
import { loadJson, saveJson } from '../data/localJsonStore';

const RR_KEY = 'finely.calendar.roundRobin.v1';

type RoundRobinState = { lastIndex: number };

function loadRrState(): RoundRobinState {
  return loadJson<RoundRobinState>(RR_KEY, { lastIndex: -1 }, 1);
}

function saveRrState(state: RoundRobinState) {
  saveJson(RR_KEY, state, 1);
}

/** Enabled staff in rotation order. */
export function activeStaffAssignees(settings = getCalendarBookingSettings()): CalendarStaffAssignee[] {
  return (settings.staffAssignees ?? []).filter((s) => s.enabled && s.email.includes('@'));
}

/**
 * Pick the next host for a confirmed booking (round-robin when enabled).
 * Persists cursor so bookings alternate fairly across the team.
 */
export function pickRoundRobinAssignee(settings = getCalendarBookingSettings()): CalendarStaffAssignee | null {
  if (!settings.roundRobinEnabled) return null;
  const pool = activeStaffAssignees(settings);
  if (!pool.length) return null;
  const state = loadRrState();
  const nextIndex = (state.lastIndex + 1) % pool.length;
  saveRrState({ lastIndex: nextIndex });
  return pool[nextIndex] ?? null;
}

export function resetRoundRobinCursor() {
  saveRrState({ lastIndex: -1 });
}
