// Legal web research — Serper official search for coach / escalation context.
// Secrets: SERPER_API_KEY (optional — returns curated-only if missing)

import { corsHeaders } from '../_shared/cors.ts';
import { json, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';

type ReqBody = {
  query: string;
  topic?: 'validation' | 'court' | 'bureau' | 'escalation';
  state?: string;
};

type Snippet = { title: string; link: string; snippet: string };

const OFFICIAL_HOSTS = ['law.cornell.edu', 'consumerfinance.gov', 'ftc.gov', 'naag.org', 'bbb.org', 'gov', 'uscourts.gov'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit({ key: 'legal-research', limit: 30, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const query = String(body.query || '').trim().slice(0, 400);
  if (!query) return json({ ok: true, snippets: [] as Snippet[] });

  const apiKey = Deno.env.get('SERPER_API_KEY') || '';
  if (!apiKey) return json({ ok: true, snippets: [] as Snippet[], note: 'SERPER_API_KEY not configured' });

  const topic = body.topic || 'validation';
  const state = (body.state || '').trim();
  const q = `${query} ${topic === 'court' ? 'debt collection lawsuit answer affidavit' : 'FDCPA debt validation'} ${state ? state + ' state' : ''} site:law.cornell.edu OR site:consumerfinance.gov OR site:ftc.gov`;

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, num: 6 }),
  });

  if (!res.ok) return json({ ok: true, snippets: [] as Snippet[] });

  const data = await res.json();
  const organic = Array.isArray(data?.organic) ? data.organic : [];
  const snippets: Snippet[] = organic
    .filter((row: { link?: string }) => row.link && OFFICIAL_HOSTS.some((h) => String(row.link).includes(h)))
    .slice(0, 5)
    .map((row: { title?: string; link?: string; snippet?: string }) => ({
      title: String(row.title || 'Source').slice(0, 120),
      link: String(row.link),
      snippet: String(row.snippet || '').slice(0, 280),
    }));

  return json({ ok: true, snippets });
});
