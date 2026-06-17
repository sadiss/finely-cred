// Supabase Edge Function: lead-intel
// Compliant lead discovery + enrichment + AI outreach analysis.
//
// Secrets:
// - SUPABASE_URL, SUPABASE_ANON_KEY
// - EDGE_ADMIN_EMAILS
// - SERPER_API_KEY (required for search)
// - OPENAI_API_KEY (optional — AI analyze action)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth } from '../_shared/edgeGuard.ts';
import {
  analyzeProspectsWithOpenAI,
  computeConfidence,
  domainOf,
  extractEmails,
  extractKeywords,
  extractMeta,
  extractPhones,
  extractSocialLinks,
  fetchRobotsAllows,
  inferIndustry,
  inferIntentTier,
  isBlockedDomain,
  norm,
  recommendedFunnelForTarget,
  safeUrl,
  scoreProspect,
  serperSearch,
  type AnalyzeInput,
  type LeadIntelSearchMode,
  type LeadIntelTarget,
} from '../_shared/leadIntelEngine.ts';

type ReqBody = {
  action?: 'search' | 'analyze';
  target?: LeadIntelTarget;
  query?: string;
  queries?: string[];
  location?: string;
  country?: string;
  limit?: number;
  enrich?: boolean;
  signupIntent?: boolean;
  searchMode?: LeadIntelSearchMode;
  excludeDomains?: string[];
  minScore?: number;
  industry?: string;
  prospects?: AnalyzeInput[];
};

async function runSearch(body: ReqBody, ctx: { user: { id: string }; ip: string }) {
  const target = (body?.target || 'clients') as LeadIntelTarget;
  const location = norm(body?.location || '');
  const gl = norm(body?.country || 'us') || 'us';
  const perQueryLimit = Math.max(1, Math.min(50, Number(body?.limit ?? 10)));
  const enrich = body?.enrich !== false;
  const signupIntent = body?.signupIntent === true;
  const searchMode = (body?.searchMode || 'web') as LeadIntelSearchMode;
  const excludeDomains = (body?.excludeDomains ?? []).map((d) => norm(d)).filter(Boolean);
  const minScore = Math.max(0, Math.min(100, Number(body?.minScore ?? 0)));
  const industryFilter = norm(body?.industry || '').toLowerCase();

  const queryList = Array.isArray(body?.queries) && body.queries.length
    ? body.queries.map((q) => norm(q)).filter(Boolean).slice(0, 15)
    : [norm(body?.query || '')].filter(Boolean);
  if (!queryList.length) return json({ error: 'Missing query or queries' }, { status: 400 });

  const apiKey = (Deno.env.get('SERPER_API_KEY') || '').trim();
  if (!apiKey) return json({ error: 'SERPER_API_KEY missing' }, { status: 500 });

  const seen = new Set<string>();
  const rawResults: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    position?: number;
    date?: string;
    address?: string;
    rating?: number;
    reviews?: number;
    searchMode: LeadIntelSearchMode;
  }> = [];

  const perQ = Math.max(3, Math.ceil(perQueryLimit / queryList.length));
  const modes: LeadIntelSearchMode[] =
    searchMode === 'mixed' ? ['web', 'news', 'places'] : [searchMode];

  for (const q of queryList) {
    for (const mode of modes) {
      const endpoint = mode === 'news' ? 'news' : mode === 'places' ? 'places' : 'search';
      const batch = await serperSearch({
        apiKey,
        q: mode === 'places' && !q.toLowerCase().includes('near') && location
          ? `${q} near ${location}`
          : q,
        location: location || undefined,
        gl,
        num: perQ,
        endpoint,
      });
      for (const r of batch) {
        const link = safeUrl(r.link || '');
        if (!link || seen.has(link) || isBlockedDomain(link, excludeDomains)) continue;
        seen.add(link);
        rawResults.push({ ...r, searchMode: mode });
      }
    }
  }

  const enriched: any[] = [];

  for (const r of rawResults.slice(0, perQueryLimit * Math.max(1, queryList.length))) {
    const link = safeUrl(r.link || '');
    if (!link) continue;
    let html = '';
    let emails: string[] = [];
    let phones: string[] = [];
    let meta: any = {};
    let socialLinks: Record<string, string> = {};
    let robotsOk = true;

    if (enrich && r.searchMode !== 'news') {
      robotsOk = await fetchRobotsAllows(link);
      if (robotsOk) {
        try {
          const page = await fetch(link, { method: 'GET', headers: { 'User-Agent': 'FinelyCredLeadIntel/2.0' } });
          if (page.ok) {
            html = await page.text();
            emails = extractEmails(html);
            phones = extractPhones(html);
            meta = extractMeta(html);
            socialLinks = extractSocialLinks(html, link);
          }
        } catch {
          // ignore enrich failures
        }
      }
    }

    const hay = `${r.title ?? ''} ${r.snippet ?? ''} ${html}`.slice(0, 12000);
    const industry = inferIndustry(hay);
    const keywords = extractKeywords(hay);
    const score = scoreProspect({
      target,
      html,
      emails,
      phones,
      url: link,
      title: r.title,
      snippet: r.snippet,
      signupIntent,
      socialLinks,
      industry,
    });
    const intentTier = inferIntentTier({ score, emails, phones, signupIntent, hay });
    const confidence = computeConfidence({ score, emails, phones, robotsOk });

    if (score < minScore) continue;
    if (industryFilter && !(industry ?? '').toLowerCase().includes(industryFilter)) continue;

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
      socialLinks,
      keywords,
      industry,
      intentTier,
      confidence,
      score,
      signupIntent,
      searchMode: r.searchMode,
      newsDate: r.date ?? null,
      place: r.address
        ? { address: r.address, rating: r.rating ?? null, reviews: r.reviews ?? null }
        : null,
      recommendedFunnel: recommendedFunnelForTarget(target),
    });
  }

  enriched.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  await logEdgeEvent({
    namespace: 'lead-intel',
    level: 'info',
    event: 'search_completed',
    meta: {
      userId: ctx.user.id,
      ip: ctx.ip,
      target,
      queries: queryList,
      searchMode,
      location: location || null,
      country: gl,
      limit: perQueryLimit,
      returned: enriched.length,
      batch: queryList.length > 1,
    },
  });

  return json({
    ok: true,
    action: 'search',
    target,
    query: queryList[0],
    queries: queryList,
    searchMode,
    location: location || null,
    country: gl,
    results: enriched,
    dailyTarget: 50,
    capabilities: {
      modes: ['web', 'news', 'places', 'mixed'],
      enrich: true,
      aiAnalyze: Boolean((Deno.env.get('OPENAI_API_KEY') || '').trim()),
    },
  });
}

