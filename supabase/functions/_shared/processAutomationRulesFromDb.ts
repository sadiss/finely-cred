/** Execute due automation rules from Supabase (server-safe + queue heavy actions). */
import { logEdgeEvent } from './edgeGuard.ts';

type AdminClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string | boolean) => {
        order?: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null }>;
        };
        limit?: (n: number) => Promise<{ data: Record<string, unknown>[] | null }>;
      };
    };
    insert: (row: Record<string, unknown>) => Promise<unknown>;
  };
};

type AutomationRuleJson = {
  id?: string;
  name?: string;
  trigger?: { type?: string; everyHours?: number };
  conditions?: unknown[];
  actions?: Array<{ type?: string; title?: string; body?: string; workflowId?: string }>;
  meta?: { lastRunAt?: string; recipeId?: string };
};

export type AutomationRulesProcessResult = {
  scanned: number;
  due: number;
  executed: number;
  skipped: number;
  notifyAdmin: number;
  queued: number;
  tasksQueued: number;
  workflowsQueued: number;
};

function ruleId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function processAutomationRulesFromDb(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
}): Promise<AutomationRulesProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const nowIso = new Date().toISOString();

  const { data: ruleRows } = await args.admin
    .from('automation_rules')
    .select('id, rule, enabled, updated_at')
    .eq('tenant_id', tenantId)
    .eq('enabled', true)
    .limit(200);

  const rows = ruleRows ?? [];
  let due = 0;
  let executed = 0;
  let skipped = 0;
  let notifyAdmin = 0;
  let queued = 0;
  let tasksQueued = 0;
  let workflowsQueued = 0;

  const lastRunByRule = new Map<string, string>();
  try {
    const { data: runRows } = await args.admin
      .from('automation_rule_runs')
      .select('rule_id, started_at')
      .eq('tenant_id', tenantId)
      .order('started_at', { ascending: false })
      .limit(300);
    for (const run of runRows ?? []) {
      const rid = String(run.rule_id ?? '');
      if (rid && !lastRunByRule.has(rid)) lastRunByRule.set(rid, String(run.started_at));
    }
  } catch {
    // table may not exist until migration
  }

  for (const row of rows) {
    const rule = (row.rule as AutomationRuleJson) ?? {};
    const trigger = rule.trigger;
    if (trigger?.type !== 'interval') {
      skipped += 1;
      continue;
    }

    const everyHours = Number(trigger.everyHours ?? 24);
    if (!Number.isFinite(everyHours) || everyHours <= 0) {
      skipped += 1;
      continue;
    }

    const lastRunAt = lastRunByRule.get(String(row.id)) ?? rule.meta?.lastRunAt;
    if (lastRunAt) {
      const elapsed = Date.now() - Date.parse(lastRunAt);
      if (elapsed < everyHours * 3600000) {
        skipped += 1;
        continue;
      }
    }

    const actions = Array.isArray(rule.actions) ? rule.actions : [];
    const notifyActions = actions.filter((a) => a?.type === 'notify_admin');
    const heavyActions = actions.filter((a) => a?.type === 'create_task' || a?.type === 'run_workflow');

    if (!notifyActions.length && !heavyActions.length && actions.length > 0) {
      skipped += 1;
      continue;
    }

    due += 1;
    let ruleNotify = 0;
    let ruleQueued = 0;

    for (const action of notifyActions) {
      ruleNotify += 1;
      if (!args.dryRun) {
        await logEdgeEvent({
          namespace: 'automation-rules',
          level: 'info',
          event: 'notify_admin',
          meta: {
            ruleId: String(row.id),
            ruleName: rule.name ?? String(row.id),
            title: action.title ?? 'Automation notify',
            body: action.body ?? '',
            mode: 'live',
          },
        });
      }
    }

    notifyAdmin += ruleNotify;

    if (heavyActions.length) {
      tasksQueued += heavyActions.filter((a) => a.type === 'create_task').length;
      workflowsQueued += heavyActions.filter((a) => a.type === 'run_workflow').length;
      if (!args.dryRun) {
        try {
          await args.admin.from('server_automation_queue').insert({
            id: ruleId('saq'),
            tenant_id: tenantId,
            rule_id: String(row.id),
            action_type: 'execute_rule',
            payload: {
              rule: { ...rule, id: String(row.id) },
              heavyActionTypes: heavyActions.map((a) => a.type),
            },
            status: 'pending',
            created_at: nowIso,
          });
          ruleQueued += 1;
        } catch {
          // queue table may not exist until migration
        }
      } else {
        ruleQueued += 1;
      }
      queued += ruleQueued;
    }

    if (ruleNotify > 0 || ruleQueued > 0) executed += 1;

    if (!args.dryRun && (ruleNotify > 0 || ruleQueued > 0)) {
      try {
        await args.admin.from('automation_rule_runs').insert({
          id: ruleId('run'),
          tenant_id: tenantId,
          rule_id: String(row.id),
          started_at: nowIso,
          mode: 'live',
          summary: `${ruleNotify} notify · ${ruleQueued} queued for server execution`,
          payload: { notifyAdmin: ruleNotify, queued: ruleQueued, ruleName: rule.name ?? null },
        });
      } catch {
        // ignore if migration pending
      }
    }
  }

  return { scanned: rows.length, due, executed, skipped, notifyAdmin, queued, tasksQueued, workflowsQueued };
}
