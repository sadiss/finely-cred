/**
 * Alex Rivera — appointment setter automation from warm CRM leads.
 * Creates self-book invite links + optional book-session email when Comms is on.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import type { CrmRecord } from '../../domain/crmRecords';
import { listLeadCaptures } from '../../data/leadsRepo';
import { scoreLead } from '../../lib/leadScoring';
import {
  buildBookingInvitePath,
  createBookingInvite,
  listBookingInvites,
} from '../../data/bookingInviteRepo';
import { sendMeetingInviteEmail } from '../../lib/meetingInviteEmailSend';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { createMarketingTask, findOpenMarketingTask } from '../marketingDesk/marketingDeskTasks';
import { crmRecordDisplayName } from '../../domain/crmRecords';
import { createNotification } from '../../data/notificationsRepo';
import {
  checkSuppression,
  isOverFrequencyCap,
  recordSendForFrequencyCap,
  resolveFrequencyCapKey,
} from '../../data/commsSuppressionRepo';
import { logAgentAction } from '../../lib/agentAuditLog';
import { isInternalStaffEmail } from '../../lib/meetingEmailGuards';
import { resolveOutreachHostForGrowthAgent } from '../../lib/calendarStaffRotation';

const AUTO_KEY = 'finely.alex.appointment_autopilot.v1';
const OUTREACH_KEY = 'finely.alex.outreach_sent.v1';
const ALEX_AGENT_ID = 'appointment-setter';

export type AlexOutreachRecord = {
  crmRecordId: string;
  inviteId: string;
  sentAt: string;
  emailOk?: boolean;
  error?: string;
};

export type AlexWarmLeadCandidate = {
  record: CrmRecord;
  score: number;
  reason: string;
};

export type AlexAppointmentRunResult = {
  scanned: number;
  warm: number;
  invitesCreated: number;
  emailsSent: number;
  tasksCreated: number;
  skipped: number;
  errors: string[];
};

const EXCLUDED_STAGES = new Set(['booked', 'converted', 'disqualified', 'lost', 'won', 'active_client']);

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

function isSameLocalDay(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    Number.isFinite(d.getTime()) &&
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export function isAlexAppointmentAutopilotEnabled(): boolean {
  const raw = loadJson<{ enabled?: boolean }>(AUTO_KEY, {}, 1);
  if (raw.enabled === undefined) return false;
  return Boolean(raw.enabled);
}

export function setAlexAppointmentAutopilotEnabled(enabled: boolean) {
  saveJson(AUTO_KEY, { enabled, updatedAt: new Date().toISOString() }, 1);
  dispatchStore();
}

function listOutreach(): AlexOutreachRecord[] {
  return loadJson<AlexOutreachRecord[]>(OUTREACH_KEY, [], 1);
}

function saveOutreach(row: AlexOutreachRecord) {
  const next = [row, ...listOutreach().filter((r) => r.crmRecordId !== row.crmRecordId)].slice(0, 400);
  saveJson(OUTREACH_KEY, next, 1);
  dispatchStore();
}

function alreadyOutreached(recordId: string): boolean {
  return listOutreach().some((r) => r.crmRecordId === recordId);
}

function resolveLeadScore(record: CrmRecord): number {
  if (typeof record.score === 'number') return record.score;
  if (record.sourceRef?.type === 'lead') {
    const lead = listLeadCaptures().find((l) => l.id === record.sourceRef!.id);
    if (lead) return scoreLead(lead).score;
  }
  if (record.stage === 'contacted') return 50;
  return 35;
}

/** Warm CRM leads eligible for book-session outreach */
export function listWarmLeadsForBooking(limit = 12): AlexWarmLeadCandidate[] {
  const rows = listCrmRecords()
    .filter((r) => {
      if (EXCLUDED_STAGES.has(r.stage)) return false;
      if (!r.contact.email?.includes('@')) return false;
      return true;
    })
    .map((record) => {
      const score = resolveLeadScore(record);
      const reason =
        score >= 70
          ? 'Hot score — book session'
          : record.stage === 'contacted'
            ? 'Contacted — nudge to calendar'
            : score >= 45
              ? 'Warm score — session fit'
              : '';
      return { record, score, reason };
    })
    .filter((c) => c.score >= 45 || c.record.stage === 'contacted')
    .sort((a, b) => b.score - a.score || b.record.updatedAt.localeCompare(a.record.updatedAt));

  return rows.slice(0, limit);
}

