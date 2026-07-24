/**
 * Send premium Finely Mail confirmation email after a successful LetterStream send.
 * Persists a lightweight audit + local receipt so partners/admins can re-open confirmation details.
 */
import type { Partner } from '../domain/partners';
import type { MailAddress } from './mailerClient';
import { getPartner, getPartnerSync } from '../data/partnersRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { sendEmail } from './commsDeliveryClient';
import { buildLetterMailedNotifyEmail } from '../comms/letterMailedNotifyEmail';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';
import { addAuditEvent } from '../data/auditRepo';
import { isAdminEmail } from '../auth/admin';

const MAIL_RECEIPT_KEY = 'finely.mail.receipts.v1';

export type LetterMailedReceipt = {
  id: string;
  partnerId: string;
  letterIds: string[];
  letterTitles: string[];
  providerIds: string[];
  mailedAtIso: string;
  toCityState?: string;
  actorRole?: 'partner' | 'admin';
  emailSent: boolean;
};

function persistMailReceipt(receipt: LetterMailedReceipt) {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(MAIL_RECEIPT_KEY);
    const prev = raw ? (JSON.parse(raw) as LetterMailedReceipt[]) : [];
    const next = [receipt, ...(Array.isArray(prev) ? prev : [])].slice(0, 40);
    localStorage.setItem(MAIL_RECEIPT_KEY, JSON.stringify(next));
  } catch {
    /* non-blocking */
  }
}

export function listLetterMailedReceipts(partnerId?: string): LetterMailedReceipt[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(MAIL_RECEIPT_KEY);
    const prev = raw ? (JSON.parse(raw) as LetterMailedReceipt[]) : [];
    const list = Array.isArray(prev) ? prev : [];
    return partnerId ? list.filter((r) => r.partnerId === partnerId) : list;
  } catch {
    return [];
  }
}

export async function notifyLetterMailed(args: {
  partnerId: string;
  partner?: Partner | null;
  letterIds: string[];
  letterTitles: string[];
  providerIds: string[];
  to?: MailAddress | null;
  from?: MailAddress | null;
  expectedDeliveryDate?: string;
  actorEmail?: string;
  actorRole?: 'partner' | 'admin';
}): Promise<{ sent: boolean; reason?: string; adminSent?: boolean }> {
  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }

  const partner =
    args.partner ??
    getPartnerSync(args.partnerId) ??
    (await getPartner(args.partnerId));
  if (!partner) return { sent: false, reason: 'partner_not_found' };

  const prefs = getNotificationPrefs({ partnerId: partner.id });
  if ((prefs.mutedKinds ?? []).includes('letters')) {
    return { sent: false, reason: 'letters_muted' };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const vaultPath =
    args.actorRole === 'admin'
      ? `/admin/partners/${partner.id}?tab=letters`
      : '/portal/letters/vault';
  const vaultUrl = origin ? `${origin}${vaultPath}` : vaultPath;

  const payload = buildLetterMailedNotifyEmail({
    partner,
    letterTitles: args.letterTitles,
    providerIds: args.providerIds,
    to: args.to,
    expectedDeliveryDate: args.expectedDeliveryDate,
    mailedAtIso: new Date().toISOString(),
    actorLabel: args.actorRole === 'admin' ? 'your Finely Cred team' : 'you',
    vaultUrl,
  });

  const toEmail = (partner.profile.email || '').trim();
  let sent = false;
  let reason: string | undefined;

  if (toEmail) {
    try {
      await sendEmail({
        toEmail,
        toName: partner.profile.fullName,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      sent = true;
      addAuditEvent({
        partnerId: partner.id,
        actorType: args.actorRole === 'admin' ? 'admin' : 'partner',
        actorEmail: args.actorEmail,
        action: 'letter.mailed_email_sent',
        entityType: 'letter',
        entityId: args.letterIds[0],
        meta: {
          letterIds: args.letterIds,
          providerIds: args.providerIds,
          toEmail,
        },
      });
    } catch (e: unknown) {
      reason = (e as Error)?.message || 'send_failed';
    }
  } else {
    reason = 'missing_email';
  }

  // Also notify the admin actor when they mailed on behalf of a partner (and email differs).
  let adminSent = false;
  const adminEmail = (args.actorEmail || '').trim().toLowerCase();
  if (args.actorRole === 'admin' && adminEmail && isAdminEmail(adminEmail) && adminEmail !== toEmail.toLowerCase()) {
    try {
      const adminPayload = buildLetterMailedNotifyEmail({
        partner,
        letterTitles: args.letterTitles,
        providerIds: args.providerIds,
        to: args.to,
        expectedDeliveryDate: args.expectedDeliveryDate,
        mailedAtIso: new Date().toISOString(),
        actorLabel: 'admin (copy)',
        vaultUrl: origin ? `${origin}/admin/partners/${partner.id}?tab=letters` : `/admin/partners/${partner.id}?tab=letters`,
      });
      await sendEmail({
        toEmail: adminEmail,
        toName: 'Finely Cred Admin',
        subject: `[Admin copy] ${adminPayload.subject}`,
        text: adminPayload.text,
        html: adminPayload.html,
      });
      adminSent = true;
    } catch {
      /* non-blocking */
    }
  }

  persistMailReceipt({
    id: `mail_rcpt_${Date.now()}`,
    partnerId: partner.id,
    letterIds: args.letterIds,
    letterTitles: args.letterTitles,
    providerIds: args.providerIds,
    mailedAtIso: new Date().toISOString(),
    toCityState: [args.to?.city, args.to?.state].filter(Boolean).join(', ') || undefined,
    actorRole: args.actorRole,
    emailSent: sent,
  });

  return { sent, reason: sent ? undefined : reason, adminSent };
}
