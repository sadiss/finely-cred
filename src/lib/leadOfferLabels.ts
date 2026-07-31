import type { LeadOffer } from '../domain/leads';

/** Human labels for admin / CRM / Marketing Desk lead offer chips. */
export const LEAD_OFFER_LABELS: Record<LeadOffer, string> = {
  free_1h_consult: 'Free consult',
  general_inquiry: 'General inquiry',
  affiliate_application: 'Affiliate application',
  agent_application: 'Credit Specialist application',
  credit_specialist_join: 'Credit Specialist join',
  credit_specialist_guide: 'Credit Specialist guide',
  enlightenment_session: 'Strategy session',
  consultation_booking: 'Consultation booking',
  dispute_letter_guide: 'Dispute letter guide',
  debt_validation_playbook: 'Debt validation playbook',
  business_credit_jumpstart: 'Business credit jumpstart',
  primary_tradeline_insider: 'Tradeline insider',
  score_roadmap: 'Score roadmap',
  portal_signup: 'Portal signup',
  book_purchase: 'Book purchase',
  tradeline_package: 'Tradeline package',
  agency_workspace: 'Agency workspace',
  heta_society_signup: 'HETA Society signup',
};

export function leadOfferLabel(offer: string | null | undefined): string {
  if (!offer) return 'Unknown offer';
  if (offer in LEAD_OFFER_LABELS) return LEAD_OFFER_LABELS[offer as LeadOffer];
  if (offer === 'specialist_program_apply') return 'Credit Specialist join';
  if (offer === 'agency_white_label_kit') return 'Agency white-label kit';
  if (offer === 'affiliate_toolkit') return 'Affiliate toolkit';
  return offer.replace(/_/g, ' ');
}

export function isCreditSpecialistLeadOffer(offer: string | null | undefined): boolean {
  return (
    offer === 'credit_specialist_join' ||
    offer === 'credit_specialist_guide' ||
    offer === 'agent_application' ||
    offer === 'specialist_program_apply'
  );
}
