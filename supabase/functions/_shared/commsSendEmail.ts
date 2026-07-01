// deno-lint-ignore-file no-explicit-any
// Uses nodemailer via npm specifier — more memory-efficient than denomailer for Supabase
// edge workers, avoids the WORKER_RESOURCE_LIMIT (546) caused by raw TCP overhead.
import nodemailer from 'npm:nodemailer@6.9.15';
import {
  getSmtpCredentials,
  isEmailDeliveryConfigured,
  isSendGridConfigured,
  isSmtpConfigured,
  trimEnv,
} from './commsCredentials.ts';

export { isEmailDeliveryConfigured, isSendGridConfigured, isSmtpConfigured };

/**
 * Service-role email send for edge functions.
 *
 * Priority:
 *   1. SMTP (SMTP_* or EMAIL_API_ID + EMAIL_API_KEY aliases as SMTP_USER/PASS)
 *   2. SendGrid REST (SENDGRID_API_KEY legacy fallback)
 *
 * Required SMTP secrets:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER (or EMAIL_API_ID / API_ID),
 *   SMTP_PASS (or EMAIL_API_KEY / API_KEY), SMTP_FROM_EMAIL
 *
 * Optional:
 *   SMTP_FROM_NAME, SMTP_SECURE
 *
 * SendGrid fallback:
 *   SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME
 */
export async function sendServiceEmail(args: {
  toEmail: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string; provider?: 'smtp' | 'sendgrid' }> {
  const toEmail = args.toEmail.trim();
  if (!toEmail) return { ok: false, error: 'Missing toEmail' };

  const subject = args.subject.trim();
  const text = (args.text || '').trim();
  const html = (args.html || '').trim();
  if (!subject || (!text && !html)) return { ok: false, error: 'Missing subject/body' };

  const smtp = getSmtpCredentials();
  if (smtp) {
    const fromEmail = trimEnv('SMTP_FROM_EMAIL');
    const fromName = trimEnv('SMTP_FROM_NAME') || 'Finely Cred';
    if (!fromEmail) return { ok: false, error: 'SMTP_FROM_EMAIL missing' };

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    });

    try {
      const to = args.toName ? `"${args.toName}" <${toEmail}>` : toEmail;
      const from = `"${fromName}" <${fromEmail}>`;
      await transporter.sendMail({ from, to, subject, text: text || ' ', html: html || undefined });
      return { ok: true, provider: 'smtp' };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : 'SMTP send failed' };
    } finally {
      try { transporter.close(); } catch { /* ignore */ }
    }
  }

  if (isSendGridConfigured()) {
    const apiKey = trimEnv('SENDGRID_API_KEY');
    const fromEmail = trimEnv('SENDGRID_FROM_EMAIL');
    const fromName = trimEnv('SENDGRID_FROM_NAME') || 'Finely Cred';
    if (!fromEmail) return { ok: false, error: 'SENDGRID_FROM_EMAIL missing' };

    const content = html
      ? [
        { type: 'text/plain', value: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
        { type: 'text/html', value: html },
      ]
      : [{ type: 'text/plain', value: text }];

    const payload = {
      personalizations: [{ to: [{ email: toEmail, name: args.toName || undefined }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content,
    };

    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { ok: false, error: `SendGrid ${res.status}: ${await res.text()}` };
      return { ok: true, provider: 'sendgrid' };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : 'SendGrid send failed' };
    }
  }

  return { ok: false, error: 'Email delivery not configured (SMTP_* or SENDGRID_API_KEY)' };
}
