import type { AgentPersonaId } from '../domain/agentPersonas';
import type { PortraitGender, StaffMember, StaffShiftBlock } from '../domain/staffMember';
import { clampStaffShiftBlocks } from '../domain/staffMember';

const WEEKDAY: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 };
const WEEKEND: StaffShiftBlock = { days: [0, 6], startHour: 10, endHour: 18 };
const EVENING: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 17, endHour: 21 };
const EARLY: StaffShiftBlock = { days: [1, 2, 3, 4, 5], startHour: 6, endHour: 14 };
const LATE: StaffShiftBlock = { days: [1, 3, 5], startHour: 14, endHour: 22 };
const OVERNIGHT: StaffShiftBlock = { days: [0, 1, 2, 3, 4, 5, 6], startHour: 22, endHour: 6 };

function mx(
  id: string,
  firstName: string,
  lastName: string,
  primaryRoleId: AgentPersonaId,
  department: StaffMember['department'],
  portraitGender: PortraitGender,
  bio: string,
  displayTitle: string,
  shifts: StaffShiftBlock[] = [WEEKDAY],
): StaffMember {
  return {
    id,
    firstName,
    lastName,
    primaryRoleId,
    department,
    displayTitle,
    portraitGender,
    avatarPath: `staff-portrait://${id}`,
    bioLine: bio,
    shiftBlocks: clampStaffShiftBlocks(shifts),
    active: true,
  };
}

