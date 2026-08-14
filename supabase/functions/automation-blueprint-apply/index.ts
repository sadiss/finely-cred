// Supabase Edge Function: automation-blueprint-apply
// Turns a Growth Blueprint (src/features/studioCommandOs/automationBlueprints.ts)
// into a real trigger→wait→action automation rule persisted to
// public.automation_rules — the same table automation-runner's cron_sweep
// (processAutomationRulesFromDb.ts) and the client automationStudioRepo.ts
// both read. Previously this endpoint accepted a blueprintId and returned a
// canned "draft_created" message without writing anything.
//
// The blueprint's node library (trigger/condition/action/delay/split/approval/exit)
// has no structured trigger/condition/action payloads — only human-readable
// title/subtitle/detail text — so this maps each node type to a safe, real
// AutomationRule flow node:
//   trigger  -> inferred AutomationTrigger (keyword heuristics, default 'manual')
//   condition/split -> flow 'condition'/'branch' node (defaults to "always" — the
//                       blueprint's compliance/consent gates need a human to wire
//                       the real field/value once reviewed)
//   delay    -> flow 'wait' node (hours parsed from the node text, default 24h)
//   action/approval -> flow 'action' node executing `notify_admin` — never a
//                       live send, so an approval-gated blueprint can never
//                       auto-message someone before a human reviews the rule
//   exit     -> flow 'goal' node
//
// The created rule is always persisted with enabled:false — an admin must
// review and enable it from Automation Studio (or by upserting enabled:true).
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EDGE_ADMIN_EMAILS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireAllowlistedEmail, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

type BlueprintNode = {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'split' | 'approval' | 'exit';
  title: string;
  subtitle?: string;
  detail?: string;
  risk?: 'low' | 'medium' | 'high';
};

type ReqBody = {
  blueprintId?: string;
  title?: string;
  category?: string;
  nodes?: BlueprintNode[];
};

const TENANT_ID = 'finely_cred';

function inferTrigger(node: BlueprintNode | undefined): Record<string, unknown> {
  const text = `${node?.title ?? ''} ${node?.subtitle ?? ''} ${node?.detail ?? ''}`.toLowerCase();
  if (text.includes('webhook')) return { type: 'webhook_inbound' };
  if (text.includes('meta lead') || text.includes('instant form')) return { type: 'meta_lead_form' };
  if (text.includes('form') || text.includes('opt-in') || text.includes('captured')) return { type: 'form_submit' };
  if (text.includes('appointment missed') || text.includes('no-show')) return { type: 'task_overdue' };
  if (text.includes('stage')) return { type: 'crm_stage_changed' };
  return { type: 'manual' };
}

function parseWaitHours(node: BlueprintNode): number {
  const text = `${node.title} ${node.subtitle ?? ''} ${node.detail ?? ''}`.toLowerCase();
  const dayMatch = text.match(/(\d+)\s*day/);
  if (dayMatch) return Number(dayMatch[1]) * 24;
  const hourMatch = text.match(/(\d+)\s*(hour|hr)/);
  if (hourMatch) return Number(hourMatch[1]);
  const minuteMatch = text.match(/(\d+)\s*(minute|min)/);
  if (minuteMatch) return Math.max(1, Math.round(Number(minuteMatch[1]) / 60));
  return 24;
}

