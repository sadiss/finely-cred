// Supabase Edge Function: finely-bridge-webhook
// Fund-ready webhook for Provider Gateway / Bridge — sets handoff timestamp, creates underwriting tasks.
//
// Secrets: FINELY_BRIDGE_WEBHOOK_SECRET (optional)
//
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { handleFundReadyBridgeHandoff } from '../_shared/finelyBridgeHandoff.ts';
import { json, logEdgeEvent, requireEnv } from '../_shared/edgeGuard.ts';

async function hmacSha256Hex(secret: string, payload: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, payload);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  const secret = (Deno.env.get('FINELY_BRIDGE_WEBHOOK_SECRET') || '').trim();
  const bodyBytes = new Uint8Array(await req.arrayBuffer());
  const bodyText = new TextDecoder().decode(bodyBytes);

  if (secret) {
    const sigHeader = (req.headers.get('x-bridge-signature') || req.headers.get('x-signature') || '').trim();
    const computed = await hmacSha256Hex(secret, bodyBytes);
    if (!timingSafeEqual(computed, sigHeader.replace(/^sha256=/i, ''))) {
      return json({ ok: false, error: 'Invalid signature' }, { status: 401 });
    }
  }

  let parsed: any;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const event = String(parsed?.event ?? parsed?.action ?? 'fund_ready').toLowerCase();
  if (event !== 'fund_ready' && event !== 'bridge.fund_ready') {
    return json({ ok: false, error: 'Unsupported event' }, { status: 400 });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const handoff = await handleFundReadyBridgeHandoff(admin, {
    partnerId: parsed?.partnerId ?? parsed?.finelyPartnerId,
    email: parsed?.email ?? parsed?.partnerEmail,
    force: Boolean(parsed?.force),
  });

  if (!handoff.ok) {
    await logEdgeEvent({ namespace: 'finely-bridge', level: 'warn', event: 'fund_ready.blocked', meta: { error: handoff.error } });
    return json({ ok: false, error: handoff.error }, { status: 422 });
  }

  await logEdgeEvent({
    namespace: 'finely-bridge',
    level: 'info',
    event: 'fund_ready.handoff',
    meta: { partnerId: handoff.partnerId, tasks: handoff.result.bridgeTasksCreated },
  });

  return json({
    ok: true,
    partnerId: handoff.partnerId,
    bridgeSuggestion: handoff.result.bridgeSuggestion,
    bridgeTasksCreated: handoff.result.bridgeTasksCreated,
    bridgeHandoffSuggestedAt: handoff.result.bridgeHandoffSuggestedAt,
    creditPhase: handoff.result.creditPhase,
  });
});
