/** Drain server_automation_queue — execute create_task server-side into work_tasks. */
import { logEdgeEvent } from './edgeGuard.ts';

type AdminClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null; error?: { message: string } | null }>;
        };
        is?: (col: string, val: null) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null; error?: { message: string } | null }>;
          };
        };
      };
      in?: (col: string, vals: string[]) => Promise<{ data: Record<string, unknown>[] | null; error?: { message: string } | null }>;
    };
    insert: (row: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ error?: { message: string } | null }>;
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error?: { message: string } | null }>;
    };
  };
};

type CreateTaskAction = {
  type?: string;
  title?: string;
  kind?: string;
  stage?: string;
  priority?: string;
  dueInDays?: number;
  notes?: string;
  tags?: string[];
  partnerId?: string;
  maxPerRun?: number;
};

type AutomationRuleJson = {
  id?: string;
  name?: string;
  actions?: CreateTaskAction[];
};

export type ServerAutomationQueueProcessResult = {
  scanned: number;
  processed: number;
  tasksCreated: number;
  failed: number;
  skipped: number;
};

function ruleId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + Math.max(0, days));
  return d.toISOString();
}

export async function processServerAutomationQueue(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
  limit?: number;
}): Promise<ServerAutomationQueueProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const limit = args.limit ?? 20;
  const nowIso = new Date().toISOString();

  const { data: pendingRows, error: pendingErr } = await args.admin
    .from('server_automation_queue')
    .select('id, rule_id, action_type, payload, created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (pendingErr || !pendingRows?.length) {
    return { scanned: pendingRows?.length ?? 0, processed: 0, tasksCreated: 0, failed: 0, skipped: 0 };
  }

  let processed = 0;
  let tasksCreated = 0;
  let failed = 0;
  let skipped = 0;

  const { data: partnerRows } = await args.admin
    .from('partners')
    .select('id, status')
    .eq('tenant_id', tenantId)
    .limit(500);

  const activePartnerIds = (partnerRows ?? [])
    .filter((p) => {
      const status = String(p.status ?? 'active');
      return status === 'active' || status === 'invited';
    })
    .map((p) => String(p.id));

  for (const row of pendingRows) {
    const queueId = String(row.id ?? '');
    const actionType = String(row.action_type ?? '');
    const payload = (row.payload as { rule?: AutomationRuleJson }) ?? {};
    const rule = payload.rule ?? {};
    const actions = Array.isArray(rule.actions) ? rule.actions : [];
    const createActions = actions.filter((a) => a?.type === 'create_task');
    const workflowActions = actions.filter((a) => a?.type === 'run_workflow');

    if (actionType !== 'execute_rule') {
      skipped += 1;
      continue;
    }

    if (!createActions.length) {
      skipped += 1;
      continue;
    }

    try {
      let itemTasks = 0;
      for (const action of createActions) {
        const title = String(action.title ?? '').trim();
        if (!title) continue;

        const explicitPartner = String(action.partnerId ?? '').trim();
        const maxPerRun = Number.isFinite(Number(action.maxPerRun)) ? Math.max(1, Number(action.maxPerRun)) : 50;
        const partnerIds = explicitPartner
          ? [explicitPartner]
          : activePartnerIds.slice(0, maxPerRun);

        const dueAt =
          typeof action.dueInDays === 'number' ? addDaysIso(Math.max(0, action.dueInDays)) : undefined;

        for (const partnerId of partnerIds) {
          const taskId = ruleId('task');
          const taskRow = {
            id: taskId,
            tenant_id: tenantId,
            partner_id: partnerId,
            title,
            kind: String(action.kind ?? 'general'),
            stage: action.stage ? String(action.stage) : null,
            priority: action.priority ? String(action.priority) : null,
            status: 'pending',
            due_at: dueAt ?? null,
            notes: action.notes ? String(action.notes) : null,
            tags: Array.isArray(action.tags) ? action.tags : [],
            assigned_to: 'partner',
            visibility: 'partner',
            source_rule_id: String(row.rule_id ?? rule.id ?? ''),
            source_queue_id: queueId,
            task: {
              id: taskId,
              partnerId,
              title,
              kind: action.kind ?? 'general',
              stage: action.stage ?? 'intake',
              priority: action.priority ?? 'normal',
              status: 'pending',
              dueAt,
              notes: action.notes ?? undefined,
              tags: Array.isArray(action.tags) ? action.tags : ['server-automation'],
              assignedTo: 'partner',
              visibility: 'partner',
              aiGenerated: true,
              meta: { sourceRuleId: String(row.rule_id ?? rule.id ?? ''), sourceQueueId: queueId },
            },
            created_at: nowIso,
            updated_at: nowIso,
          };

          if (!args.dryRun) {
            const { error: insertErr } = await args.admin.from('work_tasks').insert(taskRow);
            if (insertErr) throw new Error(insertErr.message);
          }
          itemTasks += 1;
        }
      }

      tasksCreated += itemTasks;

      if (!args.dryRun) {
        if (workflowActions.length) {
          await args.admin
            .from('server_automation_queue')
            .update({
              payload: {
                ...payload,
                rule: { ...rule, actions: workflowActions },
                heavyActionTypes: workflowActions.map((a) => a.type),
                serverTasksCreated: itemTasks,
              },
            })
            .eq('id', queueId);
        } else {
          await args.admin
            .from('server_automation_queue')
            .update({ status: 'processed', processed_at: nowIso })
            .eq('id', queueId);
        }

        await logEdgeEvent({
          namespace: 'server-automation-queue',
          level: 'info',
          event: 'create_task_executed',
          meta: {
            queueId,
            ruleId: String(row.rule_id ?? ''),
            tasksCreated: itemTasks,
            ruleName: rule.name ?? null,
          },
        });
      }

      processed += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    scanned: pendingRows.length,
    processed,
    tasksCreated,
    failed,
    skipped,
  };
}
