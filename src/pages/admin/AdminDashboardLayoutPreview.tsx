import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { ActionLink, TimeSeriesAreaChart } from '../../components/ui';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { FinelyOsIconBadge, type FinelyOsIconAccent } from '../../features/os/FinelyOsIconBadge';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_PRIMARY_BTN,
  finelyOsDeckTile,
  finelyOsGlowKpi,
  finelyOsMicroStat,
  type FinelyOsDeckAccent,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { buildAdminNoticedItems } from '../../lib/finelyProactiveSignals';
import { getGoLivePillars } from '../../lib/goLiveCommandOps';
import { HosAccessCodesAdminPanel } from '../../components/heta/HosAccessCodesAdminPanel';
import { StaffSocialPresenceStrip } from '../../features/staffCommandCenter/StaffSocialPresenceStrip';
import { AdminPlatformEventsFeed } from '../../features/admin/AdminPlatformEventsFeed';
import { AdminRevenueIntelPanel } from '../../features/admin/AdminRevenueIntelPanel';
import { AdminAffiliateOpsPanel } from '../../features/admin/AdminAffiliateOpsPanel';
import { AdminReferralGrowthPanel } from '../../features/admin/AdminReferralGrowthPanel';
import { AdminOpsHealthPanel } from '../../features/admin/AdminOpsHealthPanel';
import { AdminWebhooksPanel } from '../../features/admin/AdminWebhooksPanel';
import { AdminBillingOpsPanel } from '../../features/admin/AdminBillingOpsPanel';
import { TOUR_MANIFEST } from '../../config/tourManifest';
import { listHosAccessCodes } from '../../lib/hetaSocietyAccessCodes';
import { fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import { listCases } from '../../data/casesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listTasks } from '../../data/tasksRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { countSlaBreaches } from '../../features/work/sla/listSlaBreaches';
import { unreadCount } from '../../data/notificationsRepo';
import { bucketCountsByDay } from '../../utils/timeSeries';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import {
  canManageTeam,
  canUseFinanceTools,
  canViewAllClients,
  getMembershipByUserAndTenant,
  isPlatformAdmin,
} from '../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { isAdminEmail } from '../../auth/admin';
import { listCommsSends, listCommsTemplates } from '../../data/commsRepo';
import { listCommsSequences } from '../../data/commsSequencesRepo';
import './adminDashboardLayoutPreview.css';

type ModuleCard = {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  stat: string;
  hidden?: boolean;
};

type ModuleGroup = {
  key: string;
  title: string;
  subtitle: string;
  defaultOpen: boolean;
  cards: ModuleCard[];
};

const ICON_ACCENTS: FinelyOsIconAccent[] = ['violet', 'emerald', 'sky', 'amber', 'rose', 'fuchsia'];
const DECK_ACCENTS: FinelyOsDeckAccent[] = ['amber', 'emerald', 'sky', 'violet', 'fuchsia', 'rose'];

function groupShellClass(key: string) {
  if (key === 'core') return 'fc-dash-preview-group--core fc-platinum-frame fc-surface-platinum';
  if (key === 'comms') return 'fc-dash-preview-group--comms';
  if (key === 'automation') return 'fc-dash-preview-group--automation';
  if (key === 'platform') return 'fc-dash-preview-group--platform';
  return 'fc-dash-preview-group--more';
}

const FEATURED_PATHS = [
  '/admin/workflow',
  '/admin/partners',
  '/admin/staff',
  '/admin/launch-os',
] as const;

/**
 * Preview-only Admin Dashboard layout.
 * Same destinations / stats as live `/admin`, but structure differentiates
 * command strip, alerts, KPI rail, featured band, colored Core ops boxes,
 * and distinct group treatments. Does not alter AdminDashboardPage.
 */
export default function AdminDashboardLayoutPreview() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState(0);
  const [stats, setStats] = useState({
    partnersCount: 0,
    casesCount: 0,
    openCasesCount: 0,
    leadsCount: 0,
    openTasksCount: 0,
    adminUnread: 0,
    partnersMissingReport: 0,
    lettersThisWeek: 0,
    slaBreaches: 0,
    labels14: [] as string[],
    leads14: [] as number[],
    tasks14: [] as number[],
    cases14: [] as number[],
  });

  const commsOps = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const sends = listCommsSends(400);
    const recent = sends.filter((s) => Date.parse(s.createdAt) >= weekAgo);
    return {
      templates: listCommsTemplates().length,
      sequences: listCommsSequences().length,
      sendsWeek: recent.length,
      failedWeek: recent.filter((s) => s.status === 'error').length,
    };
  }, [statsKey]);

  useEffect(() => {
    setStatsError(null);
    fetchAllPartnersAsAdmin()
      .then((partners) => {
        const partnerIdSet = new Set(partners.map((p) => p.id));
        const cases = listCases();
        const tenantCases = cases.filter((c) => partnerIdSet.has(c.partnerId));
        const openCases = tenantCases.filter((c) => c.status === 'open');
        const leads = listLeadCaptures();
        const tasks = listTasks();
        const tenantTasks = tasks.filter((t: any) => partnerIdSet.has(String((t as any).partnerId || '')));
        const openTasks = tenantTasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
        const adminUnread = unreadCount({ audience: 'admin' });
        const leads14 = bucketCountsByDay({ items: leads, getIso: (l) => (l as any).createdAt, days: 14 });
        const tasks14 = bucketCountsByDay({ items: tenantTasks, getIso: (t) => (t as any).createdAt, days: 14 });
        const cases14 = bucketCountsByDay({ items: tenantCases, getIso: (c) => (c as any).createdAt, days: 14 });
        const partnersMissingReport = partners.filter((p) => listReportsByPartner(p.id).length === 0).length;
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const lettersThisWeek = partners.reduce(
          (acc, p) => acc + listLettersByPartner(p.id).filter((l) => Date.parse(l.createdAt) >= weekAgo).length,
          0,
        );
        const slaBreaches = countSlaBreaches(partnerIdSet);
        setStats({
          partnersCount: partners.length,
          casesCount: tenantCases.length,
          openCasesCount: openCases.length,
          leadsCount: leads.length,
          openTasksCount: openTasks.length,
          adminUnread,
          partnersMissingReport,
          lettersThisWeek,
          slaBreaches,
          labels14: leads14.labels,
          leads14: leads14.values,
          tasks14: tasks14.values,
          cases14: cases14.values,
        });
      })
      .catch((e: unknown) => {
        setStatsError((e as Error)?.message || 'Could not load admin dashboard stats.');
      });
  }, [auth.user, statsKey]);

  const goLiveBlocked = useMemo(
    () => getGoLivePillars().filter((p) => p.tone === 'blocked' && p.id !== 'tour_voice').length,
    [],
  );

  const opsCaps = useMemo(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    if (!u) return { canManageTeam: false, canManageTenants: false, canViewAllCustomers: false, canUseFinanceTools: false };
    if (isAdminEmail(u.email)) {
      return { canManageTeam: true, canManageTenants: true, canViewAllCustomers: true, canUseFinanceTools: true };
    }
    const membership =
      getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    const ok = membership?.status === 'active' && (isPlatformAdmin(membership) || membership.role === 'tenant_owner');
    return {
      canManageTeam: ok || canManageTeam(membership),
      canManageTenants: ok,
      canViewAllCustomers: ok || canViewAllClients(membership),
      canUseFinanceTools: ok || canUseFinanceTools(membership),
    };
  }, [auth.user]);

  const cards: ModuleCard[] = useMemo(
    () =>
      (
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
      ).filter((c) => !c.hidden),
    [opsCaps, stats],
  );

  const { featured, grouped } = useMemo(() => {
    const byPath = new Map(cards.map((c) => [c.path, c]));
    const featuredList = FEATURED_PATHS.map((p) => byPath.get(p)).filter(Boolean) as ModuleCard[];
    const featuredSet = new Set(featuredList.map((c) => c.path));
    const used = new Set(featuredSet);

    const take = (paths: string[]) =>
      paths
        .map((p) => byPath.get(p))
        .filter((c): c is ModuleCard => Boolean(c) && !featuredSet.has(c!.path))
        .map((c) => {
          used.add(c.path);
          return c;
        });

    const groups: ModuleGroup[] = [
      {
        key: 'core',
        title: 'Core ops',
        subtitle: 'Daily triage destinations',
        defaultOpen: true,
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
  }, [cards]);

  const primaryCtaPath = '/admin/workflow';
  const primaryCtaLabel =
    stats.slaBreaches > 0
      ? 'Clear SLA breaches'
      : stats.adminUnread > 0
        ? 'Open ops command'
        : 'Ops command center';

  const kpiChips: Array<{
    label: string;
    value: string | number;
    hint: string;
    accent: FinelyOsGlowAccent;
    path: string;
  }> = [
    { label: 'Partners', value: stats.partnersCount, hint: 'Records', accent: 'sky', path: '/admin/partners' },
    { label: 'Open cases', value: stats.openCasesCount, hint: 'Attention', accent: 'emerald', path: '/admin/cases' },
    { label: 'Open tasks', value: stats.openTasksCount, hint: 'Queue', accent: 'fuchsia', path: '/admin/workflow' },
    { label: 'Leads', value: stats.leadsCount, hint: 'Inbound', accent: 'violet', path: '/admin/crm?pipeline=inbound' },
    { label: 'Missing report', value: stats.partnersMissingReport, hint: 'Upload needed', accent: 'amber', path: '/admin/partners' },
    { label: 'Letters / 7d', value: stats.lettersThisWeek, hint: 'Generated', accent: 'violet', path: '/admin/workflow' },
    { label: 'SLA', value: stats.slaBreaches, hint: 'Breaches', accent: stats.slaBreaches > 0 ? 'rose' : 'emerald', path: '/admin/workflow' },
    {
      label: 'Comms / 7d',
      value: commsOps.sendsWeek,
      hint: commsOps.failedWeek > 0 ? `${commsOps.failedWeek} failed` : 'Sends',
      accent: commsOps.failedWeek > 0 ? 'amber' : 'fuchsia',
      path: '/admin/comms?room=inbox',
    },
  ];

  const featuredAccents: FinelyOsDeckAccent[] = ['amber', 'sky', 'violet', 'emerald'];

  return (
    <PageShell
      badge="Admin · Layout preview"
      title="Admin Dashboard"
      subtitle="Preview structure — command, alerts, KPI chips, featured modules, colored Core ops."
    >
      <div
        data-fc-dashboard-layout-preview="1"
        className={`${FINELY_OS_COMPACT_PAGE} fc-senior-simple text-white`}
      >
        {/* 1) Command strip — not a module card twin */}
        <header className="fc-dash-preview-command fc-platinum-frame fc-surface-platinum flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={finelyOsMicroStat('amber')}>Admin</span>
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono text-white/45`}>command center</span>
            </div>
            <h1 className="fc-dash-preview-section-title fc-dash-preview-section-title--command">
              Where you run the platform
            </h1>
            <p className="text-sm text-white/60">
              What matters now is below. Next step is the amber action on the right.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
              Portal
            </ActionLink>
            <button
              type="button"
              className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
              onClick={() => navigate(primaryCtaPath)}
            >
              {primaryCtaLabel}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="fc-button-platinum"
              onClick={() =>
                navigate(goLiveBlocked ? '/admin/launch-os#production-sequencer' : '/admin/launch-os#go-live')
              }
            >
              {goLiveBlocked ? 'Production sequencer' : 'Go-live center'}
            </button>
          </div>
        </header>

        {statsError ? (
          <FinelyOsDataErrorBanner
            message={statsError}
            hint="Partner list may be incomplete until this loads."
            onRetry={() => setStatsKey((k) => k + 1)}
          />
        ) : null}

        {/* 2) Alert / noticed — full-width banners, not card twins */}
        <div className="fc-dash-preview-alerts space-y-2">
          {stats.partnersMissingReport > 0 || stats.slaBreaches > 0 ? (
            <FinelyOsAlertBanner
              tone={stats.slaBreaches > 0 ? 'blocking' : 'warning'}
              className="!rounded-none border-x-0 sm:!rounded-xl sm:border-x"
              message={
                stats.slaBreaches > 0
                  ? `Launch ops: ${stats.slaBreaches} SLA breach(es) · ${stats.partnersMissingReport} partner(s) missing reports · ${stats.lettersThisWeek} letters this week.`
                  : `Launch ops: ${stats.partnersMissingReport} partner(s) still need a credit report uploaded · ${stats.lettersThisWeek} letters generated this week.`
              }
            />
          ) : null}
          <FinelyNoticedStrip
            items={buildAdminNoticedItems({
              slaBreaches: stats.slaBreaches,
              partnersWithoutReports: stats.partnersMissingReport,
              openCases: stats.openCasesCount,
              goLiveBlocked,
            })}
          />
          <FinelyNowDoThisStrip currentIndex={stats.slaBreaches > 0 ? 1 : 0} />
        </div>

        {/* 3) KPI chip rail — smaller than module cards */}
        <section aria-label="Key metrics" className="fc-dash-preview-kpi-rail space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="fc-dash-preview-section-kicker">Live metrics</div>
              <h2 className="fc-dash-preview-section-title fc-dash-preview-section-title--pulse">Pulse</h2>
            </div>
            <span className="fc-dash-preview-section-hint">Tap a chip to open the queue</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {kpiChips.map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={() => navigate(k.path)}
                className={`${finelyOsGlowKpi(k.accent)} fc-dash-preview-kpi-chip shrink-0 !px-3 !py-2 text-left min-w-[7.5rem]`}
              >
                <div className="text-[9px] font-black uppercase tracking-widest text-white/50">{k.label}</div>
                <div className="mt-0.5 text-lg font-bold tabular-nums text-white leading-none">{k.value}</div>
                <div className="mt-1 text-[10px] text-white/40">{k.hint}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 4) Featured primary modules — fewer, larger · platinum wealthy band */}
        <section
          aria-label="Primary modules"
          className="fc-dash-preview-platinum-band fc-platinum-frame fc-surface-platinum space-y-3"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="fc-dash-preview-section-kicker">Featured · not the full catalog</div>
              <h2 className="fc-dash-preview-section-title fc-dash-preview-section-title--start">Start here</h2>
            </div>
            <span className="fc-dash-preview-section-hint">Primary destinations</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((card, idx) => {
              const accent = featuredAccents[idx % featuredAccents.length];
              const iconAccent = ICON_ACCENTS[idx % ICON_ACCENTS.length];
              return (
                <button
                  key={card.path}
                  type="button"
                  onClick={() => navigate(card.path)}
                  className={`${finelyOsDeckTile(accent)} fc-dash-preview-featured p-4 text-left`}
                >
                  <div className="flex items-start gap-3">
                    <FinelyOsIconBadge icon={card.icon} accent={iconAccent} size={18} className="p-2.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-white">{card.title}</span>
                        <span className={finelyOsMicroStat(accent)}>{card.stat}</span>
                      </div>
                      <p className="mt-1 text-sm text-white/55 line-clamp-2">{card.description}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-200/80">
                        Open <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Supporting band: HOS + social — compact side-by-side, not full KPI twins */}
        <section className="grid gap-3 lg:grid-cols-2">
          <HosAccessCodesAdminPanel variant="dashboard" />
          <StaffSocialPresenceStrip compact />
        </section>

        {/* Activity chart — wide supporting plane */}
        <section className="fc-dash-preview-chart rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4">
          <TimeSeriesAreaChart
            title="14-day activity"
            subtitle="Leads, tasks, and cases — supporting context, not a module card."
            labels={stats.labels14}
            series={[
              { id: 'leads', label: 'Leads', color: 'rgba(245,158,11,1)', values: stats.leads14 },
              { id: 'tasks', label: 'Tasks', color: 'rgba(139,92,246,1)', values: stats.tasks14 },
              { id: 'cases', label: 'Cases', color: 'rgba(16,185,129,1)', values: stats.cases14 },
            ]}
            height={200}
          />
        </section>

        <AdminPlatformEventsFeed limit={8} />

        {/* 5) Module groups — distinct shells; Core ops = colored icon boxes */}
        <section aria-label="All modules" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="fc-dash-preview-section-kicker">Catalog groups</div>
              <h2 className="fc-dash-preview-section-title">All modules</h2>
            </div>
            <span className="fc-dash-preview-section-hint">Open a group · Core ops stays expanded</span>
          </div>
          {grouped.map((g) => {
            const metaAccent: FinelyOsDeckAccent =
              g.key === 'core'
                ? 'amber'
                : g.key === 'comms'
                  ? 'fuchsia'
                  : g.key === 'automation'
                    ? 'emerald'
                    : 'violet';
            return (
              <details
                key={g.key}
                className={`fc-dash-preview-group ${groupShellClass(g.key)}`}
                open={g.defaultOpen}
              >
                <summary className="select-none">
                  <span className="fc-dash-preview-open-cue">
                    <span className="fc-dash-preview-open-cue-prefix">OPEN</span>
                    <span aria-hidden="true"> — </span>
                    {g.title}
                  </span>
                  <span className="fc-dash-preview-open-hint">
                    Dropdown · {g.subtitle} · {g.cards.length} module{g.cards.length !== 1 ? 's' : ''}
                  </span>
                  <div className="fc-dash-preview-group-meta">
                    <div className="min-w-0">
                      <div className="fc-dash-preview-group-title">{g.title}</div>
                      <div className="fc-dash-preview-group-subtitle">{g.subtitle}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={finelyOsMicroStat(metaAccent)}>
                        {g.cards.length} module{g.cards.length !== 1 ? 's' : ''}
                      </span>
                      <span className="fc-dash-preview-collapse-hint">Tap to collapse</span>
                    </div>
                  </div>
                </summary>

                {g.key === 'core' ? (
                  <div className="fc-dash-preview-core-grid">
                    {g.cards.map((card, idx) => {
                      const accent = DECK_ACCENTS[idx % DECK_ACCENTS.length];
                      const iconAccent = ICON_ACCENTS[idx % ICON_ACCENTS.length];
                      const kpiAccent = FINELY_OS_KPI_ACCENTS[idx % FINELY_OS_KPI_ACCENTS.length];
                      return (
                        <button
                          key={card.path}
                          type="button"
                          onClick={() => navigate(card.path)}
                          className={`${finelyOsDeckTile(accent)} ${kpiAccent} fc-dash-preview-core-tile fc-accent-card ring-1 ring-inset ring-white/[0.08] !p-3.5`}
                        >
                          <div className="flex items-start gap-2.5">
                            <FinelyOsIconBadge icon={card.icon} accent={iconAccent} size={16} className="p-2" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-semibold text-white line-clamp-1">{card.title}</span>
                                <span className={finelyOsMicroStat(accent)}>{card.stat}</span>
                              </div>
                              <p className="mt-1 text-xs text-white/55 line-clamp-2">{card.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : g.key === 'comms' ? (
                  <div className="fc-dash-preview-comms-list">
                    {g.cards.map((card, idx) => {
                      const iconAccent = ICON_ACCENTS[(idx + 2) % ICON_ACCENTS.length];
                      return (
                        <button
                          key={card.path}
                          type="button"
                          onClick={() => navigate(card.path)}
                          className="fc-dash-preview-comms-row"
                        >
                          <FinelyOsIconBadge icon={card.icon} accent={iconAccent} size={14} className="p-2" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-white">{card.title}</span>
                            <span className="block truncate text-[11px] text-fuchsia-200/55">{card.stat}</span>
                          </span>
                          <ArrowRight size={14} className="shrink-0 text-sky-300/50" />
                        </button>
                      );
                    })}
                  </div>
                ) : g.key === 'automation' ? (
                  <div className="fc-dash-preview-auto-grid">
                    {g.cards.map((card, idx) => {
                      const iconAccent = ICON_ACCENTS[(idx + 1) % ICON_ACCENTS.length];
                      const deckAccent = DECK_ACCENTS[(idx + 1) % DECK_ACCENTS.length];
                      return (
                        <button
                          key={card.path}
                          type="button"
                          onClick={() => navigate(card.path)}
                          className={`${finelyOsDeckTile(deckAccent)} fc-dash-preview-auto-tile`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FinelyOsIconBadge icon={card.icon} accent={iconAccent} size={15} className="p-2" />
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-sm font-semibold text-white">{card.title}</span>
                              <span className="block truncate text-[11px] text-emerald-200/55">{card.stat}</span>
                            </span>
                            <ArrowRight size={13} className="shrink-0 text-emerald-300/45" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="fc-dash-preview-platform-list">
                    {g.cards.map((card, idx) => {
                      const iconAccent = ICON_ACCENTS[(idx + 3) % ICON_ACCENTS.length];
                      return (
                        <button
                          key={card.path}
                          type="button"
                          onClick={() => navigate(card.path)}
                          className="fc-dash-preview-platform-row"
                        >
                          <FinelyOsIconBadge icon={card.icon} accent={iconAccent} size={13} className="p-1.5" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white/90">{card.title}</span>
                            <span className="block truncate text-[11px] text-white/40">{card.stat}</span>
                          </span>
                          <ArrowRight size={12} className="shrink-0 text-white/25" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </details>
            );
          })}
        </section>

        {/* Ops & growth — stacked intel panels (different role from module decks) */}
        <section aria-label="Ops and growth" className="fc-dash-preview-ops space-y-3">
          <div>
            <div className="fc-dash-preview-section-kicker">Growth · health · revenue</div>
            <h2 className="fc-dash-preview-section-title">Ops intel</h2>
          </div>
          <AdminOpsHealthPanel />
          <AdminBillingOpsPanel />
          <AdminAffiliateOpsPanel />
          <AdminReferralGrowthPanel />
          <AdminWebhooksPanel />
          <AdminRevenueIntelPanel />
        </section>
      </div>
    </PageShell>
  );
}
