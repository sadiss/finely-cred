import { VERTICAL_LABELS } from './icp.ts';
import { isRealWebsite, normText, normalizeEmail, normalizePhone } from './normalize.ts';
import { skipReasonFor } from './skip.ts';
import type { IcpFit, PartnerVertical, RawProspectCandidate } from './types.ts';

const VERTICAL_HINTS: Record<PartnerVertical, RegExp> = {
  tax: /\b(tax|cpa|accountant|accounting|bookkeep|irs|impôt|impot|comptab)\b/i,
  bhph: /\b(buy here pay here|bhph|in[- ]house financ|used car|pre[- ]owned|auto dealer|car dealer)\b/i,
  realtor: /\b(realtor|real estate|brokerage|realty|listing agent|sotheby|keller williams|re\/max|coldwell)\b/i,
  mortgage: /\b(mortgage|loan officer|nmls|home loan|lender)\b/i,
  immigration: /\b(immigration|notary|notaire|tps|asylum|green card|multiservice|multi[- ]service)\b/i,
  community: /\b(money transfer|cam\b|unitransfer|western union|moneygram|remittance|community desk|botica)\b/i,
};

const HAITIAN_CORRIDOR_HINT =
  /\b(haitian|haiti|krey[oò]l|creole|little haiti|north miami|miami gardens|opa-?locka|miramar|homestead|lauderhill)\b/i;

export type ScoreBreakdown = {
  fit: IcpFit;
  score: number;
  whyFit: string;
  skipReason?: string;
};

function hasContact(candidate: RawProspectCandidate): boolean {
  return Boolean(normalizePhone(candidate.phone) || normalizeEmail(candidate.email));
}

function verticalMatch(candidate: RawProspectCandidate): boolean {
  const hay = `${candidate.businessName} ${candidate.snippet ?? ''} ${candidate.title ?? ''} ${candidate.website ?? ''}`;
  return VERTICAL_HINTS[candidate.vertical].test(hay) || Boolean(candidate.vertical);
}

export function buildWhyFit(candidate: RawProspectCandidate, fit: IcpFit): string {
  const city = normText(candidate.city) || 'South Florida';
  const label = VERTICAL_LABELS[candidate.vertical];
  const corridor = HAITIAN_CORRIDOR_HINT.test(`${candidate.city} ${candidate.snippet ?? ''} ${candidate.businessName}`)
    ? 'Haitian-corridor'
    : 'South Florida';
  const door =
    candidate.vertical === 'tax'
      ? 'Door A: clients they already prepare returns for. Door B: the owner’s own business-credit / funding-readiness education (no loan guarantees).'
      : candidate.vertical === 'bhph'
        ? 'Door A: buyers they already finance in-house. Door B: the dealer principal as an owner (restore ≠ debt gone).'
        : candidate.vertical === 'realtor'
          ? 'Door A: buyers/sellers they already advise before a contract. Door B: the brokerage owner’s business profile education.'
          : candidate.vertical === 'mortgage'
            ? 'Door A: applicants they already qualify. Door B: the LO/broker as a business owner. No funding guarantees.'
            : candidate.vertical === 'immigration'
              ? 'Door A: families they already help with filings/notary. Door B: the desk owner. Live path: /haitian.'
              : 'Door A: community clients they already serve. Door B: the operator as an owner. Live path: /haitian.';

  if (fit === 'skip') {
    return `Skip — not a referral-partner ICP row (${label}, ${city}).`;
  }
  const contact = hasContact(candidate) ? 'Public phone or email is on file.' : 'Website only so far; contact still needs a public page.';
  return `${city} ${label} desk on the ${corridor} map. ${door} ${contact} Brand as credit restore, not repair.`;
}

export function scoreCandidate(candidate: RawProspectCandidate): ScoreBreakdown {
  const skip = skipReasonFor(candidate);
  if (skip) {
    return {
      fit: 'skip',
      score: 0,
      whyFit: buildWhyFit(candidate, 'skip'),
      skipReason: skip,
    };
  }

  let score = 28;
  const site = isRealWebsite(candidate.website);
  const contact = hasContact(candidate);
  const hay = `${candidate.businessName} ${candidate.snippet ?? ''} ${candidate.title ?? ''} ${candidate.city ?? ''}`;

  if (site) score += 18;
  if (normalizePhone(candidate.phone)) score += 16;
  if (normalizeEmail(candidate.email)) score += 16;
  if (verticalMatch(candidate)) score += 10;
  if (HAITIAN_CORRIDOR_HINT.test(hay)) score += 8;
  if (normText(candidate.city)) score += 4;
  if (normText(candidate.personName)) score += 3;

  score = Math.max(0, Math.min(100, score));

  let fit: IcpFit = 'maybe';
  if (site && contact && score >= 62) fit = 'strong';
  else if (site || contact) fit = 'maybe';
  else fit = 'skip';

  return {
    fit,
    score,
    whyFit: buildWhyFit(candidate, fit),
  };
}
