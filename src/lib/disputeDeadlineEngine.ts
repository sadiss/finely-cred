/**
 * When a mailed dispute response window expires, spawn a Work OS task.
 * Uses businessDays calendar roll-forward (FCRA-style windows are calendar days).
 */

import type { DisputeCase } from '../domain/cases';
import { getLatestCaseRound, inferRoundStatus, INTER_ROUND_GUIDANCE } from '../domain/disputeWorkflow';
import { listCases, listCasesByPartner } from '../data/casesRepo';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { addDeadlineDaysSync, calendarDaysRemaining } from './businessDays';

function deadlineTag(caseId: string, round: string): string {
  return `dispute_deadline:${caseId}:${round}`;
}

function hasOpenDeadlineTask(partnerId: string, caseId: string, round: string): boolean {
  const tag = deadlineTag(caseId, round);
  return listTasksByPartner(partnerId).some(
    (task) =>
      (task.tags ?? []).includes(tag) && task.status !== 'completed' && task.status !== 'cancelled',
  );
}

function resolveWindowDueYmd(disputeCase: DisputeCase): string | null {
  const latest = getLatestCaseRound(disputeCase);
  if (!latest) return null;
  const status = inferRoundStatus(latest);
  if (status !== 'mailed' && status !== 'awaiting_response') return null;
  if (latest.dueAt) return latest.dueAt.slice(0, 10);
  const windowDays = INTER_ROUND_GUIDANCE[latest.round]?.typicalWindowDays ?? 30;
  const anchor = latest.mailedAt ?? latest.createdAt;
  return addDeadlineDaysSync(anchor, windowDays, 'calendar');
}

export function syncDisputeDeadlinePassedTasks(partnerId?: string): number {
  const cases = partnerId ? listCasesByPartner(partnerId) : listCases();
  let created = 0;

  for (const disputeCase of cases) {
    if (disputeCase.status !== 'open') continue;
    const latest = getLatestCaseRound(disputeCase);
    if (!latest) continue;
    const dueYmd = resolveWindowDueYmd(disputeCase);
    if (!dueYmd) continue;
    if (calendarDaysRemaining(dueYmd) > 0) continue;
    if (hasOpenDeadlineTask(disputeCase.partnerId, disputeCase.id, latest.round)) continue;

    createTask({
      partnerId: disputeCase.partnerId,
      title: `Response window passed: "${disputeCase.title}" (${latest.round})`,
      kind: 'follow_up',
      stage: 'disputes',
      status: 'pending',
      priority: 'urgent',
      dueAt: `${dueYmd}T12:00:00.000Z`,
      relatedCaseId: disputeCase.id,
      assignedTo: 'partner',
      notes: `${latest.round} bureau window has passed. Upload the bureau reply, log the outcome, or start the next round with the carried-forward factual findings. Educational only — not legal advice.`,
      tags: [
        'deadline_passed',
        'dispute_os',
        deadlineTag(disputeCase.id, latest.round),
        `bureau:${disputeCase.bureau}`,
      ],
    });
    created += 1;
  }

  return created;
}
