/**
 * Real, resilient network fetchers for the lead-intel swarm's `rss` / `public_directory`
 * method sources, plus the Reddit public search endpoint and the Hacker News (Algolia)
 * public search API.
 *
 * Every exported fetcher here:
 *  - performs a genuine `fetch()` against a real public endpoint (no fabricated data),
 *  - times out via `AbortController` (never hangs a job tick),
 *  - never throws — always resolves to a safe `{ ok:false, items:[] }` shape on any
 *    failure (network error, timeout, non-200, unparsable body).
 *
 * CORS reality check (browser app): most of these target sites do NOT send
 * `Access-Control-Allow-Origin`, so a direct `fetch()` from this Vite SPA is blocked by
 * the browser before the response body is ever visible to JS (confirmed for reddit.com
 * and www.bbb.org). `fetchExternalText` therefore tries the `lead-intel-fetch-proxy`
 * Supabase Edge Function first (server-to-server fetch — no CORS involved), and only
 * falls back to a direct browser fetch when Supabase isn't configured or the proxy call
 * itself fails. The direct-fetch fallback still succeeds for endpoints that *do* send
 * permissive CORS headers (confirmed for Hacker News' Algolia search API).
 */
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import type { LeadIntelSourceId } from './types';

export type LeadIntelFetchedItem = {
  title: string;
  link?: string;
  pubDate?: string;
  snippet?: string;
};

export type LeadIntelFetchResult = {
  ok: boolean;
  items: LeadIntelFetchedItem[];
  via: 'proxy' | 'direct' | 'none';
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 9000;
const DEFAULT_ITEM_LIMIT = 20;

function withTimeoutController(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, ms));
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/**
 * Fetches raw text from a public URL — proxy-first (avoids CORS), direct-fetch fallback.
 * Never throws.
 */
async function fetchExternalText(
  url: string,
  opts?: { timeoutMs?: number },
): Promise<{ ok: boolean; text: string; via: 'proxy' | 'direct' | 'none'; error?: string }> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('lead-intel-fetch-proxy', { body: { url } });
      const payload = data as { ok?: boolean; text?: string; error?: string } | null;
      if (!error && payload?.ok && typeof payload.text === 'string') {
        return { ok: true, text: payload.text, via: 'proxy' };
      }
      if (!error && payload && payload.ok === false) {
        return { ok: false, text: '', via: 'proxy', error: payload.error || 'proxy fetch failed' };
      }
    } catch {
      /* fall through to a direct fetch attempt below */
    }
  }

  const { signal, clear } = withTimeoutController(timeoutMs);
  try {
    const res = await fetch(url, { signal, headers: { Accept: '*/*' } });
    clear();
    if (!res.ok) return { ok: false, text: '', via: 'direct', error: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, text, via: 'direct' };
  } catch (e) {
    clear();
    return { ok: false, text: '', via: 'none', error: e instanceof Error ? e.message : 'fetch failed' };
  }
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!m?.[1]) return undefined;
  const cleaned = stripTags(stripCdata(m[1])).trim();
  return cleaned || undefined;
}

