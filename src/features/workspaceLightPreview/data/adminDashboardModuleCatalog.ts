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
  Languages,
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
        description: 'Create invite-only Head of Society access keys for new members.',
        path: '/admin/role-preview?role=heta_society',
        icon: KeyRound,
        stat: `${listHosAccessCodes().filter((c) => !c.revoked && c.useCount < c.maxUses).length} active key(s)`,
      },
      {
        title: 'Launch help',
        description: 'Open playbooks, tour previews, and launch checklist gates.',
        path: '/admin/launch-os',
        icon: ListChecks,
        stat: 'Runbooks',
      },
      {
        title: 'Tour Studio',
        description: 'Preview in-app tours and capture screenshots for the tour library.',
        path: '/admin/tour-studio',
        icon: Film,
        stat: `${TOUR_MANIFEST.length} tours`,
      },
      {
        title: 'Access and permissions',
        description: 'See who can open admin, which tenant they belong to, and what they can do.',
        path: '/admin/access',
        icon: Shield,
        stat: 'Understand access',
      },
      {
        title: 'Admin guide',
        description: 'Operating playbook for settings, workflow, templates, billing, and security.',
        path: '/admin/guide',
        icon: BookOpen,
        stat: 'Playbook',
      },
      {
        title: 'Operations queue',
        description: 'Alerts, service-level risk, and triage queues. Partner messages stay in Support.',
        path: '/admin/workflow',
        icon: Bell,
        stat: `${stats.adminUnread} unread · ${stats.openTasksCount} open task${stats.openTasksCount !== 1 ? 's' : ''}`,
      },
      {
        title: 'Notifications',
        description: 'Alert history for leads, tasks, purchases, inbox messages, and reminders.',
        path: '/admin/notifications',
        icon: Bell,
        stat: `${stats.adminUnread} unread`,
      },
      {
        title: 'Monitoring',
        description: 'Watch email, SMS, mail, and webhook health. Triage delivery failures here.',
        path: '/admin/monitoring',
        icon: Activity,
        stat: 'Telemetry',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'CRM',
        description: 'Qualify inbound leads, assign owners, and move relationships through the pipeline.',
        path: '/admin/crm',
        icon: Target,
        stat: 'Pipeline',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Lead intelligence',
        description: 'Search and enrich qualified prospects, then save them into CRM.',
        path: '/admin/lead-intel',
        icon: Sparkles,
        stat: 'Prospect',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Funnel experiments',
        description: 'Test headlines and calls to action on lead magnets, with conversion tracking per variant.',
        path: '/admin/funnel-experiments',
        icon: FlaskConical,
        stat: 'Convert',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Automation Studio',
        description: 'Run follow-ups, reminders, and other long-running automations.',
        path: '/admin/automations',
        icon: Bot,
        stat: 'Automate',
      },
      {
        title: 'Hands-free operations',
        description: 'Review letter drafts, mail confirmations, compliance escalations, and coverage gaps.',
        path: '/admin/ops-autopilot',
        icon: Activity,
        stat: 'Autopilot',
      },
      {
        title: 'Staff',
        description: 'See AI staff, the human team, partner specialists, missions, and inbox in one place.',
        path: '/admin/staff',
        icon: Users,
        stat: 'Command',
      },
      {
        title: 'Lead magnets',
        description: 'Edit funnel copy, urgency, search text, and the assigned specialist.',
        path: '/admin/lead-magnets',
        icon: FileText,
        stat: 'Funnels',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Operations copilot',
        description: 'Daily priorities, launch readiness, pipeline actions, and system checks.',
        path: '/admin/ops-agent',
        icon: Crown,
        stat: 'Operate',
      },
      {
        title: 'Haitian community',
        description: 'Download Haitian community kits for leads, and see the cities we serve.',
        path: '/admin/haitian',
        icon: Languages,
        stat: 'Haitian community',
      },
      {
        title: 'Team and roles',
        description: 'Invite staff, set roles, and manage what each role can reach.',
        path: '/admin/team',
        icon: UserCog,
        stat: 'Organize',
        hidden: !opsCaps.canManageTeam,
      },
      {
        title: 'Role preview',
        description: 'Preview specialist, affiliate, and AU seller dashboards, with links to add each role.',
        path: '/admin/role-preview',
        icon: Layout,
        stat: 'Specialists · Affiliates · Sellers',
      },
      {
        title: 'Tenants',
        description: 'Create agency tenants and control branding, domains, and feature access.',
        path: '/admin/tenants',
        icon: Globe,
        stat: 'White-label',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'AU Sellers',
        description: 'Review sellers and approve or reject listings with proof.',
        path: '/admin/au-sellers',
        icon: BadgeCheck,
        stat: 'Review supply',
      },
      {
        title: 'Communication Hub',
        description: 'Talk with any specialist on your roster in the same hub partners use.',
        path: '/admin/messages',
        icon: MessageCircle,
        stat: 'Specialists',
      },
      {
        title: 'Comms Studio',
        description: 'Reusable message templates and partner delivery through the portal.',
        path: '/admin/comms',
        icon: Mail,
        stat: 'Communicate',
      },
      {
        title: 'Resources',
        description: 'Edit the public Resource Library guides partners download.',
        path: '/admin/resources',
        icon: Library,
        stat: 'Publish',
      },
      {
        title: 'Courses',
        description: 'Build courses and publish the curriculum to the partner portal.',
        path: '/admin/courses',
        icon: GraduationCap,
        stat: 'Teach',
      },
      {
        title: 'Content Studio',
        description: 'Create short spots, presenter sessions, voice, and e-books, then publish them.',
        path: '/admin/content-studio?room=video&wizard=30s',
        icon: Film,
        stat: 'Studio',
      },
      {
        title: 'Bridge operations',
        description: 'Fund-ready queue, Bridge handoffs, and phase measures for Provider Gateway.',
        path: '/admin/finely-bridge-ops',
        icon: Sparkles,
        stat: 'Bridge',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Nora Capital Group',
        description: 'Test the capital API, review responses, and monitor webhook events.',
        path: '/admin/nora-capital',
        icon: BriefcaseBusiness,
        stat: 'Integrate',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Secret Vault',
        description: 'Private archive for sensitive operations files and documents.',
        path: '/admin/vault',
        icon: Lock,
        stat: 'Restricted',
      },
      {
        title: 'Testimonials',
        description: 'Edit video and written testimonials, then publish or unpublish them.',
        path: '/admin/testimonials',
        icon: Trophy,
        stat: 'Public proof',
        hidden: !opsCaps.canManageTenants,
      },
      {
        title: 'Finance allocator',
        description: 'Split income across taxes, payroll, marketing, specialists, affiliates, and reserves.',
        path: '/admin/finance',
        icon: PiggyBank,
        stat: 'Allocate',
        hidden: !opsCaps.canUseFinanceTools,
      },
      {
        title: 'Partners',
        description: 'Create partners, upload reports, manage evidence and letters, and add notes.',
        path: '/admin/partners',
        icon: Users,
        stat: `${stats.partnersCount} partner${stats.partnersCount !== 1 ? 's' : ''}`,
      },
      {
        title: 'Cases',
        description: 'Track bureau cases, rounds, and follow-up windows across all partners.',
        path: '/admin/cases',
        icon: Gavel,
        stat: `${stats.openCasesCount} open / ${stats.casesCount} total`,
      },
      {
        title: 'Leads',
        description: 'Strategy-call requests and resource unlocks. Review inbound leads and take the next step.',
        path: '/admin/crm?pipeline=inbound',
        icon: FileText,
        stat: `${stats.leadsCount} captured`,
      },
      {
        title: 'Parsing Lab',
        description: 'Check credit-report parsing coverage and review extraction signals.',
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
        description: 'Review partner agreements, update statuses, and grant entitlements.',
        path: '/admin/billing',
        icon: CreditCard,
        stat: 'Manage',
      },
      {
        title: 'Calendar & Scheduling',
        description: 'Triage session requests and confirm partner meetings.',
        path: '/admin/calendar',
        icon: Calendar,
        stat: 'Schedule',
      },
      {
        title: 'Projects',
        description: 'See stages and open tasks across partner projects.',
        path: '/admin/projects',
        icon: FolderKanban,
        stat: 'Operate',
      },
      {
        title: 'Template Library',
        description: 'Search, preview, and generate letter and document templates.',
        path: '/admin/templates',
        icon: FileText,
        stat: 'Generate',
      },
      {
        title: 'Tasks',
        description: 'Create and assign operations tasks across partners.',
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
      subtitle: 'Queues you open every day',
      defaultOpen: false,
      cards: take([
        '/admin/cases',
        '/admin/tasks/new',
        '/admin/projects',
        '/admin/crm?pipeline=inbound',
        '/admin/calendar',
        '/admin/haitian',
        '/admin/crm',
        '/admin/support',
        '/admin/content-studio?room=video&wizard=30s',
        '/admin/notifications',
      ]),
    },
    {
      key: 'comms',
      title: 'Comms & content',
      subtitle: 'Templates, resources, and courses',
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
      subtitle: 'Automations and assistants',
      defaultOpen: false,
      cards: take(['/admin/automations', '/admin/ops-autopilot', '/admin/lead-magnets', '/admin/ops-agent', '/admin/lead-intel']),
    },
    {
      key: 'platform',
      title: 'Platform & settings',
      subtitle: 'Access, tenants, billing, and system settings',
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
      subtitle: 'Everything else in this catalog',
      defaultOpen: false,
      cards: leftover,
    });
  }

  return {
    featured: featuredList,
    grouped: groups.filter((g) => g.cards.length > 0),
  };
}