export async function runAlexAppointmentOutreach(args?: {
  limit?: number;
  force?: boolean;
}): Promise<AlexAppointmentRunResult> {
  const limit = Math.max(1, Math.min(20, args?.limit ?? 5));
  const candidates = listWarmLeadsForBooking(limit * 2);
  const result: AlexAppointmentRunResult = {
    scanned: candidates.length,
    warm: candidates.length,
    invitesCreated: 0,
    emailsSent: 0,
    tasksCreated: 0,
    skipped: 0,
    errors: [],
  };

  let processed = 0;
  const outreachHost = resolveOutreachHostForGrowthAgent(ALEX_AGENT_ID);
  for (const { record, reason } of candidates) {
    if (processed >= limit) break;
    if (!args?.force && alreadyOutreached(record.id)) {
      result.skipped++;
      continue;
    }

    const name = crmRecordDisplayName(record);
    const email = record.contact.email!.trim();
    if (isInternalStaffEmail(email)) {
      result.skipped++;
      continue;
    }
    const leadId = record.sourceRef?.type === 'lead' ? record.sourceRef.id : undefined;

    const existingInvite = listBookingInvites().find(
      (i) => i.status === 'active' && i.crmRecordId === record.id,
    );
    const invite =
      existingInvite ??
      createBookingInvite({
        label: `${outreachHost.displayName} — ${name}`,
        topic: 'enlightenment',
        durationMinutes: 30,
        crmRecordId: record.id,
        leadId,
        partnerId: record.partnerId,
        guestName: record.contact.fullName || name,
        guestEmail: email,
        guestPhone: record.contact.phone,
        maxUses: 2,
      });
    if (!existingInvite) result.invitesCreated++;

    const origin = getPublicSiteOrigin();
    const bookUrl = `${origin}${buildBookingInvitePath(invite.token)}`;
    let emailOk = false;

    const suppression = checkSuppression({ email, channel: 'email' });
    const frequencyCapKey = await resolveFrequencyCapKey({ email, crmRecordId: record.id });
    const overCap = isOverFrequencyCap(frequencyCapKey);
    if (isFeatureEnabled('commsDelivery') && suppression.suppressed) {
      logAgentAction({
        agentId: ALEX_AGENT_ID,
        action: 'outreach.suppressed',
        entityType: 'crm_record',
        entityId: record.id,
        reasoning: `Suppressed: ${suppression.reason}`,
      });
    } else if (isFeatureEnabled('commsDelivery') && overCap) {
      result.errors.push(`${email} skipped — already contacted within frequency window`);
    } else if (isFeatureEnabled('commsDelivery')) {
      try {
        const res = await sendMeetingInviteEmail({
          partnerId: record.partnerId || 'admin_growth',
          toEmail: email,
          toName: record.contact.fullName || name,
          title: 'Book your free strategy call',
          joinUrl: bookUrl,
          hostName: outreachHost.displayName,
          hostRoleLabel: outreachHost.roleLabel ?? 'Appointment Setter',
          agenda: `${reason}. Pick a time that works — audio-first video room included.`,
          scheduleUrl: bookUrl,
          intent: 'outreach',
        });
        emailOk = res.ok;
        if (res.ok) {
          result.emailsSent++;
          recordSendForFrequencyCap(frequencyCapKey);
          logAgentAction({
            agentId: ALEX_AGENT_ID,
            action: 'outreach.sent',
            entityType: 'crm_record',
            entityId: record.id,
            reasoning: reason,
          });
        } else result.errors.push(res.error || `Email failed for ${email}`);
      } catch (e: unknown) {
        result.errors.push((e as Error)?.message || `Email failed for ${email}`);
      }
    }

    saveOutreach({
      crmRecordId: record.id,
      inviteId: invite.id,
      sentAt: new Date().toISOString(),
      emailOk,
    });

    const openTask = findOpenMarketingTask({
      kind: 'book',
      recordId: record.id,
    });
    const hasAlexTask = openTask && (openTask.tags ?? []).includes('alex-appointment');
    if (!hasAlexTask) {
      createMarketingTask({
        kind: 'book',
        title: `${outreachHost.displayName} — book session nudge — ${name}`,
        notes: [
          reason,
          `Self-book: ${bookUrl}`,
          emailOk ? 'Invite email sent.' : 'Email skipped or failed — copy link manually.',
          `/admin/crm?record=${record.id}`,
        ].join('\n'),
        recordId: record.id,
        leadId,
        href: `/admin/crm?record=${record.id}`,
        tags: ['alex-appointment', 'persona:appointment_setter'],
        priority: 'high',
        dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        meta: { inviteId: invite.id, bookUrl },
      });
      result.tasksCreated++;
    }

    processed++;
  }

  if (processed > 0) {
    try {
      createNotification({
        partnerId: 'admin',
        audience: 'admin',
        kind: 'task_created',
        title: 'Alex — warm lead outreach',
        body: `${processed} invite(s) · ${result.emailsSent} email(s)`,
        href: '/admin/growth-agents/appointment-setter',
        meta: { processed, emailsSent: result.emailsSent },
      });
    } catch {
      /* non-blocking */
    }
  }

  return result;
}

/** Daily tick when autopilot on — once per local day */
export async function runAlexAppointmentAutopilotIfDue(): Promise<AlexAppointmentRunResult | null> {
  if (!isAlexAppointmentAutopilotEnabled()) return null;
  const state = loadJson<{ lastRunAt?: string }>(AUTO_KEY, {}, 1);
  if (state.lastRunAt && isSameLocalDay(state.lastRunAt)) return null;

  const result = await runAlexAppointmentOutreach({ limit: 5 });
  saveJson(AUTO_KEY, { ...state, enabled: true, lastRunAt: new Date().toISOString() }, 1);
  dispatchStore();
  return result;
}

export function countAlexOutreachToday(): number {
  const today = new Date().toDateString();
  return listOutreach().filter((r) => new Date(r.sentAt).toDateString() === today).length;
}

export function listAlexOutreachRecent(limit = 8): AlexOutreachRecord[] {
  return listOutreach().slice(0, limit);
}