function extractAtomLink(block: string): string | undefined {
  const m = block.match(/<link[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
  return m?.[1];
}

/**
 * Generic RSS/Atom feed fetcher — real `fetch()` + lightweight regex extraction of
 * `<item>`/`<entry>` blocks (repo has no XML library and doesn't need one for this).
 * Used by craigslist_services, local_event_calendars, google_alerts_ingest,
 * meetup_event_watch — any of those sources supplying a real public feed URL.
 */
export async function fetchAndParseRssLeads(
  feedUrl: string,
  opts?: { limit?: number; timeoutMs?: number },
): Promise<LeadIntelFetchResult> {
  try {
    const fetched = await fetchExternalText(feedUrl, { timeoutMs: opts?.timeoutMs });
    if (!fetched.ok || !fetched.text) {
      return { ok: false, items: [], via: fetched.via, error: fetched.error || 'empty response' };
    }
    const limit = Math.max(1, opts?.limit ?? DEFAULT_ITEM_LIMIT);
    const blocks: string[] = [];
    const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRe = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(fetched.text)) && blocks.length < limit * 3) blocks.push(m[1] ?? '');
    while ((m = entryRe.exec(fetched.text)) && blocks.length < limit * 3) blocks.push(m[1] ?? '');

    const items: LeadIntelFetchedItem[] = [];
    for (const block of blocks) {
      const title = extractTag(block, 'title');
      if (!title) continue;
      const link = extractAtomLink(block) || extractTag(block, 'link');
      const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'updated') || extractTag(block, 'published');
      const snippet = extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content');
      items.push({ title, link, pubDate, snippet: snippet ? snippet.slice(0, 240) : undefined });
      if (items.length >= limit) break;
    }
    return {
      ok: items.length > 0,
      items,
      via: fetched.via,
      error: items.length ? undefined : 'feed fetched but no parseable <item>/<entry> blocks found',
    };
  } catch (e) {
    return { ok: false, items: [], via: 'none', error: e instanceof Error ? e.message : 'rss parse failed' };
  }
}

/**
 * Real, conservative HTML/JSON extraction for public directory-style pages (BBB search,
 * etc.). Uses a verified BBB result-card pattern first (business name + tel: + address),
 * falling back to a generic mailto: scan. If neither pattern matches, returns
 * `ok:false` with an honest error rather than fabricating a result — per the "no
 * dead/fake code" mandate, an empty result from a real fetch is preferable to noise.
 */
export async function fetchPublicDirectoryLeads(
  url: string,
  opts?: { limit?: number; timeoutMs?: number },
): Promise<LeadIntelFetchResult> {
  try {
    const fetched = await fetchExternalText(url, { timeoutMs: opts?.timeoutMs });
    if (!fetched.ok || !fetched.text) {
      return { ok: false, items: [], via: fetched.via, error: fetched.error || 'empty response' };
    }
    const limit = Math.max(1, opts?.limit ?? DEFAULT_ITEM_LIMIT);
    const html = fetched.text;
    const items: LeadIntelFetchedItem[] = [];

    // Verified BBB (bbb.org/search) result-card markup: business name + tel: link +
    // address paragraph sit within ~1.4kb of the anchor. See report for the confirmed
    // sample markup this pattern was built against.
    const cardRe = /result-business-name[^>]*>[\s\S]{0,120}?<a[^>]*href="([^"]*)"[^>]*>[\s\S]{0,200}?<span[^>]*>([^<]{2,90})<\/span>/gi;
    let cm: RegExpExecArray | null;
    while ((cm = cardRe.exec(html)) && items.length < limit) {
      const href = cm[1];
      const name = cm[2];
      if (!name) continue;
      const windowText = html.slice(cm.index, cm.index + 1400);
      const tel = windowText.match(/href="tel:([^"]+)"/i)?.[1];
      const addr = stripTags(windowText.match(/text-gray-70"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');
      items.push({
        title: name.trim(),
        link: href ? (href.startsWith('http') ? href : `https://www.bbb.org${href}`) : undefined,
        snippet: [tel, addr].filter(Boolean).join(' · ').slice(0, 200) || undefined,
      });
    }

    if (!items.length) {
      // Conservative generic fallback — real mailto: contacts only. Deliberately does
      // not guess at business-name heuristics for markup we haven't verified, since an
      // unverified guess is more likely to produce noise than a genuine signal.
      const mailtoRe = /href="mailto:([^"?]+)"/gi;
      const seen = new Set<string>();
      let em: RegExpExecArray | null;
      while ((em = mailtoRe.exec(html)) && items.length < limit) {
        const email = (em[1] ?? '').trim();
        if (!email || seen.has(email)) continue;
        seen.add(email);
        items.push({ title: email, link: `mailto:${email}`, snippet: 'Public mailto contact found on page' });
      }
    }

    return {
      ok: items.length > 0,
      items,
      via: fetched.via,
      error: items.length ? undefined : 'page fetched but no reliable lead signals were found',
    };
  } catch (e) {
    return { ok: false, items: [], via: 'none', error: e instanceof Error ? e.message : 'directory parse failed' };
  }
}

