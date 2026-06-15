import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type PlatformCronHeartbeat = {
  at: string;
  dryRun?: boolean;
  source?: string;
  socialAutopilot?: {
    duePosts: number;
    published: number;
    failed: number;
    skipped: number;
    fromDb?: boolean;
  };
  automationSweep?: {
    ok: boolean;
    leadsScanned?: number;
    hooksMatched?: number;
    nurtureCandidates?: number;
    error?: string;
  };
  nurture?: {
    candidates: number;
    leadsScanned: number;
    due?: number;
    advanced?: number;
    completed?: number;
    skipped?: number;
    emailsSent?: number;
    emailsSkipped?: number;
  };
  automationRules?: {
    scanned: number;
    due: number;
    executed: number;
    skipped: number;
    notifyAdmin: number;
    queued?: number;
    tasksQueued?: number;
    workflowsQueued?: number;
  };
  updatedAt?: string;
};

export async function fetchLatestPlatformCronHeartbeat(): Promise<PlatformCronHeartbeat | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('platform_cron_heartbeats')
      .select('payload, updated_at')
      .eq('tenant_id', FINELY_TENANT_ID)
      .eq('id', 'latest')
      .maybeSingle();
    if (error || !data?.payload) return null;
    const payload = data.payload as PlatformCronHeartbeat;
    return { ...payload, updatedAt: String(data.updated_at ?? payload.at) };
  } catch {
    return null;
  }
}
