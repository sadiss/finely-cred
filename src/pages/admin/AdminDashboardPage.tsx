import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Gavel, Settings, Users, BarChart3, FileText, Layout, Package, CreditCard, FlaskConical, MessageSquareText, Bell, Calendar, FolderKanban, BookOpen, Bot, Mail, Library, Crown, UserCog, Globe, BadgeCheck, ListChecks, GraduationCap, Lock, PiggyBank, Trophy, Activity, Target, Sparkles, Film, BriefcaseBusiness, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import { listCases } from '../../data/casesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listTasks } from '../../data/tasksRepo';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { countSlaBreaches } from '../../features/work/sla/listSlaBreaches';
import { unreadCount } from '../../data/notificationsRepo';
import { KpiCard } from '../../components/ui/KpiCards';
import { ActionLink, CollapsibleSection, TimeSeriesAreaChart } from '../../components/ui';
import { bucketCountsByDay } from '../../utils/timeSeries';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { canManageTeam, canUseFinanceTools, canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { isAdminEmail } from '../../auth/admin';
import { FinelyOsCatalogBrowser } from '../../features/os/FinelyOsCatalogBrowser';
import { FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { AdminPlatformEventsFeed } from '../../features/admin/AdminPlatformEventsFeed';
import { AdminRevenueIntelPanel } from '../../features/admin/AdminRevenueIntelPanel';
import { AdminAffiliateOpsPanel } from '../../features/admin/AdminAffiliateOpsPanel';
import { AdminReferralGrowthPanel } from '../../features/admin/AdminReferralGrowthPanel';
import { AdminOpsHealthPanel } from '../../features/admin/AdminOpsHealthPanel';
import { AdminWebhooksPanel } from '../../features/admin/AdminWebhooksPanel';
import { AdminBillingOpsPanel } from '../../features/admin/AdminBillingOpsPanel';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { TOUR_MANIFEST } from '../../config/tourManifest';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { buildAdminNoticedItems } from '../../lib/finelyProactiveSignals';
import { getGoLivePillars } from '../../lib/goLiveCommandOps';

type AdminDashSection = 'overview' | 'ops' | 'modules';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [activeSection, setActiveSection] = useState<AdminDashSection>('overview');

  const jumpToSection = (id: AdminDashSection) => {
    setActiveSection(id);
    window.setTimeout(() => {
      document.getElementById(`admin-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState(0);
  const [stats, setStats] = useState({
    partnersCount: 0, casesCount: 0, openCasesCount: 0, leadsCount: 0,
    openTasksCount: 0, adminUnread: 0,
    partnersMissingReport: 0, lettersThisWeek: 0, slaBreaches: 0,
    labels14: [] as string[], leads14: [] as number[], tasks14: [] as number[], cases14: [] as number[],
  });
  useEffect(() => {
    setStatsError(null);
    fetchAllPartnersAsAdmin().then((partners) => {
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
    }).catch((e: unknown) => {
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
    if (!u) return { canManageTeam: false, canManageTenants: false };
    // Allowlisted admins should always see full Admin modules even if local tenant membership storage is unavailable.
    if (isAdminEmail(u.email)) {
      return { canManageTeam: true, canManageTenants: true, canViewAllClients: true, canUseFinanceTools: true };
    }
    const membership =
      getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    const ok = membership?.status === 'active' && (isPlatformAdmin(membership) || membership.role === 'tenant_owner');
    return {
      canManageTeam: ok || canManageTeam(membership),
      canManageTenants: ok,
      canViewAllClients: ok || canViewAllClients(membership),
      canUseFinanceTools: ok || canUseFinanceTools(membership),
    };
  }, [auth.user]);

  const cards = [
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
      hidden: false,
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
      stat: `${stats.adminUnread} unread • ${stats.openTasksCount} open task${stats.openTasksCount !== 1 ? 's' : ''}`,
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
      description: 'Search + enrich qualified prospects (clients, affiliates, agents, teams, AU sellers, B2B partners). Save into CRM.',
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
      description: 'Run long-horizon automations and “agents” (follow-ups, reminders, nudges).',
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
      title: 'Agent Staff Command Center',
      description: 'Roster, shifts, on-duty specialists, and role routing for public chat handoff.',
      path: '/admin/agent-staff',
      icon: Users,
      stat: 'Staff OS',
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
      title: 'Co‑Owner Ops Agent',
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
      stat: 'Agents • Affiliates • Sellers',
    },
    {
      title: 'Tenants (White‑Label)',
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
      title: 'AI Media Studio',
      description: 'Generate premium images + storyboard videos. Edit scenes and export downloadable assets.',
      path: '/admin/media-studio',
      icon: Film,
      stat: 'Create',
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
      title: 'Support Inbox',
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
  ].filter((c: any) => !c.hidden);

  const visibleCards = cards;

  const grouped = useMemo(() => {
    const byPath = new Map(visibleCards.map((c: any) => [c.path, c]));
    const used = new Set<string>();

    const take = (paths: string[]) =>
      paths
        .map((p) => byPath.get(p))
        .filter(Boolean)
        .map((c: any) => {
          used.add(c.path);
          return c;
        });

    const groups: Array<{
      key: string;
      title: string;
      subtitle: string;
      defaultOpen: boolean;
      cards: any[];
    }> = [
      {
        key: 'core',
        title: 'Core ops',
        subtitle: 'The daily control center (workflow, clients, cases, projects).',
        defaultOpen: true,
        cards: take([
          '/admin/workflow',
          '/admin/partners',
          '/admin/cases',
          '/admin/tasks/new',
          '/admin/projects',
          '/admin/leads',
          '/admin/calendar',
          '/admin/crm',
          '/admin/support',
        ]),
      },
      {
        key: 'comms',
        title: 'Comms & content',
        subtitle: 'Templates, resources, courses, and publishable assets.',
        defaultOpen: false,
        cards: take(['/admin/comms', '/admin/resources', '/admin/tour-studio', '/admin/launch-os', '/admin/courses', '/admin/templates', '/admin/testimonials', '/admin/guide']),
      },
      {
        key: 'automation',
        title: 'Automation & AI',
        subtitle: 'Assistants, automations, and generation tools.',
        defaultOpen: false,
        cards: take(['/admin/automations', '/admin/ops-autopilot', '/admin/agent-staff', '/admin/lead-magnets', '/admin/ops-agent', '/admin/lead-intel', '/admin/media-studio']),
      },
      {
        key: 'platform',
        title: 'Platform & settings',
        subtitle: 'Access, tenants, billing/finance, and system configuration.',
        defaultOpen: false,
        cards: take([
          '/admin/access',
          '/admin/team',
          '/admin/tenants',
          '/admin/billing',
          '/admin/finance',
          '/admin/monitoring',
          '/admin/nora-capital',
          '/admin/vault',
          '/admin/parsing-lab',
          '/admin/settings?tab=appearance',
          '/admin/settings',
          '/admin/au-sellers',
        ]),
      },
    ];

    const leftover = visibleCards.filter((c: any) => !used.has(c.path));
    if (leftover.length) {
      groups.push({
        key: 'more',
        title: 'More',
        subtitle: 'Additional modules.',
        defaultOpen: false,
        cards: leftover,
      });
    }

    return groups.filter((g) => g.cards.length > 0);
  }, [visibleCards]);

  return (
    <PageShell
      badge="Admin"
      title="Admin Dashboard"
      subtitle="Overview and quick access to partner management, cases, and system settings."
    >
      <div className="space-y-6 fc-senior-simple">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
            Dashboard
          </ActionLink>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>admin</div>
        </div>

        {statsError ? (
          <FinelyOsDataErrorBanner
            message={statsError}
            hint="Partner list may be incomplete until this loads."
            onRetry={() => setStatsKey((k) => k + 1)}
          />
        ) : null}

        {stats.partnersMissingReport > 0 || stats.slaBreaches > 0 ? (
          <FinelyOsAlertBanner
            tone={stats.slaBreaches > 0 ? 'blocking' : 'warning'}
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

        <FinelyUnifiedHubLayout
          eyebrow="Command center"
          title="Admin dashboard"
          subtitle="KPIs, ops intel, and modules — scroll or jump; nothing hidden behind tabs."
          accent="violet"
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'ops', label: 'Ops & growth' },
            { id: 'modules', label: 'All modules' },
          ]}
          activeTab={activeSection}
          onTabChange={(id) => jumpToSection(id as AdminDashSection)}
          primaryAction={{ label: 'Ops command center', onClick: () => navigate('/admin/workflow') }}
          secondaryAction={{
            label: goLiveBlocked ? 'Production sequencer' : 'Go-live center',
            onClick: () =>
              navigate(goLiveBlocked ? '/admin/launch-os#production-sequencer' : '/admin/launch-os#go-live'),
          }}
        >
          <section id="admin-overview" className="fc-scroll-section space-y-6">
              <h2 className="fc-launch-lane-header">Overview</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Partners"
                  value={stats.partnersCount}
                  hint="Active partner records"
                  tone="sky"
                  onClick={() => navigate('/admin/partners')}
                />
                <KpiCard
                  label="Open cases"
                  value={stats.openCasesCount}
                  hint="Cases needing attention"
                  series={stats.cases14}
                  tone="emerald"
                  onClick={() => navigate('/admin/cases')}
                />
                <KpiCard
                  label="Open tasks"
                  value={stats.openTasksCount}
                  hint="Ops queue work items"
                  series={stats.tasks14}
                  tone="fuchsia"
                  onClick={() => navigate('/admin/workflow')}
                />
                <KpiCard
                  label="Leads"
                  value={stats.leadsCount}
                  hint="Captured inbound requests"
                  series={stats.leads14}
                  tone="violet"
                  onClick={() => navigate('/admin/crm?pipeline=inbound')}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <KpiCard
                  label="Missing report"
                  value={stats.partnersMissingReport}
                  hint="Partners with no uploaded credit report"
                  tone="amber"
                  onClick={() => navigate('/admin/partners')}
                />
                <KpiCard
                  label="Letters this week"
                  value={stats.lettersThisWeek}
                  hint="Dispute letters generated in the last 7 days"
                  tone="violet"
                  onClick={() => navigate('/admin/workflow')}
                />
                <KpiCard
                  label="SLA breaches"
                  value={stats.slaBreaches}
                  hint="Open tasks past SLA deadline"
                  tone="fuchsia"
                  onClick={() => navigate('/admin/workflow')}
                />
              </div>

              <TimeSeriesAreaChart
                title="14-day activity"
                subtitle="Leads captured, tasks created, and cases opened (tenant-scoped where applicable)."
                labels={stats.labels14}
                series={[
                  { id: 'leads', label: 'Leads', color: 'rgba(245,158,11,1)', values: stats.leads14 },
                  { id: 'tasks', label: 'Tasks', color: 'rgba(139,92,246,1)', values: stats.tasks14 },
                  { id: 'cases', label: 'Cases', color: 'rgba(16,185,129,1)', values: stats.cases14 },
                ]}
                height={240}
              />

              <AdminPlatformEventsFeed limit={10} />
          </section>

          <section id="admin-ops" className="fc-scroll-section space-y-6">
              <h2 className="fc-launch-lane-header">Ops &amp; growth</h2>
              <AdminOpsHealthPanel />
              <AdminBillingOpsPanel />
              <AdminAffiliateOpsPanel />
              <AdminReferralGrowthPanel />
              <AdminWebhooksPanel />
              <AdminRevenueIntelPanel />
          </section>

          <section id="admin-modules" className="fc-scroll-section space-y-4">
              <h2 className="fc-launch-lane-header">All modules</h2>
              {grouped.map((g) => (
                <CollapsibleSection
                  key={g.key}
                  variant="dark"
                  title={g.title}
                  subtitle={g.subtitle}
                  count={`${g.cards.length} module${g.cards.length !== 1 ? 's' : ''}`}
                  defaultOpen={g.defaultOpen}
                  storageKey={`admin.dashboard.${g.key}`}
                >
                  <FinelyOsCatalogBrowser
                    items={g.cards.map((card: any, idx: number) => ({
                      id: card.path,
                      title: card.title,
                      subtitle: card.stat,
                      description: card.description,
                      groupKey: g.key,
                      icon: card.icon,
                      accentIndex: idx,
                    }))}
                    pageSize={6}
                    searchPlaceholder={`Search ${g.title.toLowerCase()}…`}
                    emptyMessage="No modules in this group."
                    showViewToggle={false}
                    initialView="grid"
                    onItemClick={(path) => navigate(path)}
                  />
                </CollapsibleSection>
              ))}
          </section>
        </FinelyUnifiedHubLayout>
      </div>
    </PageShell>
  );
}
