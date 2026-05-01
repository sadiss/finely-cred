// Supabase Edge Function: send-invite-email
// Sends a partner claim link via SendGrid.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SENDGRID_API_KEY
// - SENDGRID_FROM_EMAIL (optional; can be overridden by request)
// - SENDGRID_FROM_NAME (optional; can be overridden by request)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireIdempotency } from '../_shared/edgeGuard.ts';

type ReqBody = {
  to: { email: string; name?: string };
  from?: { email?: string; name?: string };
  subject: string;
  text: string;
  /** Optional: prevents accidental duplicate sends. */
  idempotencyKey?: string;
};

async function sendgridSend(args: { apiKey: string; payload: any }) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args.payload),
  });
  if (!res.ok) throw new Error(`SendGrid error: ${res.status} ${await res.text()}`);
  return true;
}

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

  const rlUser = await rateLimit({ key: `send-invite-email:user:${ctx.user.id}`, limit: 10, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `send-invite-email:ip:${ctx.ip}`, limit: 30, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) {
    await logEdgeEvent({ namespace: 'send-invite-email', level: 'warn', event: 'rate_limited', meta: { ip: ctx.ip, userId: ctx.user.id } });
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

  const apiKey = Deno.env.get('SENDGRID_API_KEY') || '';
  if (!apiKey) return json({ error: 'SENDGRID_API_KEY missing' }, { status: 500 });

  const fromEmail = body.from?.email || Deno.env.get('SENDGRID_FROM_EMAIL') || '';
  const fromName = body.from?.name || Deno.env.get('SENDGRID_FROM_NAME') || 'Finely Cred';
  if (!fromEmail) return json({ error: 'From email not configured' }, { status: 500 });

  const toEmail = (body.to?.email || '').trim();
  if (!toEmail) return json({ error: 'Missing to.email' }, { status: 400 });
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();
  if (!subject || !text) return json({ error: 'Missing subject/text' }, { status: 400 });

  if (body.idempotencyKey) {
    const ok = await requireIdempotency({ namespace: 'send-invite-email', key: `${ctx.user.id}:${body.idempotencyKey}` });
    if (!ok) return json({ ok: true, deduped: true });
  }

  const payload = {
    personalizations: [{ to: [{ email: toEmail, name: body.to?.name || undefined }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content: [{ type: 'text/plain', value: text }],
  };

  try {
    await sendgridSend({ apiKey, payload });
    await logEdgeEvent({
      namespace: 'send-invite-email',
      level: 'info',
      event: 'sent',
      meta: { userId: ctx.user.id, ip: ctx.ip, toEmail, subject: subject.slice(0, 120), textLen: text.length },
    });
    return json({ ok: true });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'send-invite-email',
      level: 'error',
      event: 'send_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, toEmail, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Send failed' }, { status: 500 });
  }
});

