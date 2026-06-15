// Supabase Edge Function: nora-capital-webhook
// Receives webhook events from Nora Capital Group; updates partner funding_stage.
//
// Secrets:
// - NORA_CAPITAL_WEBHOOK_SECRET (optional)
//
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireEnv } from '../_shared/edgeGuard.ts';

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

const STAGE_MAP: Record<string, string> = {
  not_ready: 'not_ready',
  ready: 'ready',
  submitted: 'submitted',
  in_review: 'in_review',
  review: 'in_review',
  approved: 'funded',
  funded: 'funded',
  declined: 'declined',
  rejected: 'declined',
};

function normalizeStage(raw: unknown): string | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  return STAGE_MAP[s] ?? (s in STAGE_MAP ? STAGE_MAP[s] : s);
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
    meta: { payload: parsed },
  });

  const stage = normalizeStage(parsed?.fundingStage ?? parsed?.stage ?? parsed?.status ?? parsed?.applicationStatus);
  const partnerId = String(parsed?.partnerId ?? parsed?.finelyPartnerId ?? parsed?.externalPartnerId ?? '').trim();
  const email = String(parsed?.email ?? parsed?.partnerEmail ?? '').trim().toLowerCase();
  const applicationId = String(parsed?.applicationId ?? parsed?.id ?? '').trim() || undefined;

  if (stage && (partnerId || email)) {
    try {
      const supabaseUrl = requireEnv('SUPABASE_URL');
      const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
      const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

      let q = admin.from('partners').select('id, funding_meta');
      if (partnerId) q = q.eq('id', partnerId);
      else q = q.filter('profile->>email', 'eq', email);
      const { data: partner } = await q.maybeSingle();

      if (partner) {
        await admin
          .from('partners')
          .update({
            funding_stage: stage,
            funding_meta: {
              ...(partner.funding_meta ?? {}),
              applicationId,
              webhookAt: new Date().toISOString(),
              lastWebhook: parsed,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id);

        await logEdgeEvent({
          namespace: 'nora-capital',
          level: 'info',
          event: 'webhook.partner_updated',
          meta: { partnerId: partner.id, stage, applicationId },
        });
      }
    } catch (e) {
      await logEdgeEvent({
        namespace: 'nora-capital',
        level: 'warn',
        event: 'webhook.partner_update_failed',
        meta: { error: String(e) },
      });
    }
  }

  return json({ ok: true, stage: stage ?? null, partnerId: partnerId || null });
});
