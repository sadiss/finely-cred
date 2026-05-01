// Supabase Edge Function: nora-capital-webhook
// Receives webhook events from Nora Capital Group and logs to KV for monitoring.
//
// Secrets:
// - NORA_CAPITAL_WEBHOOK_SECRET (optional)
//
// If secret is configured, we verify a best-effort HMAC-SHA256 signature.
// Supported header names (first match wins):
// - x-nora-signature
// - x-signature
//
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent } from '../_shared/edgeGuard.ts';

async function hmacSha256Hex(secret: string, payload: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, payload);
  const bytes = new Uint8Array(sig);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  const aa = (a || '').trim();
  const bb = (b || '').trim();
  if (!aa || !bb) return false;
  if (aa.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < aa.length; i++) out |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  const secret = (Deno.env.get('NORA_CAPITAL_WEBHOOK_SECRET') || '').trim();
  const sigHeader = (req.headers.get('x-nora-signature') || req.headers.get('x-signature') || '').trim();

  const bodyBytes = new Uint8Array(await req.arrayBuffer());
  const bodyText = new TextDecoder().decode(bodyBytes);
  let parsed: any = null;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    parsed = { raw: bodyText.slice(0, 24_000) };
  }

  if (secret) {
    const computed = await hmacSha256Hex(secret, bodyBytes);
    const ok = timingSafeEqual(computed, sigHeader.replace(/^sha256=/i, ''));
    if (!ok) {
      await logEdgeEvent({ namespace: 'nora-capital', level: 'warn', event: 'webhook.invalid_signature', meta: { hasSig: Boolean(sigHeader) } });
      return json({ ok: false, error: 'Invalid signature' }, { status: 401 });
    }
  }

  await logEdgeEvent({
    namespace: 'nora-capital',
    level: 'info',
    event: 'webhook.received',
    meta: { headers: { 'content-type': req.headers.get('content-type') }, payload: parsed },
  });

  return json({ ok: true });
});

