import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calculator,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Rocket,
  Settings2,
  Sparkles,
  Target,
  Users,
  Wallet,
  BookOpen,
  Gavel,
  Scale,
} from 'lucide-react';
import type { PartnerHubLauncherTileProps } from './PartnerHubLauncherTile';
import type { PartnerHubLauncherAccent } from './partnerHubLauncherUi';
import { CASE_HELP } from '../../config/caseHelpProgram';

export type BusinessProfileLauncherId = 'entity' | 'fundability' | 'enterprise' | 'shortcuts';
export type AffiliateHubLauncherId = 'overview' | 'calculator' | 'denefits' | 'payouts' | 'training' | 'operate';
export type CaseHelpHubLauncherId = 'overview' | 'matters' | 'letters' | 'training' | 'operate';
export type AgentHubLauncherId = 'overview' | 'economics' | 'growth' | 'communications' | 'setup' | 'operate';
export type AgencyHubLauncherId = 'overview' | 'partners' | 'letters' | 'team' | 'payouts' | 'training';
export type AuSellerHubLauncherId = 'overview' | 'marketplace' | 'economics' | 'training' | 'operate';
export type RealEstateHubLauncherId = 'overview' | 'referrals' | 'playbook' | 'training' | 'operate';
export type BusinessDashboardLauncherId = 'overview' | 'modules' | 'readiness' | 'workflow';

type TileDef<T extends string> = Omit<PartnerHubLauncherTileProps<T>, 'onOpen'>;

function tile<T extends string>(def: TileDef<T>): TileDef<T> {
  return def;
}

/** Map legacy ?tab= query values to launcher modal ids. */
export const AFFILIATE_TAB_TO_LAUNCHER: Record<string, AffiliateHubLauncherId> = {
  overview: 'overview',
  calculator: 'calculator',
  denefits: 'denefits',
  payouts: 'payouts',
  training: 'training',
  operate: 'operate',
};

export const CASE_HELP_TAB_TO_LAUNCHER: Record<string, CaseHelpHubLauncherId> = {
  overview: 'overview',
  matters: 'matters',
  letters: 'letters',
  training: 'training',
  operate: 'operate',
};

export const AGENT_TAB_TO_LAUNCHER: Record<string, AgentHubLauncherId> = {
  overview: 'overview',
  economics: 'economics',
  growth: 'growth',
  communications: 'communications',
  setup: 'setup',
  training: 'setup',
  command: 'operate',
  operate: 'operate',
};

export const AGENCY_TAB_TO_LAUNCHER: Record<string, AgencyHubLauncherId> = {
  overview: 'overview',
  partners: 'partners',
  letters: 'letters',
  team: 'team',
  payouts: 'payouts',
  training: 'training',
};

export const AU_SELLER_TAB_TO_LAUNCHER: Record<string, AuSellerHubLauncherId> = {
  overview: 'overview',
  marketplace: 'marketplace',
  economics: 'economics',
  training: 'training',
  operate: 'operate',
};

export const REAL_ESTATE_TAB_TO_LAUNCHER: Record<string, RealEstateHubLauncherId> = {
  overview: 'overview',
  referrals: 'referrals',
  playbook: 'playbook',
  training: 'training',
  operate: 'operate',
};

export const BUSINESS_DASHBOARD_TAB_TO_LAUNCHER: Record<string, BusinessDashboardLauncherId> = {
  overview: 'overview',
  actions: 'modules',
  modules: 'modules',
  readiness: 'readiness',
  workflow: 'workflow',
};

export function buildBusinessProfileLauncherTiles(input: {
  hasPartner: boolean;
  businessName?: string;
  entityState?: string;
}): TileDef<BusinessProfileLauncherId>[] {
  const entityLabel = input.businessName?.trim() || 'Entity profile';
  const stateHint = input.entityState?.trim() ? `${input.entityState.toUpperCase()} entity` : 'EIN + address';

  return [
    tile({
      id: 'entity',
      label: 'Entity profile',
      description: 'Legal name, EIN, business type, address, and domain email — the identity layer funders verify first.',
      stat: input.hasPartner ? entityLabel : 'Sign in to save',
      icon: Building2,
      accent: 'violet',
    }),
    tile({
      id: 'fundability',
      label: 'Fundability path',
      description: 'Recommended vendor sequence and underwriting blockers before you apply for capital.',
      stat: stateHint,
      icon: Target,
      accent: 'emerald',
    }),
    tile({
      id: 'enterprise',
      label: 'Enterprise fields',
      description: 'Underwriting readiness, monitoring credentials, and letter-ready identity data.',
      stat: 'Custom profile fields',
      icon: FileText,
      accent: 'rose',
    }),
    tile({
      id: 'shortcuts',
      label: 'Business portal',
      description: 'Jump to vendors, bureaus, lender logic, documents, and disputes — without leaving profile context.',
      stat: '4 portal lanes',
      icon: Rocket,
      accent: 'sky',
    }),
  ];
}

