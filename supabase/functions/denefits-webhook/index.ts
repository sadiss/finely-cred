// Supabase Edge Function: denefits-webhook
// Receives Denefits webhooks and logs them into Deno KV.
//
// Secrets:
// - DENEFITS_WEBHOOK_SECRET (shared secret)
//
// Signature strategy (best-effort, since Denefits signature formats can vary by configuration):
// - If header `x-denefits-webhook-secret` is present, it must equal the secret.
// - Else if header `x-denefits-signature` is present (hex), treat it as HMAC-SHA256 of the raw body using the secret.

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAuth, requireAllowlistedEmail, requireIdempotency } from '../_shared/edgeGuard.ts';

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Admin-only: list recent Denefits webhook events for diagnostics/analytics.
  if (req.method === 'GET') {
    let ctx: Awaited<ReturnType<typeof requireAuth>>;
    try {
      ctx = await requireAuth(req);
      requireAllowlistedEmail(ctx);
    } catch (e) {
      return json({ ok: false, error: (e as Error)?.message || 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get('limit') || 50);
    const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? Math.round(limitRaw) : 50));

    try {
      const kv = await Deno.openKv();
      const events: any[] = [];
      for await (const entry of kv.list({ prefix: ['evt', 'denefits'] }, { limit, reverse: true })) {
        if (entry?.value) events.push(entry.value);
      }
      return json({ ok: true, events });
    } catch (e) {
      return json({ ok: false, error: (e as Error)?.message || 'KV list failed' }, { status: 500 });
    }
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  const rl = await rateLimit({ key: `denefits-webhook:ip:${ip}`, limit: 300, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  const secret = (Deno.env.get('DENEFITS_WEBHOOK_SECRET') || '').trim();
  if (!secret) return json({ error: 'DENEFITS_WEBHOOK_SECRET missing' }, { status: 500 });

  const body = await req.text();

  const direct = (req.headers.get('x-denefits-webhook-secret') || '').trim();
  const sig = (req.headers.get('x-denefits-signature') || '').trim();

  let verified = false;
  if (direct) {
    verified = direct === secret;
  } else if (sig) {
    const computed = await hmacSha256Hex(secret, body);
    try {
      verified = safeEqual(hexToBytes(sig.replace(/^sha256=/i, '')), hexToBytes(computed));
    } catch {
      verified = false;
    }
  }

  if (!verified) {
    await logEdgeEvent({ namespace: 'denefits', level: 'warn', event: 'signature_invalid', meta: { ip } });
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  let evt: any;
  try {
    evt = JSON.parse(body);
  } catch {
    evt = { raw: body };
  }

  const eventId =
    String(evt?.id || evt?.event_id || evt?.eventId || '').trim() ||
    `${new Date().toISOString()}_${crypto.randomUUID()}`;
  const eventType = String(evt?.type || evt?.event_type || evt?.eventType || 'webhook').trim();

  const first = await requireIdempotency({ namespace: 'denefits-webhook', key: eventId, ttlSeconds: 60 * 60 * 24 * 14 });
  if (!first) return json({ ok: true, deduped: true });

  await logEdgeEvent({
    namespace: 'denefits',
    level: 'info',
    event: 'webhook',
    meta: {
      ip,
      eventId,
      type: eventType,
      merchantId: evt?.merchant_id ?? evt?.merchantId ?? null,
      contractId: evt?.contract_id ?? evt?.contractId ?? null,
      agreementId: evt?.agreement_id ?? evt?.agreementId ?? null,
      status: evt?.status ?? null,
      metadata: evt?.metadata ?? null,
    },
  });

  try {
    const agreementId = String(evt?.agreement_id ?? evt?.agreementId ?? '').trim();
    const contractId = String(evt?.contract_id ?? evt?.contractId ?? '').trim();
    const keyId = agreementId || contractId;
    if (keyId) {
      const kv = await Deno.openKv();
      await kv.set(
        ['denefits', 'agreement', keyId],
        {
          id: keyId,
          kind: agreementId ? 'agreement' : 'contract',
          at: new Date().toISOString(),
          eventId,
          type: eventType,
          merchantId: evt?.merchant_id ?? evt?.merchantId ?? null,
          contractId: contractId || null,
          agreementId: agreementId || null,
          status: evt?.status ?? null,
        },
        { expireIn: 1000 * 60 * 60 * 24 * 14 },
      );
    }
  } catch {
    // ignore
  }

  return json({ ok: true });
});

