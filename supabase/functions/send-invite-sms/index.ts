// Supabase Edge Function: send-invite-sms
// Sends a partner claim link via Twilio SMS.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - TWILIO_ACCOUNT_SID
// - TWILIO_AUTH_TOKEN
// - TWILIO_FROM_PHONE (optional; can be overridden by request)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireIdempotency } from '../_shared/edgeGuard.ts';

type ReqBody = {
  to: string;
  body: string;
  from?: string;
  /** Optional: prevents accidental duplicate sends. */
  idempotencyKey?: string;
};

async function twilioSend(args: { sid: string; token: string; from: string; to: string; body: string }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(args.sid)}/Messages.json`;
  const auth = btoa(`${args.sid}:${args.token}`);
  const form = new URLSearchParams();
  form.set('From', args.from);
  form.set('To', args.to);
  form.set('Body', args.body);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Twilio error: ${res.status} ${await res.text()}`);
  return await res.json();
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

  const rlUser = await rateLimit({ key: `send-invite-sms:user:${ctx.user.id}`, limit: 5, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `send-invite-sms:ip:${ctx.ip}`, limit: 15, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) {
    await logEdgeEvent({ namespace: 'send-invite-sms', level: 'warn', event: 'rate_limited', meta: { ip: ctx.ip, userId: ctx.user.id } });
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

  const sid = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
  const token = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
  if (!sid || !token) return json({ error: 'Twilio env missing' }, { status: 500 });

  const from = (body.from || Deno.env.get('TWILIO_FROM_PHONE') || '').trim();
  const to = (body.to || '').trim();
  const msg = String(body.body || '').trim();
  if (!from) return json({ error: 'From phone not configured' }, { status: 500 });
  if (!to) return json({ error: 'Missing to' }, { status: 400 });
  if (!msg) return json({ error: 'Missing body' }, { status: 400 });

  if (body.idempotencyKey) {
    const ok = await requireIdempotency({ namespace: 'send-invite-sms', key: `${ctx.user.id}:${body.idempotencyKey}` });
    if (!ok) return json({ ok: true, deduped: true });
  }

  try {
    const out = await twilioSend({ sid, token, from, to, body: msg });
    await logEdgeEvent({
      namespace: 'send-invite-sms',
      level: 'info',
      event: 'sent',
      meta: { userId: ctx.user.id, ip: ctx.ip, to, sid: out?.sid ?? null, status: out?.status ?? null, bodyLen: msg.length },
    });
    return json({ ok: true, sid: out?.sid ?? null, status: out?.status ?? null });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'send-invite-sms',
      level: 'error',
      event: 'send_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, to, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Send failed' }, { status: 500 });
  }
});

