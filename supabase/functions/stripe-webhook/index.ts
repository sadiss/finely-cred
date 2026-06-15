// Supabase Edge Function: stripe-webhook
// Receives Stripe webhooks (signature verified) and logs them into Deno KV.
//
// Secrets:
// - STRIPE_WEBHOOK_SECRET

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireIdempotency, rateLimit } from '../_shared/edgeGuard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function parseJsonSafe<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function entitlementKeysForPackage(packageId: string): string[] {
  const map = parseJsonSafe<Record<string, string[]>>(Deno.env.get('PACKAGE_ENTITLEMENTS_JSON'), {});
  const keys = map[packageId] ?? [];
  return Array.from(new Set((keys ?? []).map((x) => String(x || '').trim()).filter(Boolean)));
}

async function activateAgreementInDb(args: {
  tenantId: string;
  partnerId: string;
  agreementId: string;
  packageId: string;
  amountCents: number;
  externalRef?: string | null;
  livemode?: boolean | null;
  eventId: string;
  eventType: string;
}) {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim();
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase service env not configured');

  const admin = createClient(supabaseUrl, serviceKey);
  const at = nowIso();

  // Idempotency at the DB layer as well: one activation event per Stripe event.
  const evtId = `stripe_evt_${args.eventId}`;

  // Upsert agreement: mark active.
  const agreementPatch: any = {
    id: args.agreementId,
    tenant_id: args.tenantId,
    partner_id: args.partnerId,
    package_id: args.packageId,
    rail: 'stripe',
    status: 'active',
    amount_cents: Math.max(0, Math.round(args.amountCents || 0)),
    external_ref: args.externalRef || null,
    updated_at: at,
    started_at: at,
  };

  // Best-effort: create agreement row if it doesn't exist, then update.
  const { error: upsertAgreementErr } = await admin.from('agreements').upsert(agreementPatch, { onConflict: 'id' });
  if (upsertAgreementErr) throw new Error(`agreements upsert failed: ${upsertAgreementErr.message}`);

  // Log an agreement event (dedupe by deterministic id).
  await admin.from('agreement_events').upsert(
    {
      id: evtId,
      agreement_id: args.agreementId,
      kind: args.eventType,
      payload: {
        eventId: args.eventId,
        eventType: args.eventType,
        livemode: args.livemode ?? null,
        activatedAt: at,
      },
      created_at: at,
    },
    { onConflict: 'id' },
  );

  const keys = entitlementKeysForPackage(args.packageId);
  if (!keys.length) {
    await logEdgeEvent({
      namespace: 'stripe',
      level: 'warn',
      event: 'no_entitlements_configured',
      meta: { packageId: args.packageId, agreementId: args.agreementId, partnerId: args.partnerId },
    });
    return { ok: true, granted: 0 };
  }

  const rows = keys.map((k) => ({
    id: `ent_${args.partnerId}_${k}`.replace(/[^a-zA-Z0-9_\-:.]/g, '_').slice(0, 180),
    tenant_id: args.tenantId,
    partner_id: args.partnerId,
    key: k,
    source_agreement_id: args.agreementId,
    status: 'active',
    starts_at: at,
    ends_at: null,
  }));
  const { error: entErr } = await admin.from('entitlements').upsert(rows, { onConflict: 'partner_id,key' });
  if (entErr) throw new Error(`entitlements upsert failed: ${entErr.message}`);

  return { ok: true, granted: rows.length };
}

