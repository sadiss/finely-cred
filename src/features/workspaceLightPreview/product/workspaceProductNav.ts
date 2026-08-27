import {
  Activity,
  Album,
  BadgeDollarSign,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Building2,
  Calendar,
  ClipboardCheck,
  Clapperboard,
  Coins,
  CreditCard,
  Crown,
  Cross,
  Currency,
  FileCheck2,
  FileSearch,
  FileText,
  FlaskConical,
  FolderOpen,
  Gavel,
  GitBranch,
  Globe2,
  GraduationCap,
  Handshake,
  Headphones,
  Home,
  Inbox,
  KeySquare,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  LibraryBig,
  LineChart,
  ListChecks,
  Mail,
  Map,
  MessageSquare,
  Megaphone,
  Mic,
  Monitor,
  Network,
  Newspaper,
  Package,
  Palette,
  PhoneCall,
  Plug,
  Radar,
  Repeat,
  Route,
  ScrollText,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SquareStack,
  Star,
  Store,
  Target,
  TrendingUp,
  Truck,
  UserCog,
  UserPlus,
  Users,
  Vault,
  Video,
  Wallet,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ENTITLEMENT_KEYS } from '../../../billing/entitlements';
import { AF } from '../../../config/affiliateProgram';
import { AGENCY } from '../../../config/agencyPartnersProgram';
import { CASE_HELP } from '../../../config/caseHelpProgram';
import { CS } from '../../../config/creditSpecialistProgram';
import { RE } from '../../../config/realEstateProgram';
import type { WorkspaceProductAccent, WorkspaceProductRole } from './workspaceProductTokens';

export type WorkspaceProductSurfaceMode = 'light' | 'studio';

/**
 * Partner service lines. These mirror `CLIENT_SERVICE_OPTIONS` in `src/lib/partnerInviteRouting.ts`
 * and the access bundles in `src/billing/entitlements.ts` — this module is the navigation view of
 * that same model, not a second source of truth.
 *
 * `workspace` is the cross-service lane (home, messages, documents) that every partner sees.
 */
export type PartnerServiceLineId =
  | 'workspace'
  | 'restore'
  | 'build'
  | 'business'
  | 'tradelines'
  | 'funding'
  | 'debt'
  | 'programs';

export type PartnerServiceLine = {
  id: PartnerServiceLineId;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: WorkspaceProductAccent;
  /** Partner needs at least one of these to own the lane. Empty means always available. */
  entitlementAnyOf: string[];
  /** Where "open this service" lands when unlocked. */
  landingPath: string;
  /** Shown when the lane is locked, so partners see value instead of a missing menu. */
  upsellHeadline: string;
  upsellPath: string;
};

export const PARTNER_SERVICE_LINES: PartnerServiceLine[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Home, messages, documents, and everything shared across your services.',
    icon: LayoutDashboard,
    accent: 'graphite',
    entitlementAnyOf: [],
    landingPath: '/portal/dashboard',
    upsellHeadline: '',
    upsellPath: '',
  },
  {
    id: 'restore',
    label: 'Personal Credit Restore',
    description: 'Reports, findings, disputes, and the letters that move them.',
    icon: ShieldCheck,
    accent: 'emerald',
    entitlementAnyOf: [ENTITLEMENT_KEYS.disputes, ENTITLEMENT_KEYS.letters],
    landingPath: '/portal/checklist',
    upsellHeadline: 'Challenge inaccurate accounts with evidence-backed letters.',
    upsellPath: '/pricing/personal-credit',
  },
  {
    id: 'build',
    label: 'Personal Credit Build',
    description: 'Build positive history, optimize utilization, and grow a thin file.',
    icon: TrendingUp,
    accent: 'violet',
    entitlementAnyOf: [
      'personal_build_starter',
      'personal_build_pro',
      'personal_build_elite',
      ENTITLEMENT_KEYS.businessBuild,
    ],
    landingPath: '/portal/build',
    upsellHeadline: 'Turn a thin file into a lendable profile with a sequenced build plan.',
    upsellPath: '/pricing/personal-credit-building',
  },
  {
    id: 'business',
    label: 'Business Credit',
    description: 'Entity fundability, vendor tiers, business bureaus, and disputes.',
    icon: Building2,
    accent: 'sky',
    entitlementAnyOf: [ENTITLEMENT_KEYS.businessBuild],
    landingPath: '/business/dashboard',
    upsellHeadline: 'Build business credit that stands on the entity, not your personal file.',
    upsellPath: '/pricing/business-credit',
  },
  {
    id: 'tradelines',
    label: 'Tradelines & AUs',
    description: 'Authorized user placements, primary tradelines, and order tracking.',
    icon: Store,
    accent: 'violet',
    entitlementAnyOf: [ENTITLEMENT_KEYS.auSeller],
    landingPath: '/portal/tradelines',
    upsellHeadline: 'Strengthen your profile with compliant authorized user placements.',
    upsellPath: '/tradelines',
  },
  {
    id: 'funding',
    label: 'Funding Readiness',
    description: 'Capital target, lender alignment, blockers, and wealth paths.',
    icon: Target,
    accent: 'sky',
    entitlementAnyOf: [],
    landingPath: '/portal/wealth-paths',
    upsellHeadline: 'See exactly what lenders need before you apply.',
    upsellPath: '/fundability-readiness',
  },
  {
    id: 'debt',
    label: 'Debt & Court',
    description: 'Validation, summons response, escalations, and court workflow.',
    icon: Gavel,
    accent: 'rose',
    entitlementAnyOf: [ENTITLEMENT_KEYS.debt, ENTITLEMENT_KEYS.escalations],
    landingPath: '/portal/debt',
    upsellHeadline: 'Answer collectors and summons with deadline-aware guidance.',
    upsellPath: '/debt-summons-help',
  },
  {
    id: 'programs',
    label: 'Programs & careers',
    description: 'Specialist, affiliate, agency, case desk, real estate, and HOS member hubs.',
    icon: Handshake,
    accent: 'violet',
    entitlementAnyOf: [],
    landingPath: CS.hubPath,
    upsellHeadline: '',
    upsellPath: '',
  },
];

