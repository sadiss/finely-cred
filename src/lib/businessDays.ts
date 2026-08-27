import { fetchUsHolidays } from './publicDataClient';

const holidayCache = new Map<number, Set<string>>();

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseStartIso(startIso: string): Date {
  const trimmed = startIso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(trimmed);
}

export async function loadUsHolidays(year: number): Promise<Set<string>> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const result = await fetchUsHolidays(year);
  const set = new Set<string>();
  if (result.ok && result.data) {
    for (const holiday of result.data) {
      if (holiday.date) set.add(holiday.date.slice(0, 10));
    }
  }
  holidayCache.set(year, set);
  return set;
}

function isHolidayOrWeekend(d: Date, holidays: Set<string>): boolean {
  if (isWeekend(d)) return true;
  if (holidays.size === 0) return false;
  return holidays.has(toYmd(d));
}

/** Sync calendar-day advance; returns yyyy-mm-dd. */
export function addCalendarDays(startIso: string, days: number): string {
  const d = parseStartIso(startIso);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

/**
 * Tex. R. Civ. P. 99(b): answer by 10:00 a.m. on the Monday next after
 * the expiration of twenty days after the date of service.
 */
export function addTexasAnswerMonday(startIso: string): string {
  const afterTwenty = parseStartIso(addCalendarDays(startIso, 20));
  do {
    afterTwenty.setDate(afterTwenty.getDate() + 1);
  } while (afterTwenty.getDay() !== 1);
  return toYmd(afterTwenty);
}

export type DeadlineDayKind = 'calendar' | 'business';

function addBusinessDaysWithHolidays(startIso: string, days: number, holidaysForYear: (year: number) => Set<string>): string {
  if (days === 0) return toYmd(parseStartIso(startIso));

  const step = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  const current = parseStartIso(startIso);

  while (remaining > 0) {
    current.setDate(current.getDate() + step);
    if (isHolidayOrWeekend(current, holidaysForYear(current.getFullYear()))) continue;
    remaining -= 1;
  }

  return toYmd(current);
}

function rollForwardClosedDay(iso: string, holidaysForYear: (year: number) => Set<string>): string {
  const current = parseStartIso(iso);
  let guard = 0;
  while (isHolidayOrWeekend(current, holidaysForYear(current.getFullYear())) && guard < 21) {
    current.setDate(current.getDate() + 1);
    guard += 1;
  }
  return toYmd(current);
}

/** Skip weekends only — used when holiday data is not loaded yet. */
export function addBusinessDaysWeekendOnly(startIso: string, days: number): string {
  const empty = new Set<string>();
  return addBusinessDaysWithHolidays(startIso, days, () => empty);
}

/** If the due date lands on a weekend, roll to the next weekday. */
export function rollForwardIfWeekend(iso: string): string {
  return rollForwardClosedDay(iso, () => new Set());
}

/**
 * Sync deadline math for task spawning and list views.
 * Business windows skip weekends; calendar windows roll off a weekend last day.
 * Holiday-aware math is in addDeadlineDays / rollForwardToOpenDay.
 */
export function addDeadlineDaysSync(startIso: string, days: number, kind: DeadlineDayKind = 'calendar'): string {
  if (kind === 'business') return addBusinessDaysWeekendOnly(startIso, days);
  return rollForwardIfWeekend(addCalendarDays(startIso, days));
}

/** Skip weekends and US federal holidays when available; weekend-only if holiday fetch fails. */
export async function addBusinessDays(startIso: string, days: number): Promise<string> {
  const yearHolidays = new Map<number, Set<string>>();
  const holidaysForYear = (year: number): Set<string> => {
    const cached = yearHolidays.get(year);
    if (cached) return cached;
    return new Set();
  };

  const start = parseStartIso(startIso);
  const years = new Set<number>([start.getFullYear(), start.getFullYear() + 1, start.getFullYear() - 1]);
  await Promise.all(
    [...years].map(async (year) => {
      yearHolidays.set(year, await loadUsHolidays(year));
    }),
  );

  return addBusinessDaysWithHolidays(startIso, days, holidaysForYear);
}

/** Roll a date forward until it is not a weekend or (when available) a US federal holiday. */
export async function rollForwardToOpenDay(iso: string): Promise<string> {
  const current = parseStartIso(iso);
  let guard = 0;
  while (guard < 21) {
    const holidays = await loadUsHolidays(current.getFullYear());
    if (!isHolidayOrWeekend(current, holidays)) break;
    current.setDate(current.getDate() + 1);
    guard += 1;
  }
  return toYmd(current);
}

/** Holiday-aware deadline: business days skip closed days; calendar days roll a closed last day forward. */
export async function addDeadlineDays(
  startIso: string,
  days: number,
  kind: DeadlineDayKind = 'calendar',
): Promise<string> {
  if (kind === 'business') return addBusinessDays(startIso, days);
  return rollForwardToOpenDay(addCalendarDays(startIso, days));
}

/** Whole calendar days from local today to a yyyy-mm-dd due date (negative if past). */
export function calendarDaysRemaining(dueYmd: string, from: Date = new Date()): number {
  const [y, m, d] = dueYmd.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return 0;
  const due = new Date(y, m - 1, d);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}
