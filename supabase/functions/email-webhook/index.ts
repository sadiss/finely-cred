// Finely Cred — inbound email provider webhooks (Resend / SendGrid / SES).
// POST /functions/v1/email-webhook?provider=resend|sendgrid|ses

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-signature',
};

type Provider = 'resend' | 'sendgrid' | 'ses' | 'unknown';

function parseProvider(url: URL, payload: Record<string, unknown>): Provider {
  const q = url.searchParams.get('provider');
  if (q === 'resend' || q === 'sendgrid' || q === 'ses') return q;
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === 'object') return 'sendgrid';
  if (payload.type && String(payload.type).startsWith('email.')) return 'resend';
  if (payload.eventType && String(payload.eventType).includes('Delivery')) return 'ses';
  return 'unknown';
}

function extractEvent(provider: Provider, payload: Record<string, unknown>) {
  if (provider === 'resend') {
    return {
      eventType: String(payload.type ?? 'unknown'),
      messageId: String((payload.data as any)?.email_id ?? payload.id ?? ''),
      recipient: String((payload.data as any)?.to?.[0] ?? ''),
    };
  }
  if (provider === 'sendgrid' && Array.isArray(payload)) {
    const first = payload[0] as Record<string, unknown>;
    return {
      eventType: String(first.event ?? 'unknown'),
      messageId: String(first.sg_message_id ?? ''),
      recipient: String(first.email ?? ''),
    };
  }
  if (provider === 'ses') {
    return {
      eventType: String(payload.eventType ?? payload.notificationType ?? 'unknown'),
      messageId: String((payload.mail as any)?.messageId ?? ''),
      recipient: String((payload.mail as any)?.destination?.[0] ?? ''),
    };
  }
  return {
    eventType: String(payload.eventType ?? payload.type ?? 'unknown'),
    messageId: String(payload.messageId ?? payload.id ?? ''),
    recipient: String(payload.recipient ?? payload.email ?? ''),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const raw = await req.json().catch(() => ({}));
    const payload = raw as Record<string, unknown>;
    const provider = parseProvider(url, payload);
    const { eventType, messageId, recipient } = extractEvent(provider, payload);
    const id = `ewh_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
    const receivedAt = new Date().toISOString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && serviceKey) {
      const sb = createClient(supabaseUrl, serviceKey);
      await sb.from('email_webhook_events').insert({
        id,
        tenant_id: 'finely_cred',
        provider,
        event_type: eventType,
        message_id: messageId || null,
        recipient: recipient || null,
        payload,
        received_at: receivedAt,
      });
    }

    return Response.json(
      { ok: true, id, provider, eventType, messageId, recipient, receivedAt },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
