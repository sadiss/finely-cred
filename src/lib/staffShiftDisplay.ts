import type { StaffMember, StaffShiftBlock } from '../domain/staffMember';
import {
  activeShiftBlockForMember,
  formatStaffShiftBlock,
  formatStaffShiftSchedule,
  shiftDutyStartedAt,
  staffMemberOnShift,
} from '../domain/staffMember';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatDutySince(started: Date, now: Date): string {
  const diffMs = now.getTime() - started.getTime();
  if (diffMs < 0) return '';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 90) return `On floor ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `On floor ${hours} hr${hours === 1 ? '' : 's'}`;
  return `On floor since ${started.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
}

export function formatPartnerStaffShiftSummary(member: StaffMember, date = new Date()): {
  onShift: boolean;
  scheduleLabel: string;
  dutyLine: string | null;
} {
  const onShift = staffMemberOnShift(member, date);
  const scheduleLabel = formatStaffShiftSchedule(member.shiftBlocks);
  if (!onShift) {
    return {
      onShift: false,
      scheduleLabel,
      dutyLine: scheduleLabel ? `Scheduled ${scheduleLabel}` : null,
    };
  }
  const block = activeShiftBlockForMember(member, date);
  const started = block ? shiftDutyStartedAt(block, date) : null;
  const blockLabel = block ? formatStaffShiftBlock(block) : scheduleLabel;
  const dutyLine = started ? `${blockLabel} · ${formatDutySince(started, date)}` : blockLabel;
  return { onShift: true, scheduleLabel, dutyLine };
}

export function formatStaffShiftDayRange(days: number[]): string {
  if (!days.length) return '—';
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Daily';
  const weekdays = [1, 2, 3, 4, 5];
  if (sorted.length === 5 && weekdays.every((d) => sorted.includes(d))) return 'Mon–Fri';
  const weekend = [0, 6];
  if (sorted.length === 2 && weekend.every((d) => sorted.includes(d))) return 'Sat–Sun';
  return sorted.map((d) => DAY_LABELS[d]).join(', ');
}

export { formatStaffShiftBlock, formatStaffShiftSchedule };
