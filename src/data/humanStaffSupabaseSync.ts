/** Supabase sync for Human Staff OS — threads, notifications, missions, memories, UI prefs. */
import type {
  HumanStaffMemory,
  HumanStaffMissionPlan,
  HumanStaffNotification,
  HumanStaffStore,
  HumanStaffThread,
} from '../features/humanStaffOs/types';
import {
  loadHumanStaffStore,
  saveHumanStaffStore,
} from '../features/humanStaffOs/humanStaffRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { hydrateTenantStateFromSupabase, migrateLegacyLocalJson, pushTenantStateToSupabase } from './tenantStateRepo';

const PREFS_KEY = 'human_staff_ui_prefs';

type HumanStaffUiPrefs = Pick<HumanStaffStore, 'selectedAgentIds' | 'lastResponseHashes'>;

function threadToRow(thread: HumanStaffThread) {
  return {
    id: thread.id,
    created_at: thread.createdAt,
    updated_at: thread.updatedAt,
    title: thread.title,
    mission_type: thread.missionType,
    status: thread.status,
    city_ids: thread.cityIds,
    assigned_agent_ids: thread.assignedAgentIds,
    summary: thread.summary,
    next_action: thread.nextAction,
    memory: thread.memory,
    messages: thread.messages,
  };
}

function threadFromRow(row: Record<string, unknown>): HumanStaffThread {
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    title: String(row.title ?? ''),
    missionType: String(row.mission_type ?? ''),
    status: (row.status as HumanStaffThread['status']) ?? 'open',
    cityIds: Array.isArray(row.city_ids) ? (row.city_ids as string[]) : [],
    assignedAgentIds: Array.isArray(row.assigned_agent_ids) ? (row.assigned_agent_ids as HumanStaffThread['assignedAgentIds']) : [],
    summary: String(row.summary ?? ''),
    nextAction: String(row.next_action ?? ''),
    memory: Array.isArray(row.memory) ? (row.memory as string[]) : [],
    messages: Array.isArray(row.messages) ? (row.messages as HumanStaffThread['messages']) : [],
  };
}

function notificationToRow(note: HumanStaffNotification) {
  return {
    id: note.id,
    created_at: note.createdAt,
    from_agent_id: note.fromAgentId,
    to_agent_id: note.toAgentId,
    title: note.title,
    body: note.body,
    priority: note.priority,
    read: note.read,
    action_label: note.actionLabel ?? null,
    route_hint: note.routeHint ?? null,
    thread_id: note.threadId ?? null,
  };
}

function notificationFromRow(row: Record<string, unknown>): HumanStaffNotification {
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    fromAgentId: row.from_agent_id as HumanStaffNotification['fromAgentId'],
    toAgentId: row.to_agent_id as HumanStaffNotification['toAgentId'],
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    priority: (row.priority as HumanStaffNotification['priority']) ?? 'normal',
    read: row.read === true,
    actionLabel: row.action_label ? String(row.action_label) : undefined,
    routeHint: row.route_hint ? String(row.route_hint) : undefined,
    threadId: row.thread_id ? String(row.thread_id) : undefined,
  };
}

function memoryToRow(mem: HumanStaffMemory) {
  return {
    id: mem.id,
    created_at: mem.createdAt,
    agent_id: mem.agentId,
    topic: mem.topic,
    detail: mem.detail,
    source: mem.source,
    importance: mem.importance,
  };
}

function memoryFromRow(row: Record<string, unknown>): HumanStaffMemory {
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    agentId: row.agent_id as HumanStaffMemory['agentId'],
    topic: String(row.topic ?? ''),
    detail: String(row.detail ?? ''),
    source: (row.source as HumanStaffMemory['source']) ?? 'system_event',
    importance: Number(row.importance ?? 3) as HumanStaffMemory['importance'],
  };
}

function missionToRow(plan: HumanStaffMissionPlan) {
  return {
    id: plan.id,
    created_at: plan.createdAt,
    lead_agent_id: plan.leadAgentId,
    supporting_agent_ids: plan.supportingAgentIds,
    mission_type: plan.request.missionType,
    title: plan.request.title,
    objective: plan.request.objective,
    city_ids: plan.request.cityIds,
    risk_level: plan.request.riskLevel,
    autonomy: plan.request.autonomy,
    operating_summary: plan.operatingSummary,
    agent_briefs: plan.agentBriefs,
    action_sequence: plan.actionSequence,
    approval_gates: plan.approvalGates,
    expected_outputs: plan.expectedOutputs,
    metadata: { request: plan.request, agentNotifications: plan.agentNotifications },
  };
}

