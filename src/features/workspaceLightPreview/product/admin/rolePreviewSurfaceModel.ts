import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Crown,
  Cross,
  Gavel,
  Home,
  Share2,
  UserCog,
  Users,
  Wallet,
  ShoppingBag,
} from 'lucide-react';
import { AGENCY } from '../../../../config/agencyPartnersProgram';
import { CASE_HELP } from '../../../../config/caseHelpProgram';
import { RE } from '../../../../config/realEstateProgram';
import { LAUNCH_ROLE_COURSES } from '../../../../config/launchRoleCourses';
import { ROLE_PREVIEW_ORDER, type RolePreviewRole } from '../../../../config/rolePreviewCatalog';

export type RolePreviewSurfaceRole = RolePreviewRole;

export type RolePreviewConfig = {
  title: string;
  shortLabel: string;
  icon: LucideIcon;
  accent: 'violet' | 'fuchsia' | 'emerald' | 'sky' | 'rose';
  previewPath: string;
  addPath: string;
  addLabel: string;
  preview: string[];
  access: { label: string; path: string }[];
  contracts: string[];
  payouts: string[];
};

export const ROLE_PREVIEW_CONFIG: Record<RolePreviewSurfaceRole, RolePreviewConfig> = {
  partner: {
    title: 'Partner portal',
    shortLabel: 'Partner',
    icon: Users,
    accent: 'sky',
    previewPath: '/portal/dashboard',
    addPath: '/admin/partners#create-partner',
    addLabel: 'Create partner',
    preview: [
      'Personal restore/build workspace: reports, disputes, letters, tasks',
      'Billing, documents, education, and messaging with their assigned team',
      'Scoped to one partner record — no admin or tenant settings',
      'Entitlements gate premium modules (debt kill, business build, etc.)',
    ],
    access: [
      { label: 'Portal dashboard', path: '/portal/dashboard' },
      { label: 'Credit reports', path: '/portal/reports' },
      { label: 'Disputes & letters', path: '/portal/disputes' },
      { label: 'Billing', path: '/portal/billing' },
    ],
    contracts: ['Service agreement on onboarding', 'Dispute authorization letters (per round)', 'Optional add-on entitlements at checkout'],
    payouts: ['N/A — the partner pays Finely; no outbound payouts to this role'],
  },
  business: {
    title: 'Business credit lane',
    shortLabel: 'Business',
    icon: BriefcaseBusiness,
    accent: 'emerald',
    previewPath: '/business/dashboard',
    addPath: '/admin/partners?lane=business_credit#create-partner',
    addLabel: 'Add business partner',
    preview: [
      'Vendor stack, funding readiness, lender logic, and bureau disputes',
      'Separate nav from personal portal — business profile + documents',
      'Admin sees same partner record under Partner Management',
    ],
    access: [
      { label: 'Business dashboard', path: '/business/dashboard' },
      { label: 'Vendor catalog', path: '/business/vendors' },
      { label: 'Lender Logic', path: '/business/lender-logic' },
      { label: 'Business disputes', path: '/business/disputes' },
    ],
    contracts: ['Business credit service terms', 'Vendor enrollment agreements where applicable'],
    payouts: ['N/A — revenue is inbound partner fees'],
  },
  agent: {
    title: 'Credit Specialist',
    shortLabel: 'Specialist',
    icon: UserCog,
    accent: 'fuchsia',
    previewPath: '/credit-specialist/hub',
    addPath: '/admin/team',
    addLabel: 'Invite specialist',
    preview: [
      'Hub with assigned partners only — tasks, messages, calendar',
      'Revenue split calculator reflects training phase and value levers',
      'Cannot access tenant billing, other admins, or unassigned partners',
    ],
    access: [
      { label: 'Specialist hub', path: '/credit-specialist/hub' },
      { label: 'Assigned partner files', path: '/admin/partners' },
      { label: 'Ops tasks', path: '/admin/workflow' },
    ],
    contracts: ['Credit Specialist operating agreement (program terms)', 'Partner engagement under the Finely brand'],
    payouts: ['Specialist split on partner revenue — see Finance / payout center', 'Configure method in the specialist profile'],
  },
  affiliate: {
    title: 'Affiliate partner',
    shortLabel: 'Affiliate',
    icon: Share2,
    accent: 'violet',
    previewPath: '/affiliate/hub',
    addPath: '/admin/partners?add=affiliate#create-partner',
    addLabel: 'Add affiliate',
    preview: [
      'Referral links, conversion tracking, and commission ledger',
      'Lane=affiliate on partner record; public program at /affiliate',
      'Payout center shows pending / paid referral commissions',
    ],
    access: [
      { label: 'Affiliate hub', path: '/affiliate/hub' },
      { label: 'Public program page', path: '/affiliate' },
    ],
    contracts: ['Affiliate program terms', 'Referral disclosure requirements'],
    payouts: ['Commission on qualified referrals', 'Payout center — bank / Cash App / Zelle when configured'],
  },
  au_seller: {
    title: 'AU seller',
    shortLabel: 'AU seller',
    icon: BadgeCheck,
    accent: 'emerald',
    previewPath: '/seller/hub',
    addPath: '/admin/au-sellers',
    addLabel: 'Add AU seller',
    preview: [
      'List tradeline inventory, verification uploads, contracts',
      'Admin approves listings before marketplace visibility',
      'Seller share of AU placement gross per program defaults',
    ],
    access: [
      { label: 'Seller hub', path: '/seller/hub' },
      { label: 'Listings', path: '/seller/listings' },
      { label: 'Contracts', path: '/seller/contracts' },
      { label: 'Payouts', path: '/seller/payouts' },
    ],
    contracts: ['AU seller agreement', 'Listing verification attestations'],
    payouts: ['Seller share of AU placement gross (see AU program defaults)', 'Payout method required before disbursement'],
  },
  au_buyer: {
    title: 'AU buyer',
    shortLabel: 'AU buyer',
    icon: ShoppingBag,
    accent: 'sky',
    previewPath: '/au/marketplace',
    addPath: '/au/request',
    addLabel: 'Start buyer intake',
    preview: [
      'Browse marketplace inventory and submit structured AU placement requests',
      'Document checklist and eligibility attestation on intake',
      'Order tracking through fulfillment — no seller-side listing tools',
    ],
    access: [
      { label: 'AU marketplace', path: '/au/marketplace' },
      { label: 'Submit request', path: '/au/request' },
      { label: 'My orders', path: '/au/orders' },
    ],
    contracts: ['AU placement terms', 'Authorization and eligibility attestations'],
    payouts: ['N/A — buyer pays for tradeline placement'],
  },
  agency: {
    title: 'Agency partner',
    shortLabel: 'Agency',
    icon: Building2,
    accent: 'sky',
    previewPath: AGENCY.hubPath,
    addPath: AGENCY.signupPath,
    addLabel: 'Create agency workspace',
    preview: [
      'Agency Hub after tenant create — partners, letters, team, payouts, white-label',
      'Gate: active membership on an agency-type tenant (tenant_owner / agency staff)',
      'Separate from Credit Specialist lane — agency_* buy-in IDs never equal cs_*',
    ],
    access: [
      { label: 'Agency Hub', path: AGENCY.hubPath },
      { label: 'Agency signup', path: AGENCY.signupPath },
      { label: 'Public careers', path: AGENCY.publicPath },
      { label: 'Team & roles', path: '/admin/team' },
    ],
    contracts: ['Agency buy-in / operating terms', 'White-label brand settings on tenant'],
    payouts: ['Agency keep % on partner files — configure in Finance / payout center'],
  },
  case_help: {
    title: 'Case Help (case desk)',
    shortLabel: 'Case Help',
    icon: Gavel,
    accent: 'fuchsia',
    previewPath: CASE_HELP.hubPath,
    addPath: '/admin/team',
    addLabel: 'Invite case desk seat',
    preview: [
      'Hub only after admin approval → claim/signup — never promised on bare apply',
      'Membership roles: paralegal / attorney / consultant with assignedPartnerIds scope',
      'Matters desk: debt, letters, packets — educational; not legal representation',
    ],
    access: [
      { label: 'Case Help Hub', path: CASE_HELP.hubPath },
      { label: 'Careers apply', path: CASE_HELP.publicPath },
      { label: 'Case desk guide', path: CASE_HELP.guidePath },
      { label: 'Team invites', path: '/admin/team' },
    ],
    contracts: ['Case desk membership after approval', 'Scoped partner assignment'],
    payouts: ['Seat / engagement terms set per matter — not a public self-serve payout hub'],
  },
  real_estate: {
    title: 'Real Estate (tagged affiliate)',
    shortLabel: 'RE',
    icon: Home,
    accent: 'emerald',
    previewPath: RE.hubPath,
    addPath: RE.signupPath,
    addLabel: 'RE affiliate signup',
    preview: [
      'LOCKED: same affiliate auth role — interest=real_estate tag + filtered hub',
      'No new auth role enum in v1 — referrals, handoff, score CTA, playbook',
      'Full campaigns/payouts remain on Affiliate Hub',
    ],
    access: [
      { label: 'Real Estate Hub', path: RE.hubPath },
      { label: 'RE careers', path: RE.publicPath },
      { label: 'Affiliate Hub', path: '/affiliate/hub' },
      { label: 'Operator guide', path: RE.guidePath },
    ],
    contracts: ['Affiliate program terms', 'RE interest tag on signup / journeySignals'],
    payouts: ['Same affiliate commission ladder — RE is a filtered view, not a new payout role'],
  },
  heta_society: {
    title: 'Head of Society (HOS)',
    shortLabel: 'HOS',
    icon: Cross,
    accent: 'rose',
    previewPath: '/head-of-society',
    addPath: '/admin/role-preview?role=heta_society',
    addLabel: 'Generate access keys',
    preview: [
      "Men's restoration & building program — invite-only at /head-of-society",
      'Admin-generated access keys unlock member registration (no public signup)',
      '5 dispute slots, free letter guide, business credit starter, and growth paths',
      'Access key → lead capture → onboarding lane=heta_society → /portal/hos member hub',
    ],
    access: [
      { label: 'HOS signup landing', path: '/head-of-society' },
      { label: 'HOS member portal', path: '/portal/hos' },
      { label: 'Free dispute guide', path: '/free-guide' },
      { label: 'Member login', path: '/onboarding?lane=heta_society&next=/portal/hos' },
    ],
    contracts: ['HOS access key + program consent on registration', 'Dispute authorization when mailing round one'],
    payouts: ['N/A — free member program; optional upsell to specialist/agent lanes'],
  },
  admin: {
    title: 'Platform admin',
    shortLabel: 'Admin',
    icon: Crown,
    accent: 'violet',
    previewPath: '/admin',
    addPath: '/admin/access',
    addLabel: 'Control center',
    preview: [
      'Full tenant ops: partners, cases, CRM, automations, finance',
      'Role preview — inspect every lane before go-live',
      'Team & Roles for RBAC-lite; entitlements and billing overrides',
    ],
    access: [
      { label: 'Admin dashboard', path: '/admin' },
      { label: 'Partner management', path: '/admin/partners' },
      { label: 'Finance & payouts', path: '/admin/finance' },
      { label: 'Team & roles', path: '/admin/team' },
    ],
    contracts: ['Platform operator agreements', 'Template management in Comms Studio'],
    payouts: ['Admin configures vendor / agent / affiliate payout rules in Finance'],
  },
};

