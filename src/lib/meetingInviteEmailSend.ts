/**
 * Send meeting invite emails via Finely Comms (`send-email` + commsDelivery flag).
 * Persists local invite receipts for admin/partner visibility.
 */
import type { Partner } from '../domain/partners';
import { getPartner, getPartnerSync } from '../data/partnersRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { sendEmail } from './commsDeliveryClient';
import {
  buildMeetingInviteEmail,
  buildMeetingIcs,
  type MeetingInviteEmailArgs,
} from '../comms/meetingInviteEmail';
import { addAuditEvent } from '../data/auditRepo';
import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';
import { getPublicSiteOrigin } from './funnelPublicLinks';

const KEY = 'finely.meeting_invites.v1';

export type MeetingInviteRecord = {
  id: string;
  partnerId: string;
  toEmail: string;
  title: string;
  joinUrl: string;
  startAt?: string;
  endAt?: string;
  hostName?: string;
  sentAt: string;
  emailOk: boolean;
  error?: string;
};

function listInvites(): MeetingInviteRecord[] {
  return loadJson<MeetingInviteRecord[]>(KEY, [], 1);
}

function saveInvite(row: MeetingInviteRecord) {
  const next = [row, ...listInvites()].slice(0, 200);
  saveJson(KEY, next, 1);
  try {
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: KEY } }));
  } catch {
    /* ignore */
  }
}

export function listMeetingInvitesByPartner(partnerId: string): MeetingInviteRecord[] {
  return listInvites().filter((r) => r.partnerId === partnerId);
}

export async function sendMeetingInviteEmail(args: {
  partnerId: string;
  partner?: Partner | null;
  /** Override recipient (applicant / guest). Defaults to partner profile email. */
  toEmail?: string;
  toName?: string;
  title: string;
  joinUrl: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  agenda?: string;
  hostName?: string;
  hostRoleLabel?: string;
  scheduleUrl?: string;
}): Promise<{ ok: boolean; error?: string; inviteId?: string; joinUrl?: string }> {
  if (!isFeatureEnabled('commsDelivery')) {
    return { ok: false, error: 'Turn on Comms Delivery (Feature Flags) to send meeting emails.' };
  }

  const partner =
    args.partner ?? getPartnerSync(args.partnerId) ?? (await getPartner(args.partnerId));
  const toEmail = (args.toEmail || partner?.profile.email || '').trim().toLowerCase();
  if (!toEmail || !toEmail.includes('@')) {
    return { ok: false, error: 'Partner (or recipient) email is missing.' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured — cannot send email.' };
  }

  const partnerName =
    args.toName || partner?.profile.fullName || partner?.profile.email || 'Partner';
  const origin = getPublicSiteOrigin();
  const scheduleUrl =
    args.scheduleUrl ||
    (partner ? `${origin}/portal/calendar` : `${origin}/enlightenment-session`);

  const contentArgs: MeetingInviteEmailArgs = {
    partnerName,
    hostName: args.hostName,
    hostRoleLabel: args.hostRoleLabel,
    title: args.title,
    startAt: args.startAt,
    endAt: args.endAt,
    timezone: args.timezone,
    agenda: args.agenda,
    joinUrl: args.joinUrl,
    scheduleUrl,
  };
  const content = buildMeetingInviteEmail(contentArgs);
  const ics = buildMeetingIcs({
    title: args.title,
    startAt: args.startAt,
    endAt: args.endAt,
    description: [args.agenda, `Join: ${args.joinUrl}`].filter(Boolean).join('\n'),
    location: args.joinUrl,
  });

  const inviteId = newId('minv');
  try {
    await sendEmail({
      toEmail,
      toName: partnerName,
      subject: content.subject,
      text: ics ? `${content.text}\n\n--- Calendar (ICS) ---\n${ics}` : content.text,
      html: content.html,
    });

    saveInvite({
      id: inviteId,
      partnerId: args.partnerId,
      toEmail,
      title: args.title,
      joinUrl: args.joinUrl,
      startAt: args.startAt,
      endAt: args.endAt,
      hostName: args.hostName,
      sentAt: new Date().toISOString(),
      emailOk: true,
    });

    try {
      addAuditEvent({
        actorType: 'admin',
        partnerId: args.partnerId,
        action: 'meeting.invite_email_sent',
        entityType: 'meeting_invite',
        entityId: inviteId,
        meta: { toEmail, joinUrl: args.joinUrl, startAt: args.startAt, title: args.title },
      });
    } catch {
      /* audit best-effort */
    }

    return { ok: true, inviteId, joinUrl: args.joinUrl };
  } catch (e: unknown) {
    const error = (e as Error)?.message || 'Meeting email failed.';
    saveInvite({
      id: inviteId,
      partnerId: args.partnerId,
      toEmail,
      title: args.title,
      joinUrl: args.joinUrl,
      startAt: args.startAt,
      endAt: args.endAt,
      hostName: args.hostName,
      sentAt: new Date().toISOString(),
      emailOk: false,
      error,
    });
    return { ok: false, error, inviteId };
  }
}