async function runAnalyze(body: ReqBody, ctx: { user: { id: string }; ip: string }) {
  const target = (body?.target || 'clients') as LeadIntelTarget;
  const prospects = Array.isArray(body?.prospects) ? body.prospects.slice(0, 8) : [];
  if (!prospects.length) return json({ error: 'Missing prospects for analyze action' }, { status: 400 });

  const openaiKey = (Deno.env.get('OPENAI_API_KEY') || '').trim();
  if (!openaiKey) return json({ error: 'OPENAI_API_KEY missing — required for AI analyze' }, { status: 500 });

  const analyzed = await analyzeProspectsWithOpenAI({
    apiKey: openaiKey,
    target,
    prospects,
  });

  await logEdgeEvent({
    namespace: 'lead-intel',
    level: 'info',
    event: 'analyze_completed',
    meta: { userId: ctx.user.id, ip: ctx.ip, target, count: analyzed.length },
  });

  return json({ ok: true, action: 'analyze', target, analyses: analyzed });
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

  const rlUser = await rateLimit({ key: `lead-intel:user:${ctx.user.id}`, limit: 15, windowSeconds: 60 });
  const rlIp = await rateLimit({ key: `lead-intel:ip:${ctx.ip}`, limit: 40, windowSeconds: 60 });
  if (!rlUser.ok || !rlIp.ok) return json({ ok: false, error: 'Rate limited.' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body?.action === 'analyze' ? 'analyze' : 'search';

  try {
    if (action === 'analyze') return await runAnalyze(body, ctx);
    return await runSearch(body, ctx);
  } catch (e) {
    await logEdgeEvent({
      namespace: 'lead-intel',
      level: 'error',
      event: action === 'analyze' ? 'analyze_failed' : 'search_failed',
      meta: { userId: ctx.user.id, ip: ctx.ip, error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || `${action} failed` }, { status: 500 });
  }
});