export const ROLE_PREVIEW_ORDER_LIST: RolePreviewSurfaceRole[] = ROLE_PREVIEW_ORDER;

export const ROLE_PREVIEW_TAB_ACCENTS: Record<RolePreviewSurfaceRole, 'violet' | 'fuchsia' | 'emerald' | 'sky' | 'rose'> = {
  partner: 'sky',
  heta_society: 'rose',
  business: 'emerald',
  agent: 'fuchsia',
  affiliate: 'violet',
  real_estate: 'emerald',
  agency: 'sky',
  case_help: 'fuchsia',
  au_seller: 'emerald',
  au_buyer: 'sky',
  admin: 'violet',
};

export const ROLE_PREVIEW_DETAIL_TABS = [
  { id: 'experience', label: 'Experience' },
  { id: 'routes', label: 'Routes' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'capabilities', label: 'Capabilities' },
] as const;

export type RolePreviewDetailTab = (typeof ROLE_PREVIEW_DETAIL_TABS)[number]['id'];

export const ROLE_PREVIEW_COURSE_ID: Partial<Record<RolePreviewSurfaceRole, string>> = {
  partner: 'course-partner-client',
  heta_society: 'course-partner-client',
  affiliate: 'course-affiliate',
  agent: 'course-agent',
  admin: 'course-admin-ops',
  business: 'course-business',
};

