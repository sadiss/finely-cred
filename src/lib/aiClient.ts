import { supabase, isSupabaseConfigured } from './supabaseClient';
import { addAuditEvent } from '../data/auditRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { buildAgentCallTrace, type AgentCallTraceContext } from './agentCallTrace';
import { recordAgentCallTrace } from '../data/agentCallTraceRepo';

export type AiProviderHint = 'openai' | 'gemini' | 'anthropic';
export type AiResponseFormat = 'text' | 'json';

export type AiGatewayMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type AiGatewayImage = { dataUrl: string; mimeType?: string };
/** Native Anthropic tool definition — see supabase/functions/ai-gateway/index.ts. */
export type AiGatewayToolDef = { name: string; description?: string; input_schema: Record<string, unknown> };
export type AiGatewayToolUse = { id: string; name: string; input: Record<string, unknown> };

export async function callAiGateway(args: {
  taskType: string;
  messages: AiGatewayMessage[];
  images?: AiGatewayImage[];
  context?: Record<string, unknown>;
  providerHint?: AiProviderHint;
  responseFormat?: AiResponseFormat;
  /** Native tool-calling schemas (Anthropic only) — model may return toolUses instead of/alongside text. */
  tools?: AiGatewayToolDef[];
  /**
   * Additive, optional (Phase H2 — structured agent-call trace). When supplied,
   * this call is recorded as a structured `AgentCallTrace` (latency/cost/input/
   * output, linked to an entity/outcome when available) via
   * `agentCallTraceRepo.ts`. Omitting it is a no-op — every existing caller
   * continues to behave exactly as before.
   */
  traceContext?: AgentCallTraceContext;
}): Promise<{ provider: string; model: string; text: string; raw?: unknown; toolUses: AiGatewayToolUse[] }> {
  if (!isFeatureEnabled('aiGateway')) {
    throw new Error('AI Gateway is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const startedAt = args.traceContext ? Date.now() : 0;
  const inputForTrace = args.traceContext ? args.messages.map((m) => `${m.role}: ${m.content}`).join('\n') : '';

  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: {
      taskType: args.taskType,
      messages: args.messages,
      images: args.images ?? undefined,
      context: args.context ?? undefined,
      providerHint: args.providerHint ?? undefined,
      responseFormat: args.responseFormat ?? 'text',
      tools: args.tools ?? undefined,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'AI Gateway call failed.');

  // Best-effort local audit trail (demo mode).
  try {
    addAuditEvent({
      actorType: 'system',
      action: 'ai.gateway.call',
      actorUserId: (await supabase.auth.getUser()).data.user?.id ?? undefined,
      meta: { taskType: args.taskType, provider: data.provider, model: data.model },
    });
  } catch {
    // ignore
  }

  if (args.traceContext) {
    try {
      recordAgentCallTrace(
        buildAgentCallTrace({
          context: args.traceContext,
          taskType: args.taskType,
          input: inputForTrace,
          output: data.text ?? '',
          latencyMs: Date.now() - startedAt,
          provider: data.provider,
          model: data.model,
        }),
      );
    } catch {
      // Trace capture must never affect the primary AI-gateway call path.
    }
  }

  return {
    provider: data.provider,
    model: data.model,
    text: data.text ?? '',
    raw: data.raw,
    toolUses: Array.isArray(data.toolUses) ? data.toolUses : [],
  };
}

const PUBLIC_TASK_TYPES = new Set(['public_chat', 'public_concierge', 'lead_intel_public']);

/** AI gateway for anonymous visitors — no auth session required. */
export async function callPublicAiGateway(args: {
  taskType: string;
  messages: AiGatewayMessage[];
  context?: Record<string, unknown>;
  providerHint?: AiProviderHint;
}): Promise<{ provider: string; model: string; text: string; raw?: unknown }> {
  if (!PUBLIC_TASK_TYPES.has(args.taskType)) {
    throw new Error(`Task type "${args.taskType}" is not allowed for public AI.`);
  }
  if (!isFeatureEnabled('aiGateway')) {
    throw new Error('AI Gateway is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: {
      taskType: args.taskType,
      messages: args.messages,
      context: args.context ?? undefined,
      providerHint: args.providerHint ?? 'openai',
      responseFormat: 'text',
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'AI Gateway call failed.');

  return {
    provider: data.provider,
    model: data.model,
    text: data.text ?? '',
    raw: data.raw,
  };
}

