/** Email delivery for admin notification digests (Phase 33). */
import { listAdminEmailRecipients } from '../auth/admin';
import { addCommsSend, getCommsTemplate, hasRecentCommsSend } from '../data/commsRepo';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';
import { listPartners } from '../data/partnersRepo';
import { newId } from '../utils/ids';
import { renderTextTemplate } from '../utils/textTemplate';
import { isFeatureEnabled } from '../data/settingsRepo';
import { sendEmail } from './commsDeliveryClient';
import { sendEmailFromTemplate } from './commsEngine';
import { buildNotificationDigest, formatDigestSummary, type NotificationDigest } from './notificationDigestEngine';

function nowIso() {
  return new Date().toISOString();
}

export async function sendAdminDigestEmail(args: {
  digest: NotificationDigest;
  dryRun?: boolean;
}): Promise<{ sent: number; skipped: number }> {
  const dryRun = args.dryRun ?? !isFeatureEnabled('commsDelivery');
  const tpl = getCommsTemplate('admin_daily_digest');
  const summary = formatDigestSummary(args.digest);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ctx = {
    digestSummary: summary,
    unread: String(args.digest.unread),
    total: String(args.digest.total),
    adminNotificationsUrl: `${origin}/admin/notifications`,
  };
  const subject = tpl?.subjectTemplate
    ? renderTextTemplate(tpl.subjectTemplate, ctx)
    : `Finely admin digest — ${args.digest.unread} unread`;
  const body = tpl?.bodyTemplate ? renderTextTemplate(tpl.bodyTemplate, ctx) : summary;

  const recipients = listAdminEmailRecipients();
  if (!recipients.length) return { sent: 0, skipped: 1 };

  let sent = 0;
  let skipped = 0;

  for (const toEmail of recipients) {
    const logBase = {
      id: newId('send'),
      templateId: tpl?.id ?? 'admin_daily_digest',
      channel: 'email' as const,
      to: toEmail,
      createdAt: nowIso(),
      subject,
      body,
      meta: { digest: 'daily', audience: 'admin' },
    };

    if (dryRun) {
      addCommsSend({ ...logBase, status: 'dry_run' });
      sent += 1;
      continue;
    }

    try {
      await sendEmail({ toEmail, subject, text: body });
      addCommsSend({ ...logBase, status: 'sent' });
      sent += 1;
    } catch {
      addCommsSend({ ...logBase, status: 'error', error: 'Admin digest email failed' });
      skipped += 1;
    }
  }

  return { sent, skipped };
}

export async function sendPartnerDigestEmails(args?: {
  dryRun?: boolean;
  maxPartners?: number;
}): Promise<{ sent: number; skipped: number }> {
  const dryRun = args?.dryRun ?? !isFeatureEnabled('commsDelivery');
  const tpl = getCommsTemplate('partner_daily_digest');
  if (!tpl?.enabled) return { sent: 0, skipped: 1 };

  const partners = await listPartners();
  const max = args?.maxPartners ?? 100;
  let sent = 0;
  let skipped = 0;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  for (const partner of partners.slice(0, max)) {
    const prefs = getNotificationPrefs({ partnerId: partner.id });
    if (!prefs.emailDigest) {
      skipped += 1;
      continue;
    }

    const digest = buildNotificationDigest({ audience: 'partner', partnerId: partner.id, hours: 24 });
    if (!digest.total) {
      skipped += 1;
      continue;
    }

    if (hasRecentCommsSend({ templateId: tpl.id, partnerId: partner.id, withinHours: 24 })) {
      skipped += 1;
      continue;
    }

    const summary = formatDigestSummary(digest);
    const ctx = {
      firstName: partner.profile.fullName?.split(' ')[0] || 'there',
      digestSummary: summary,
      unread: String(digest.unread),
      total: String(digest.total),
      portalNotificationsUrl: `${origin}/portal/notifications`,
    };

    if (dryRun) {
      addCommsSend({
        id: newId('send'),
        templateId: tpl.id,
        channel: 'email',
        partnerId: partner.id,
        to: partner.profile.email || partner.id,
        createdAt: nowIso(),
        status: 'dry_run',
        subject: renderTextTemplate(tpl.subjectTemplate ?? 'Digest', ctx),
        body: summary,
        meta: { digest: 'daily', audience: 'partner' },
      });
      sent += 1;
      continue;
    }

    const res = await sendEmailFromTemplate({
      template: tpl,
      partner,
      ctx,
      dryRun: false,
    });
    if (res.ok) sent += 1;
    else skipped += 1;
  }

  return { sent, skipped };
}
