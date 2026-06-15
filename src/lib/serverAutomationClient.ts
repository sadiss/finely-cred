import { isSupabaseConfigured, supabase } from './supabaseClient';

export type AutomationDispatchArgs = {
  eventType: string;
  payload?: Record<string, unknown>;
  ruleId?: string;
  dryRun?: boolean;
};

/** Fire-and-forget server automation-runner dispatch (Phase 10). */
export async function dispatchAutomationRunner(args: AutomationDispatchArgs): Promise<{ ok: boolean; matched?: unknown[] }> {
  if (!isSupabaseConfigured) return { ok: false };
  try {
    const { data, error } = await supabase.functions.invoke('automation-runner', {
      body: {
        action: 'dispatch',
        eventType: args.eventType,
        payload: args.payload ?? {},
        ruleId: args.ruleId,
        dryRun: args.dryRun ?? true,
      },
    });
    if (error) return { ok: false };
    return { ok: Boolean(data?.ok), matched: data?.matched };
  } catch {
    return { ok: false };
  }
}

export async function listServerAutomationHooks() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.functions.invoke('automation-runner', { body: { action: 'list_hooks' } });
    if (error || !data?.ok) return [];
    return (data.hooks ?? []) as Array<{ eventType: string; ruleId: string; name: string }>;
  } catch {
    return [];
  }
}

export async function runServerAutomationCronSweep(args?: { dryRun?: boolean }) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase.functions.invoke('automation-runner', {
      body: { action: 'cron_sweep', dryRun: args?.dryRun ?? true },
    });
    if (error || !data?.ok) return { ok: false as const, error: error?.message ?? data?.error ?? 'cron_sweep failed' };
    return {
      ok: true as const,
      leadsScanned: Number(data.leadsScanned ?? 0),
      metaInbound: Number(data.metaInbound ?? 0),
      hooksMatched: Number(data.hooksMatched ?? 0),
      nurtureCandidates: Number(data.nurtureCandidates ?? 0),
      nurtureProcess: data.nurtureProcess as
        | {
            due: number;
            advanced: number;
            completed: number;
            skipped: number;
            emailsSent?: number;
            emailsSkipped?: number;
          }
        | undefined,
      automationRules: data.automationRules as
        | { scanned: number; due: number; executed: number; skipped: number; notifyAdmin: number }
        | undefined,
    };
  } catch (e: unknown) {
    return { ok: false as const, error: (e as Error)?.message ?? 'cron_sweep failed' };
  }
}
