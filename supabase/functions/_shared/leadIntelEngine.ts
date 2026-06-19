export type LeadIntelTarget = 'clients' | 'affiliates' | 'agents' | 'teams' | 'au_sellers' | 'b2b_partners';
export type LeadIntelSearchMode = 'web' | 'news' | 'places' | 'mixed';
export type IntentTier = 'hot' | 'warm' | 'cold' | 'unknown';

export type SearchResult = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
  date?: string;
  address?: string;
  rating?: number;
  reviews?: number;
};

export function norm(s: string) {
  return String(s || '').trim();
}

export function safeUrl(u: string): string {
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

const BLOCKED_DOMAINS = new Set([
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'tiktok.com',
  'pinterest.com',
  'linkedin.com',
  'wikipedia.org',
]);

export function isBlockedDomain(url: string, extra: string[] = []) {
  const d = domainOf(url).toLowerCase();
  if (!d) return true;
  const block = new Set([...BLOCKED_DOMAINS, ...extra.map((x) => x.toLowerCase().replace(/^www\./, ''))]);
  for (const b of block) {
    if (d === b || d.endsWith(`.${b}`)) return true;
  }
  return false;
}

export async function fetchRobotsAllows(url: string): Promise<boolean> {
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

export function extractEmails(html: string): string[] {
  const out: string[] = [];
  const re = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  const matches = html.match(re) ?? [];
  for (const m of matches) {
    const v = m.trim().toLowerCase();
    if (v.includes('example.com')) continue;
    if (v.includes('yourname@')) continue;
    if (v.endsWith('.png') || v.endsWith('.jpg')) continue;
    out.push(v);
  }
  return uniq(out).slice(0, 10);
}

export function extractPhones(html: string): string[] {
  const out: string[] = [];
  const re = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const matches = html.match(re) ?? [];
  for (const m of matches) {
    const digits = m.replace(/[^\d]/g, '');
    if (digits.length < 10) continue;
    const last10 = digits.slice(-10);
    out.push(`(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`);
  }
  return uniq(out).slice(0, 10);
}

export function extractMeta(html: string): { description?: string; h1?: string; ogTitle?: string } {
  const desc = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html)?.[1];
  const ogTitle = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html)?.[1];
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]?.replace(/<[^>]+>/g, ' ')?.replace(/\s+/g, ' ')?.trim();
  return { description: desc?.trim(), h1: h1?.trim(), ogTitle: ogTitle?.trim() };
}

export function extractSocialLinks(html: string, pageUrl: string): Record<string, string> {
  const out: Record<string, string> = {};
  const patterns: Array<[string, RegExp]> = [
    ['linkedin', /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-z0-9_-]+/gi],
    ['facebook', /https?:\/\/(?:www\.)?facebook\.com\/[a-z0-9._-]+/gi],
    ['twitter', /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-z0-9_]+/gi],
    ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/[a-z0-9._]+/gi],
  ];
  const hay = `${html}\n${pageUrl}`;
  for (const [key, re] of patterns) {
    const m = hay.match(re);
    if (m?.[0]) out[key] = m[0].split('?')[0];
  }
  return out;
}

const INDUSTRY_KEYWORDS: Array<[string, string[]]> = [
  ['Credit repair', ['credit repair', 'dispute letter', 'metro 2', 'bureau']],
  ['Business funding', ['business funding', 'merchant cash', 'sba', 'capital']],
  ['Real estate', ['real estate', 'mortgage', 'realtor', 'broker']],
  ['Financial coaching', ['financial coach', 'credit coach', 'money coach']],
  ['Affiliate / marketing', ['affiliate', 'referral partner', 'co-marketing']],
  ['Tradelines', ['tradeline', 'authorized user', 'seasoned tradeline']],
  ['Legal / debt', ['debt settlement', 'bankruptcy', 'collection defense']],
];

export function inferIndustry(hay: string): string | undefined {
  const lower = hay.toLowerCase();
  for (const [label, keys] of INDUSTRY_KEYWORDS) {
    if (keys.some((k) => lower.includes(k))) return label;
  }
  return undefined;
}

