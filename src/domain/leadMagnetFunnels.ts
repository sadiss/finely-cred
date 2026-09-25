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
  metaTitle: 'Free dispute letter guide',
  metaDesc:
    'Download Finely Cred’s dispute letter guide and open Letter Studio, a task board, and a partner portal preview. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free dispute toolkit and a live portal preview — no card required',
  heroHeadline: 'Write the letter.',
  heroHighlight: 'Track the round.',
  heroSub: 'A sequenced dispute guide with live tools — not a PDF you never open again.',
  valueStack: [
    { label: 'Step-by-step dispute writing playbook', value: '$49' },
    { label: 'Bureau mailing kit + FCRA rights', value: '$49' },
    { label: 'Law-per-negative citation guide', value: '$39' },
    { label: '5-step score recovery roadmap', value: '$40' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day DIY portal + report upload`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
    { label: 'AI restoration checklist + video', value: '$41', trialFeature: 'ai_checklist', locksAfterTrial: true },
  ],
  features: [
    { icon: FileSignature, title: 'Step-by-step dispute writing', desc: 'A five-step playbook for bureau letters — evidence first, one tradeline per letter.' },
    { icon: Target, title: 'Law per negative', desc: 'Cite the right statute for charge-offs, inquiries, re-aging, and more.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day live portal trial`, desc: 'Upload a report, open Letter Studio, and preview the partner task board.' },
    { icon: TrendingUp, title: 'Five-step score roadmap', desc: 'Utilization, mix, and timing sequenced toward a 700+ file.' },
    { icon: ShieldCheck, title: 'Know your FCRA rights', desc: 'Plain-English rights that require bureaus to investigate or correct.' },
    { icon: Mail, title: 'Letter Stream and complaints', desc: 'A certified-mail workflow plus a CFPB and FTC escalation playbook.' },
    { icon: PlayCircle, title: 'AI checklist and video walkthrough', desc: 'See how restoration tracking works inside Finely Cred.' },
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
  metaDesc:
    'A written collections playbook: FDCPA validation, summons triage, and a live debt lane in the partner portal. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free validation playbook and a strategist session — no card required',
  heroHeadline: 'Answer collections with',
  heroHighlight: 'paperwork',
  heroSub: 'A written sequence you can run this week.',
  valueStack: [
    { label: 'Collections validation deep-dive PDF', value: '$59' },
    { label: 'Debt collector call script card', value: '$29' },
    { label: 'Summons response checklist', value: '$49' },
    { label: 'Interactive validation command center', value: '$79' },
    { label: '30-day FDCPA deadline tracker', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day debt lane portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: ShieldCheck, title: 'Validation first', desc: 'FDCPA-aware letters that ask for proof before you pay.' },
    { icon: FileSignature, title: 'Written validation requests', desc: 'Templates and timing for collector responses.' },
    { icon: Target, title: 'Summons checklist', desc: 'What to do first if court papers already arrived.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day debt lane portal`, desc: 'Track validation tasks, letters, and evidence in Finely Cred.' },
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
  metaDesc:
    'Entity hygiene, vendor credit sequencing, and a D-U-N-S checklist — plus a funding advisor session. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free business credit jumpstart and an advisor call',
  heroHeadline: 'Build',
  heroHighlight: 'business credit',
  heroSub: 'that funders can verify.',
  valueStack: [
    { label: 'Business credit jumpstart PDF', value: '$59' },
    { label: 'Entity fundability checklist (interactive)', value: '$49' },
    { label: 'Fundability score estimator', value: '$39' },
    { label: 'Vendor sequencing map + tier planner', value: '$49' },
    { label: 'D-U-N-S + entity hygiene checklist', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day business lane preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: TrendingUp, title: 'Entity hygiene first', desc: 'Secretary of state, EIN, and address consistency — before the first application.' },
    { icon: Target, title: 'Vendor credit ladder', desc: 'Net-30 vendors that report and build depth.' },
    { icon: ShieldCheck, title: 'Inquiry discipline', desc: 'Sequence applications to protect the personal file and the business file.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'A business credit workspace inside Finely Cred.' },
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
  metaDesc:
    'Authorized-user tradelines explained: timing, risk, and how they fit a broader restore plan. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free tradeline insider kit and advisor follow-up',
  heroHeadline: 'Understand',
  heroHighlight: 'tradelines',
  heroSub: 'before you spend a dollar.',
  valueStack: [
    { label: 'Primary tradeline insider PDF', value: '$49' },
    { label: 'Inquiry budget calculator', value: '$39' },
    { label: 'Tradeline timing ladder', value: '$29' },
    { label: 'AU vs primary tradeline comparison', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: TrendingUp, title: 'Primary versus authorized user', desc: 'Know what actually reports and what underwriters see.' },
    { icon: ShieldCheck, title: 'Risk-aware framing', desc: 'Education on fit, timing, and alternatives — no score promises.' },
    { icon: Target, title: 'Inquiry discipline', desc: 'Sequence applications without unnecessary bureau hits.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'Track restore tasks inside Finely Cred.' },
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
  guideId: 'score-boost-72-roadmap',
  offer: 'score_roadmap',
  onboardingLane: 'personal_restore',
  metaTitle: '72-hour credit score roadmap — free guide',
  metaDesc:
    'A sequenced 72-hour credit roadmap: utilization first, high-impact negatives next, then mix and inquiry discipline. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free 72-hour credit sequence and specialist follow-up',
  heroHeadline: 'Sequence your',
  heroHighlight: 'credit file',
  heroSub: 'in the first 72 hours.',
  valueStack: [
    { label: '5-step score recovery roadmap PDF', value: '$49' },
    { label: 'Interactive score gap planner', value: '$39' },
    { label: '5-step recovery worksheet (checkable)', value: '$29' },
    { label: 'Utilization + mix timing checklist', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: TrendingUp, title: '700+ sequencing', desc: 'Order matters: utilization first, then mix, then age.' },
    { icon: Target, title: 'Dispute priorities', desc: 'Which negatives can move a score — and which are noise.' },
    { icon: LayoutDashboard, title: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview`, desc: 'Track progress inside Finely Cred.' },
    { icon: ShieldCheck, title: 'Partner-first education', desc: 'Realistic timelines and next steps — no score promises.' },
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
  metaTitle: 'Free agency and white-label guide',
  metaDesc:
    'Scale a credit services agency with Finely Cred: a partner operating system, compliance workflows, and a thirty-day onboarding playbook. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free agency growth kit and a solutions advisor call',
  heroHeadline: 'Scale your',
  heroHighlight: 'agency',
  heroSub: 'with a partner-grade operating system.',
  valueStack: [
    { label: 'Agency white-label overview PDF', value: '$79' },
    { label: '30-day agency launch checklist', value: '$49' },
    { label: 'Partner onboarding playbook', value: '$49' },
    { label: 'Compliance-safe promo copy pack', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day agency lane preview`, value: '$99', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: LayoutDashboard, title: 'Partner operating-system preview', desc: 'See how agencies run restore and funding lanes in one hub.' },
    { icon: ShieldCheck, title: 'Compliance first', desc: 'Educational positioning — no repair-shop hype.' },
    { icon: Target, title: 'Onboarding playbook', desc: 'The first thirty days for new agency partners.' },
    { icon: TrendingUp, title: 'Revenue lanes', desc: 'Do-it-yourself, done-for-you, tradelines, and funding paths.' },
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
    'A free in-app playbook for Credit Specialists: personal and business credit, debt education, and a clear join path. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Open the e-guide anytime — optional tips after you leave your details',
  heroHeadline: 'Master the',
  heroHighlight: 'specialist craft',
  heroSub: 'Then bring partners with Finely when you are ready.',
  valueStack: [
    { label: 'In-app Credit Specialist playbook (13 pages)', value: '$79' },
    { label: 'Personal + business credit teaching lanes', value: '$49' },
    { label: 'Debt challenge & summons education (not legal advice)', value: '$49' },
    { label: 'Opportunity framing + specialist income path', value: '$39' },
    { label: 'Join hub: 3-lead gate + 30-day free leads', value: '$59' },
  ],
  features: [
    { icon: BookOpen, title: 'Built-in reader', desc: 'Open chapters from the preview — no PDF required.' },
    { icon: Target, title: 'Recruiting-ready', desc: 'Your capture lands in the Credit Specialists CRM with specialist nurture.' },
    { icon: ShieldCheck, title: 'Compliance-aware', desc: 'Results vary · not legal advice · funding subject to underwriting' },
    { icon: LayoutDashboard, title: 'Clear next step', desc: 'After the guide: the pricing hub and a guided join.' },
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
  guideId: 'affiliate-referral-toolkit',
  offer: 'affiliate_toolkit',
  onboardingLane: 'affiliate',
  metaTitle: 'Free affiliate toolkit',
  metaDesc:
    'Referral links, QR kits, and compliant promo templates for Finely Cred partners. Results vary · not legal advice · funding subject to underwriting.',
  urgencyText: 'Free affiliate toolkit and a success specialist',
  heroHeadline: 'Your',
  heroHighlight: 'affiliate toolkit',
  heroSub: 'Refer partners and earn inside the rules.',
  valueStack: [
    { label: 'Affiliate promo playbook PDF', value: '$49' },
    { label: 'Referral link + code generator', value: '$39' },
    { label: 'QR + link setup guide', value: '$29' },
    { label: 'Compliant social copy pack', value: '$39' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day referral dashboard preview`, value: '$59', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: Target, title: 'Referral mechanics', desc: 'How links, attribution, and payouts work.' },
    { icon: ShieldCheck, title: 'Compliant copy', desc: 'No income promises and no guaranteed outcomes.' },
    { icon: TrendingUp, title: 'Growth lanes', desc: 'Match referrals to restore, debt, or funding funnels.' },
    { icon: LayoutDashboard, title: 'Dashboard preview', desc: 'See referral tracking inside Finely Cred.' },
  ],
  trustCerts: ['Partner referrals', 'No income guarantees', 'Secure PDF', 'Compliance-first'],
  bookingPath: '/enlightenment-session',
};

export const KREYOL_FUNNEL: LeadMagnetFunnelConfig = {
  id: 'kreyol',
  path: '/free-kreyol-guide',
  funnelId: 'kreyol_companion',
  sequenceId: 'seq_kreyol_funnel',
  agentPersonaId: 'haitian_companion',
  agentDisplayName: 'Marie-Claire',
  agentRole: 'Haitian Community Guide',
  guideId: 'kreyol-companion-kit',
  offer: 'haitian_credit_kit',
  onboardingLane: 'haitian',
  metaTitle: 'Credit kits — Haitian community',
  metaDesc:
    'Credit kits for Haitian Americans: what credit is, what the letter says, how to help family, and a church flyer. Pale Kreyòl when you are ready. Results vary · not legal advice.',
  urgencyText: 'Kat kit kredi, san peye, ak Pale Kreyòl lè w pare',
  heroHeadline: 'Credit kits for',
  heroHighlight: 'Haitian community',
  heroSub: 'Nou li kredi, lèt, ak feyè legliz ansanm — klè, pou fanmi ak espesyalis.',
  valueStack: [
    { label: 'What is credit? — a clear one-page kit', value: '$29' },
    { label: 'What this letter says — annotated collector language', value: '$39' },
    { label: 'For the person helping — family and specialist kit', value: '$29' },
    { label: 'Church and community flyer with QR', value: '$19' },
    { label: `${LEAD_MAGNET_TRIAL_DAYS}-day partner portal preview`, value: '$79', trialFeature: 'report_upload_preview', locksAfterTrial: true },
  ],
  features: [
    { icon: BookOpen, title: 'Kreyòl first', desc: 'Kat feyè nan Kreyòl Ayisyen, ekri jan moun pale l. Chak youn gen yon travay: kredi, lèt, èd, oswa feyè.' },
    { icon: FileSignature, title: 'Lèt anote', desc: 'Chak fraz sou lèt la gen sans Kreyòl li, ak mo pou aprann.' },
    { icon: ShieldCheck, title: 'Pou moun k ap ede', desc: 'Espesyalis ak fanmi rete bò kote yon moun — yon sèl pwochen etap.' },
    { icon: Target, title: 'QR legliz / kominote', desc: 'Feyè senp. Skan. Pale Kreyòl. Pa gen pwomès nòt.' },
  ],
  trustCerts: ['Haitian community', 'Credit kits', 'No score promises', 'Educational only'],
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
  KREYOL_FUNNEL,
] as const;

export function funnelByPath(path: string): LeadMagnetFunnelConfig {
  return LEAD_MAGNET_FUNNELS.find((f) => f.path === path) ?? CREDIT_FUNNEL;
}
