import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';
import type { MarketingStagedHit } from '../marketingDesk/marketingDeskHunt';
import type { Prospect } from '../../domain/crmProspects';
import { GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { getGrowthMlLabel } from './growthMlLabels';

export type ProspectMlInput = {
  score: number;
  intentTier?: string;
  hasEmail: boolean;
  hasPhone: boolean;
  snippetLength: number;
  lane?: LeadEngineLane | string;
};

export type ProspectMlScores = {
  conversationScore: number;
  selfSignupScore: number;
  reasons: string[];
};

const LANE_IDS: LeadEngineLane[] = [
  'business_credit',
  'credit_restore',
  'debt',
  'agency_affiliates',
  'local_service',
  'funded_business',
];

const CONVERSATION_LANE_BOOST: Record<string, number> = {
  credit_restore: 12,
  debt: 10,
  local_service: 10,
  business_credit: 8,
  agency_affiliates: 6,
  funded_business: 5,
};

const SIGNUP_LANE_BOOST: Record<string, number> = {
  credit_restore: 16,
  debt: 9,
  business_credit: 7,
  local_service: 8,
  agency_affiliates: 10,
  funded_business: 6,
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Human labels from Review people adjust sort order (S5). */
export function mlLabelRankingBoost(urlOrDomain: string): number {
  const label = getGrowthMlLabel(urlOrDomain);
  if (!label) return 0;
  if (label.label === 'approve') return 28;
  if (label.label === 'reject') return -55;
  return 0;
}

export function effectiveHuntSortScore(hit: MarketingStagedHit): number {
  const base = hit.score ?? 0;
  const key = hit.url || hit.domain || '';
  return base + mlLabelRankingBoost(key);
}

function intentConversationBoost(tier?: string): { pts: number; reason?: string } {
  const t = (tier || 'unknown').toLowerCase();
  if (t === 'hot') return { pts: 22, reason: 'Hot intent — strong fit to book a session' };
  if (t === 'warm') return { pts: 14, reason: 'Warm intent — personalize outreach' };
  if (t === 'cold') return { pts: 4, reason: 'Cold intent — lead with education' };
  return { pts: 8 };
}

function intentSignupBoost(tier?: string): { pts: number; reason?: string } {
  const t = (tier || 'unknown').toLowerCase();
  if (t === 'warm') return { pts: 20, reason: 'Warm intent — guide signup often converts' };
  if (t === 'cold') return { pts: 14, reason: 'Cold intent — free guide lowers friction' };
  if (t === 'hot') return { pts: 10, reason: 'Hot intent — may still self-serve before booking' };
  return { pts: 10 };
}

/** Interpretable weighted scores (0–100) — no external ML. */
export function prospectScores(input: ProspectMlInput): ProspectMlScores {
  const lane = String(input.lane || GROWTH_AGENT_WAVE0_LANE);
  const base = Math.max(0, Math.min(100, input.score));
  const snippetPts = Math.min(12, Math.floor(input.snippetLength / 28));

  const reasons: string[] = [];

  let conversation = base * 0.42;
  let selfSignup = base * 0.36;

  const ic = intentConversationBoost(input.intentTier);
  conversation += ic.pts;
  if (ic.reason) reasons.push(ic.reason);

  const is = intentSignupBoost(input.intentTier);
  selfSignup += is.pts;
  if (is.reason && !reasons.includes(is.reason)) reasons.push(is.reason);

  if (input.hasEmail) {
    conversation += 14;
    selfSignup += 24;
    reasons.push('Email available — manual send and guide drip both work');
  }
  if (input.hasPhone) {
    conversation += 18;
    selfSignup += 5;
    reasons.push('Phone on file — best for live booking conversations');
  }

  conversation += CONVERSATION_LANE_BOOST[lane] ?? 6;
  selfSignup += SIGNUP_LANE_BOOST[lane] ?? 6;

  conversation += snippetPts;
  selfSignup += Math.min(10, snippetPts + 2);
  if (snippetPts >= 8) {
    reasons.push('Rich snippet — more context for a tailored message');
  }

  if (base >= 70) reasons.unshift('High hunt score — prioritize in today’s queue');
  else if (base >= 50) reasons.push('Mid hunt score — approve fit before heavy outreach');
  else reasons.push('Lower hunt score — try guide link before a session ask');

  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 6);

  return {
    conversationScore: clampScore(conversation),
    selfSignupScore: clampScore(selfSignup),
    reasons: uniqueReasons,
  };
}

export function prospectScoresFromHuntHit(hit: MarketingStagedHit): ProspectMlScores {
  const snippet = hit.snippet || hit.meta?.description || '';
  return prospectScores({
    score: hit.score ?? 0,
    intentTier: hit.intentTier,
    hasEmail: (hit.emails?.length ?? 0) > 0,
    hasPhone: (hit.phones?.length ?? 0) > 0,
    snippetLength: snippet.length,
    lane: hit.lane,
  });
}

export function laneFromProspectTags(tags: string[] | undefined): LeadEngineLane {
  const hit = (tags ?? []).find((t) => LANE_IDS.includes(t as LeadEngineLane));
  return (hit as LeadEngineLane) || GROWTH_AGENT_WAVE0_LANE;
}

export function prospectScoresFromProspect(p: Prospect): ProspectMlScores {
  const snippet = p.intel?.snippet || p.company?.description || '';
  const scores = prospectScores({
    score: p.score ?? 0,
    intentTier: p.intel?.intentTier,
    hasEmail: (p.contact?.emails?.length ?? 0) > 0,
    hasPhone: (p.contact?.phones?.length ?? 0) > 0,
    snippetLength: snippet.length,
    lane: laneFromProspectTags(p.tags),
  });
  const url = p.company?.website || p.company?.domain || '';
  const boost = mlLabelRankingBoost(url);
  if (!boost) return scores;
  const reasons =
    boost > 0
      ? ['Good fit label — prioritized in Today’s 10', ...scores.reasons]
      : ['Wrong fit label — deprioritized', ...scores.reasons];
  return {
    ...scores,
    conversationScore: clampScore(scores.conversationScore + boost),
    reasons: Array.from(new Set(reasons)).slice(0, 6),
  };
}
