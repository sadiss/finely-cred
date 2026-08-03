import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  FileSignature,
  LayoutDashboard,
  Mail,
  PlayCircle,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { FreeGuideId } from '../resources/freeGuides';
import type { AgentPersonaId } from './agentPersonas';
import { LEAD_MAGNET_TRIAL_DAYS } from '../lib/leadMagnetTrial';

export type LeadMagnetFunnelConfig = {
  id: string;
  path: string;
  funnelId: string;
  sequenceId: string;
  agentPersonaId: AgentPersonaId;
  agentDisplayName: string;
  agentRole: string;
  guideId: FreeGuideId;
  offer: string;
  onboardingLane: string;
  metaTitle: string;
  metaDesc: string;
  urgencyText: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSub: string;
  valueStack: Array<{ label: string; value: string; trialFeature?: string; locksAfterTrial?: boolean }>;
  features: Array<{ icon: LucideIcon; title: string; desc: string }>;
  trustCerts: string[];
  /** Post-signup booking CTA (public enlightenment session). */
  bookingPath?: string;
};

export const CREDIT_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'credit',
  path: '/free-guide',
  funnelId: 'credit_dispute',
  sequenceId: 'seq_credit_funnel',
  agentPersonaId: 'finely_advisor',
  agentDisplayName: 'Alex',
  agentRole: 'Credit Restoration Specialist',
  guideId: 'credit-dispute-letter-guide',
  offer: 'dispute_letter_guide',
  onboardingLane: 'personal_restore',
  metaTitle: 'Free credit guide',
  metaDesc: 'Download the dispute letter guide and preview the Finely Cred partner portal with a limited DIY trial.',
  urgencyText: '⚡ ACT NOW — Free dispute toolkit + 15-day portal trial (limited weekly access)',
  heroHeadline: 'Stop guessing.',
  heroHighlight: 'Start disputing',
  heroSub: 'with a proven playbook.',
  valueStack: [
    { label: 'Step-by-step dispute writing playbook', value: '$49' },
    { label: 'Bureau mailing kit + FCRA rights', value: '$49' },
    { label: 'Law-per-negative citation guide', value: '$39' },
    { label: '5-step score recovery roadmap', value: '$40' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day DIY portal + report upload`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
    { label: 'AI restoration checklist + video', value: '$41', trialFeature: 'ai_checklist', locksAfterTrial: true },
  ],
  features: [
    { icon: FileSignature, title: 'Step-by-step dispute writing', desc: 'A clear 5-step playbook for bureau letters — evidence-first, one tradeline per letter.' },
    { icon: Target, title: 'Law per negative', desc: 'Cite the right statute for charge-offs, inquiries, re-aging, and more.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day DIY portal trial`, desc: 'Upload a report and preview the real dashboard.' },
    { icon: TrendingUp, title: '5-step score roadmap', desc: 'Utilization, mix, and timing sequence into the 700s.' },
    { icon: ShieldCheck, title: 'Know your FCRA rights', desc: 'Plain-English laws that force bureaus to verify or delete.' },
    { icon: Mail, title: 'Letter Stream + complaints', desc: 'Certified mail workflow plus CFPB/FTC escalation playbook.' },
    { icon: PlayCircle, title: 'AI checklist + video walkthrough', desc: 'See how restoration tracking works inside Finely Cred.' },
  ],
  trustCerts: ['Secure PDF download', 'FCRA rights checklist', 'Certified-mail workflow', 'Educational use disclosure'],
  bookingPath: '/enlightenment-session',
};

