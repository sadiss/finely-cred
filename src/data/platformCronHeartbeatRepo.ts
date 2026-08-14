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
  sendRetryQueue?: {
    due: number;
    sent: number;
    rescheduled: number;
    permanentlyFailed: number;
  };
  updatedAt?: string;
};

export type SendRetryQueueCounts = { pending: number; failed: number };

/** Phase F5 — admin visibility for send_retry_queue (Ops → triage panel). */
export async function fetchSendRetryQueueCounts(): Promise<SendRetryQueueCounts> {
  if (!isSupabaseConfigured) return { pending: 0, failed: 0 };
  try {
    const [pending, failed] = await Promise.all([
      supabase
        .from('send_retry_queue')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', FINELY_TENANT_ID)
        .eq('status', 'pending'),
      supabase
        .from('send_retry_queue')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', FINELY_TENANT_ID)
        .eq('status', 'failed'),
    ]);
    return { pending: pending.count ?? 0, failed: failed.count ?? 0 };
  } catch {
    return { pending: 0, failed: 0 };
  }
}

export type SendRetryQueueItem = {
  id: string;
  channel: 'email' | 'sms';
  toEmail?: string;
  toPhone?: string;
  sourceProcessor: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  status: 'pending' | 'sent' | 'failed';
  nextRetryAt?: string;
  updatedAt: string;
};

/** Recent pending/failed retry-queue rows for the compact admin list view. */
export async function fetchSendRetryQueueItems(limit = 10): Promise<SendRetryQueueItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('send_retry_queue')
      .select('id, channel, to_email, to_phone, source_processor, attempts, max_attempts, last_error, status, next_retry_at, updated_at')
      .eq('tenant_id', FINELY_TENANT_ID)
      .in('status', ['pending', 'failed'])
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id),
      channel: row.channel === 'sms' ? 'sms' : 'email',
      toEmail: row.to_email ? String(row.to_email) : undefined,
      toPhone: row.to_phone ? String(row.to_phone) : undefined,
      sourceProcessor: String(row.source_processor ?? ''),
      attempts: Number(row.attempts ?? 0),
      maxAttempts: Number(row.max_attempts ?? 3),
      lastError: row.last_error ? String(row.last_error) : undefined,
      status: (row.status as SendRetryQueueItem['status']) ?? 'pending',
      nextRetryAt: row.next_retry_at ? String(row.next_retry_at) : undefined,
      updatedAt: String(row.updated_at ?? ''),
    }));
  } catch {
    return [];
  }
}

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
