import type { SupportThread, SupportTopic } from '../domain/support';
import type { AgentPersonaId } from '../domain/agentPersonas';
import { addDaysIso } from '../domain/cases';
import { listMessagesByThread } from '../data/supportRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { createTask, listTasksByPartner } from '../data/tasksRepo';

export const SUPPORT_SLA_HOURS = 4;

const TOPIC_PERSONA: Partial<Record<SupportTopic, AgentPersonaId>> = {
  disputes: 'dispute_coach',
  debt_summons: 'debt_strategist',
  business: 'funding_strategist',
  billing: 'support_specialist',
  au: 'sales_closer',
  affiliate_program: 'lead_converter',
  credit_specialist_program: 'sales_closer',
};

export function defaultPersonaForSupportTopic(topic: SupportTopic): AgentPersonaId {
  return TOPIC_PERSONA[topic] ?? 'support_specialist';
}

export function computeSupportSlaDue(createdAt: string): string {
  const ms = Date.parse(createdAt) + SUPPORT_SLA_HOURS * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

export type SupportSlaStatus = {
  tone: 'ok' | 'warning' | 'breached';
  label: string;
  hoursRemaining: number | null;
};

export function computeSupportSlaStatus(thread: SupportThread): SupportSlaStatus {
  if (thread.firstResponseAt || thread.status === 'resolved' || thread.status === 'closed') {
    return { tone: 'ok', label: 'Responded', hoursRemaining: null };
  }
  const dueMs = Date.parse(thread.slaDueAt ?? computeSupportSlaDue(thread.createdAt));
  const hoursRemaining = (dueMs - Date.now()) / (60 * 60 * 1000);
  if (hoursRemaining <= 0) {
    return { tone: 'breached', label: 'SLA breached', hoursRemaining: Math.floor(hoursRemaining) };
  }
  if (hoursRemaining <= 1) {
    return { tone: 'warning', label: `${Math.ceil(hoursRemaining * 60)}m left`, hoursRemaining };
  }
  return { tone: 'ok', label: `${Math.ceil(hoursRemaining)}h left`, hoursRemaining };
}

/** Call when staff sends first reply — records SLA + platform event. */
export function onSupportFirstTeamReply(args: {
  thread: SupportThread;
  partnerId: string;
}): void {
  const msgs = listMessagesByThread(args.thread.id);
  const teamReplies = msgs.filter((m) => !m.fromPartner);
  if (teamReplies.length !== 1) return;

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    entityType: 'support_thread',
    entityId: args.thread.id,
    payload: { kind: 'support_first_response', topic: args.thread.topic },
  });
}

/** Scan open threads for SLA breach; spawn admin tasks once. */
export function processSupportSlaTick(threads: SupportThread[]): { breaches: number; tasksCreated: number } {
  let breaches = 0;
  let tasksCreated = 0;

  for (const t of threads) {
    if (t.status === 'resolved' || t.status === 'closed' || t.firstResponseAt) continue;
    const sla = computeSupportSlaStatus(t);
    if (sla.tone !== 'breached') continue;
    breaches += 1;

    const tag = `support_sla:${t.id}`;
    const exists = listTasksByPartner(t.partnerId).some((x) => (x.tags ?? []).includes(tag));
    if (exists) continue;

    createTask({
      partnerId: t.partnerId,
      title: `SLA breach: support thread "${t.subject}"`,
      kind: 'follow_up',
      stage: 'intake',
      status: 'pending',
      priority: 'urgent',
      dueAt: addDaysIso(new Date().toISOString(), 0),
      notes: `No first response within ${SUPPORT_SLA_HOURS}h. Topic: ${t.topic}.`,
      assignedTo: 'both',
      tags: ['support_sla', tag],
    });
    tasksCreated += 1;
  }

  return { breaches, tasksCreated };
}