export const DEBT_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'debt',
  path: '/free-debt-guide',
  funnelId: 'debt_freedom',
  sequenceId: 'seq_debt_funnel',
  agentPersonaId: 'dispute_coach',
  agentDisplayName: 'Casey',
  agentRole: 'Debt Resolution Specialist',
  guideId: 'collections-validation-deep-dive',
  offer: 'debt_validation_playbook',
  onboardingLane: 'debt_relief',
  metaTitle: 'Free debt validation guide',
  metaDesc: 'Download the collections validation playbook — FDCPA workflows, summons checklist, and portal preview.',
  urgencyText: 'FREE — Debt validation playbook + strategist session',
  heroHeadline: 'Take control of',
  heroHighlight: 'Collections',
  heroSub: 'without guesswork.',
  valueStack: [
    { label: 'Collections validation deep-dive PDF', value: '$59' },
    { label: 'Debt collector call script card', value: '$29' },
    { label: 'Summons response checklist', value: '$49' },
    { label: 'Interactive validation command center', value: '$79' },
    { label: '30-day FDCPA deadline tracker', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day debt lane portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: ShieldCheck, title: 'Validation vs verification', desc: 'Use the right statute for the right target — FDCPA vs FCRA.' },
    { icon: FileSignature, title: 'Written validation requests', desc: 'Templates and timing for debt collector responses.' },
    { icon: Target, title: 'Summons checklist', desc: 'What to do first if you received court papers.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'Track debt tasks and documents in Finely Cred.' },
  ],
  trustCerts: ['Educational only', 'Not legal advice', 'Secure PDF', 'Document vault ready'],
  bookingPath: '/enlightenment-session',
};

export const BUSINESS_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'business',
  path: '/free-business-guide',
  funnelId: 'business_credit',
  sequenceId: 'seq_business_funnel',
  agentPersonaId: 'funding_strategist',
  agentDisplayName: 'Morgan',
  agentRole: 'Business Credit & Funding Strategist',
  guideId: 'business-credit-jumpstart',
  offer: 'business_credit_jumpstart',
  onboardingLane: 'business_credit',
  metaTitle: 'Free business credit guide',
  metaDesc: 'Entity hygiene, vendor credit sequencing, and D-U-N-S checklist — plus funding advisor session.',
  urgencyText: 'FREE — Business credit jumpstart kit + advisor call',
  heroHeadline: 'Build',
  heroHighlight: 'Business Credit',
  heroSub: 'that funders respect.',
  valueStack: [
    { label: 'Business credit jumpstart PDF', value: '$59' },
    { label: 'Entity fundability checklist (interactive)', value: '$49' },
    { label: 'Fundability score estimator', value: '$39' },
    { label: 'Vendor sequencing map + tier planner', value: '$49' },
    { label: 'D-U-N-S + entity hygiene checklist', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day business lane preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: TrendingUp, title: 'Entity hygiene first', desc: 'Secretary of state, EIN, address consistency — before applications.' },
    { icon: Target, title: 'Vendor credit ladder', desc: 'Net-30 vendors that report and build depth.' },
    { icon: ShieldCheck, title: 'Inquiry discipline', desc: 'Sequence applications to protect personal and business files.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'Business credit workspace in Finely Cred.' },
  ],
  trustCerts: ['No credit repair hype', 'Underwriting-aware', 'Secure PDF', 'Funding education'],
  bookingPath: '/enlightenment-session',
};

export const TRADELINE_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'tradeline',
  path: '/free-tradeline-guide',
  funnelId: 'tradeline_insider',
  sequenceId: 'seq_tradeline_funnel',
  agentPersonaId: 'sales_closer',
  agentDisplayName: 'Riley',
  agentRole: 'Solutions Advisor',
  guideId: 'primary-tradeline-insider',
  offer: 'primary_tradeline_insider',
  onboardingLane: 'personal_restore',
  metaTitle: 'Free tradeline insider guide',
  metaDesc: 'Authorized user tradelines explained — timing, risk, and how they fit a broader restore plan.',
  urgencyText: 'FREE — Tradeline insider kit + advisor follow-up',
  heroHeadline: 'Understand',
  heroHighlight: 'Tradelines',
  heroSub: 'before you buy.',
  valueStack: [
    { label: 'Primary tradeline insider PDF', value: '$49' },
    { label: 'Inquiry budget calculator', value: '$39' },
    { label: 'Tradeline timing ladder', value: '$29' },
    { label: 'AU vs primary tradeline comparison', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: TrendingUp, title: 'Primary vs AU', desc: 'Know what actually reports and what underwriters see.' },
    { icon: ShieldCheck, title: 'Risk-aware framing', desc: 'No hype — education on fit, timing, and alternatives.' },
    { icon: Target, title: 'Inquiry discipline', desc: 'Sequence applications without unnecessary bureau hits.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'Track restore tasks in Finely Cred.' },
  ],
  trustCerts: ['Educational only', 'No outcome guarantees', 'Secure PDF', 'Compliance-first'],
  bookingPath: '/enlightenment-session',
};