export function getPartnerServiceLine(id: PartnerServiceLineId): PartnerServiceLine {
  return PARTNER_SERVICE_LINES.find((line) => line.id === id) ?? PARTNER_SERVICE_LINES[0];
}

/**
 * Admin operating lines. The admin side has far more destinations than the partner side, so a flat
 * list buried most of the platform. Grouping by what the work IS — delivery, growth, studio,
 * finance, team, platform — is what lets every page have a menu entry without the menu becoming
 * unreadable.
 */
export type AdminServiceLineId =
  | 'command'
  | 'delivery'
  | 'growth'
  | 'studio'
  | 'finance'
  | 'team'
  | 'platform';

export type AdminServiceLine = {
  id: AdminServiceLineId;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: WorkspaceProductAccent;
};

export const ADMIN_SERVICE_LINES: AdminServiceLine[] = [
  {
    id: 'command',
    label: 'Command',
    description: 'Today’s priorities, your queue, and everything waiting on a decision.',
    icon: LayoutDashboard,
    accent: 'violet',
  },
  {
    id: 'delivery',
    label: 'Partner delivery',
    description: 'Partner files, cases, disputes, letters, and the service clock.',
    icon: ShieldCheck,
    accent: 'emerald',
  },
  {
    id: 'growth',
    label: 'Growth',
    description: 'Leads, CRM, campaigns, funnels, and acquisition experiments.',
    icon: TrendingUp,
    accent: 'sky',
  },
  {
    id: 'studio',
    label: 'Content studio',
    description: 'Courses, media, voice, tours, guides, and everything published.',
    icon: Clapperboard,
    accent: 'rose',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Revenue, billing, products, vendors, and capital allocation.',
    icon: Coins,
    accent: 'emerald',
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Staff, roles, capacity, coaching, and access control.',
    icon: Users,
    accent: 'violet',
  },
  {
    id: 'platform',
    label: 'Platform',
    description: 'Settings, analytics, integrations, automation, and system health.',
    icon: Settings,
    accent: 'graphite',
  },
];

export function getAdminServiceLine(id: AdminServiceLineId): AdminServiceLine {
  return ADMIN_SERVICE_LINES.find((line) => line.id === id) ?? ADMIN_SERVICE_LINES[0];
}

export type WorkspaceProductServiceId = PartnerServiceLineId | AdminServiceLineId;

export type WorkspaceProductNavItem = {
  id: string;
  label: string;
  path: string;
  /** Compatibility alias used by existing surface actions; now resolves to the redesigned product page. */
  livePath: string;
  /** Legacy route retained for migration diagnostics, never used as the primary product action. */
  legacyPath?: string;
  icon: LucideIcon;
  accent: WorkspaceProductAccent;
  description: string;
  role: WorkspaceProductRole;
  group: 'primary' | 'secondary';
  surfaceMode: WorkspaceProductSurfaceMode;
  /** Which service/operating line this destination belongs to. */
  service: WorkspaceProductServiceId;
};

function admin(
  id: string,
  label: string,
  legacyPath: string,
  icon: LucideIcon,
  accent: WorkspaceProductAccent,
  description: string,
  service: AdminServiceLineId,
  group: WorkspaceProductNavItem['group'] = 'primary',
  surfaceMode: WorkspaceProductSurfaceMode = 'light',
): WorkspaceProductNavItem {
  const path = `/preview/workspace-light/admin/${id}`;
  return {
    id,
    label,
    livePath: path,
    legacyPath,
    path,
    icon,
    accent,
    description,
    role: 'admin',
    group,
    surfaceMode,
    service,
  };
}