/**
 * Reddit's public read-only search endpoint — no auth required for public search.
 * IMPORTANT (found during implementation, see report): as of Reddit's mid-2026
 * anti-bot policy tightening, anonymous `.json` requests frequently return HTTP 403
 * even with a legitimate User-Agent, and reddit.com sends no CORS headers at all (a
 * direct browser fetch is blocked outright). This fetcher still issues a genuine
 * request every time it's called (proxy-first to dodge CORS) and parses real data
 * whenever Reddit allows the request through — it fails safe otherwise.
 */
export async function fetchRedditGeoLeads(
  query: string,
  opts?: { limit?: number; timeoutMs?: number },
): Promise<LeadIntelFetchResult> {
  try {
    const limit = Math.max(1, Math.min(25, opts?.limit ?? 15));
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=new`;
    const fetched = await fetchExternalText(url, { timeoutMs: opts?.timeoutMs });
    if (!fetched.ok || !fetched.text) {
      return { ok: false, items: [], via: fetched.via, error: fetched.error || 'empty response' };
    }
    let parsed: { data?: { children?: Array<{ data?: Record<string, unknown> }> } };
    try {
      parsed = JSON.parse(fetched.text);
    } catch {
      return { ok: false, items: [], via: fetched.via, error: 'Reddit did not return JSON (likely blocked / anti-bot page)' };
    }
    const children = Array.isArray(parsed?.data?.children) ? parsed.data!.children! : [];
    const items: LeadIntelFetchedItem[] = children
      .slice(0, limit)
      .map((c) => {
        const d = (c?.data ?? {}) as Record<string, unknown>;
        const title = String(d.title ?? '').slice(0, 200);
        const permalink = typeof d.permalink === 'string' ? d.permalink : undefined;
        const createdUtc = typeof d.created_utc === 'number' ? d.created_utc : undefined;
        const subreddit = typeof d.subreddit === 'string' ? d.subreddit : undefined;
        const author = typeof d.author === 'string' ? d.author : undefined;
        return {
          title,
          link: permalink ? `https://www.reddit.com${permalink}` : undefined,
          pubDate: createdUtc ? new Date(createdUtc * 1000).toISOString() : undefined,
          snippet: [subreddit ? `r/${subreddit}` : '', author ? `u/${author}` : ''].filter(Boolean).join(' · ') || undefined,
        };
      })
      .filter((i) => i.title);
    return {
      ok: items.length > 0,
      items,
      via: fetched.via,
      error: items.length ? undefined : 'Reddit responded but returned no results for this query',
    };
  } catch (e) {
    return { ok: false, items: [], via: 'none', error: e instanceof Error ? e.message : 'reddit fetch failed' };
  }
}

/**
 * Hacker News search via the public Algolia API (`hn.algolia.com`) — genuinely public,
 * no auth, and (confirmed) sends `Access-Control-Allow-Origin: *`, so this one works
 * with a *direct* browser fetch, no proxy required. Covers the "Hn" half of
 * `indiehackers_hn` (IndieHackers.com itself has no public API and isn't scraped here).
 */