export const SCORE_ROADMAP_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'score_roadmap',
  path: '/free-score-roadmap',
  funnelId: 'score_roadmap',
  sequenceId: 'seq_score_roadmap_funnel',
  agentPersonaId: 'finely_advisor',
  agentDisplayName: 'Morgan',
  agentRole: 'Credit Restoration Specialist',
  guideId: 'credit-dispute-letter-guide',
  offer: 'score_roadmap',
  onboardingLane: 'personal_restore',
  metaTitle: 'Boost Your Credit Score in 72 Hours — Free Guide',
  metaDesc:
    'Quick-win credit actions, profile optimization, and a practical 72-hour roadmap for stronger funding readiness.',
  urgencyText: 'FREE — 72-hour credit score boost guide + specialist follow-up',
  heroHeadline: 'Boost Your',
  heroHighlight: 'Credit Score',
  heroSub: 'in 72 hours.',
  valueStack: [
    { label: '5-step score recovery roadmap PDF', value: '$49' },
    { label: 'Interactive score gap planner', value: '$39' },
    { label: '5-step recovery worksheet (checkable)', value: '$29' },
    { label: 'Utilization + mix timing checklist', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: TrendingUp, title: '700+ sequencing', desc: 'Order matters — utilization first, then mix, then age.' },
    { icon: Target, title: 'Dispute priorities', desc: 'Which negatives move the needle vs noise.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'Track progress inside Finely Cred.' },
    { icon: ShieldCheck, title: 'Partner-first education', desc: 'No hype — realistic timelines and next steps.' },
  ],
  trustCerts: ['Educational only', 'Secure PDF', 'Partner portal preview', 'No outcome guarantees'],
  bookingPath: '/enlightenment-session',
};

