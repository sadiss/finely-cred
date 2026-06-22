import { allPackages, type PricingCategory } from '../../../config/pricingCatalog';
import type { TaskPlaybook } from '../../../domain/taskPlaybooks';
import type { TaskKind, TaskStage } from '../../../domain/tasks';

type SeedSpec = {
  slug: string;
  title: string;
  kind: TaskKind;
  stage: TaskStage;
  dueDaysOffset?: number;
  priority?: TaskPlaybook['priority'];
  delivery?: TaskPlaybook['delivery'];
  checklist?: string[];
  partnerInstructions?: string;
  adminInstructions?: string;
  assignedTo?: 'partner' | 'admin';
  visibility?: TaskPlaybook['visibility'];
  dependsOnSlug?: string;
  tags?: string[];
};

const CORE_PLAYBOOKS: SeedSpec[] = [
  { slug: 'welcome_intake', title: 'Complete intake profile + goals', kind: 'general', stage: 'intake', dueDaysOffset: 0, assignedTo: 'partner' },
  { slug: 'consent_docs', title: 'Sign service agreement + consent forms', kind: 'upload_document', stage: 'intake', dueDaysOffset: 0, assignedTo: 'partner', dependsOnSlug: 'welcome_intake' },
  { slug: 'upload_reports', title: 'Upload latest credit reports (all bureaus)', kind: 'upload_document', stage: 'reports', dueDaysOffset: 1, assignedTo: 'partner', dependsOnSlug: 'consent_docs' },
  { slug: 'parse_reports', title: 'Parse reports + baseline score snapshot', kind: 'review_results', stage: 'reports', dueDaysOffset: 1, assignedTo: 'admin', visibility: 'admin', dependsOnSlug: 'upload_reports' },
  { slug: 'upload_id_poa', title: 'Upload ID + proof of address to vault', kind: 'upload_document', stage: 'evidence', dueDaysOffset: 2, assignedTo: 'partner', dependsOnSlug: 'parse_reports' },
  { slug: 'evidence_checklist', title: 'Build evidence checklist per tradeline', kind: 'review_results', stage: 'evidence', dueDaysOffset: 2, assignedTo: 'admin', visibility: 'hybrid', dependsOnSlug: 'upload_id_poa' },
  { slug: 'dispute_candidates', title: 'Review dispute candidates in Insights', kind: 'review_results', stage: 'disputes', dueDaysOffset: 3, assignedTo: 'partner', dependsOnSlug: 'evidence_checklist' },
  { slug: 'draft_letters', title: 'Generate dispute letters + exhibits', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 4, priority: 'high', assignedTo: 'partner', dependsOnSlug: 'dispute_candidates' },
  { slug: 'mail_certified', title: 'Mail certified + log tracking numbers', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 5, priority: 'high', assignedTo: 'partner', dependsOnSlug: 'draft_letters' },
  { slug: 'bureau_followup', title: 'Follow up on 30–45 day reinvestigation window', kind: 'follow_up', stage: 'disputes', dueDaysOffset: 35, assignedTo: 'admin', visibility: 'hybrid', dependsOnSlug: 'mail_certified' },
  { slug: 'collect_responses', title: 'Upload bureau responses when received', kind: 'upload_document', stage: 'evidence', dueDaysOffset: 14, assignedTo: 'partner', dependsOnSlug: 'mail_certified' },
  { slug: 'debt_inventory', title: 'Inventory debts + validate balances', kind: 'review_results', stage: 'debt', dueDaysOffset: 3, assignedTo: 'admin', visibility: 'hybrid' },
  { slug: 'identity_theft_review', title: 'Review identity theft / mixed-file flags', kind: 'review_results', stage: 'identity', dueDaysOffset: 4, assignedTo: 'admin', visibility: 'hybrid' },
  { slug: 'funding_readiness', title: 'Funding readiness score + next actions', kind: 'review_results', stage: 'funding', dueDaysOffset: 7, assignedTo: 'admin', visibility: 'hybrid', dependsOnSlug: 'bureau_followup' },
  { slug: 'monthly_checkin', title: 'Monthly progress check-in call', kind: 'follow_up', stage: 'complete', dueDaysOffset: 30, assignedTo: 'admin', visibility: 'hybrid' },
];