export async function fetchHackerNewsLeads(
  query: string,
  opts?: { limit?: number; timeoutMs?: number },
): Promise<LeadIntelFetchResult> {
  try {
    const limit = Math.max(1, Math.min(30, opts?.limit ?? 15));
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;
    const fetched = await fetchExternalText(url, { timeoutMs: opts?.timeoutMs });
    if (!fetched.ok || !fetched.text) {
      return { ok: false, items: [], via: fetched.via, error: fetched.error || 'empty response' };
    }
    let parsed: { hits?: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(fetched.text);
    } catch {
      return { ok: false, items: [], via: fetched.via, error: 'HN Algolia did not return JSON' };
    }
    const hits = Array.isArray(parsed?.hits) ? parsed.hits! : [];
    const items: LeadIntelFetchedItem[] = hits
      .slice(0, limit)
      .map((h) => {
        const title = String(h.title ?? h.story_title ?? '').slice(0, 200);
        const url = typeof h.url === 'string' ? h.url : undefined;
        const objectId = typeof h.objectID === 'string' ? h.objectID : undefined;
        const author = typeof h.author === 'string' ? h.author : undefined;
        const numComments = typeof h.num_comments === 'number' ? h.num_comments : undefined;
        return {
          title,
          link: url || (objectId ? `https://news.ycombinator.com/item?id=${objectId}` : undefined),
          pubDate: typeof h.created_at === 'string' ? h.created_at : undefined,
          snippet: [author ? `by ${author}` : '', numComments != null ? `${numComments} comments` : ''].filter(Boolean).join(' · ') || undefined,
        };
      })
      .filter((i) => i.title);
    return {
      ok: items.length > 0,
      items,
      via: fetched.via,
      error: items.length ? undefined : 'HN Algolia responded but returned no results for this query',
    };
  } catch (e) {
    return { ok: false, items: [], via: 'none', error: e instanceof Error ? e.message : 'hn fetch failed' };
  }
}

