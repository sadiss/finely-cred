/** Nurture sequence catalog for edge cron — mirrors src/domain/nurtureSequences.ts */
export type NurtureChannel = 'email' | 'sms' | 'portal';

export type NurtureStepCatalog = {
  id: string;
  delayHours: number;
  channel: NurtureChannel;
  templateId: string;
  subject?: string;
  personaName: string;
};

export type NurtureSequenceCatalog = {
  id: string;
  name: string;
  funnelId: string;
  steps: NurtureStepCatalog[];
};

export const NURTURE_SEQUENCE_CATALOG: NurtureSequenceCatalog[] = [
  {
    id: 'seq_credit_funnel',
    name: 'Credit dispute funnel',
    funnelId: 'credit_dispute',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_credit', subject: 'Your dispute guide + portal trial are ready', personaName: 'Finely Advisor' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_credit', personaName: 'Finely Advisor' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_credit', subject: 'Page 1 of your dispute guide — start here', personaName: 'Finely Advisor' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'lead_magnet_checklist_credit', subject: 'Run the AI restoration checklist', personaName: 'Finely Advisor' },
      { id: 'day7_session', delayHours: 168, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book your free enlightenment session', personaName: 'Finely Advisor' },
      { id: 'day14_trial', delayHours: 336, channel: 'email', templateId: 'lead_magnet_trial_ending', subject: 'Your DIY trial ends soon', personaName: 'Finely Advisor' },
    ],
  },
  {
    id: 'seq_debt_funnel',
    name: 'Debt freedom funnel',
    funnelId: 'debt_freedom',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_debt', subject: 'Your debt validation playbook is ready', personaName: 'Dispute Coach' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_debt', personaName: 'Dispute Coach' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_debt', subject: 'Validation vs verification — know the difference', personaName: 'Dispute Coach' },
      { id: 'day5_summons', delayHours: 120, channel: 'email', templateId: 'lead_magnet_summons_debt', subject: 'If you received a summons — read this first', personaName: 'Dispute Coach' },
      { id: 'day7_call', delayHours: 168, channel: 'email', templateId: 'lead_magnet_debt_call', subject: 'Talk with a debt strategist (free session)', personaName: 'Dispute Coach' },
    ],
  },
  {
    id: 'seq_business_funnel',
    name: 'Business credit funnel',
    funnelId: 'business_credit',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_business', subject: 'Your business credit jumpstart kit', personaName: 'Funding Strategist' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_business', personaName: 'Funding Strategist' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_business', subject: 'Entity hygiene checklist — day 1', personaName: 'Funding Strategist' },
      { id: 'day3_duns', delayHours: 72, channel: 'email', templateId: 'lead_magnet_duns_business', subject: 'D-U-N-S and vendor credit sequencing', personaName: 'Funding Strategist' },
      { id: 'day7_funding', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Book a funding advisor session', personaName: 'Funding Strategist' },
    ],
  },
  {
    id: 'seq_tradeline_funnel',
    name: 'Tradeline insider funnel',
    funnelId: 'tradeline_insider',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_tradeline', subject: 'Your tradeline insider guide', personaName: 'Sales Closer' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_tradeline', personaName: 'Sales Closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_tradeline', subject: 'Primary vs authorized user — start here', personaName: 'Sales Closer' },
      { id: 'day5_session', delayHours: 120, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Talk with a tradeline advisor (free session)', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_score_roadmap_funnel',
    name: 'Score roadmap funnel',
    funnelId: 'score_roadmap',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_score_roadmap', subject: 'Your 5-step score roadmap is ready', personaName: 'Finely Advisor' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_credit', personaName: 'Finely Advisor' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_score_roadmap', subject: 'Utilization first — day 1 priorities', personaName: 'Finely Advisor' },
      { id: 'day5_session', delayHours: 120, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book a restoration specialist session', personaName: 'Finely Advisor' },
    ],
  },
  {
    id: 'seq_agency_funnel',
    name: 'Agency white-label funnel',
    funnelId: 'agency_white_label',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_agency', subject: 'Your agency growth kit is ready', personaName: 'Sales Closer' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_business', personaName: 'Sales Closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_agency', subject: 'Partner onboarding checklist — day 1', personaName: 'Sales Closer' },
      { id: 'day7_call', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Book a solutions advisor call', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_specialist_apply_funnel',
    name: 'Specialist program apply',
    funnelId: 'specialist_apply',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_specialist', subject: 'Specialist program toolkit preview', personaName: 'Lead Converter' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_credit', personaName: 'Lead Converter' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_specialist', subject: 'AI dispute workflow primer — start here', personaName: 'Lead Converter' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book your activation call', personaName: 'Lead Converter' },
    ],
  },
  {
    id: 'seq_affiliate_funnel',
    name: 'Affiliate toolkit funnel',
    funnelId: 'affiliate_toolkit',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_affiliate', subject: 'Your affiliate toolkit is ready', personaName: 'Affiliate Specialist' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_meta', personaName: 'Affiliate Specialist' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_affiliate', subject: 'Compliant promo templates — day 1', personaName: 'Affiliate Specialist' },
      { id: 'day5_session', delayHours: 120, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Talk with affiliate success', personaName: 'Affiliate Specialist' },
    ],
  },
  {
    id: 'seq_meta_lead',
    name: 'Meta Lead Ad nurture',
    funnelId: 'meta_lead',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_meta', subject: 'Thanks for connecting on Facebook', personaName: 'Sales Closer' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_meta', personaName: 'Sales Closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_meta', subject: 'Your personalized credit roadmap', personaName: 'Sales Closer' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_meta_session', subject: 'Book your free Finely session', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_inbound_nurture',
    name: 'Generic inbound fallback',
    funnelId: 'generic',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_generic', subject: 'Welcome to Finely Cred', personaName: 'Nurture Concierge' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'lead_magnet_followup_generic', subject: 'Your next step with Finely Cred', personaName: 'Nurture Concierge' },
    ],
  },
  {
    id: 'seq_ebook_purchase',
    name: 'Ebook purchase follow-up',
    funnelId: 'bookstore',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'ebook_purchase_welcome', subject: 'Your book is in My Library', personaName: 'Support Specialist' },
      { id: 'day1_audio', delayHours: 24, channel: 'email', templateId: 'ebook_chapter1_audio', subject: 'Listen to chapter 1 while you read', personaName: 'Support Specialist' },
      { id: 'day7_course', delayHours: 168, channel: 'email', templateId: 'ebook_related_course', subject: 'Related course you might like', personaName: 'Support Specialist' },
    ],
  },
  {
    id: 'seq_tradeline_purchase',
    name: 'Tradeline package purchase',
    funnelId: 'tradeline_marketplace',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'tradeline_purchase_welcome', subject: 'Your tradeline package is active', personaName: 'Sales Closer' },
      { id: 'day1_intake', delayHours: 24, channel: 'portal', templateId: 'tradeline_intake_checklist', personaName: 'Sales Closer' },
      { id: 'day14_posting', delayHours: 336, channel: 'email', templateId: 'tradeline_posting_reminder', subject: 'Time to re-pull your report', personaName: 'Sales Closer' },
    ],
  },
];

export function getNurtureSequenceCatalog(sequenceId: string): NurtureSequenceCatalog | null {
  return NURTURE_SEQUENCE_CATALOG.find((s) => s.id === sequenceId) ?? null;
}

export function getSequenceStepDelays(sequenceId: string): number[] | null {
  const seq = getNurtureSequenceCatalog(sequenceId);
  return seq ? seq.steps.map((s) => s.delayHours) : null;
}