export function buildAffiliateHubLauncherTiles(input: {
  commissionPct: number;
  recurringPct: number;
  status?: string;
  hasReferralCode: boolean;
  campaignCount: number;
}): TileDef<AffiliateHubLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'Command strip, referral toolkit, pitch deck, co-marketing kit, and workflow checklist.',
      stat: input.hasReferralCode ? 'Link ready' : 'Finish profile',
      icon: Sparkles,
      accent: 'sky',
      badge: input.hasReferralCode ? 'Active' : undefined,
    }),
    tile({
      id: 'calculator',
      label: 'Payout calculator',
      description: 'Model commissions and optimize package mix before you pitch partners.',
      stat: `${input.commissionPct}% front · ${input.recurringPct}% recurring`,
      icon: Calculator,
      accent: 'violet',
    }),
    tile({
      id: 'denefits',
      label: 'Denefit share',
      description: 'Contract calculator and enrollment for benefits revenue on referred partners.',
      stat: 'Benefits lane',
      icon: Wallet,
      accent: 'emerald',
    }),
    tile({
      id: 'payouts',
      label: 'Payouts',
      description: 'Pending, paid, and payout history tied to your affiliate seat.',
      stat: input.status ?? '—',
      icon: Wallet,
      accent: 'violet',
    }),
    tile({
      id: 'training',
      label: 'Training',
      description: 'Referral playbook, academy tracks, and conversion scripts.',
      stat: 'Affiliate academy',
      icon: GraduationCap,
      accent: 'sky',
    }),
    tile({
      id: 'operate',
      label: 'Operate',
      description: 'Campaigns, automation, promo matrix, and day-to-day affiliate workflow links.',
      stat: `${input.campaignCount} campaign${input.campaignCount === 1 ? '' : 's'}`,
      icon: Megaphone,
      accent: 'fuchsia',
    }),
  ];
}

export function buildCaseHelpHubLauncherTiles(input: {
  assignedCount: number;
  roleLabel: string;
}): TileDef<CaseHelpHubLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'Role command center, case desk tools, and you-run / Finely-runs split.',
      stat: input.roleLabel,
      icon: Sparkles,
      accent: 'fuchsia',
    }),
    tile({
      id: 'matters',
      label: 'Assigned matters',
      description: 'Partner files in your scope — debt timelines, cases, and partner management.',
      stat: `${input.assignedCount} assigned`,
      icon: Users,
      accent: 'sky',
      badge: input.assignedCount > 0 ? 'In scope' : undefined,
    }),
    tile({
      id: 'letters',
      label: 'Packets & letters',
      description: 'Letter studio, evidence vault, and templates for assigned partners only.',
      stat: 'Non-attorney scope',
      icon: FileText,
      accent: 'violet',
    }),
    tile({
      id: 'training',
      label: 'Training',
      description: 'Case desk handbook tracks — debt, validation, and packet assembly.',
      stat: 'Specialist academy',
      icon: BookOpen,
      accent: 'emerald',
    }),
    tile({
      id: 'operate',
      label: 'Operate',
      description: 'Messages, calendar, guide, and quick links for day-to-day case desk ops.',
      stat: 'Case desk line',
      icon: LayoutDashboard,
      accent: 'sky',
    }),
  ];
}

export function buildAgentHubLauncherTiles(input: {
  keepPct: number;
  partnerCount: number;
  openTasks: number;
  trainingPhase: string;
  hasOperatingModel: boolean;
}): TileDef<AgentHubLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'Caseload preview, specialist tools, offerings, workflow, and operating model snapshot.',
      stat: `${input.partnerCount} partner${input.partnerCount === 1 ? '' : 's'}`,
      icon: Sparkles,
      accent: 'emerald',
    }),
    tile({
      id: 'economics',
      label: 'Economics & payouts',
      description: 'Revenue split calculator, Denefit share, enrollment, and payout center.',
      stat: `${input.keepPct}% keep`,
      icon: Calculator,
      accent: 'violet',
    }),
    tile({
      id: 'growth',
      label: 'Lead growth',
      description: 'Capture leads, pitch packages, and grow your assigned partner caseload.',
      stat: input.partnerCount === 0 ? 'First lead' : 'Caseload active',
      icon: Target,
      accent: 'emerald',
    }),
    tile({
      id: 'communications',
      label: 'Partnership line',
      description: 'Message Finely ops, escalations, and partner comms from one panel.',
      stat: `${input.openTasks} open task${input.openTasks === 1 ? '' : 's'}`,
      icon: MessageSquare,
      accent: 'fuchsia',
    }),
    tile({
      id: 'setup',
      label: 'Setup & training',
      description: 'White-label configuration, tier upgrades, and academy progress.',
      stat: input.hasOperatingModel ? input.trainingPhase : 'Configure model',
      icon: Settings2,
      accent: 'sky',
    }),
    tile({
      id: 'operate',
      label: 'Operate',
      description: 'Full caseload, command center, and day-to-day partner file tools.',
      stat: 'Partner files',
      icon: Users,
      accent: 'emerald',
    }),
  ];
}

