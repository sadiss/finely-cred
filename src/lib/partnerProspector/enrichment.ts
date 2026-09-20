import { normalizeEmail, normalizePhone, formatPhone, hostnameOf } from '../../domain/partnerProspector/normalize.ts';
import type { PageEnrichment } from '../../domain/partnerProspector/types.ts';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_CHARS = 400_000;

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function extractPublicEmails(html: string): string[] {
  const out: string[] = [];
  const mailto = html.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi);
  for (const m of mailto) {
    const v = normalizeEmail(m[1]);
    if (v) out.push(v);
  }
  const re = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  for (const m of html.match(re) ?? []) {
    const v = normalizeEmail(m);
    if (v) out.push(v);
  }
  return uniq(out).slice(0, 6);
}

export function extractPublicPhones(html: string): string[] {
  const out: string[] = [];
  const tel = html.matchAll(/tel:([+\d().\s-]{8,})/gi);
  for (const m of tel) {
    const v = normalizePhone(m[1]);
    if (v) out.push(formatPhone(v));
  }
  const re = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  for (const m of html.match(re) ?? []) {
    const v = normalizePhone(m);
    if (v) out.push(formatPhone(v));
  }
  return uniq(out).slice(0, 6);
}

export function extractPublicMeta(html: string): { title?: string; description?: string; h1?: string } {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const desc = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html)?.[1];
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]?.replace(/<[^>]+>/g, ' ')?.replace(/\s+/g, ' ')?.trim();
  return { title, description: desc?.trim(), h1 };
}

export async function robotsAllows(url: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const host = hostnameOf(url);
  if (!host) return true;
  try {
    const res = await fetchImpl(`https://${host}/robots.txt`, { method: 'GET' });
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

export async function enrichPublicPage(url: string, fetchImpl: typeof fetch = fetch): Promise<PageEnrichment | null> {
  const robotsOk = await robotsAllows(url, fetchImpl);
  if (!robotsOk) return { emails: [], phones: [], robotsOk: false };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const page = await fetchImpl(url, {
      method: 'GET',
      headers: { 'User-Agent': 'FinelyCredPartnerProspector/1.0 (+https://finelycred.com; public-data enrichment)' },
      signal: ctrl.signal,
    });
    if (!page.ok) return { emails: [], phones: [], robotsOk: true };
    const html = (await page.text()).slice(0, MAX_HTML_CHARS);
    const meta = extractPublicMeta(html);
    return {
      emails: extractPublicEmails(html),
      phones: extractPublicPhones(html),
      ...meta,
      robotsOk: true,
    };
  } catch {
    return { emails: [], phones: [], robotsOk: true };
  } finally {
    clearTimeout(t);
  }
}

export function rateLimitedEnricher(args?: { gapMs?: number; fetchImpl?: typeof fetch }) {
  const gap = Math.max(250, args?.gapMs ?? 800);
  let last = 0;
  return async (url: string) => {
    const wait = Math.max(0, last + gap - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    return enrichPublicPage(url, args?.fetchImpl ?? fetch);
  };
}