export function rolePreviewProvisionHint(role: RolePreviewSurfaceRole): string {
  switch (role) {
    case 'partner':
      return 'Create a partner in Partner Management and send a claim link for portal access.';
    case 'business':
      return 'Create a partner with the business lane or route; they use /business/* after login.';
    case 'agent':
      return 'Team & Roles → invite with Credit Specialist access; assign partners for scoped access.';
    case 'affiliate':
      return 'Partner Management with lane=Affiliate, or application via /affiliate.';
    case 'agency':
      return 'Agency signup creates a tenant workspace; assign team seats and white-label settings.';
    case 'case_help':
      return 'Invite case desk seats after approval — scoped to assigned partner matters only.';
    case 'real_estate':
      return 'RE affiliate signup tags interest=real_estate; hub filters the affiliate toolkit.';
    case 'heta_society':
      return 'Generate HOS access keys here, then members redeem at /head-of-society.';
    case 'au_seller':
      return 'AU Sellers → Add seller; they complete verification and payout setup.';
    case 'au_buyer':
      return 'Public marketplace + /au/request intake — no seller tools; track in /au/orders.';
    case 'admin':
      return 'Control Center grants admin/owner; use least privilege for day-to-day ops.';
    default:
      return 'Review routes and contracts before provisioning.';
  }
}

export function rolePreviewLaunchCourse(role: RolePreviewSurfaceRole) {
  const id = ROLE_PREVIEW_COURSE_ID[role];
  return id ? LAUNCH_ROLE_COURSES.find((c) => c.id === id) ?? null : null;
}
