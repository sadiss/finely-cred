import type { AutomationActionV2, AutomationCondition, AutomationRule, AutomationTrigger } from '../../domain/automationStudio';
import type { AutomationFlowGraph, AutomationFlowNode, AutomationFlowNodeType } from '../../domain/automationStudio';

const NODE_X = 80;
const NODE_Y_START = 40;
const NODE_Y_GAP = 120;

function nodeId(prefix: string, index: number) {
  return `${prefix}_${index}`;
}

export function ruleToFlowGraph(rule: AutomationRule): AutomationFlowGraph {
  if (rule.flow?.nodes?.length) return rule.flow;

  const nodes: AutomationFlowNode[] = [];
  const edgeList: AutomationFlowGraph['edges'] = [];
  let y = NODE_Y_START;

  const triggerNode: AutomationFlowNode = {
    id: 'trigger_0',
    type: 'trigger',
    label: triggerLabel(rule.trigger),
    data: { trigger: rule.trigger },
    position: { x: NODE_X, y },
  };
  nodes.push(triggerNode);
  let prevId = triggerNode.id;
  y += NODE_Y_GAP;

  rule.conditions.forEach((c, i) => {
    const id = nodeId('condition', i);
    nodes.push({
      id,
      type: 'condition',
      label: conditionLabel(c),
      data: { condition: c },
      position: { x: NODE_X, y },
    });
    edgeList.push({ id: `e_${prevId}_${id}`, source: prevId, target: id });
    prevId = id;
    y += NODE_Y_GAP;
  });

  rule.actions.forEach((a, i) => {
    const id = nodeId('action', i);
    nodes.push({
      id,
      type: 'action',
      label: actionLabel(a),
      data: { action: a },
      position: { x: NODE_X, y },
    });
    edgeList.push({ id: `e_${prevId}_${id}`, source: prevId, target: id });
    prevId = id;
    y += NODE_Y_GAP;
  });

  nodes.push({
    id: 'goal_end',
    type: 'goal',
    label: 'Complete',
    data: {},
    position: { x: NODE_X, y },
  });
  edgeList.push({ id: `e_${prevId}_goal`, source: prevId, target: 'goal_end' });

  return { nodes, edges: edgeList };
}

export function flowGraphToRulePatch(flow: AutomationFlowGraph): Partial<AutomationRule> {
  const sorted = [...flow.nodes].sort((a, b) => a.position.y - b.position.y);
  const triggerNode = sorted.find((n) => n.type === 'trigger');
  const conditionNodes = sorted.filter((n) => n.type === 'condition');
  const actionNodes = sorted.filter((n) => n.type === 'action');

  return {
    flow,
    trigger: (triggerNode?.data?.trigger as AutomationTrigger) ?? { type: 'manual' },
    conditions: conditionNodes.length
      ? (conditionNodes.map((n) => n.data.condition).filter(Boolean) as AutomationCondition[])
      : [{ type: 'always' }],
    actions: actionNodes.map((n) => n.data.action).filter(Boolean) as AutomationActionV2[],
  };
}

export function triggerLabel(t: AutomationTrigger): string {
  if (t.type === 'manual') return 'Manual run';
  if (t.type === 'interval') return `Every ${t.everyHours}h`;
  if (t.type === 'form_submit') return 'Form submitted';
  if (t.type === 'crm_stage_changed') return 'CRM stage changed';
  if (t.type === 'crm_record_created') return 'CRM record created';
  if (t.type === 'partner_stage_changed') return 'Partner stage changed';
  if (t.type === 'webhook_inbound') return 'Webhook received';
  if (t.type === 'meta_message_received') return 'Meta message';
  if (t.type === 'meta_lead_form') return 'Meta Lead Ad';
  return t.type;
}

