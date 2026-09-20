import { isRealWebsite, normText, normalizeEmail, normalizePhone, safeHttpUrl } from './normalize.ts';
import type { RawProspectCandidate } from './types.ts';

const COMPETITOR_NAME_RE =
  /\b(credit\s*(repair|restore|fix|heal|rescue|boost|help)|609\s*(credit|letters?)|tradeline(s)?\s+(company|seller)|fix\s*my\s*credit|dispute\s+letters?\s+(service|company))\b/i;

const COMPETITOR_DOMAIN_RE =
  /(creditrepair|credit-repair|creditrestore|credit-restore|creditfix|fixmycredit|609credit|609letter|tradelineseller|disputesauce|credithero|skybluecredit)/i;

const CONSUMER_DUMP_RE =
  /\b(lead\s*list|email\s*dump|ssn\b|social security|people\s*search|beenverified|spokeo|whitepages|personal\s+(emails?|phones?)\s+for\s+sale|buy\s+\d+\s+leads|consumer\s+pii)\b/i;

export function isCompetitorBusiness(candidate: Pick<RawProspectCandidate, 'businessName' | 'website' | 'snippet' | 'title'>): boolean {
  const name = normText(candidate.businessName);
  const snippet = normText(candidate.snippet);
  const title = normText(candidate.title);
  const website = safeHttpUrl(candidate.website) || normText(candidate.website);
  const hay = `${name} ${title} ${snippet} ${website}`;
  if (COMPETITOR_NAME_RE.test(name)) return true;
  if (COMPETITOR_DOMAIN_RE.test(website)) return true;
  if (COMPETITOR_NAME_RE.test(title) && !/\b(tax|cpa|realtor|mortgage|notary|dealer|immigration)\b/i.test(name)) {
    return true;
  }
  // Mention of credit restore as a service they sell (primary) vs a casual mention.
  if (/\bwe (offer|provide|specialize in) (credit repair|credit restore)\b/i.test(hay) && COMPETITOR_NAME_RE.test(hay)) {
    return true;
  }
  return false;
}

export function isConsumerLeadDump(candidate: RawProspectCandidate): boolean {
  if (candidate.consumerList) return true;
  const hay = `${candidate.businessName} ${candidate.snippet ?? ''} ${candidate.website ?? ''}`;
  return CONSUMER_DUMP_RE.test(hay);
}

export function isThinRow(candidate: Pick<RawProspectCandidate, 'website' | 'phone' | 'email'>): boolean {
  const hasPhone = Boolean(normalizePhone(candidate.phone));
  const hasEmail = Boolean(normalizeEmail(candidate.email));
  const hasSite = isRealWebsite(candidate.website);
  return !hasPhone && !hasEmail && !hasSite;
}

export type SkipReason =
  | 'competitor'
  | 'thin'
  | 'consumer_pii'
  | 'duplicate'
  | 'missing_name';

export function skipReasonFor(
  candidate: RawProspectCandidate,
): Exclude<SkipReason, 'duplicate'> | null {
  if (!normText(candidate.businessName)) return 'missing_name';
  if (isCompetitorBusiness(candidate)) return 'competitor';
  if (isConsumerLeadDump(candidate)) return 'consumer_pii';
  if (isThinRow(candidate)) return 'thin';
  return null;
}
