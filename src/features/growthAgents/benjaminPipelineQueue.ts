import { listProspects } from '../../data/crmProspectsRepo';
import type { Prospect, ProspectTarget } from '../../domain/crmProspects';
import { prospectScoresFromProspect } from './growthMlScore';

const BENJAMIN_TARGETS: ProspectTarget[] = ['affiliates', 'b2b_partners', 'agents', 'teams'];

const PARTNERSHIP_TAG_HINTS = ['affiliate', 'b2b', 'agency', 'partnership', 'referral', 'white-label'];

export type BenjaminQueuedProspect = {
  prospect: Prospect;
  partnershipScore: number;
  reasons: string[];
};

function isBenjaminProspect(p: Prospect): boolean {
  if (p.stage === 'disqualified' || p.stage === 'converted') return false;
  if (BENJAMIN_TARGETS.includes(p.target)) return true;
  const tags = (p.tags ?? []).map((t) => t.toLowerCase());
  return tags.some((t) => PARTNERSHIP_TAG_HINTS.some((h) => t.includes(h)));
}

function toQueued(p: Prospect): BenjaminQueuedProspect {
  const ml = prospectScoresFromProspect(p);
  let partnershipScore = ml.selfSignupScore;
  if (p.target === 'affiliates' || p.target === 'b2b_partners') partnershipScore += 15;
  if (p.target === 'agents' || p.target === 'teams') partnershipScore += 8;
  if (p.source === 'referral') partnershipScore += 10;
  if ((p.contact.emails ?? []).length > 0) partnershipScore += 5;
  return {
    prospect: p,
    partnershipScore: Math.min(100, partnershipScore),
    reasons: ml.reasons,
  };
}

/** Top affiliate / B2B pipeline rows from CRM — scored for partnership outreach. */
export function getBenjaminPartnershipQueue(limit = 12): BenjaminQueuedProspect[] {
  return listProspects()
    .filter(isBenjaminProspect)
    .map(toQueued)
    .sort((a, b) => b.partnershipScore - a.partnershipScore)
    .slice(0, limit);
}

export function countBenjaminPipeline(): {
  total: number;
  contactReady: number;
  outreachSent: number;
  booked: number;
} {
  const rows = listProspects().filter(isBenjaminProspect);
  return {
    total: rows.length,
    contactReady: rows.filter((p) => p.stage === 'contact_ready' || p.stage === 'researching').length,
    outreachSent: rows.filter((p) => p.stage === 'outreach_sent' || p.stage === 'replied').length,
    booked: rows.filter((p) => p.stage === 'booked').length,
  };
}
