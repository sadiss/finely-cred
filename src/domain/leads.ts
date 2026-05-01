export type LeadSource = 'resources' | 'chat' | 'contact' | 'affiliate' | 'agent' | 'consultation';

export type LeadOffer =
  | 'free_1h_consult'
  | 'general_inquiry'
  | 'affiliate_application'
  | 'agent_application'
  | 'enlightenment_session'
  | 'consultation_booking';

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
};

export function nowIso() {
  return new Date().toISOString();
}

