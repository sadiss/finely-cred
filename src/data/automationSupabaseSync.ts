/** Supabase sync for automation rules (server cron + multi-admin parity). */
import type { AutomationRule } from '../domain/automationStudio';
import { listAutomationRules, mergeAutomationRulesFromRemote } from '../data/automationStudioRepo';
import { listNurtureEnrollments } from '../lib/nurtureEngine';
import {
  syncAllNurtureEnrollmentsToSupabase,
  syncNurtureEnrollmentsFromSupabase,
} from './nurtureSupabaseSync';
import { drainServerAutomationQueue } from '../lib/drainServerAutomationQueue';
import { syncWorkTasksFromSupabase } from './workTasksSupabaseSync';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

function rowFromRule(rule: AutomationRule) {
  return {
    id: rule.id,
    tenant_id: FINELY_TENANT_ID,
    rule,
    enabled: rule.enabled,
    updated_at: rule.updatedAt,
  };
}

function ruleFromRow(row: Record<string, unknown>): AutomationRule | null {
  const rule = row.rule as AutomationRule | undefined;
  if (!rule?.id) return null;
  return { ...rule, enabled: row.enabled !== false && rule.enabled !== false };
}

export async function syncAutomationRuleToSupabase(rule: AutomationRule) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('automation_rules').upsert(rowFromRule(rule), { onConflict: 'id' });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllAutomationRulesToSupabase(rules?: AutomationRule[]) {
  const payload = rules ?? listAutomationRules();
  if (!payload.length) return { ok: true as const, count: 0 };
  if (!isSupabaseConfigured) return { ok: false as const, count: 0, error: 'Supabase not configured' };
  try {
    const rows = payload.map(rowFromRule);
    const { error } = await supabase.from('automation_rules').upsert(rows, { onConflict: 'id' });
    if (error) return { ok: false as const, count: 0, error: error.message };
    return { ok: true as const, count: payload.length };
  } catch (err: unknown) {
    return { ok: false as const, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAutomationRulesFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('id, rule, enabled, updated_at')
      .eq('tenant_id', FINELY_TENANT_ID)
      .order('updated_at', { ascending: false })
      .limit(500);
    if (error) return { ok: false, count: 0, error: error.message };
    const remote = (data ?? []).map((r) => ruleFromRow(r as Record<string, unknown>)).filter(Boolean) as AutomationRule[];
    if (remote.length === 0) return { ok: true, count: 0 };
    mergeAutomationRulesFromRemote(remote);
    return { ok: true, count: remote.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function ensureOpsPersistenceSyncedOnce() {
  if (!isSupabaseConfigured) return;

  const nurtureRemote = await syncNurtureEnrollmentsFromSupabase();
  if (nurtureRemote.ok && nurtureRemote.count === 0) {
    const local = listNurtureEnrollments(500);
    if (local.length > 0) await syncAllNurtureEnrollmentsToSupabase(local);
  }

  const rulesRemote = await syncAutomationRulesFromSupabase();
  if (rulesRemote.ok && rulesRemote.count === 0) {
    const localRules = listAutomationRules();
    if (localRules.length > 0) await syncAllAutomationRulesToSupabase(localRules);
  }

  await syncWorkTasksFromSupabase(40);
  await drainServerAutomationQueue(12);
}
