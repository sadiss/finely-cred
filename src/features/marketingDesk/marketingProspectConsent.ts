import type { Prospect, ProspectConsentBasis, ProspectLeadType } from '../../domain/crmProspects';
import { listLeadCaptures } from '../../data/leadsRepo';

export type MarketingConsentSnapshot = {
  consentBasis: ProspectConsentBasis;
  leadType: ProspectLeadType;
  emailMarketingAllowed: boolean;
};

const OPT_IN_BASES: ProspectConsentBasis[] = [
  'inbound_form_opt_in',
  'lead_capture_opt_in',
  'partner_consent',
];

export function isExplicitMarketingOptInBasis(basis?: ProspectConsentBasis): boolean {
  return Boolean(basis && OPT_IN_BASES.includes(basis));
}

export function prospectAllowsColdEmail(prospect: Prospect | null | undefined): boolean {
  if (!prospect) return false;
  if (prospect.emailMarketingAllowed === true) return true;
  if (prospect.emailMarketingAllowed === false) return false;
  return isExplicitMarketingOptInBasis(prospect.consentBasis);
}

export function consentLabelForProspect(prospect: Prospect | null | undefined): {
  chip: string;
  tone: 'emerald' | 'amber';
} {
  if (prospectAllowsColdEmail(prospect)) {
    return { chip: 'Inbound opt-in', tone: 'emerald' };
  }
  return { chip: 'Discovered — link first', tone: 'amber' };
}

function leadCaptureOptInForEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return false;
  const lead = listLeadCaptures().find((l) => (l.email || '').trim().toLowerCase() === normalized);
  return Boolean(lead?.consentEmailMarketing);
}

/** Resolve consent for Marketing Desk hunt / approve hits (default: discovered, no cold mail). */
export function consentForMarketingDeskHit(args: {
  source?: Prospect['source'];
  emails?: string[];
  consentBasis?: ProspectConsentBasis;
  leadType?: ProspectLeadType;
  emailMarketingAllowed?: boolean;
}): MarketingConsentSnapshot {
  if (args.consentBasis || args.leadType || typeof args.emailMarketingAllowed === 'boolean') {
    const basis = args.consentBasis ?? 'unknown';
    const allowed =
      typeof args.emailMarketingAllowed === 'boolean'
        ? args.emailMarketingAllowed
        : isExplicitMarketingOptInBasis(basis);
    return {
      consentBasis: basis,
      leadType: args.leadType ?? (allowed ? 'inbound' : 'discovered'),
      emailMarketingAllowed: allowed,
    };
  }

  const email = (args.emails ?? []).find((e) => (e || '').includes('@'))?.trim().toLowerCase() ?? '';
  if (email && leadCaptureOptInForEmail(email)) {
    return {
      consentBasis: 'lead_capture_opt_in',
      leadType: 'inbound',
      emailMarketingAllowed: true,
    };
  }

  const source = args.source ?? 'lead_intel_search';
  if (source === 'lead_capture' || source === 'referral') {
    return {
      consentBasis: source === 'lead_capture' ? 'lead_capture_opt_in' : 'unknown',
      leadType: source === 'lead_capture' ? 'inbound' : 'referral',
      emailMarketingAllowed: source === 'lead_capture',
    };
  }

  return {
    consentBasis: 'discovered_no_consent',
    leadType: 'discovered',
    emailMarketingAllowed: false,
  };
}
