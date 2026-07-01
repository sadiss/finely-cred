// Supabase Edge Function: send-invite-sms
// Sends a partner claim link via Twilio or REST SMS (API_ID + API_KEY).
//
// Secrets: see send-sms/index.ts

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireIdempotency } from '../_shared/edgeGuard.ts';
import { getSmsProvider } from '../_shared/commsCredentials.ts';
import { sendServiceSms } from '../_shared/commsSendSms.ts';

type ReqBody = {
  to: string;
  body: string;
  from?: string;
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

  const to = (body.to || '').trim();
  const msg = String(body.body || '').trim();
  if (!to) return json({ error: 'Missing to' }, { status: 400 });
  if (!msg) return json({ error: 'Missing body' }, { status: 400 });

  if (body.idempotencyKey) {
    const ok = await requireIdempotency({ namespace: 'send-invite-sms', key: `${ctx.user.id}:${body.idempotencyKey}` });
    if (!ok) return json({ ok: true, deduped: true });
  }

  const provider = getSmsProvider();
  const sent = await sendServiceSms({ to, body: msg, from: body.from });

  if (!sent.ok) {
    await logEdgeEvent({
      namespace: 'send-invite-sms',
      level: 'error',
      event: 'send_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, to, provider, error: sent.error },
    });
    return json({ ok: false, error: sent.error || 'Send failed' }, { status: 500 });
  }

  await logEdgeEvent({
    namespace: 'send-invite-sms',
    level: 'info',
    event: 'sent',
    meta: {
      userId: ctx.user.id,
      ip: ctx.ip,
      to,
      provider: sent.provider,
      sid: sent.sid ?? null,
      status: sent.status ?? null,
      bodyLen: msg.length,
    },
  });
  return json({ ok: true, provider: sent.provider, sid: sent.sid ?? null, status: sent.status ?? null });
});
