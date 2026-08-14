import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  MessageCircle,
  Repeat,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listTasks } from '../../data/tasksRepo';
import { listCases } from '../../data/casesRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsSectionTitle } from '../../features/os/FinelyOsIconBadge';
import {
  pullAdminRevenueSnapshot,
  type AdminRevenueSnapshot,
} from '../../data/billingAdminAggregateRepo';
import { pullLeadResponseMetrics, type LeadResponseMetrics } from '../../data/leadResponseMetricsRepo';
import { getFinelyPublicAnswerRoutingStats } from '../../lib/finelyBrain/finelyPublicAnswerMetrics';
import { formatPrice } from '../../config/pricingCatalog';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_EMPTY,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map((v) => Number(v));
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [stats, setStats] = useState({
    leadsCount: 0,
    tasksCount: 0,
    openTasksCount: 0,
    casesCount: 0,
    openCasesCount: 0,
  });
  const [revenue, setRevenue] = useState<AdminRevenueSnapshot | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [responseMetrics, setResponseMetrics] = useState<LeadResponseMetrics | null>(null);

  useEffect(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    const pidsPromise = u
      ? getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId })
      : Promise.resolve(new Set<string>());
    pidsPromise.then((partnerIds) => {
      const leads = listLeadCaptures();
      const tasks = listTasks().filter((t: any) => partnerIds.has(String((t as any).partnerId || '')));
      const cases = listCases().filter((c) => partnerIds.has(c.partnerId));
      const openTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
      const openCases = cases.filter((c) => c.status === 'open');
      setStats({
        leadsCount: leads.length,
        tasksCount: tasks.length,
        openTasksCount: openTasks.length,
        casesCount: cases.length,
        openCasesCount: openCases.length,
      });
    });
  }, [auth.user]);

  useEffect(() => {
    setRevenueLoading(true);
    pullAdminRevenueSnapshot()
      .then(setRevenue)
      .finally(() => setRevenueLoading(false));
    pullLeadResponseMetrics().then(setResponseMetrics);
  }, []);

  const chatRouting = getFinelyPublicAnswerRoutingStats();
  const hasRevenueError = revenue?.dataSource === 'unavailable';
  const maxMonthlyCents = Math.max(1, ...(revenue?.monthlyTrend.map((m) => m.totalCents) ?? [1]));

  return (
    <PageShell badge="Admin" title="Analytics" subtitle="High-signal operational visibility (tenant-scoped where applicable).">
      <div className={FINELY_OS_COMPACT_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK} title="Back to Admin Dashboard">
          <ArrowLeft size={16} /> Admin dashboard
        </button>

        <div className={FINELY_OS_BANNER}>
          <BarChart3 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          <p className={FINELY_OS_ENTITY_BODY}>
            Ops snapshot — answers “what’s happening right now?” without hunting through tabs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <FinelyOsOverviewStatTile icon={Users} label="Leads" value={stats.leadsCount} accent="violet" iconAccent="violet" hint="Total captured" />
          <FinelyOsOverviewStatTile icon={Target} label="Tasks" value={stats.tasksCount} accent="amber" iconAccent="amber" hint="Total" />
          <FinelyOsOverviewStatTile icon={Target} label="Open tasks" value={stats.openTasksCount} accent="amber" iconAccent="amber" hint="Pending + in progress" />
          <FinelyOsOverviewStatTile icon={Briefcase} label="Cases" value={stats.casesCount} accent="emerald" iconAccent="emerald" hint="Total" />
          <FinelyOsOverviewStatTile icon={Briefcase} label="Open cases" value={stats.openCasesCount} accent="emerald" iconAccent="emerald" hint="Active disputes" />
        </div>

        <FinelyOsSectionTitle icon={DollarSign} label="Revenue — three separate views, not one blended number" accent="emerald" />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <FinelyOsOverviewStatTile
            icon={DollarSign}
            label="One-time program revenue"
            value={revenueLoading ? '…' : formatPrice(revenue?.oneTimeProgramRevenueCents ?? 0)}
            accent="violet"
            iconAccent="violet"
            hint={`${revenue?.oneTimeProgramCount ?? 0} DFY/DIY agreements`}
          />
          <FinelyOsOverviewStatTile
            icon={Repeat}
            label="Recurring MRR"
            value={revenueLoading ? '…' : formatPrice(revenue?.recurringMembershipMrrCents ?? 0)}
            accent="emerald"
            iconAccent="emerald"
            hint={`${revenue?.recurringMembershipActiveCount ?? 0} active Core memberships`}
          />
          <FinelyOsOverviewStatTile
            icon={Building2}
            label="Agency revenue-share pipeline"
            value={revenueLoading ? '…' : formatPrice(revenue?.agencyRevenueSharePipelineCents ?? 0)}
            accent="fuchsia"
            iconAccent="fuchsia"
            hint={`${revenue?.agencyBuyInCount ?? 0} buy-ins ($1K–$499K ladder, 30–68% share)`}
          />
          <FinelyOsOverviewStatTile
            icon={Clock}
            label="Avg. time to first touch"
            value={
              !responseMetrics || responseMetrics.insufficientData
                ? 'Not enough data yet'
                : `${responseMetrics.avgTimeToFirstTouchMinutes} min`
            }
            accent="sky"
            iconAccent="sky"
            hint={
              responseMetrics && !responseMetrics.insufficientData
                ? `Across ${responseMetrics.sampleSize} acknowledged leads`
                : 'Needs 5+ acknowledged leads'
            }
          />
        </div>

        {hasRevenueError ? (
          <div className={`${finelyOsCatalogCardCompact('rose')} ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="rose">
            Revenue data unavailable: {revenue?.error || 'Supabase not configured'}. Figures above show $0 until this is resolved.
          </div>
        ) : null}

        <div className="grid lg:grid-cols-2 gap-3">
          <div className={`${finelyOsCatalogCardCompact('violet')} space-y-3`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_TITLE}>Revenue by category</div>
            {revenue && revenue.revenueByCategory.length > 0 ? (
              <div className="space-y-2">
                {revenue.revenueByCategory.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className={FINELY_OS_ENTITY_BODY}>{row.label}</span>
                    <span className={FINELY_OS_ENTITY_VALUE}>
                      {formatPrice(row.totalCents)} <span className={FINELY_OS_ENTITY_SUBLABEL}>· {row.count}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={FINELY_OS_ENTITY_EMPTY}>No one-time program revenue recorded yet.</div>
            )}
          </div>

          <div className={`${finelyOsCatalogCardCompact('fuchsia')} space-y-3`} data-fc-accent="fuchsia">
            <div className={FINELY_OS_ENTITY_TITLE}>Agency buy-ins by tier</div>
            {revenue && revenue.agencyByTier.length > 0 ? (
              <div className="space-y-2">
                {revenue.agencyByTier.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className={FINELY_OS_ENTITY_BODY}>{row.label}</span>
                    <span className={FINELY_OS_ENTITY_VALUE}>
                      {formatPrice(row.totalCents)} <span className={FINELY_OS_ENTITY_SUBLABEL}>· {row.count}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={FINELY_OS_ENTITY_EMPTY}>No agency buy-ins recorded yet — the $1K–$499K ladder has zero activations so far.</div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <div className={`${finelyOsCatalogCardCompact('sky')} space-y-3`} data-fc-accent="sky">
            <FinelyOsSectionTitle icon={TrendingUp} label="Ladder progression" accent="sky" />
            {revenue && revenue.ladderProgression.partnersWithMultipleAgreements > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>
                    {revenue.ladderProgression.progressionRatePct}%
                  </span>
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>
                    of {revenue.ladderProgression.partnersWithMultipleAgreements} multi-agreement partners graduated to a higher rung
                  </span>
                </div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  {revenue.ladderProgression.partnersProgressed} progressed (e.g. Restore → Wealth Builder → Business Credit) ·{' '}
                  {revenue.ladderProgression.partnersNotProgressed} have not yet re-purchased a higher tier.
                </div>
              </>
            ) : (
              <div className={FINELY_OS_ENTITY_EMPTY}>
                Not enough repeat-purchase history yet — ladder progression needs partners with 2+ agreements.
              </div>
            )}
          </div>

          <div className={`${finelyOsCatalogCardCompact('amber')} space-y-3`} data-fc-accent="amber">
            <div className={FINELY_OS_ENTITY_TITLE}>Monthly revenue trend</div>
            {revenue && revenue.monthlyTrend.length > 0 ? (
              <div className="space-y-1.5">
                {revenue.monthlyTrend.map((row) => (
                  <div key={row.month} className="flex items-center gap-2 text-xs">
                    <span className={`w-10 shrink-0 ${FINELY_OS_ENTITY_SUBLABEL}`}>{formatMonthLabel(row.month)}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400/70 to-amber-300/90"
                        style={{ width: `${Math.max(4, Math.round((row.totalCents / maxMonthlyCents) * 100))}%` }}
                      />
                    </div>
                    <span className={`w-16 text-right shrink-0 ${FINELY_OS_ENTITY_VALUE}`}>{formatPrice(row.totalCents)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={FINELY_OS_ENTITY_EMPTY}>No revenue-recognized agreements yet.</div>
            )}
          </div>
        </div>

        <FinelyOsSectionTitle icon={MessageCircle} label="Public chat — canned vs. real reasoning" accent="fuchsia" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <FinelyOsOverviewStatTile
            icon={MessageCircle}
            label="Reached real AI reasoning"
            value={chatRouting.total > 0 ? `${chatRouting.llmSharePct}%` : 'No data yet'}
            accent="fuchsia"
            iconAccent="fuchsia"
            hint={`${chatRouting.llm} of ${chatRouting.total} messages this browser`}
          />
          <FinelyOsOverviewStatTile
            icon={Target}
            label="Canned / local-knowledge replies"
            value={chatRouting.canned}
            accent="sky"
            iconAccent="sky"
            hint="FAQ-style topics (G1 classification gate)"
          />
        </div>

        <div className={`${finelyOsCatalogCardCompact('violet')} !p-4 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="violet">
          Tenant-scoped task and case counts respect your admin partner access. Lead captures are global to this browser store until Supabase sync is active. Revenue figures are a live cross-partner query (not per-browser localStorage).
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
