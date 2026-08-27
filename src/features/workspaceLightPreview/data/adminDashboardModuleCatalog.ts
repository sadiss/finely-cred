import {
  Activity,
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Calendar,
  CreditCard,
  Crown,
  Film,
  FileText,
  FlaskConical,
  FolderKanban,
  Gavel,
  Globe,
  GraduationCap,
  KeyRound,
  Layout,
  Library,
  ListChecks,
  Lock,
  Mail,
  MessageCircle,
  MessageSquareText,
  Package,
  PiggyBank,
  Settings,
  Shield,
  Sparkles,
  Target,
  Trophy,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { TOUR_MANIFEST } from '../../../config/tourManifest';
import { listHosAccessCodes } from '../../../lib/hetaSocietyAccessCodes';
import type { WlModuleCard } from '../components/WlModuleShelf';

export type AdminDashboardStats = {
  partnersCount: number;
  casesCount: number;
  openCasesCount: number;
  leadsCount: number;
  openTasksCount: number;
  adminUnread: number;
  partnersMissingReport: number;
  lettersThisWeek: number;
  slaBreaches: number;
  labels14: string[];
  leads14: number[];
  tasks14: number[];
  cases14: number[];
};

type OpsCaps = {
  canManageTeam: boolean;
  canManageTenants: boolean;
  canViewAllCustomers: boolean;
  canUseFinanceTools: boolean;
};

type ModuleCard = WlModuleCard & { hidden?: boolean };

const FEATURED_PATHS = [
  '/admin/workflow',
  '/admin/partners',
  '/admin/staff',
  '/admin/launch-os',
] as const;

function buildCards(stats: AdminDashboardStats, opsCaps: OpsCaps): ModuleCard[] {
  return (
    [
      {
        title: 'Head of Society keys',
        description: 'Generate invite-only HOS access keys — members enter on /head-of-society.',
        path: '/admin/role-preview?role=heta_society',
        icon: KeyRound,
        stat: `${listHosAccessCodes().filter((c) => !c.revoked && c.useCount < c.maxUses).length} active key(s)`,
      },
      {
        title: 'Launch OS Help Center',
        description: 'SOP playbooks, tour previews, and launch checklist gates.',
        path: '/admin/launch-os',
        icon: ListChecks,
        stat: 'Runbooks',
      },
      {
        title: 'Tour Studio',
        description: 'Preview manifest tours and run the screenshot capture pipeline.',
        path: '/admin/tour-studio',
        icon: Film,
        stat: `${TOUR_MANIFEST.length} tours`,
      },
      {
        title: 'Access & Permissions',
        description: 'Unified view of admin permissions: tenant selector, memberships, allowlist, and effective capabilities.',
        path: '/admin/access',
        icon: Shield,
        stat: 'Understand access',
      },
      {
        title: 'Admin Guide',
        description: 'Enterprise ops playbook: settings, workflow, templates, billing, and security.',
        path: '/admin/guide',
        icon: BookOpen,
        stat: 'Run like enterprise',
      },
      {
        title: 'Ops command center',
        description: 'Alerts first, SLA risk, and paginated triage queues — not the support message inbox.',
        path: '/admin/workflow',
        icon: Bell,
        stat: `${stats.adminUnread} unread · ${stats.openTasksCount} open task${stats.openTasksCount !== 1 ? 's' : ''}`,
      },
      {
        title: 'Notifications Center',
        description: 'Full alert history — leads, tasks, purchases, Meta inbox, trial reminders, and prefs.',
        path: '/admin/notifications',
        icon: Bell,
        stat: `${stats.adminUnread} unread`,
      },
      {
        title: 'Monitoring',
        description: 'Live integration telemetry: email/SMS/mail + webhooks. Triage deliverability and failures.',
        path: '/admin/monitoring',
        icon: Activity,
        stat: 'Telemetry',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'CRM',
        description: 'Prospects + inbound leads. Assign owners, score, stage pipelines, and run compliant outreach.',
        path: '/admin/crm',
        icon: Target,
        stat: 'Pipeline',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Lead Intelligence Agent',
        description: 'Search + enrich qualified prospects. Save into CRM.',
        path: '/admin/lead-intel',
        icon: Sparkles,
        stat: 'Prospect',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Funnel A/B Lab',
        description: 'Headline and CTA experiments on lead magnets — conversion tracking per variant.',
        path: '/admin/funnel-experiments',
        icon: FlaskConical,
        stat: 'Convert',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Automation Studio',
        description: 'Run long-horizon automations and agents (follow-ups, reminders, nudges).',
        path: '/admin/automations',
        icon: Bot,
        stat: 'Automate',
      },
      {
        title: 'Hands-Free Ops',
        description: 'Autopilot KPIs — letter drafts, mail confirm queue, compliance escalations, staff coverage gaps.',
        path: '/admin/ops-autopilot',
        icon: Activity,
        stat: 'Autopilot',
      },
      {
        title: 'Staff Command Center',
        description: 'AI operators, human team, partner specialists, missions, talk, inbox, and Lead Intel — unified.',
        path: '/admin/staff',
        icon: Users,
        stat: 'Command',
      },
      {
        title: 'Lead Magnet Editor',
        description: 'Edit funnel copy, urgency, SEO, and assigned specialist without a code deploy.',
        path: '/admin/lead-magnets',
        icon: FileText,
        stat: 'Funnels',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Co-Owner Ops Agent',
        description: 'AI operator copilot: daily priorities, launch readiness, pipeline actions, and system tightening.',
        path: '/admin/ops-agent',
        icon: Crown,
        stat: 'Operate',
      },
      {
        title: 'Team & Roles',
        description: 'Invite admins/agents, set roles, and manage operational permissions (RBAC-lite).',
        path: '/admin/team',
        icon: UserCog,
        stat: 'Organize',
        hidden: !opsCaps.canManageTeam,
      },
      {
        title: 'Role Preview',
        description: 'Preview agent, affiliate, and AU seller dashboards. Quick links to add each role.',
        path: '/admin/role-preview',
        icon: Layout,
        stat: 'Agents · Affiliates · Sellers',
      },
      {
        title: 'Tenants (White-Label)',
        description: 'Create agency tenants and control branding, domains, and feature access.',
        path: '/admin/tenants',
        icon: Globe,
        stat: 'White-label',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'AU Sellers',
        description: 'Review supply-side sellers and approve/reject listings with proof.',
        path: '/admin/au-sellers',
        icon: BadgeCheck,
        stat: 'Review supply',
      },
      {
        title: 'Communication Hub',
        description: 'Talk to any agent on your roster — same main hub as the portal (AI Coach + agent picker).',
        path: '/admin/messages',
        icon: MessageCircle,
        stat: 'Agents',
      },
      {
        title: 'Comms Studio',
        description: 'Reusable message templates + partner delivery (portal now; email/SMS next).',
        path: '/admin/comms',
        icon: Mail,
        stat: 'Communicate',
      },
      {
        title: 'Resources',
        description: 'Edit public Resource Library guides (PDF generation uses the same content).',
        path: '/admin/resources',
        icon: Library,
        stat: 'Publish',
      },
      {
        title: 'Courses',
        description: 'Course Builder + launch controls (publish curriculum to the portal).',
        path: '/admin/courses',
        icon: GraduationCap,
        stat: 'Teach',
      },
      {
        title: 'Content Studio',
        description: '30s premium spot wizard, Presenter Mode, voice, e-books, and publish bridges.',
        path: '/admin/content-studio?room=video&wizard=30s',
        icon: Film,
        stat: 'Studio',
      },
      {
        title: 'Finely Cred — Bridge ops',
        description: 'Fund-ready queue, Bridge handoffs, phase KPIs, and ML pipeline scan for Provider Gateway.',
        path: '/admin/finely-bridge-ops',
        icon: Sparkles,
        stat: 'Bridge',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Nora Capital Group',
        description: 'Secure API integration shim (admin-only): test calls, audit responses, and monitor webhook events.',
        path: '/admin/nora-capital',
        icon: BriefcaseBusiness,
        stat: 'Integrate',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Secret Vault',
        description: 'Admin-only private archive for top-secret ops assets and sensitive documents.',
        path: '/admin/vault',
        icon: Lock,
        stat: 'Restricted',
      },
      {
        title: 'Testimonials',
        description: 'Edit video + text testimonials. Publish/unpublish instantly.',
        path: '/admin/testimonials',
        icon: Trophy,
        stat: 'Public proof',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Finance Allocator',
        description: 'Income split calculator: taxes, payroll, marketing, agents, affiliates, reserves.',
        path: '/admin/finance',
        icon: PiggyBank,
        stat: 'Allocate',
        hidden: !opsCaps.canUseFinanceTools,
      },
      {
        title: 'Partner Management',
        description: 'Create partners, upload reports, manage evidence and letters, add notes.',
        path: '/admin/partners',
        icon: Users,
        stat: `${stats.partnersCount} partner${stats.partnersCount !== 1 ? 's' : ''}`,
      },
      {
        title: 'Case Management',
        description: 'Track bureau cases, rounds, and follow-up windows across all partners.',
        path: '/admin/cases',
        icon: Gavel,
        stat: `${stats.openCasesCount} open / ${stats.casesCount} total`,
      },
      {
        title: 'Leads',
        description: 'Strategy call requests and resource unlocks. View and action inbound leads.',
        path: '/admin/crm?pipeline=inbound',
        icon: FileText,
        stat: `${stats.leadsCount} captured`,
      },
      {
        title: 'Parsing Lab',
        description: 'Regression harness: validate credit report parsing coverage and debug signals.',
        path: '/admin/parsing-lab',
        icon: FlaskConical,
        stat: 'Validate',
      },
      {
        title: 'Partner conversations',
        description: 'Threaded partner support: triage, reply, and convert to tasks.',
        path: '/admin/support',
        icon: MessageSquareText,
        stat: 'Triage',
      },
      {
        title: 'System Settings',
        description: 'Site branding, compliance links, admin users, and feature flags.',
        path: '/admin/settings',
        icon: Settings,
        stat: 'Configure',
      },
      {
        title: 'Billing & Agreements',
        description: 'View partner agreements, update statuses, grant entitlements.',
        path: '/admin/billing',
        icon: CreditCard,
        stat: 'Manage',
      },
      {
        title: 'Calendar & Scheduling',
        description: 'Triage session requests and schedule/confirm partner meetings.',
        path: '/admin/calendar',
        icon: Calendar,
        stat: 'Schedule',
      },
      {
        title: 'Projects (DFY Ops)',
        description: 'Kanban/timeline view across partners with stages and open tasks.',
        path: '/admin/projects',
        icon: FolderKanban,
        stat: 'Operate',
      },
      {
        title: 'Template Library',
        description: 'Search, preview, and generate templates (OCR-friendly variants + branded prints).',
        path: '/admin/templates',
        icon: FileText,
        stat: 'Generate',
      },
      {
        title: 'Tasks',
        description: 'Create and assign ops tasks across partners.',
        path: '/admin/tasks/new',
        icon: Package,
        stat: `${stats.openTasksCount} open`,
      },
    ] as ModuleCard[]
  ).filter((c) => !c.hidden);
}

export type AdminModuleGroup = {
  key: string;
  title: string;
  subtitle: string;
  defaultOpen: boolean;
  cards: WlModuleCard[];
};

export function buildAdminModuleCatalog(stats: AdminDashboardStats, opsCaps: OpsCaps) {
  const cards = buildCards(stats, opsCaps);
  const byPath = new Map(cards.map((c) => [c.path, c]));
  const featuredList = FEATURED_PATHS.map((p) => byPath.get(p)).filter(Boolean) as WlModuleCard[];
  const featuredSet = new Set(featuredList.map((c) => c.path));
  const used = new Set(featuredSet);

  const take = (paths: string[]) =>
    paths
      .map((p) => byPath.get(p))
      .filter((c): c is WlModuleCard => Boolean(c) && !featuredSet.has(c!.path))
      .map((c) => {
        used.add(c.path);
        return c;
      });

  const groups: AdminModuleGroup[] = [
    {
      key: 'core',
      title: 'Core ops',
      subtitle: 'Daily triage destinations',
      defaultOpen: false,
      cards: take([
        '/admin/cases',
        '/admin/tasks/new',
        '/admin/projects',
        '/admin/crm?pipeline=inbound',
        '/admin/calendar',
        '/admin/crm',
        '/admin/support',
        '/admin/content-studio?room=video&wizard=30s',
        '/admin/notifications',
      ]),
    },
    {
      key: 'comms',
      title: 'Comms & content',
      subtitle: 'Templates, resources, courses',
      defaultOpen: false,
      cards: take([
        '/admin/comms',
        '/admin/resources',
        '/admin/tour-studio',
        '/admin/courses',
        '/admin/templates',
        '/admin/testimonials',
        '/admin/guide',
      ]),
    },
    {
      key: 'automation',
      title: 'Automation & AI',
      subtitle: 'Assistants and generation tools',
      defaultOpen: false,
      cards: take(['/admin/automations', '/admin/ops-autopilot', '/admin/lead-magnets', '/admin/ops-agent', '/admin/lead-intel']),
    },
    {
      key: 'platform',
      title: 'Platform & settings',
      subtitle: 'Access, tenants, billing, system',
      defaultOpen: false,
      cards: take([
        '/admin/access',
        '/admin/team',
        '/admin/tenants',
        '/admin/billing',
        '/admin/finance',
        '/admin/monitoring',
        '/admin/nora-capital',
        '/admin/finely-bridge-ops',
        '/admin/vault',
        '/admin/parsing-lab',
        '/admin/settings',
        '/admin/au-sellers',
        '/admin/role-preview',
        '/admin/role-preview?role=heta_society',
        '/admin/messages',
        '/admin/funnel-experiments',
      ]),
    },
  ];

  const leftover = cards.filter((c) => !used.has(c.path));
  if (leftover.length) {
    groups.push({
      key: 'more',
      title: 'More',
      subtitle: 'Additional modules',
      defaultOpen: false,
      cards: leftover,
    });
  }

  return {
    featured: featuredList,
    grouped: groups.filter((g) => g.cards.length > 0),
  };
}
