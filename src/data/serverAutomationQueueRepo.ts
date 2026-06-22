/** Customer /drain for server-enqueued automation rules (create_task / run_workflow). */
import type { AutomationRule } from '../domain/automationStudio';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type ServerAutomationQueueItem = {
  id: string;
  ruleId: string;
  actionType: string;
  payload: { rule?: AutomationRule };
  createdAt: string;
};

export async function fetchPendingServerAutomationQueue(limit = 20): Promise<ServerAutomationQueueItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('server_automation_queue')
      .select('id, rule_id, action_type, payload, created_at')
      .eq('tenant_id', FINELY_TENANT_ID)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id),
      ruleId: String(row.rule_id),
      actionType: String(row.action_type),
      payload: (row.payload as ServerAutomationQueueItem['payload']) ?? {},
      createdAt: String(row.created_at),
    }));
  } catch {
    return [];
  }
}

export async function markServerAutomationQueueProcessed(id: string) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('server_automation_queue')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', FINELY_TENANT_ID);
  } catch {
    // table may not exist until migration
  }
}

export async function countPendingServerAutomationQueue(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  try {
    const { count, error } = await supabase
      .from('server_automation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', FINELY_TENANT_ID)
      .eq('status', 'pending');
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
