import { createProspect, findProspectByWebsite, patchProspect } from '../../data/crmProspectsRepo';
import type { ProspectTarget } from '../../domain/crmProspects';
import { recommendedPathForTarget } from '../../lib/prospectOffers';
import { FUNNEL_LABELS, findCity } from './citySourceVault';
import { scanMarketingCopy, safeDisclosure } from './compliance';
import { assignmentsForFunnel, primaryOwnerForFunnel } from './roleMatrix';
import { createTrackedShortLink, publicShortUrl } from './shortLinkRouter';
import type { LeadActionRecommendation, LeadEngineFunnel, LeadIntelCandidate, NurtureHandoff } from './types';

const FUNNEL_TO_TARGET: Record<LeadEngineFunnel, ProspectTarget> = {
  business_credit_eguide: 'clients',
  tradeline_guide: 'clients',
  personal_credit_repair_guide: 'clients',
  funding_readiness_guide: 'b2b_partners',
  credit_specialist_recruiting: 'agents',
  agency_partner_recruiting: 'teams',
  affiliate_partner_recruiting: 'affiliates',
  au_seller_recruiting: 'au_sellers',
  consultation_booking: 'clients',
  event_webinar: 'clients',
  press_authority: 'b2b_partners',
  book_course_buyer: 'clients',
};

export function chooseFunnelFromCandidate(candidate: Pick<LeadIntelCandidate, 'title' | 'snippet' | 'source' | 'cityId' | 'emails' | 'phones'>): LeadEngineFunnel {
  const hay = `${candidate.title} ${candidate.snippet ?? ''}`.toLowerCase();
  if (/credit specialist|credit repair job|sales agent|remote sales|hiring|career/.test(hay)) return 'credit_specialist_recruiting';
  if (/affiliate|referral partner|commission|creator|influencer/.test(hay)) return 'affiliate_partner_recruiting';
  if (/authorized user|tradeline|seasoned tradeline|au seller/.test(hay)) return 'tradeline_guide';
  if (/business funding|merchant cash|line of credit|working capital|startup funding/.test(hay)) return 'funding_readiness_guide';
  if (/business credit|duns|net 30|vendor credit|business tradeline/.test(hay)) return 'business_credit_eguide';
  if (/podcast|interview|media|press|feature|sponsor/.test(hay)) return 'press_authority';
  if (/webinar|event|workshop|seminar|class/.test(hay)) return 'event_webinar';
  if (/book|course|guide|template|ebook/.test(hay)) return 'book_course_buyer';
  if (/fix credit|credit repair|score|dispute|collections|charge off|inquiry/.test(hay)) return 'personal_credit_repair_guide';
  return candidate.phones.length ? 'consultation_booking' : 'business_credit_eguide';
}

export function scoreCandidate(args: {
  title: string;
  snippet?: string;
  emails?: string[];
  phones?: string[];
  source?: string;
  cityId?: string;
  url?: string;
}): { score: number; reasons: string[]; riskFlags: string[] } {
  const text = `${args.title} ${args.snippet ?? ''} ${args.url ?? ''}`.toLowerCase();
  let score = 18;
  const reasons: string[] = [];
  const riskFlags: string[] = [];

  const highIntent = ['need help', 'consultation', 'how do i', 'credit repair', 'business credit', 'funding', 'tradeline', 'dispute', 'collections', 'charge off', 'score', 'apply', 'partner', 'affiliate'];
  for (const phrase of highIntent) {
    if (text.includes(phrase)) {
      score += 8;
      reasons.push(`Intent phrase: ${phrase}`);
    }
  }

  if ((args.emails ?? []).length) {
    score += 15;
    reasons.push('Email available');
  }
  if ((args.phones ?? []).length) {
    score += 18;
    reasons.push('Phone available');
  }
  if (args.cityId && args.cityId !== 'all') {
    score += 8;
    reasons.push(`Geo matched: ${findCity(args.cityId).label}`);
  }
  if (/complaint|angry|scam|fraud|lawsuit|summons/.test(text)) {
    score += 7;
    riskFlags.push('Sensitive situation: manual review before outreach');
  }
  if (/minor|under 18|bankruptcy attorney|legal representation/.test(text)) {
    score -= 35;
    riskFlags.push('Potentially sensitive/legal case: do not automate');
  }

  score = Math.max(0, Math.min(150, Math.round(score)));
  if (reasons.length === 0) reasons.push('General market-fit signal');
  return { score, reasons: reasons.slice(0, 8), riskFlags };
}

export function buildMessageDraft(candidate: LeadIntelCandidate, linkUrl: string) {
  const city = findCity(candidate.cityId);
  const funnelLabel = FUNNEL_LABELS[candidate.funnel];
  if (candidate.funnel.includes('recruiting')) {
    return `Hi - I saw a signal that may fit the Finely Cred ${funnelLabel} path in ${city.label}. We built a quick page that explains the role, who it is for, what the next step looks like, and how the team reviews applicants. Here is the tracked page: ${linkUrl}\n\n${safeDisclosure()}`;
  }
  if (candidate.funnel === 'press_authority') {
    return `Hi - this may be a good fit for a local credit/business education angle in ${city.label}. Finely Cred can provide a practical, compliance-safe conversation around credit education, business credit readiness, or funding preparation. Here is the best starting point: ${linkUrl}\n\n${safeDisclosure()}`;
  }
  return `Hi - based on what you are looking into around ${funnelLabel.toLowerCase()}, this Finely Cred page may be the cleanest next step. It explains the process, what to prepare, and how to request help without pressure: ${linkUrl}\n\n${safeDisclosure()}`;
}