function partner(
  id: string,
  label: string,
  legacyPath: string,
  icon: LucideIcon,
  accent: WorkspaceProductAccent,
  description: string,
  service: PartnerServiceLineId,
  group: WorkspaceProductNavItem['group'] = 'primary',
  surfaceMode: WorkspaceProductSurfaceMode = 'light',
): WorkspaceProductNavItem {
  const path = `/preview/workspace-light/portal/${id}`;
  return {
    id,
    label,
    livePath: path,
    legacyPath,
    path,
    icon,
    accent,
    description,
    role: 'partner',
    group,
    surfaceMode,
    service,
  };
}

export const ADMIN_PRODUCT_NAV: WorkspaceProductNavItem[] = [
  // ---- Command: what needs a decision today. These are the top-bar destinations.
  admin('dashboard', 'Command center', '/admin', LayoutDashboard, 'violet', 'Today’s priorities, service risk, and platform movement.', 'command'),
  admin('partners', 'Partners', '/admin/partners', Users, 'emerald', 'Partner profiles, progress, reports, and next actions.', 'delivery'),
  admin('workflow', 'Work queue', '/admin/workflow', Inbox, 'rose', 'Owned work, due dates, blockers, and service clocks.', 'command', 'primary', 'studio'),
  admin('crm', 'Leads & CRM', '/admin/crm', Target, 'sky', 'Qualified leads, outreach, and relationship pipeline.', 'growth'),
  admin('communications', 'Communications', '/admin/comms', Mail, 'violet', 'Partner conversations, meetings, and response queues.', 'delivery', 'primary', 'studio'),
  admin('marketing', 'Marketing', '/admin/marketing', Megaphone, 'emerald', 'Campaign work, content, and conversion signals.', 'growth', 'primary', 'studio'),
  admin('cases', 'Cases', '/admin/cases', Gavel, 'rose', 'Open cases, dispute rounds, evidence, and outcomes.', 'delivery', 'primary', 'studio'),
  admin('projects', 'Projects', '/admin/projects', BriefcaseBusiness, 'emerald', 'Delivery projects, stages, and owners.', 'delivery'),
  admin('my-tasks', 'My tasks', '/admin/my-tasks', ListChecks, 'violet', 'Your personal queue, including voice-captured tasks.', 'command'),
  admin('staff', 'Staff', '/admin/staff', BriefcaseBusiness, 'sky', 'Team capacity, assignments, coaching, and quality.', 'team'),
  admin('analytics', 'Analytics', '/admin/analytics', BarChart3, 'emerald', 'Service trends, outcomes, and operating health.', 'platform', 'primary', 'studio'),

  // ---- Command (secondary)
  admin('tasks', 'All tasks', '/admin/tasks', ClipboardCheck, 'emerald', 'Every task across the platform, by owner and due date.', 'command', 'secondary'),
  admin('inbox', 'Inbox', '/admin/inbox', Inbox, 'sky', 'Unified operational inbox and triage.', 'command', 'secondary'),
  admin('support', 'Partner conversations', '/admin/support', Headphones, 'rose', 'Inbound partner support threads and response SLAs.', 'command', 'secondary'),
  admin('notifications', 'Notifications', '/admin/notifications', Bell, 'violet', 'System alerts, escalations, and delivery warnings.', 'command', 'secondary'),
  admin('workload', 'Workload', '/admin/workload', Activity, 'emerald', 'Capacity heatmap across staff and service lines.', 'command', 'secondary'),

  // ---- Partner delivery
  admin('partners-import', 'Partner import', '/admin/partners/import', UserPlus, 'sky', 'Bulk onboard partners and map incoming records.', 'delivery', 'secondary'),
  admin('mail', 'Mail letters', '/admin/mail', FileText, 'violet', 'Review, approve, and fulfill partner letters.', 'delivery', 'secondary', 'studio'),
  admin('dispute-collaboration', 'Dispute collaboration', '/admin/dispute-collaboration', Handshake, 'emerald', 'Shared dispute workspace between specialists and partners.', 'delivery', 'secondary', 'studio'),
  admin('parsing-lab', 'Parsing lab', '/admin/parsing-lab', FlaskConical, 'sky', 'Credit report parsing diagnostics and extraction QA.', 'delivery', 'secondary', 'studio'),
  admin('compliance-review', 'Compliance review', '/admin/compliance-review', Shield, 'rose', 'Letter and claim review before anything leaves the building.', 'delivery', 'secondary'),
  admin('partner-success', 'Success content editor', '/admin/partner-success', Star, 'emerald', 'Edit success modules, milestones, and training links.', 'delivery', 'secondary'),
  admin('calendar', 'Calendar', '/admin/calendar', Calendar, 'violet', 'Sessions, meetings, and team scheduling.', 'delivery', 'secondary'),
  admin('phone-hub', 'Phone hub', '/admin/phone-hub', PhoneCall, 'sky', 'Call routing, logs, and voice touchpoints.', 'delivery', 'secondary'),
  admin('projects-portfolio', 'Project portfolio', '/admin/projects/portfolio', SquareStack, 'violet', 'Portfolio-level view of every active project.', 'delivery', 'secondary', 'studio'),
  admin('projects-templates', 'Project templates', '/admin/projects/templates', LayoutTemplate, 'sky', 'Reusable project blueprints for repeatable delivery.', 'delivery', 'secondary'),
  admin('playbooks', 'Playbooks', '/admin/playbooks', ScrollText, 'rose', 'Standard operating procedures and guided plays.', 'delivery', 'secondary'),

  // ---- Growth
  admin('crm-referrals', 'Referrals', '/admin/crm/referrals', Share2, 'emerald', 'Referral partners, attribution, and payouts.', 'growth', 'secondary'),
  admin('crm-routing', 'Lead routing', '/admin/crm/routing', Route, 'violet', 'Rules that decide who owns an inbound lead.', 'growth', 'secondary'),
  admin('crm-sequences', 'Sequences', '/admin/crm/sequences', Repeat, 'sky', 'Automated outreach sequences and follow-up cadences.', 'growth', 'secondary'),
  admin('leads', 'Leads', '/admin/leads', Target, 'rose', 'Raw inbound lead flow and qualification state.', 'growth', 'secondary'),
  admin('leads-os', 'Leads OS', '/admin/leads-os', Radar, 'emerald', 'Operating view of lead sources, quality, and velocity.', 'growth', 'secondary', 'studio'),
  admin('lead-acquisition', 'Lead acquisition', '/admin/lead-acquisition', Network, 'violet', 'Channel spend, sourcing, and acquisition economics.', 'growth', 'secondary', 'studio'),
  admin('lead-intel', 'Lead intel', '/admin/lead-intel', FileSearch, 'sky', 'Enrichment and research on inbound prospects.', 'growth', 'secondary'),
  admin('lead-magnets', 'Lead magnets', '/admin/lead-magnets', Sparkles, 'emerald', 'Guides and funnels that capture new partners.', 'growth', 'secondary'),
  admin('marketing-desk', 'Marketing desk', '/admin/marketing-desk', Newspaper, 'violet', 'Day-to-day campaign execution desk.', 'growth', 'secondary', 'studio'),
  admin('cmo', 'Marketing director', '/admin/cmo', Crown, 'rose', 'Strategy view of positioning, spend, and pipeline.', 'growth', 'secondary', 'studio'),
  admin('growth-command', 'Growth command', '/admin/growth-command', TrendingUp, 'emerald', 'Growth targets, experiments, and weekly movement.', 'growth', 'secondary', 'studio'),
  admin('growth-agents', 'Growth agents', '/admin/growth-agents', Bot, 'violet', 'Automated growth workers and their assignments.', 'growth', 'secondary', 'studio'),
  admin('growth-automation', 'Growth automation', '/admin/growth-automation', Workflow, 'sky', 'Triggered growth workflows and lifecycle automation.', 'growth', 'secondary'),
  admin('funnel-experiments', 'Funnel experiments', '/admin/funnel-experiments', GitBranch, 'rose', 'A/B tests and conversion experiments in flight.', 'growth', 'secondary', 'studio'),
  admin('geo-war-room', 'Geo war room', '/admin/geo-war-room', Map, 'emerald', 'Market-by-market performance and expansion targets.', 'growth', 'secondary', 'studio'),
  admin('social-hub', 'Social hub', '/admin/social-hub', Globe2, 'violet', 'Social publishing, scheduling, and engagement.', 'growth', 'secondary', 'studio'),
  admin('signup-ops', 'Signup ops', '/admin/signup-ops', UserPlus, 'sky', 'Registration funnel health and activation drop-off.', 'growth', 'secondary'),
  admin('testimonials', 'Testimonials', '/admin/testimonials', Star, 'emerald', 'Partner wins, approvals, and published proof.', 'growth', 'secondary'),

  // ---- Content studio
  admin('content-studio', 'Content studio', '/admin/content-studio', Palette, 'violet', 'Long-form content production and publishing pipeline.', 'studio', 'secondary', 'studio'),
  admin('media-studio', 'Media studio', '/admin/media-studio', Clapperboard, 'rose', 'Video, image, and creative asset production.', 'studio', 'secondary', 'studio'),
  admin('voice-studio', 'Voice studio', '/admin/voice-studio', Mic, 'emerald', 'Voice scripts, narration, and audio asset generation.', 'studio', 'secondary', 'studio'),
  admin('tour-studio', 'Tour studio', '/admin/tour-studio', Video, 'sky', 'Build the in-app “Watch how” product tours.', 'studio', 'secondary', 'studio'),
  admin('courses', 'Courses', '/admin/courses', GraduationCap, 'violet', 'Course catalog, lessons, and partner progress.', 'studio', 'secondary'),
  admin('bookstore', 'Bookstore', '/admin/bookstore', BookMarked, 'emerald', 'Digital books, bundles, and purchase catalog.', 'studio', 'secondary'),
  admin('resources', 'Resources', '/admin/resources', BookOpen, 'sky', 'Guides, templates, and the partner resource library.', 'studio', 'secondary'),
  admin('cms', 'Site content', '/admin/cms', Album, 'rose', 'Public site pages, copy, and SEO metadata.', 'studio', 'secondary'),
  admin('templates', 'Templates', '/admin/templates', LayoutTemplate, 'emerald', 'Letter, email, and document templates.', 'studio', 'secondary'),
  admin('guide', 'Guide studio', '/admin/guide', BookOpen, 'violet', 'Authoring for in-app guidance and help content.', 'studio', 'secondary'),

  // ---- Finance
  admin('finance', 'Finance', '/admin/finance', Coins, 'emerald', 'Revenue allocation, margin, and financial operations.', 'finance', 'secondary', 'studio'),
  admin('billing', 'Billing', '/admin/billing', Wallet, 'violet', 'Subscriptions, invoices, dunning, and payment health.', 'finance', 'secondary'),
  admin('products', 'Products & pricing', '/admin/products', Package, 'sky', 'Service catalog, plans, entitlements, and pricing.', 'finance', 'secondary'),
  admin('vendors', 'Vendors', '/admin/vendors', Truck, 'rose', 'Supplier accounts, costs, and fulfillment partners.', 'finance', 'secondary'),
  admin('nora-capital', 'Capital', '/admin/nora-capital', BadgeDollarSign, 'emerald', 'Capital programs, funding partners, and deployment.', 'finance', 'secondary', 'studio'),
  admin('au-sellers', 'AU sellers', '/admin/au-sellers', Store, 'violet', 'Authorized user seller accounts, inventory, and payouts.', 'finance', 'secondary'),

  // ---- Team
  admin('agent-staff', 'Specialists', '/admin/agent-staff', UserCog, 'emerald', 'Credit specialist roster, personas, and assignments.', 'team', 'secondary'),
  admin('staff-command-center', 'Staff command', '/admin/staff-command-center', Users, 'violet', 'Live staffing view, shifts, and coverage.', 'team', 'secondary', 'studio'),
  admin('team', 'Roles', '/admin/team', KeySquare, 'sky', 'Role definitions and what each role can reach.', 'team', 'secondary'),
  admin('synthetic-staff', 'AI staff', '/admin/synthetic-staff', Bot, 'rose', 'AI workers, their prompts, and supervision.', 'team', 'secondary', 'studio'),
  admin('access', 'Access center', '/admin/access', Shield, 'emerald', 'Permissions, approvals, and account access review.', 'team', 'secondary'),
  admin('hos-program', 'Head of Society', '/head-of-society', Crown, 'violet', 'HOS program landing, invite keys, and member portal.', 'team', 'secondary'),

  // ---- Platform
  admin('settings', 'Settings', '/admin/settings', Settings, 'graphite', 'Platform, tenant, security, and workflow controls.', 'platform', 'secondary'),
  admin('monitoring', 'Monitoring', '/admin/monitoring', Monitor, 'sky', 'Uptime, error rates, and background job health.', 'platform', 'secondary', 'studio'),
  admin('integrations', 'Integrations', '/admin/integrations', Plug, 'violet', 'Connected services, API keys, and sync status.', 'platform', 'secondary'),
  admin('automations', 'Automations', '/admin/automations', Workflow, 'emerald', 'Platform-wide triggers, rules, and scheduled jobs.', 'platform', 'secondary', 'studio'),
  admin('tenants', 'Tenants', '/admin/tenants', Building2, 'rose', 'Multi-tenant configuration and white-label setup.', 'platform', 'secondary'),
  admin('vault', 'Secret vault', '/admin/vault', Vault, 'rose', 'Credentials and sensitive configuration.', 'platform', 'primary'),
  admin('sitewide-ux', 'Sitewide UX', '/admin/sitewide-ux', Wrench, 'sky', 'Global UX controls, banners, and experience flags.', 'platform', 'secondary', 'studio'),
  admin('role-preview', 'Role preview', '/admin/role-preview', Users, 'violet', 'See the product exactly as any role sees it.', 'platform', 'secondary'),
  admin('analytics-portfolio', 'Portfolio analytics', '/admin/projects/portfolio', LineChart, 'emerald', 'Cross-portfolio outcome and delivery analytics.', 'platform', 'secondary', 'studio'),
];

