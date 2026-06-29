// deno-lint-ignore-file no-explicit-any
// Uses nodemailer via npm specifier — more memory-efficient than denomailer for Supabase
// edge workers, avoids the WORKER_RESOURCE_LIMIT (546) caused by raw TCP overhead.
import nodemailer from 'npm:nodemailer@6.9.15';

/**
 * Service-role SMTP send for edge functions.
 *
 * Required secrets:
 *   SMTP_HOST          e.g. smtp.zoho.com
 *   SMTP_PORT          587 (STARTTLS) or 465 (implicit TLS)
 *   SMTP_USER          SMTP username / login
 *   SMTP_PASS          SMTP password / app-password
 *   SMTP_FROM_EMAIL    Verified sender address
 *
 * Optional secrets:
 *   SMTP_FROM_NAME     Display name (defaults to "Finely Cred")
 *   SMTP_SECURE        Set to "true" to force implicit TLS (port 465);
 *                      omit for STARTTLS (port 587)
 */
export async function sendServiceEmail(args: {
  toEmail: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const host = (Deno.env.get('SMTP_HOST') || '').trim();
  if (!host) return { ok: false, error: 'SMTP_HOST missing' };

  const port = parseInt((Deno.env.get('SMTP_PORT') || '587').trim(), 10);
  if (!port) return { ok: false, error: 'SMTP_PORT invalid' };

  const username = (Deno.env.get('SMTP_USER') || '').trim();
  const password = (Deno.env.get('SMTP_PASS') || '').trim();
  if (!username || !password) return { ok: false, error: 'SMTP_USER / SMTP_PASS missing' };

  const fromEmail = (Deno.env.get('SMTP_FROM_EMAIL') || '').trim();
  const fromName = (Deno.env.get('SMTP_FROM_NAME') || 'Finely Cred').trim();
  if (!fromEmail) return { ok: false, error: 'SMTP_FROM_EMAIL missing' };

  const toEmail = args.toEmail.trim();
  if (!toEmail) return { ok: false, error: 'Missing toEmail' };

  const subject = args.subject.trim();
  const text = (args.text || '').trim();
  const html = (args.html || '').trim();
  if (!subject || (!text && !html)) return { ok: false, error: 'Missing subject/body' };

  const secure = (Deno.env.get('SMTP_SECURE') || '').toLowerCase() === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: username, pass: password },
    // Tight timeouts so a slow SMTP server doesn't burn worker CPU time.
    connectionTimeout: 10_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  try {
    const to = args.toName ? `"${args.toName}" <${toEmail}>` : toEmail;
    const from = `"${fromName}" <${fromEmail}>`;
    await transporter.sendMail({ from, to, subject, text: text || ' ', html: html || undefined });
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'SMTP send failed' };
  } finally {
    try { transporter.close(); } catch { /* ignore */ }
  }
}
