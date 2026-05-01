// Supabase Edge Function: doc-intel
// Purpose: document classification + entity extraction (JSON output).
// This is intentionally provider-agnostic, but Gemini is the default in v1.

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type ReqBody = {
  text?: string;
  caption?: string;
  images?: Array<{ dataUrl: string; mimeType?: string }>;
};

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const s = (dataUrl || '').trim();
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m?.[1] || !m?.[2]) return null;
  return { mimeType: m[1], base64: m[2] };
}

async function callGemini(args: { apiKey: string; model: string; prompt: string; images?: Array<{ dataUrl: string; mimeType?: string }> }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
  const parts: any[] = [{ text: args.prompt }];
  for (const img of args.images ?? []) {
    const parsed = parseDataUrl(img.dataUrl);
    if (!parsed) continue;
    parts.push({ inlineData: { mimeType: img.mimeType || parsed.mimeType, data: parsed.base64 } });
  }
  const body = { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.2 } };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  const jsonRes = await res.json();
  const text = jsonRes?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
  return { text, raw: jsonRes };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!supabaseUrl || !supabaseAnon) return json({ error: 'Supabase env not configured' }, { status: 500 });

  const auth = req.headers.get('Authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json({ error: 'Missing Authorization bearer token' }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: auth } } });
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const system = `Return ONLY valid JSON.\n\nShape:\n{\n  \"docType\": \"articles_of_incorporation\"|\"ein_letter\"|\"id_document\"|\"utility_bill\"|\"bank_statement\"|\"credit_report\"|\"bureau_response\"|\"contract\"|\"other\"|\"unknown\",\n  \"summary\": string,\n  \"confidence\": number,\n  \"entities\": {\n    \"ein\": string,\n    \"businessLegalName\": string,\n    \"state\": string,\n    \"address\": string,\n    \"personName\": string\n  }\n}\n\nRules:\n- EIN digits only (9 digits) if present.\n- Omit missing fields or use empty string.\n- Summary 1-2 sentences max.`;

  const prompt = [
    system,
    body.caption ? `CAPTION:\n${body.caption}` : '',
    body.text ? `TEXT:\n${String(body.text).slice(0, 60_000)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const key = Deno.env.get('GEMINI_API_KEY') || '';
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
  if (!key) return json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });

  try {
    const out = await callGemini({ apiKey: key, model, prompt, images: body.images ?? [] });
    return json({ ok: true, provider: 'gemini', model, text: out.text, raw: out.raw });
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'doc-intel failed' }, { status: 500 });
  }
});

