// Finely Cred CMO Phase 4 webhook ingest stub.
// Add provider signature verification before enabling real public webhooks.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const provider = new URL(req.url).searchParams.get('provider') ?? 'unknown';
    const payload = await req.json().catch(() => ({}));
    return Response.json({
      ok: true,
      provider,
      eventType: payload.eventType ?? 'unknown',
      message: 'Webhook received. Wire signature verification + Supabase insert before production use.',
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
