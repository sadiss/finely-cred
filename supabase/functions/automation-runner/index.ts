// Supabase Edge Function: automation-runner
// Server-side automation dispatch hook (webhooks, scheduled jobs, platform events).
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EDGE_ADMIN_EMAILS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireAllowlistedEmail, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';
import { authorizeCronOrService } from '../_shared/cronAuth.ts';
import { processDueNurtureEnrollments } from '../_shared/processDueNurtureEnrollments.ts';
import { processAutomationRulesFromDb } from '../_shared/processAutomationRulesFromDb.ts';
import { processServerAutomationQueue } from '../_shared/processServerAutomationQueue.ts';

type ReqBody = {
  action?: 'ping' | 'dispatch' | 'list_hooks' | 'cron_sweep';
  eventType?: string;
  payload?: Record<string, unknown>;
  ruleId?: string;
  dryRun?: boolean;
};

const SERVER_HOOKS: Array<{ eventType: string; ruleId: string; name: string; actions: string[] }> = [
  { eventType: 'lead.created', ruleId: 'hook_lead_welcome', name: 'Lead welcome hook', actions: ['notify_admin', 'webhook_fanout'] },
  { eventType: 'automation.triggered', ruleId: 'hook_lead_scored', name: 'Lead scored hook', actions: ['assign_persona', 'nurture_enqueue'] },
  { eventType: 'automation.triggered', ruleId: 'hook_report_uploaded', name: 'Report uploaded hook', actions: ['draft_dispute_letter', 'assign_staff_task', 'notify_admin'] },
  { eventType: 'automation.triggered', ruleId: 'hook_complaint_detected', name: 'Complaint detected hook', actions: ['queue_compliance_escalation', 'notify_admin'] },
  { eventType: 'task.overdue', ruleId: 'hook_task_overdue', name: 'Task overdue hook', actions: ['notify_admin'] },
  { eventType: 'dispute.letter_mailed', ruleId: 'hook_dispute_mailed', name: 'Dispute mailed hook', actions: ['notify_admin', 'webhook_fanout'] },
  { eventType: 'meta.lead', ruleId: 'hook_meta_lead', name: 'Meta Lead Ad hook', actions: ['assign_persona', 'nurture_enqueue', 'notify_admin'] },
];

const TENANT_ID = 'finely_cred';

function matchHooks(eventType: string) {
  return SERVER_HOOKS.filter((h) => h.eventType === eventType || eventType.startsWith(h.eventType.split('.')[0] ?? ''));
}

async function runCronSweep(args: { dryRun: boolean; userId: string }) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const since48 = new Date(Date.now() - 48 * 3600000).toISOString();

  const { data: leads } = await admin
    .from('lead_captures')
    .select('id, email, source, created_at')
    .gte('created_at', since48)
    .order('created_at', { ascending: false })
    .limit(100);

  let metaInbound = 0;
  try {
    const { data: inbox } = await admin
      .from('meta_inbox_messages')
      .select('id')
      .eq('direction', 'inbound')
      .gte('created_at', since48)
      .limit(50);
    metaInbound = inbox?.length ?? 0;
  } catch {
    metaInbound = 0;
  }

  const dispatches: Array<{ ruleId: string; eventType: string; entityId: string }> = [];
  for (const lead of leads ?? []) {
    dispatches.push({
      ruleId: 'hook_lead_welcome',
      eventType: 'lead.created',
      entityId: String(lead.id),
    });
  }
  if (metaInbound > 0) {
    dispatches.push({
      ruleId: 'hook_meta_lead',
      eventType: 'meta.lead',
      entityId: `meta_batch_${metaInbound}`,
    });
  }

  const mode = args.dryRun ? 'dry_run' : 'live';
  if (!args.dryRun) {
    for (const d of dispatches.slice(0, 25)) {
      await logEdgeEvent({
        namespace: 'automation-runner',
        level: 'info',
        event: 'cron_sweep_dispatch',
        meta: { ...d, mode, userId: args.userId },
      });
    }
  }

  const nurtureProcess = await processDueNurtureEnrollments({
    admin,
    dryRun: args.dryRun,
    tenantId: TENANT_ID,
  });

  const automationRules = await processAutomationRulesFromDb({
    admin,
    dryRun: args.dryRun,
    tenantId: TENANT_ID,
  });

  const serverQueue = await processServerAutomationQueue({
    admin,
    dryRun: args.dryRun,
    tenantId: TENANT_ID,
  });

  return {
    mode,
    leadsScanned: leads?.length ?? 0,
    metaInbound,
    hooksMatched: dispatches.length,
    nurtureCandidates: leads?.length ?? 0,
    nurtureProcess,
    automationRules,
    serverQueue,
    sample: dispatches.slice(0, 10),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const action = body.action ?? 'ping';

    if (action === 'ping') {
      return json(
        { ok: true, service: 'automation-runner', version: 6, hooks: SERVER_HOOKS.length, actions: ['ping', 'dispatch', 'list_hooks', 'cron_sweep'] },
        { headers: corsHeaders },
      );
    }

    if (action === 'cron_sweep') {
      const who = await authorizeCronOrService(req);
      const dryRun = body.dryRun !== false;
      const sweep = await runCronSweep({ dryRun, userId: who.userId });
      await logEdgeEvent({
        namespace: 'automation-runner',
        level: 'info',
        event: 'cron_sweep',
        meta: { ...sweep, auth: who.mode, userId: who.userId },
      });
      return json({ ok: true, ...sweep }, { headers: corsHeaders });
    }

    const auth = await requireAuth(req);
    await requireAllowlistedEmail(auth.user.email);

    if (action === 'list_hooks') {
      return json({ ok: true, hooks: SERVER_HOOKS }, { headers: corsHeaders });
    }

    if (action === 'dispatch') {
      const eventType = String(body.eventType ?? 'unknown');
      const payload = body.payload ?? {};
      const payloadKind = String((payload as Record<string, unknown>).kind ?? '');
      const matched = body.ruleId
        ? SERVER_HOOKS.filter((h) => h.ruleId === body.ruleId)
        : matchHooks(eventType).filter((h) => {
            if (h.ruleId === 'hook_report_uploaded') return payloadKind === 'report_uploaded';
            if (h.ruleId === 'hook_complaint_detected') return payloadKind === 'complaint_detected';
            if (h.ruleId === 'hook_lead_scored') return payloadKind === 'lead_scored';
            return true;
          });
      const mode = body.dryRun === false ? 'live' : 'dry_run';

      await logEdgeEvent({
        namespace: 'automation-runner',
        level: 'info',
        event: 'dispatch',
        meta: {
          eventType,
          ruleId: body.ruleId ?? null,
          matched: matched.map((m) => m.ruleId),
          mode,
          userId: auth.user.id,
        },
      });

      return json(
        {
          ok: true,
          mode,
          eventType,
          matched,
          message:
            mode === 'live'
              ? 'Server hooks acknowledged — pair with client automation bridge (automationEventOps) for draft_dispute_letter and staff tasks.'
              : 'Dry run — hooks matched without side effects.',
          payload,
        },
        { headers: corsHeaders },
      );
    }

    return json({ ok: false, error: 'Unknown action' }, { status: 400, headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'automation-runner error';
    return json({ ok: false, error: msg }, { status: 401, headers: corsHeaders });
  }
});
