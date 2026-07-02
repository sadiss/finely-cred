import { getHumanStaffAgent } from './humanStaffDirectory';
import { HUMAN_STAFF_KNOWLEDGE_BASE, getKnowledgeForAgent } from './staffKnowledgeBase';
import { loadHumanStaffStore, rememberResponseHash } from './humanStaffRepo';
import type { HumanStaffAgentId, HumanStaffMessage, HumanStaffTone } from './types';

const openings: Record<string, string[]> = {
  professor_apex: ['Here is the clean read:', 'I would organize it this way:', 'The real issue is ownership:', 'Let us remove the mystery:', 'Decision first:'],
  cmo_prime: ['Campaign lens:', 'Marketing answer:', 'I would not ship this loosely:', 'The funnel needs a spine:', 'Here is the conversion path:'],
  pipeline_titan: ['Pipeline read:', 'Lead floor status:', 'Volume alone is not enough:', 'Here is what makes this actionable:', 'I am treating this as throughput work:'],
  scout_supreme: ['Signal check:', 'Discovery read:', 'I found the pattern:', 'Source logic:', 'Here is the intel angle:'],
  night_owl_intel: ['Night shift read:', 'Queue watch:', 'Overnight lens:', 'Quiet update:', 'Swarm status:'],
  geo_commander: ['City read:', 'Geo command:', 'Local growth angle:', 'Zip-ring view:', 'City floor status:'],
  appointment_architect: ['Booking path:', 'Appointment lens:', 'Show-up move:', 'Calendar friction check:', 'Setter route:'],
  revenue_captain: ['Sales read:', 'Close path:', 'Fit check:', 'Revenue lens:', 'Deal floor view:'],
  partner_recruiter: ['Recruiting read:', 'Candidate path:', 'Role clarity:', 'Partner pipeline:', 'Recruiting floor status:'],
  affiliate_wrangler: ['Partner activation read:', 'Referral path:', 'Affiliate move:', 'Tracking first:', 'Partner floor update:'],
  pr_sentinel: ['Authority angle:', 'PR read:', 'Trust path:', 'Pitch lens:', 'Media floor view:'],
  liora_lifecycle: ['Follow-up read:', 'Nurture path:', 'Message quality check:', 'Lifecycle lens:', 'Relationship move:'],
  goldframe: ['Creative read:', 'Design lens:', 'Visual hierarchy:', 'Conversion design note:', 'Premium polish check:'],
  shorts_factory: ['Hook read:', 'Short-form angle:', 'Content batch view:', 'Retention move:', 'Script room note:'],
  switchboard: ['Ops read:', 'System status:', 'Connection check:', 'Queue reality:', 'Automation floor update:'],
  velvet_hammer: ['Compliance ruling:', 'Risk read:', 'Safe path:', 'Approval gate:', 'Brand protection note:'],
  analytics_beast: ['Numbers read:', 'Attribution view:', 'Truth check:', 'Model update:', 'Performance lens:'],
  retarget_architect: ['Budget cell read:', 'Paid media reality:', 'Retargeting check:', 'Spend path:', 'CPL lens:'],
  local_news_radar: ['Local angle:', 'City story:', 'News radar:', 'Community context:', 'Local relevance check:'],
  inbox_triage: ['Reply route:', 'Inbox read:', 'Intent classification:', 'Next owner:', 'Response priority:'],
  fun_captain: ['Team recap:', 'Tiny drumroll:', 'Staff floor vibe:', 'Daily spark:', 'Momentum note:'],
  future_human_manager: ['Human staff path:', 'Onboarding read:', 'Future hire note:', 'Permission check:', 'Real staff handoff:'],
};

const closers: Record<HumanStaffTone, string[]> = {
  precise: ['Next step: verify the owner and run the smallest useful action.', 'I would make the next button obvious.', 'Keep this measurable and logged.'],
  warm: ['This should feel clear, not overwhelming.', 'The user should know exactly what happens next.', 'Make it easy to trust the next step.'],
  direct: ['Do not bury the blocker.', 'Own the next move.', 'Make the output action-ready.'],
  energetic: ['This gives the floor momentum.', 'Now the team has something real to run.', 'That is how we turn dashboards into motion.'],
  calm: ['No panic; this is a routing problem.', 'Stabilize the process, then scale.', 'The next step is simple and controlled.'],
  executive: ['Decision: proceed with owner clarity and approval gates.', 'This belongs in the command layer, not buried in a subpanel.', 'Make the hierarchy visible before increasing automation.'],
  salesy_safe: ['Keep the promise clean and the CTA specific.', 'Strong offer, safe language, clear next step.', 'Conversion improves when the message matches intent.'],
};