export function buildAgencyHubLauncherTiles(input: {
  tenantLive: boolean;
  seatCount: number;
  whiteLabel: boolean;
  roleLabel: string;
}): TileDef<AgencyHubLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'Command center, agency tools, workflow, and you-run / Finely-runs split.',
      stat: input.tenantLive ? 'Tenant live' : 'Setup',
      icon: Sparkles,
      accent: 'rose',
    }),
    tile({
      id: 'partners',
      label: 'Partners',
      description: 'Route partner files — restore, debt, and build lanes inside your tenant.',
      stat: 'Partner files',
      icon: Users,
      accent: 'sky',
      badge: 'Primary',
    }),
    tile({
      id: 'letters',
      label: 'Letters',
      description: 'Letter studio, template library, and evidence vault for partner files.',
      stat: 'Studio + vault',
      icon: FileText,
      accent: 'violet',
    }),
    tile({
      id: 'team',
      label: 'Team & seats',
      description: 'Invite operators and assign partner scope from Team & Roles.',
      stat: `${input.seatCount || 1} seat${input.seatCount === 1 ? '' : 's'}`,
      icon: Building2,
      accent: 'emerald',
    }),
    tile({
      id: 'payouts',
      label: 'Payouts',
      description: 'Keep % center and payout history for agency partner volume.',
      stat: input.roleLabel,
      icon: Wallet,
      accent: 'violet',
    }),
    tile({
      id: 'training',
      label: 'Training',
      description: 'Agency launch tracks and academy progress for operators.',
      stat: input.whiteLabel ? 'White-label' : 'Finely brand',
      icon: GraduationCap,
      accent: 'sky',
    }),
  ];
}

export function buildAuSellerHubLauncherTiles(input: {
  listingsCount: number;
  verified: boolean;
  hasSellerProfile: boolean;
}): TileDef<AuSellerHubLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'Activation, command strip, tools, offerings, and seller workflow.',
      stat: `${input.listingsCount} listing${input.listingsCount === 1 ? '' : 's'}`,
      icon: Sparkles,
      accent: 'violet',
    }),
    tile({
      id: 'marketplace',
      label: 'Marketplace',
      description: 'Share your shelf and manage partner-facing tradeline inventory.',
      stat: input.verified ? 'Verified' : 'Pending KYC',
      icon: Megaphone,
      accent: 'sky',
      badge: input.listingsCount > 0 ? 'Live' : undefined,
    }),
    tile({
      id: 'economics',
      label: 'Economics & payouts',
      description: 'Placement fees, Denefit share, and payout center.',
      stat: 'Fees + benefits',
      icon: Wallet,
      accent: 'emerald',
    }),
    tile({
      id: 'training',
      label: 'Training',
      description: 'Tradeline seller academy and fulfillment playbook.',
      stat: 'AU seller track',
      icon: GraduationCap,
      accent: 'sky',
    }),
    tile({
      id: 'operate',
      label: 'Operate',
      description: 'Listings, contracts, automation, and day-to-day seller ops.',
      stat: input.hasSellerProfile ? 'Active' : 'Setup profile',
      icon: LayoutDashboard,
      accent: 'fuchsia',
    }),
  ];
}

