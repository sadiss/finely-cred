import { getHumanStaffAgent, recommendAgentsForMission } from './humanStaffDirectory';
import { addHumanStaffMission, addHumanStaffThread, humanStaffNowIso, makeHumanStaffId } from './humanStaffRepo';
import { buildAgentMessage } from './staffResponseEngine';
import { notifyAgentTeam } from './staffNotificationBus';
import type { HumanStaffAgentId, HumanStaffMissionPlan, HumanStaffMissionRequest, HumanStaffThread } from './types';

function safeAgentIds(ids: HumanStaffAgentId[], missionType: string): HumanStaffAgentId[] {
  const rec = recommendAgentsForMission(missionType);
  const unique = Array.from(new Set([...(ids.length ? ids : rec), ...rec])).slice(0, 3) as HumanStaffAgentId[];
  return unique.length ? unique : ['professor_apex', 'pipeline_titan', 'cmo_prime'];
}

function executionSummary(request: HumanStaffMissionRequest, lead: ReturnType<typeof getHumanStaffAgent>, support: ReturnType<typeof getHumanStaffAgent>[]) {
  const cities = request.cityIds.length ? request.cityIds.join(', ') : 'active cities';
  const supportText = support.length ? support.map((a) => a.name).join(' + ') : 'no support staff';
  return `${lead.name} leads this ${request.missionType} mission for ${cities}. Support: ${supportText}. Objective: ${request.objective}. External sends/publishing stay behind approval gates unless autonomy allows safe execution.`;
}

export function buildHumanStaffMissionPlan(request: HumanStaffMissionRequest): HumanStaffMissionPlan {
  const selected = safeAgentIds(request.selectedAgentIds, request.missionType);
  const leadAgentId = selected[0];
  const supportingAgentIds = selected.slice(1);
  const lead = getHumanStaffAgent(leadAgentId);
  const support = supportingAgentIds.map((id) => getHumanStaffAgent(id));
  const operatingSummary = executionSummary(request, lead, support);
  const riskGate = request.riskLevel === 'high' ? 'Velvet Hammer must review before external action.' : 'Low/medium-risk internal work can be prepared automatically.';
  const actionSequence = [
    `Confirm owner: ${lead.name} owns outcome; support staff owns their work products.`,
    'Create a mission thread with context, city, risk, and next-action memory.',
    'Notify support staff with specific role requests, not generic FYI messages.',
    'Build output cards: owner, offer/funnel, message, short link, approval gate, follow-up.',
    'Report back with found/scored/routed/blocked counts and exact next button.',
  ];
  const agentBriefs = selected.map((agentId, index) => {
    const agent = getHumanStaffAgent(agentId);
    return {
      agentId,
      brief: index === 0 ? `Lead the mission and produce the operating summary. ${agent.mission}` : `Support the mission from ${agent.departmentId}. ${agent.mission}`,
      firstMove: agent.capabilities[0]?.description || agent.mission,
      deliverable: agent.capabilities[0]?.output || 'Mission-specific work product.',
    };
  });
  const notifications = notifyAgentTeam({
    fromAgentId: leadAgentId,
    toAgentIds: supportingAgentIds,
    title: `New mission: ${request.title}`,
    body: operatingSummary,
    priority: request.riskLevel === 'high' ? 'high' : 'normal',
    actionLabel: 'Open mission thread',
    routeHint: '/admin/staff-human-os',
  });
  const plan: HumanStaffMissionPlan = {
    id: makeHumanStaffId('mission'),
    createdAt: humanStaffNowIso(),
    request,
    leadAgentId,
    supportingAgentIds,
    operatingSummary,
    agentBriefs,
    agentNotifications: notifications,
    actionSequence,
    approvalGates: [riskGate, 'Outbound SMS requires consent evidence.', 'Credit/funding claims require compliance-safe wording.', 'External publish/send requires integration health.'],
    expectedOutputs: ['staff thread', 'department handoffs', 'next-action cards', 'status summary', 'blocker list'],
  };
  addHumanStaffMission(plan);
  createThreadFromMission(plan);
  return plan;
}

export function createThreadFromMission(plan: HumanStaffMissionPlan): HumanStaffThread {
  const lead = getHumanStaffAgent(plan.leadAgentId);
  const support = plan.supportingAgentIds;
  const message = buildAgentMessage({
    agentId: plan.leadAgentId,
    toAgentIds: support,
    userAsk: plan.request.objective,
    missionType: plan.request.missionType,
    cityIds: plan.request.cityIds,
    priority: plan.request.riskLevel === 'high' ? 'high' : 'normal',
  });
  const thread: HumanStaffThread = {
    id: makeHumanStaffId('thread'),
    createdAt: humanStaffNowIso(),
    updatedAt: humanStaffNowIso(),
    title: plan.request.title,
    missionType: plan.request.missionType,
    status: plan.request.riskLevel === 'high' ? 'waiting_for_user' : 'open',
    cityIds: plan.request.cityIds,
    assignedAgentIds: [plan.leadAgentId, ...support],
    messages: [message],
    summary: `${lead.name} opened the mission and notified ${support.map((id) => getHumanStaffAgent(id).name).join(', ') || 'no support staff'}.`,
    nextAction: plan.actionSequence[1],
    memory: [plan.operatingSummary, ...plan.approvalGates],
  };
  addHumanStaffThread(thread);
  return thread;
}

export function explainWhoShouldRun(action: string) {
  const selected = recommendAgentsForMission(action);
  const agents = selected.map((id) => getHumanStaffAgent(id));
  return {
    selected,
    lead: agents[0],
    support: agents.slice(1),
    reason: `For "${action}", ${agents[0].name} should lead because their department owns the core outcome. ${agents.slice(1).map((a) => a.name).join(' and ')} should support because the mission crosses their specialties.`,
  };
}