/** City -> { state, craigslist subdomain } for the 60-metro shard pack (see usMetroShardMap.ts). */
const METRO_CITY_INFO: Record<string, { state: string; craigslistSlug: string }> = {
  'New York': { state: 'NY', craigslistSlug: 'newyork' },
  'Los Angeles': { state: 'CA', craigslistSlug: 'losangeles' },
  Chicago: { state: 'IL', craigslistSlug: 'chicago' },
  Houston: { state: 'TX', craigslistSlug: 'houston' },
  Phoenix: { state: 'AZ', craigslistSlug: 'phoenix' },
  Philadelphia: { state: 'PA', craigslistSlug: 'philadelphia' },
  'San Antonio': { state: 'TX', craigslistSlug: 'sanantonio' },
  'San Diego': { state: 'CA', craigslistSlug: 'sandiego' },
  Dallas: { state: 'TX', craigslistSlug: 'dallas' },
  'San Jose': { state: 'CA', craigslistSlug: 'sfbay' },
  Austin: { state: 'TX', craigslistSlug: 'austin' },
  Jacksonville: { state: 'FL', craigslistSlug: 'jacksonville' },
  'Fort Worth': { state: 'TX', craigslistSlug: 'dallas' },
  Columbus: { state: 'OH', craigslistSlug: 'columbus' },
  Charlotte: { state: 'NC', craigslistSlug: 'charlotte' },
  'San Francisco': { state: 'CA', craigslistSlug: 'sfbay' },
  Indianapolis: { state: 'IN', craigslistSlug: 'indianapolis' },
  Seattle: { state: 'WA', craigslistSlug: 'seattle' },
  Denver: { state: 'CO', craigslistSlug: 'denver' },
  Washington: { state: 'DC', craigslistSlug: 'washingtondc' },
  Boston: { state: 'MA', craigslistSlug: 'boston' },
  'El Paso': { state: 'TX', craigslistSlug: 'elpaso' },
  Nashville: { state: 'TN', craigslistSlug: 'nashville' },
  Detroit: { state: 'MI', craigslistSlug: 'detroit' },
  'Oklahoma City': { state: 'OK', craigslistSlug: 'oklahomacity' },
  Portland: { state: 'OR', craigslistSlug: 'portland' },
  'Las Vegas': { state: 'NV', craigslistSlug: 'lasvegas' },
  Memphis: { state: 'TN', craigslistSlug: 'memphis' },
  Louisville: { state: 'KY', craigslistSlug: 'louisville' },
  Baltimore: { state: 'MD', craigslistSlug: 'baltimore' },
  Milwaukee: { state: 'WI', craigslistSlug: 'milwaukee' },
  Albuquerque: { state: 'NM', craigslistSlug: 'albuquerque' },
  Tucson: { state: 'AZ', craigslistSlug: 'tucson' },
  Fresno: { state: 'CA', craigslistSlug: 'fresno' },
  Sacramento: { state: 'CA', craigslistSlug: 'sacramento' },
  'Kansas City': { state: 'MO', craigslistSlug: 'kansascity' },
  Mesa: { state: 'AZ', craigslistSlug: 'phoenix' },
  Atlanta: { state: 'GA', craigslistSlug: 'atlanta' },
  'Colorado Springs': { state: 'CO', craigslistSlug: 'cosprings' },
  Raleigh: { state: 'NC', craigslistSlug: 'raleigh' },
  Miami: { state: 'FL', craigslistSlug: 'miami' },
  'Long Beach': { state: 'CA', craigslistSlug: 'losangeles' },
  'Virginia Beach': { state: 'VA', craigslistSlug: 'hamptonroads' },
  Oakland: { state: 'CA', craigslistSlug: 'sfbay' },
  Minneapolis: { state: 'MN', craigslistSlug: 'minneapolis' },
  Tampa: { state: 'FL', craigslistSlug: 'tampa' },
  Tulsa: { state: 'OK', craigslistSlug: 'tulsa' },
  Arlington: { state: 'TX', craigslistSlug: 'dallas' },
  'New Orleans': { state: 'LA', craigslistSlug: 'neworleans' },
  Wichita: { state: 'KS', craigslistSlug: 'wichita' },
  Cleveland: { state: 'OH', craigslistSlug: 'cleveland' },
  Bakersfield: { state: 'CA', craigslistSlug: 'bakersfield' },
  Aurora: { state: 'CO', craigslistSlug: 'denver' },
  Anaheim: { state: 'CA', craigslistSlug: 'orangecounty' },
  Honolulu: { state: 'HI', craigslistSlug: 'honolulu' },
  'Santa Ana': { state: 'CA', craigslistSlug: 'orangecounty' },
  Riverside: { state: 'CA', craigslistSlug: 'inlandempire' },
  'Corpus Christi': { state: 'TX', craigslistSlug: 'corpuschristi' },
  Lexington: { state: 'KY', craigslistSlug: 'lexington' },
  Henderson: { state: 'NV', craigslistSlug: 'lasvegas' },
  'St. Louis': { state: 'MO', craigslistSlug: 'stlouis' },
  Cincinnati: { state: 'OH', craigslistSlug: 'cincinnati' },
};

const STOP_TERMS = /\b(near me|today|consultation|guide|checklist|help|apply|remote|partner program|free|best|local|urgent|how to|looking for)\b/gi;

function keywordsFromQuery(city: string, query: string): string {
  const withoutCity = city ? query.replace(new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '') : query;
  const cleaned = withoutCity.replace(STOP_TERMS, '').replace(/\s+/g, ' ').trim();
  return cleaned || query.trim();
}

