/**
 * Alex Rivera — No-Show & Reschedule Recovery sub-agent (Phase 3, new capability).
 *
 * A genuine gap before this: no-show handling did not exist anywhere in the
 * codebase — `CalendarEventStatus` had no `no_show` value and nothing detected a
 * confirmed session that passed without completion. This sub-agent has a
 * distinct trigger (session end time passed + still 'confirmed'), a distinct
 * tone (recovery, not the initial cold-outreach copy), and its own
 * `actorType: 'agent'` attribution separate from Alex's outreach loop.
 */
import { listCalendarEvents, setEventStatus } from '../../../data/calendarRepo';
import type { CalendarEvent } from '../../../domain/calendar';
import {
  buildBookingInvitePath,
  createBookingInvite,
} from '../../../data/bookingInviteRepo';
import { sendMeetingInviteEmail } from '../../../lib/meetingInviteEmailSend';
import { getPublicSiteOrigin } from '../../../lib/funnelPublicLinks';
import { isFeatureEnabled } from '../../../data/settingsRepo';
import { getPartnerSync } from '../../../data/partnersRepo';
import { isInternalStaffEmail } from '../../../lib/meetingEmailGuards';
import { checkSuppression, isOverFrequencyCap, recordSendForFrequencyCap, resolveFrequencyCapKey } from '../../../data/commsSuppressionRepo';
import { logAgentAction } from '../../../lib/agentAuditLog';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { loadJson, saveJson } from '../../../data/localJsonStore';

const RECOVERED_KEY = 'finely.alex.noshow_recovery_sent.v1';
const AGENT_ID = 'appointment-setter.no_show_recovery';
const GRACE_MINUTES = 20;

type RecoveredLog = { eventId: string; sentAt: string }[];

function loadRecovered(): RecoveredLog {
  return loadJson<RecoveredLog>(RECOVERED_KEY, [], 1);
}

function markRecovered(eventId: string) {
  const rows = [{ eventId, sentAt: new Date().toISOString() }, ...loadRecovered()].slice(0, 500);
  saveJson(RECOVERED_KEY, rows, 1);
}

function alreadyRecovered(eventId: string): boolean {
  return loadRecovered().some((r) => r.eventId === eventId);
}

/** Confirmed sessions whose end time passed the grace window without being marked completed. */
function detectLikelyNoShows(now = new Date()): CalendarEvent[] {
  const cutoff = now.getTime() - GRACE_MINUTES * 60_000;
  return listCalendarEvents().filter((ev) => {
    if (ev.status !== 'confirmed') return false;
    const endMs = Date.parse(ev.endAt);
    return Number.isFinite(endMs) && endMs < cutoff;
  });
}

export type NoShowRecoveryResult = {
  detected: number;
  recovered: number;
  emailsSent: number;
  errors: string[];
};

/** Run the recovery sweep — call from the shared autopilot tick alongside Alex's outreach loop. */
export async function runAlexNoShowRecoverySweep(): Promise<NoShowRecoveryResult> {
  const result: NoShowRecoveryResult = { detected: 0, recovered: 0, emailsSent: 0, errors: [] };
  const likely = detectLikelyNoShows();
  result.detected = likely.length;

  for (const ev of likely) {
    if (alreadyRecovered(ev.id)) continue;
    setEventStatus(ev.id, 'no_show');

    // Best-effort — the CRM email for this partner may be reachable via partnerId lookups elsewhere;
    // recovery here focuses on creating a visible, attributed task + reschedule invite rather than
    // guessing at a contact channel this module cannot confirm belongs to a real inbox.
    const invite = createBookingInvite({
      label: `Reschedule — ${ev.title}`,
      topic: ev.type === 'consultation' ? 'enlightenment' : 'other',
      durationMinutes: ev.slotDurationMinutes ?? 30,
      partnerId: ev.partnerId,
      maxUses: 2,
    });
    const origin = getPublicSiteOrigin();
    const rebookUrl = `${origin}${buildBookingInvitePath(invite.token)}`;

    let emailOk = false;
    const partner = ev.partnerId && !ev.partnerId.startsWith('public:') ? getPartnerSync(ev.partnerId) : null;
    const recoveryEmail = partner?.profile.email?.trim();
    if (isFeatureEnabled('commsDelivery') && recoveryEmail && !isInternalStaffEmail(recoveryEmail)) {
      try {
        const suppression = checkSuppression({ email: recoveryEmail, channel: 'email' });
        const frequencyCapKey = await resolveFrequencyCapKey({ email: recoveryEmail, crmRecordId: ev.partnerId });
        if (!suppression.suppressed && !isOverFrequencyCap(frequencyCapKey, 48, 1)) {
          const res = await sendMeetingInviteEmail({
            partnerId: ev.partnerId,
            toEmail: recoveryEmail,
            toName: partner?.profile.fullName,
            title: `We missed you — let's reschedule "${ev.title}"`,
            joinUrl: rebookUrl,
            hostName: 'Alex Rivera',
            hostRoleLabel: 'Appointment Setter',
            agenda: 'No pressure — pick a new time that works better. Link below.',
            scheduleUrl: rebookUrl,
            intent: 'outreach',
          });
          emailOk = res.ok;
          if (res.ok) {
            result.emailsSent += 1;
            recordSendForFrequencyCap(frequencyCapKey);
          }
        }
      } catch (e) {
        result.errors.push((e as Error)?.message || 'Recovery email failed');
      }
    }

    const openTask = findOpenMarketingTask({ kind: 'book', recordId: ev.id });
    if (!openTask) {
      createMarketingTask({
        kind: 'book',
        title: `No-show recovery — ${ev.title}`,
        notes: [
          `Missed session at ${new Date(ev.startAt).toLocaleString()}.`,
          `Reschedule link: ${rebookUrl}`,
          emailOk ? 'Recovery email sent.' : 'Email not sent automatically — reach out manually.',
        ].join('\n'),
        recordId: ev.id,
        href: '/admin/calendar',
        tags: ['alex-no-show-recovery', 'persona:appointment_setter'],
        priority: 'high',
        dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        meta: { eventId: ev.id, rebookUrl },
      });
    }

    logAgentAction({
      agentId: AGENT_ID,
      action: 'no_show.recovery_initiated',
      entityType: 'calendar_event',
      entityId: ev.id,
      reasoning: `Session "${ev.title}" ended ${GRACE_MINUTES}+ min ago without completion — flagged no-show, reschedule invite created.`,
      meta: { emailOk, rebookUrl },
    });

    markRecovered(ev.id);
    result.recovered += 1;
  }

  return result;
}