const CATEGORY_PLAYBOOKS: Record<PricingCategory, SeedSpec[]> = {
  personal_credit: [
    { slug: 'personal_azeo', title: 'Run AZEO / utilization optimization plan', kind: 'review_results', stage: 'funding', dueDaysOffset: 5 },
    { slug: 'personal_inquiry_cleanup', title: 'Review unauthorized hard inquiries', kind: 'review_results', stage: 'disputes', dueDaysOffset: 3 },
    { slug: 'personal_tradeline_review', title: 'Audit tradeline age + limits mix', kind: 'review_results', stage: 'reports', dueDaysOffset: 2 },
    { slug: 'personal_paydown', title: 'Pay down high-utilization cards before statement close', kind: 'follow_up', stage: 'funding', dueDaysOffset: 7 },
    { slug: 'personal_authorized_user', title: 'Evaluate authorized user / AU strategy fit', kind: 'general', stage: 'funding', dueDaysOffset: 10 },
    { slug: 'personal_secured_path', title: 'Set up secured card path if thin file', kind: 'general', stage: 'funding', dueDaysOffset: 14 },
    { slug: 'personal_score_goal', title: 'Set target score + milestone dates', kind: 'general', stage: 'intake', dueDaysOffset: 0 },
    { slug: 'personal_bureau_sync', title: 'Confirm all three bureau reports uploaded', kind: 'upload_document', stage: 'reports', dueDaysOffset: 1 },
    { slug: 'personal_dispute_round2', title: 'Prepare round-2 disputes for unresolved items', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 45, priority: 'high' },
    { slug: 'personal_goodwill', title: 'Draft goodwill letters for late pays (if eligible)', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 10 },
    { slug: 'personal_student_loan', title: 'Student loan dispute / rehab review', kind: 'review_results', stage: 'disputes', dueDaysOffset: 5 },
    { slug: 'personal_medical_debt', title: 'Medical collections validation review', kind: 'review_results', stage: 'debt', dueDaysOffset: 5 },
    { slug: 'personal_bankruptcy', title: 'Post-bankruptcy credit rebuild plan', kind: 'general', stage: 'funding', dueDaysOffset: 7 },
    { slug: 'personal_chexsystems', title: 'ChexSystems / EWS cleanup follow-up', kind: 'follow_up', stage: 'identity', dueDaysOffset: 14 },
    { slug: 'personal_maintenance', title: 'Maintenance mode: monitor + protect score', kind: 'follow_up', stage: 'complete', dueDaysOffset: 30 },
    { slug: 'personal_letters_pack', title: 'Apply specialty letter pack templates', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 4, priority: 'high' },
    { slug: 'personal_course_diy', title: 'Complete assigned DIY course module', kind: 'general', stage: 'intake', dueDaysOffset: 3, delivery: 'DIY' },
    { slug: 'personal_dfy_qc', title: 'DFY quality check before customer send', kind: 'review_results', stage: 'disputes', dueDaysOffset: 4, delivery: 'DFY', assignedTo: 'admin', visibility: 'admin' },
    { slug: 'personal_hybrid_review', title: 'Hybrid check-in: customer vs ops split', kind: 'follow_up', stage: 'disputes', dueDaysOffset: 7, delivery: 'HYBRID' },
    { slug: 'personal_funding_apply', title: 'Pre-qualify for target funding products', kind: 'review_results', stage: 'funding', dueDaysOffset: 21 },
  ],
  business_credit: [
    { slug: 'biz_ein_verify', title: 'Verify EIN + entity documents', kind: 'upload_document', stage: 'intake', dueDaysOffset: 1 },
    { slug: 'biz_duns', title: 'Establish / update DUNS profile', kind: 'general', stage: 'intake', dueDaysOffset: 3 },
    { slug: 'biz_nexus', title: 'Confirm business address + nexus compliance', kind: 'review_results', stage: 'intake', dueDaysOffset: 2 },
    { slug: 'biz_bank_account', title: 'Open / verify business bank account', kind: 'general', stage: 'funding', dueDaysOffset: 7 },
    { slug: 'biz_vendor_net30', title: 'Apply to starter net-30 vendor accounts', kind: 'general', stage: 'funding', dueDaysOffset: 14 },
    { slug: 'biz_fundability_audit', title: 'Run fundability audit checklist', kind: 'review_results', stage: 'reports', dueDaysOffset: 2 },
    { slug: 'biz_ucc_review', title: 'Review UCC filings on business reports', kind: 'review_results', stage: 'reports', dueDaysOffset: 3 },
    { slug: 'biz_secrets', title: 'Secure business credit monitoring login', kind: 'upload_document', stage: 'reports', dueDaysOffset: 1 },
    { slug: 'biz_tier1_vendors', title: 'Complete tier-1 vendor application batch', kind: 'follow_up', stage: 'funding', dueDaysOffset: 21 },
    { slug: 'biz_tier2_vendors', title: 'Complete tier-2 vendor application batch', kind: 'follow_up', stage: 'funding', dueDaysOffset: 35 },
    { slug: 'biz_pg_strategy', title: 'Personal guarantee strategy review', kind: 'review_results', stage: 'funding', dueDaysOffset: 10 },
    { slug: 'biz_website', title: 'Business website + email domain verification', kind: 'general', stage: 'intake', dueDaysOffset: 5 },
    { slug: 'biz_sos', title: 'Secretary of state good standing check', kind: 'upload_document', stage: 'intake', dueDaysOffset: 2 },
    { slug: 'biz_merchant', title: 'Merchant services / processing readiness', kind: 'review_results', stage: 'funding', dueDaysOffset: 28 },
    { slug: 'biz_line_of_credit', title: 'Business LOC pre-qualification review', kind: 'review_results', stage: 'funding', dueDaysOffset: 45 },
    { slug: 'biz_sprint_kickoff', title: 'Fundability sprint kickoff call', kind: 'follow_up', stage: 'intake', dueDaysOffset: 0, delivery: 'DFY' },
    { slug: 'biz_diy_module', title: 'Complete business credit DIY module', kind: 'general', stage: 'intake', dueDaysOffset: 3, delivery: 'DIY' },
    { slug: 'biz_hybrid_ops', title: 'Ops prepares vendor list for customer approval', kind: 'review_results', stage: 'funding', dueDaysOffset: 7, delivery: 'HYBRID' },
    { slug: 'biz_compliance', title: 'Compliance docs for lender package', kind: 'upload_document', stage: 'evidence', dueDaysOffset: 10 },
    { slug: 'biz_maintenance', title: 'Quarterly business credit maintenance review', kind: 'follow_up', stage: 'complete', dueDaysOffset: 90 },
  ],
  debt_legal: [
    { slug: 'debt_validation', title: 'Send debt validation requests', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 3, priority: 'high' },
    { slug: 'debt_cease', title: 'Cease & desist where harassment present', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 2, priority: 'urgent' },
    { slug: 'debt_statute', title: 'Statute of limitations analysis', kind: 'review_results', stage: 'debt', dueDaysOffset: 2 },
    { slug: 'debt_settlement_offer', title: 'Draft settlement offer letters', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 7 },
    { slug: 'debt_payment_plan', title: 'Negotiate payment plan with collector', kind: 'follow_up', stage: 'debt', dueDaysOffset: 10 },
    { slug: 'debt_pay_for_delete', title: 'Pay-for-delete negotiation track', kind: 'follow_up', stage: 'debt', dueDaysOffset: 14 },
    { slug: 'debt_judgment', title: 'Review judgments + garnishment risk', kind: 'review_results', stage: 'debt', dueDaysOffset: 3 },
    { slug: 'debt_bankruptcy_eval', title: 'Evaluate bankruptcy vs settlement path', kind: 'review_results', stage: 'debt', dueDaysOffset: 5 },
    { slug: 'debt_1099c', title: 'Review 1099-C tax implications', kind: 'review_results', stage: 'debt', dueDaysOffset: 7 },
    { slug: 'debt_creditor_call', title: 'Log creditor call outcomes', kind: 'follow_up', stage: 'debt', dueDaysOffset: 1 },
    { slug: 'debt_legal_review', title: 'Attorney review for high-balance accounts', kind: 'review_results', stage: 'debt', dueDaysOffset: 5, delivery: 'DFY' },
    { slug: 'debt_diy_worksheet', title: 'Complete debt DIY negotiation worksheet', kind: 'general', stage: 'debt', dueDaysOffset: 2, delivery: 'DIY' },
    { slug: 'debt_institutional', title: 'Institutional debt portfolio triage', kind: 'review_results', stage: 'debt', dueDaysOffset: 1, delivery: 'DFY' },
    { slug: 'debt_enterprise', title: 'Enterprise debt program onboarding', kind: 'general', stage: 'intake', dueDaysOffset: 0, delivery: 'DFY' },
    { slug: 'debt_followup_30', title: '30-day debt program progress review', kind: 'follow_up', stage: 'debt', dueDaysOffset: 30 },
    { slug: 'debt_followup_60', title: '60-day settlement status review', kind: 'follow_up', stage: 'debt', dueDaysOffset: 60 },
    { slug: 'debt_cfpb', title: 'CFPB complaint escalation (if needed)', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 21 },
    { slug: 'debt_credit_impact', title: 'Measure credit impact after settlements', kind: 'review_results', stage: 'reports', dueDaysOffset: 45 },
    { slug: 'debt_closure_letters', title: 'Request paid-in-full / deletion confirmation', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 50 },
    { slug: 'debt_program_complete', title: 'Debt program completion summary', kind: 'general', stage: 'complete', dueDaysOffset: 90 },
  ],
  wealth_builder: [
    { slug: 'wealth_goals', title: 'Define wealth + credit goals worksheet', kind: 'general', stage: 'intake', dueDaysOffset: 0 },
    { slug: 'wealth_budget', title: 'Cash flow + budget baseline', kind: 'review_results', stage: 'intake', dueDaysOffset: 2 },
    { slug: 'wealth_emergency', title: 'Emergency fund milestone plan', kind: 'general', stage: 'funding', dueDaysOffset: 7 },
    { slug: 'wealth_invest_basics', title: 'Investment readiness education module', kind: 'general', stage: 'funding', dueDaysOffset: 14, delivery: 'DIY' },
    { slug: 'wealth_credit_stack', title: 'Credit stack strategy for wealth lane', kind: 'review_results', stage: 'funding', dueDaysOffset: 10 },
    { slug: 'wealth_business_entity', title: 'Entity structure for wealth building', kind: 'general', stage: 'funding', dueDaysOffset: 21 },
    { slug: 'wealth_real_estate', title: 'Real estate readiness credit review', kind: 'review_results', stage: 'funding', dueDaysOffset: 30 },
    { slug: 'wealth_tax_plan', title: 'Coordinate with tax advisor checklist', kind: 'follow_up', stage: 'funding', dueDaysOffset: 14 },
    { slug: 'wealth_insurance', title: 'Insurance + asset protection review', kind: 'general', stage: 'funding', dueDaysOffset: 21 },
    { slug: 'wealth_quarterly', title: 'Quarterly wealth progress review', kind: 'follow_up', stage: 'complete', dueDaysOffset: 90 },
    { slug: 'wealth_dfy_plan', title: 'DFY wealth plan draft + customer review', kind: 'review_results', stage: 'intake', dueDaysOffset: 5, delivery: 'DFY' },
    { slug: 'wealth_hybrid_call', title: 'Hybrid coaching call — action items', kind: 'follow_up', stage: 'funding', dueDaysOffset: 7, delivery: 'HYBRID' },
    { slug: 'wealth_trust', title: 'Trust / estate coordination (referral)', kind: 'general', stage: 'funding', dueDaysOffset: 45 },
    { slug: 'wealth_passive', title: 'Passive income lane assessment', kind: 'review_results', stage: 'funding', dueDaysOffset: 28 },
    { slug: 'wealth_debt_free', title: 'Debt-free milestone celebration + next phase', kind: 'general', stage: 'complete', dueDaysOffset: 60 },
    { slug: 'wealth_credit_monitor', title: 'Set up premium credit monitoring', kind: 'general', stage: 'reports', dueDaysOffset: 1 },
    { slug: 'wealth_funding_stack', title: 'Stack funding products for growth', kind: 'review_results', stage: 'funding', dueDaysOffset: 35 },
    { slug: 'wealth_partner_intro', title: 'Intro to wealth builder partner network', kind: 'follow_up', stage: 'intake', dueDaysOffset: 3 },
    { slug: 'wealth_risk', title: 'Risk tolerance + leverage review', kind: 'review_results', stage: 'funding', dueDaysOffset: 10 },
    { slug: 'wealth_graduation', title: 'Graduate to maintenance tier', kind: 'general', stage: 'complete', dueDaysOffset: 120 },
  ],
  privacy_id: [
    { slug: 'privacy_scan', title: 'Run data-broker exposure scan', kind: 'review_results', stage: 'identity', dueDaysOffset: 1 },
    { slug: 'privacy_optout', title: 'Submit opt-out requests (batch 1)', kind: 'mail_letter', stage: 'identity', dueDaysOffset: 3 },
    { slug: 'privacy_optout2', title: 'Submit opt-out requests (batch 2)', kind: 'mail_letter', stage: 'identity', dueDaysOffset: 10 },
    { slug: 'privacy_freeze', title: 'Place / verify credit freezes', kind: 'general', stage: 'identity', dueDaysOffset: 2 },
    { slug: 'privacy_fraud_alert', title: 'Extended fraud alert setup (if needed)', kind: 'general', stage: 'identity', dueDaysOffset: 2 },
    { slug: 'privacy_ssn', title: 'SSN misuse / mixed file review', kind: 'review_results', stage: 'identity', dueDaysOffset: 3 },
    { slug: 'privacy_irs', title: 'IRS IP PIN enrollment', kind: 'general', stage: 'identity', dueDaysOffset: 5 },
    { slug: 'privacy_dmv', title: 'DMV / passport fraud check', kind: 'review_results', stage: 'identity', dueDaysOffset: 7 },
    { slug: 'privacy_dark_web', title: 'Dark web monitoring setup', kind: 'general', stage: 'identity', dueDaysOffset: 1 },
    { slug: 'privacy_password', title: 'Password manager + 2FA audit', kind: 'general', stage: 'identity', dueDaysOffset: 1 },
    { slug: 'privacy_mail', title: 'Secure mail / virtual address setup', kind: 'general', stage: 'identity', dueDaysOffset: 5 },
    { slug: 'privacy_phone', title: 'Phone number privacy swap', kind: 'general', stage: 'identity', dueDaysOffset: 3 },
    { slug: 'privacy_pro_review', title: 'Pro tier privacy audit report', kind: 'review_results', stage: 'identity', dueDaysOffset: 7, delivery: 'DFY' },
    { slug: 'privacy_diy_guide', title: 'Complete privacy DIY guide modules', kind: 'general', stage: 'identity', dueDaysOffset: 2, delivery: 'DIY' },
    { slug: 'privacy_followup_30', title: '30-day opt-out confirmation sweep', kind: 'follow_up', stage: 'identity', dueDaysOffset: 30 },
    { slug: 'privacy_followup_90', title: '90-day re-scan + maintenance', kind: 'follow_up', stage: 'identity', dueDaysOffset: 90 },
    { slug: 'privacy_ftc', title: 'FTC identity theft report (if applicable)', kind: 'upload_document', stage: 'identity', dueDaysOffset: 2 },
    { slug: 'privacy_police', title: 'Police report for identity theft (if needed)', kind: 'upload_document', stage: 'identity', dueDaysOffset: 3 },
    { slug: 'privacy_bureau_block', title: 'Block fraudulent tradelines with bureaus', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 5, priority: 'high' },
    { slug: 'privacy_complete', title: 'Privacy program completion checklist', kind: 'general', stage: 'complete', dueDaysOffset: 60 },
  ],
  bundle: [
    { slug: 'bundle_kickoff', title: 'Bundle kickoff — map all service lanes', kind: 'general', stage: 'intake', dueDaysOffset: 0 },
    { slug: 'bundle_restore_track', title: 'Personal restore track — start tasks', kind: 'general', stage: 'reports', dueDaysOffset: 1 },
    { slug: 'bundle_debt_track', title: 'Debt track — parallel onboarding', kind: 'general', stage: 'debt', dueDaysOffset: 2 },
    { slug: 'bundle_business_track', title: 'Business track — entity setup', kind: 'general', stage: 'intake', dueDaysOffset: 3 },
    { slug: 'bundle_coordination', title: 'Cross-lane coordination call', kind: 'follow_up', stage: 'intake', dueDaysOffset: 5, delivery: 'DFY' },
    { slug: 'bundle_milestone_30', title: '30-day bundle milestone review', kind: 'follow_up', stage: 'funding', dueDaysOffset: 30 },
    { slug: 'bundle_milestone_60', title: '60-day bundle progress review', kind: 'follow_up', stage: 'funding', dueDaysOffset: 60 },
    { slug: 'bundle_milestone_90', title: '90-day transformation review', kind: 'follow_up', stage: 'complete', dueDaysOffset: 90 },
    { slug: 'bundle_upsell', title: 'Identify upsell / maintenance tier fit', kind: 'review_results', stage: 'complete', dueDaysOffset: 95 },
    { slug: 'bundle_docs', title: 'Consolidated document vault audit', kind: 'upload_document', stage: 'evidence', dueDaysOffset: 4 },
    { slug: 'bundle_funding', title: 'Combined funding readiness score', kind: 'review_results', stage: 'funding', dueDaysOffset: 45 },
    { slug: 'bundle_letters', title: 'Bundle letter packs — assign by lane', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 5 },
    { slug: 'bundle_sla', title: 'DFY SLA check — all lanes on track', kind: 'review_results', stage: 'reports', dueDaysOffset: 7, delivery: 'DFY', visibility: 'admin' },
    { slug: 'bundle_client_summary', title: 'Customer-facing bundle progress summary', kind: 'general', stage: 'funding', dueDaysOffset: 14, visibility: 'hybrid' },
    { slug: 'bundle_graduation', title: 'Bundle graduation + maintenance handoff', kind: 'general', stage: 'complete', dueDaysOffset: 120 },
    { slug: 'bundle_transformation', title: 'Total transformation week-1 intensive', kind: 'follow_up', stage: 'intake', dueDaysOffset: 0, delivery: 'DFY' },
    { slug: 'bundle_accelerator', title: 'Funding accelerator — priority queue', kind: 'review_results', stage: 'funding', dueDaysOffset: 7, delivery: 'DFY' },
    { slug: 'bundle_empire', title: 'Empire builder — multi-entity map', kind: 'review_results', stage: 'funding', dueDaysOffset: 10, delivery: 'DFY' },
    { slug: 'bundle_diy_pace', title: 'DIY bundle pace planner', kind: 'general', stage: 'intake', dueDaysOffset: 1, delivery: 'DIY' },
    { slug: 'bundle_hybrid_sync', title: 'Hybrid sync — ops + customer lanes', kind: 'follow_up', stage: 'reports', dueDaysOffset: 7, delivery: 'HYBRID' },
  ],
  tradeline_promo: [
    { slug: 'tradeline_eligibility', title: 'AU tradeline eligibility review', kind: 'review_results', stage: 'funding', dueDaysOffset: 1 },
    { slug: 'tradeline_match', title: 'Match inventory to customer profile', kind: 'review_results', stage: 'funding', dueDaysOffset: 2 },
    { slug: 'tradeline_apply', title: 'Complete tradeline application window', kind: 'general', stage: 'funding', dueDaysOffset: 3 },
    { slug: 'tradeline_post', title: 'Verify tradeline posts to report', kind: 'review_results', stage: 'reports', dueDaysOffset: 45 },
    { slug: 'tradeline_removal', title: 'Plan AU removal before funding apps', kind: 'follow_up', stage: 'funding', dueDaysOffset: 60 },
    { slug: 'tradeline_starter', title: 'Starter pack — 1 AU onboarding', kind: 'general', stage: 'funding', dueDaysOffset: 1 },
    { slug: 'tradeline_boost', title: 'Boost pack — multi-AU sequencing', kind: 'general', stage: 'funding', dueDaysOffset: 2 },
    { slug: 'tradeline_max', title: 'Max pack — full sequencing + monitoring', kind: 'general', stage: 'funding', dueDaysOffset: 3 },
    { slug: 'tradeline_education', title: 'AU education + compliance briefing', kind: 'general', stage: 'intake', dueDaysOffset: 0 },
    { slug: 'tradeline_funding_timing', title: 'Time funding apps after AU seasoning', kind: 'review_results', stage: 'funding', dueDaysOffset: 75 },
    { slug: 'tradeline_monitor', title: 'Monitor AU impact on utilization', kind: 'follow_up', stage: 'reports', dueDaysOffset: 30 },
    { slug: 'tradeline_dispute', title: 'Dispute unauthorized AU if misreported', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 10 },
    { slug: 'tradeline_client_ack', title: 'Customer acknowledges AU terms', kind: 'upload_document', stage: 'intake', dueDaysOffset: 0 },
    { slug: 'tradeline_inventory', title: 'Refresh tradeline inventory match', kind: 'review_results', stage: 'funding', dueDaysOffset: 5 },
    { slug: 'tradeline_complete', title: 'Tradeline promo program wrap-up', kind: 'general', stage: 'complete', dueDaysOffset: 90 },
    { slug: 'tradeline_score_delta', title: 'Measure score delta from AU program', kind: 'review_results', stage: 'reports', dueDaysOffset: 50 },
    { slug: 'tradeline_renew', title: 'Renew / extend AU if needed', kind: 'follow_up', stage: 'funding', dueDaysOffset: 80 },
    { slug: 'tradeline_risk', title: 'Risk review before next AU cycle', kind: 'review_results', stage: 'funding', dueDaysOffset: 85 },
    { slug: 'tradeline_support', title: 'Support ticket — tradeline issue', kind: 'follow_up', stage: 'funding', dueDaysOffset: 1 },
    { slug: 'tradeline_graduate', title: 'Graduate to build / funding lane', kind: 'general', stage: 'complete', dueDaysOffset: 95 },
  ],
  agency: [
    { slug: 'agency_onboard', title: 'Agency onboarding + tenant setup', kind: 'general', stage: 'intake', dueDaysOffset: 0, assignedTo: 'admin' },
    { slug: 'agency_branding', title: 'White-label branding configuration', kind: 'general', stage: 'intake', dueDaysOffset: 3 },
    { slug: 'agency_seats', title: 'Invite team seats + roles', kind: 'general', stage: 'intake', dueDaysOffset: 2 },
    { slug: 'agency_training', title: 'Complete agency training phase modules', kind: 'general', stage: 'intake', dueDaysOffset: 7 },
    { slug: 'agency_first_client', title: 'Onboard first agency client file', kind: 'follow_up', stage: 'intake', dueDaysOffset: 14 },
    { slug: 'agency_sop', title: 'Review agency SOP + playbook library', kind: 'review_results', stage: 'intake', dueDaysOffset: 5 },
    { slug: 'agency_billing', title: 'Revenue share + billing setup', kind: 'general', stage: 'intake', dueDaysOffset: 2 },
    { slug: 'agency_compliance', title: 'Agency compliance attestation', kind: 'upload_document', stage: 'intake', dueDaysOffset: 1 },
    { slug: 'agency_marketing', title: 'Co-branded marketing asset pack', kind: 'general', stage: 'funding', dueDaysOffset: 10 },
    { slug: 'agency_support', title: 'Agency support channel intro', kind: 'follow_up', stage: 'intake', dueDaysOffset: 1 },
    { slug: 'agency_qbr', title: 'Quarterly business review', kind: 'follow_up', stage: 'complete', dueDaysOffset: 90 },
    { slug: 'agency_scale', title: 'Scale tier capacity planning', kind: 'review_results', stage: 'funding', dueDaysOffset: 30 },
    { slug: 'agency_enterprise', title: 'Enterprise white-label rollout', kind: 'general', stage: 'funding', dueDaysOffset: 21 },
    { slug: 'agency_client_import', title: 'Bulk client import / migration', kind: 'upload_document', stage: 'intake', dueDaysOffset: 5 },
    { slug: 'agency_playbooks', title: 'Customize agency playbook templates', kind: 'review_results', stage: 'intake', dueDaysOffset: 7 },
    { slug: 'agency_crm', title: 'Agency CRM pipeline setup', kind: 'general', stage: 'intake', dueDaysOffset: 4 },
    { slug: 'agency_automation', title: 'Enable automation studio rules', kind: 'general', stage: 'funding', dueDaysOffset: 10 },
    { slug: 'agency_certification', title: 'Certification exam / sign-off', kind: 'general', stage: 'complete', dueDaysOffset: 60 },
    { slug: 'agency_referral', title: 'Referral program activation', kind: 'general', stage: 'funding', dueDaysOffset: 14 },
    { slug: 'agency_graduation', title: 'Graduate to independent partner tier', kind: 'general', stage: 'complete', dueDaysOffset: 120 },
  ],
};

