import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const pages = Array.isArray(body.pages) ? body.pages : [];
    const protectedPaths = ['src/components/creditIntel/CreditIntelTabs.tsx'];
    const result = {
      ok: true,
      scannedAt: new Date().toISOString(),
      pageCount: pages.length,
      protectedPaths,
      warnings: pages.filter((p: any) => String(p?.path || '').includes('CreditIntelTabs')).map((p: any) => ({ path: p.path, warning: 'Protected credit report negative-items layout should not be changed.' })),
      recommendation: 'Use command deck, card rail, compact drawer, and paged gallery layouts instead of long lists and cramped side-by-side editors.',
    };
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
});