function buildFlowFromBlueprint(nodes: BlueprintNode[]) {
  const flowNodes: Array<{ id: string; type: string; label: string; data: Record<string, unknown>; position: { x: number; y: number } }> = [];
  const edges: Array<{ id: string; source: string; target: string; label?: string }> = [];

  let y = 40;
  let prevId: string | null = null;
  const triggerSource = nodes.find((n) => n.type === 'trigger');
  const trigger = inferTrigger(triggerSource);

  flowNodes.push({ id: 'trigger_0', type: 'trigger', label: triggerSource?.title ?? 'Blueprint trigger', data: { trigger }, position: { x: 80, y } });
  prevId = 'trigger_0';
  y += 120;

  const conditions: Record<string, unknown>[] = [];
  const actions: Record<string, unknown>[] = [];

  nodes
    .filter((n) => n.type !== 'trigger')
    .forEach((node, i) => {
      const id = `${node.type}_${i}`;
      let type = 'action';
      let data: Record<string, unknown> = {};

      if (node.type === 'condition') {
        type = 'condition';
        data = { condition: { type: 'always' } };
        conditions.push(data.condition as Record<string, unknown>);
      } else if (node.type === 'split') {
        type = 'branch';
        data = { branchLabel: node.title };
      } else if (node.type === 'delay') {
        type = 'wait';
        data = { waitHours: parseWaitHours(node) };
      } else if (node.type === 'exit') {
        type = 'goal';
        data = {};
      } else {
        // action / approval — always a safe notify_admin default; never a live send until reviewed.
        type = 'action';
        const action = {
          type: 'notify_admin',
          title: node.type === 'approval' ? `Review required: ${node.title}` : node.title,
          body: node.detail || node.subtitle || `Blueprint step "${node.title}" — review before enabling this automation.`,
        };
        data = { action };
        actions.push(action);
      }

      flowNodes.push({ id, type, label: node.title, data, position: { x: 80, y } });
      edges.push({ id: `e_${prevId}_${id}`, source: prevId!, target: id });
      prevId = id;
      y += 120;
    });

  if (!flowNodes.some((n) => n.type === 'goal')) {
    flowNodes.push({ id: 'goal_end', type: 'goal', label: 'Complete', data: {}, position: { x: 80, y } });
    edges.push({ id: `e_${prevId}_goal_end`, source: prevId!, target: 'goal_end' });
  }

  return { flow: { nodes: flowNodes, edges }, trigger, conditions: conditions.length ? conditions : [{ type: 'always' }], actions };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    await requireAllowlistedEmail(auth);

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const blueprintId = String(body.blueprintId ?? '').trim();
    if (!blueprintId) return json({ ok: false, error: 'blueprintId required' }, { status: 400, headers: corsHeaders });

    const nodes = Array.isArray(body.nodes) ? body.nodes : [];
    if (!nodes.length) {
      return json(
        { ok: false, error: 'nodes required — pass the full blueprint (id, title, category, nodes) from AUTOMATION_BLUEPRINTS so the server does not need its own copy of the blueprint library.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const title = String(body.title ?? blueprintId).trim();
    const { flow, trigger, conditions, actions } = buildFlowFromBlueprint(nodes);

    const now = new Date().toISOString();
    const ruleId = `bp_${blueprintId}_${Date.now().toString(36)}`;
    const rule = {
      id: ruleId,
      name: title,
      enabled: false,
      createdAt: now,
      updatedAt: now,
      trigger,
      conditions,
      actions,
      flow,
      meta: { blueprintId, category: body.category ?? null, createdFrom: 'automation-blueprint-apply', requiresReview: true },
    };

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { error } = await admin
      .from('automation_rules')
      .upsert({ id: ruleId, tenant_id: TENANT_ID, rule, enabled: false, updated_at: now }, { onConflict: 'id' });
    if (error) throw new Error(error.message);

    await logEdgeEvent({
      namespace: 'automation-blueprint-apply',
      level: 'info',
      event: 'rule_created',
      meta: { blueprintId, ruleId, nodeCount: nodes.length, userId: auth.user.id },
    });

    return json(
      {
        ok: true,
        blueprintId,
        ruleId,
        status: 'draft_created',
        rule,
        message: `Created disabled draft automation "${title}" with ${flow.nodes.length} flow node(s) — review and enable in Automation Studio.`,
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'automation-blueprint-apply failed';
    return json({ ok: false, error: message }, { status: 401, headers: corsHeaders });
  }
});
