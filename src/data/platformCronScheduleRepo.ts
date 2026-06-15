import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type PlatformCronSchedule = {
  id: string;
  enabled: boolean;
  intervalMinutes: number;
  dryRun: boolean;
  loadSocialFromDb: boolean;
  runAutomationSweep: boolean;
  notes?: string;
  updatedAt?: string;
};

export async function fetchPlatformCronSchedule(): Promise<PlatformCronSchedule | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('platform_cron_schedule')
      .select('id, enabled, interval_minutes, dry_run, load_social_from_db, run_automation_sweep, notes, updated_at')
      .eq('tenant_id', FINELY_TENANT_ID)
      .eq('id', 'live')
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: String(data.id),
      enabled: Boolean(data.enabled),
      intervalMinutes: Number(data.interval_minutes ?? 15),
      dryRun: Boolean(data.dry_run),
      loadSocialFromDb: data.load_social_from_db !== false,
      runAutomationSweep: data.run_automation_sweep !== false,
      notes: data.notes ? String(data.notes) : undefined,
      updatedAt: data.updated_at ? String(data.updated_at) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildPgCronScheduleSql(args?: { projectUrl?: string; intervalMinutes?: number }) {
  const base = (args?.projectUrl || 'https://YOUR_PROJECT.supabase.co').replace(/\/+$/, '');
  const minutes = args?.intervalMinutes ?? 15;
  const cronExpr = minutes >= 60 ? `0 */${Math.max(1, Math.floor(minutes / 60))} * * *` : `*/${minutes} * * * *`;
  return `select cron.schedule(
  'finely-platform-cron-live',
  '${cronExpr}',
  $$
  select net.http_post(
    url := '${base}/functions/v1/platform-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{"action":"tick","dryRun":false,"source":"pg_cron","loadSocialFromDb":true,"runAutomationSweep":true}'::jsonb
  );
  $$
);`;
}