export const AGENCY_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'agency',
  path: '/free-agency-guide',
  funnelId: 'agency_white_label',
  sequenceId: 'seq_agency_funnel',
  agentPersonaId: 'sales_closer',
  agentDisplayName: 'Riley',
  agentRole: 'Solutions Advisor',
  guideId: 'the-agency-guide',
  offer: 'agency_white_label_kit',
  onboardingLane: 'business_credit',
  metaTitle: 'Free agency & white-label guide',
  metaDesc: 'Scale a credit services agency with Finely Cred — partner OS, compliance workflows, and onboarding playbook.',
  urgencyText: 'FREE — Agency growth kit + solutions advisor call',
  heroHeadline: 'Scale your',
  heroHighlight: 'Agency',
  heroSub: 'with a partner-grade operating system.',
  valueStack: [
    { label: 'Agency white-label overview PDF', value: '$79' },
    { label: '30-day agency launch checklist', value: '$49' },
    { label: 'Partner onboarding playbook', value: '$49' },
    { label: 'Compliance-safe promo copy pack', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day agency lane preview`, value: '$99', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: LayoutDashboard, title: 'Partner OS preview', desc: 'See how agencies run restore + funding lanes in one hub.' },
    { icon: ShieldCheck, title: 'Compliance-first', desc: 'Educational positioning — no repair org hype.' },
    { icon: Target, title: 'Onboarding playbook', desc: 'First 30 days for new agency partners.' },
    { icon: TrendingUp, title: 'Revenue lanes', desc: 'DIY, DFY, tradelines, and funding paths.' },
  ],
  trustCerts: ['Partner terminology', 'No outcome guarantees', 'Secure PDF', 'Agency education'],
  bookingPath: '/enlightenment-session',
};

/** In-app Credit Specialist playbook capture (wired into guide landing). */
export const CREDIT_SPECIALIST_GUIDE_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'credit_specialist_guide',
  path: '/credit-specialist-guide',
  funnelId: 'credit_specialist_guide',
  sequenceId: 'seq_specialist_apply_funnel',
  agentPersonaId: 'lead_converter',
  agentDisplayName: 'Alex',
  agentRole: 'Partner Activation Specialist',
  guideId: 'ai-dispute-workflows',
  offer: 'credit_specialist_guide',
  onboardingLane: 'personal_restore',
  metaTitle: 'Free Credit Specialist playbook',
  metaDesc:
    'Personal + business credit, debt challenge insight, court education, and specialist opportunity — read the free in-app guide anytime; optional tips below.',
  urgencyText: 'Optional tips — e-guide & 2-sheet playbook are free to open without signup',
  heroHeadline: 'Master the',
  heroHighlight: 'Specialist Craft',
  heroSub: '— then bring partners with Finely.',
  valueStack: [
    { label: 'In-app Credit Specialist playbook (7 chapters)', value: '$79' },
    { label: 'Personal + business credit teaching lanes', value: '$49' },
    { label: 'Debt challenge & summons education (not legal advice)', value: '$49' },
    { label: 'Opportunity framing + specialist income path', value: '$39' },
    { label: 'Join hub: 3-lead gate + 30-day free leads', value: '$59' },
  ],
  features: [
    { icon: BookOpen, title: 'Built-in reader', desc: 'Open chapters from the preview — no PDF required.' },
    { icon: Target, title: 'Recruiting-ready', desc: 'Capture lands in Credit Specialists CRM with specialist nurture.' },
    { icon: ShieldCheck, title: 'Compliance-aware', desc: 'Results vary · not legal advice · not an employment offer.' },
    { icon: LayoutDashboard, title: 'Clear next step', desc: 'After the guide: pricing hub + guided join.' },
  ],
  trustCerts: ['Partner terminology', 'Educational only', 'Not an employment offer', 'No income guarantees'],
  bookingPath: '/credit-specialist/join',
};

/** @deprecated Prefer CREDIT_SPECIALIST_GUIDE_FUNNEL + /credit-specialist/join — kept for route compatibility. */
export const SPECIALIST_APPLY_FUNNEL: LeadMagnetFunnelConfig = {
  ...CREDIT_SPECIALIST_GUIDE_FUNNEL,
  id: 'specialist_apply',
  path: '/credit-specialist-apply',
  funnelId: 'specialist_apply',
  offer: 'credit_specialist_join',
  metaTitle: 'Join as a Credit Specialist',
  bookingPath: '/credit-specialist/join',
};

export const AFFILIATE_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'affiliate',
  path: '/affiliate-toolkit',
  funnelId: 'affiliate_toolkit',
  sequenceId: 'seq_affiliate_funnel',
  agentPersonaId: 'affiliate_specialist',
  agentDisplayName: 'Jamie',
  agentRole: 'Affiliate Success Specialist',
  guideId: 'combo-tradeline-ladder',
  offer: 'affiliate_toolkit',
  onboardingLane: 'personal_restore',
  metaTitle: 'Free affiliate toolkit',
  metaDesc: 'Referral links, QR kits, and compliant promo templates for Finely Cred partners.',
  urgencyText: 'FREE — Affiliate toolkit + success specialist',
  heroHeadline: 'Your',
  heroHighlight: 'Affiliate Toolkit',
  heroSub: '— refer partners, earn responsibly.',
  valueStack: [
    { label: 'Affiliate promo playbook PDF', value: '$49' },
    { label: 'Referral link + code generator', value: '$39' },
    { label: 'QR + link setup guide', value: '$29' },
    { label: 'Compliant social copy pack', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day referral dashboard preview`, value: '$59', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: Target, title: 'Referral mechanics', desc: 'How links, attribution, and payouts work.' },
    { icon: ShieldCheck, title: 'Compliant copy', desc: 'No hype, no guaranteed outcomes.' },
    { icon: TrendingUp, title: 'Growth lanes', desc: 'Match referrals to restore, debt, or funding funnels.' },
    { icon: LayoutDashboard, title: 'Dashboard preview', desc: 'See referral tracking inside Finely Cred.' },
  ],
  trustCerts: ['Partner referrals', 'No income guarantees', 'Secure PDF', 'Compliance-first'],
  bookingPath: '/enlightenment-session',
};

export const LEAD_MAGNET_FUNNELS = [
  CREDIT_FUNNEL,
  DEBT_FUNNEL,
  BUSINESS_FUNNEL,
  TRADELINE_FUNNEL,
  SCORE_ROADMAP_FUNNEL,
  AGENCY_FUNNEL,
  CREDIT_SPECIALIST_GUIDE_FUNNEL,
  SPECIALIST_APPLY_FUNNEL,
  AFFILIATE_FUNNEL,
] as const;

export function funnelByPath(path: string): LeadMagnetFunnelConfig {
  return LEAD_MAGNET_FUNNELS.find((f) => f.path === path) ?? CREDIT_FUNNEL;
}
