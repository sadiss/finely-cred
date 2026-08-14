import type { CalendarEvent, ConsultationTopic } from '../domain/calendar';
import { addDaysIso } from '../domain/cases';
import type { TaskKind } from '../domain/tasks';

/** Heuristic summary from raw meeting notes — no external AI required. */
export function summarizeMeetingNotes(notes: string): string {
  const lines = notes
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return '';

  const actionLines = lines.filter((l) =>
    /^[-*•\d.]/.test(l) ||
    /\b(action|follow|next|send|upload|schedule|call|review|draft|dispute|fund)\b/i.test(l),
  );
  const picked = (actionLines.length >= 2 ? actionLines : lines).slice(0, 4);
  const summary = picked.join(' · ');
  return summary.length > 320 ? `${summary.slice(0, 317)}…` : summary;
}

export function suggestMeetingNextSteps(args: {
  notes: string;
  topic?: ConsultationTopic;
  partnerName?: string;
  eventTitle?: string;
}): string[] {
  const chips: string[] = [];
  const n = `${args.notes} ${args.eventTitle ?? ''}`.toLowerCase();

  if (/\bupload|report|html|pdf|identityiq|myscoreiq\b/.test(n)) chips.push('Request credit report upload');
  if (/\bdispute|letter|bureau|equifax|experian|transunion\b/.test(n)) chips.push('Draft dispute letters');
  if (/\bdebt|summons|court|validation|collector\b/.test(n)) chips.push('Open debt validation lane');
  if (/\bfund|loan|credit card|line of credit\b/.test(n)) chips.push('Review funding readiness');
  if (/\bfollow.?up|call back|schedule|check.?in\b/.test(n)) chips.push('Schedule follow-up session');
  if (/\bidentity|fraud|theft|freeze\b/.test(n)) chips.push('Start identity theft checklist');
  if (/\btradeline|authorized user|au\b/.test(n)) chips.push('Review tradeline strategy');
  if (/\bonboard|welcome|portal|login\b/.test(n)) chips.push('Send portal onboarding link');

  if (args.topic === 'credit_restore' && !chips.some((c) => c.includes('dispute'))) {
    chips.push('Review dispute priorities');
  }
  if (args.topic === 'enlightenment') chips.push('Send session recap email');
  if (args.topic === 'debt_summons') chips.push('Pull summons into debt lane');
  if (args.topic === 'business_build') chips.push('Review business credit ladder');

  if (!chips.length && args.notes.trim()) {
    chips.push('Create follow-up task', 'Send session recap');
  }
  if (!chips.length) {
    chips.push('Add meeting notes', 'Mark session complete');
  }

  return [...new Set(chips)].slice(0, 6);
}

export function buildFollowUpTaskFromMeeting(args: {
  event: CalendarEvent;
  notes: string;
  summary?: string;
  nextStepLabel?: string;
}): {
  partnerId: string;
  title: string;
  kind: TaskKind;
  stage: 'intake';
  status: 'pending';
  dueAt: string;
  notes: string;
  assignedTo: 'admin';
  tags: string[];
} {
  const label = args.nextStepLabel?.trim();
  const title = label || `Follow up: ${args.event.title}`;
  const body = [args.summary?.trim(), args.notes.trim()].filter(Boolean).join('\n\n');
  return {
    partnerId: args.event.partnerId,
    title,
    kind: 'follow_up',
    stage: 'intake',
    status: 'pending',
    dueAt: addDaysIso(new Date().toISOString(), 3),
    notes: body || `Post-meeting follow-up for ${args.event.title}.`,
    assignedTo: 'admin',
    tags: ['calendar_os', `calendar_followup:${args.event.id}`, 'meeting_post_call'],
  };
}
