/**
 * localStorage-first repo for `AgentCallTrace` records, with a best-effort
 * Supabase dual-write (mirrors `crmServerSync.ts`'s `sync*ToSupabase` pattern)
 * so traces survive across browser sessions/devices for post-hoc replay.
 *
 * Migration: `supabase/migrations/20260814020000_agent_call_traces.sql`.
 */
import type { AgentCallTrace } from '../lib/agentCallTrace';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEY = 'finely.agentCallTraces.v1';
const MAX_LOCAL_TRACES = 500;
const SERVER_TENANT_ID = 'finely_cred';

type Store = { traces: AgentCallTrace[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { traces: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function safeStr(v: unknown): string {
  return String(v ?? '').trim();
}

/** Persist a trace locally (source of truth for the current browser) and best-effort mirror it to Supabase. */
export function recordAgentCallTrace(trace: AgentCallTrace): AgentCallTrace {
  const store = loadStore();
  store.traces = [trace, ...store.traces].slice(0, MAX_LOCAL_TRACES);
  saveStore(store);
  void syncAgentCallTraceToSupabase(trace);
  return trace;
}

export function listAgentCallTraces(args?: { agentId?: string; taskType?: string; limit?: number }): AgentCallTrace[] {
  const store = loadStore();
  const agentId = safeStr(args?.agentId);
  const taskType = safeStr(args?.taskType);
  const filtered = store.traces.filter((t) => {
    if (agentId && t.agentId !== agentId) return false;
    if (taskType && t.taskType !== taskType) return false;
    return true;
  });
  const limit = args?.limit && args.limit > 0 ? args.limit : filtered.length;
  return filtered.slice(0, limit);
}

export function clearAgentCallTraces(): void {
  saveStore({ traces: [] });
}

function rowFromTrace(t: AgentCallTrace) {
  return {
    id: t.id,
    tenant_id: SERVER_TENANT_ID,
    agent_id: t.agentId,
    task_type: t.taskType,
    provider: t.provider ?? null,
    model: t.model ?? null,
    prompt_tokens_est: t.promptTokensEst ?? null,
    completion_tokens_est: t.completionTokensEst ?? null,
    latency_ms: t.latencyMs,
    cost_usd_est: t.costUsdEst ?? null,
    input: t.input,
    output: t.output,
    linked_entity_type: t.linkedEntityType ?? null,
    linked_entity_id: t.linkedEntityId ?? null,
    outcome_at_capture: t.outcomeAtCapture ?? null,
    created_at: t.createdAt,
  };
}

function traceFromRow(r: Record<string, unknown>): AgentCallTrace {
  return {
    id: safeStr(r.id),
    agentId: safeStr(r.agent_id),
    taskType: safeStr(r.task_type),
    provider: safeStr(r.provider) || undefined,
    model: safeStr(r.model) || undefined,
    promptTokensEst: r.prompt_tokens_est != null ? Number(r.prompt_tokens_est) : undefined,
    completionTokensEst: r.completion_tokens_est != null ? Number(r.completion_tokens_est) : undefined,
    latencyMs: Number(r.latency_ms ?? 0) || 0,
    costUsdEst: r.cost_usd_est != null ? Number(r.cost_usd_est) : undefined,
    input: safeStr(r.input),
    output: safeStr(r.output),
    linkedEntityType: safeStr(r.linked_entity_type) || undefined,
    linkedEntityId: safeStr(r.linked_entity_id) || undefined,
    outcomeAtCapture: safeStr(r.outcome_at_capture) || undefined,
    createdAt: safeStr(r.created_at) || new Date().toISOString(),
  };
}

/** Best-effort — never throws. Local write already succeeded before this is called. */
export async function syncAgentCallTraceToSupabase(trace: AgentCallTrace): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('agent_call_traces').upsert(rowFromTrace(trace), { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

/**
 * Read-back path (follows `billingSupabaseSync.ts`'s `pullBillingSnapshotFromSupabase`
 * naming convention) — proves the dual-write round-trips, and lets a fresh
 * browser/device restore prior traces for replay/audit.
 */
export async function pullAgentCallTracesFromSupabase(args?: { agentId?: string; limit?: number }): Promise<AgentCallTrace[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase
      .from('agent_call_traces')
      .select('*')
      .eq('tenant_id', SERVER_TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(args?.limit && args.limit > 0 ? args.limit : 200);
    const agentId = safeStr(args?.agentId);
    if (agentId) query = query.eq('agent_id', agentId);

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching agent call traces from Supabase:', error.message);
      return [];
    }
    return (data ?? []).map(traceFromRow);
  } catch (err: unknown) {
    console.warn('Error pulling agent call traces from Supabase:', (err as Error)?.message || String(err));
    return [];
  }
}