export const PARTNER_PRODUCT_NAV: WorkspaceProductNavItem[] = [
  // Workspace — shared across every service line.
  partner('dashboard', 'Home', '/portal/dashboard', LayoutDashboard, 'emerald', 'Your next step, progress, readiness, and workspace tools.', 'workspace'),
  partner('messages', 'Messages', '/portal/messages', MessageSquare, 'violet', 'Your specialist, Ask Finely, meetings, and updates.', 'workspace', 'primary', 'studio'),
  partner('documents', 'Documents', '/portal/documents', FolderOpen, 'sky', 'Your own uploads — ID, proof of address, statements, and letters.', 'workspace', 'secondary'),
  partner('projects', 'Projects', '/portal/projects', BriefcaseBusiness, 'violet', 'Active work, due dates, and completed milestones.', 'workspace', 'secondary'),
  partner('my-tasks', 'My tasks', '/portal/my-tasks', ListChecks, 'emerald', 'Your personal to-do queue, including voice-captured tasks.', 'workspace', 'secondary'),
  partner('work', 'Work', '/portal/work', Workflow, 'rose', 'Combined view of everything in motion across your services.', 'workspace', 'secondary', 'studio'),
  partner('calendar', 'Calendar', '/portal/calendar', Calendar, 'emerald', 'Sessions, due dates, and upcoming milestones.', 'workspace', 'secondary'),
  partner('notifications', 'Notifications', '/portal/notifications', Bell, 'violet', 'Updates, approvals needed, and status changes.', 'workspace', 'secondary'),
  partner('billing', 'Billing & plan', '/portal/billing', Wallet, 'sky', 'Your plan, invoices, payment method, and what each service unlocks.', 'workspace', 'secondary'),
  partner('account', 'Account', '/account/settings', Settings, 'violet', 'Profile picture, mailing address, notifications, and preferences.', 'workspace', 'secondary'),

  // Personal Credit Restore.
  // Reports, Evidence, and Documents are deliberately THREE destinations. They were briefly
  // merged, which made Reports look like an evidence page and hid the Analysis Vault entirely.
  // Credit reports are bureau data; evidence is the proof that backs a dispute; documents are
  // the partner's own files. Different jobs, different pages.
  partner('checklist', 'Restore workspace', '/portal/checklist', ListChecks, 'emerald', 'Your complete restore sequence, instructions, tools, and next required step.', 'restore', 'primary', 'studio'),
  partner('reports', 'Credit reports', '/portal/reports', FileText, 'sky', 'Bureau reports, findings, tradelines, and score movement.', 'restore', 'primary', 'studio'),
  partner('evidence', 'Evidence vault', '/portal/evidence', Vault, 'emerald', 'Source exhibits and proof that back every dispute reason.', 'restore', 'primary', 'studio'),
  partner('analysis', 'Strategy reports', '/portal/analysis', FileText, 'violet', 'Saved credit-analysis PDFs generated from your bureau reports.', 'restore', 'secondary', 'studio'),
  partner('disputes', 'Disputes', '/portal/disputes', Gavel, 'rose', 'Rounds, factual findings, statuses, and outcomes.', 'restore'),
  partner('letters', 'Credit letters', '/portal/letters', Mail, 'violet', 'Choose a letter track, build and edit it, review evidence, approve, download, and mail.', 'restore', 'primary', 'studio'),
  partner('letters-vault', 'Letters vault', '/portal/letters/vault', Album, 'sky', 'Saved and sent letters, PDFs, mailing proof, response windows, and history.', 'restore', 'secondary', 'studio'),
  partner('identity', 'Identity theft', '/portal/identity-theft', ShieldAlert, 'rose', 'Freezes, FTC reports, and recovery steps for stolen identity.', 'restore', 'secondary'),
  partner('templates', 'Template library', '/portal/templates', LayoutTemplate, 'violet', 'Reusable letter and document templates you can start from.', 'restore', 'secondary'),

  // Personal Credit Build.
  partner('build', 'Credit building', '/portal/build', TrendingUp, 'violet', 'Sequenced building bundles, utilization, and positive reporting.', 'build', 'secondary'),
  partner('courses', 'Courses', '/portal/courses', GraduationCap, 'sky', 'Structured courses with lessons and progress tracking.', 'build', 'secondary'),
  partner('education', 'Education', '/portal/education', BookOpen, 'emerald', 'Credit education, explainers, and plain-English fundamentals.', 'build', 'secondary'),
  partner('training', 'Training academy', '/portal/training/academy', GraduationCap, 'violet', 'Deeper certification-style training tracks.', 'build', 'secondary'),
  partner('library', 'Library', '/portal/library', LibraryBig, 'rose', 'Books, guides, and bundles available to you.', 'build', 'secondary'),

  // Business Credit.
  partner('business', 'Business credit', '/business/dashboard', Building2, 'violet', 'Entity fundability, tiers, and business credit progress.', 'business', 'secondary'),
  partner('business-profile', 'Business profile', '/business/profile', Landmark, 'emerald', 'Entity details, fundability matrix, and compliance gaps.', 'business', 'secondary'),
  partner('business-vendors', 'Vendor tiers', '/business/vendors', Store, 'violet', 'Vendor sequencing, net-30 accounts, and reporting status.', 'business', 'secondary'),
  partner('business-bureaus', 'Business bureaus', '/business/bureaus', BarChart3, 'sky', 'D&B, Experian Business, and Equifax Business scores and tracking.', 'business', 'secondary'),
  partner('business-disputes', 'Business disputes', '/business/disputes', Gavel, 'rose', 'Negative items, evidence, letters, and bureau dispute rounds.', 'business', 'secondary'),
  partner('business-documents', 'Business documents', '/business/documents', FileCheck2, 'emerald', 'Entity, banking, and compliance artifacts for fundability.', 'business', 'secondary'),
  partner('billion-path', 'Billion Path', '/business/billion-path', Crown, 'violet', 'Entities, documents, relationships, and capital readiness sequencing.', 'funding', 'secondary'),

  // Tradelines and AUs.
  partner('tradelines', 'Tradelines', '/portal/tradelines', CreditCard, 'rose', 'Authorized user and primary tradeline programs.', 'tradelines', 'secondary'),
  partner('au-marketplace', 'AU marketplace', '/au/marketplace', Store, 'sky', 'Browse available authorized user placements.', 'tradelines', 'secondary'),
  partner('au-orders', 'AU orders', '/au/orders', Inbox, 'emerald', 'Placement status, posting dates, and order history.', 'tradelines', 'secondary'),
  partner('au-request', 'Request a placement', '/au/request', UserPlus, 'violet', 'Ask for a specific authorized user placement.', 'tradelines', 'secondary'),
  partner('au-seller', 'Seller dashboard', '/seller/dashboard', Store, 'emerald', 'If you sell placements: inventory, orders, and payouts.', 'tradelines', 'secondary', 'studio'),
  partner('au-seller-cards', 'Seller cards', '/seller/listings', CreditCard, 'sky', 'Cards you have listed and their placement capacity.', 'tradelines', 'secondary'),

  // Funding readiness.
  partner('readiness', 'Goals & readiness', '/portal/wealth-paths', Target, 'sky', 'Capital target, blockers, and lender alignment.', 'funding', 'secondary'),
  partner('lender-logic', 'Lender logic', '/business/lender-logic', Landmark, 'emerald', 'Which lenders fit your profile today, and what still blocks approval.', 'funding', 'secondary'),

  // Debt and court.
  partner('debt', 'Debt & court', '/portal/debt', ShieldCheck, 'rose', 'Validation, deadlines, court workflow, and resources.', 'debt', 'secondary', 'studio'),
  partner('bankruptcy', 'Bankruptcy', '/portal/bankruptcy', Gavel, 'violet', 'Filing tracks, exemptions, and post-filing credit rebuild.', 'debt', 'secondary'),
  partner('escalations', 'Escalations', '/portal/escalations', Megaphone, 'rose', 'CFPB, FTC, BBB, and attorney general complaints.', 'debt', 'secondary'),
  partner('barter', 'Barter & trade', '/portal/barter', Currency, 'emerald', 'Trade services and offset costs through the barter program.', 'debt', 'secondary'),

  // Programs & careers — role hubs (admin role preview + All tools).
  partner('specialist-hub', 'Credit Specialist', CS.hubPath, UserCog, 'rose', 'Assigned partners, tasks, revenue split, and certification steps.', 'programs', 'secondary'),
  partner('affiliate-hub', 'Affiliate', AF.hubPath, Share2, 'violet', 'Referral links, conversions, and commission ledger.', 'programs', 'secondary'),
  partner('agency-hub', 'Agency', AGENCY.hubPath, Building2, 'sky', 'Agency tenant workspace — partners, letters, team, and payouts.', 'programs', 'secondary'),
  partner('case-help-hub', 'Case Help', CASE_HELP.hubPath, Gavel, 'rose', 'Assigned matters desk — debt, letters, and educational packets.', 'programs', 'secondary'),
  partner('real-estate-hub', 'Real estate', RE.hubPath, Home, 'emerald', 'RE-tagged affiliate hub — playbook, handoffs, and score CTA.', 'programs', 'secondary'),
  partner('hos-hub', 'Head of Society', '/portal/hos', Cross, 'rose', 'HOS member portal — dispute slots, business starter, and growth paths.', 'programs', 'secondary'),
];