export function buildRealEstateHubLauncherTiles(input: {
  hasReferralCode: boolean;
  affiliateStatus?: string;
}): TileDef<RealEstateHubLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'Command center, RE tools, workflow, and you-run / Finely-runs split.',
      stat: input.hasReferralCode ? 'Code live' : 'Finish profile',
      icon: Sparkles,
      accent: 'emerald',
    }),
    tile({
      id: 'referrals',
      label: 'Referrals',
      description: 'Tracked handoff links for restore, score roadmap, and AU education.',
      stat: input.hasReferralCode ? 'Ready' : 'Setup',
      icon: Target,
      accent: 'violet',
      badge: input.hasReferralCode ? 'Primary' : undefined,
    }),
    tile({
      id: 'playbook',
      label: 'Playbook',
      description: 'Underwriting readiness — AU / DTI / rescore levers for RE partners.',
      stat: 'Lender-dependent',
      icon: BookOpen,
      accent: 'sky',
    }),
    tile({
      id: 'training',
      label: 'Training',
      description: 'RE operator handbook and affiliate academy tracks.',
      stat: 'Operator guide',
      icon: GraduationCap,
      accent: 'sky',
    }),
    tile({
      id: 'operate',
      label: 'Operate',
      description: 'Full affiliate hub, messages, and day-to-day RE affiliate links.',
      stat: input.affiliateStatus ?? '—',
      icon: LayoutDashboard,
      accent: 'fuchsia',
    }),
  ];
}

export function buildBusinessDashboardLauncherTiles(input: {
  foundationPct: number;
  roadmapDone: number;
  vendorTierDone: boolean;
  fundingReady: boolean;
}): TileDef<BusinessDashboardLauncherId>[] {
  return [
    tile({
      id: 'overview',
      label: 'Overview',
      description: 'How fundability is built — foundation, sequencing, and capital path.',
      stat: `${input.foundationPct}% foundation`,
      icon: Sparkles,
      accent: 'sky',
    }),
    tile({
      id: 'modules',
      label: 'Modules',
      description: 'Profile, vendors, bureaus, lender logic, capital, and disputes workstations.',
      stat: '6 modules',
      icon: Rocket,
      accent: 'fuchsia',
    }),
    tile({
      id: 'readiness',
      label: 'Readiness',
      description: 'Credit ladder, roadmap progress, and foundation checklist.',
      stat: `${input.roadmapDone}/10 roadmap`,
      icon: Target,
      accent: 'emerald',
      badge: input.vendorTierDone ? 'Tier 1+' : undefined,
    }),
    tile({
      id: 'workflow',
      label: 'Workflow',
      description: 'Business credit workflow checklist and next-step guidance.',
      stat: input.fundingReady ? 'Capital ready' : 'Building',
      icon: Settings2,
      accent: 'violet',
    }),
  ];
}

/** Accent hint for PartnerHubWorkModal per launcher id. */
export const ROLE_HUB_MODAL_ACCENT: Record<string, PartnerHubLauncherAccent> = {
  entity: 'violet',
  fundability: 'emerald',
  enterprise: 'rose',
  shortcuts: 'sky',
  overview: 'sky',
  calculator: 'violet',
  denefits: 'emerald',
  payouts: 'violet',
  training: 'sky',
  operate: 'fuchsia',
  matters: 'sky',
  letters: 'violet',
  economics: 'violet',
  growth: 'emerald',
  communications: 'fuchsia',
  setup: 'sky',
  partners: 'sky',
  team: 'emerald',
  marketplace: 'violet',
  referrals: 'violet',
  playbook: 'sky',
  modules: 'fuchsia',
  readiness: 'emerald',
  workflow: 'violet',
};

export const CASE_HELP_MODAL_ICONS: Record<CaseHelpHubLauncherId, LucideIcon> = {
  overview: Sparkles,
  matters: Users,
  letters: FileText,
  training: BookOpen,
  operate: LayoutDashboard,
};

export const CASE_HELP_TOOL_DECK = [
  { id: 'matters', label: 'Matters', detail: 'Assigned partners only', path: `${CASE_HELP.hubPath}?tab=matters`, icon: Users, accent: 'fuchsia' as const, badge: 'Primary' },
  { id: 'debt', label: 'Debt desk', detail: 'Summons & timelines', path: '/portal/debt', icon: Gavel, accent: 'rose' as const },
  { id: 'letters', label: 'Letters', detail: 'Packets & studio', path: '/portal/letters', icon: FileText, accent: 'violet' as const },
  { id: 'cases', label: 'Cases', detail: 'Scoped case board', path: '/admin/cases', icon: Scale, accent: 'sky' as const },
  { id: 'guide', label: 'Guide', detail: 'Case desk handbook', path: CASE_HELP.guideReadPath, icon: BookOpen, accent: 'emerald' as const },
  { id: 'line', label: 'Case desk line', detail: 'Message Finely', path: CASE_HELP.messagesDeepLink, icon: MessageSquare, accent: 'sky' as const },
];

export const CASE_HELP_QUICK_LINKS = [
  { label: 'Debt desk', path: '/portal/debt', icon: Gavel },
  { label: 'Cases', path: '/admin/cases', icon: Scale },
] as const;