/** +40 specialists — lane-dedicated portal coaches (bankruptcy, foreclosure, bureau, funding, etc.). */
export const STAFF_ROSTER_EXPANSION: StaffMember[] = [
  mx('staff-kenya-wells', 'Kenya', 'Wells', 'debt_strategist', 'debt_resolution', 'feminine', 'Bankruptcy Chapter 7/13 filing coach — means test and petition schedules.', 'Bankruptcy Filing Specialist', [EARLY]),
  mx('staff-darnell-price', 'Darnell', 'Price', 'debt_strategist', 'debt_resolution', 'masculine', 'Foreclosure defense — automatic stay and sale-date emergencies.', 'Foreclosure Stay Advocate', [OVERNIGHT]),
  mx('staff-alicia-morris', 'Alicia', 'Morris', 'debt_strategist', 'debt_resolution', 'feminine', 'Chapter 13 home retention — cure arrearage and plan feasibility.', 'Chapter 13 Home Retention Coach', [WEEKDAY]),
  mx('staff-terrence-floyd', 'Terrence', 'Floyd', 'debt_strategist', 'debt_resolution', 'masculine', 'Court summons and affidavit strategy — civil procedure education.', 'Court & Summons Specialist', [LATE]),
  mx('staff-monique-baker', 'Monique', 'Baker', 'debt_strategist', 'debt_resolution', 'feminine', 'FDCPA validation and collection proof demands.', 'Validation & FDCPA Specialist', [EARLY]),
  mx('staff-reginald-shaw', 'Reginald', 'Shaw', 'debt_strategist', 'debt_resolution', 'masculine', 'Repossession and UCC Article 9 reinstatement paths.', 'Repossession Defense Coach', [EVENING]),
  mx('staff-tiffany-nguyen', 'Tiffany', 'Nguyen', 'debt_strategist', 'debt_resolution', 'feminine', 'Post-discharge bureau tradeline disputes after bankruptcy.', 'Post-Discharge Credit Specialist', [WEEKDAY]),
  mx('staff-andre-coleman', 'Andre', 'Coleman', 'debt_strategist', 'debt_resolution', 'masculine', 'Business Chapter 11 reorganization educational support.', 'Business Bankruptcy Advisor', [LATE]),
  mx('staff-latoya-james', 'Latoya', 'James', 'dispute_coach', 'dispute_processing', 'feminine', 'Equifax bureau dispute — Metro 2 accuracy and evidence.', 'Equifax Dispute Specialist', [WEEKDAY]),
  mx('staff-derek-hughes', 'Derek', 'Hughes', 'dispute_coach', 'dispute_processing', 'masculine', 'Experian bureau dispute — factual reason library.', 'Experian Dispute Specialist', [EARLY]),
  mx('staff-sharon-ivey', 'Sharon', 'Ivey', 'dispute_coach', 'dispute_processing', 'feminine', 'TransUnion bureau dispute — round sequencing.', 'TransUnion Dispute Specialist', [WEEKDAY]),
  mx('staff-malcolm-grant', 'Malcolm', 'Grant', 'dispute_coach', 'dispute_processing', 'masculine', 'Metro 2 field accuracy and furnisher disputes.', 'Metro 2 Accuracy Specialist', [OVERNIGHT]),
  mx('staff-brittany-owens', 'Brittany', 'Owens', 'dispute_coach', 'dispute_processing', 'feminine', 'Identity theft and mixed-file bureau cleanup.', 'Identity Theft Dispute Coach', [WEEKDAY]),
  mx('staff-cedric-powell', 'Cedric', 'Powell', 'dispute_coach', 'dispute_processing', 'masculine', 'Charge-off and collection tradeline disputes.', 'Collection Tradeline Specialist', [EVENING]),
  mx('staff-nicole-freeman', 'Nicole', 'Freeman', 'finely_advisor', 'credit_operations', 'feminine', 'Personal restore onboarding — first report upload.', 'Restore Onboarding Coach', [WEEKDAY]),
  mx('staff-elijah-barnes', 'Elijah', 'Barnes', 'finely_advisor', 'credit_operations', 'masculine', 'Score roadmap and utilization coaching.', 'Score Roadmap Specialist', [WEEKDAY]),
  mx('staff-danielle-ross', 'Danielle', 'Ross', 'finely_advisor', 'credit_operations', 'feminine', 'Authorized user and tradeline education.', 'Tradeline Education Coach', [WEEKEND, WEEKDAY]),
  mx('staff-gregory-simmons', 'Gregory', 'Simmons', 'funding_strategist', 'funding', 'masculine', 'Vendor ladder sequencing and entity hygiene.', 'Business Vendor Specialist', [WEEKDAY]),
  mx('staff-keisha-porter', 'Keisha', 'Porter', 'funding_strategist', 'funding', 'feminine', 'Funding readiness and underwriting prep.', 'Funding Readiness Coach', [EARLY]),
  mx('staff-antonio-vega', 'Antonio', 'Vega', 'funding_strategist', 'funding', 'masculine', 'SBA and commercial line educational paths.', 'Commercial Credit Advisor', [WEEKDAY]),
  mx('staff-rachel-stone', 'Rachel', 'Stone', 'underwriting_analyst', 'funding', 'feminine', 'Underwriting optics and inquiry discipline.', 'Underwriting Analyst', [WEEKDAY]),
  mx('staff-devon-mitchell', 'Devon', 'Mitchell', 'nurture_concierge', 'growth_sessions', 'masculine', 'Welcome concierge — lead magnet follow-up.', 'Welcome Concierge', [WEEKEND]),
  mx('staff-simone-harris', 'Simone', 'Harris', 'nurture_concierge', 'growth_sessions', 'feminine', 'Warm nurture sequences and reply routing.', 'Nurture Sequence Coach', [WEEKDAY]),
  mx('staff-brandon-kim', 'Brandon', 'Kim', 'appointment_setter', 'growth_sessions', 'masculine', 'Strategy call booking and show-up recovery.', 'Booking Coordinator', [WEEKDAY]),
  mx('staff-angelique-davis', 'Angelique', 'Davis', 'appointment_setter', 'growth_sessions', 'feminine', 'Calendar follow-up and no-show rescue.', 'Show-Up Recovery Specialist', [EVENING]),
  mx('staff-travis-wright', 'Travis', 'Wright', 'sales_closer', 'growth_sessions', 'masculine', 'DIY vs DFY consult fit and ethical close.', 'Solutions Advisor', [EVENING]),
  mx('staff-michelle-aguilar', 'Michelle', 'Aguilar', 'sales_closer', 'growth_sessions', 'feminine', 'Package fit and upgrade path education.', 'Package Fit Advisor', [WEEKDAY]),
  mx('staff-philip-turner', 'Philip', 'Turner', 'lead_converter', 'partner_success', 'masculine', 'Trial activation and first report upload.', 'Activation Specialist', [WEEKDAY]),
  mx('staff-yolanda-cruz', 'Yolanda', 'Cruz', 'lead_converter', 'partner_success', 'feminine', 'Partner portal navigation and onboarding.', 'Portal Onboarding Coach', [WEEKDAY]),
  mx('staff-wesley-foster', 'Wesley', 'Foster', 'support_specialist', 'partner_success', 'masculine', 'Documents vault and billing questions.', 'Partner Success Specialist', [WEEKDAY]),
  mx('staff-amber-johnson', 'Amber', 'Johnson', 'support_specialist', 'partner_success', 'feminine', 'Communication Hub and thread routing.', 'Hub Support Specialist', [LATE]),
  mx('staff-roland-peterson', 'Roland', 'Peterson', 'affiliate_specialist', 'marketing', 'masculine', 'Affiliate kits and compliant promo copy.', 'Affiliate Success Coach', [WEEKDAY]),
  mx('staff-janelle-washington', 'Janelle', 'Washington', 'affiliate_specialist', 'marketing', 'feminine', 'Referral loops and partner activation.', 'Referral Growth Specialist', [WEEKDAY]),
  mx('staff-curtis-bell', 'Curtis', 'Bell', 'social_creator', 'marketing', 'masculine', 'Brand campaigns and funnel creative.', 'Brand Campaign Specialist', [WEEKDAY]),
  mx('staff-imani-cooper', 'Imani', 'Cooper', 'social_creator', 'marketing', 'feminine', 'Short-form hooks and compliant captions.', 'Social Content Coach', [WEEKEND]),
  mx('staff-lloyd-bennett', 'Lloyd', 'Bennett', 'education_coach', 'credit_operations', 'masculine', 'Courses, checklists, and library walkthroughs.', 'Education Coach', [WEEKDAY]),
  mx('staff-sabrina-ellis', 'Sabrina', 'Ellis', 'education_coach', 'growth_sessions', 'feminine', 'Training Academy and certification paths.', 'Academy Coach', [WEEKDAY]),
  mx('staff-henry-ng', 'Henry', 'Ng', 'evidence_specialist', 'dispute_processing', 'masculine', 'Evidence vault and proof pack assembly.', 'Evidence Pack Specialist', [WEEKDAY]),
  mx('staff-patricia-owen', 'Patricia', 'Owen', 'letter_ops_agent', 'dispute_processing', 'feminine', 'Certified mail prep and letter QA.', 'Letter Operations Specialist', [EARLY]),
  mx('staff-raheem-sullivan', 'Raheem', 'Sullivan', 'compliance_agent', 'internal_ops', 'masculine', 'Compliance review and claim blocking.', 'Compliance Review Agent', [WEEKDAY]),
  mx('staff-gina-torres', 'Gina', 'Torres', 'crm_intake_specialist', 'internal_ops', 'feminine', 'CRM intake, scoring, and lead routing.', 'CRM Intake Specialist', [EVENING]),
  mx('staff-donovan-price', 'Donovan', 'Price', 'processing_agent', 'dispute_processing', 'masculine', 'Bureau response triage and round timelines.', 'Processing Agent', [OVERNIGHT]),
];
