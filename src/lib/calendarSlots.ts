import type { CalendarBookingSettings, CalendarEvent, SlotDuration } from '../domain/calendar';

export type BookableSlot = {
  startAt: string;
  endAt: string;
  durationMinutes: SlotDuration;
  label: string;
  dayKey: string;
};

const DEFAULT_DURATIONS: SlotDuration[] = [20, 30, 60];

function isoDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDayKey(key: string): Date | null {
  const d = new Date(`${key}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function minutesFromTime(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((v || '').trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(min) || hour < 0 || hour > 23 || min < 0 || min > 59) return null;
  return hour * 60 + min;
}

function isAfterPreviousDayCutoff(dayKey: string, cutoffHour: number, now: Date) {
  const day = parseDayKey(dayKey);
  if (!day) return false;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  return isoDayKey(tomorrow) === dayKey && now.getHours() >= cutoffHour;
}

/** Generate bookable time slots with editable Calendly-style settings. */
export function generateDaySlots(args: {
  dayKey: string;
  durationMinutes?: SlotDuration;
  existingEvents?: CalendarEvent[];
  slotIntervalMinutes?: number;
  startHour?: number;
  endHour?: number;
  settings?: CalendarBookingSettings;
}): BookableSlot[] {
  const day = parseDayKey(args.dayKey);
  if (!day) return [];
  const dow = day.getDay();
  const settings = args.settings;
  const allowedWeekdays = settings?.allowedWeekdays ?? [1, 2, 3, 4, 5];
  if (!allowedWeekdays.includes(dow)) return [];

  const duration = args.durationMinutes ?? settings?.defaultDuration ?? 30;
  const interval = args.slotIntervalMinutes ?? settings?.slotIntervalMinutes ?? 30;
  const startHour = args.startHour ?? settings?.startHour ?? 8;
  const endHour = args.endHour ?? settings?.endHour ?? 19;
  const nowDate = new Date();
  const minStart = nowDate.getTime() + Math.max(0, settings?.minNoticeHours ?? 0) * 60 * 60 * 1000;
  const previousDayCutoffClosed = settings ? isAfterPreviousDayCutoff(args.dayKey, settings.cutoffHourPreviousDay, nowDate) : false;
  const events = (args.existingEvents ?? []).filter((e) => e.status !== 'cancelled');
  const blockedWindows = settings?.blockedWindows ?? [];

  const slots: BookableSlot[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      const start = new Date(day);
      start.setHours(hour, min, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);
      if (end.getHours() > endHour || (end.getHours() === endHour && end.getMinutes() > 0)) continue;
      if (start.getTime() < minStart) continue;
      if (previousDayCutoffClosed) continue;

      const startMs = start.getTime();
      const endMs = end.getTime();
      const blocked = events.some((ev) => {
        const evStart = Date.parse(ev.startAt);
        const evEnd = Date.parse(ev.endAt);
        if (!Number.isFinite(evStart) || !Number.isFinite(evEnd)) return false;
        return overlaps(startMs, endMs, evStart, evEnd);
      });
      if (blocked) continue;

      const slotStartMinutes = start.getHours() * 60 + start.getMinutes();
      const slotEndMinutes = end.getHours() * 60 + end.getMinutes();
      const blockedByWindow = blockedWindows.some((w) => {
        if (w.dayKey && w.dayKey !== args.dayKey) return false;
        if (w.dayOfWeek != null && w.dayOfWeek !== dow) return false;
        const bs = minutesFromTime(w.startTime);
        const be = minutesFromTime(w.endTime);
        if (bs == null || be == null || be <= bs) return false;
        return overlaps(slotStartMinutes, slotEndMinutes, bs, be);
      });
      if (blockedByWindow) continue;

      const label = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      slots.push({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        durationMinutes: duration as SlotDuration,
        label,
        dayKey: args.dayKey,
      });
    }
  }
  return slots;
}

export function slotDurationOptions(): SlotDuration[] {
  return DEFAULT_DURATIONS;
}

export function formatSlotRange(startAt: string, endAt: string) {
  try {
    const s = new Date(startAt);
    const e = new Date(endAt);
    const date = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const time = `${s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    return `${date} · ${time}`;
  } catch {
    return startAt;
  }
}

export { isoDayKey, parseDayKey };
