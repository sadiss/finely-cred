/**
 * Growth agent handoff ledger — Phase 3 "verifiable teamwork" backbone.
 *
 * Every agent-to-agent transition (Caleb -> review queue -> Alex, Esther -> Caleb
 * geo sync, Hannah -> attribution feedback) becomes an explicit, timestamped,
 * queryable row instead of "two agents happen to read the same localStorage key."
 * Local-first (works with zero Supabase config) with best-effort server sync to
 * `growth_agent_handoffs` so the Growth Command Hub can read it cross-device.
 */
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { newId } from '../utils/ids';

const KEY = 'finely.growth_handoffs.v1';

export type GrowthHandoffStatus = 'pending' | 'acked' | 'completed' | 'stalled';

export type GrowthHandoff = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  entityType: string;
  entityId?: string;
  action: string;
  status: GrowthHandoffStatus;
  reasoning?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  ackedAt?: string;
  completedAt?: string;
};

type Store = { rows: GrowthHandoff[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { rows: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, { rows: store.rows.slice(0, 1000) }, 1);
}

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

async function syncHandoffRemote(row: GrowthHandoff) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('growth_agent_handoffs').upsert({
      id: row.id,
      from_agent_id: row.fromAgentId,
      to_agent_id: row.toAgentId,
      entity_type: row.entityType,
      entity_id: row.entityId ?? null,
      action: row.action,
      status: row.status,
      reasoning: row.reasoning ?? null,
      meta: row.meta ?? {},
      created_at: row.createdAt,
      acked_at: row.ackedAt ?? null,
      completed_at: row.completedAt ?? null,
    });
  } catch {
    // best-effort only — local ledger remains source of truth if offline/unconfigured
  }
}

/** Record a new handoff — call at the moment one agent's output becomes another agent's input. */
export function createGrowthHandoff(args: {
  fromAgentId: string;
  toAgentId: string;
  entityType?: string;
  entityId?: string;
  action: string;
  reasoning?: string;
  meta?: Record<string, unknown>;
  /** Some handoffs (deterministic routing) can be created already-completed. */
  status?: GrowthHandoffStatus;
}): GrowthHandoff {
  const row: GrowthHandoff = {
    id: newId('handoff'),
    fromAgentId: args.fromAgentId,
    toAgentId: args.toAgentId,
    entityType: args.entityType ?? 'crm_record',
    entityId: args.entityId,
    action: args.action,
    status: args.status ?? 'pending',
    reasoning: args.reasoning,
    meta: args.meta,
    createdAt: new Date().toISOString(),
    completedAt: args.status === 'completed' ? new Date().toISOString() : undefined,
  };
  const store = loadStore();
  store.rows = [row, ...store.rows];
  saveStore(store);
  dispatchStore();
  void syncHandoffRemote(row);
  return row;
}

export function ackGrowthHandoff(id: string): GrowthHandoff | null {
  const store = loadStore();
  const row = store.rows.find((r) => r.id === id);
  if (!row) return null;
  row.status = 'acked';
  row.ackedAt = new Date().toISOString();
  saveStore(store);
  dispatchStore();
  void syncHandoffRemote(row);
  return row;
}

export function completeGrowthHandoff(id: string): GrowthHandoff | null {
  const store = loadStore();
  const row = store.rows.find((r) => r.id === id);
  if (!row) return null;
  row.status = 'completed';
  row.completedAt = new Date().toISOString();
  saveStore(store);
  dispatchStore();
  void syncHandoffRemote(row);
  return row;
}

/** Mark handoffs stalled if they've sat pending/acked past the timeout (reliability rail). */
export function sweepStalledHandoffs(timeoutMs = 48 * 3600_000): number {
  const store = loadStore();
  const now = Date.now();
  let count = 0;
  for (const row of store.rows) {
    if (row.status === 'pending' || row.status === 'acked') {
      const ageMs = now - Date.parse(row.createdAt);
      if (Number.isFinite(ageMs) && ageMs > timeoutMs) {
        row.status = 'stalled';
        count += 1;
      }
    }
  }
  if (count > 0) {
    saveStore(store);
    dispatchStore();
  }
  return count;
}

export function listGrowthHandoffs(limit = 100): GrowthHandoff[] {
  return loadStore().rows.slice(0, limit);
}

/** Handoffs touching one entity (lead/prospect) — the per-lead verifiable trail. */
export function listGrowthHandoffsForEntity(entityId: string): GrowthHandoff[] {
  return loadStore().rows.filter((r) => r.entityId === entityId);
}

/**
 * Handoffs touching any of several entity ids — used to build a partner's
 * case-team timeline, since a partner's own id and their linked CRM record
 * id(s) may each appear as `entityId` on different handoff rows. Callers
 * resolve the entity id set (e.g. via `crmRecordsRepo`'s `partnerId` field)
 * rather than this repo reaching into CRM data itself.
 */
export function listGrowthHandoffsForEntities(entityIds: string[], limit = 20): GrowthHandoff[] {
  const ids = new Set(entityIds.filter(Boolean));
  if (!ids.size) return [];
  return loadStore()
    .rows.filter((r) => r.entityId && ids.has(r.entityId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Recent handoffs for one agent (as source or target) — feeds the shared team-context. */
export function listGrowthHandoffsForAgent(agentId: string, limit = 20): GrowthHandoff[] {
  return loadStore()
    .rows.filter((r) => r.fromAgentId === agentId || r.toAgentId === agentId)
    .slice(0, limit);
}

export function listStalledGrowthHandoffs(): GrowthHandoff[] {
  return loadStore().rows.filter((r) => r.status === 'stalled');
}
