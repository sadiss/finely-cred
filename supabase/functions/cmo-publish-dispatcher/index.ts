// Finely Cred CMO Phase 4 publish dispatcher.
// Default behavior is approval-first and manual-safe. Provider API calls should be added only after OAuth, platform approval, and compliance review.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { jobId, provider, approved } = body;
    if (!jobId || !provider) {
      return Response.json({ ok: false, error: 'jobId and provider are required' }, { status: 400, headers: corsHeaders });
    }
    if (!approved) {
      return Response.json({ ok: false, status: 'needs_human_approval', message: 'External publishing requires approval.' }, { status: 202, headers: corsHeaders });
    }
    return Response.json({
      ok: false,
      status: 'provider_stub',
      jobId,
      provider,
      message: 'Dispatcher is installed but provider-specific publishing is intentionally disabled until credentials, scopes, app review, and per-platform tests are complete.',
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