/** Tier 2 edge-case playbooks — expands catalog toward 400+. */
const EDGE_PLAYBOOKS: Array<{ category: PricingCategory; spec: SeedSpec }> = [
  { category: 'personal_credit', spec: { slug: 'edge_thin_file', title: 'Thin file — secured + AU path review', kind: 'review_results', stage: 'funding', dueDaysOffset: 5 } },
  { category: 'personal_credit', spec: { slug: 'edge_mixed_file', title: 'Mixed-file / alias tradeline cleanup', kind: 'review_results', stage: 'identity', dueDaysOffset: 4, priority: 'high' } },
  { category: 'personal_credit', spec: { slug: 'edge_chargeoff', title: 'Charge-off vs collection duplicate dispute', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 6 } },
  { category: 'personal_credit', spec: { slug: 'edge_reaging', title: 'Re-aging / date of last activity review', kind: 'review_results', stage: 'disputes', dueDaysOffset: 5 } },
  { category: 'personal_credit', spec: { slug: 'edge_util_spike', title: 'Utilization spike before app — AZEO reset', kind: 'follow_up', stage: 'funding', dueDaysOffset: 3, tags: ['recurring:monthly'] } },
  { category: 'business_credit', spec: { slug: 'edge_shelf_corp', title: 'Shelf corp / aged entity risk review', kind: 'review_results', stage: 'intake', dueDaysOffset: 2 } },
  { category: 'business_credit', spec: { slug: 'edge_pg_limited', title: 'PG-limit strategy before vendor apps', kind: 'review_results', stage: 'funding', dueDaysOffset: 7 } },
  { category: 'debt_legal', spec: { slug: 'edge_sol_affirm', title: 'Affirm SOL in writing before pay', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 4 } },
  { category: 'debt_legal', spec: { slug: 'edge_garnish', title: 'Garnishment / levy emergency track', kind: 'follow_up', stage: 'debt', dueDaysOffset: 1, priority: 'urgent' } },
  { category: 'privacy_id', spec: { slug: 'edge_synthetic', title: 'Synthetic identity red-flag review', kind: 'review_results', stage: 'identity', dueDaysOffset: 2, priority: 'urgent' } },
  { category: 'wealth_builder', spec: { slug: 'edge_dti', title: 'DTI optimization before mortgage lane', kind: 'review_results', stage: 'funding', dueDaysOffset: 10 } },
  { category: 'bundle', spec: { slug: 'edge_lane_conflict', title: 'Resolve cross-lane task conflicts', kind: 'review_results', stage: 'reports', dueDaysOffset: 3, delivery: 'DFY', assignedTo: 'admin', visibility: 'admin' } },
  { category: 'tradeline_promo', spec: { slug: 'edge_au_drop', title: 'AU dropped early — remediation', kind: 'follow_up', stage: 'funding', dueDaysOffset: 2 } },
  { category: 'personal_credit', spec: { slug: 'edge_inquiry_shield', title: 'Inquiry shield before funding sprint', kind: 'general', stage: 'funding', dueDaysOffset: 1 } },
  { category: 'personal_credit', spec: { slug: 'edge_bureau_mismatch', title: 'Bureau score mismatch investigation', kind: 'review_results', stage: 'reports', dueDaysOffset: 2 } },
  { category: 'business_credit', spec: { slug: 'edge_duns_mismatch', title: 'DUNS / business name mismatch fix', kind: 'mail_letter', stage: 'intake', dueDaysOffset: 4 } },
  { category: 'debt_legal', spec: { slug: 'edge_portfolio_sale', title: 'Debt sold to new collector — restart validation', kind: 'mail_letter', stage: 'debt', dueDaysOffset: 3 } },
  { category: 'personal_credit', spec: { slug: 'edge_foreclosure', title: 'Foreclosure / short sale legacy cleanup', kind: 'review_results', stage: 'disputes', dueDaysOffset: 8 } },
  { category: 'personal_credit', spec: { slug: 'edge_tax_lien', title: 'Tax lien / civil judgment dispute path', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 7 } },
  { category: 'personal_credit', spec: { slug: 'edge_student_forgive', title: 'Student loan forgiveness / IDR documentation', kind: 'upload_document', stage: 'debt', dueDaysOffset: 5 } },
  { category: 'business_credit', spec: { slug: 'edge_mca_stack', title: 'MCA / stack risk — funding pause review', kind: 'review_results', stage: 'funding', dueDaysOffset: 1, priority: 'urgent' } },
  { category: 'wealth_builder', spec: { slug: 'edge_heloc', title: 'HELOC readiness credit tune-up', kind: 'review_results', stage: 'funding', dueDaysOffset: 14 } },
  { category: 'privacy_id', spec: { slug: 'edge_child_credit', title: 'Minor / child credit file freeze check', kind: 'general', stage: 'identity', dueDaysOffset: 1 } },
  { category: 'bundle', spec: { slug: 'edge_client_ghost', title: 'Customer idle 7d — re-engagement playbook', kind: 'follow_up', stage: 'intake', dueDaysOffset: 7, delivery: 'DFY', assignedTo: 'admin' } },
  { category: 'personal_credit', spec: { slug: 'edge_statement_date', title: 'Align pay-before-close to statement dates', kind: 'follow_up', stage: 'funding', dueDaysOffset: 2, tags: ['recurring:monthly'] } },
  { category: 'personal_credit', spec: { slug: 'edge_round3_eosc', title: 'Round 3 — EOSC escalation letters', kind: 'mail_letter', stage: 'disputes', dueDaysOffset: 50, priority: 'high' } },
  { category: 'agency', spec: { slug: 'edge_agency_churn', title: 'Agency client churn rescue call', kind: 'follow_up', stage: 'complete', dueDaysOffset: 3, delivery: 'DFY' } },
  { category: 'personal_credit', spec: { slug: 'edge_funding_denial', title: 'Funding denial — counter-strategy session', kind: 'review_results', stage: 'funding', dueDaysOffset: 2 } },
  { category: 'business_credit', spec: { slug: 'edge_vendor_denial', title: 'Vendor denial — alternate tier plan', kind: 'follow_up', stage: 'funding', dueDaysOffset: 5 } },
  { category: 'debt_legal', spec: { slug: 'edge_court_date', title: 'Court date prep + documentation pack', kind: 'upload_document', stage: 'debt', dueDaysOffset: 2, priority: 'urgent' } },
  { category: 'personal_credit', spec: { slug: 'edge_vantage_fico', title: 'Vantage vs FICO lender match review', kind: 'review_results', stage: 'funding', dueDaysOffset: 3 } },
];

