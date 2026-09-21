import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { recordCommandAudit } from './commandAudit';

export const PARTNER_SUPPORT_FROM = 'partnersupport@finelycred.com';

export type SendPartnerEmailInput = {
  toEmail: string;
  toName?: string;
  subject: string;
  text: string;
  partnerId?: string;
  approved: boolean;
  draftId?: string;
};

export type SendPartnerEmailResult = {
  ok: boolean;
  status: 'draft_saved' | 'needs_approval' | 'flag_off' | 'not_configured' | 'sent' | 'failed';
  message: string;
  draftId?: string;
};

export function zohoPartnerEmailEnabled(): boolean {
  return String(import.meta.env.VITE_ZOHO_PARTNER_EMAIL || '').toLowerCase() === 'true';
}

export async function sendPartnerEmail(input: SendPartnerEmailInput): Promise<SendPartnerEmailResult> {
  const toEmail = input.toEmail.trim();
  const subject = input.subject.trim();
  const text = input.text.trim();
  const draftId = input.draftId || `draft_${Date.now().toString(16)}`;
  if (!toEmail || !subject || !text) {
    return { ok: false, status: 'failed', message: 'Recipient, subject, and body are required.', draftId };
  }
  if (!input.approved) {
    await recordCommandAudit({
      id: draftId,
      action: 'partner_email.draft',
      partnerId: input.partnerId,
      summary: `Draft saved for ${toEmail}: ${subject}`,
      sent: false,
    });
    return { ok: false, status: 'needs_approval', message: 'Draft saved. Check Approve before send.', draftId };
  }
  if (!zohoPartnerEmailEnabled()) {
    await recordCommandAudit({
      id: draftId,
      action: 'partner_email.flag_off',
      partnerId: input.partnerId,
      summary: `Approved locally but Zoho flag is off for ${toEmail}`,
      sent: false,
    });
    return {
      ok: false,
      status: 'flag_off',
      message: 'Approve is recorded. Sending stays off until VITE_ZOHO_PARTNER_EMAIL=true and Zoho SMTP secrets are set.',
      draftId,
    };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, status: 'not_configured', message: 'Supabase is not configured, so Zoho cannot be reached.', draftId };
  }
  const { data, error } = await supabase.functions.invoke('send-partner-email', {
    body: {
      toEmail,
      toName: input.toName,
      subject,
      text,
      partnerId: input.partnerId,
      approved: true,
      draftId,
    },
  });
  if (error) {
    return { ok: false, status: 'failed', message: error.message || 'Send failed.', draftId };
  }
  const payload = (data ?? {}) as { ok?: boolean; status?: string; error?: string; from?: string };
  if (!payload.ok) {
    await recordCommandAudit({
      id: draftId,
      action: 'partner_email.blocked',
      partnerId: input.partnerId,
      summary: payload.error || payload.status || 'Send blocked',
      sent: false,
    });
    return {
      ok: false,
      status: payload.status === 'not_configured' ? 'not_configured' : 'failed',
      message: payload.error || 'Zoho did not send. Secrets may still be empty.',
      draftId,
    };
  }
  await recordCommandAudit({
    id: draftId,
    action: 'partner_email.sent',
    partnerId: input.partnerId,
    summary: `Sent from ${payload.from || PARTNER_SUPPORT_FROM} to ${toEmail}`,
    sent: true,
  });
  return { ok: true, status: 'sent', message: `Sent from ${payload.from || PARTNER_SUPPORT_FROM}.`, draftId };
}
