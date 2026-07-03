// Finely Cred — OAuth callback for Outlook / Gmail / Zoho mail connections.
// GET/POST /functions/v1/comms-oauth-callback?provider=outlook|gmail|zoho&code=…

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Provider = 'outlook' | 'gmail' | 'zoho';

function parseProvider(url: URL): Provider | null {
  const p = url.searchParams.get('provider');
  if (p === 'outlook' || p === 'gmail' || p === 'zoho') return p;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const provider = parseProvider(url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return Response.json({ ok: false, provider, error }, { status: 400, headers: corsHeaders });
    }
    if (!provider || !code) {
      return Response.json(
        { ok: false, error: 'Missing provider or authorization code' },
        { status: 400, headers: corsHeaders },
      );
    }

    // Token exchange wiring: set OUTLOOK_CLIENT_ID/SECRET, GMAIL_*, ZOHO_* in Supabase secrets.
    const clientConfigured = Boolean(
      (provider === 'outlook' && Deno.env.get('OUTLOOK_CLIENT_ID')) ||
        (provider === 'gmail' && Deno.env.get('GMAIL_CLIENT_ID')) ||
        (provider === 'zoho' && Deno.env.get('ZOHO_CLIENT_ID')),
    );

    const siteUrl = (Deno.env.get('FINELY_SITE_URL') ?? 'https://finelycred.com').replace(/\/$/, '');
    const redirectTo = `${siteUrl}/admin/comms?room=settings&oauth=${provider}&connected=1`;

    if (req.headers.get('Accept')?.includes('text/html')) {
      return Response.redirect(redirectTo, 302);
    }

    return Response.json(
      {
        ok: true,
        provider,
        codeReceived: true,
        clientConfigured,
        message: clientConfigured
          ? 'Authorization code received — exchange for tokens server-side and persist in comms_email_connections.'
          : 'Code received — set OAuth client secrets in Supabase, then redeploy.',
        redirectTo,
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