function missionFromRow(row: Record<string, unknown>): HumanStaffMissionPlan {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const request = (meta.request ?? {
    title: row.title,
    objective: row.objective,
    missionType: row.mission_type,
    cityIds: row.city_ids,
    selectedAgentIds: row.supporting_agent_ids,
    riskLevel: row.risk_level,
    autonomy: row.autonomy,
  }) as HumanStaffMissionPlan['request'];

  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    request,
    leadAgentId: row.lead_agent_id as HumanStaffMissionPlan['leadAgentId'],
    supportingAgentIds: Array.isArray(row.supporting_agent_ids)
      ? (row.supporting_agent_ids as HumanStaffMissionPlan['supportingAgentIds'])
      : [],
    operatingSummary: String(row.operating_summary ?? ''),
    agentBriefs: Array.isArray(row.agent_briefs) ? (row.agent_briefs as HumanStaffMissionPlan['agentBriefs']) : [],
    agentNotifications: Array.isArray(meta.agentNotifications)
      ? (meta.agentNotifications as HumanStaffNotification[])
      : [],
    actionSequence: Array.isArray(row.action_sequence) ? (row.action_sequence as string[]) : [],
    approvalGates: Array.isArray(row.approval_gates) ? (row.approval_gates as string[]) : [],
    expectedOutputs: Array.isArray(row.expected_outputs) ? (row.expected_outputs as string[]) : [],
  };
}

export async function syncHumanStaffStoreToSupabase(store?: HumanStaffStore) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  const data = store ?? loadHumanStaffStore();

  try {
    if (data.threads.length) {
      const { error } = await supabase.from('human_staff_threads').upsert(data.threads.map(threadToRow), { onConflict: 'id' });
      if (error) return { ok: false as const, error: error.message };
    }
    if (data.notifications.length) {
      const { error } = await supabase.from('human_staff_notifications').upsert(data.notifications.map(notificationToRow), { onConflict: 'id' });
      if (error) return { ok: false as const, error: error.message };
    }
    if (data.memories.length) {
      const { error } = await supabase.from('human_staff_memories').upsert(data.memories.map(memoryToRow), { onConflict: 'id' });
      if (error) return { ok: false as const, error: error.message };
    }
    if (data.missions.length) {
      const { error } = await supabase.from('human_staff_missions').upsert(data.missions.map(missionToRow), { onConflict: 'id' });
      if (error) return { ok: false as const, error: error.message };
    }

    const prefs: HumanStaffUiPrefs = {
      selectedAgentIds: data.selectedAgentIds,
      lastResponseHashes: data.lastResponseHashes,
    };
    await pushTenantStateToSupabase(PREFS_KEY, prefs);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncHumanStaffStoreFromSupabase(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };

  try {
    const [threadsRes, notesRes, memRes, missionsRes] = await Promise.all([
      supabase.from('human_staff_threads').select('*').order('updated_at', { ascending: false }).limit(80),
      supabase.from('human_staff_notifications').select('*').order('created_at', { ascending: false }).limit(240),
      supabase.from('human_staff_memories').select('*').order('created_at', { ascending: false }).limit(400),
      supabase.from('human_staff_missions').select('*').order('created_at', { ascending: false }).limit(80),
    ]);

    for (const res of [threadsRes, notesRes, memRes, missionsRes]) {
      if (res.error) return { ok: false, error: res.error.message };
    }

    const hasRemote =
      (threadsRes.data?.length ?? 0) > 0 ||
      (notesRes.data?.length ?? 0) > 0 ||
      (memRes.data?.length ?? 0) > 0 ||
      (missionsRes.data?.length ?? 0) > 0;

    const legacy = migrateLegacyLocalJson<HumanStaffStore>('finelycred.humanStaffOs.v1', loadHumanStaffStore(), 1);
    const base = legacy ?? loadHumanStaffStore();

    if (!hasRemote && legacy) {
      saveHumanStaffStore(legacy);
      await syncHumanStaffStoreToSupabase(legacy);
      return { ok: true };
    }

    if (!hasRemote) return { ok: true };

    const prefs = await hydrateTenantStateFromSupabase<HumanStaffUiPrefs>(PREFS_KEY, {
      selectedAgentIds: base.selectedAgentIds,
      lastResponseHashes: base.lastResponseHashes,
    });

    saveHumanStaffStore({
      threads: (threadsRes.data ?? []).map((r) => threadFromRow(r as Record<string, unknown>)),
      notifications: (notesRes.data ?? []).map((r) => notificationFromRow(r as Record<string, unknown>)),
      memories: (memRes.data ?? []).map((r) => memoryFromRow(r as Record<string, unknown>)),
      missions: (missionsRes.data ?? []).map((r) => missionFromRow(r as Record<string, unknown>)),
      selectedAgentIds: prefs.selectedAgentIds,
      lastResponseHashes: prefs.lastResponseHashes,
    });

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

export async function ensureHumanStaffSyncedOnce() {
  const legacy = migrateLegacyLocalJson<HumanStaffStore>('finelycred.humanStaffOs.v1', loadHumanStaffStore(), 1);
  if (legacy) saveHumanStaffStore(legacy);

  if (!isSupabaseConfigured) return;
  await syncHumanStaffStoreFromSupabase();
}
