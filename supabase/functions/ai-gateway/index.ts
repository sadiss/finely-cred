// Supabase Edge Function: ai-gateway
// - Routes requests to OpenAI / Gemini / Anthropic
// - Keeps provider secrets server-side (never in browser)
// - Requires authenticated Supabase user JWT
//
// Secrets (set in Supabase):
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY (optional, for audit inserts)
// - OPENAI_API_KEY (optional)
// - OPENAI_MODEL (optional)
// - GEMINI_API_KEY (optional)
// - GEMINI_MODEL (optional)
// - ANTHROPIC_API_KEY (optional)
// - ANTHROPIC_MODEL (optional)

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };
type ReqBody = {
  taskType: string;
  messages: ChatMsg[];
  /** Optional images for vision-capable providers (Gemini v1 in this build). */
  images?: Array<{ dataUrl: string; mimeType?: string }>;
  context?: Record<string, unknown>;
  safetyLevel?: 'normal' | 'strict';
  providerHint?: 'openai' | 'gemini' | 'anthropic';
  responseFormat?: 'text' | 'json';
};

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function pickProvider(args: { taskType: string; hint?: ReqBody['providerHint'] }): 'openai' | 'gemini' | 'anthropic' {
  if (args.hint) return args.hint;
  const t = (args.taskType || '').toLowerCase();
  if (t.includes('coowner') || t.includes('ops.coowner') || t.includes('ops.agent')) return 'anthropic';
  if (t.includes('lead_intel') || t.includes('doc') || t.includes('extract') || t.includes('classify')) return 'gemini';
  if (t.includes('legal') || t.includes('policy') || t.includes('compliance') || t.includes('admin_ops')) return 'anthropic';
  return 'openai';
}

function resolveOpenAiModel(taskType: string): string {
  const t = (taskType || '').toLowerCase();
  if (t.includes('lead_intel')) {
    return Deno.env.get('OPENAI_INTEL_MODEL') || Deno.env.get('OPENAI_MODEL') || 'gpt-4.1';
  }
  if (t.includes('public_chat') || t.includes('concierge')) {
    return Deno.env.get('OPENAI_CHAT_MODEL') || Deno.env.get('OPENAI_MODEL') || 'gpt-4.1';
  }
  return Deno.env.get('OPENAI_MODEL') || 'gpt-4.1';
}

function resolveGeminiModel(taskType: string): string {
  const t = (taskType || '').toLowerCase();
  if (t.includes('doc') || t.includes('extract') || t.includes('classify') || t.includes('lead_intel')) {
    return Deno.env.get('GEMINI_INTEL_MODEL') || Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-pro-preview-05-06';
  }
  return Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-pro-preview-05-06';
}

function resolveAnthropicModel(taskType: string): string {
  const t = (taskType || '').toLowerCase();
  const coOwnerTask = t.includes('coowner') || t.includes('ops.coowner') || t.includes('ops.agent');
  if (coOwnerTask) {
    return Deno.env.get('ANTHROPIC_COOWNER_MODEL') || 'claude-opus-4-20250514';
  }
  if (t.includes('legal') || t.includes('compliance') || t.includes('admin_ops') || t.includes('lead_intel')) {
    return Deno.env.get('ANTHROPIC_INTEL_MODEL') || Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-20250514';
  }
  return Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-20250514';
}

function maxTokensForTask(taskType: string): number {
  const t = (taskType || '').toLowerCase();
  if (t.includes('coowner') || t.includes('ops.coowner')) return 20_480;
  return 1200;
}

