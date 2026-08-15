// Phase F1 — server-side meeting reminder sends (platform-cron step
// `meeting_reminders`). Reads confirmed calendar_events due within the
// reminder window and sends email/SMS reminders directly, independent of any
// admin/partner browser tab being open. Ports src/lib/meetingReminderAutomation.ts's
// logic server-side (Deno-compatible — no browser-only APIs), and adds a real
// suppression + quiet-hours check this client path never had.
import { checkSuppressionServerSide, isWithinQuietHoursServerSide } from './commsSuppressionCheck.ts';
import { sendServiceEmail } from './commsSendEmail.ts';
import { sendServiceSms } from './commsSendSms.ts';
import { logEdgeEvent } from './edgeGuard.ts';
import { enqueueRetry } from './sendRetryQueue.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

type CalendarEventRow = {
  id: string;
  partner_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  reminder_sent_at: string | null;
  sms_reminder_sent_at: string | null;
};

export type MeetingReminderProcessResult = {
  due: number;
  emailsSent: number;
  emailsSkipped: number;
  smsSent: number;
  smsSkipped: number;
  errors: string[];
};

function appBaseUrl(): string {
  return (Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_BASE_URL') || 'https://app.finelycred.com').replace(/\/+$/, '');
}

function extractEmailFromDescription(desc?: string | null): string | undefined {
  return desc?.match(/Email:\s*(\S+@\S+)/i)?.[1]?.trim();
}

function extractPhoneFromDescription(desc?: string | null): string | undefined {
  return desc?.match(/Phone:\s*([+\d()\-\s]{10,})/i)?.[1]?.trim();
}

/**
 * `partners` rows use the FINELY_TENANT_ID convention ('tenant_finely_primary'),
 * not the 'finely_cred' literal calendar_events/crm_ and comms_ tables use — see
 * crmServerSync.ts's header comment for this codebase's pre-existing
 * dual-tenant-id convention. Intentionally does not filter partners by
 * tenant_id (this deployment has exactly one real tenant either way; a
 * tenant_id filter here would silently zero out every lookup).
 */
async function resolveContact(
  admin: AdminClient,
  ev: CalendarEventRow,
): Promise<{ email?: string; phone?: string; fullName?: string }> {
  if (ev.partner_id.startsWith('public:')) {
    return {
      email: extractEmailFromDescription(ev.description),
      phone: extractPhoneFromDescription(ev.description),
      fullName: undefined,
    };
  }
  try {
    const { data } = await admin.from('partners').select('profile').eq('id', ev.partner_id).maybeSingle();
    const profile = (data?.profile ?? {}) as { email?: string; phone?: string; fullName?: string };
    return { email: profile.email, phone: profile.phone, fullName: profile.fullName };
  } catch {
    return {};
  }
}

/** Reads due confirmed calendar_events and sends reminder email/SMS server-side. */
export async function processDueMeetingReminders(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
  withinHours?: number;
}): Promise<MeetingReminderProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const withinHours = Math.max(1, args.withinHours ?? 24);
  const now = new Date();
  const nowMs = now.getTime();
  const cutoffIso = new Date(nowMs + withinHours * 3600_000).toISOString();

  const result: MeetingReminderProcessResult = { due: 0, emailsSent: 0, emailsSkipped: 0, smsSent: 0, smsSkipped: 0, errors: [] };

  const { data } = await args.admin
    .from('calendar_events')
    .select('id, partner_id, title, description, start_at, end_at, reminder_sent_at, sms_reminder_sent_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmed')
    .gte('start_at', now.toISOString())
    .lte('start_at', cutoffIso)
    .limit(50);

  const rows = (data ?? []) as CalendarEventRow[];
  const due = rows.filter((r) => !r.reminder_sent_at || !r.sms_reminder_sent_at);
  result.due = due.length;

  if (args.dryRun) return result;

  const quietHoursOk = isWithinQuietHoursServerSide(now);
  const joinBase = `${appBaseUrl()}/meet/`;

  for (const ev of due) {
    const contact = await resolveContact(args.admin, ev);
    const joinUrl = `${joinBase}${encodeURIComponent(ev.id)}`;
    const when = new Date(ev.start_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

    if (contact.email && !ev.reminder_sent_at) {
      try {
        const suppression = await checkSuppressionServerSide(args.admin, { email: contact.email, channel: 'email', tenantId });
        if (suppression.suppressed) {
          result.emailsSkipped += 1;
        } else if (!quietHoursOk) {
          result.emailsSkipped += 1;
        } else {
          const sent = await sendServiceEmail({
            toEmail: contact.email,
            toName: contact.fullName,
            subject: `Reminder: ${ev.title}`,
            text: `Hi ${contact.fullName || 'there'},\n\nYour session "${ev.title}" is coming up at ${when}.\n\nJoin here: ${joinUrl}\n\n— Finely Cred`,
          });
          if (sent.ok) {
            await args.admin.from('calendar_events').update({ reminder_sent_at: now.toISOString(), updated_at: now.toISOString() }).eq('id', ev.id);
            result.emailsSent += 1;
          } else {
            result.errors.push(sent.error || 'Reminder email failed');
            result.emailsSkipped += 1;
            await enqueueRetry({
              admin: args.admin,
              tenantId,
              channel: 'email',
              toEmail: contact.email,
              toName: contact.fullName,
              subject: `Reminder: ${ev.title}`,
              body: `Hi ${contact.fullName || 'there'},\n\nYour session "${ev.title}" is coming up at ${when}.\n\nJoin here: ${joinUrl}\n\n— Finely Cred`,
              sourceProcessor: 'meeting_reminders',
              referenceId: ev.id,
              error: sent.error || 'Reminder email failed',
            });
          }
        }
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : 'Reminder email failed');
        result.emailsSkipped += 1;
      }
    } else if (!ev.reminder_sent_at) {
      result.emailsSkipped += 1;
    }

    if (contact.phone && !ev.sms_reminder_sent_at) {
      try {
        const suppression = await checkSuppressionServerSide(args.admin, { phone: contact.phone, channel: 'sms', tenantId });
        if (suppression.suppressed) {
          result.smsSkipped += 1;
        } else if (!quietHoursOk) {
          result.smsSkipped += 1;
        } else {
          const sent = await sendServiceSms({
            to: contact.phone,
            body: `Finely Cred reminder: ${ev.title} at ${when}. Join: ${joinUrl}`,
          });
          if (sent.ok) {
            await args.admin.from('calendar_events').update({ sms_reminder_sent_at: now.toISOString(), updated_at: now.toISOString() }).eq('id', ev.id);
            result.smsSent += 1;
          } else {
            result.errors.push(sent.error || 'Reminder SMS failed');
            result.smsSkipped += 1;
            await enqueueRetry({
              admin: args.admin,
              tenantId,
              channel: 'sms',
              toPhone: contact.phone,
              body: `Finely Cred reminder: ${ev.title} at ${when}. Join: ${joinUrl}`,
              sourceProcessor: 'meeting_reminders',
              referenceId: ev.id,
              error: sent.error || 'Reminder SMS failed',
            });
          }
        }
      } catch (e) {
        result.errors.push(e instanceof Error ? e.message : 'Reminder SMS failed');
        result.smsSkipped += 1;
      }
    } else if (!ev.sms_reminder_sent_at) {
      result.smsSkipped += 1;
    }
  }

  if (due.length) {
    await logEdgeEvent({
      namespace: 'platform-cron',
      level: 'info',
      event: 'meeting_reminders_processed',
      meta: { due: due.length, emailsSent: result.emailsSent, smsSent: result.smsSent },
    });
  }

  return result;
}
