import type { CrmRecord, CrmRecordStage } from '../domain/crmRecords';
import { isClosedStage } from '../domain/crmRecords';

export type CrmDealBand = 'low' | 'medium' | 'high' | 'won';

export type CrmDealScore = {
  winProbability: number;
  band: CrmDealBand;
  factors: string[];
  suggestedAction: string;
};

const STAGE_WIN: Partial<Record<CrmRecordStage, number>> = {
  new: 0.08,
  researching: 0.12,
  contact_ready: 0.18,
  outreach_sent: 0.22,
  contacted: 0.28,
  replied: 0.42,
  booked: 0.62,
  converted: 1,
  won: 1,
  active_client: 1,
  disqualified: 0,
  lost: 0,
};

function bandFromProbability(p: number): CrmDealBand {
  if (p >= 0.95) return 'won';
  if (p >= 0.55) return 'high';
  if (p >= 0.28) return 'medium';
  return 'low';
}

/** ML-style deal win probability for CRM forecast + Leads OS (Phase 14). */
export function scoreCrmRecord(record: CrmRecord): CrmDealScore {
  const factors: string[] = [];
  let p = STAGE_WIN[record.stage] ?? 0.1;

  if (isClosedStage(record.stage)) {
    return {
      winProbability: p,
      band: bandFromProbability(p),
      factors: [`Closed stage: ${record.stage}`],
      suggestedAction: record.stage === 'lost' || record.stage === 'disqualified' ? 'Archive or re-engage later' : 'Onboard + Work OS bundle',
    };
  }

  factors.push(`Stage ${record.stage}`);

  if (record.score != null) {
    const boost = (record.score / 100) * 0.22;
    p += boost;
    factors.push(`Lead score ${record.score}`);
  }

  if (record.dealValueCents && record.dealValueCents >= 50000) {
    p += 0.06;
    factors.push('Deal value ≥ $500');
  }

  if (record.workSignals?.riskLevel === 'low' && record.workSignals.slaBreachCount === 0) {
    p += 0.04;
    factors.push('No Work OS SLA breaches');
  }
  if (record.workSignals?.riskLevel === 'high') {
    p -= 0.12;
    factors.push('High Work OS risk');
  }

  if (record.kind === 'inbound_lead') {
    p += 0.05;
    factors.push('Inbound lead — warm intent');
  }

  if ((record.tags ?? []).some((t) => t.includes('meta') || t.includes('facebook'))) {
    p += 0.04;
    factors.push('Meta / social attribution');
  }

  p = Math.max(0, Math.min(0.98, p));
  const band = bandFromProbability(p);

  const suggestedAction =
    band === 'high'
      ? 'Assign closer + book call within 24h'
      : band === 'medium'
        ? 'Personalized follow-up + nurture bump'
        : 'Enrich contact data before outreach';

  return { winProbability: Math.round(p * 100), band, factors, suggestedAction };
}
