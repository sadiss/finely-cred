import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Gavel, Settings, Users, BarChart3, FileText, Layout, Package, CreditCard, FlaskConical, MessageSquareText, Bell, Calendar, FolderKanban, BookOpen, Bot, Mail, Library, Crown, UserCog, Globe, BadgeCheck, ListChecks, GraduationCap, Lock, PiggyBank, Trophy, Activity, Target, Sparkles, Film, BriefcaseBusiness, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import { listCases } from '../../data/casesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listTasks } from '../../data/tasksRepo';
import { unreadCount } from '../../data/notificationsRepo';
import { KpiCard } from '../../components/ui/KpiCards';
import { ActionLink, ClickableCard, CollapsibleSection, TimeSeriesAreaChart } from '../../components/ui';
import { bucketCountsByDay } from '../../utils/timeSeries';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { canManageTeam, canUseFinanceTools, canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { isAdminEmail } from '../../auth/admin';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showAllByGroup, setShowAllByGroup] = React.useState<Record<string, boolean>>({});

  const [stats, setStats] = useState({
    partnersCount: 0, casesCount: 0, openCasesCount: 0, leadsCount: 0,
    openTasksCount: 0, adminUnread: 0,
    labels14: [] as string[], leads14: [] as number[], tasks14: [] as number[], cases14: [] as number[],
  });
  useEffect(() => {
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
      setStats({
        partnersCount: partners.length,
        casesCount: tenantCases.length,
        openCasesCount: openCases.length,
        leadsCount: leads.length,
        openTasksCount: openTasks.length,
        adminUnread,
        labels14: leads14.labels,
        leads14: leads14.values,
        tasks14: tasks14.values,
        cases14: cases14.values,
      });
    }).catch(() => {});
  }, [auth.user]);

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
      title: 'Workflow Queue',
      description: 'Unread alerts + open tasks across partners (ops control center).',
      path: '/admin/workflow',
      icon: Bell,
      stat: `${stats.adminUnread} unread • ${stats.openTasksCount} open task${stats.openTasksCount !== 1 ? 's' : ''}`,
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
      title: 'Automation Studio',
      description: 'Run long-horizon automations and “agents” (follow-ups, reminders, nudges).',
      path: '/admin/automations',
      icon: Bot,
      stat: 'Automate',
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
      description: 'Enlightenment session requests and resource unlocks. View and action inbound leads.',
      path: '/admin/leads',
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
        cards: take(['/admin/comms', '/admin/resources', '/admin/courses', '/admin/templates', '/admin/testimonials', '/admin/guide']),
      },
      {
        key: 'automation',
        title: 'Automation & AI',
        subtitle: 'Assistants, automations, and generation tools.',
        defaultOpen: false,
        cards: take(['/admin/automations', '/admin/ops-agent', '/admin/lead-intel', '/admin/media-studio']),
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
            Dashboard
          </ActionLink>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">admin</div>
        </div>

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
            tone="amber"
            onClick={() => navigate('/admin/workflow')}
          />
          <KpiCard
            label="Leads"
            value={stats.leadsCount}
            hint="Captured inbound requests"
            series={stats.leads14}
            tone="violet"
            onClick={() => navigate('/admin/leads')}
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

        <div className="space-y-4">
          {grouped.map((g) => (
            <CollapsibleSection
              key={g.key}
              title={g.title}
              subtitle={g.subtitle}
              count={`${g.cards.length} module${g.cards.length !== 1 ? 's' : ''}`}
              defaultOpen={g.defaultOpen}
              storageKey={`admin.dashboard.${g.key}`}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(showAllByGroup[g.key] ? g.cards : g.cards.slice(0, 9)).map((card) => {
                  const Icon = card.icon;
                  const isDisabled = false;
                  return (
                    <ClickableCard
                      key={card.path}
                      onClick={() => !isDisabled && navigate(card.path)}
                      disabled={isDisabled}
                      className={`group p-6 ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3 text-amber-400">
                        <Icon size={18} />
                        <span className="text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                      </div>
                      <p className="mt-3 text-white/70 text-sm">{card.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{card.stat}</span>
                        {!isDisabled && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-amber-400">
                            Open <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </ClickableCard>
                  );
                })}
              </div>
              {g.cards.length > 9 ? (
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllByGroup((cur) => ({ ...cur, [g.key]: !cur[g.key] }))}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title={showAllByGroup[g.key] ? 'Show fewer modules' : 'Show all modules'}
                  >
                    {showAllByGroup[g.key] ? 'Show less' : `Show all (${g.cards.length})`}
                  </button>
                </div>
              ) : null}
            </CollapsibleSection>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
