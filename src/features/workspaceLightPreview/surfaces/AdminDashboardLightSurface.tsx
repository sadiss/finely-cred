import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActionLink, TimeSeriesAreaChart } from '../../../components/ui';
import { FinelyOsDataErrorBanner } from '../../os/FinelyOsDataErrorBanner';
import { FinelyNoticedStrip } from '../../../components/tours/FinelyNoticedStrip';
import { FinelyNowDoThisStrip } from '../../../components/tours/FinelyNowDoThisStrip';
import { buildAdminNoticedItems } from '../../../lib/finelyProactiveSignals';
import { HosAccessCodesAdminPanel } from '../../../components/heta/HosAccessCodesAdminPanel';
import { StaffSocialPresenceStrip } from '../../staffCommandCenter/StaffSocialPresenceStrip';
import { AdminPlatformEventsFeed } from '../../admin/AdminPlatformEventsFeed';
import { AdminRevenueIntelPanel } from '../../admin/AdminRevenueIntelPanel';
import { AdminAffiliateOpsPanel } from '../../admin/AdminAffiliateOpsPanel';
import { AdminReferralGrowthPanel } from '../../admin/AdminReferralGrowthPanel';
import { AdminOpsHealthPanel } from '../../admin/AdminOpsHealthPanel';
import { AdminWebhooksPanel } from '../../admin/AdminWebhooksPanel';
import { AdminBillingOpsPanel } from '../../admin/AdminBillingOpsPanel';
import { FINELY_OS_PRIMARY_BTN } from '../../os/finelyOsLightUi';
import { WL_ADMIN_SECTIONS } from '../workspaceLightDesignTokens';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData';
import {
  WlAppShell,
  WlChartCanvas,
  WlCommandHub,
  WlFeaturedBand,
  WlKpiGrid,
  WlKpiRail,
  WlModuleShelf,
  WlOpsPanel,
  WlRoseAlertSlab,
  WlSectionBand,
  WlSectionHeader,
  WlTabNav,
} from '../components';

type AdminSection = 'overview' | 'ops' | 'modules';