function compactMessages(messages: ChatMsg[], taskType: string) {
  const t = (taskType || '').toLowerCase();
  const cap = t.includes('coowner') || t.includes('ops.coowner') ? 120_000 : 24_000;
  return (messages || [])
    .map((m) => ({ role: m.role, content: (m.content || '').toString().slice(0, cap) }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-40);
}

function temperatureForTask(taskType: string): number {
  const t = (taskType || '').toLowerCase();
  if (t.includes('coowner') || t.includes('ops.coowner')) return 0.1;
  return 0.2;
}

async function callOpenAI(args: { apiKey: string; model: string; messages: ChatMsg[]; responseFormat: 'text' | 'json' }) {
  const sys = args.messages.find((m) => m.role === 'system')?.content ?? '';
  const nonSys = args.messages.filter((m) => m.role !== 'system');
  const messages = sys
    ? [{ role: 'system', content: sys }, ...nonSys]
    : nonSys;

  const body: any = {
    model: args.model,
    messages,
    temperature: 0.2,
  };
  if (args.responseFormat === 'json') body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const jsonRes = await res.json();
  const text = jsonRes?.choices?.[0]?.message?.content ?? '';
  return { provider: 'openai' as const, model: args.model, text, raw: jsonRes };
}

async function callAnthropic(args: {
  apiKey: string;
  model: string;
  messages: ChatMsg[];
  responseFormat: 'text' | 'json';
  maxTokens?: number;
  temperature?: number;
}) {
  const sys = args.messages.find((m) => m.role === 'system')?.content ?? '';
  const contentMessages = args.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const body: any = {
    model: args.model,
    max_tokens: args.maxTokens ?? 1200,
    temperature: args.temperature ?? 0.2,
    messages: contentMessages,
  };
  if (sys) body.system = sys;
  if (args.responseFormat === 'json') {
    // Anthropic doesn't have a strict JSON mode; we enforce via instruction.
    body.system = `${(body.system || '').trim()}\n\nReturn ONLY valid JSON. No markdown. No prose.`;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
  const jsonRes = await res.json();
  const text = (jsonRes?.content ?? []).map((c: any) => c?.text ?? '').join('');
  return { provider: 'anthropic' as const, model: args.model, text, raw: jsonRes };
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const s = (dataUrl || '').trim();
  const m = s.match(/^data:([^;]+);base64,(.+)$/);
  if (!m?.[1] || !m?.[2]) return null;
  return { mimeType: m[1], base64: m[2] };
}

async function callGemini(args: {
  apiKey: string;
  model: string;
  messages: ChatMsg[];
  images?: Array<{ dataUrl: string; mimeType?: string }>;
  responseFormat: 'text' | 'json';
}) {
  const sys = args.messages.find((m) => m.role === 'system')?.content ?? '';
  const turns = args.messages.filter((m) => m.role !== 'system');
  const prompt = [
    sys ? `SYSTEM:\n${sys}` : '',
    ...turns.map((m) => `${m.role.toUpperCase()}:\n${m.content}`),
  ]
    .filter(Boolean)
    .join('\n\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
  const instruction = args.responseFormat === 'json' ? 'Return ONLY valid JSON. No markdown. No prose.' : '';
  const parts: any[] = [{ text: `${instruction}\n\n${prompt}`.trim() }];
  for (const img of args.images ?? []) {
    const parsed = parseDataUrl(img.dataUrl);
    if (!parsed) continue;
    parts.push({
      inlineData: {
        mimeType: img.mimeType || parsed.mimeType || 'image/jpeg',
        data: parsed.base64,
      },
    });
  }

  const body = { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.2 } };

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  const jsonRes = await res.json();
  const text = jsonRes?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
  return { provider: 'gemini' as const, model: args.model, text, raw: jsonRes };
}

async function tryInsertAudit(args: {
  supabaseUrl: string;
  serviceKey: string;
  userId: string;
  taskType: string;
  context?: Record<string, unknown>;
  provider: string;
  model: string;
}) {
  // Best-effort: only if your DB has an audit table. If it doesn't exist, ignore.
  // This keeps the function deployable even before DB migrations.
  const client = createClient(args.supabaseUrl, args.serviceKey);
  try {
    await client.from('audit_events').insert({
      actor_user_id: args.userId,
      action: 'ai.gateway.call',
      meta: { taskType: args.taskType, context: args.context ?? null, provider: args.provider, model: args.model },
      created_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!supabaseUrl || !supabaseKey) return json({ error: 'Supabase env not configured' }, { status: 500 });

  const auth = req.headers.get('Authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json({ error: 'Missing Authorization bearer token' }, { status: 401 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const taskType = (body.taskType || '').trim();
  const isPublicTask = taskType === 'public_chat' || taskType === 'public_concierge' || taskType === 'lead_intel_public';

  // Use Supabase client with the provided JWT - supabase/config.toml handles verification automatically
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });

  let userId: string | null = null;
  if (!isPublicTask) {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      console.error('Auth error:', userErr?.message);
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = userRes.user.id;
  }

  const responseFormat = body.responseFormat === 'json' ? 'json' : 'text';
  const messages = compactMessages(body.messages ?? [], taskType);
  if (!taskType || !messages.length) return json({ error: 'taskType and messages are required' }, { status: 400 });

  const provider = pickProvider({ taskType, hint: body.providerHint });

  try {
    let out: { provider: string; model: string; text: string; raw: unknown };
    if (provider === 'openai') {
      const key = Deno.env.get('OPENAI_API_KEY') || '';
      const model = resolveOpenAiModel(taskType);
      if (!key) return json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
      out = await callOpenAI({ apiKey: key, model, messages, responseFormat });
    } else if (provider === 'anthropic') {
      const key = Deno.env.get('ANTHROPIC_API_KEY') || '';
      const model = resolveAnthropicModel(taskType);
      if (!key) return json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
      out = await callAnthropic({
        apiKey: key,
        model,
        messages,
        responseFormat,
        maxTokens: maxTokensForTask(taskType),
        temperature: temperatureForTask(taskType),
      });
    } else {
      const key = Deno.env.get('GEMINI_API_KEY') || '';
      const model = resolveGeminiModel(taskType);
      if (!key) return json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
      out = await callGemini({ apiKey: key, model, messages, images: body.images ?? [], responseFormat });
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (serviceKey && userId) {
      void tryInsertAudit({
        supabaseUrl,
        serviceKey,
        userId,
        taskType,
        context: (body.context as Record<string, unknown> | undefined) ?? undefined,
        provider: out.provider,
        model: out.model,
      });
    }

    return json({
      ok: true,
      taskType,
      provider: out.provider,
      model: out.model,
      text: out.text,
      // raw returned for diagnostics; disable this client-side if you prefer.
      raw: out.raw,
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'AI call failed' }, { status: 500 });
  }
});