export function getWorkspaceProductNav(role: WorkspaceProductRole) {
  return role === 'admin' ? ADMIN_PRODUCT_NAV : PARTNER_PRODUCT_NAV;
}

export function getWorkspaceProductNavItem(role: WorkspaceProductRole, id: string | undefined) {
  return getWorkspaceProductNav(role).find((item) => item.id === id);
}

export type WorkspaceProductNavGroup = {
  line: PartnerServiceLine | AdminServiceLine;
  items: WorkspaceProductNavItem[];
  /** False when the partner owns none of the lane's entitlements. Admin lines are always unlocked. */
  unlocked: boolean;
};

/**
 * Group secondary destinations by service line so the "All tools" drawer shows every service the
 * business sells, rather than a flat list that silently favours the restore lane.
 *
 * `hasKey` is injected so this module stays free of billing/store imports; pass
 * `(key) => hasEntitlement(partnerId, key)` from a component, or omit it to treat everything as
 * unlocked (preview and demo contexts).
 */
export function getWorkspaceProductNavByService(
  role: WorkspaceProductRole,
  group: WorkspaceProductNavItem['group'],
  hasKey?: (key: string) => boolean,
): WorkspaceProductNavGroup[] {
  const items = getWorkspaceProductNav(role).filter((item) => item.group === group);

  if (role === 'admin') {
    return ADMIN_SERVICE_LINES.map((line) => ({
      line,
      items: items.filter((item) => item.service === line.id),
      unlocked: true,
    })).filter((entry) => entry.items.length > 0);
  }

  return PARTNER_SERVICE_LINES.map((line) => ({
    line,
    items: items.filter((item) => item.service === line.id),
    unlocked:
      !hasKey || line.entitlementAnyOf.length === 0
        ? true
        : line.entitlementAnyOf.some((key) => hasKey(key)),
  })).filter((entry) => entry.items.length > 0);
}

