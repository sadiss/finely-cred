// Supabase Edge Function: meta-webhook
// Meta webhook verify + ingest messages + Lead Ads (Phase 3).
//
// Secrets: META_VERIFY_TOKEN, META_APP_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireEnv } from '../_shared/edgeGuard.ts';

function hexFromBuffer(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): Promise<boolean> {
  if (!signatureHeader || !appSecret) return false;
  const expected = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const actual = hexFromBuffer(sig);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) {
    mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function adminClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}

async function ingestLeadgen(args: { leadgenId: string; formId: string; pageId: string; createdAt: string }) {
  const leadId = `lead_meta_${args.leadgenId}`;
  const admin = adminClient();
  const { error } = await admin.from('lead_captures').upsert(
    {
      id: leadId,
      source: 'agent',
      offer: 'general_inquiry',
      interest: 'meta_lead_ad',
      full_name: 'Meta Lead',
      email: `meta+${args.leadgenId}@lead.local`,
      phone: null,
      consent_to_contact: true,
      referral_source: 'meta_lead_form',
      funnel_path: '/admin/social-hub',
      utm_source: 'facebook',
      utm_medium: 'lead_ad',
      utm_campaign: args.formId,
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(error.message);
  return leadId;
}

async function ingestMessage(args: {
  id: string;
  pageId: string;
  threadId: string;
  channel: string;
  text: string;
  createdAt: string;
}) {
  const admin = adminClient();
  const { error } = await admin.from('meta_inbox_messages').upsert(
    {
      id: args.id,
      tenant_id: 'finely_cred',
      page_id: args.pageId,
      thread_id: args.threadId,
      channel: args.channel,
      direction: 'inbound',
      text: args.text,
      created_at: args.createdAt,
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(error.message);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = Deno.env.get('META_VERIFY_TOKEN');
    if (!verifyToken) {
      return json({ ok: false, error: 'META_VERIFY_TOKEN not configured' }, { status: 503, headers: corsHeaders });
    }
    if (mode === 'subscribe' && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const appSecret = Deno.env.get('META_APP_SECRET') ?? '';
    const signature = req.headers.get('X-Hub-Signature-256') ?? req.headers.get('X-Hub-Signature');

    if (appSecret) {
      const ok = await verifyMetaSignature(rawBody, signature, appSecret);
      if (!ok) {
        return json({ ok: false, error: 'Invalid Meta webhook signature' }, { status: 401, headers: corsHeaders });
      }
    } else if (Deno.env.get('DENO_ENV') !== 'development') {
      return json({ ok: false, error: 'META_APP_SECRET required for webhook POST' }, { status: 503, headers: corsHeaders });
    }

    const body = rawBody ? JSON.parse(rawBody) : {};
    let leads = 0;
    let messages = 0;

    if (body.object === 'page') {
      for (const entry of body.entry ?? []) {
        const pageId = String(entry.id ?? '');

        for (const change of entry.changes ?? []) {
          if (change.field === 'leadgen') {
            const v = change.value ?? {};
            await ingestLeadgen({
              leadgenId: String(v.leadgen_id ?? crypto.randomUUID()),
              formId: String(v.form_id ?? ''),
              pageId: String(v.page_id ?? pageId),
              createdAt: new Date(Number(v.created_time ?? Date.now()) * 1000).toISOString(),
            });
            leads += 1;
          }
        }

        for (const msg of entry.messaging ?? []) {
          const text = msg.message?.text ?? msg.postback?.title ?? '';
          if (!text) continue;
          const mid = String(msg.message?.mid ?? `msg_${crypto.randomUUID()}`);
          await ingestMessage({
            id: mid,
            pageId,
            threadId: String(msg.sender?.id ?? 'unknown'),
            channel: 'messenger',
            text,
            createdAt: new Date(Number(msg.timestamp ?? Date.now())).toISOString(),
          });
          messages += 1;
        }
      }
    }

    await logEdgeEvent({
      namespace: 'meta-webhook',
      level: 'info',
      event: 'ingest',
      meta: { object: body.object, leads, messages },
    });

    return json({ ok: true, received: body.object ?? 'unknown', leads, messages }, { headers: corsHeaders });
  } catch (e: unknown) {
    await logEdgeEvent({
      namespace: 'meta-webhook',
      level: 'error',
      event: 'error',
      meta: { message: (e as Error)?.message },
    });
    return json({ ok: false, error: (e as Error)?.message ?? 'meta-webhook failed' }, { status: 500, headers: corsHeaders });
  }
});
