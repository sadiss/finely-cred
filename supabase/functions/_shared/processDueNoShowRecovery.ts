// Phase F1 — server-side no-show detection + recovery (platform-cron step
// `no_show_recovery`). Ports src/features/growthAgents/subagents/alexNoShowRecovery.ts's
// detectLikelyNoShows() (20-minute grace window) server-side so a confirmed
// session that ends without being marked completed is flagged and a
// reschedule invite is sent purely from a server tick — no client page load
// required. Deno-compatible — no browser-only APIs.
import { checkSuppressionServerSide, isWithinQuietHoursServerSide } from './commsSuppressionCheck.ts';
import { sendServiceEmail } from './commsSendEmail.ts';
import { logEdgeEvent } from './edgeGuard.ts';
import { enqueueRetry } from './sendRetryQueue.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

type CalendarEventRow = {
  id: string;
  partner_id: string;
  type: string;
  title: string;
  description: string | null;
  end_at: string;
  slot_duration_minutes: number | null;
};

export type NoShowRecoveryProcessResult = {
  detected: number;
  recovered: number;
  emailsSent: number;
  errors: string[];
};

const GRACE_MINUTES = 20;

function appBaseUrl(): string {
  return (Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_BASE_URL') || 'https://app.finelycred.com').replace(/\/+$/, '');
}

function extractEmailFromDescription(desc?: string | null): string | undefined {
  return desc?.match(/Email:\s*(\S+@\S+)/i)?.[1]?.trim();
}

function tokenFromId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

async function resolveEmail(admin: AdminClient, ev: CalendarEventRow): Promise<string | undefined> {
  if (ev.partner_id.startsWith('public:')) return extractEmailFromDescription(ev.description);
  try {
    const { data } = await admin.from('partners').select('profile').eq('id', ev.partner_id).maybeSingle();
    return (data?.profile as { email?: string } | null)?.email;
  } catch {
    return undefined;
  }
}

/** Creates a real booking_invites row server-side and returns its public reschedule URL. */
async function createServerBookingInvite(
  admin: AdminClient,
  args: { label: string; topic: string; durationMinutes: number; partnerId: string; tenantId: string },
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const id = `binv_srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const token = tokenFromId(id);
  const now = new Date().toISOString();
  try {
    const { error } = await admin.from('booking_invites').insert({
      id,
      tenant_id: args.tenantId,
      token,
      label: args.label,
      topic: args.topic,
      duration_minutes: args.durationMinutes,
      partner_id: args.partnerId,
      max_uses: 2,
      use_count: 0,
      status: 'active',
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, url: `${appBaseUrl()}/book/i/${encodeURIComponent(token)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Booking invite insert failed' };
  }
}

/** Best-effort admin follow-up task — real public.work_tasks row, mirrors executeAutomationAction.ts's create_task shape. */
async function createFollowUpTask(admin: AdminClient, args: { partnerId: string; title: string; notes: string; tenantId: string }): Promise<void> {
  try {
    const id = `task_srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    await admin.from('work_tasks').insert({
      id,
      tenant_id: args.tenantId,
      partner_id: args.partnerId,
      title: args.title,
      kind: 'follow_up',
      priority: 'high',
      status: 'pending',
      due_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
      notes: args.notes,
      tags: ['alex-no-show-recovery', 'platform-cron'],
      assigned_to: 'admin',
      visibility: 'partner',
      task: {
        id,
        partnerId: args.partnerId,
        title: args.title,
        kind: 'follow_up',
        stage: 'intake',
        priority: 'high',
        status: 'pending',
        notes: args.notes,
        tags: ['alex-no-show-recovery', 'platform-cron'],
        assignedTo: 'admin',
        visibility: 'partner',
        aiGenerated: true,
      },
      created_at: now,
      updated_at: now,
    });
  } catch {
    // best-effort — the no-show flag + reschedule invite are the load-bearing part
  }
}

export async function processDueNoShowRecovery(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
}): Promise<NoShowRecoveryProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const now = new Date();
  const cutoffIso = new Date(now.getTime() - GRACE_MINUTES * 60_000).toISOString();

  const result: NoShowRecoveryProcessResult = { detected: 0, recovered: 0, emailsSent: 0, errors: [] };

  const { data } = await args.admin
    .from('calendar_events')
    .select('id, partner_id, type, title, description, end_at, slot_duration_minutes')
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmed')
    .lte('end_at', cutoffIso)
    .limit(50);

  const likely = (data ?? []) as CalendarEventRow[];
  result.detected = likely.length;

  if (args.dryRun || !likely.length) return result;

  const quietHoursOk = isWithinQuietHoursServerSide(now);

  for (const ev of likely) {
    try {
      await args.admin
        .from('calendar_events')
        .update({ status: 'no_show', no_show_recovery_sent_at: now.toISOString(), updated_at: now.toISOString() })
        .eq('id', ev.id);

      const invite = await createServerBookingInvite(args.admin, {
        label: `Reschedule — ${ev.title}`,
        topic: ev.type === 'consultation' ? 'enlightenment' : 'other',
        durationMinutes: ev.slot_duration_minutes ?? 30,
        partnerId: ev.partner_id,
        tenantId,
      });

      let emailOk = false;
      const email = await resolveEmail(args.admin, ev);
      if (email && invite.ok && invite.url) {
        const suppression = await checkSuppressionServerSide(args.admin, { email, channel: 'email', tenantId });
        if (!suppression.suppressed && quietHoursOk) {
          const recoveryBody = `Hi there,\n\nNo pressure — pick a new time that works better here: ${invite.url}\n\n— Finely Cred`;
          const sent = await sendServiceEmail({
            toEmail: email,
            subject: `We missed you — let's reschedule "${ev.title}"`,
            text: recoveryBody,
          });
          emailOk = sent.ok;
          if (sent.ok) {
            result.emailsSent += 1;
          } else {
            result.errors.push(sent.error || 'Recovery email failed');
            await enqueueRetry({
              admin: args.admin,
              tenantId,
              channel: 'email',
              toEmail: email,
              subject: `We missed you — let's reschedule "${ev.title}"`,
              body: recoveryBody,
              sourceProcessor: 'no_show_recovery',
              referenceId: ev.id,
              error: sent.error || 'Recovery email failed',
            });
          }
        }
      }

      await createFollowUpTask(args.admin, {
        partnerId: ev.partner_id,
        title: `No-show recovery — ${ev.title}`,
        notes: [
          `Missed session ended ${new Date(ev.end_at).toLocaleString()}.`,
          invite.url ? `Reschedule link: ${invite.url}` : 'Reschedule link could not be created.',
          emailOk ? 'Recovery email sent.' : 'Email not sent automatically — reach out manually.',
        ].join('\n'),
        tenantId,
      });

      result.recovered += 1;
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : 'No-show recovery failed');
    }
  }

  await logEdgeEvent({
    namespace: 'platform-cron',
    level: 'info',
    event: 'no_show_recovery_processed',
    meta: { detected: result.detected, recovered: result.recovered, emailsSent: result.emailsSent },
  });

  return result;
}