function simpleHash(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

function pickVariant(agentId: string, values: string[], seed: string) {
  const recent = loadHumanStaffStore().lastResponseHashes[agentId] ?? [];
  const base = simpleHash(`${agentId}:${seed}:${recent.join('|')}`);
  const start = parseInt(base.slice(0, 5), 36) || 0;
  for (let offset = 0; offset < values.length; offset += 1) {
    const value = values[(start + offset) % values.length];
    const hash = simpleHash(value);
    if (!recent.includes(hash)) return value;
  }
  return values[start % values.length];
}

function toneForAgent(agentId: HumanStaffAgentId): HumanStaffTone {
  if (agentId === 'velvet_hammer') return 'precise';
  if (agentId === 'liora_lifecycle' || agentId === 'inbox_triage') return 'warm';
  if (agentId === 'pipeline_titan' || agentId === 'switchboard') return 'direct';
  if (agentId === 'fun_captain' || agentId === 'shorts_factory') return 'energetic';
  if (agentId === 'professor_apex' || agentId === 'cmo_prime') return 'executive';
  if (agentId === 'revenue_captain' || agentId === 'appointment_architect') return 'salesy_safe';
  return 'calm';
}

export function buildAgentReply(args: {
  agentId: HumanStaffAgentId;
  userAsk: string;
  missionType?: string;
  cityIds?: string[];
  selectedAgentIds?: HumanStaffAgentId[];
  contextBullets?: string[];
}) {
  const agent = getHumanStaffAgent(args.agentId);
  const tone = toneForAgent(args.agentId);
  const knowledge = getKnowledgeForAgent(args.agentId)[0] ?? HUMAN_STAFF_KNOWLEDGE_BASE[0];
  const opening = pickVariant(args.agentId, openings[args.agentId] ?? openings.professor_apex, args.userAsk);
  const closer = pickVariant(args.agentId, closers[tone], `${args.userAsk}:${args.missionType ?? ''}`);
  const partners = (args.selectedAgentIds?.length ? args.selectedAgentIds : agent.defaultPartners).filter((id) => id !== args.agentId).slice(0, 2).map((id) => getHumanStaffAgent(id).name);
  const cities = args.cityIds?.length ? args.cityIds.join(', ') : 'the active city board';
  const context = args.contextBullets?.length ? args.contextBullets.slice(0, 3) : knowledge.rules.slice(0, 3);
  const body = [
    `${opening} ${agent.name} should handle this as ${agent.title}.`,
    `Mission context: ${args.missionType || 'staff command'} across ${cities}.`,
    `My operating take: ${knowledge.summary}`,
    `What I will do first: ${context[0] || agent.mission}`,
    partners.length ? `I will notify ${partners.join(' and ')} because this crosses departments.` : 'I can run this solo internally, but external actions still need the correct approval gate.',
    closer,
  ].join('\n\n');
  rememberResponseHash(args.agentId, simpleHash(body));
  return { body, tone, knowledgeId: knowledge.id };
}

export function buildAgentMessage(args: {
  agentId: HumanStaffAgentId;
  toAgentIds: HumanStaffAgentId[];
  userAsk: string;
  missionType?: string;
  cityIds?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}): HumanStaffMessage {
  const reply = buildAgentReply({ agentId: args.agentId, userAsk: args.userAsk, missionType: args.missionType, cityIds: args.cityIds, selectedAgentIds: args.toAgentIds });
  return {
    id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    fromAgentId: args.agentId,
    toAgentIds: args.toAgentIds,
    body: reply.body,
    tone: reply.tone,
    priority: args.priority ?? 'normal',
    tags: [args.missionType || 'staff-command', reply.knowledgeId],
    suggestedActions: ['Assign owner', 'Open mission', 'Review next action'],
  };
}

export function buildConversationSummary(messages: HumanStaffMessage[]) {
  const last = messages.slice(-5);
  if (!last.length) return 'No conversation yet.';
  const agents = Array.from(new Set(last.map((m) => m.fromAgentId))).join(', ');
  const decisions = last.flatMap((m) => m.suggestedActions ?? []).slice(-4);
  return `Recent staff thread involved ${agents}. Main next actions: ${decisions.length ? decisions.join(' / ') : 'review owner and next step'}.`;
}
