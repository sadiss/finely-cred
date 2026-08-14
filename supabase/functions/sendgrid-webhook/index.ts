// Supabase Edge Function: sendgrid-webhook
// SendGrid Event Webhook receiver — bounce/complaint events → comms_suppression.
//
// Note: `email-webhook/index.ts` already exists as a generic multi-provider
// (Resend/SendGrid/SES) event *logger* (writes to `email_webhook_events`),
// but it never calls suppression logic for any provider. This function is
// SendGrid-specific and adds the actual suppression side-effect on
// bounce/complaint events, following the same admin-client + `_shared`
// helper pattern as `meta-webhook/index.ts`.
//
// POST /functions/v1/sendgrid-webhook
// Body: SendGrid Event Webhook payload — a JSON array of event objects
// (https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/event).
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Optional: SENDGRID_WEBHOOK_PUBLIC_KEY (base64 SPKI ECDSA P-256 public key
// from SendGrid's Event Webhook "Signed Event Webhook Requests" setting) —
// when set, every request's `X-Twilio-Email-Event-Webhook-Signature` /
// `-Timestamp` headers are verified before processing. When unset, requests
// are only accepted in DENO_ENV=development (same fail-safe pattern as
// `meta-webhook/index.ts`'s META_APP_SECRET check).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireEnv } from '../_shared/edgeGuard.ts';
import { recordSuppressionServerSide } from '../_shared/commsSuppressionCheck.ts';

/** SendGrid event types that should add a suppression row — see comms_suppression's `reason` column. */
const SUPPRESSION_REASON_BY_EVENT: Record<string, string> = {
  bounce: 'bounce',
  spamreport: 'complaint',
};

function adminClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

/** DER (ASN.1 SEQUENCE{INTEGER r, INTEGER s}) → raw IEEE P1363 (r||s) fixed-width, as required by Web Crypto's ECDSA `verify`. */
function derToRawEcdsaSignature(der: Uint8Array, componentLength = 32): Uint8Array {
  let offset = 0;
  if (der[offset++] !== 0x30) throw new Error('Invalid DER signature: missing SEQUENCE tag');
  let seqLen = der[offset++];
  if (seqLen & 0x80) offset += seqLen & 0x7f; // skip long-form length bytes

  function readInt(): Uint8Array {
    if (der[offset++] !== 0x02) throw new Error('Invalid DER signature: missing INTEGER tag');
    const len = der[offset++];
    let bytes = der.slice(offset, offset + len);
    offset += len;
    while (bytes.length > 0 && bytes[0] === 0x00) bytes = bytes.slice(1);
    return bytes;
  }

  const r = readInt();
  const s = readInt();
  if (r.length > componentLength || s.length > componentLength) {
    throw new Error('Invalid DER signature: component too long');
  }
  const out = new Uint8Array(componentLength * 2);
  out.set(r, componentLength - r.length);
  out.set(s, componentLength * 2 - s.length);
  return out;
}

async function importSendGridPublicKey(base64Der: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Der), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('spki', raw, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
}

async function verifySendGridSignature(args: {
  publicKeyBase64: string;
  signatureBase64: string;
  timestamp: string;
  rawBody: string;
}): Promise<boolean> {
  const key = await importSendGridPublicKey(args.publicKeyBase64);
  const rawSignature = derToRawEcdsaSignature(Uint8Array.from(atob(args.signatureBase64), (c) => c.charCodeAt(0)));
  const data = new TextEncoder().encode(args.timestamp + args.rawBody);
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, rawSignature, data);
}

type SendGridEvent = {
  event?: string;
  email?: string;
  reason?: string;
  type?: string;
  sg_message_id?: string;
  timestamp?: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const publicKeyBase64 = (Deno.env.get('SENDGRID_WEBHOOK_PUBLIC_KEY') || '').trim();
    const signature = req.headers.get('X-Twilio-Email-Event-Webhook-Signature');
    const timestamp = req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp');

    if (publicKeyBase64) {
      const verified =
        signature && timestamp
          ? await verifySendGridSignature({ publicKeyBase64, signatureBase64: signature, timestamp, rawBody }).catch(() => false)
          : false;
      if (!verified) {
        await logEdgeEvent({ namespace: 'sendgrid-webhook', level: 'warn', event: 'invalid_signature', meta: {} });
        return json({ ok: false, error: 'Invalid SendGrid webhook signature' }, { status: 401, headers: corsHeaders });
      }
    } else if (Deno.env.get('DENO_ENV') !== 'development') {
      return json({ ok: false, error: 'SENDGRID_WEBHOOK_PUBLIC_KEY required for webhook POST' }, { status: 503, headers: corsHeaders });
    }

    const parsed = rawBody ? JSON.parse(rawBody) : [];
    const events: SendGridEvent[] = Array.isArray(parsed) ? parsed : [parsed];
    const admin = adminClient();

    let suppressed = 0;
    let skipped = 0;
    for (const evt of events) {
      const eventType = String(evt.event ?? '').toLowerCase();
      const reason = SUPPRESSION_REASON_BY_EVENT[eventType];
      const email = typeof evt.email === 'string' ? evt.email : undefined;
      if (!reason || !email) {
        skipped += 1;
        continue;
      }

      const result = await recordSuppressionServerSide(admin, {
        email,
        channel: 'email',
        reason,
        note: evt.reason || evt.type || eventType,
        tenantId: 'finely_cred',
      });

      if (result.ok) suppressed += 1;
      await logEdgeEvent({
        namespace: 'sendgrid-webhook',
        level: result.ok ? 'info' : 'warn',
        event: 'suppression_processed',
        meta: { eventType, email, ok: result.ok, error: result.error, messageId: evt.sg_message_id },
      });
    }

    return json({ ok: true, received: events.length, suppressed, skipped }, { headers: corsHeaders });
  } catch (e: unknown) {
    await logEdgeEvent({ namespace: 'sendgrid-webhook', level: 'error', event: 'error', meta: { message: (e as Error)?.message } });
    return json({ ok: false, error: (e as Error)?.message ?? 'sendgrid-webhook failed' }, { status: 500, headers: corsHeaders });
  }
});
