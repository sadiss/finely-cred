import type { SovereignAgentProfile, SovereignMission, SovereignNotification, SovereignConversationThread, SovereignConversationTurn, SovereignMissionType } from './types';
import { sovereignAgents, getSovereignAgent, recommendSovereignAgentsForMission } from './sovereignAgentDirectory';
import { addSovereignNotification, upsertSovereignThread } from './sovereignGrowthRepo';

const usedResponseFragments = new Map<string, string[]>();

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickVaried(agentId: string, options: string[]): string {
  const used = usedResponseFragments.get(agentId) ?? [];
  const unused = options.filter((option) => !used.includes(option));
  const pool = unused.length ? unused : options;
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? options[0] ?? '';
  const nextUsed = [...used, choice].slice(-8);
  usedResponseFragments.set(agentId, nextUsed);
  return choice;
}

export function buildAgentOpening(agent: SovereignAgentProfile, mission?: SovereignMission): string {
  const missionLine = mission ? `I am reading this as a ${mission.type.replace(/_/g, ' ')} mission: ${mission.objective}` : `I am standing by in ${agent.department.replace(/_/g, ' ')} mode.`;
  const openers = [
    `${agent.name}: ${missionLine}`,
    `${agent.name}: I am not giving you a generic answer. ${missionLine}`,
    `${agent.name}: I will keep this practical. ${missionLine}`,
    `${agent.name}: My role here is ${agent.mission.toLowerCase()} ${missionLine}`,
  ];
  return pickVaried(agent.id, openers);
}

export function buildAgentReasoning(agent: SovereignAgentProfile, mission: SovereignMission): string[] {
  const strengths = agent.strengths.slice(0, 3).join(', ');
  const knowledge = agent.knowledgeAreas.slice(0, 3).join(', ');
  const lines = [
    `What I am watching: ${strengths}.`,
    `Knowledge I am applying: ${knowledge}.`,
    `Decision style: ${agent.decisionStyle}`,
  ];
  if (mission.blockers.length) lines.push(`Blocker I will not ignore: ${mission.blockers[0]}.`);
  if (mission.city) lines.push(`City context matters here: ${mission.city}.`);
  return lines;
}

export function buildAgentResponse(agentId: string, prompt: string, mission?: SovereignMission): string {
  const agent = getSovereignAgent(agentId) ?? sovereignAgents[0];
  const opening = buildAgentOpening(agent, mission);
  const phrase = pickVaried(agent.id, agent.adminPhrasebook);
  const actions = mission?.nextActions?.length ? mission.nextActions.slice(0, 3) : [
    'Clarify the exact outcome this mission should produce.',
    'Assign the strongest owner and one backup.',
    'Create the tracked link, draft, or queue item before spending traffic.',
  ];
  const actionText = actions.map((action, idx) => `${idx + 1}. ${action}`).join('\n');
  const promptEcho = prompt.trim() ? `Admin request I am responding to: "${prompt.trim().slice(0, 180)}"` : 'No admin request attached; I am using the mission context.';
  return [
    opening,
    '',
    phrase,
    promptEcho,
    '',
    'My read:',
    ...buildAgentReasoning(agent, mission ?? buildSyntheticMission('layout_intelligence')),
    '',
    'Next moves:',
    actionText,
    '',
    'I will notify the matching staff if this affects their lane.',
  ].join('\n');
}

function buildSyntheticMission(type: SovereignMissionType): SovereignMission {
  return {
    id: 'synthetic',
    type,
    title: 'Synthetic context',
    priority: 'normal',
    status: 'draft',
    ownerIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    objective: 'Clarify and improve the operating system.',
    inputs: [],
    outputs: [],
    nextActions: [],
    blockers: [],
    notifications: [],
    intelligenceNotes: [],
  };
}

export function buildInterAgentNotifications(mission: SovereignMission): SovereignNotification[] {
  const owners = mission.ownerIds.map((ownerId) => getSovereignAgent(ownerId)).filter(Boolean) as SovereignAgentProfile[];
  const notifications: SovereignNotification[] = [];
  for (const owner of owners) {
    const toAgentIds = Array.from(new Set([...owner.notifies, ...owner.escalationPartners])).filter((id) => id !== owner.id).slice(0, 5);
    if (!toAgentIds.length) continue;
    const message = `${owner.name} is moving mission "${mission.title}". Need support on ${mission.outputs.slice(0, 2).join(' and ') || 'the next output'}. Current blocker: ${mission.blockers[0] || 'none'}.`;
    notifications.push({
      id: id('notif'),
      fromAgentId: owner.id,
      toAgentIds,
      missionId: mission.id,
      tone: mission.priority === 'critical' ? 'calm_command' : 'high_conviction',
      priority: mission.priority,
      message,
      createdAt: nowIso(),
    });
  }
  return notifications;
}

export function sendInterAgentNotifications(mission: SovereignMission): SovereignNotification[] {
  return buildInterAgentNotifications(mission).map(addSovereignNotification);
}

export function createMissionThread(mission: SovereignMission): SovereignConversationThread {
  const participants = mission.ownerIds.length ? mission.ownerIds : recommendSovereignAgentsForMission(mission.type).map((agent) => agent.id);
  const turns: SovereignConversationTurn[] = participants.slice(0, 3).map((agentId) => ({
    id: id('turn'),
    agentId,
    missionId: mission.id,
    role: 'agent',
    content: buildAgentResponse(agentId, 'Open the mission with your strongest assessment.', mission),
    createdAt: nowIso(),
    tags: ['mission_open', mission.type],
  }));
  return upsertSovereignThread({
    id: id('thread'),
    title: mission.title,
    missionId: mission.id,
    participantAgentIds: participants,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    turns,
    memorySummary: `Mission opened with ${participants.length} staff. Objective: ${mission.objective}`,
    openDecisions: mission.nextActions.slice(0, 5),
  });
}

export function appendAgentTurn(thread: SovereignConversationThread, agentId: string, prompt: string, mission?: SovereignMission): SovereignConversationThread {
  const turn: SovereignConversationTurn = {
    id: id('turn'),
    agentId,
    missionId: mission?.id ?? thread.missionId,
    role: 'agent',
    content: buildAgentResponse(agentId, prompt, mission),
    createdAt: nowIso(),
    tags: ['agent_reply', agentId],
  };
  const memorySummary = `${thread.memorySummary}\n${getSovereignAgent(agentId)?.name ?? agentId}: ${prompt.slice(0, 120)}`.slice(-1200);
  return upsertSovereignThread({ ...thread, turns: [...thread.turns, turn], updatedAt: nowIso(), memorySummary });
}

export function diagnoseRepetitiveStaffLanguage(sample: string): string[] {
  const lower = sample.toLowerCase();
  const findings: string[] = [];
  const repeatedPhrases = ['here is what i found', 'next steps', 'i recommend', 'this is important'];
  repeatedPhrases.forEach((phrase) => {
    const count = lower.split(phrase).length - 1;
    if (count > 1) findings.push(`Phrase repeated ${count}x: ${phrase}`);
  });
  if (sample.split('\n').filter((line) => line.trim().startsWith('-')).length > 8) findings.push('Too many generic bullets; use agent-specific reasoning and decisions.');
  if (sample.length < 220) findings.push('Response is too thin for high-command mode.');
  return findings;
}
