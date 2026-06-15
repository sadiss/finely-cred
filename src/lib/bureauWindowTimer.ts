import type { TaskItem } from '../domain/tasks';

const FCRA_DAYS = 35;

/** Bureau reinvestigation countdown for dispute follow-up tasks. */
export function getBureauWindowTimer(task: TaskItem): { label: string; daysLeft: number; overdue: boolean } | null {
  const isBureau = (task.tags ?? []).some((t) => t.startsWith('bureau_timer') || t.includes('bureau'));
  if (!isBureau || !task.dueAt) return null;
  const ms = Date.parse(task.dueAt) - Date.now();
  const daysLeft = Math.ceil(ms / 86400000);
  return {
    label: `FCRA window · day ${FCRA_DAYS - Math.max(0, daysLeft)} of ~${FCRA_DAYS}`,
    daysLeft,
    overdue: daysLeft < 0,
  };
}
