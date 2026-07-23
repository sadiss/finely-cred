import type { Partner } from '../domain/partners';
import { getCommsTemplate, hasRecentThreadCommsSend } from '../data/commsRepo';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';
import { getPartner, getPartnerSync } from '../data/partnersRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { buildSupportMessageHref } from './messageNotificationCopy';
import { buildDefaultCommsContext, sendEmailFromTemplate } from './commsEngine';

const TEMPLATE_ID = 'partner_message_instant';
const DEDUPE_HOURS = 1;

export async function notifyPartnerMessageEmail(args: {
  partnerId: string;
  threadId: string;
  subject: string;
  bodyPreview: string;
  partner?: Partner | null;
}): Promise<{ ok: boolean; skipped?: string }> {
  if (!isFeatureEnabled('commsDelivery')) {
    return { ok: false, skipped: 'comms_delivery_disabled' };
  }

  const partner =
    args.partner ??
    getPartnerSync(args.partnerId) ??
    (await getPartner(args.partnerId));
  if (!partner) return { ok: false, skipped: 'partner_not_found' };

  const email = (partner.profile.email || '').trim();
  if (!email) return { ok: false, skipped: 'missing_email' };

  const prefs = getNotificationPrefs({ partnerId: partner.id });
  if (prefs.emailInstantMessages === false) {
    return { ok: false, skipped: 'instant_messages_disabled' };
  }
  if ((prefs.mutedKinds ?? []).includes('support')) {
    return { ok: false, skipped: 'support_muted' };
  }

  if (
    hasRecentThreadCommsSend({
      templateId: TEMPLATE_ID,
      partnerId: partner.id,
      threadId: args.threadId,
      withinHours: DEDUPE_HOURS,
    })
  ) {
    return { ok: false, skipped: 'recent_send' };
  }

  const tpl = getCommsTemplate(TEMPLATE_ID);
  if (!tpl?.enabled) return { ok: false, skipped: 'template_missing' };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const messagesPath = buildSupportMessageHref({
    fromPartner: false,
    partnerId: partner.id,
    threadId: args.threadId,
  });
  const messagesUrl = origin ? `${origin}${messagesPath}` : messagesPath;
  const preview = (args.bodyPreview || '').trim().slice(0, 220);
  const ctx = buildDefaultCommsContext({
    partner,
    extra: {
      messagePreview: preview,
      threadSubject: args.subject,
      messagesUrl,
    },
  });

  const result = await sendEmailFromTemplate({
    template: tpl,
    partner,
    ctx,
    meta: { threadId: args.threadId, kind: 'instant_message' },
  });

  return { ok: result.ok, skipped: result.ok ? undefined : 'send_failed' };
}
