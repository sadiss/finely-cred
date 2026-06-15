export type LeadSource = 'resources' | 'chat' | 'contact' | 'affiliate' | 'agent' | 'consultation' | 'lead_magnet' | 'purchase' | 'agency';

export type LeadGoal = 'credit' | 'debt' | 'business' | 'tradelines' | 'general';

export type LeadOffer =
  | 'free_1h_consult'
  | 'general_inquiry'
  | 'affiliate_application'
  | 'agent_application'
  | 'enlightenment_session'
  | 'consultation_booking'
  | 'dispute_letter_guide'
  | 'debt_validation_playbook'
  | 'business_credit_jumpstart'
  | 'primary_tradeline_insider'
  | 'portal_signup'
  | 'book_purchase'
  | 'tradeline_package'
  | 'agency_workspace';

export type LeadCapture = {
  id: string;
  createdAt: string; // ISO
  source: LeadSource;
  offer: LeadOffer;
  /** Optional: which guide/asset triggered the capture. */
  interest?: string;

  fullName: string;
  email: string;
  phone: string;

  /** Required consent to be contacted. */
  consentToContact: boolean;

  /**
   * Optional marketing consents (unchecked by default).
   * NOTE: These are stored locally even when remote lead capture is configured.
   */
  consentEmailMarketing?: boolean;
  consentSmsMarketing?: boolean;

  /** Marketing attribution (local store; optional on remote). */
  referralCode?: string;
  promoterRole?: string;
  promoType?: string;
  promoAsset?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  funnelPath?: string;
  funnelId?: string;
  goal?: LeadGoal;
  /** Free stack items unlocked at capture (labels). */
  giveawayStack?: string[];
};

export function nowIso() {
  return new Date().toISOString();
}

