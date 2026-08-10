import { CS } from './creditSpecialistProgram';
import { AF } from './affiliateProgram';
import { AU_SELLER } from './auSellerProgram';
import { AGENCY } from './agencyPartnersProgram';
import { CASE_HELP } from './caseHelpProgram';
import { RE } from './realEstateProgram';

export type RoleWorkflowId =
  | 'client'
  | 'agent'
  | 'affiliate'
  | 'au_seller'
  | 'au_buyer'
  | 'business'
  | 'agency'
  | 'case_help'
  | 'real_estate';

export type WorkflowStep = {
  title: string;
  description: string;
  path: string;
};

export const ROLE_WORKFLOWS: Record<RoleWorkflowId, { label: string; hubPath: string; steps: WorkflowStep[] }> = {
  client: {
    label: 'Customer',
    hubPath: '/portal/dashboard',
    steps: [
      { title: 'Onboarding', description: 'Pick your focus (restore, debt, business, funding).', path: '/onboarding' },
      { title: 'Upload report', description: 'Tri-merge drives disputes and score tracking.', path: '/portal/reports' },
      { title: 'Dispute workflow', description: 'Cases, rounds 1–3, complaints between rounds.', path: '/portal/disputes' },
      { title: 'Template library', description: 'Templates, saved reasons, starter bases.', path: '/portal/templates' },
      { title: 'Letter studio', description: 'Draft disputes, attach evidence, generate PDFs.', path: '/portal/letters' },
      { title: 'Tasks & documents', description: 'Follow-ups, evidence vault, supporting docs.', path: '/portal/projects' },
    ],
  },
  agent: {
    label: CS.singular,
    hubPath: CS.hubPath,
    steps: [
      { title: 'Onboarding', description: 'Pick tier, operating model, and training phase.', path: '/onboarding?lane=agent' },
      { title: 'Specialist Hub', description: 'Economics, Denefit calculator, growth pitch cards.', path: CS.hubPath },
      { title: 'Partnership line', description: 'Direct thread with Finely ops.', path: CS.messagesDeepLink },
      { title: 'Customer files', description: 'Portal dashboard, disputes, letters for each customer.', path: '/portal/dashboard' },
      { title: 'Template library', description: 'Vault templates, reasons library, starter bases.', path: '/portal/templates' },
      { title: 'Letter studio', description: 'Execute rounds — draft, preview, save PDFs.', path: '/portal/letters' },
    ],
  },
  affiliate: {
    label: 'Affiliate',
    hubPath: AF.hubPath,
    steps: [
      { title: 'Onboarding', description: 'Lean signup → Affiliate Hub.', path: '/onboarding?lane=affiliate' },
      { title: 'Referral toolkit', description: 'Copy tracked links for apply, pricing, landing.', path: AF.hubPath },
      { title: 'Commission calculator', description: 'Model upfront + recurring package earnings.', path: `${AF.hubPath}?tab=calculator` },
      { title: 'Denefit stream', description: 'Pitch in-house contracts that report to Equifax.', path: `${AF.hubPath}?tab=denefits` },
      { title: 'Partnership line', description: 'Payouts, compliance, campaign support.', path: AF.messagesDeepLink },
    ],
  },
  au_seller: {
    label: 'AU Seller',
    hubPath: AU_SELLER.hubPath,
    steps: [
      { title: 'Onboarding', description: 'Seller lane → verify supply-side profile.', path: '/au-sellers' },
      { title: 'Seller Hub', description: 'Overview, marketplace links, training.', path: AU_SELLER.hubPath },
      { title: 'Listings', description: 'Publish tradeline inventory with proof.', path: AU_SELLER.listingsPath },
      { title: 'Contracts & payouts', description: 'Fulfillment tracking and earnings.', path: AU_SELLER.contractsPath },
      { title: 'Denefit (optional)', description: 'Refer customers into in-house Equifax-reporting contracts.', path: `${AU_SELLER.hubPath}?tab=economics` },
    ],
  },
  au_buyer: {
    label: 'AU Buyer',
    hubPath: '/au/marketplace',
    steps: [
      { title: 'Onboarding', description: 'AU tradeline focus → marketplace.', path: '/onboarding?lane=au_tradelines' },
      { title: 'Browse marketplace', description: 'Pick inventory that fits your profile.', path: '/au/marketplace' },
      { title: 'Submit request', description: 'Intake for AU placement.', path: '/au/request' },
      { title: 'Track orders', description: 'Order status and fulfillment.', path: '/au/orders' },
    ],
  },
  business: {
    label: 'Business credit',
    hubPath: '/business/dashboard',
    steps: [
      { title: 'Business profile', description: 'Entity, NAICS, compliance signals, reporting readiness.', path: '/business/profile' },
      { title: 'Vendor stack', description: 'Sequenced tier-1 vendors and fundability signals.', path: '/business/vendors' },
      { title: 'Lender logic', description: 'Model lender fit and generate next-best actions.', path: '/business/lender-logic' },
      { title: 'Documents vault', description: 'Underwriting package and supporting proofs.', path: '/business/documents' },
      { title: 'Funding paths', description: 'Nora Capital Group handoff when your file is ready.', path: '/portal/wealth-paths' },
      { title: 'Business disputes', description: 'Bureau disputes on business tradelines when needed.', path: '/business/disputes' },
    ],
  },
  agency: {
    label: 'Agency',
    hubPath: AGENCY.hubPath,
    steps: [
      { title: 'Buy-in & workspace', description: 'Pick buy-in and create your agency tenant.', path: AGENCY.signupPath },
      { title: 'Agency Hub', description: 'Partners, letters, team, payouts, white-label.', path: AGENCY.hubPath },
      { title: 'Partner files', description: 'Route and run partner restore / debt / build lanes.', path: '/admin/partners' },
      { title: 'Team seats', description: 'Invite operators and assign scope.', path: '/admin/team' },
      { title: 'Partnership line', description: 'Ops support for your agency tenant.', path: AGENCY.messagesDeepLink },
    ],
  },
  case_help: {
    label: 'Case Help',
    hubPath: CASE_HELP.hubPath,
    steps: [
      { title: 'Apply', description: 'Submit case-desk application (paralegal / attorney / consultant).', path: CASE_HELP.publicPath },
      { title: 'Admin approval', description: 'Finely reviews and grants scoped membership — hub is not promised on bare apply.', path: CASE_HELP.publicPath },
      { title: 'Claim / signup', description: 'Claim invite with the approved email to activate your seat.', path: `/signup?auth=signup&next=${encodeURIComponent(CASE_HELP.hubPath)}` },
      { title: 'Case Help Hub', description: 'Assigned matters desk — packets, letters, sessions.', path: CASE_HELP.hubPath },
      { title: 'Operator guide', description: 'Case desk handbook for scope and validation-first work.', path: CASE_HELP.guideReadPath },
    ],
  },
  real_estate: {
    label: 'Real Estate (tagged affiliate)',
    hubPath: RE.hubPath,
    steps: [
      { title: 'RE affiliate signup', description: 'Affiliate role + interest=real_estate tag (no new auth enum).', path: RE.signupPath },
      { title: 'Real Estate Hub', description: 'Filtered affiliate view: referrals, handoff, score CTA.', path: RE.hubPath },
      { title: 'Referral toolkit', description: 'Tracked links for restore and readiness handoffs.', path: `${RE.hubPath}?tab=referrals` },
      { title: 'Underwriting playbook', description: 'AU / DTI / rescore levers — lender-dependent.', path: `${RE.hubPath}?tab=playbook` },
      { title: 'Full affiliate tools', description: 'Campaigns and payouts on the general Affiliate Hub.', path: AF.hubPath },
    ],
  },
};

export function workflowIdForPartner(lane?: string): RoleWorkflowId {
  if (lane === 'agent') return 'agent';
  if (lane === 'affiliate') return 'affiliate';
  if (lane === 'au_tradelines') return 'au_buyer';
  if (lane === 'business_credit') return 'business';
  return 'client';
}

export function getWorkflowForRole(role: string, lane?: string): (typeof ROLE_WORKFLOWS)[RoleWorkflowId] {
  if (role === 'agent') return ROLE_WORKFLOWS.agent;
  if (role === 'agency') return ROLE_WORKFLOWS.agency;
  if (role === 'case_help' || role === 'paralegal' || role === 'attorney' || role === 'consultant') {
    return ROLE_WORKFLOWS.case_help;
  }
  if (role === 'real_estate') return ROLE_WORKFLOWS.real_estate;
  if (role === 'affiliate') return ROLE_WORKFLOWS.affiliate;
  if (role === 'business' || lane === 'business_credit') return ROLE_WORKFLOWS.business;
  if (role === 'au_seller' || lane === 'au_seller') return ROLE_WORKFLOWS.au_seller;
  if (lane === 'au_tradelines') return ROLE_WORKFLOWS.au_buyer;
  return ROLE_WORKFLOWS.client;
}
