// Supabase Edge Function: lead-intel-fetch-proxy
//
// Minimal server-side fetch proxy for the overnight50 lead-intel swarm's live source
// fetchers (src/features/overnight50/liveLeadFetchers.ts). Exists purely to dodge
// browser CORS: most public directory / RSS targets (bbb.org, craigslist.org,
// reddit.com, ...) don't send Access-Control-Allow-Origin, so a direct fetch() from the
// Vite SPA is blocked before the response body is ever visible to client JS. This
// function performs the same GET server-to-server (no CORS involved) and returns the
// raw response text for the client to parse.
//
// Security: requires a Supabase session (or the public anon key, which is IP
// rate-limited) — see resolveAuthContext — and only proxies to an explicit hostname
// allowlist to avoid turning this into an open SSRF relay.

import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, rateLimit, resolveAuthContext } from '../_shared/edgeGuard.ts';

const ALLOWED_HOST_SUFFIXES = [
  'reddit.com',
  'craigslist.org',
  'bbb.org',
  'hn.algolia.com',
  'ycombinator.com',
  'indeed.com',
  'yelp.com',
  'google.com',
  'meetup.com',
  'chamberofcommerce.com',
];

const FETCH_TIMEOUT_MS = 9000;
const MAX_RESPONSE_BYTES = 750_000;
const BROWSER_LIKE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function isAllowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    const allowed = ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
    return allowed ? u : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let ctx;
  try {
    ctx = await resolveAuthContext(req);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req) || 'unknown';
  const limit = await rateLimit({ key: `lead_intel_fetch_proxy:${ctx.user.id}:${ip}`, limit: 120, windowSeconds: 60 * 60 });
  if (!limit.ok) {
    return json({ ok: false, error: 'Rate limit exceeded for lead-intel-fetch-proxy' }, { status: 429 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const target = isAllowedUrl((body.url || '').trim());
  if (!target) {
    return json({ ok: false, error: 'URL missing, invalid, or not on the lead-intel fetch allowlist' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_LIKE_UA,
        Accept: 'application/rss+xml, application/atom+xml, application/json, text/html;q=0.9, */*;q=0.8',
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return json({ ok: false, error: `Upstream HTTP ${res.status}`, status: res.status });
    }
    const full = await res.text();
    const text = full.length > MAX_RESPONSE_BYTES ? full.slice(0, MAX_RESPONSE_BYTES) : full;
    return json({ ok: true, status: res.status, text });
  } catch (e) {
    clearTimeout(timer);
    const message = e instanceof Error ? e.message : 'Upstream fetch failed';
    return json({ ok: false, error: controller.signal.aborted ? 'Upstream fetch timed out' : message });
  }
});
