import type { LeadQualityTier } from './types';

export type ScoredLeadInput = {
  title?: string;
  snippet?: string;
  url?: string;
  city?: string;
  emails?: string[];
  phones?: string[];
  source?: string;
  consentSignals?: string[];
};

export type ScoredLead = ScoredLeadInput & {
  score: number;
  tier: LeadQualityTier;
  reasons: string[];
  recommendedNextStep: 'nurture' | 'book_call' | 'manual_research' | 'partner_recruit' | 'do_not_contact';
};

const hotTerms = ['consultation', 'help', 'apply', 'funding', 'credit repair', 'business credit', 'tradeline', 'partner', 'affiliate', 'job', 'hiring', 'remote'];
const riskTerms = ['guaranteed approval', 'cpn', 'delete bad credit', 'fake tradeline', 'synthetic identity'];

export function scoreOvernightLead(input: ScoredLeadInput): ScoredLead {
  const text = `${input.title ?? ''} ${input.snippet ?? ''} ${input.url ?? ''}`.toLowerCase();
  const reasons: string[] = [];
  let score = 20;
  for (const t of hotTerms) {
    if (text.includes(t)) { score += 8; reasons.push(`intent:${t}`); }
  }
  if ((input.emails?.length ?? 0) > 0) { score += 12; reasons.push('email_found'); }
  if ((input.phones?.length ?? 0) > 0) { score += 14; reasons.push('phone_found'); }
  if (input.city && text.includes(input.city.toLowerCase())) { score += 10; reasons.push('geo_match'); }
  if ((input.consentSignals?.length ?? 0) > 0) { score += 16; reasons.push('consent_signal'); }
  for (const r of riskTerms) {
    if (text.includes(r)) { score -= 30; reasons.push(`risk:${r}`); }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier: LeadQualityTier = score >= 80 ? 'urgent' : score >= 65 ? 'hot' : score >= 45 ? 'warm' : score >= 25 ? 'watch' : 'cold';
  const recommendedNextStep = score < 20 ? 'do_not_contact' : score >= 75 ? 'book_call' : text.includes('partner') || text.includes('affiliate') || text.includes('job') ? 'partner_recruit' : score >= 45 ? 'nurture' : 'manual_research';
  return { ...input, score, tier, reasons, recommendedNextStep };
}