export function buildActionRecommendation(candidate: LeadIntelCandidate, origin?: string): LeadActionRecommendation {
  const link = createTrackedShortLink({
    funnel: candidate.funnel,
    cityId: candidate.cityId,
    source: candidate.source,
    campaign: `lead-action-${candidate.cityId}`,
  });
  const url = publicShortUrl(link, origin);
  const messageDraft = buildMessageDraft(candidate, url);
  const scan = scanMarketingCopy(messageDraft);
  return {
    id: `act_${candidate.id}`,
    createdAt: new Date().toISOString(),
    candidateId: candidate.id,
    headline: `${FUNNEL_LABELS[candidate.funnel]} action for ${candidate.title || candidate.domain || candidate.id}`,
    funnel: candidate.funnel,
    owner: primaryOwnerForFunnel(candidate.funnel),
    shortLink: link,
    messageDraft,
    complianceStatus: scan.status,
    complianceNotes: scan.notes,
    approvalStatus: scan.status === 'blocked' ? 'blocked' : 'draft',
  };
}

export function buildNurtureHandoff(candidate: LeadIntelCandidate, prospectId?: string): NurtureHandoff {
  const owner = assignmentsForFunnel(candidate.funnel).find((x) => x.role === 'nurture') ?? primaryOwnerForFunnel(candidate.funnel);
  const hasEmail = candidate.emails.length > 0;
  const hasPhone = candidate.phones.length > 0;
  const sensitive = candidate.riskFlags.length > 0;
  const consentStatus = hasEmail || hasPhone ? 'missing' : 'not_required_manual_only';
  const channelPlan: NurtureHandoff['channelPlan'] = [];
  if (hasEmail) channelPlan.push('email');
  if (hasPhone) channelPlan.push('sms');
  channelPlan.push('manual_call');
  if (!channelPlan.length) channelPlan.push('manual_dm');

  return {
    id: `handoff_${candidate.id}`,
    createdAt: new Date().toISOString(),
    candidateId: candidate.id,
    prospectId,
    funnel: candidate.funnel,
    sequenceId: `${candidate.funnel}_starter_sequence`,
    channelPlan,
    consentStatus,
    status: sensitive ? 'blocked' : 'drafted',
    owner,
    firstMessageDraft: `Start ${FUNNEL_LABELS[candidate.funnel]} nurture. First touch must confirm context and avoid promises. ${safeDisclosure()}`,
    blockedReason: sensitive ? 'Risk flag requires manual review before nurture starts.' : undefined,
  };
}

export function importCandidateToCrm(candidate: LeadIntelCandidate) {
  const target = FUNNEL_TO_TARGET[candidate.funnel] ?? 'clients';
  const rec = recommendedPathForTarget(target);
  const existing = candidate.url ? findProspectByWebsite(candidate.url) : null;
  const tags = Array.from(new Set(['lead-engine-action-center', candidate.source, candidate.cityId, candidate.funnel, ...(rec.tags ?? [])]));
  if (existing) {
    return patchProspect(existing.id, {
      score: Math.max(existing.score, Math.min(100, candidate.score)),
      tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
      nextAction: existing.nextAction ?? { label: `Review ${FUNNEL_LABELS[candidate.funnel]} action recommendation` },
      company: {
        ...existing.company,
        website: existing.company.website ?? candidate.url,
        domain: existing.company.domain ?? candidate.domain,
        description: existing.company.description ?? candidate.snippet,
        name: existing.company.name ?? candidate.title,
        location: existing.company.location ?? findCity(candidate.cityId).label,
      },
      contact: {
        ...existing.contact,
        emails: Array.from(new Set([...(existing.contact.emails ?? []), ...candidate.emails])),
        phones: Array.from(new Set([...(existing.contact.phones ?? []), ...candidate.phones])),
      },
      intel: {
        ...existing.intel,
        query: existing.intel?.query ?? candidate.query,
        snippet: existing.intel?.snippet ?? candidate.snippet,
        lastEnrichedAt: new Date().toISOString(),
      },
    } as any);
  }

  const created = createProspect({
    target,
    source: 'lead_intel_search',
    score: Math.min(100, candidate.score),
    tags,
    company: {
      name: candidate.title,
      website: candidate.url,
      domain: candidate.domain,
      description: candidate.snippet,
      location: findCity(candidate.cityId).label,
    },
    contact: { emails: candidate.emails, phones: candidate.phones },
    intel: {
      query: candidate.query,
      snippet: candidate.snippet,
      lastEnrichedAt: new Date().toISOString(),
    },
  });
  patchProspect(created.id, { nextAction: { label: `Approve action center message: ${FUNNEL_LABELS[candidate.funnel]}` } } as any);
  return created;
}
