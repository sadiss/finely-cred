// Edge Function: vault-intelligence
// ML-powered vault analysis, web research hints, and secret intel bundles for owners + NCG.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

type Body = {
  action: 'analyze_item' | 'web_research' | 'generate_secrets';
  tenantId: string;
  title: string;
  notes?: string;
  sourceUrl?: string;
  mediaKind?: string;
  tags?: string[];
  researchDepth?: 'quick' | 'deep';
};

async function fetchUrlSnippet(url: string): Promise<{ title: string; excerpt: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FinelyCred-VaultIntel/1.0', Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 120_000);
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? url;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);
    return { title, excerpt: text };
  } catch {
    return null;
  }
}

async function callOpenAI(args: { apiKey: string; model: string; system: string; user: string }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    await requireAuth(req);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title = String(body.title || '').trim();
  if (!title) return json({ error: 'title required' }, { status: 400 });

  const sourceUrl = String(body.sourceUrl || '').trim();
  let webSnippets: Array<{ title: string; url: string; excerpt: string }> = [];
  if (sourceUrl) {
    const snip = await fetchUrlSnippet(sourceUrl);
    if (snip) webSnippets.push({ url: sourceUrl, ...snip });
  }

  const researchQueries = [
    `${title} FCRA compliance credit dispute`,
    `${title} business credit vendor net-30`,
    `${title} Nora Capital funding underwriting signals`,
    `${title} CFPB regulatory guidance`,
  ];
  if (body.mediaKind === 'youtube') researchQueries.unshift(`${title} credit education video summary`);

  const openaiKey = (Deno.env.get('OPENAI_API_KEY') || '').trim();
  const model = (Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini').trim();

  let intel: Record<string, unknown> = {
    summary: `Intelligence bundle for "${title}" (${body.mediaKind ?? 'asset'}).`,
    keyPoints: [
      'Tag and share across agent, owner, and NCG ops roles as appropriate.',
      'Cross-reference with partner readiness and dispute letter vault.',
    ],
    researchQueries,
    suggestedTags: [...new Set([...(body.tags ?? []), body.mediaKind ?? 'vault', 'intel'].filter(Boolean))],
    webSnippets,
    confidence: webSnippets.length ? 0.72 : 0.55,
    model: 'heuristic',
    generatedAt: new Date().toISOString(),
  };

  if (openaiKey) {
    try {
      const ai = await callOpenAI({
        apiKey: openaiKey,
        model,
        system:
          'You are Finely Cred vault intelligence — credit restoration, business credit, and Nora Capital funding ops. Return JSON: summary, keyPoints[], riskFlags[], opportunities[], suggestedTags[], researchQueries[], confidence (0-1).',
        user: JSON.stringify({
          action: body.action,
          title,
          notes: body.notes ?? '',
          sourceUrl,
          mediaKind: body.mediaKind,
          webSnippets,
          depth: body.researchDepth ?? 'quick',
        }),
      });
      intel = { ...intel, ...ai, webSnippets, model, generatedAt: new Date().toISOString() };
    } catch {
      // keep heuristic intel
    }
  }

  if (body.action === 'generate_secrets') {
    intel.opportunities = [
      ...(Array.isArray(intel.opportunities) ? intel.opportunities : []),
      'Sync NCG-shared vault intel via finely-partner-api vault.intel_feed',
      'Use partner.evidence_manifest before funding handoff',
    ];
  }

  return json({ ok: true, intel });
});
