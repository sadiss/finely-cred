// Server-side "task_overdue" cron step — tags overdue public.work_tasks rows so
// they're queryable/alertable without an admin browser open. This mirrors the
// intent of the client-only workTaskOverdueEngine.ts, but the client engine
// escalates via local notificationsRepo.ts (localStorage) and SLA task
// creation, which has no server-side table equivalent yet — so this server
// step focuses on the part that *can* run safely without inventing new infra:
// idempotently marking overdue tasks so a future admin surface (or the
// existing client engine, once it syncs) can pick them up.
import { logEdgeEvent } from './edgeGuard.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export type TaskOverdueSweepResult = { scanned: number; overdue: number; tagged: number };

export async function processTaskOverdueSweep(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
  limit?: number;
}): Promise<TaskOverdueSweepResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const limit = args.limit ?? 200;
  const nowIso = new Date().toISOString();

  const { data: rows } = await args.admin
    .from('work_tasks')
    .select('id, due_at, status, tags')
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'in_progress'])
    .lte('due_at', nowIso)
    .limit(limit);

  const candidates = (rows ?? []).filter((r: { tags?: string[] }) => !Array.isArray(r.tags) || !r.tags.includes('overdue_notified'));

  let tagged = 0;
  if (!args.dryRun) {
    for (const row of candidates) {
      const tags = Array.from(new Set([...(row.tags ?? []), 'overdue_notified']));
      // eslint-disable-next-line no-await-in-loop
      const { error } = await args.admin.from('work_tasks').update({ tags, updated_at: nowIso }).eq('id', row.id);
      if (!error) tagged += 1;
    }
    if (candidates.length) {
      await logEdgeEvent({
        namespace: 'platform-cron',
        level: 'info',
        event: 'task_overdue_sweep',
        meta: { scanned: rows?.length ?? 0, overdue: candidates.length, tagged },
      });
    }
  }

  return { scanned: rows?.length ?? 0, overdue: candidates.length, tagged: args.dryRun ? 0 : tagged };
}