/** @deprecated Use `AdminDashboardProductSurface` for `/preview/workspace-light/admin/dashboard`. */
export function AdminDashboardLightSurface() {
  const navigate = useNavigate();
  const {
    stats,
    statsError,
    retryStats,
    commsOps,
    goLiveBlocked,
    featured,
    grouped,
    primaryCtaPath,
    primaryCtaLabel,
  } = useAdminDashboardData();

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const jumpToSection = (id: AdminSection) => {
    setActiveSection(id);
    window.setTimeout(() => {
      document.getElementById(`admin-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const kpiChips: import('../components/WlKpiGrid').WlKpiItem[] = [
    { label: 'Partners', value: stats.partnersCount, hint: 'Records', accent: 'sky', onClick: () => navigate('/preview/workspace-light/admin/partners') },
    { label: 'Open cases', value: stats.openCasesCount, hint: 'Attention', accent: 'emerald', onClick: () => navigate('/preview/workspace-light/admin/cases') },
    { label: 'Open tasks', value: stats.openTasksCount, hint: 'Queue', accent: 'fuchsia', onClick: () => navigate('/preview/workspace-light/admin/workflow') },
    { label: 'Leads', value: stats.leadsCount, hint: 'Inbound', accent: 'violet', onClick: () => navigate('/preview/workspace-light/admin/crm') },
    { label: 'Missing report', value: stats.partnersMissingReport, hint: 'Upload needed', accent: 'rose', onClick: () => navigate('/preview/workspace-light/admin/partners') },
    { label: 'Letters / 7d', value: stats.lettersThisWeek, hint: 'Generated', accent: 'violet', onClick: () => navigate('/preview/workspace-light/admin/workflow') },
    {
      label: 'SLA',
      value: stats.slaBreaches,
      hint: 'Breaches',
      accent: stats.slaBreaches > 0 ? 'rose' : 'emerald',
      onClick: () => navigate('/preview/workspace-light/admin/workflow'),
    },
    {
      label: 'Comms / 7d',
      value: commsOps.sendsWeek,
      hint: commsOps.failedWeek > 0 ? `${commsOps.failedWeek} failed` : 'Sends',
      accent: commsOps.failedWeek > 0 ? 'fuchsia' : 'sky',
      onClick: () => navigate('/preview/workspace-light/admin/communications'),
    },
  ];

  return (
    <WlAppShell workspace="admin" livePath="/admin">
      <WlCommandHub
        accent="violet"
        badge="Admin"
        eyebrow="command center"
        title="Where you run the platform"
        subtitle="What matters now is below. Next step is the primary action on the right."
        actions={
          <>
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
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-500/15"
              onClick={() =>
                navigate(goLiveBlocked ? '/admin/launch-os#production-sequencer' : '/admin/launch-os#go-live')
              }
            >
              {goLiveBlocked ? 'Production sequencer' : 'Go-live center'}
            </button>
          </>
        }
      />

      {statsError ? (
        <FinelyOsDataErrorBanner
          message={statsError}
          hint="Partner list may be incomplete until this loads."
          onRetry={retryStats}
          surface="light"
        />
      ) : null}

      {stats.partnersMissingReport > 0 || stats.slaBreaches > 0 ? (
        <WlRoseAlertSlab>
          <div className="text-sm font-semibold">
            {stats.slaBreaches > 0
              ? `Launch ops: ${stats.slaBreaches} SLA breach(es) · ${stats.partnersMissingReport} partner(s) missing reports · ${stats.lettersThisWeek} letters this week.`
              : `Launch ops: ${stats.partnersMissingReport} partner(s) still need a credit report uploaded · ${stats.lettersThisWeek} letters generated this week.`}
          </div>
        </WlRoseAlertSlab>
      ) : null}

      <FinelyNoticedStrip
        surface="light"
        items={buildAdminNoticedItems({
          slaBreaches: stats.slaBreaches,
          partnersWithoutReports: stats.partnersMissingReport,
          openCases: stats.openCasesCount,
          goLiveBlocked,
        })}
      />
      <FinelyNowDoThisStrip surface="light" currentIndex={stats.slaBreaches > 0 ? 1 : 0} />

      <WlTabNav
        tabs={[
          { id: 'overview', label: WL_ADMIN_SECTIONS.overview.label },
          { id: 'ops', label: WL_ADMIN_SECTIONS.ops.label },
          { id: 'modules', label: WL_ADMIN_SECTIONS.modules.label },
        ]}
        activeId={activeSection}
        onChange={(id: string) => jumpToSection(id as AdminSection)}
      />

      <WlSectionBand accent="emerald" id="admin-overview" variant="open">
        <WlSectionHeader eyebrow={WL_ADMIN_SECTIONS.overview.eyebrow} title="Pulse" hint="Tap a chip to open the queue" />
        <WlKpiRail items={kpiChips} />

        <div className="mt-4">
          <WlFeaturedBand cards={featured} onNavigate={navigate} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <HosAccessCodesAdminPanel variant="dashboard" />
          <StaffSocialPresenceStrip compact />
        </div>

        <div className="mt-4">
          <WlChartCanvas>
            <TimeSeriesAreaChart
              title="14-day activity"
              subtitle="Leads, tasks, and cases — supporting context."
              labels={stats.labels14}
              series={[
                { id: 'leads', label: 'Leads', color: 'rgba(245,158,11,1)', values: stats.leads14 },
                { id: 'tasks', label: 'Tasks', color: 'rgba(139,92,246,1)', values: stats.tasks14 },
                { id: 'cases', label: 'Cases', color: 'rgba(16,185,129,1)', values: stats.cases14 },
              ]}
              height={200}
            />
          </WlChartCanvas>
        </div>

        <div className="mt-4">
          <AdminPlatformEventsFeed limit={8} />
        </div>

        <div className="mt-4">
          <WlSectionHeader eyebrow="Secondary metrics" title="Comms & letters" />
          <WlKpiGrid
            items={[
              { label: 'Comms / 7d', value: commsOps.sendsWeek, hint: 'Sends', accent: 'sky' },
              { label: 'Failed', value: commsOps.failedWeek, hint: 'This week', accent: commsOps.failedWeek > 0 ? 'rose' : 'emerald' },
              { label: 'Letters / 7d', value: stats.lettersThisWeek, hint: 'Generated', accent: 'violet' },
              { label: 'Templates', value: commsOps.templates, hint: 'Active', accent: 'navy' },
            ]}
          />
        </div>
      </WlSectionBand>

      <WlSectionBand accent="violet" id="admin-ops" variant="tinted">
        <WlSectionHeader eyebrow={WL_ADMIN_SECTIONS.ops.eyebrow} title="Ops intel" hint="Growth · health · revenue" />
        <div className="space-y-3">
          <WlOpsPanel accent="emerald">
            <AdminOpsHealthPanel />
          </WlOpsPanel>
          <WlOpsPanel accent="navy">
            <AdminBillingOpsPanel />
          </WlOpsPanel>
          <WlOpsPanel accent="sky">
            <AdminAffiliateOpsPanel />
          </WlOpsPanel>
          <WlOpsPanel accent="violet">
            <AdminReferralGrowthPanel />
          </WlOpsPanel>
          <WlOpsPanel accent="fuchsia">
            <AdminWebhooksPanel />
          </WlOpsPanel>
          <WlOpsPanel accent="emerald">
            <AdminRevenueIntelPanel />
          </WlOpsPanel>
        </div>
      </WlSectionBand>

      <WlSectionBand accent="sky" id="admin-modules" variant="ivory">
        <WlSectionHeader
          eyebrow={WL_ADMIN_SECTIONS.modules.eyebrow}
          title="All modules"
          hint="Open a group when you need it — all collapsed by default"
        />
        <div className="space-y-3">
          {grouped.map((g) => (
            <WlModuleShelf
              key={g.key}
              groupKey={g.key}
              title={g.title}
              subtitle={g.subtitle}
              defaultOpen={g.defaultOpen}
              cards={g.cards}
              onNavigate={navigate}
            />
          ))}
        </div>
      </WlSectionBand>
    </WlAppShell>
  );
}
