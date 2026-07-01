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
import { isEmailDeliveryConfigured } from '../_shared/commsSendEmail.ts';
import { sendServiceEmail } from '../_shared/commsSendEmail.ts';
import { buildPasswordResetEmail } from '../_shared/passwordResetEmailTemplate.ts';

type ReqBody = {
  email?: string;
  /** When set, resolves the canonical auth email (fixes profile vs login email mismatches). */
  userId?: string;
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

  const redirectTo = safeRedirectTo(req, body.redirectTo);
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let email = (body.email || '').trim().toLowerCase();
  const userId = (body.userId || '').trim();
  if (userId) {
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId);
    if (!userErr && userData?.user?.email) {
      email = userData.user.email.trim().toLowerCase();
    }
  }

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

  if (!isEmailDeliveryConfigured()) {
    await logEdgeEvent({
      namespace: 'send-password-reset',
      level: 'warn',
      event: 'email_not_configured',
      meta: { email, ip: ctx.ip },
    });
    return json({ ok: false, sent: false, error: 'Email delivery not configured on server.' }, { status: 503 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });

  // Do not reveal whether the account exists to anonymous callers — but expose sent:false so the client can fall back.
  if (linkError || !linkData?.properties?.action_link) {
    await logEdgeEvent({
      namespace: 'send-password-reset',
      level: 'info',
      event: 'no_link_generated',
      meta: { email, userId: userId || null, ip: ctx.ip, error: linkError?.message || 'missing_action_link' },
    });
    return json({ ok: true, sent: false, reason: 'no_auth_account' });
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
    return json({ ok: false, sent: false, error: sent.error || 'Could not send reset email.' }, { status: 500 });
  }

  console.log(JSON.stringify({
    namespace: 'send-password-reset',
    level: 'info',
    event: 'sent',
    meta: { email, userId: userId || null, ip: ctx.ip, requestedBy: ctx.user.id, redirectTo },
    at: new Date().toISOString(),
  }));

  return json({ ok: true, sent: true });
});
