import type { StaffShiftWindow } from '../features/staffCommandCenter/types';

function parseHhmm(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatHhmm12(hhmm: string): string {
  const mins = parseHhmm(hhmm);
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

function dayIncludedInShiftDays(day: number, daysText: string): boolean {
  const d = daysText.toLowerCase();
  if (!d || d.includes('mon-sun') || d.includes('daily')) return true;
  if (d.includes('mon-fri') && day >= 1 && day <= 5) return true;
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  return d.includes(keys[day]);
}

export function staffCommandShiftCrossesMidnight(shift: StaffShiftWindow): boolean {
  if (shift.crossesMidnight) return true;
  return parseHhmm(shift.endLocal) <= parseHhmm(shift.startLocal);
}

export function staffCommandShiftMatches(shift: StaffShiftWindow, date = new Date()): boolean {
  const day = date.getDay();
  const nowMins = date.getHours() * 60 + date.getMinutes();
  const start = parseHhmm(shift.startLocal);
  const end = parseHhmm(shift.endLocal);
  const daysText = shift.days || 'Mon-Sun';

  if (!staffCommandShiftCrossesMidnight(shift)) {
    if (!dayIncludedInShiftDays(day, daysText)) return false;
    return nowMins >= start && nowMins < end;
  }

  if (nowMins >= start && dayIncludedInShiftDays(day, daysText)) return true;
  if (nowMins < end) {
    const prev = (day + 6) % 7;
    return dayIncludedInShiftDays(prev, daysText);
  }
  return false;
}

export function formatStaffCommandShiftWindow(shift: StaffShiftWindow): string {
  const overnight = staffCommandShiftCrossesMidnight(shift);
  const range = overnight
    ? `Overnight ${formatHhmm12(shift.startLocal)} – ${formatHhmm12(shift.endLocal)}`
    : `${formatHhmm12(shift.startLocal)} – ${formatHhmm12(shift.endLocal)}`;
  const days = shift.days?.trim() || 'Mon–Sun';
  return `${shift.label} · ${days} · ${range} ET`;
}

export function staffCommandDutyStartedAt(shift: StaffShiftWindow, date = new Date()): Date | null {
  if (!staffCommandShiftMatches(shift, date)) return null;
  const nowMins = date.getHours() * 60 + date.getMinutes();
  const start = parseHhmm(shift.startLocal);
  const started = new Date(date);
  if (staffCommandShiftCrossesMidnight(shift) && nowMins < parseHhmm(shift.endLocal)) {
    started.setDate(started.getDate() - 1);
  }
  started.setHours(Math.floor(start / 60), start % 60, 0, 0);
  return started;
}

export function formatStaffCommandDutyLine(shift: StaffShiftWindow, date = new Date()): string | null {
  if (!staffCommandShiftMatches(shift, date)) {
    return `Off shift · ${formatStaffCommandShiftWindow(shift)}`;
  }
  const started = staffCommandDutyStartedAt(shift, date);
  if (!started) return formatStaffCommandShiftWindow(shift);
  const diffH = Math.max(0, Math.floor((date.getTime() - started.getTime()) / 3_600_000));
  const since =
    diffH < 18
      ? diffH < 1
        ? 'just started'
        : `${diffH} hr${diffH === 1 ? '' : 's'} into shift`
      : `since ${started.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  return `${formatStaffCommandShiftWindow(shift)} · ${since}`;
}
