/**
 * Communication intent router — ML-style scoring (rules + learned weights + lane context).
 * Powers conversational routing chips instead of thread/topic dropdowns.
 */

import type { AgentPersonaId } from '../domain/agentPersonas';
import type { SupportTopic } from '../domain/support';
import { classifyMessageIntent, type MessageIntent } from './intentClassifier';
import { listPortalStaffForLane, resolveStaffOnDuty } from '../data/staffRoster';
import { staffMemberFullName, type StaffMember } from '../domain/staffMember';
import { getStaffRoutingWeights, rankStaffByIntent } from './staffIntelligenceEngine';

export type CommsRoutingKind = 'ai_continue' | 'staff_ai' | 'team_handoff' | 'navigate' | 'book_call';

export type CommsRoutingSuggestion = {
  id: string;
  kind: CommsRoutingKind;
  label: string;
  hint?: string;
  emoji?: string;
  staffId?: string;
  personaId?: AgentPersonaId;
  topic?: SupportTopic;
  navigate?: string;
  confidence: number;
};

const INTENT_TOPIC: Partial<Record<MessageIntent, SupportTopic>> = {
  disputes: 'disputes',
  debt: 'debt_summons',
  funding: 'business',
  sales: 'billing',
  support: 'general',
  scheduling: 'general',
  complaint: 'other',
  processing: 'disputes',
  general: 'general',
};

const INTENT_NAV: Partial<Record<MessageIntent, string>> = {
  disputes: '/portal/disputes',
  debt: '/portal/debt',
  funding: '/fundability-readiness',
  processing: '/portal/reports',
  scheduling: '/portal/calendar',
};

function topicForLane(lane?: string): SupportTopic {
  if (lane === 'affiliate') return 'affiliate_program';
  if (lane === 'agent') return 'credit_specialist_program';
  if (lane === 'au_tradelines' || lane === 'primary_tradeline') return 'au';
  if (lane === 'business_credit') return 'business';
  if (lane === 'debt_kill') return 'debt_summons';
  return 'general';
}

export function routeCommsIntent(args: {
  message: string;
  lane?: string;
  journeyStage?: string;
}): {
  suggestions: CommsRoutingSuggestion[];
  primaryTopic: SupportTopic;
  intent: MessageIntent;
  preferredStaff: StaffMember[];
  classifiedPersonaId: AgentPersonaId;
} {
  const classified = classifyMessageIntent(args.message);
  const weights = getStaffRoutingWeights();
  const laneStaff = listPortalStaffForLane(args.lane);
  const ranked = rankStaffByIntent({
    intent: classified.intent,
    personaId: classified.suggestedPersonaId,
    staff: laneStaff,
    weights,
  });

  const onDuty = resolveStaffOnDuty(classified.suggestedPersonaId);
  const topStaff = ranked[0] ?? onDuty ?? laneStaff[0] ?? null;
  const primaryTopic = INTENT_TOPIC[classified.intent] ?? topicForLane(args.lane);

  const suggestions: CommsRoutingSuggestion[] = [];

  suggestions.push({
    id: 'ai-continue',
    kind: 'ai_continue',
    label: 'Keep chatting here',
    hint: 'AI coach continues',
    emoji: '✨',
    confidence: 0.85,
  });

  if (topStaff) {
    suggestions.push({
      id: `staff-ai-${topStaff.id}`,
      kind: 'staff_ai',
      label: `Talk with ${topStaff.firstName}`,
      hint: staffMemberFullName(topStaff),
      emoji: '💬',
      staffId: topStaff.id,
      personaId: topStaff.primaryRoleId,
      topic: primaryTopic,
      confidence: Math.min(0.95, classified.confidence + 0.15),
    });
    suggestions.push({
      id: `team-${topStaff.id}`,
      kind: 'team_handoff',
      label: `Send to ${topStaff.firstName}'s team`,
      hint: 'Human follow-up in your thread',
      emoji: '🤝',
      staffId: topStaff.id,
      personaId: topStaff.primaryRoleId,
      topic: primaryTopic,
      confidence: classified.confidence,
    });
  }

  if (classified.intent === 'scheduling' || /book|call|video|meet/i.test(args.message)) {
    suggestions.push({
      id: 'book-call',
      kind: 'book_call',
      label: 'Book a strategy call',
      emoji: '📅',
      navigate: '/portal/calendar',
      confidence: 0.8,
    });
  }

  const nav = INTENT_NAV[classified.intent];
  if (nav) {
    suggestions.push({
      id: `nav-${classified.intent}`,
      kind: 'navigate',
      label: 'Open the right tool',
      hint: nav,
      emoji: '→',
      navigate: nav,
      confidence: 0.65,
    });
  }

  if (args.lane === 'agent' && !suggestions.some((s) => s.topic === 'credit_specialist_program')) {
    suggestions.push({
      id: 'specialist-line',
      kind: 'team_handoff',
      label: 'Partnership line',
      hint: 'Specialist program team',
      emoji: '🎓',
      topic: 'credit_specialist_program',
      confidence: 0.7,
    });
  }

  return {
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5),
    primaryTopic,
    intent: classified.intent,
    preferredStaff: ranked.slice(0, 3),
    classifiedPersonaId: classified.suggestedPersonaId,
  };
}

export function buildThreadSubject(args: {
  topic: SupportTopic;
  staff?: StaffMember | null;
  snippet: string;
}): string {
  const base = args.staff ? `Direct: ${staffMemberFullName(args.staff)}` : 'Support conversation';
  const short = args.snippet.trim().slice(0, 48);
  return short ? `${base} — ${short}` : base;
}
