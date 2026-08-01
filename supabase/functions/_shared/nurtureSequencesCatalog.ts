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
      { id: 'day7_session', delayHours: 168, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book your free strategy call', personaName: 'Finely Advisor' },
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
    funnelId: 'contact_inquiry',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_generic', subject: 'We got your message — here\'s what happens next', personaName: 'Nurture Concierge' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'lead_magnet_followup_generic', subject: 'Your next step with Finely Cred', personaName: 'Nurture Concierge' },
    ],
  },
  {
    id: 'seq_financing_preapproval',
    name: 'Financing pre-approval nurture',
    funnelId: 'financing_preapproval',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_generic', subject: 'Your financing pre-approval next steps', personaName: 'Funding Strategist' },
      { id: 'day1_pricing', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_credit', subject: 'In-house financing + Equifax-reporting contracts explained', personaName: 'Funding Strategist' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book a financing readiness session', personaName: 'Funding Strategist' },
    ],
  },
  {
    id: 'seq_strategy_session',
    name: 'Strategy call booking',
    funnelId: 'strategy_session',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'strategy_session_welcome', subject: 'Your strategy call is booked — here\'s how to prep', personaName: 'Finely Advisor' },
      { id: 'day1_prep', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_credit', subject: 'Prep checklist for your Finely strategy call', personaName: 'Finely Advisor' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Questions to ask on your strategy call', personaName: 'Finely Advisor' },
    ],
  },
  {
    id: 'seq_agency_signup',
    name: 'Agency workspace welcome',
    funnelId: 'agency_signup',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'agency_signup_welcome', subject: 'Your agency workspace is live', personaName: 'Sales Closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_agency', subject: 'White-label setup checklist — day 1', personaName: 'Sales Closer' },
      { id: 'day7_call', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Book agency onboarding call', personaName: 'Sales Closer' },
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
  {
    id: 'seq_invoice_dunning',
    name: 'Invoice payment reminders',
    funnelId: 'billing',
    steps: [
      { id: 'invoice_sent', delayHours: 0, channel: 'email', templateId: 'invoice_sent', subject: 'Your Finely Cred invoice', personaName: 'Support Specialist' },
      { id: 'reminder_1d', delayHours: 24, channel: 'email', templateId: 'invoice_reminder', subject: 'Invoice reminder', personaName: 'Support Specialist' },
      { id: 'reminder_3d', delayHours: 72, channel: 'email', templateId: 'invoice_reminder', subject: 'Payment due — invoice reminder', personaName: 'Support Specialist' },
      { id: 'reminder_7d', delayHours: 168, channel: 'portal', templateId: 'portal_billing_nudge', personaName: 'Support Specialist' },
    ],
  },
  {
    id: 'seq_affiliate_residual',
    name: 'Affiliate residual income nurture',
    funnelId: 'affiliate_residual',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_affiliate', subject: 'Your affiliate residual income playbook', personaName: 'Affiliate Specialist' },
      { id: 'day3_recurring', delayHours: 72, channel: 'email', templateId: 'lead_magnet_day1_affiliate', subject: 'How recurring commissions work', personaName: 'Affiliate Specialist' },
      { id: 'day7_denefit', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Stack Denefit contracts for long-tail income', personaName: 'Affiliate Specialist' },
      { id: 'day14_checkin', delayHours: 336, channel: 'portal', templateId: 'portal_welcome_meta', personaName: 'Affiliate Specialist' },
    ],
  },
  {
    id: 'seq_au_seller_onboard',
    name: 'AU seller onboarding',
    funnelId: 'au_seller',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_au_seller', subject: 'Welcome — AU seller workspace', personaName: 'Sales Closer' },
      { id: 'day1_listing', delayHours: 24, channel: 'portal', templateId: 'tradeline_intake_checklist', personaName: 'Sales Closer' },
      { id: 'day3_compliance', delayHours: 72, channel: 'email', templateId: 'lead_magnet_day1_tradeline', subject: 'Listing compliance checklist', personaName: 'Sales Closer' },
      { id: 'day7_payouts', delayHours: 168, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Set up payouts & contracts', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_cold_prospect',
    name: 'Cold prospect (Marketing Desk)',
    funnelId: 'cold_prospect',
    steps: [
      { id: 'd0', delayHours: 0, channel: 'email', templateId: 'cold_prospect_d0', subject: 'Quick idea for your business credit path', personaName: 'Sales Closer' },
      { id: 'd2', delayHours: 48, channel: 'email', templateId: 'cold_prospect_d2', subject: 'A short next step (2 minutes)', personaName: 'Sales Closer' },
      { id: 'd5', delayHours: 120, channel: 'email', templateId: 'cold_prospect_d5', subject: 'Partner one-sheets + session option', personaName: 'Sales Closer' },
      { id: 'd7', delayHours: 168, channel: 'email', templateId: 'cold_prospect_d7', subject: 'Book a free strategy session', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_offer_pack',
    name: 'Offer pack (Marketing Desk)',
    funnelId: 'offer_pack',
    steps: [
      { id: 'offer', delayHours: 0, channel: 'email', templateId: 'offer_pack_send', subject: 'Your Finely Cred offer pack', personaName: 'Sales Closer' },
      { id: 'offer_follow', delayHours: 72, channel: 'email', templateId: 'offer_pack_followup', subject: 'Questions on the offer pack?', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_booked_confirm',
    name: 'Booked session confirm',
    funnelId: 'booked_session',
    steps: [
      { id: 'confirm', delayHours: 0, channel: 'email', templateId: 'booked_session_confirm', subject: 'You are booked — prep for your Finely session', personaName: 'Finely Advisor' },
      { id: 'prep', delayHours: 24, channel: 'email', templateId: 'booked_session_prep', subject: 'Prep checklist for your session', personaName: 'Finely Advisor' },
    ],
  },
  {
    id: 'seq_partner_onboard_keepwarm',
    name: 'Partner onboard keep-warm (30 days)',
    funnelId: 'partner_lifecycle',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'partner_onboard_welcome', subject: 'Welcome to your Finely Cred portal', personaName: 'Nurture Concierge' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'partner_onboard_day3', subject: 'Your first 3 portal moves', personaName: 'Nurture Concierge' },
      { id: 'day7', delayHours: 168, channel: 'email', templateId: 'partner_onboard_day7', subject: 'Week-1 checklist for partners', personaName: 'Nurture Concierge' },
      { id: 'day14', delayHours: 336, channel: 'email', templateId: 'partner_onboard_day14', subject: 'Mid-month progress check', personaName: 'Nurture Concierge' },
      { id: 'day21', delayHours: 504, channel: 'email', templateId: 'partner_onboard_day21', subject: 'Education tip: what to focus on next', personaName: 'Nurture Concierge' },
      { id: 'day30', delayHours: 720, channel: 'email', templateId: 'partner_onboard_day30', subject: '30-day wrap — book a free session if helpful', personaName: 'Nurture Concierge' },
    ],
  },
  {
    id: 'seq_partner_monthly_education',
    name: 'Partner monthly education',
    funnelId: 'partner_lifecycle',
    steps: [
      { id: 'm1', delayHours: 0, channel: 'email', templateId: 'partner_edu_m1', subject: 'Partner education: utilization & reporting cycles', personaName: 'Finely Advisor' },
      { id: 'm2', delayHours: 720, channel: 'email', templateId: 'partner_edu_m2', subject: 'Partner education: disputes vs documentation', personaName: 'Finely Advisor' },
      { id: 'm3', delayHours: 1440, channel: 'email', templateId: 'partner_edu_m3', subject: 'Partner education: funding readiness basics', personaName: 'Finely Advisor' },
      { id: 'm4', delayHours: 2160, channel: 'email', templateId: 'partner_edu_m4', subject: 'Partner education: business credit sequencing', personaName: 'Finely Advisor' },
    ],
  },
  {
    id: 'seq_partner_birthday',
    name: 'Partner birthday (opt-in)',
    funnelId: 'partner_lifecycle',
    steps: [
      { id: 'birthday', delayHours: 0, channel: 'email', templateId: 'partner_birthday', subject: 'Happy birthday from Finely Cred', personaName: 'Nurture Concierge' },
    ],
  },
  {
    id: 'seq_partner_opportunity_au',
    name: 'Partner opportunity — AU tradelines',
    funnelId: 'partner_opportunity',
    steps: [
      { id: 'intro', delayHours: 0, channel: 'email', templateId: 'partner_opp_au_intro', subject: 'Optional path: authorized-user tradelines', personaName: 'Sales Closer' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'partner_opp_au_day3', subject: 'How AU tradelines fit a restore plan', personaName: 'Sales Closer' },
      { id: 'day7', delayHours: 168, channel: 'email', templateId: 'partner_opp_au_day7', subject: 'Questions on AU? Book a free session', personaName: 'Sales Closer' },
    ],
  },
  {
    id: 'seq_partner_opportunity_affiliate',
    name: 'Partner opportunity — affiliate',
    funnelId: 'partner_opportunity',
    steps: [
      { id: 'intro', delayHours: 0, channel: 'email', templateId: 'partner_opp_aff_intro', subject: 'Optional path: partner affiliate toolkit', personaName: 'Affiliate Specialist' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'partner_opp_aff_day3', subject: 'Compliant sharing tips for partners', personaName: 'Affiliate Specialist' },
      { id: 'day7', delayHours: 168, channel: 'email', templateId: 'partner_opp_aff_day7', subject: 'Affiliate Q&A — book a short call', personaName: 'Affiliate Specialist' },
    ],
  },
  {
    id: 'seq_specialist_keepwarm',
    name: 'Specialist keep-warm',
    funnelId: 'specialist_lifecycle',
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'specialist_keepwarm_welcome', subject: 'Specialist lane — your weekly focus', personaName: 'Lead Converter' },
      { id: 'day14', delayHours: 336, channel: 'email', templateId: 'specialist_keepwarm_day14', subject: 'Pipeline hygiene for Credit Specialists', personaName: 'Lead Converter' },
      { id: 'day30', delayHours: 720, channel: 'email', templateId: 'specialist_keepwarm_day30', subject: 'Playbook refresh: factual findings first', personaName: 'Lead Converter' },
      { id: 'day60', delayHours: 1440, channel: 'email', templateId: 'specialist_keepwarm_day60', subject: 'Keep-warm check-in for active specialists', personaName: 'Lead Converter' },
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