/** Dead or leftover URLs that still appear on buttons — map them to the live workstation. */
const WORKSPACE_PATH_ALIASES: Record<string, string> = {
  '/admin/dashboard': '/admin',
  '/admin/communications': '/admin/comms',
  '/admin/mail-letters': '/admin/mail',
  '/portal/overview': '/portal/dashboard',
  '/portal/partner': '/portal/dashboard',
  '/portal/readiness': '/portal/wealth-paths',
  '/portal/identity': '/portal/identity-theft',
  '/admin/social': '/admin/social-hub',
  '/admin/compliance': '/admin/compliance-review',
  '/admin/tasks': '/admin/projects',
  '/admin/agent-staff': '/admin/staff',
  '/admin/staff-command-center': '/admin/staff',
  '/admin/synthetic-staff': '/admin/staff',
  '/au/seller/dashboard': '/seller/dashboard',
  '/au/seller/cards': '/seller/listings',
  '/developer/qa': '/developer',
  '/agent/hub': '/credit-specialist/hub',
  '/admin/phone': '/admin/phone-hub',
};

/** Marketing hub tabs that already have a dedicated live workstation. */
const COLLAPSED_ADMIN_TABS: Record<string, Record<string, string>> = {
  '/admin/marketing': {
    desk: '/admin/marketing-desk',
    content: '/admin/content-studio',
    leads: '/admin/leads-os',
    team: '/admin/growth-agents',
    automation: '/admin/growth-automation',
    checklists: '/admin/playbooks',
    plan: '/admin/growth-command',
  },
};

