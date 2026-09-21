import type { LucideIcon } from 'lucide-react';
import {
  Webhook,
  Activity,
  BookOpen,
  Bot,
  BarChart3,
  CreditCard,
  FileText,
  FlaskConical,
  Gavel,
  Globe,
  GraduationCap,
  Library,
  Layout,
  Package,
  Mail,
  PiggyBank,
  Scale,
  Settings,
  Shield,
  Trophy,
  Users,
  UserCog,
  Crown,
  Phone,
  Sparkles,
  Film,
  BriefcaseBusiness,
  Lock,
  KeyRound,
  FolderKanban,
  Inbox,
  ListChecks,
  Target,
  Eye,
  TrendingUp,
} from 'lucide-react';

export type AdminNavLinkDef = {
  path: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
};

export type AdminNavGroupDef = {
  label: string;
  items: AdminNavLinkDef[];
};

export type AdminNavLaneDef = {
  id: string;
  label: string;
  hint: string;
  accent: 'emerald' | 'amber' | 'sky' | 'violet';
  groupLabel: string;
  items: AdminNavLinkDef[];
};

/**
 * Admin IA — seven top-level groups. Routes stay mounted; rare tools live under More.
 * Desktop rail, mobile simple lanes, and the product sidebar all read this list.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroupDef[] = [
  {
    label: 'Home',
    items: [{ path: '/admin', label: 'Overview', icon: Shield, hint: 'Admin dashboard' }],
  },
  {
    label: 'Clients & work',
    items: [
      { path: '/admin/partners', label: 'Partners', icon: Users, hint: 'Partner files' },
      { path: '/admin/crm', label: 'Leads & CRM', icon: Target, hint: 'Pipeline + prospects + inbound' },
      { path: '/admin/cases', label: 'Cases', icon: Gavel, hint: 'Case management' },
      { path: '/admin/projects', label: 'Projects & Tasks', icon: FolderKanban, hint: 'Master projects + child tasks' },
      { path: '/admin/workflow', label: 'Ops command center', icon: Inbox, hint: 'Alerts + SLA triage' },
      { path: '/admin/workload', label: 'Workload', icon: ListChecks, hint: 'Open tasks by assignee' },
      { path: '/admin/dispute-collaboration', label: 'Dispute Hub', icon: Scale, hint: 'Escalations + regulatory inbox' },
      { path: '/admin/mail', label: 'Mail letters', icon: Mail, hint: 'Finely Mail · pick partner → mail' },
      { path: '/admin/staff', label: 'Staff Command Center', icon: Users, hint: 'AI + human + partner team' },
    ],
  },
  {
    label: 'Learn & train',
    items: [
      { path: '/admin/courses', label: 'Courses', icon: GraduationCap, hint: 'Course builder' },
      { path: '/portal/training/academy', label: 'Training academy', icon: BookOpen, hint: 'Partner academy player' },
      { path: '/credit-specialist/hub', label: 'Specialist lounge', icon: Crown, hint: 'Trainee and specialist desk' },
      { path: '/admin/signup-ops', label: 'Onboarding', icon: KeyRound, hint: 'Signup, welcome email, roles' },
      { path: '/admin/partner-success', label: 'Success content', icon: GraduationCap, hint: 'Edit portal success modules' },
      { path: '/admin/launch-os', label: 'Launch OS', icon: BookOpen, hint: 'SOP help center' },
      { path: '/admin/tour-studio', label: 'Tour Studio', icon: ListChecks, hint: 'Walkthrough factory' },
      { path: '/admin/resources', label: 'Resources', icon: Library, hint: 'Public guides' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/admin/marketing-desk', label: 'Marketing Desk', icon: Sparkles, hint: 'Daily campaign room' },
      { path: '/admin/marketing', label: 'Marketing HQ', icon: TrendingUp, hint: 'Channels, content, follow up' },
      { path: '/admin/social-hub', label: 'Social Media', icon: Globe, hint: 'Social publishing room' },
      { path: '/admin/playbooks', label: 'Partner playbooks', icon: BookOpen, hint: 'Delivery checklists and bundles' },
      { path: '/admin/content-studio', label: 'Content studio', icon: Film, hint: 'Video and long-form' },
      { path: '/admin/comms', label: 'Comms Studio', icon: Mail, hint: 'Templates + delivery' },
      { path: '/admin/testimonials', label: 'Testimonials', icon: Trophy, hint: 'Social proof' },
      { path: '/admin/cmo', label: 'Marketing Director', icon: TrendingUp, hint: 'Site watch · experiments · budget' },
      { path: '/admin/lead-acquisition', label: 'Lead acquisition', icon: Globe, hint: 'Syndication feeds + webhook posting' },
      { path: '/admin/growth-automation', label: 'Growth Autopilot', icon: Sparkles, hint: 'Scheduler · daily find · week sync' },
    ],
  },
  {
    label: 'Money',
    items: [
      { path: '/admin/billing', label: 'Billing', icon: CreditCard, hint: 'Payments' },
      { path: '/admin/finance', label: 'Finance', icon: PiggyBank, hint: 'Allocator' },
      { path: '/admin/products', label: 'Products', icon: Package, hint: 'Catalog audit' },
      { path: '/admin/vendors', label: 'Vendors', icon: Users, hint: 'Vendor catalog (tiers)' },
      { path: '/pricing/business-credit', label: 'Business credit', icon: BriefcaseBusiness, hint: 'Public business-credit journey' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { path: '/admin/settings', label: 'Settings', icon: Settings, hint: 'System settings' },
      { path: '/admin/access', label: 'Control Center', icon: Shield, hint: 'Access + settings + roles' },
      { path: '/admin/team', label: 'Team & Roles', icon: UserCog, hint: 'RBAC-lite' },
      { path: '/admin/settings?tab=appearance', label: 'Appearance', icon: Settings, hint: 'Theme preview' },
      { path: '/admin/role-preview', label: 'Role preview', icon: Eye, hint: 'View every role’s access & payouts' },
    ],
  },
  {
    label: 'More',
    items: [
      { path: '/admin/compliance-review', label: 'Compliance review', icon: Scale, hint: 'Approve playbook-derived content' },
      { path: '/admin/automations', label: 'Automation Studio', icon: Bot, hint: 'Run automations' },
      { path: '/admin/ops-agent', label: 'Ruth · Co-Owner', icon: Crown, hint: 'AI co-owner command' },
      { path: '/admin/phone-hub', label: 'Phone Hub', icon: Phone, hint: 'Calls & SMS' },
      { path: '/admin/role-preview?role=heta_society', label: 'Head of Society', icon: Crown, hint: 'HOS member portal + program keys' },
      { path: '/admin/tenants', label: 'Tenants', icon: Globe, hint: 'White-label' },
      { path: '/admin/cms', label: 'CMS', icon: Layout, hint: 'Content ops' },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, hint: 'Ops snapshot' },
      { path: '/admin/monitoring', label: 'Monitoring', icon: Activity, hint: 'Telemetry' },
      { path: '/admin/integrations', label: 'Integrations', icon: Webhook, hint: 'Webhooks + API keys' },
      { path: '/admin/nora-capital', label: 'Nora Capital', icon: BriefcaseBusiness, hint: 'Integration' },
      { path: '/admin/finely-bridge-ops', label: 'Bridge ops', icon: Sparkles, hint: 'Finely ↔ Bridge' },
      { path: '/admin/vault', label: 'Vault', icon: Lock, hint: 'Restricted' },
      { path: '/admin/parsing-lab', label: 'Parsing Lab', icon: FlaskConical, hint: 'Regression harness' },
      { path: '/developer', label: 'Developer QA', icon: FlaskConical, hint: 'Launch test bench' },
      { path: '/admin/preview', label: 'Layout previews', icon: Eye, hint: 'Structure preview — live theme unchanged' },
    ],
  },
];

/** Groups that stay open on the desktop rail. More stays collapsed until it holds the active route. */
export const ADMIN_NAV_DEFAULT_OPEN = new Set(['Home', 'Learn & train', 'Marketing']);

