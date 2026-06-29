// Supabase Edge Function: send-password-reset
// Generates a Supabase recovery link (service role) and delivers it via SMTP.
// Works for all auth roles (admin, partner, affiliate, etc.) — not Supabase SMTP.
//
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
//          SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL
// Optional: SMTP_FROM_NAME, SMTP_SECURE, PUBLIC_SITE_URL, PASSWORD_RESET_ALLOWED_ORIGINS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireEnv, resolveAuthContext } from '../_shared/edgeGuard.ts';
import { sendServiceEmail } from '../_shared/commsSendEmail.ts';

type ReqBody = {
  email?: string;
  redirectTo?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeRedirectTo(req: Request, redirectTo?: string): string {
  const siteOrigin = (Deno.env.get('PUBLIC_SITE_URL') || req.headers.get('Origin') || '')
    .trim()
    .replace(/\/$/, '');
  const fallback = `${siteOrigin || 'https://www.finelycred.com'}/reset-password`;
  const raw = (redirectTo || '').trim();
  if (!raw) return fallback;

  try {
    const u = new URL(raw);
    const allowed = new Set(
      [
        siteOrigin,
        req.headers.get('Origin')?.trim().replace(/\/$/, ''),
        ...(Deno.env.get('PASSWORD_RESET_ALLOWED_ORIGINS') || '').split(',').map((s) => s.trim().replace(/\/$/, '')),
      ].filter(Boolean),
    );
    if (allowed.has(u.origin)) return u.toString();
  } catch {
    // ignore invalid URL
  }
  return fallback;
}

function buildPasswordResetEmail(args: { resetLink: string; email: string }) {
  const subject = 'Reset your Finely Cred password';
  const text = [
    'You requested a password reset for your Finely Cred account.',
    '',
    'Open this secure link to choose a new password (valid for about 1 hour):',
    args.resetLink,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    '— Finely Cred',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <p>You requested a password reset for <strong>${args.email}</strong>.</p>
  <p><a href="${args.resetLink}" style="display:inline-block;padding:12px 20px;background:#c026d3;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Set new password</a></p>
  <p style="font-size:13px;color:#555;">Or copy this link:<br/><a href="${args.resetLink}">${args.resetLink}</a></p>
  <p style="font-size:13px;color:#777;">This link expires in about an hour. If you did not request a reset, ignore this email.</p>
</body></html>`;

  return { subject, text, html };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof resolveAuthContext>>;
  try {
    ctx = await resolveAuthContext(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const rlIp = await rateLimit({ key: `send-password-reset:ip:${ctx.ip}`, limit: 15, windowSeconds: 60 * 60 });
  const rlEmail = await rateLimit({ key: `send-password-reset:email:${email}`, limit: 5, windowSeconds: 60 * 60 });
  if (!rlIp.ok || !rlEmail.ok) {
    await logEdgeEvent({
      namespace: 'send-password-reset',
      level: 'warn',
      event: 'rate_limited',
      meta: { ip: ctx.ip, email },
    });
    return json(
      { ok: false, error: 'Too many reset requests. Wait a few minutes and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((Math.min(rlIp.resetAt, rlEmail.resetAt) - Date.now()) / 1000)) },
      },
    );
  }

  const redirectTo = safeRedirectTo(req, body.redirectTo);
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });

  // Do not reveal whether the account exists — same UX as Supabase default.
  if (linkError || !linkData?.properties?.action_link) {
    await logEdgeEvent({
      namespace: 'send-password-reset',
      level: 'info',
      event: 'no_link_generated',
      meta: { email, ip: ctx.ip, error: linkError?.message || 'missing_action_link' },
    });
    return json({ ok: true });
  }

  const resetLink = String(linkData.properties.action_link);
  const { subject, text, html } = buildPasswordResetEmail({ resetLink, email });
  const sent = await sendServiceEmail({ toEmail: email, subject, text, html });

  if (!sent.ok) {
    await logEdgeEvent({
      namespace: 'send-password-reset',
      level: 'error',
      event: 'send_failed',
      meta: { email, ip: ctx.ip, error: sent.error },
    });
    return json({ ok: false, error: sent.error || 'Could not send reset email.' }, { status: 500 });
  }

  // Log success to console (KV write skipped here to stay within worker memory budget;
  // rate-limiter KV writes above already record activity).
  console.log(JSON.stringify({
    namespace: 'send-password-reset',
    level: 'info',
    event: 'sent',
    meta: { email, ip: ctx.ip, requestedBy: ctx.user.id, redirectTo },
    at: new Date().toISOString(),
  }));

  return json({ ok: true });
});
