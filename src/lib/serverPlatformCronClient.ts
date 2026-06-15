/** Invoke server platform-cron edge function (Phase 45). */
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { drainServerAutomationQueue } from './drainServerAutomationQueue';
import { syncWorkTasksFromSupabase } from '../data/workTasksSupabaseSync';

export type ServerPlatformCronPing = {
  ok: boolean;
  steps?: string[];
  voicePipelineVersion?: string;
};

export type ServerPlatformCronTick = {
  ok: boolean;
  at?: string;
  dryRun?: boolean;
  steps?: string[];
  message?: string;
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
    metaInbound?: number;
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
};

export type ServerSocialDuePost = {
  id: string;
  pageId?: string;
  caption: string;
  platforms?: Array<'facebook' | 'instagram' | 'threads' | 'linkedin'>;
  scheduledAt: string;
  status?: string;
  complianceStatus?: string;
  imageUrl?: string;
};

export async function pingServerPlatformCron(): Promise<ServerPlatformCronPing> {
  if (!isSupabaseConfigured) return { ok: false };
  try {
    const { data, error } = await supabase.functions.invoke('platform-cron', { body: { action: 'ping' } });
    if (error || !data?.ok) return { ok: false };
    return {
      ok: true,
      steps: data.steps as string[] | undefined,
      voicePipelineVersion: data.voicePipelineVersion as string | undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function tickServerPlatformCron(args?: {
  dryRun?: boolean;
  source?: string;
  socialDuePosts?: ServerSocialDuePost[];
  loadSocialFromDb?: boolean;
  runAutomationSweep?: boolean;
}): Promise<ServerPlatformCronTick> {
  if (!isSupabaseConfigured) return { ok: false };
  try {
    const { data, error } = await supabase.functions.invoke('platform-cron', {
      body: {
        action: 'tick',
        dryRun: args?.dryRun ?? true,
        source: args?.source ?? 'admin_ui',
        socialDuePosts: args?.socialDuePosts,
        loadSocialFromDb: args?.loadSocialFromDb,
        runAutomationSweep: args?.runAutomationSweep,
      },
    });
    if (error || !data?.ok) return { ok: false };
    const result: ServerPlatformCronTick = {
      ok: true,
      at: data.at as string | undefined,
      dryRun: data.dryRun as boolean | undefined,
      steps: data.steps as string[] | undefined,
      message: data.message as string | undefined,
      socialAutopilot: data.socialAutopilot as ServerPlatformCronTick['socialAutopilot'],
      automationSweep: data.automationSweep as ServerPlatformCronTick['automationSweep'],
      nurture: data.nurture as ServerPlatformCronTick['nurture'],
      automationRules: data.automationRules as ServerPlatformCronTick['automationRules'],
    };
    if (!result.dryRun) {
      await syncWorkTasksFromSupabase(40);
      await drainServerAutomationQueue(12);
    }
    return result;
  } catch {
    return { ok: false };
  }
}