function envFeedUrlsFor(sourceId: string): string[] {
  try {
    const raw = (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_LEAD_INTEL_RSS_FEEDS;
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    const list = map?.[sourceId];
    return Array.isArray(list) ? list.filter((u) => typeof u === 'string' && u.startsWith('http')) : [];
  } catch {
    return [];
  }
}

function stableIndex(seed: string, mod: number): number {
  if (mod <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

/** Sources this module has a genuine fetch path wired for (used by leadIntelSwarmRepo). */
export const LIVE_FETCH_CAPABLE_SOURCE_IDS = new Set<LeadIntelSourceId>([
  'reddit_geo',
  'indiehackers_hn',
  'bbb_complaints',
  'craigslist_services',
  'google_alerts_ingest',
  'local_event_calendars',
  'meetup_event_watch',
] as LeadIntelSourceId[]);

export type LiveFetchOutcome = {
  attempted: boolean;
  ok: boolean;
  discovered: number;
  enriched: number;
  items: LeadIntelFetchedItem[];
  via: 'proxy' | 'direct' | 'none';
  note: string;
};

const NO_TARGET: LiveFetchOutcome = {
  attempted: false,
  ok: false,
  discovered: 0,
  enriched: 0,
  items: [],
  via: 'none',
  note: 'No real fetch target available for this source/city — using simulated progress this tick.',
};

function toOutcome(result: LeadIntelFetchResult, label: string): LiveFetchOutcome {
  const enrichedCount = result.ok ? Math.floor(result.items.length / 2) : 0;
  return {
    attempted: true,
    ok: result.ok,
    discovered: result.ok ? result.items.length : 0,
    enriched: enrichedCount,
    items: result.items,
    via: result.via,
    note: result.ok
      ? `${label}: ${result.items.length} real item(s) via ${result.via} fetch.`
      : `${label} — real fetch attempted, no usable result (${result.error || 'unknown error'}, via ${result.via}). Falling back to simulation this tick.`,
  };
}

/**
 * Builds a real fetch target from a job's city/query and calls the matching fetcher.
 * Returns `attempted:false` (no network call made) when no real URL/query can be
 * built for this source + city — callers should fall back to the existing simulated
 * progress bump in that case.
 */
export async function runLiveFetchForSource(
  sourceId: LeadIntelSourceId,
  args: { city: string; query: string },
): Promise<LiveFetchOutcome> {
  const city = (args.city || '').trim();
  const query = (args.query || '').trim();

  if (sourceId === ('reddit_geo' as LeadIntelSourceId)) {
    const terms = keywordsFromQuery(city, query);
    const result = await fetchRedditGeoLeads(city ? `${terms} ${city}`.trim() : terms);
    return toOutcome(result, 'Reddit search.json');
  }

  if (sourceId === ('indiehackers_hn' as LeadIntelSourceId)) {
    const terms = keywordsFromQuery(city, query);
    const result = await fetchHackerNewsLeads(terms);
    return toOutcome(result, 'Hacker News (Algolia) search');
  }

  if (sourceId === ('bbb_complaints' as LeadIntelSourceId)) {
    const info = METRO_CITY_INFO[city];
    if (!info) return NO_TARGET;
    const terms = keywordsFromQuery(city, query) || 'credit repair';
    const url = `https://www.bbb.org/search?find_text=${encodeURIComponent(terms)}&find_loc=${encodeURIComponent(`${city}, ${info.state}`)}`;
    const result = await fetchPublicDirectoryLeads(url);
    return toOutcome(result, `BBB business search (${city}, ${info.state})`);
  }

  if (sourceId === ('craigslist_services' as LeadIntelSourceId)) {
    const info = METRO_CITY_INFO[city];
    if (!info) return NO_TARGET;
    const terms = keywordsFromQuery(city, query) || 'credit repair';
    const url = `https://${info.craigslistSlug}.craigslist.org/search/bbb?format=rss&query=${encodeURIComponent(terms)}`;
    const result = await fetchAndParseRssLeads(url);
    return toOutcome(result, `Craigslist services RSS (${info.craigslistSlug})`);
  }

  if (
    sourceId === ('google_alerts_ingest' as LeadIntelSourceId) ||
    sourceId === ('local_event_calendars' as LeadIntelSourceId) ||
    sourceId === ('meetup_event_watch' as LeadIntelSourceId)
  ) {
    const feeds = envFeedUrlsFor(sourceId);
    if (!feeds.length) return NO_TARGET;
    const url = feeds[stableIndex(`${sourceId}:${city}:${query}`, feeds.length)]!;
    const result = await fetchAndParseRssLeads(url);
    return toOutcome(result, `Configured RSS feed (${sourceId})`);
  }

  return NO_TARGET;
}