function expandCollapsedAdminTarget(pathname: string, suffix: string): { pathname: string; suffix: string } {
  if (!suffix.startsWith('?')) return { pathname, suffix };
  const [query, hash] = suffix.slice(1).split('#');
  const params = new URLSearchParams(query);
  const tab = params.get('tab');
  const dest = tab ? COLLAPSED_ADMIN_TABS[pathname]?.[tab] : undefined;
  if (!dest) return { pathname, suffix };
  params.delete('tab');
  const rest = params.toString();
  return {
    pathname: dest,
    suffix: `${rest ? `?${rest}` : ''}${hash ? `#${hash}` : ''}`,
  };
}

export function getWorkspaceProductNavigationMode(pathname: string): 'preview' | 'live' {
  return pathname.startsWith('/preview/workspace-light') ? 'preview' : 'live';
}

/** Keep dashboard-to-module navigation inside the product preview when a matching surface exists. */
export function resolveWorkspaceProductPreviewPath(
  role: WorkspaceProductRole,
  target: string,
): string {
  return resolveWorkspaceProductPath(role, target, 'preview');
}

export function resolveWorkspaceProductPath(
  role: WorkspaceProductRole,
  target: string,
  navigationMode: 'preview' | 'live',
): string {
  const match = target.match(/^([^?#]+)(.*)$/);
  const rawPath = match?.[1] ?? target;
  const rawSuffix = match?.[2] ?? '';
  const aliased = WORKSPACE_PATH_ALIASES[rawPath] ?? rawPath;
  const expanded = expandCollapsedAdminTarget(aliased, rawSuffix);
  const pathname = expanded.pathname;
  const suffix = expanded.suffix;
  const item = getWorkspaceProductNav(role).find(
    (candidate) =>
      candidate.path === pathname ||
      candidate.livePath === pathname ||
      candidate.legacyPath === pathname,
  );
  if (!item) return `${pathname}${suffix}`;
  const destination =
    navigationMode === 'preview'
      ? item.path
      : item.legacyPath ?? item.path;
  return `${destination}${suffix}`;
}
