// Supabase Edge Function: public-session-checkout
// Guest Stripe Checkout + verify for paid enlightenment / consultation sessions.
//
// Secrets: STRIPE_SECRET_KEY, APP_BASE_URL

import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, logEdgeEvent, rateLimit } from '../_shared/edgeGuard.ts';

type ReqBody = {
  action?: 'create' | 'verify';
  requestId?: string;
  email?: string;
  fullName?: string;
  amountCents?: number;
  topic?: 'enlightenment' | 'consultation';
  sessionId?: string;
};

function toForm(params: Record<string, string | number | boolean | undefined | null>) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    form.set(k, String(v));
  }
  return form;
}

function baseUrlFromReq(req: Request) {
  const envBase = (Deno.env.get('APP_BASE_URL') || '').trim();
  if (envBase) return envBase.replace(/\/+$/, '');
  const origin = (req.headers.get('origin') || '').trim();
  if (origin) return origin.replace(/\/+$/, '');
  return '';
}

async function stripePost(args: { secretKey: string; path: string; form: URLSearchParams; idempotencyKey?: string }) {
  const res = await fetch(`https://api.stripe.com/v1/${args.path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(args.idempotencyKey ? { 'Idempotency-Key': args.idempotencyKey } : {}),
    },
    body: args.form.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stripe error: ${res.status} ${text}`);
  return JSON.parse(text);
}

async function stripeGet(args: { secretKey: string; path: string }) {
  const res = await fetch(`https://api.stripe.com/v1/${args.path.replace(/^\//, '')}`, {
    headers: { Authorization: `Bearer ${args.secretKey}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stripe error: ${res.status} ${text}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const ip = getClientIp(req);

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action ?? 'create';
  const stripeKey = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim();
  if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 });

  if (action === 'verify') {
    const rl = await rateLimit({ key: `public-session-verify:ip:${ip}`, limit: 20, windowSeconds: 60 });
    if (!rl.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

    const sessionId = String(body.sessionId || '').trim();
    const requestId = String(body.requestId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!sessionId || !requestId) return json({ error: 'Missing sessionId or requestId' }, { status: 400 });

    try {
      const s = await stripeGet({
        secretKey: stripeKey,
        path: `checkout/sessions/${encodeURIComponent(sessionId)}`,
      });
      const meta = s?.metadata ?? {};
      const metaRequestId = String(meta.requestId || meta.request_id || '').trim();
      const kind = String(meta.kind || '').trim();
      const customerEmail = String(s?.customer_details?.email || s?.customer_email || '').trim().toLowerCase();
      const paid = String(s?.payment_status || '').toLowerCase() === 'paid';
      const requestOk = metaRequestId === requestId;
      const emailOk = !email || !customerEmail || email === customerEmail;
      const kindOk = kind === 'public_session';

      if (!requestOk || !kindOk || !emailOk) {
        return json({ ok: false, error: 'Session does not match this booking request' }, { status: 403, headers: corsHeaders });
      }

      await logEdgeEvent({
        namespace: 'stripe',
        level: 'info',
        event: 'public_session_verified',
        meta: { ip, requestId, sessionId, paid, topic: meta.topic ?? null },
      });

      return json(
        { ok: true, paid, requestId, sessionId, paymentStatus: s?.payment_status ?? null },
        { headers: corsHeaders },
      );
    } catch (e) {
      return json({ ok: false, error: (e as Error)?.message || 'Verify failed' }, { status: 400, headers: corsHeaders });
    }
  }

  const rl = await rateLimit({ key: `public-session-checkout:ip:${ip}`, limit: 6, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

  const requestId = String(body.requestId || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || '').trim();
  const topic = body.topic === 'consultation' ? 'consultation' : 'enlightenment';
  const amountCents = typeof body.amountCents === 'number' ? Math.round(body.amountCents) : 0;

  if (!requestId || !email.includes('@') || amountCents < 50) {
    return json({ error: 'Missing requestId, email, or amountCents' }, { status: 400 });
  }

  const baseUrl = baseUrlFromReq(req);
  if (!baseUrl) return json({ error: 'APP_BASE_URL not configured' }, { status: 500 });

  const returnPath = topic === 'enlightenment' ? '/enlightenment-session' : '/consultation';
  const successUrl = `${baseUrl}${returnPath}?paid=1&requestId=${encodeURIComponent(requestId)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${returnPath}?paid=0&requestId=${encodeURIComponent(requestId)}`;

  const productName =
    topic === 'enlightenment' ? 'Finely Cred — Additional Enlightenment Session' : 'Finely Cred — Consultation Session';

  const form = toForm({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    client_reference_id: requestId,
    'metadata[requestId]': requestId,
    'metadata[topic]': topic,
    'metadata[fullName]': fullName,
    'metadata[kind]': 'public_session',
    'payment_intent_data[metadata][requestId]': requestId,
    'payment_intent_data[metadata][topic]': topic,
    'payment_intent_data[metadata][kind]': 'public_session',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': amountCents,
    'line_items[0][price_data][product_data][name]': productName,
    'line_items[0][quantity]': 1,
  });

  try {
    const out = await stripePost({
      secretKey: stripeKey,
      path: 'checkout/sessions',
      form,
      idempotencyKey: `pubsess_${requestId}`,
    });

    await logEdgeEvent({
      namespace: 'stripe',
      level: 'info',
      event: 'public_session_checkout_created',
      meta: { ip, requestId, topic, amountCents, sessionId: out?.id ?? null },
    });

    return json({ ok: true, sessionId: out?.id, url: out?.url }, { headers: corsHeaders });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'stripe',
      level: 'error',
      event: 'public_session_checkout_failed',
      meta: { ip, requestId, topic, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Stripe request failed' }, { status: 500, headers: corsHeaders });
  }
});
