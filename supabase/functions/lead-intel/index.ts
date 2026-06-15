// Supabase Edge Function: lead-intel
// Compliant lead discovery + enrichment:
// - Uses a configured Search API (Serper) instead of scraping restricted platforms.
// - Enriches only public web pages and best-effort respects robots.txt ("Disallow: /" for user-agent *).
//
// Secrets:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - EDGE_ADMIN_EMAILS (comma-separated allowlist)
// - SERPER_API_KEY

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';

type Target = 'clients' | 'affiliates' | 'agents' | 'teams' | 'au_sellers' | 'b2b_partners';

type ReqBody = {
  target: Target;
  query: string;
  location?: string;
  country?: string; // e.g. "us"
  limit?: number; // <= 20 recommended
  enrich?: boolean;
};

type SearchResult = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

function norm(s: string) {
  return String(s || '').trim();
}

function safeUrl(u: string): string {
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function fetchRobotsAllows(url: string): Promise<boolean> {
  // Minimal robots support: if robots.txt explicitly disallows everything, skip.
  const host = domainOf(url);
  if (!host) return true;
  try {
    const res = await fetch(`https://${host}/robots.txt`, { method: 'GET' });
    if (!res.ok) return true;
    const txt = (await res.text()) || '';
    const lines = txt.split('\n').map((l) => l.trim());
    let inStar = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('user-agent:')) {
        const ua = lower.slice('user-agent:'.length).trim();
        inStar = ua === '*' || ua === '"*"';
        continue;
      }
      if (!inStar) continue;
      if (lower.startsWith('disallow:')) {
        const path = lower.slice('disallow:'.length).trim();
        if (path === '/' || path === '/*') return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function extractEmails(html: string): string[] {
  const out: string[] = [];
  const re = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  const matches = html.match(re) ?? [];
  for (const m of matches) {
    const v = m.trim().toLowerCase();
    if (v.includes('example.com')) continue;
    if (v.includes('yourname@')) continue;
    out.push(v);
  }
  return uniq(out).slice(0, 8);
}

function extractPhones(html: string): string[] {
  // Best-effort US-ish phone patterns
  const out: string[] = [];
  const re = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const matches = html.match(re) ?? [];
  for (const m of matches) {
    const digits = m.replace(/[^\d]/g, '');
    if (digits.length < 10) continue;
    const last10 = digits.slice(-10);
    out.push(`(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`);
  }
  return uniq(out).slice(0, 8);
}

function extractMeta(html: string): { description?: string; h1?: string } {
  const desc = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html)?.[1];
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]?.replace(/<[^>]+>/g, ' ')?.replace(/\s+/g, ' ')?.trim();
  return { description: desc?.trim(), h1: h1?.trim() };
}

function scoreProspect(args: { target: Target; html?: string; emails: string[]; phones: string[]; url: string; title?: string; snippet?: string }) {
  let score = 10;
  if (args.emails.length) score += 30;
  if (args.phones.length) score += 20;
  if (args.url.includes('/contact')) score += 10;
  const hay = `${args.title ?? ''} ${args.snippet ?? ''} ${args.html ?? ''}`.toLowerCase();
  const bump = (w: string, n: number) => {
    if (hay.includes(w)) score += n;
  };
  if (args.target === 'au_sellers') {
    bump('tradeline', 10);
    bump('authorized user', 10);
    bump('seasoned', 4);
  } else if (args.target === 'affiliates') {
    bump('affiliate', 15);
    bump('partner program', 10);
  } else if (args.target === 'agents' || args.target === 'teams') {
    bump('credit repair', 10);
    bump('financial services', 6);
    bump('sales', 6);
  } else if (args.target === 'clients') {
    bump('fix credit', 8);
    bump('credit repair', 10);
    bump('business credit', 10);
    bump('funding', 6);
  }
  score = Math.max(0, Math.min(100, score));
  return score;
}

async function serperSearch(args: { apiKey: string; q: string; location?: string; gl?: string; num: number }): Promise<SearchResult[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': args.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: args.q,
      gl: args.gl ?? 'us',
      location: args.location ?? undefined,
      num: Math.max(1, Math.min(20, args.num)),
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Search API error: ${res.status} ${txt}`);
  const json = JSON.parse(txt) as any;
  const organic = (json?.organic ?? []) as any[];
  return organic.map((o, i) => ({
    title: o?.title,
    link: o?.link,
    snippet: o?.snippet,
    position: o?.position ?? i + 1,
  }));
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

  const rlUser = await rateLimit({ key: `lead-intel:user:${ctx.user.id}`, limit: 10, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `lead-intel:ip:${ctx.ip}`, limit: 30, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const target = (body?.target || 'clients') as Target;
  const query = norm(body?.query);
  const location = norm(body?.location || '');
  const gl = norm(body?.country || 'us') || 'us';
  const limit = Math.max(1, Math.min(20, Number(body?.limit ?? 10)));
  const enrich = body?.enrich !== false;
  if (!query) return json({ error: 'Missing query' }, { status: 400 });

  const apiKey = (Deno.env.get('SERPER_API_KEY') || '').trim();
  if (!apiKey) return json({ error: 'SERPER_API_KEY missing' }, { status: 500 });

  try {
    const results = await serperSearch({ apiKey, q: query, location: location || undefined, gl, num: limit });
    const enriched: any[] = [];

    for (const r of results) {
      const link = safeUrl(r.link || '');
      if (!link) continue;
      let html = '';
      let emails: string[] = [];
      let phones: string[] = [];
      let meta: any = {};
      let robotsOk = true;

      if (enrich) {
        robotsOk = await fetchRobotsAllows(link);
        if (robotsOk) {
          try {
            const page = await fetch(link, { method: 'GET', headers: { 'User-Agent': 'FinelyCredLeadIntel/1.0' } });
            if (page.ok) {
              html = await page.text();
              emails = extractEmails(html);
              phones = extractPhones(html);
              meta = extractMeta(html);
            }
          } catch {
            // ignore enrich failures
          }
        }
      }

      const score = scoreProspect({ target, html, emails, phones, url: link, title: r.title, snippet: r.snippet });
      enriched.push({
        title: r.title ?? '',
        url: link,
        snippet: r.snippet ?? '',
        position: r.position ?? null,
        domain: domainOf(link),
        robotsOk,
        emails,
        phones,
        meta,
        score,
      });
    }

    await logEdgeEvent({
      namespace: 'lead-intel',
      level: 'info',
      event: 'search_completed',
      meta: { userId: ctx.user.id, ip: ctx.ip, target, query, location: location || null, country: gl, limit, returned: enriched.length },
    });

    return json({ ok: true, target, query, location: location || null, country: gl, results: enriched });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'lead-intel',
      level: 'error',
      event: 'search_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Search failed' }, { status: 500 });
  }
});

