// Supabase Edge Function: stripe-checkout
// Creates a Stripe Checkout Session for a package purchase.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - STRIPE_SECRET_KEY
// - STRIPE_PRICE_MAP_JSON (optional; e.g. {"personal_restore":"price_123"})
// - STRIPE_ALLOW_DYNAMIC_PRICE (optional; "true" allows amountCents in request for test/dev)
// - APP_BASE_URL (recommended; e.g. https://app.finelycred.com)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';

type ReqBody = {
  agreementId: string;
  tenantId: string;
  partnerId: string;
  packageId: string;
  /** Only used when STRIPE_ALLOW_DYNAMIC_PRICE=true */
  amountCents?: number;
};

function toForm(params: Record<string, string | number | boolean | undefined | null>) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    form.set(k, String(v));
  }
  return form;
}

function parseJsonSafe<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function baseUrlFromReq(req: Request) {
  const envBase = (Deno.env.get('APP_BASE_URL') || '').trim();
  if (envBase) return envBase.replace(/\/+$/, '');
  const origin = (req.headers.get('origin') || '').trim();
  if (origin) return origin.replace(/\/+$/, '');
  const host = (req.headers.get('host') || '').trim();
  if (host) return `https://${host}`.replace(/\/+$/, '');
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rlUser = await rateLimit({ key: `stripe-checkout:user:${ctx.user.id}`, limit: 8, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `stripe-checkout:ip:${ctx.ip}`, limit: 20, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const agreementId = String(body?.agreementId || '').trim();
  const tenantId = String(body?.tenantId || '').trim();
  const partnerId = String(body?.partnerId || '').trim();
  const packageId = String(body?.packageId || '').trim();
  if (!agreementId || !tenantId || !partnerId || !packageId) {
    return json({ error: 'Missing required fields' }, { status: 400 });
  }

  const stripeKey = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim();
  if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 });

  const baseUrl = baseUrlFromReq(req);
  if (!baseUrl) return json({ error: 'APP_BASE_URL not configured' }, { status: 500 });

  const successUrl = `${baseUrl}/portal/billing?stripe=success&agreementId=${encodeURIComponent(
    agreementId,
  )}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/portal/billing?stripe=cancel&agreementId=${encodeURIComponent(agreementId)}`;

  const priceMap = parseJsonSafe<Record<string, string>>(Deno.env.get('STRIPE_PRICE_MAP_JSON'), {});
  const mappedPrice = (priceMap[packageId] || '').trim();
  const allowDynamic = (Deno.env.get('STRIPE_ALLOW_DYNAMIC_PRICE') || '').trim().toLowerCase() === 'true';

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', successUrl);
  form.set('cancel_url', cancelUrl);
  if (ctx.user.email) form.set('customer_email', ctx.user.email);
  form.set('client_reference_id', partnerId);
  form.set('metadata[agreementId]', agreementId);
  form.set('metadata[tenantId]', tenantId);
  form.set('metadata[partnerId]', partnerId);
  form.set('metadata[packageId]', packageId);
  // Also stamp metadata onto the payment intent so it’s present in PI webhooks.
  form.set('payment_intent_data[metadata][agreementId]', agreementId);
  form.set('payment_intent_data[metadata][tenantId]', tenantId);
  form.set('payment_intent_data[metadata][partnerId]', partnerId);
  form.set('payment_intent_data[metadata][packageId]', packageId);

  if (mappedPrice) {
    form.set('line_items[0][price]', mappedPrice);
    form.set('line_items[0][quantity]', '1');
  } else if (allowDynamic) {
    const amountCents = typeof body.amountCents === 'number' ? Math.round(body.amountCents) : 0;
    if (!Number.isFinite(amountCents) || amountCents < 50) return json({ error: 'Invalid amountCents' }, { status: 400 });
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(amountCents));
    form.set('line_items[0][price_data][product_data][name]', `Finely Cred — ${packageId}`);
    form.set('line_items[0][quantity]', '1');
  } else {
    return json({
      error:
        'Stripe pricing not configured. Set STRIPE_PRICE_MAP_JSON (recommended) or enable STRIPE_ALLOW_DYNAMIC_PRICE for test/dev.',
    }, { status: 500 });
  }

  try {
    const out = await stripePost({
      secretKey: stripeKey,
      path: 'checkout/sessions',
      form,
      idempotencyKey: `agree_${agreementId}`,
    });

    await logEdgeEvent({
      namespace: 'stripe',
      level: 'info',
      event: 'checkout_session_created',
      meta: {
        userId: ctx.user.id,
        ip: ctx.ip,
        agreementId,
        partnerId,
        tenantId,
        packageId,
        sessionId: out?.id ?? null,
        livemode: out?.livemode ?? null,
      },
    });

    return json({ ok: true, sessionId: out?.id, url: out?.url });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'stripe',
      level: 'error',
      event: 'checkout_session_create_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, agreementId, partnerId, packageId, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Stripe request failed' }, { status: 500 });
  }
});

