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

/** Full admin nav groups — desktop rail + legacy full mobile strip. */
export const ADMIN_NAV_GROUPS: AdminNavGroupDef[] = [
  {
    label: 'Core',
    items: [
      { path: '/admin', label: 'Overview', icon: Shield, hint: 'Admin dashboard' },
      { path: '/admin/workflow', label: 'Ops command center', icon: Inbox, hint: 'Alerts + SLA triage' },
      { path: '/admin/crm', label: 'Leads & CRM', icon: Target, hint: 'Pipeline + prospects + inbound' },
      { path: '/admin/leads', label: 'Leads intel', icon: Sparkles, hint: 'Advanced inbound agent · use Leads & CRM for pipeline' },
      { path: '/admin/projects', label: 'Projects & Tasks', icon: FolderKanban, hint: 'Master projects + child tasks' },
      { path: '/admin/workload', label: 'Workload', icon: ListChecks, hint: 'Open tasks by assignee' },
      { path: '/admin/playbooks', label: 'Playbooks', icon: BookOpen, hint: 'Service delivery task templates' },
      { path: '/admin/partners', label: 'Partners', icon: Users, hint: 'Client management' },
      { path: '/admin/cases', label: 'Cases', icon: Gavel, hint: 'Case management' },
      { path: '/admin/dispute-collaboration', label: 'Dispute Hub', icon: Scale, hint: 'Escalations + regulatory inbox' },
    ],
  },
  {
    label: 'Comms & Content',
    items: [
      { path: '/admin/comms', label: 'Comms Studio', icon: Mail, hint: 'Templates + delivery' },
      { path: '/admin/resources', label: 'Resources', icon: Library, hint: 'Public guides' },
      { path: '/admin/tour-studio', label: 'Tour Studio', icon: ListChecks, hint: 'Walkthrough factory' },
      { path: '/admin/launch-os', label: 'Launch OS', icon: BookOpen, hint: 'SOP help center' },
      { path: '/admin/courses', label: 'Courses', icon: GraduationCap, hint: 'Course builder' },
      { path: '/admin/testimonials', label: 'Testimonials', icon: Trophy, hint: 'Social proof' },
    ],
  },
  {
    label: 'Automation & AI',
    items: [
      { path: '/admin/automations', label: 'Automation Studio', icon: Bot, hint: 'Run automations' },
      { path: '/admin/ops-agent', label: 'Ruth · Co-Owner', icon: Crown, hint: 'AI co-owner command' },
      { path: '/admin/phone-hub', label: 'Phone Hub', icon: Phone, hint: 'Calls & SMS' },
      { path: '/admin/lead-intel', label: 'Lead Intel (full)', icon: Sparkles, hint: 'Full-page intel workspace' },
      { path: '/admin/media-studio', label: 'Media Studio', icon: Film, hint: 'Generate assets' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { path: '/admin/access', label: 'Control Center', icon: Shield, hint: 'Access + settings + roles' },
      { path: '/admin/role-preview', label: 'Role preview', icon: Eye, hint: 'View every role’s access & payouts' },
      { path: '/admin/signup-ops', label: 'Signup & access', icon: KeyRound, hint: 'Passwords, welcome email, roles' },
      { path: '/admin/team', label: 'Team & Roles', icon: UserCog, hint: 'RBAC-lite' },
      { path: '/admin/tenants', label: 'Tenants', icon: Globe, hint: 'White-label' },
      { path: '/admin/billing', label: 'Billing', icon: CreditCard, hint: 'Payments' },
      { path: '/admin/finance', label: 'Finance', icon: PiggyBank, hint: 'Allocator' },
      { path: '/admin/vendors', label: 'Vendors', icon: Users, hint: 'Vendor catalog (tiers)' },
      { path: '/admin/products', label: 'Products', icon: Package, hint: 'Catalog audit' },
      { path: '/admin/cms', label: 'CMS', icon: Layout, hint: 'Content ops' },
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, hint: 'Ops snapshot' },
      { path: '/admin/monitoring', label: 'Monitoring', icon: Activity, hint: 'Telemetry' },
      { path: '/admin/integrations', label: 'Integrations', icon: Webhook, hint: 'Webhooks + API keys' },
      { path: '/admin/nora-capital', label: 'Nora Capital', icon: BriefcaseBusiness, hint: 'Integration' },
      { path: '/admin/finely-bridge-ops', label: 'Bridge ops', icon: Sparkles, hint: 'Finely ↔ Bridge' },
      { path: '/admin/vault', label: 'Vault', icon: Lock, hint: 'Restricted' },
      { path: '/admin/parsing-lab', label: 'Parsing Lab', icon: FlaskConical, hint: 'Regression harness' },
      { path: '/admin/settings?tab=appearance', label: 'Appearance', icon: Settings, hint: 'Light theme admin preview' },
      { path: '/admin/settings', label: 'Settings', icon: Settings, hint: 'System settings' },
    ],
  },
];

/** Four-lane simple admin nav — default mobile UX (no long horizontal strip). */
export const ADMIN_NAV_LANES: AdminNavLaneDef[] = [
  {
    id: 'core',
    label: 'Core ops',
    hint: 'Partners & workflow',
    accent: 'emerald',
    groupLabel: 'Core',
    items: ADMIN_NAV_GROUPS[0].items,
  },
  {
    id: 'comms',
    label: 'Comms',
    hint: 'Content & courses',
    accent: 'sky',
    groupLabel: 'Comms & Content',
    items: ADMIN_NAV_GROUPS[1].items,
  },
  {
    id: 'automation',
    label: 'Automation',
    hint: 'AI & studio',
    accent: 'amber',
    groupLabel: 'Automation & AI',
    items: ADMIN_NAV_GROUPS[2].items,
  },
  {
    id: 'platform',
    label: 'Platform',
    hint: 'Settings & billing',
    accent: 'violet',
    groupLabel: 'Platform',
    items: ADMIN_NAV_GROUPS[3].items,
  },
];

export function isAdminNavPathActive(pathname: string, path: string): boolean {
  if (pathname === path) return true;
  if (path === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname.startsWith(`${path}/`);
}

export function resolveAdminNavLaneId(pathname: string): string {
  for (const lane of ADMIN_NAV_LANES) {
    if (lane.items.some((item) => isAdminNavPathActive(pathname, item.path))) {
      return lane.id;
    }
  }
  return 'core';
}
