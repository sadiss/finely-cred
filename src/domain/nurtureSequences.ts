/** Funnel-specific nurture sequence definitions — single source for email/SMS/portal steps. */

import type { AgentPersonaId } from './agentPersonas';

export type NurtureChannel = 'email' | 'sms' | 'portal';

export type NurtureStepDef = {
  id: string;
  delayHours: number;
  channel: NurtureChannel;
  templateId: string;
  personaId?: AgentPersonaId;
  subject?: string;
  condition?: { field: string; op: 'eq' | 'neq'; value: string };
};

export type NurtureSequenceDef = {
  id: string;
  name: string;
  funnelId: string;
  agentPersonaId: AgentPersonaId;
  enabled: boolean;
  steps: NurtureStepDef[];
};

export const NURTURE_SEQUENCES: NurtureSequenceDef[] = [
  {
    id: 'seq_credit_funnel',
    name: 'Credit dispute funnel',
    funnelId: 'credit_dispute',
    agentPersonaId: 'finely_advisor',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_credit', subject: 'Your dispute guide + portal trial are ready' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_credit', personaId: 'finely_advisor' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_credit', subject: 'Page 1 of your dispute guide — start here' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'lead_magnet_checklist_credit', subject: 'Run the AI restoration checklist' },
      { id: 'day7_session', delayHours: 168, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book your free strategy call' },
      { id: 'day14_trial', delayHours: 336, channel: 'email', templateId: 'lead_magnet_trial_ending', subject: 'Your DIY trial ends soon' },
    ],
  },
  {
    id: 'seq_debt_funnel',
    name: 'Debt freedom funnel',
    funnelId: 'debt_freedom',
    agentPersonaId: 'dispute_coach',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_debt', subject: 'Your debt validation playbook is ready' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_debt', personaId: 'dispute_coach' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_debt', subject: 'Validation vs verification — know the difference' },
      { id: 'day5_summons', delayHours: 120, channel: 'email', templateId: 'lead_magnet_summons_debt', subject: 'If you received a summons — read this first' },
      { id: 'day7_call', delayHours: 168, channel: 'email', templateId: 'lead_magnet_debt_call', subject: 'Talk with a debt strategist (free session)' },
    ],
  },
  {
    id: 'seq_business_funnel',
    name: 'Business credit funnel',
    funnelId: 'business_credit',
    agentPersonaId: 'funding_strategist',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_business', subject: 'Your business credit jumpstart kit' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_business', personaId: 'funding_strategist' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_business', subject: 'Entity hygiene checklist — day 1' },
      { id: 'day3_duns', delayHours: 72, channel: 'email', templateId: 'lead_magnet_duns_business', subject: 'D-U-N-S and vendor credit sequencing' },
      { id: 'day7_funding', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Book a funding advisor session' },
    ],
  },
  {
    id: 'seq_tradeline_funnel',
    name: 'Tradeline insider funnel',
    funnelId: 'tradeline_insider',
    agentPersonaId: 'sales_closer',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_tradeline', subject: 'Your tradeline insider guide' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_tradeline', personaId: 'sales_closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_tradeline', subject: 'Primary vs authorized user — start here' },
      { id: 'day5_session', delayHours: 120, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Talk with a tradeline advisor (free session)' },
    ],
  },
  {
    id: 'seq_score_roadmap_funnel',
    name: 'Score roadmap funnel',
    funnelId: 'score_roadmap',
    agentPersonaId: 'finely_advisor',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_score_roadmap', subject: 'Your 5-step score roadmap is ready' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_credit', personaId: 'finely_advisor' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_score_roadmap', subject: 'Utilization first — day 1 priorities' },
      { id: 'day5_session', delayHours: 120, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book a restoration specialist session' },
    ],
  },
  {
    id: 'seq_agency_funnel',
    name: 'Agency white-label funnel',
    funnelId: 'agency_white_label',
    agentPersonaId: 'sales_closer',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_agency', subject: 'Your agency growth kit is ready' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_business', personaId: 'sales_closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_agency', subject: 'Partner onboarding checklist — day 1' },
      { id: 'day7_call', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Book a solutions advisor call' },
    ],
  },
  {
    id: 'seq_specialist_apply_funnel',
    name: 'Specialist program apply',
    funnelId: 'specialist_apply',
    agentPersonaId: 'lead_converter',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_specialist', subject: 'Specialist program toolkit preview' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_credit', personaId: 'lead_converter' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_specialist', subject: 'AI dispute workflow primer — start here' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Book your activation call' },
    ],
  },
  {
    id: 'seq_affiliate_funnel',
    name: 'Affiliate toolkit funnel',
    funnelId: 'affiliate_toolkit',
    agentPersonaId: 'affiliate_specialist',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_affiliate', subject: 'Your affiliate toolkit is ready' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_meta', personaId: 'affiliate_specialist' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_affiliate', subject: 'Compliant promo templates — day 1' },
      { id: 'day5_session', delayHours: 120, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Talk with affiliate success' },
    ],
  },
  {
    id: 'seq_meta_lead',
    name: 'Meta Lead Ad nurture',
    funnelId: 'meta_lead',
    agentPersonaId: 'sales_closer',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_meta', subject: 'Thanks for connecting on Facebook' },
      { id: 'welcome_portal', delayHours: 0, channel: 'portal', templateId: 'portal_welcome_meta', personaId: 'sales_closer' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_meta', subject: 'Your personalized credit roadmap' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_meta_session', subject: 'Book your free Finely session' },
    ],
  },
  {
    id: 'seq_inbound_nurture',
    name: 'Generic inbound fallback',
    funnelId: 'contact_inquiry',
    agentPersonaId: 'nurture_concierge',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_generic', subject: 'We got your message — here\'s what happens next' },
      { id: 'day3', delayHours: 72, channel: 'email', templateId: 'lead_magnet_followup_generic', subject: 'Your next step with Finely Cred' },
    ],
  },
  {
    id: 'seq_strategy_session',
    name: 'Strategy call booking',
    funnelId: 'strategy_session',
    agentPersonaId: 'finely_advisor',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'strategy_session_welcome', subject: 'Your strategy call is booked — here\'s how to prep' },
      { id: 'day1_prep', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_credit', subject: 'Prep checklist for your Finely strategy call' },
      { id: 'day3_session', delayHours: 72, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Questions to ask on your strategy call' },
    ],
  },
  {
    id: 'seq_agency_signup',
    name: 'Agency workspace welcome',
    funnelId: 'agency_signup',
    agentPersonaId: 'sales_closer',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'agency_signup_welcome', subject: 'Your agency workspace is live' },
      { id: 'day1', delayHours: 24, channel: 'email', templateId: 'lead_magnet_day1_agency', subject: 'White-label setup checklist — day 1' },
      { id: 'day7_call', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Book agency onboarding call' },
    ],
  },
  {
    id: 'seq_ebook_purchase',
    name: 'Ebook purchase follow-up',
    funnelId: 'bookstore',
    agentPersonaId: 'support_specialist',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'ebook_purchase_welcome', subject: 'Your book is in My Library' },
      { id: 'day1_audio', delayHours: 24, channel: 'email', templateId: 'ebook_chapter1_audio', subject: 'Listen to chapter 1 while you read' },
      { id: 'day7_course', delayHours: 168, channel: 'email', templateId: 'ebook_related_course', subject: 'Related course you might like' },
    ],
  },
  {
    id: 'seq_tradeline_purchase',
    name: 'Tradeline package purchase',
    funnelId: 'tradeline_marketplace',
    agentPersonaId: 'sales_closer',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'tradeline_purchase_welcome', subject: 'Your tradeline package is active' },
      { id: 'day1_intake', delayHours: 24, channel: 'portal', templateId: 'tradeline_intake_checklist', personaId: 'sales_closer' },
      { id: 'day14_posting', delayHours: 336, channel: 'email', templateId: 'tradeline_posting_reminder', subject: 'Time to re-pull your report' },
    ],
  },
  {
    id: 'seq_invoice_dunning',
    name: 'Invoice payment reminders',
    funnelId: 'billing',
    agentPersonaId: 'support_specialist',
    enabled: true,
    steps: [
      { id: 'invoice_sent', delayHours: 0, channel: 'email', templateId: 'invoice_sent', subject: 'Your Finely Cred invoice' },
      { id: 'reminder_1d', delayHours: 24, channel: 'email', templateId: 'invoice_reminder', subject: 'Invoice reminder' },
      { id: 'reminder_3d', delayHours: 72, channel: 'email', templateId: 'invoice_reminder', subject: 'Payment due — invoice reminder' },
      { id: 'reminder_7d', delayHours: 168, channel: 'portal', templateId: 'portal_billing_nudge', personaId: 'support_specialist' },
    ],
  },
  {
    id: 'seq_affiliate_residual',
    name: 'Affiliate residual income nurture',
    funnelId: 'affiliate_residual',
    agentPersonaId: 'affiliate_specialist',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_affiliate', subject: 'Your affiliate residual income playbook' },
      { id: 'day3_recurring', delayHours: 72, channel: 'email', templateId: 'lead_magnet_day1_affiliate', subject: 'How recurring commissions work' },
      { id: 'day7_denefit', delayHours: 168, channel: 'email', templateId: 'lead_magnet_funding_call', subject: 'Stack Denefit contracts for long-tail income' },
      { id: 'day14_checkin', delayHours: 336, channel: 'portal', templateId: 'portal_welcome_meta', personaId: 'affiliate_specialist' },
    ],
  },
  {
    id: 'seq_au_seller_onboard',
    name: 'AU seller onboarding',
    funnelId: 'au_seller',
    agentPersonaId: 'sales_closer',
    enabled: true,
    steps: [
      { id: 'welcome', delayHours: 0, channel: 'email', templateId: 'lead_magnet_welcome_au_seller', subject: 'Welcome — AU seller workspace' },
      { id: 'day1_listing', delayHours: 24, channel: 'portal', templateId: 'tradeline_intake_checklist', personaId: 'sales_closer' },
      { id: 'day3_compliance', delayHours: 72, channel: 'email', templateId: 'lead_magnet_day1_tradeline', subject: 'Listing compliance checklist' },
      { id: 'day7_payouts', delayHours: 168, channel: 'email', templateId: 'lead_magnet_book_session', subject: 'Set up payouts & contracts' },
    ],
  },
];

