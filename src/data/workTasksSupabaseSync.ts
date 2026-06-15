/** Merge server-created work_tasks into local Work OS storage. */
import type { TaskItem } from '../domain/tasks';
import { upsertTask } from './tasksRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

function taskFromRow(row: Record<string, unknown>): TaskItem | null {
  const embedded = row.task as TaskItem | undefined;
  const id = String(embedded?.id ?? row.id ?? '').trim();
  const partnerId = String(embedded?.partnerId ?? row.partner_id ?? '').trim();
  const title = String(embedded?.title ?? row.title ?? '').trim();
  if (!id || !partnerId || !title) return null;

  const now = new Date().toISOString();
  return {
    id,
    partnerId,
    projectId: embedded?.projectId ?? (row.project_id ? String(row.project_id) : undefined),
    title,
    kind: (embedded?.kind ?? row.kind ?? 'general') as TaskItem['kind'],
    stage: (embedded?.stage ?? row.stage ?? 'intake') as TaskItem['stage'],
    priority: (embedded?.priority ?? row.priority ?? 'normal') as TaskItem['priority'],
    status: (embedded?.status ?? row.status ?? 'pending') as TaskItem['status'],
    dueAt: embedded?.dueAt ?? (row.due_at ? String(row.due_at) : undefined),
    notes: embedded?.notes ?? (row.notes ? String(row.notes) : undefined),
    tags: Array.isArray(embedded?.tags)
      ? embedded.tags
      : Array.isArray(row.tags)
        ? (row.tags as string[])
        : ['server-automation'],
    assignedTo: (embedded?.assignedTo ?? row.assigned_to ?? 'partner') as TaskItem['assignedTo'],
    visibility: (embedded?.visibility ?? row.visibility ?? 'partner') as TaskItem['visibility'],
    aiGenerated: embedded?.aiGenerated ?? true,
    meta: {
      ...(embedded?.meta ?? {}),
      sourceRuleId: row.source_rule_id ? String(row.source_rule_id) : undefined,
      sourceQueueId: row.source_queue_id ? String(row.source_queue_id) : undefined,
      mergedFromServer: true,
    },
    createdAt: embedded?.createdAt ?? (row.created_at ? String(row.created_at) : now),
    updatedAt: embedded?.updatedAt ?? (row.updated_at ? String(row.updated_at) : now),
    checklist: embedded?.checklist ?? [],
    statusHistory: embedded?.statusHistory ?? [{ at: now, from: 'pending', to: 'pending' }],
  };
}

export async function syncWorkTasksFromSupabase(limit = 40): Promise<{ ok: boolean; merged: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, merged: 0, error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('work_tasks')
      .select(
        'id, partner_id, project_id, title, kind, stage, priority, status, due_at, notes, tags, assigned_to, visibility, source_rule_id, source_queue_id, task, created_at, updated_at',
      )
      .eq('tenant_id', FINELY_TENANT_ID)
      .is('merged_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) return { ok: false, merged: 0, error: error.message };

    let merged = 0;
    const mergedAt = new Date().toISOString();

    for (const row of data ?? []) {
      const task = taskFromRow(row as Record<string, unknown>);
      if (!task) continue;
      upsertTask(task);
      merged += 1;
      await supabase
        .from('work_tasks')
        .update({ merged_at: mergedAt, updated_at: mergedAt })
        .eq('id', task.id)
        .eq('tenant_id', FINELY_TENANT_ID);
    }

    return { ok: true, merged };
  } catch (err: unknown) {
    return { ok: false, merged: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function countUnmergedWorkTasks(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  try {
    const { count, error } = await supabase
      .from('work_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', FINELY_TENANT_ID)
      .is('merged_at', null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