function toPlaybook(
  spec: SeedSpec,
  opts: { categories: PricingCategory[]; packageIds?: string[]; sortOrder: number; slugToId?: Map<string, string> },
): TaskPlaybook {
  const categoryKey = opts.categories[0] ?? 'personal_credit';
  const id = opts.packageIds?.length
    ? `pb_pkg_${opts.packageIds[0]}_${spec.slug}`
    : `pb_${categoryKey}_${spec.slug}`;
  const dependsOnPlaybookId =
    spec.dependsOnSlug && opts.slugToId && !opts.packageIds?.length
      ? opts.slugToId.get(spec.dependsOnSlug)
      : undefined;
  return {
    id,
    slug: spec.slug,
    title: spec.title,
    kind: spec.kind,
    stage: spec.stage,
    priority: spec.priority ?? 'normal',
    delivery: spec.delivery ?? 'any',
    categories: opts.categories,
    packageIds: opts.packageIds,
    dueDaysOffset: spec.dueDaysOffset,
    dependsOnPlaybookId,
    checklist: spec.checklist,
    partnerInstructions: spec.partnerInstructions,
    adminInstructions: spec.adminInstructions,
    assignedTo: spec.assignedTo ?? (spec.delivery === 'DFY' ? 'admin' : 'partner'),
    visibility: spec.visibility ?? (spec.assignedTo === 'admin' ? 'admin' : 'hybrid'),
    sortOrder: opts.sortOrder,
    tags: [...(spec.tags ?? []), categoryKey, spec.stage, spec.kind],
  };
}

