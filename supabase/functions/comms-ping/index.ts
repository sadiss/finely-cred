// Supabase Edge Function: comms-ping
// Admin-only connectivity check for email + SMS delivery secrets.
//
// Secrets: same as send-email / send-sms (SMTP_*, SENDGRID_*, SMS_*, TWILIO_*, API_ID, API_KEY)

import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';
import {
  getEmailApiCredentials,
  getSmsApiCredentials,
  getSmsProvider,
  isEmailDeliveryConfigured,
  isRestSmsConfigured,
  isSendGridConfigured,
  isSmsDeliveryConfigured,
  isSmtpConfigured,
  isTwilioConfigured,
  trimEnv,
} from '../_shared/commsCredentials.ts';
import { sendServiceEmail } from '../_shared/commsSendEmail.ts';
import { sendServiceSms } from '../_shared/commsSendSms.ts';

type ReqBody = {
  action?: 'status' | 'test-email' | 'test-sms';
  toEmail?: string;
  toPhone?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  let body: ReqBody = {};
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    body = {};
  }

  const action = body.action || 'status';
  const emailCreds = getEmailApiCredentials();
  const smsCreds = getSmsApiCredentials();
  const smsProvider = getSmsProvider();

  const status = {
    email: {
      configured: isEmailDeliveryConfigured(),
      smtp: isSmtpConfigured(),
      sendgrid: isSendGridConfigured(),
      hasApiAlias: Boolean(emailCreds.apiId && emailCreds.apiKey),
      smtpHost: Boolean(trimEnv('SMTP_HOST')),
      fromEmail: Boolean(trimEnv('SMTP_FROM_EMAIL') || trimEnv('SENDGRID_FROM_EMAIL')),
    },
    sms: {
      configured: isSmsDeliveryConfigured(),
      provider: smsProvider,
      twilio: isTwilioConfigured(),
      rest: isRestSmsConfigured(),
      hasApiAlias: Boolean(smsCreds.apiId && smsCreds.apiKey),
      senderId: Boolean(trimEnv('SMS_SENDER_ID')),
      restUrl: trimEnv('SMS_REST_SEND_URL') || 'https://api.vatansms.net/api/v1/1toN',
    },
  };

  if (action === 'status') {
    return json({ ok: true, status });
  }

  if (action === 'test-email') {
    const toEmail = String(body.toEmail || '').trim();
    if (!toEmail) return json({ ok: false, error: 'Missing toEmail' }, { status: 400 });
    if (!isEmailDeliveryConfigured()) {
      return json({ ok: false, error: 'Email delivery not configured', status }, { status: 500 });
    }
    const sent = await sendServiceEmail({
      toEmail,
      subject: 'Finely Cred — email delivery test',
      text: 'If you received this, outbound email is configured correctly.',
      html: '<p>If you received this, outbound email is configured correctly.</p>',
    });
    return json({ ok: sent.ok, status, error: sent.error });
  }

  if (action === 'test-sms') {
    const toPhone = String(body.toPhone || '').trim();
    if (!toPhone) return json({ ok: false, error: 'Missing toPhone' }, { status: 400 });
    if (!isSmsDeliveryConfigured()) {
      return json({ ok: false, error: 'SMS delivery not configured', status }, { status: 500 });
    }
    const sent = await sendServiceSms({
      to: toPhone,
      body: 'Finely Cred — SMS delivery test. Reply STOP to opt out.',
    });
    return json({
      ok: sent.ok,
      status,
      provider: sent.ok ? sent.provider : undefined,
      sid: sent.ok ? sent.sid : undefined,
      error: sent.ok ? undefined : sent.error,
    });
  }

  return json({ error: 'Unknown action' }, { status: 400 });
});