export function resolveSequenceForLead(args: {
  funnelPath?: string;
  offer?: string;
  interest?: string;
  utmSource?: string;
  utmMedium?: string;
}): NurtureSequenceDef {
  const blob = `${args.interest ?? ''} ${args.offer ?? ''} ${args.funnelPath ?? ''} ${args.utmSource ?? ''} ${args.utmMedium ?? ''}`.toLowerCase();
  if (blob.includes('meta_lead') || args.utmSource === 'facebook' || args.utmMedium === 'lead_ad') {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_meta_lead')!;
  }
  if (args.offer?.includes('affiliate_application') || args.offer?.includes('affiliate_program')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_affiliate_funnel')!;
  }
  if (args.offer?.includes('agent_application') || args.offer?.includes('specialist')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_specialist_apply_funnel')!;
  }
  if (args.offer?.includes('enlightenment_session') || args.offer?.includes('strategy_call')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_strategy_session')!;
  }
  if (args.offer?.includes('agency_signup') || args.offer?.includes('agency_workspace')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_agency_signup')!;
  }
  if (args.offer?.includes('ebook') || args.offer?.includes('book_purchase')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_ebook_purchase')!;
  }
  if (args.offer?.includes('tradeline_purchase') || args.offer?.includes('tradeline_package')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_tradeline_purchase')!;
  }
  const path = (args.funnelPath || '').toLowerCase();
  if (path.includes('enlightenment') || path.includes('strategy-call')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_strategy_session')!;
  }
  if (path.includes('contact')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_inbound_nurture')!;
  }
  if (path.includes('score-roadmap') || path.includes('score_roadmap')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_score_roadmap_funnel')!;
  }
  if (path.includes('agency') || path.includes('white-label')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_agency_funnel')!;
  }
  if (path.includes('specialist-apply') || path.includes('specialist_apply')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_specialist_apply_funnel')!;
  }
  if (path.includes('affiliate')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_affiliate_funnel')!;
  }
  if (path.includes('debt')) return NURTURE_SEQUENCES.find((s) => s.id === 'seq_debt_funnel')!;
  if (path.includes('business')) return NURTURE_SEQUENCES.find((s) => s.id === 'seq_business_funnel')!;
  if (path.includes('tradeline')) return NURTURE_SEQUENCES.find((s) => s.id === 'seq_tradeline_funnel')!;
  if (path.includes('free-guide') || path.includes('credit') || args.offer?.includes('dispute')) {
    return NURTURE_SEQUENCES.find((s) => s.id === 'seq_credit_funnel')!;
  }
  return NURTURE_SEQUENCES.find((s) => s.id === 'seq_inbound_nurture')!;
}

export function getNurtureSequence(id: string): NurtureSequenceDef | undefined {
  return NURTURE_SEQUENCES.find((s) => s.id === id);
}