function groupItems(label: string): AdminNavLinkDef[] {
  return ADMIN_NAV_GROUPS.find((group) => group.label === label)?.items ?? [];
}

/** Simple admin nav — one card per IA group (no 40-link strip). */
export const ADMIN_NAV_LANES: AdminNavLaneDef[] = [
  { id: 'home', label: 'Home', hint: 'Overview', accent: 'emerald', groupLabel: 'Home', items: groupItems('Home') },
  { id: 'clients', label: 'Clients & work', hint: 'CRM, cases, tasks', accent: 'sky', groupLabel: 'Clients & work', items: groupItems('Clients & work') },
  { id: 'learn', label: 'Learn & train', hint: 'Courses and onboarding', accent: 'amber', groupLabel: 'Learn & train', items: groupItems('Learn & train') },
  { id: 'marketing', label: 'Marketing', hint: 'Desk, HQ, social', accent: 'violet', groupLabel: 'Marketing', items: groupItems('Marketing') },
  { id: 'money', label: 'Money', hint: 'Billing and catalog', accent: 'emerald', groupLabel: 'Money', items: groupItems('Money') },
  { id: 'settings', label: 'Settings', hint: 'Access and roles', accent: 'sky', groupLabel: 'Settings', items: groupItems('Settings') },
  { id: 'more', label: 'More', hint: 'Advanced tools', accent: 'violet', groupLabel: 'More', items: groupItems('More') },
];

export function isAdminNavPathActive(pathname: string, path: string): boolean {
  const base = path.split('?')[0] || path;
  if (pathname === base) return true;
  if (base === '/admin') return pathname === '/admin' || pathname === '/admin/';
  if (base === '/admin/marketing') {
    return pathname === '/admin/marketing' || pathname.startsWith('/admin/marketing/');
  }
  return pathname.startsWith(`${base}/`);
}

export function resolveAdminNavLaneId(pathname: string): string {
  for (const lane of ADMIN_NAV_LANES) {
    if (lane.id === 'home') continue;
    if (lane.items.some((item) => isAdminNavPathActive(pathname, item.path))) {
      return lane.id;
    }
  }
  if (pathname === '/admin' || pathname === '/admin/') return 'home';
  return 'more';
}
