// Supabase Edge Function: stripe-verify
// Verifies a Stripe Checkout Session belongs to the caller and is paid.
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - STRIPE_SECRET_KEY

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';

type ReqBody = {
  sessionId: string;
  agreementId?: string;
};

async function stripeGet(args: { secretKey: string; path: string }) {
  const res = await fetch(`https://api.stripe.com/v1/${args.path.replace(/^\//, '')}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${args.secretKey}` },
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

  const rlUser = await rateLimit({ key: `stripe-verify:user:${ctx.user.id}`, limit: 20, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `stripe-verify:ip:${ctx.ip}`, limit: 60, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sessionId = String(body?.sessionId || '').trim();
  const agreementId = body?.agreementId ? String(body.agreementId).trim() : '';
  if (!sessionId) return json({ error: 'Missing sessionId' }, { status: 400 });

  const stripeKey = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim();
  if (!stripeKey) return json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 });

  try {
    const s = await stripeGet({
      secretKey: stripeKey,
      path: `checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=payment_intent`,
    });

    // Ownership guard: match customer_email when possible, otherwise rely on metadata.
    const customerEmail = String(s?.customer_details?.email || s?.customer_email || '').trim().toLowerCase();
    const callerEmail = String(ctx.user.email || '').trim().toLowerCase();
    const metaAgreementId = String(s?.metadata?.agreementId || '').trim();
    const metaPartnerId = String(s?.metadata?.partnerId || '').trim();

    const emailOk = callerEmail && customerEmail && callerEmail === customerEmail;
    const agreementOk = agreementId ? metaAgreementId === agreementId : Boolean(metaAgreementId);

    if (!emailOk) {
      // fallback to metadata match only if caller has no email or Stripe didn't attach email
      if (!callerEmail || !customerEmail) {
        if (!agreementOk) throw new Error('Forbidden');
      } else {
        throw new Error('Forbidden');
      }
    }

    if (agreementId && metaAgreementId && metaAgreementId !== agreementId) throw new Error('Agreement mismatch');

    const paid = String(s?.payment_status || '').toLowerCase() === 'paid';
    const out = {
      ok: true,
      sessionId: s?.id ?? sessionId,
      paid,
      paymentStatus: s?.payment_status ?? null,
      status: s?.status ?? null,
      amountTotal: s?.amount_total ?? null,
      currency: s?.currency ?? null,
      customerEmail: customerEmail || null,
      agreementId: metaAgreementId || agreementId || null,
      partnerId: metaPartnerId || null,
      paymentIntentId: s?.payment_intent?.id ?? s?.payment_intent ?? null,
      livemode: s?.livemode ?? null,
    };

    await logEdgeEvent({
      namespace: 'stripe',
      level: 'info',
      event: 'checkout_session_verified',
      meta: { userId: ctx.user.id, ip: ctx.ip, sessionId, paid, agreementId: out.agreementId, partnerId: out.partnerId },
    });

    return json(out);
  } catch (e) {
    await logEdgeEvent({
      namespace: 'stripe',
      level: 'warn',
      event: 'checkout_session_verify_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, sessionId, agreementId, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Verify failed' }, { status: 400 });
  }
});

