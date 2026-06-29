// Supabase Edge Function: send-email
// Generic outbound email via SMTP.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL
// - SMTP_FROM_NAME (optional, defaults to "Finely Cred")
// - SMTP_SECURE    (optional, set "true" for port 465 implicit TLS)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireIdempotency } from '../_shared/edgeGuard.ts';
import { sendServiceEmail } from '../_shared/commsSendEmail.ts';

type ReqBody = {
  to: { email: string; name?: string };
  from?: { email?: string; name?: string };
  replyTo?: { email: string; name?: string };
  subject: string;
  text: string;
  html?: string;
  /** Optional: prevents accidental duplicate sends. */
  idempotencyKey?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  // Abuse guardrails
  const rlUser = await rateLimit({ key: `send-email:user:${ctx.user.id}`, limit: 20, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `send-email:ip:${ctx.ip}`, limit: 60, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) {
    await logEdgeEvent({ namespace: 'send-email', level: 'warn', event: 'rate_limited', meta: { ip: ctx.ip, userId: ctx.user.id } });
    return json(
      { ok: false, error: 'Rate limited. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((Math.min(rlUser.resetAt, rlIp.resetAt) - Date.now()) / 1000)) } },
    );
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const toEmail = (body.to?.email || '').trim();
  if (!toEmail) return json({ error: 'Missing to.email' }, { status: 400 });
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();
  const html = String(body.html || '').trim();
  if (!subject || (!text && !html)) return json({ error: 'Missing subject and body (text or html)' }, { status: 400 });

  if (body.idempotencyKey) {
    const ok = await requireIdempotency({ namespace: 'send-email', key: `${ctx.user.id}:${body.idempotencyKey}` });
    if (!ok) return json({ ok: true, deduped: true });
  }

  const sent = await sendServiceEmail({ toEmail, toName: body.to?.name, subject, text, html: html || undefined });

  if (!sent.ok) {
    await logEdgeEvent({
      namespace: 'send-email',
      level: 'error',
      event: 'send_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, toEmail, subject: subject.slice(0, 120), error: sent.error },
    });
    return json({ ok: false, error: sent.error || 'Send failed' }, { status: 500 });
  }

  await logEdgeEvent({
    namespace: 'send-email',
    level: 'info',
    event: 'sent',
    meta: { userId: ctx.user.id, ip: ctx.ip, toEmail, subject: subject.slice(0, 120), textLen: text.length },
  });
  return json({ ok: true });
});