function parseStripeSig(header: string): { t: string; v1: string[] } | null {
  const parts = (header || '').split(',').map((s) => s.trim());
  const out: any = { t: '', v1: [] as string[] };
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (!k || !v) continue;
    if (k === 't') out.t = v;
    if (k === 'v1') out.v1.push(v);
  }
  if (!out.t || !out.v1.length) return null;
  return out;
}

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
  // Stripe calls server-to-server; CORS is irrelevant but harmless.
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  // Basic abuse guard (per IP header; Stripe will be a fixed source in practice).
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  const rl = await rateLimit({ key: `stripe-webhook:ip:${ip}`, limit: 300, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  const secret = (Deno.env.get('STRIPE_WEBHOOK_SECRET') || '').trim();
  if (!secret) return json({ error: 'STRIPE_WEBHOOK_SECRET missing' }, { status: 500 });

  const sigHeader = req.headers.get('stripe-signature') || '';
  const parsed = parseStripeSig(sigHeader);
  if (!parsed) return json({ error: 'Missing/invalid Stripe-Signature' }, { status: 400 });

  const body = await req.text();
  const signedPayload = `${parsed.t}.${body}`;
  const computed = await hmacSha256Hex(secret, signedPayload);
  const ok = parsed.v1.some((v) => safeEqual(hexToBytes(v), hexToBytes(computed)));
  if (!ok) {
    await logEdgeEvent({ namespace: 'stripe', level: 'warn', event: 'signature_invalid', meta: { ip } });
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  let evt: any;
  try {
    evt = JSON.parse(body);
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = String(evt?.id || '').trim();
  const eventType = String(evt?.type || '').trim();
  if (!eventId || !eventType) return json({ error: 'Invalid event' }, { status: 400 });

  const first = await requireIdempotency({ namespace: 'stripe-webhook', key: eventId, ttlSeconds: 60 * 60 * 24 * 14 });
  if (!first) {
    return json({ ok: true, deduped: true });
  }

  await logEdgeEvent({
    namespace: 'stripe',
    level: 'info',
    event: 'webhook',
    meta: {
      ip,
      eventId,
      type: eventType,
      created: evt?.created ?? null,
      livemode: evt?.livemode ?? null,
      object: evt?.data?.object?.object ?? null,
      metadata: evt?.data?.object?.metadata ?? null,
    },
  });

  // Bridge: keep a quick lookup for agreement payment signals (used by ops triage).
  try {
    const obj = evt?.data?.object ?? null;
    const meta = obj?.metadata ?? null;
    const agreementId = String(meta?.agreementId || '').trim();
    if (agreementId) {
      const kv = await Deno.openKv();
      await kv.set(
        ['stripe', 'agreement', agreementId],
        {
          agreementId,
          at: new Date().toISOString(),
          eventId,
          type: eventType,
          livemode: evt?.livemode ?? null,
          objectId: obj?.id ?? null,
          object: obj?.object ?? null,
          partnerId: meta?.partnerId ?? null,
          packageId: meta?.packageId ?? null,
        },
        { expireIn: 1000 * 60 * 60 * 24 * 14 },
      );
    }

    const publicKind = String(meta?.kind || '').trim();
    const publicRequestId = String(meta?.requestId || '').trim();
    if (publicKind === 'public_session' && publicRequestId && (eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded')) {
      const kv = await Deno.openKv();
      await kv.set(
        ['stripe', 'public_session', publicRequestId],
        {
          requestId: publicRequestId,
          at: new Date().toISOString(),
          eventId,
          type: eventType,
          sessionId: obj?.id ?? null,
          topic: meta?.topic ?? null,
          paymentStatus: obj?.payment_status ?? null,
          livemode: evt?.livemode ?? null,
        },
        { expireIn: 1000 * 60 * 60 * 24 * 14 },
      );
      await logEdgeEvent({
        namespace: 'stripe',
        level: 'info',
        event: 'public_session_paid',
        meta: { requestId: publicRequestId, eventId, topic: meta?.topic ?? null },
      });
    }
  } catch {
    // ignore
  }

  // Activation: server-side agreement + entitlements.
  try {
    const obj = evt?.data?.object ?? null;
    const meta = obj?.metadata ?? null;

    const agreementId = String(meta?.agreementId || '').trim();
    const tenantId = String(meta?.tenantId || '').trim();
    const partnerId = String(meta?.partnerId || '').trim();
    const packageId = String(meta?.packageId || '').trim();

    // Only activate on paid checkout completion.
    const isCheckoutCompleted = eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded';
    const paymentStatus = String(obj?.payment_status || '').trim().toLowerCase();
    const paid = paymentStatus ? paymentStatus === 'paid' : true; // some event types omit it
    if (isCheckoutCompleted && agreementId && tenantId && partnerId && packageId && paid) {
      const amountCents = Number(obj?.amount_total ?? obj?.amount_subtotal ?? 0) || 0;
      const externalRef = String(obj?.id || '').trim() || null;
      const res = await activateAgreementInDb({
        tenantId,
        partnerId,
        agreementId,
        packageId,
        amountCents,
        externalRef,
        livemode: evt?.livemode ?? null,
        eventId,
        eventType,
      });
      await logEdgeEvent({
        namespace: 'stripe',
        level: 'info',
        event: 'agreement_activated',
        meta: { agreementId, tenantId, partnerId, packageId, granted: res.granted, eventId, eventType, paymentStatus: paymentStatus || null },
      });
    }
  } catch (e) {
    await logEdgeEvent({
      namespace: 'stripe',
      level: 'error',
      event: 'activation_failed',
      meta: { eventId, eventType, error: (e as Error)?.message || String(e) },
    });
    // Don't fail the webhook; Stripe will retry and our idempotency will handle repeats.
  }

  return json({ ok: true });
});

