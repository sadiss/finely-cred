import type { AgentPersonaId } from './agentPersonas';

export type StaffDepartment =
  | 'credit_operations'
  | 'dispute_processing'
  | 'funding'
  | 'debt_resolution'
  | 'partner_success'
  | 'growth_sessions'
  | 'marketing'
  | 'internal_ops';

export type StaffShiftBlock = {
  days: number[];
  startHour: number;
  endHour: number;
};

/** Hard cap — no staff member stays on duty more than 8 hours in a calendar day. */
export const STAFF_MAX_SHIFT_HOURS_PER_DAY = 8;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** endHour <= startHour means the block crosses midnight (e.g. 22:00–06:00). */
export function isOvernightShiftBlock(block: StaffShiftBlock): boolean {
  return block.endHour <= block.startHour;
}

function overnightDurationHours(block: StaffShiftBlock): number {
  return 24 - block.startHour + block.endHour;
}

function clampOvernightBlock(block: StaffShiftBlock, maxHours: number): StaffShiftBlock {
  const duration = overnightDurationHours(block);
  const take = Math.min(duration, maxHours);
  const endHour = (block.startHour + take) % 24;
  return {
    days: [...block.days],
    startHour: block.startHour,
    endHour: endHour <= block.startHour ? endHour : endHour,
  };
}

export function shiftBlockMatches(block: StaffShiftBlock, date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  if (!isOvernightShiftBlock(block)) {
    return block.days.includes(day) && hour >= block.startHour && hour < block.endHour;
  }
  if (hour >= block.startHour && block.days.includes(day)) return true;
  if (hour < block.endHour) {
    const prevDay = (day + 6) % 7;
    if (block.days.includes(prevDay)) return true;
  }
  return false;
}

export function staffMemberOnShift(member: StaffMember, date = new Date()): boolean {
  return member.active && member.shiftBlocks.some((b) => shiftBlockMatches(b, date));
}

export function activeShiftBlockForMember(member: StaffMember, date: Date): StaffShiftBlock | null {
  return member.shiftBlocks.find((b) => shiftBlockMatches(b, date)) ?? null;
}

export function shiftDutyStartedAt(block: StaffShiftBlock, date: Date): Date | null {
  if (!shiftBlockMatches(block, date)) return null;
  const day = date.getDay();
  const hour = date.getHours();
  const started = new Date(date);
  if (isOvernightShiftBlock(block) && hour < block.endHour) {
    const prevDay = (day + 6) % 7;
    if (!block.days.includes(prevDay)) return null;
    started.setDate(started.getDate() - 1);
  }
  started.setHours(block.startHour, 0, 0, 0);
  return started;
}

function formatHour12(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12} ${suffix}`;
}

function formatShiftDays(days: number[]): string {
  if (!days.length) return '';
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Daily';
  if (sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d))) return 'Mon–Fri';
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return 'Sat–Sun';
  return sorted.map((d) => DAY_LABELS[d]).join(', ');
}

export function formatStaffShiftBlock(block: StaffShiftBlock): string {
  const days = formatShiftDays(block.days);
  if (isOvernightShiftBlock(block)) {
    return `${days} overnight ${formatHour12(block.startHour)}–${formatHour12(block.endHour)}`.trim();
  }
  return `${days} ${formatHour12(block.startHour)}–${formatHour12(block.endHour)}`.trim();
}

export function formatStaffShiftSchedule(blocks: StaffShiftBlock[]): string {
  if (!blocks.length) return '';
  const unique = new Map<string, StaffShiftBlock>();
  for (const b of blocks) {
    const key = `${b.days.join(',')}-${b.startHour}-${b.endHour}`;
    unique.set(key, b);
  }
  return [...unique.values()].map(formatStaffShiftBlock).join(' · ');
}

/**
 * Collapse overlapping blocks and truncate each day to at most `maxHours`.
 * Prevents stacked WEEKDAY+EVENING schedules from creating 10–13 hour duty stretches.
 */
export function clampStaffShiftBlocks(
  blocks: StaffShiftBlock[],
  maxHours: number = STAFF_MAX_SHIFT_HOURS_PER_DAY,
): StaffShiftBlock[] {
  if (!blocks.length || maxHours <= 0) return [];

  const overnightOut: StaffShiftBlock[] = [];
  const sameDayIn: StaffShiftBlock[] = [];
  for (const b of blocks) {
    if (isOvernightShiftBlock(b)) overnightOut.push(clampOvernightBlock(b, maxHours));
    else sameDayIn.push(b);
  }

  const perDay: StaffShiftBlock[] = [];
  for (let day = 0; day <= 6; day += 1) {
    const intervals = sameDayIn
      .filter((b) => b.days.includes(day))
      .map((b) => ({
        start: b.startHour,
        end: b.endHour,
      }))
      .filter((iv) => iv.end > iv.start)
      .sort((a, b) => a.start - b.start);

    if (!intervals.length) continue;

    const merged: Array<{ start: number; end: number }> = [];
    for (const iv of intervals) {
      const last = merged[merged.length - 1];
      if (!last || iv.start > last.end) merged.push({ ...iv });
      else last.end = Math.max(last.end, iv.end);
    }

    let budget = maxHours;
    for (const iv of merged) {
      if (budget <= 0) break;
      const take = Math.min(iv.end - iv.start, budget);
      if (take <= 0) continue;
      perDay.push({ days: [day], startHour: iv.start, endHour: iv.start + take });
      budget -= take;
    }
  }

  // Coalesce identical hour ranges across days into fewer blocks.
  const byRange = new Map<string, number[]>();
  for (const b of perDay) {
    const key = `${b.startHour}-${b.endHour}`;
    const days = byRange.get(key) ?? [];
    days.push(...b.days);
    byRange.set(key, [...new Set(days)].sort((a, c) => a - c));
  }
  const sameDayOut = [...byRange.entries()].map(([key, days]) => {
    const [startHour, endHour] = key.split('-').map(Number) as [number, number];
    return { days, startHour, endHour };
  });

  const mergedOvernight = new Map<string, StaffShiftBlock>();
  for (const b of overnightOut) {
    const key = `${b.days.join(',')}-${b.startHour}-${b.endHour}`;
    mergedOvernight.set(key, b);
  }
  return [...mergedOvernight.values(), ...sameDayOut];
}

export type PortraitGender = 'feminine' | 'masculine' | 'neutral';

export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  primaryRoleId: AgentPersonaId;
  department: StaffDepartment;
  displayTitle?: string;
  /** Legacy PNG path or custom URL — shared role PNGs are replaced by deterministic portraits. */
  avatarPath: string;
  /** Drives unique silhouette in generated portrait SVG. */
  portraitGender: PortraitGender;
  bioLine: string;
  shiftBlocks: StaffShiftBlock[];
  active: boolean;
};

export function staffMemberFullName(m: StaffMember): string {
  return `${m.firstName} ${m.lastName}`.trim();
}