function conditionLabel(c: AutomationCondition): string {
  if (c.type === 'always') return 'Always';
  if (c.type === 'partner_lane_in') return `Lane: ${c.lanes.join(', ')}`;
  if (c.type === 'partner_stage_in') return `Stage: ${c.stages.join(', ')}`;
  if (c.type === 'has_open_tasks') return 'Has open tasks';
  if (c.type === 'has_unclaimed_invite') return 'Unclaimed invite';
  if (c.type === 'has_active_bundle') return `Bundle: ${c.bundleId}`;
  return (c as { type: string }).type;
}

function actionLabel(a: AutomationActionV2): string {
  if (a.type === 'run_workflow') return `Workflow: ${a.workflowId}`;
  if (a.type === 'create_task') return `Task: ${a.title}`;
  if (a.type === 'send_comms_template') return `Comms: ${a.templateId}`;
  if (a.type === 'send_invite_reminder') return `Invite reminder (${a.channel})`;
  if (a.type === 'send_email') return `Email: ${a.subject ?? 'message'}`;
  if (a.type === 'send_sms') return `SMS: ${a.body?.slice(0, 40) ?? 'message'}`;
  if (a.type === 'meta_reply') return 'Reply on Meta';
  if (a.type === 'enroll_crm_sequence') return `Enroll sequence`;
  return a.type.replace(/_/g, ' ');
}

export const FLOW_NODE_PALETTE: Array<{ type: AutomationFlowNodeType; label: string; hint: string }> = [
  { type: 'trigger', label: 'Trigger', hint: 'When this happens…' },
  { type: 'condition', label: 'Condition', hint: 'Only if…' },
  { type: 'action', label: 'Action', hint: 'Do this…' },
  { type: 'wait', label: 'Wait', hint: 'Delay before next step' },
  { type: 'branch', label: 'Branch', hint: 'Split path A / B' },
  { type: 'goal', label: 'Goal', hint: 'Mark enrollment complete' },
];

function defaultNodeData(type: AutomationFlowNodeType): Record<string, unknown> {
  if (type === 'trigger') return { trigger: { type: 'manual' } as AutomationTrigger };
  if (type === 'condition') return { condition: { type: 'always' } as AutomationCondition };
  if (type === 'action') return { action: { type: 'create_task', title: 'New task', kind: 'general' } as AutomationActionV2 };
  if (type === 'wait') return { waitHours: 24 };
  if (type === 'branch') return { branchLabel: 'Path A / B' };
  return {};
}

function defaultNodeLabel(type: AutomationFlowNodeType): string {
  if (type === 'trigger') return 'Manual run';
  if (type === 'condition') return 'Always';
  if (type === 'action') return 'Task: New task';
  if (type === 'wait') return 'Wait 24h';
  if (type === 'branch') return 'Branch A / B';
  if (type === 'goal') return 'Complete';
  return type;
}

export function addFlowNodeAt(
  flow: AutomationFlowGraph,
  type: AutomationFlowNodeType,
  position?: { x: number; y: number },
): AutomationFlowGraph {
  const id = `${type}_${Date.now()}`;
  const pos =
    position ??
    ({
      x: NODE_X + (flow.nodes.length % 4) * 200,
      y: NODE_Y_START + Math.floor(flow.nodes.length / 4) * NODE_Y_GAP,
    } as const);
  const node: AutomationFlowNode = {
    id,
    type,
    label: defaultNodeLabel(type),
    data: defaultNodeData(type),
    position: pos,
  };
  return { ...flow, nodes: [...flow.nodes, node] };
}

export function applyTriggerToFlow(flow: AutomationFlowGraph, trigger: AutomationTrigger): AutomationFlowGraph {
  const existing = flow.nodes.find((n) => n.type === 'trigger');
  if (existing) {
    return {
      ...flow,
      nodes: flow.nodes.map((n) =>
        n.type === 'trigger' ? { ...n, label: triggerLabel(trigger), data: { trigger } } : n,
      ),
    };
  }
  return {
    ...flow,
    nodes: [
      {
        id: 'trigger_0',
        type: 'trigger',
        label: triggerLabel(trigger),
        data: { trigger },
        position: { x: NODE_X, y: NODE_Y_START },
      },
      ...flow.nodes,
    ],
  };
}
