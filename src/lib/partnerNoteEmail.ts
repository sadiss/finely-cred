import type { Partner } from '../domain/partners';
import { getCommsTemplate } from '../data/commsRepo';
import { createNotification } from '../data/notificationsRepo';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';
import { getPartner, getPartnerSync } from '../data/partnersRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { buildDefaultCommsContext, sendEmailFromTemplate } from './commsEngine';
import { emailDedupeKey, isEmailRecentlySent, markEmailRecentlySent } from './emailSendDedupe';

const TEMPLATE_ID = 'partner_note_shared';

export async function notifyPartnerNoteEmail(args: {
  partnerId: string;
  body: string;
  authorLabel?: string;
  partner?: Partner | null;
}): Promise<{ ok: boolean; skipped?: string }> {
  const body = args.body.trim();
  if (!body) return { ok: false, skipped: 'empty_body' };

  const partner =
    args.partner ??
    getPartnerSync(args.partnerId) ??
    (await getPartner(args.partnerId));
  if (!partner) return { ok: false, skipped: 'partner_not_found' };

  const email = (partner.profile.email || '').trim();
  const preview = body.slice(0, 220);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const portalNotesUrl = `${origin}/portal/dashboard`;

  createNotification({
    partnerId: partner.id,
    audience: 'partner',
    kind: 'case_update',
    title: 'Update from your Finely team',
    body: preview,
    href: '/portal/dashboard',
    meta: { source: 'partner_note_email' },
  });

  if (!isFeatureEnabled('commsDelivery')) {
    return { ok: false, skipped: 'comms_delivery_disabled' };
  }
  if (!email) return { ok: false, skipped: 'missing_email' };

  const prefs = getNotificationPrefs({ partnerId: partner.id });
  if (prefs.emailInstantMessages === false) {
    return { ok: false, skipped: 'instant_messages_disabled' };
  }
  if ((prefs.mutedKinds ?? []).includes('support')) {
    return { ok: false, skipped: 'support_muted' };
  }

  const dedupeKey = emailDedupeKey('partner-note', partner.id, body.slice(0, 80));
  if (isEmailRecentlySent(dedupeKey, 6)) {
    return { ok: false, skipped: 'recent_duplicate' };
  }

  const tpl = getCommsTemplate(TEMPLATE_ID);
  if (!tpl?.enabled) return { ok: false, skipped: 'template_missing' };

  const ctx = buildDefaultCommsContext({
    partner,
    extra: {
      noteBody: body,
      notePreview: preview,
      authorLabel: args.authorLabel || 'Finely Cred team',
      portalNotesUrl,
    },
  });

  const result = await sendEmailFromTemplate({ template: tpl, partner, ctx });
  if (result.ok) markEmailRecentlySent(dedupeKey);
  return { ok: result.ok, skipped: result.ok ? undefined : 'send_failed' };
}