export function buildAllTaskPlaybooks(): TaskPlaybook[] {
  const out: TaskPlaybook[] = [];
  let order = 0;
  const coreSlugToId = new Map<string, string>();

  for (const spec of CORE_PLAYBOOKS) {
    const categoryKey = 'personal_credit';
    const id = `pb_${categoryKey}_${spec.slug}`;
    coreSlugToId.set(spec.slug, id);
  }

  for (const spec of CORE_PLAYBOOKS) {
    out.push(toPlaybook(spec, { categories: ['personal_credit', 'business_credit', 'bundle'], sortOrder: order++, slugToId: coreSlugToId }));
  }

  for (const [category, specs] of Object.entries(CATEGORY_PLAYBOOKS) as Array<[PricingCategory, SeedSpec[]]>) {
    for (const spec of specs) {
      out.push(toPlaybook(spec, { categories: [category], sortOrder: order++ }));
    }
  }

  for (const { category, spec } of EDGE_PLAYBOOKS) {
    out.push(toPlaybook(spec, { categories: [category], sortOrder: order++ }));
  }

  for (const pkg of allPackages) {
    const categorySpecs = CATEGORY_PLAYBOOKS[pkg.category] ?? [];
    const picks = categorySpecs.slice(0, 3);
    for (const spec of picks) {
      out.push(
        toPlaybook(
          { ...spec, slug: `${pkg.id}_${spec.slug}` },
          { categories: [pkg.category], packageIds: [pkg.id], sortOrder: order++ },
        ),
      );
    }
    out.push(
      toPlaybook(
        {
          slug: `${pkg.id}_kickoff`,
          title: `Kickoff: ${pkg.name}`,
          kind: 'general',
          stage: 'intake',
          dueDaysOffset: 0,
          delivery: pkg.delivery,
          partnerInstructions: pkg.tagline,
        },
        { categories: [pkg.category], packageIds: [pkg.id], sortOrder: order++ },
      ),
    );
  }

  const byId = new Map<string, TaskPlaybook>();
  for (const pb of out) byId.set(pb.id, pb);
  return Array.from(byId.values());
}