export function extractKeywords(hay: string, limit = 8): string[] {
  const stop = new Set(['the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'have', 'help', 'free', 'credit']);
  const words = hay.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !stop.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

export function inferIntentTier(args: {
  score: number;
  emails: string[];
  phones: string[];
  signupIntent?: boolean;
  hay: string;
}): IntentTier {
  const lower = args.hay.toLowerCase();
  const hasContact = args.emails.length > 0 || args.phones.length > 0;
  if (args.score >= 65 && hasContact && (lower.includes('sign up') || lower.includes('free guide') || lower.includes('consultation'))) {
    return 'hot';
  }
  if (args.score >= 48 && hasContact) return 'warm';
  if (args.score >= 35 || hasContact) return 'warm';
  if (args.score >= 20) return 'cold';
  return 'unknown';
}

export function scoreProspect(args: {
  target: LeadIntelTarget;
  html?: string;
  emails: string[];
  phones: string[];
  url: string;
  title?: string;
  snippet?: string;
  signupIntent?: boolean;
  socialLinks?: Record<string, string>;
  industry?: string;
}) {
  let score = 10;
  if (args.emails.length) score += 28;
  if (args.phones.length) score += 18;
  if (args.emails.length >= 2) score += 6;
  if (args.url.includes('/contact')) score += 10;
  if (args.url.includes('/signup') || args.url.includes('/register') || args.url.includes('/join')) score += 12;
  if (args.socialLinks?.linkedin) score += 8;
  const hay = `${args.title ?? ''} ${args.snippet ?? ''} ${args.html ?? ''}`.toLowerCase();
  const bump = (w: string, n: number) => {
    if (hay.includes(w)) score += n;
  };
  bump('free guide', 14);
  bump('dispute letter', 12);
  bump('sign up', 12);
  bump('download', 10);
  bump('get started', 10);
  bump('free consultation', 11);
  bump('book a call', 10);
  bump('schedule', 8);
  bump('credit repair help', 10);
  bump('fix my credit', 10);
  if (args.signupIntent) {
    bump('free', 6);
    bump('guide', 6);
    bump('email', 4);
  }
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
  } else if (args.target === 'b2b_partners') {
    bump('referral', 8);
    bump('iso', 6);
    bump('broker', 6);
  }
  if (args.industry) score += 4;
  return Math.max(0, Math.min(100, score));
}

export function computeConfidence(args: { score: number; emails: string[]; phones: string[]; robotsOk: boolean }) {
  let c = args.score * 0.55;
  if (args.emails.length) c += 15;
  if (args.phones.length) c += 10;
  if (!args.robotsOk) c -= 20;
  return Math.max(0, Math.min(100, Math.round(c)));
}

export async function serperSearch(args: {
  apiKey: string;
  q: string;
  location?: string;
  gl?: string;
  num: number;
  endpoint?: 'search' | 'news' | 'places';
}): Promise<SearchResult[]> {
  const endpoint = args.endpoint ?? 'search';
  const path =
    endpoint === 'news' ? 'news' : endpoint === 'places' ? 'places' : 'search';
  const res = await fetch(`https://google.serper.dev/${path}`, {
    method: 'POST',
    headers: { 'X-API-KEY': args.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: args.q,
      gl: args.gl ?? 'us',
      location: args.location ?? undefined,
      num: Math.max(1, Math.min(50, args.num)),
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Search API error (${path}): ${res.status} ${txt}`);
  const json = JSON.parse(txt) as any;
  if (endpoint === 'news') {
    const news = (json?.news ?? []) as any[];
    return news.map((o, i) => ({
      title: o?.title,
      link: o?.link,
      snippet: o?.snippet,
      date: o?.date,
      position: o?.position ?? i + 1,
    }));
  }
  if (endpoint === 'places') {
    const places = (json?.places ?? []) as any[];
    return places.map((o, i) => ({
      title: o?.title,
      link: o?.website || o?.link || o?.cid ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o?.title || '')}` : undefined,
      snippet: o?.address || o?.category,
      address: o?.address,
      rating: o?.rating,
      reviews: o?.ratingCount ?? o?.reviews,
      position: o?.position ?? i + 1,
    }));
  }
  const organic = (json?.organic ?? []) as any[];
  return organic.map((o, i) => ({
    title: o?.title,
    link: o?.link,
    snippet: o?.snippet,
    position: o?.position ?? i + 1,
  }));
}

export type AnalyzeInput = {
  title: string;
  url: string;
  snippet: string;
  emails?: string[];
  phones?: string[];
  industry?: string;
  score?: number;
  intentTier?: IntentTier;
};

export async function analyzeProspectsWithOpenAI(args: {
  apiKey: string;
  model?: string;
  target: LeadIntelTarget;
  prospects: AnalyzeInput[];
}): Promise<Array<{ url: string; summary: string; outreachHook: string; outreachEmail: string; objection: string; nextStep: string }>> {
  const model = args.model || Deno.env.get('OPENAI_INTEL_MODEL') || Deno.env.get('OPENAI_MODEL') || 'gpt-4.1';
  const payload = args.prospects.slice(0, 8).map((p) => ({
    title: p.title,
    url: p.url,
    snippet: p.snippet?.slice(0, 400),
    emails: p.emails ?? [],
    phones: p.phones ?? [],
    industry: p.industry,
    score: p.score,
    intentTier: p.intentTier,
  }));

  const system = `You are a B2B lead intelligence analyst for Finely Cred (credit repair, funding readiness, affiliate/agent programs).
Return strict JSON: { "results": [ { "url", "summary", "outreachHook", "outreachEmail", "objection", "nextStep" } ] }
outreachEmail: short compliant cold email (under 120 words). No false claims. Mention relevant free resource when target is clients.
Target audience: ${args.target}.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ prospects: payload }) },
      ],
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${txt}`);
  const json = JSON.parse(txt) as any;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty content');
  const parsed = JSON.parse(content) as { results?: Array<Record<string, string>> };
  return (parsed.results ?? []).map((r) => ({
    url: r.url || '',
    summary: r.summary || '',
    outreachHook: r.outreachHook || '',
    outreachEmail: r.outreachEmail || '',
    objection: r.objection || '',
    nextStep: r.nextStep || '',
  }));
}

export function recommendedFunnelForTarget(target: LeadIntelTarget): string {
  if (target === 'clients') return '/free-guide';
  if (target === 'affiliates') return '/affiliate/hub';
  if (target === 'agents' || target === 'teams') return '/signup?role=agent';
  if (target === 'au_sellers') return '/signup?role=au_seller';
  if (target === 'b2b_partners') return '/onboarding?lane=business_credit';
  return '/start-here';
}
