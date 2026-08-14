// Real server-side action execution for automation-runner `dispatch` (Phase 2 —
// replaces the previous log-only stub). Every send action checks
// public.comms_suppression first (shared with the client's checkSuppression()).
import { logEdgeEvent } from './edgeGuard.ts';
import { checkSuppressionServerSide } from './commsSuppressionCheck.ts';
import { sendServiceEmail } from './commsSendEmail.ts';
import { sendServiceSms } from './commsSendSms.ts';

export type DispatchAction =
  | { type: 'move_crm_stage'; recordId: string; stage: string }
  | { type: 'add_crm_tag'; recordId: string; tag: string }
  | {
      type: 'create_task';
      recordId?: string;
      partnerId?: string;
      title: string;
      kind?: string;
      stage?: string;
      priority?: string;
      dueInDays?: number;
      notes?: string;
      tags?: string[];
    }
  | { type: 'notify_admin'; title: string; body?: string }
  | { type: 'webhook_fanout'; url: string; body?: Record<string, unknown> }
  | { type: 'send_email'; recordId?: string; toEmail?: string; toName?: string; subject: string; body: string }
  | { type: 'send_sms'; recordId?: string; toPhone?: string; body: string };

type CrmRecordRow = {
  id: string;
  stage?: string;
  tags?: string[];
  partner_id?: string | null;
  contact?: { email?: string; phone?: string; fullName?: string } | null;
};

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export type DispatchActionResult = { type: string; ok: boolean; message: string };

async function loadCrmRecord(admin: AdminClient, recordId: string, tenantId: string): Promise<CrmRecordRow | null> {
  try {
    const { data } = await admin
      .from('crm_records')
      .select('id, stage, tags, partner_id, contact')
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

function taskId() {
  return `task_srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Executes one dispatch action for real. `dryRun: true` short-circuits before any write/send. */
export async function executeDispatchAction(args: {
  admin: AdminClient;
  action: DispatchAction;
  dryRun: boolean;
  tenantId?: string;
}): Promise<DispatchActionResult> {
  const { admin, action, dryRun } = args;
  const tenantId = args.tenantId ?? 'finely_cred';

  if (dryRun) {
    return { type: action.type, ok: true, message: `Would run ${action.type}` };
  }

  try {
    if (action.type === 'move_crm_stage') {
      const { error } = await admin.from('crm_records').update({ stage: action.stage, updated_at: new Date().toISOString() }).eq('id', action.recordId);
      if (error) throw new Error(error.message);
      return { type: action.type, ok: true, message: `CRM record ${action.recordId} → stage ${action.stage}` };
    }

    if (action.type === 'add_crm_tag') {
      const record = await loadCrmRecord(admin, action.recordId, tenantId);
      const nextTags = Array.from(new Set([...(record?.tags ?? []), action.tag]));
      const { error } = await admin.from('crm_records').update({ tags: nextTags, updated_at: new Date().toISOString() }).eq('id', action.recordId);
      if (error) throw new Error(error.message);
      return { type: action.type, ok: true, message: `CRM record ${action.recordId} tagged: ${action.tag}` };
    }

    if (action.type === 'create_task') {
      const record = action.recordId ? await loadCrmRecord(admin, action.recordId, tenantId) : null;
      const partnerId = action.partnerId || record?.partner_id || '';
      if (!partnerId) {
        return { type: action.type, ok: false, message: 'create_task skipped — no linked partner id' };
      }
      const id = taskId();
      const dueAt =
        typeof action.dueInDays === 'number'
          ? new Date(Date.now() + Math.max(0, action.dueInDays) * 86400000).toISOString()
          : null;
      const { error } = await admin.from('work_tasks').insert({
        id,
        tenant_id: tenantId,
        partner_id: partnerId,
        title: action.title,
        kind: action.kind ?? 'general',
        stage: action.stage ?? null,
        priority: action.priority ?? null,
        status: 'pending',
        due_at: dueAt,
        notes: action.notes ?? null,
        tags: action.tags ?? ['automation-runner'],
        assigned_to: 'partner',
        visibility: 'partner',
        task: {
          id,
          partnerId,
          title: action.title,
          kind: action.kind ?? 'general',
          stage: action.stage ?? 'intake',
          priority: action.priority ?? 'normal',
          status: 'pending',
          dueAt,
          notes: action.notes ?? undefined,
          tags: action.tags ?? ['automation-runner'],
          assignedTo: 'partner',
          visibility: 'partner',
          aiGenerated: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return { type: action.type, ok: true, message: `Task created for partner ${partnerId}: ${action.title}` };
    }

    if (action.type === 'notify_admin') {
      await logEdgeEvent({ namespace: 'automation-runner', level: 'info', event: 'notify_admin', meta: { title: action.title, body: action.body } });
      return { type: action.type, ok: true, message: `Notified admin: ${action.title}` };
    }

    if (action.type === 'webhook_fanout') {
      const res = await fetch(action.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body ?? {}),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return { type: action.type, ok: true, message: `Webhook posted to ${action.url}` };
    }

    if (action.type === 'send_email' || action.type === 'send_sms') {
      const record = action.recordId ? await loadCrmRecord(admin, action.recordId, tenantId) : null;
      const toEmail = action.type === 'send_email' ? action.toEmail || record?.contact?.email : undefined;
      const toPhone = action.type === 'send_sms' ? action.toPhone || record?.contact?.phone : undefined;

      const suppression = await checkSuppressionServerSide(admin, {
        email: toEmail,
        phone: toPhone,
        channel: action.type === 'send_email' ? 'email' : 'sms',
        tenantId,
      });
      if (suppression.suppressed) {
        return { type: action.type, ok: false, message: `Suppressed (${suppression.reason}) — send skipped` };
      }

      if (action.type === 'send_email') {
        if (!toEmail) return { type: action.type, ok: false, message: 'send_email skipped — no recipient email' };
        const result = await sendServiceEmail({ toEmail, toName: record?.contact?.fullName, subject: action.subject, text: action.body });
        if (!result.ok) throw new Error(result.error ?? 'Email send failed');
        return { type: action.type, ok: true, message: `Email sent to ${toEmail}` };
      }

      if (!toPhone) return { type: action.type, ok: false, message: 'send_sms skipped — no recipient phone' };
      const result = await sendServiceSms({ to: toPhone, body: action.body });
      if (!result.ok) throw new Error(result.error ?? 'SMS send failed');
      return { type: action.type, ok: true, message: `SMS sent to ${toPhone}` };
    }

    return { type: (action as { type: string }).type, ok: false, message: 'Unknown action type' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action execution failed';
    await logEdgeEvent({ namespace: 'automation-runner', level: 'error', event: 'dispatch_action_failed', meta: { action, message } });
    return { type: action.type, ok: false, message };
  }
}

export async function executeDispatchActions(args: {
  admin: AdminClient;
  actions: DispatchAction[];
  dryRun: boolean;
  tenantId?: string;
}): Promise<DispatchActionResult[]> {
  const out: DispatchActionResult[] = [];
  for (const action of args.actions.slice(0, 25)) {
    // eslint-disable-next-line no-await-in-loop
    out.push(await executeDispatchAction({ admin: args.admin, action, dryRun: args.dryRun, tenantId: args.tenantId }));
  }
  return out;
}
