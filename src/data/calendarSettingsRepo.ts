import type { CalendarBookingSettings, SlotDuration } from '../domain/calendar';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.calendar.settings.v1';

const DEFAULT_SETTINGS: CalendarBookingSettings = {
  startHour: 9,
  endHour: 18,
  slotIntervalMinutes: 30,
  minNoticeHours: 24,
  cutoffHourPreviousDay: 17,
  allowedWeekdays: [1, 2, 3, 4, 5],
  allowedDurations: [20, 30, 60, 90],
  defaultDuration: 30,
  meetingTypes: [
    { id: 'enlightenment', label: 'Strategy call', durationMinutes: 30, description: 'Free call — map your next steps.' },
    { id: 'file_review', label: 'File review', durationMinutes: 60, description: 'Reports, evidence, and dispute round.' },
    { id: 'quick_checkin', label: 'Quick check-in', durationMinutes: 20, description: 'Fast status call.' },
    { id: 'funding_strategy', label: 'Funding strategy', durationMinutes: 90, description: 'Business credit and capital plan.' },
  ],
  blockedWindows: [
    { id: 'mon-lunch', label: 'Team lunch', dayOfWeek: 1, startTime: '12:00', endTime: '13:00' },
    { id: 'tue-ops', label: 'Ops review', dayOfWeek: 2, startTime: '10:30', endTime: '12:00' },
    { id: 'wed-casework', label: 'Casework block', dayOfWeek: 3, startTime: '15:00', endTime: '17:00' },
    { id: 'fri-fulfillment', label: 'Fulfillment block', dayOfWeek: 5, startTime: '13:00', endTime: '15:00' },
  ],
};

function normalize(settings: Partial<CalendarBookingSettings> | null | undefined): CalendarBookingSettings {
  const allowedDurations = Array.isArray(settings?.allowedDurations) && settings!.allowedDurations.length
    ? settings!.allowedDurations
    : DEFAULT_SETTINGS.allowedDurations;
  const defaultDuration = allowedDurations.includes(settings?.defaultDuration as SlotDuration)
    ? (settings!.defaultDuration as SlotDuration)
    : allowedDurations[0] ?? DEFAULT_SETTINGS.defaultDuration;

  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
    startHour: Math.max(0, Math.min(23, Math.round(settings?.startHour ?? DEFAULT_SETTINGS.startHour))),
    endHour: Math.max(1, Math.min(24, Math.round(settings?.endHour ?? DEFAULT_SETTINGS.endHour))),
    slotIntervalMinutes: Math.max(10, Math.min(120, Math.round(settings?.slotIntervalMinutes ?? DEFAULT_SETTINGS.slotIntervalMinutes))),
    minNoticeHours: Math.max(0, Math.min(240, Math.round(settings?.minNoticeHours ?? DEFAULT_SETTINGS.minNoticeHours))),
    cutoffHourPreviousDay: Math.max(0, Math.min(23, Math.round(settings?.cutoffHourPreviousDay ?? DEFAULT_SETTINGS.cutoffHourPreviousDay))),
    allowedWeekdays: Array.isArray(settings?.allowedWeekdays) && settings!.allowedWeekdays.length
      ? settings!.allowedWeekdays.map((d) => Math.max(0, Math.min(6, Math.round(d)))).filter((d, i, arr) => arr.indexOf(d) === i)
      : DEFAULT_SETTINGS.allowedWeekdays,
    allowedDurations,
    defaultDuration,
    meetingTypes: Array.isArray(settings?.meetingTypes) && settings!.meetingTypes.length ? settings!.meetingTypes : DEFAULT_SETTINGS.meetingTypes,
    blockedWindows: Array.isArray(settings?.blockedWindows) ? settings!.blockedWindows : DEFAULT_SETTINGS.blockedWindows,
  };
}

export function getCalendarBookingSettings(): CalendarBookingSettings {
  return normalize(loadJson<Partial<CalendarBookingSettings>>(KEY, DEFAULT_SETTINGS, 1));
}

export function saveCalendarBookingSettings(settings: CalendarBookingSettings): CalendarBookingSettings {
  const next = normalize(settings);
  saveJson(KEY, next, 1);
  window.dispatchEvent(new Event('finely:store'));
  return next;
}

export function resetCalendarBookingSettings(): CalendarBookingSettings {
  saveJson(KEY, DEFAULT_SETTINGS, 1);
  window.dispatchEvent(new Event('finely:store'));
  return DEFAULT_SETTINGS;
}
