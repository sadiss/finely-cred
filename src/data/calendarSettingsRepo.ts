import type { CalendarBookingSettings, SlotDuration } from '../domain/calendar';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.calendar.settings.v1';

const DEFAULT_SETTINGS: CalendarBookingSettings = {
  startHour: 9,
  endHour: 18,
  slotIntervalMinutes: 30,
  minNoticeHours: 24,
  minAdvanceDays: 3,
  cutoffHourPreviousDay: 17,
  allowedWeekdays: [1, 2, 3, 4, 5],
  allowedDurations: [15, 30, 60, 90],
  defaultDuration: 30,
  maxAdvanceDays: 30,
  meetingTypes: [
    { id: 'enlightenment', label: 'Strategy call', durationMinutes: 30, description: 'Free call — map your next steps.' },
    { id: 'file_review', label: 'File review', durationMinutes: 60, description: 'Reports, evidence, and dispute round.' },
    { id: 'quick_checkin', label: 'Quick check-in', durationMinutes: 15, description: 'Fast status call.' },
    { id: 'funding_strategy', label: 'Funding strategy', durationMinutes: 90, description: 'Business credit and capital plan.' },
  ],
  blockedWindows: [
    { id: 'mon-lunch', label: 'Team lunch', dayOfWeek: 1, startTime: '12:00', endTime: '13:00' },
    { id: 'tue-ops', label: 'Ops review', dayOfWeek: 2, startTime: '10:30', endTime: '12:00' },
    { id: 'wed-casework', label: 'Casework block', dayOfWeek: 3, startTime: '15:00', endTime: '17:00' },
    { id: 'fri-fulfillment', label: 'Fulfillment block', dayOfWeek: 5, startTime: '13:00', endTime: '15:00' },
  ],
  roundRobinEnabled: true,
  staffAssignees: [
    {
      id: 'host-alex',
      displayName: 'Alex Rivera',
      email: 'alex@finelycred.com',
      enabled: true,
      roleLabel: 'Appointment Setter',
      growthAgentId: 'appointment-setter',
      staffRosterId: 'staff-sam-ortiz',
      shiftBlocks: [{ days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 }],
      respectShiftSchedule: true,
      topics: ['enlightenment', 'credit_restore', 'other', 'billing'],
    },
    {
      id: 'host-caleb',
      displayName: 'Caleb Brooks',
      email: 'caleb@finelycred.com',
      enabled: true,
      roleLabel: 'Lead Discovery',
      growthAgentId: 'lead-discovery',
      staffRosterId: 'staff-cameron-blake',
      shiftBlocks: [{ days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 }],
      respectShiftSchedule: true,
      topics: ['enlightenment', 'funding_strategy', 'business_build', 'affiliate'],
    },
    {
      id: 'host-sanz',
      displayName: 'Sanz St. Louis',
      email: 'sanz@finelycred.com',
      enabled: true,
      roleLabel: 'Founder / Specialist',
      respectShiftSchedule: false,
    },
  ],
};

function coerceSlotDuration(value: unknown): SlotDuration | null {
  const n = Number(value);
  if (n === 20) return 15;
  if (n === 15 || n === 30 || n === 60 || n === 90) return n;
  return null;
}

function normalize(settings: Partial<CalendarBookingSettings> | null | undefined): CalendarBookingSettings {
  const rawDurations = Array.isArray(settings?.allowedDurations) && settings!.allowedDurations.length
    ? settings!.allowedDurations.map(coerceSlotDuration).filter((d): d is SlotDuration => d != null)
    : DEFAULT_SETTINGS.allowedDurations;
  const allowedDurations = rawDurations.length ? [...new Set(rawDurations)].sort((a, b) => a - b) : DEFAULT_SETTINGS.allowedDurations;
  const coercedDefault = coerceSlotDuration(settings?.defaultDuration);
  const defaultDuration = coercedDefault && allowedDurations.includes(coercedDefault)
    ? coercedDefault
    : allowedDurations.includes(DEFAULT_SETTINGS.defaultDuration)
      ? DEFAULT_SETTINGS.defaultDuration
      : allowedDurations[0] ?? DEFAULT_SETTINGS.defaultDuration;

  const meetingTypes = Array.isArray(settings?.meetingTypes) && settings!.meetingTypes.length
    ? settings!.meetingTypes.map((mt) => ({
        ...mt,
        durationMinutes: coerceSlotDuration(mt.durationMinutes) ?? DEFAULT_SETTINGS.defaultDuration,
      }))
    : DEFAULT_SETTINGS.meetingTypes;

  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
    startHour: Math.max(0, Math.min(23, Math.round(settings?.startHour ?? DEFAULT_SETTINGS.startHour))),
    endHour: Math.max(1, Math.min(24, Math.round(settings?.endHour ?? DEFAULT_SETTINGS.endHour))),
    slotIntervalMinutes: Math.max(10, Math.min(120, Math.round(settings?.slotIntervalMinutes ?? DEFAULT_SETTINGS.slotIntervalMinutes))),
    minNoticeHours: Math.max(0, Math.min(240, Math.round(settings?.minNoticeHours ?? DEFAULT_SETTINGS.minNoticeHours))),
    minAdvanceDays: Math.max(1, Math.min(30, Math.round(settings?.minAdvanceDays ?? DEFAULT_SETTINGS.minAdvanceDays))),
    cutoffHourPreviousDay: Math.max(0, Math.min(23, Math.round(settings?.cutoffHourPreviousDay ?? DEFAULT_SETTINGS.cutoffHourPreviousDay))),
    allowedWeekdays: Array.isArray(settings?.allowedWeekdays) && settings!.allowedWeekdays.length
      ? settings!.allowedWeekdays.map((d) => Math.max(0, Math.min(6, Math.round(d)))).filter((d, i, arr) => arr.indexOf(d) === i)
      : DEFAULT_SETTINGS.allowedWeekdays,
    allowedDurations,
    defaultDuration,
    maxAdvanceDays: Math.max(1, Math.min(365, Math.round(settings?.maxAdvanceDays ?? DEFAULT_SETTINGS.maxAdvanceDays))),
    meetingTypes,
    blockedWindows: Array.isArray(settings?.blockedWindows) ? settings!.blockedWindows : DEFAULT_SETTINGS.blockedWindows,
    roundRobinEnabled: Boolean(settings?.roundRobinEnabled),
    staffAssignees: Array.isArray(settings?.staffAssignees) && settings!.staffAssignees.length
      ? settings!.staffAssignees
      : DEFAULT_SETTINGS.staffAssignees,
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
