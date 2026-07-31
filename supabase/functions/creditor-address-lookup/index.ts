// Creditor / law-firm mailing address lookup (Serper when configured).
// Secrets: SERPER_API_KEY (optional — returns catalog-only note when missing)
// Educational UX only — clients must verify before mailing.

import { corsHeaders } from '../_shared/cors.ts';
import { json, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';

type ReqBody = {
  query?: string;
  preferCounsel?: boolean;
};

type ResultRow = { name: string; address: string; phone?: string; snippet?: string };

/** Minimal edge catalog — mirrors high-traffic names from the client directory. */
const CATALOG: Array<{ aliases: string[]; name: string; address: string; phone?: string }> = [
  {
    aliases: ['midland credit', 'midland funding'],
    name: 'Midland Credit Management, Inc.',
    address: 'P.O. Box 939069\nSan Diego, CA 92193',
    phone: '877-600-6800',
  },
  {
    aliases: ['portfolio recovery', 'pra'],
    name: 'Portfolio Recovery Associates, LLC',
    address: '120 Corporate Blvd\nNorfolk, VA 23502',
    phone: '866-428-1098',
  },
  {
    aliases: ['lvnv', 'resurgent'],
    name: 'LVNV Funding LLC c/o Resurgent Capital Services',
    address: 'P.O. Box 10485\nGreenville, SC 29603',
  },
  {
    aliases: ['stenger', 'weber & olcese', 'stillman law', 'shermeta', 'weltman'],
    name: '',
    address: '',
  },
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function catalogHit(query: string): ResultRow | null {
  const n = norm(query);
  if (n.length < 3) return null;
  for (const row of CATALOG) {
    if (!row.address) continue;
    if (row.aliases.some((a) => n.includes(norm(a)) || norm(a).includes(n))) {
      return { name: row.name, address: row.address, phone: row.phone };
    }
  }
  return null;
}

/** Very conservative parse: look for City, ST ZIP in a snippet. */
function extractAddressFromSnippet(snippet: string): string | null {
  const m = String(snippet || '').match(
    /((?:P\.?\s*O\.?\s*Box\s+\d+|[\d]+[^\n,]{0,60})),?\s*([A-Za-z .'-]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/i,
  );
  if (!m) return null;
  return `${m[1]!.trim()}\n${m[2]!.trim()}, ${m[3]!.toUpperCase()} ${m[4]}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit({ key: 'creditor-address-lookup', limit: 20, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const query = String(body.query || '').trim().slice(0, 160);
  if (!query) return json({ ok: true, results: [] as ResultRow[] });

  const fromCatalog = catalogHit(query);
  const apiKey = (Deno.env.get('SERPER_API_KEY') || '').trim();
  if (!apiKey) {
    return json({
      ok: true,
      results: fromCatalog ? [fromCatalog] : [],
      note: fromCatalog
        ? 'Catalog match — verify before mailing. SERPER_API_KEY not configured for web lookup.'
        : 'SERPER_API_KEY not configured — enter mailing address from notice / summons or use client directory.',
      verifyRequired: true,
    });
  }

  const counselBias = body.preferCounsel ? 'law firm mailing address' : 'debt collector mailing address';
  const q = `${query} ${counselBias} United States`;

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, num: 5 }),
    });
    if (!res.ok) {
      return json({
        ok: true,
        results: fromCatalog ? [fromCatalog] : [],
        note: 'Web lookup failed — using catalog if available. Verify before mailing.',
        verifyRequired: true,
      });
    }
    const data = await res.json();
    const organic = Array.isArray(data?.organic) ? data.organic : [];
    const results: ResultRow[] = [];
    for (const row of organic) {
      const snippet = String(row?.snippet || '');
      const addr = extractAddressFromSnippet(snippet);
      if (!addr) continue;
      results.push({
        name: String(row?.title || query).slice(0, 120),
        address: addr,
        snippet: snippet.slice(0, 220),
      });
      if (results.length >= 3) break;
    }
    if (fromCatalog && !results.some((r) => r.address === fromCatalog.address)) {
      results.unshift(fromCatalog);
    }
    return json({
      ok: true,
      results,
      verifyRequired: true,
      note: 'Suggested addresses — verify against the collection notice or summons letterhead before mailing.',
    });
  } catch {
    return json({
      ok: true,
      results: fromCatalog ? [fromCatalog] : [],
      note: 'Web lookup unavailable — verify any catalog match before mailing.',
      verifyRequired: true,
    });
  }
});
