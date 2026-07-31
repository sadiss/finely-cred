/**
 * Email partner on letter lifecycle events (generated, saved, ready_to_mail, mailed).
 * Reuses send-email / Resend via commsDeliveryClient. Respects notification prefs.
 */
import type { Partner } from '../domain/partners';
import { getPartner, getPartnerSync } from '../data/partnersRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { sendEmail } from './commsDeliveryClient';
import {
  buildLetterLifecycleNotifyEmail,
  type LetterLifecycleEvent,
} from '../comms/letterLifecycleNotifyEmail';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';
import { addAuditEvent } from '../data/auditRepo';
import { createNotification } from '../data/notificationsRepo';
import { isAdminEmail } from '../auth/admin';

export type { LetterLifecycleEvent };

export async function notifyLetterLifecycle(args: {
  partnerId: string;
  partner?: Partner | null;
  event: LetterLifecycleEvent;
  letterIds: string[];
  letterTitles: string[];
  /** Explicit admin/partner action: send email for this event. */
  emailPartner?: boolean;
  actorEmail?: string;
  actorRole?: 'partner' | 'admin';
}): Promise<{ sent: boolean; reason?: string; inApp: boolean }> {
  const partner =
    args.partner ??
    getPartnerSync(args.partnerId) ??
    (await getPartner(args.partnerId));
  if (!partner) return { sent: false, reason: 'partner_not_found', inApp: false };

  const prefs = getNotificationPrefs({ partnerId: partner.id });
  const lettersMuted = (prefs.mutedKinds ?? []).includes('letters');
  const lifecycleEnabled = prefs.emailLetterLifecycle !== false;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const vaultPath =
    args.actorRole === 'admin'
      ? `/admin/partners/${partner.id}?tab=letters`
      : '/portal/letters/vault';
  const vaultUrl = origin ? `${origin}${vaultPath}` : vaultPath;

  const titles = args.letterTitles.length ? args.letterTitles : ['Your letter'];
  const eventLabel =
    args.event === 'generated'
      ? 'Letter draft ready'
      : args.event === 'saved'
        ? 'Letter saved'
        : args.event === 'ready_to_mail'
          ? 'Letter ready to mail'
          : 'Letter mailed';

  createNotification({
    partnerId: partner.id,
    audience: 'partner',
    kind: 'letter_generated',
    title: eventLabel,
    body: titles.slice(0, 3).join(' · '),
    href: '/portal/letters/vault',
    meta: { event: args.event, letterIds: args.letterIds.join(',') },
  });

  // In-app always; email when explicitly requested OR lifecycle pref on (and not muted).
  const wantEmail =
    args.emailPartner === true || (args.emailPartner !== false && lifecycleEnabled && !lettersMuted);

  if (!wantEmail) {
    return { sent: false, reason: lettersMuted ? 'letters_muted' : 'email_skipped', inApp: true };
  }
  if (lettersMuted && args.emailPartner !== true) {
    return { sent: false, reason: 'letters_muted', inApp: true };
  }
  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured', inApp: true };
  }

  const toEmail = (partner.profile.email || '').trim();
  if (!toEmail) return { sent: false, reason: 'missing_email', inApp: true };

  const payload = buildLetterLifecycleNotifyEmail({
    partner,
    event: args.event,
    letterTitles: titles,
    vaultUrl,
    actorLabel: args.actorRole === 'admin' ? 'your Finely Cred team' : undefined,
  });

  try {
    await sendEmail({
      toEmail,
      toName: partner.profile.fullName,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    addAuditEvent({
      partnerId: partner.id,
      actorType: args.actorRole === 'admin' ? 'admin' : 'partner',
      actorEmail: args.actorEmail,
      action: `letter.${args.event}_email_sent`,
      entityType: 'letter',
      entityId: args.letterIds[0],
      meta: { letterIds: args.letterIds, event: args.event, toEmail },
    });

    // Admin actor copy when mailing/saving on behalf of partner
    const adminEmail = (args.actorEmail || '').trim().toLowerCase();
    if (
      args.actorRole === 'admin' &&
      adminEmail &&
      isAdminEmail(adminEmail) &&
      adminEmail !== toEmail.toLowerCase()
    ) {
      try {
        await sendEmail({
          toEmail: adminEmail,
          toName: 'Finely Cred Admin',
          subject: `[Admin copy] ${payload.subject}`,
          text: payload.text,
          html: payload.html,
        });
      } catch {
        /* non-blocking */
      }
    }

    return { sent: true, inApp: true };
  } catch (e: unknown) {
    return { sent: false, reason: (e as Error)?.message || 'send_failed', inApp: true };
  }
}