export const ALL_TASK_PLAYBOOKS = buildAllTaskPlaybooks();

import type { WorkScope } from '../../../domain/projects';

export function getCoreRestorationPlaybookIds(scope: WorkScope = 'personal'): string[] {
  const category = scope === 'business' ? 'business_credit' : 'personal_credit';
  const coreSlugs =
    scope === 'business'
      ? [
          'biz_sprint_kickoff',
          'biz_ein_verify',
          'biz_sos',
          'biz_fundability_audit',
          'biz_duns',
          'biz_secrets',
          'biz_nexus',
          'biz_vendor_net30',
          'biz_tier1_vendors',
          'biz_tier2_vendors',
          'biz_ucc_review',
          'biz_pg_strategy',
          'biz_bank_account',
          'biz_line_of_credit',
          'biz_maintenance',
        ]
      : [
          'welcome_intake',
          'consent_docs',
          'upload_reports',
          'parse_reports',
          'upload_id_poa',
          'evidence_checklist',
          'dispute_candidates',
          'draft_letters',
          'mail_certified',
          'bureau_followup',
          'collect_responses',
          'debt_inventory',
          'identity_theft_review',
          'funding_readiness',
          'monthly_checkin',
        ];
  const categorySlugs = ALL_TASK_PLAYBOOKS.filter((p) => p.categories.includes(category))
    .map((p) => p.slug)
    .filter((slug) => !coreSlugs.includes(slug));
  const slugs = [...coreSlugs, ...categorySlugs.slice(0, 18)];
  return ALL_TASK_PLAYBOOKS.filter((p) => p.categories.includes(category) && slugs.includes(p.slug)).map((p) => p.id);
}

export function getPlaybookCount() {
  return ALL_TASK_PLAYBOOKS.length;
}
