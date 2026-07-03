// Partner welcome email — allows authenticated partners to receive branded welcome HTML
// without requiring EDGE_ADMIN_EMAILS (unlike send-email).

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireIdempotency } from '../_shared/edgeGuard.ts';
import { sendServiceEmail } from '../_shared/commsSendEmail.ts';

type ReqBody = {
  to: { email: string; name?: string };
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const toEmail = (body.to?.email || '').trim().toLowerCase();
  if (!toEmail) return json({ error: 'Missing to.email' }, { status: 400 });

  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();
  const html = String(body.html || '').trim();
  if (!subject || (!text && !html)) return json({ error: 'Missing subject and body' }, { status: 400 });

  let isAdmin = false;
  try {
    requireAllowlistedEmail(ctx);
    isAdmin = true;
  } catch {
    const sessionEmail = String(ctx.user.email || '').trim().toLowerCase();
    if (!sessionEmail || sessionEmail !== toEmail) {
      return json({ error: 'Forbidden — welcome email can only be sent to your own login email unless you are an admin.' }, { status: 403 });
    }
  }

  const rlUser = await rateLimit({ key: `send-partner-welcome:user:${ctx.user.id}`, limit: 5, windowSeconds: 300 });
  const rlIp = await rateLimit({ key: `send-partner-welcome:ip:${ctx.ip}`, limit: 20, windowSeconds: 300 });
  if (!rlUser.ok || !rlIp.ok) {
    return json({ ok: false, error: 'Rate limited. Try again shortly.' }, { status: 429 });
  }

  if (body.idempotencyKey) {
    const ok = await requireIdempotency({ namespace: 'send-partner-welcome', key: `${ctx.user.id}:${body.idempotencyKey}` });
    if (!ok) return json({ ok: true, deduped: true });
  }

  const sent = await sendServiceEmail({ toEmail, toName: body.to?.name, subject, text, html: html || undefined });
  if (!sent.ok) {
    await logEdgeEvent({
      namespace: 'send-partner-welcome',
      level: 'error',
      event: 'send_failed',
      meta: { userId: ctx.user.id, isAdmin, toEmail, error: sent.error },
    });
    return json({ ok: false, error: sent.error || 'Send failed' }, { status: 500 });
  }

  await logEdgeEvent({
    namespace: 'send-partner-welcome',
    level: 'info',
    event: 'sent',
    meta: { userId: ctx.user.id, isAdmin, toEmail },
  });

  return json({ ok: true });
});
