// Supabase Edge Function: partner-prospector
// Discover extra public B2B referral partners (Serper) + persist scored batches.
// Never sends outreach. Never invents emails/phones.
//
// Secrets:
// - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (persist)
// - EDGE_ADMIN_EMAILS
// - SERPER_API_KEY (optional — discover no-ops without it)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type Vertical = 'tax' | 'bhph' | 'realtor' | 'mortgage' | 'immigration' | 'community';

const SEARCH: Record<Vertical, string> = {
  tax: 'CPA tax preparer {city} FL -credit -repair',
  bhph: 'buy here pay here dealer {city} FL',
  realtor: 'realtor office {city} Florida -credit -repair',
  mortgage: 'mortgage broker loan officer {city} FL',
  immigration: 'immigration attorney notary multiservice {city} FL',
  community: 'Haitian money transfer {city} FL',
};

const METRO_CITY: Record<string, { city: string; location: string }> = {
  miami: { city: 'Miami', location: 'Miami, Florida, United States' },
  north_miami: { city: 'North Miami', location: 'North Miami, Florida, United States' },
  miami_gardens: { city: 'Miami Gardens', location: 'Miami Gardens, Florida, United States' },
  hollywood: { city: 'Hollywood', location: 'Hollywood, Florida, United States' },
  fort_lauderdale: { city: 'Fort Lauderdale', location: 'Fort Lauderdale, Florida, United States' },
  miramar: { city: 'Miramar', location: 'Miramar, Florida, United States' },
  homestead: { city: 'Homestead', location: 'Homestead, Florida, United States' },
  west_palm: { city: 'West Palm Beach', location: 'West Palm Beach, Florida, United States' },
};

function safeUrl(u: string): string {
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

async function serperSearch(apiKey: string, q: string, location: string, num: number) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, gl: 'us', location, num: Math.max(1, Math.min(10, num)) }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Search API error: ${res.status}`);
  const payload = JSON.parse(txt) as { organic?: Array<{ title?: string; link?: string; snippet?: string }> };
  return payload.organic ?? [];
}

function guessVertical(title: string, snippet: string, fallback: Vertical): Vertical {
  const hay = `${title} ${snippet}`.toLowerCase();
  if (/\b(tax|cpa|accountant)\b/.test(hay)) return 'tax';
  if (/\b(buy here pay here|used car|dealer)\b/.test(hay)) return 'bhph';
  if (/\b(realtor|real estate|realty)\b/.test(hay)) return 'realtor';
  if (/\b(mortgage|loan officer|lender)\b/.test(hay)) return 'mortgage';
  if (/\b(immigration|notary|multiservice)\b/.test(hay)) return 'immigration';
  if (/\b(transfer|remittance|moneygram)\b/.test(hay)) return 'community';
  return fallback;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireAllowlistedEmail(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rlUser = await rateLimit({ key: `partner-prospector:user:${ctx.user.id}`, limit: 8, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `partner-prospector:ip:${ctx.ip}`, limit: 20, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = String(body?.action || 'discover');

  if (action === 'discover') {
    const apiKey = (Deno.env.get('SERPER_API_KEY') || '').trim();
    if (!apiKey) {
      await logEdgeEvent({
        namespace: 'partner-prospector',
        level: 'info',
        event: 'discover_skipped_no_key',
        meta: { userId: ctx.user.id },
      });
      return json({ ok: true, candidates: [], note: 'SERPER_API_KEY not configured; client seed still runs.' });
    }

    const metros = (Array.isArray(body.metros) ? body.metros : Object.keys(METRO_CITY)).slice(0, 8);
    const verticals = (Array.isArray(body.verticals) ? body.verticals : ['tax', 'bhph', 'realtor', 'mortgage', 'immigration']) as Vertical[];
    const limit = Math.max(1, Math.min(20, Number(body.limit ?? 10)));
    const candidates: any[] = [];

    for (const vertical of verticals.slice(0, 6)) {
      for (const metro of metros.slice(0, 4)) {
        const pack = METRO_CITY[metro] ?? { city: 'Miami', location: 'Miami, Florida, United States' };
        const q = (SEARCH[vertical] || SEARCH.tax).replaceAll('{city}', pack.city);
        try {
          const organic = await serperSearch(apiKey, q, pack.location, 5);
          for (const row of organic) {
            const website = safeUrl(row.link || '');
            if (!website) continue;
            candidates.push({
              businessName: row.title || '',
              city: pack.city,
              metro,
              vertical: guessVertical(row.title || '', row.snippet || '', vertical),
              website,
              snippet: row.snippet || '',
              sourceUrls: [website],
              sources: ['serper'],
            });
          }
        } catch (e) {
          await logEdgeEvent({
            namespace: 'partner-prospector',
            level: 'warn',
            event: 'search_query_failed',
            meta: { error: (e as Error).message, vertical, metro },
          });
        }
        if (candidates.length >= limit) break;
      }
      if (candidates.length >= limit) break;
    }

    await logEdgeEvent({
      namespace: 'partner-prospector',
      level: 'info',
      event: 'discover_completed',
      meta: { userId: ctx.user.id, returned: candidates.length },
    });
    return json({ ok: true, candidates: candidates.slice(0, limit) });
  }

  if (action === 'persist') {
    const result = body?.result;
    if (!result?.batchId || !Array.isArray(result.prospects)) {
      return json({ error: 'Missing result' }, { status: 400 });
    }
    const service = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
    if (!service) return json({ ok: false, error: 'Service role not configured; local persist still applies.' });
    const supabase = createClient(ctx.supabaseUrl, service);
    const { error: runErr } = await supabase.from('partner_prospector_runs').upsert({
      id: result.batchId,
      batch_id: result.batchId,
      params: result.params ?? {},
      stats: result.stats ?? {},
      source: result.source ?? 'seed',
      created_by: ctx.user.email ?? ctx.user.id,
    });
    if (runErr) return json({ ok: false, error: runErr.message }, { status: 500 });

    const rows = (result.prospects as any[]).map((p) => ({
      id: p.id,
      batch_id: result.batchId,
      business_name: p.businessName,
      person_name: p.personName ?? '',
      title: p.title ?? '',
      city: p.city ?? '',
      metro: p.metro ?? '',
      category: p.category ?? '',
      vertical: p.vertical,
      geo: p.geo ?? '',
      website: p.website ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      icp_fit: p.icpFit,
      why_fit: p.whyFit ?? '',
      source_urls: p.sourceUrls ?? [],
      sources: p.sources ?? [],
      status: p.status ?? 'new',
      draft_stub: p.draftStub ?? '',
      dedupe_key: p.dedupeKey ?? '',
      score: p.score ?? 0,
      skip_reason: p.skipReason ?? null,
    }));
    const { error: rowErr } = await supabase.from('partner_prospects').upsert(rows);
    if (rowErr) return json({ ok: false, error: rowErr.message }, { status: 500 });

    await logEdgeEvent({
      namespace: 'partner-prospector',
      level: 'info',
      event: 'persist_completed',
      meta: { userId: ctx.user.id, batchId: result.batchId, kept: rows.length },
    });
    return json({ ok: true, persisted: rows.length });
  }

  return json({ error: 'Unknown action' }, { status: 400 });
});
