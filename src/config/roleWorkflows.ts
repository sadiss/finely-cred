import { CS } from './creditSpecialistProgram';
import { AF } from './affiliateProgram';
import { AU_SELLER } from './auSellerProgram';

export type RoleWorkflowId = 'client' | 'agent' | 'affiliate' | 'au_seller' | 'au_buyer' | 'business';

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
      { title: 'Onboarding', description: 'Seller lane → verify supply-side profile.', path: '/onboarding?lane=au_seller' },
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
  if (role === 'affiliate') return ROLE_WORKFLOWS.affiliate;
  if (role === 'business' || lane === 'business_credit') return ROLE_WORKFLOWS.business;
  if (role === 'au_seller' || lane === 'au_seller') return ROLE_WORKFLOWS.au_seller;
  if (lane === 'au_tradelines') return ROLE_WORKFLOWS.au_buyer;
  return ROLE_WORKFLOWS.client;
}
