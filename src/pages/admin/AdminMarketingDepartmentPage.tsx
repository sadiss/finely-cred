import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { MarketingCopilotStrip } from '../../features/marketingDepartment/MarketingCopilotStrip';
import { MarketingStartHerePanel } from '../../features/marketingDepartment/MarketingStartHerePanel';
import { MarketingTeamHierarchy } from '../../features/marketingDepartment/MarketingTeamHierarchy';
import { MarketingAutopilotStrip } from '../../features/marketingDepartment/MarketingAutopilotStrip';
import { MarketingNavGuide } from '../../features/marketingDepartment/MarketingNavGuide';
import '../../features/marketingDepartment/marketingHub.css';
import { MarketingWeekFocusHero } from '../../features/marketingDepartment/MarketingWeekFocusHero';
import { MarketingChannelsHub } from '../../features/marketingDepartment/MarketingChannelsHub';
import { buildMarketingHubQueueMetrics } from '../../features/marketingDepartment/agentLiveStatus';
import { AgentTeamTrailFeed } from '../../features/growthAgents/AgentTrailTimeline';
import { buildAgentArchitectBrief } from '../../features/growthAgents/growthAgentArchitectBrief';
import { FinelyCapabilityScorecard } from '../../features/admin/FinelyCapabilityScorecard';
import { GrowthCommandDepartmentPage } from '../../features/studioCommandOs/GrowthCommandDepartmentPage';
import { listCommsSends, listCommsTemplates } from '../../data/commsRepo';
import { listCommsSequences } from '../../data/commsSequencesRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listInboxMessages, listScheduledPosts } from '../../data/socialHubRepo';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { MarketingColorLegend } from '../../features/marketingDepartment/MarketingColorLegend';
import { MarketingWatchHowStrip } from '../../features/marketingDepartment/MarketingWatchHowStrip';
import { MarketingDeskEmbeddedPanel } from '../../features/marketingDepartment/MarketingDeskEmbeddedPanel';
import { isFeatureEnabled } from '../../data/settingsRepo';

const MediaStudioPremiumPage = lazy(() =>
  import('../../features/studioCommandOs/MediaStudioPremiumPage').then((m) => ({
    default: m.MediaStudioPremiumPage,
  })),
);
const AdminLeadsOsPage = lazy(() => import('./AdminLeadsOsPage'));
const AdminPlaybooksPage = lazy(() => import('./AdminPlaybooksPage'));

const HUB_TABS = [
  { id: 'start', label: 'Start here' },
  { id: 'plan', label: 'Marketing plan' },
  { id: 'desk', label: 'Daily desk' },
  { id: 'team', label: 'Marketing team' },
  { id: 'leads', label: 'Leads & CRM' },
  { id: 'content', label: 'Content' },
  { id: 'capture', label: 'Capture' },
] as const;

const ADVANCED_LINKS = [
  { title: 'Service delivery checklists', detail: 'Task templates for delivery — not automations', href: '/admin/marketing?tab=checklists' },
  { title: 'Overnight runner', detail: 'Scheduled lead search batches', href: '/admin/overnight' },
  { title: 'Campaign strategy (CMO)', detail: 'Angles, experiments, site watch', href: '/admin/cmo' },
  { title: 'Lead hunt preview', detail: 'Owner simulation — practice counters only', href: '/admin/leads?tab=intel' },
  { title: 'Growth Autopilot', detail: 'Scheduler ticks for daily find + week sync', href: '/admin/growth-automation' },
  { title: 'Comms Studio', detail: 'Templates, sequences, broadcasts', href: '/admin/comms' },
] as const;

type HubTab = (typeof HUB_TABS)[number]['id'] | 'checklists';

function parseTab(raw: string | null): HubTab {
  if (raw === 'checklists') return 'checklists';
  const hit = HUB_TABS.find((t) => t.id === raw);
  return hit?.id ?? 'start';
}

function HubFallback() {
  return <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Loading workspace…</div>;
}

export default function AdminMarketingDepartmentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const [simpleMode, setSimpleMode] = useState(false);
  const [version, setVersion] = useState(0);

  const metrics = useMemo(() => {
    void version;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const queues = buildMarketingHubQueueMetrics();
    return {
      sends: listCommsSends(400).filter((s) => Date.parse(s.createdAt) >= weekAgo).length,
      leads: listLeadCaptures().filter((l) => Date.parse(l.createdAt) >= weekAgo).length,
      posts: listScheduledPosts().filter((p) => Date.parse(p.createdAt) >= weekAgo).length,
      replies: listInboxMessages().filter((m) => m.direction === 'inbound').length,
      templates: listCommsTemplates().length,
      sequences: listCommsSequences().length,
      ...queues,
    };
  }, [version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'advanced') setSimpleMode(false);
    else if (mode === 'simple') setSimpleMode(true);
    else if (!mode) {
      const next = new URLSearchParams(searchParams);
      next.set('mode', 'advanced');
      setSearchParams(next, { replace: true });
      setSimpleMode(false);
    }
  }, [searchParams, setSearchParams]);

  const setTab = (id: HubTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    if (id !== 'desk') {
      next.delete('helper');
      next.delete('room');
    }
    setSearchParams(next, { replace: true });
  };

  const toggleMode = () => {
    const next = new URLSearchParams(searchParams);
    const advanced = simpleMode;
    next.set('mode', advanced ? 'advanced' : 'simple');
    setSearchParams(next, { replace: true });
    setSimpleMode(!advanced);
  };

  const visibleTabs = simpleMode
    ? HUB_TABS.filter((t) => ['start', 'desk', 'leads', 'content'].includes(t.id))
    : [...HUB_TABS, { id: 'checklists' as const, label: 'Checklists' }];

  const kpis = [
    { label: 'Booked (7d)', value: String(metrics.booked7d), hint: 'CRM sessions', accent: 'emerald' as const },
    { label: 'Needs review', value: String(metrics.needsReview), hint: 'Caleb find queue', accent: 'violet' as const },
    { label: 'Active nurture', value: String(metrics.activeNurture), hint: 'Email sequences ($0)', accent: 'sky' as const },
    { label: 'Failed sends', value: String(metrics.failedSends), hint: metrics.failedSends ? 'Fix in Comms' : 'All clear', accent: 'rose' as const },
    { label: 'Social review', value: String(metrics.socialReview), hint: 'Miriam queue', accent: 'violet' as const },
    { label: 'New leads', value: String(metrics.leads), hint: 'Captured inbound', accent: 'sky' as const },
  ];

  const renderTab = () => {
    switch (tab) {
      case 'start':
        return (
          <div className="space-y-4">
            <MarketingWeekFocusHero />
            <MarketingStartHerePanel />
            <MarketingChannelsHub />
            <MarketingWatchHowStrip />
          </div>
        );
      case 'plan':
        return (
          <div className="space-y-6">
            <GrowthCommandDepartmentPage />
            <FinelyCapabilityScorecard variant="compact" />
          </div>
        );
      case 'desk':
        return <MarketingDeskEmbeddedPanel />;
      case 'team':
        return (
          <div className="space-y-6">
            <MarketingTeamHierarchy />
            <div className={`${finelyOsCatalogCard('sky')} space-y-4`} data-fc-accent="sky">
              <p className="text-sm font-extrabold uppercase tracking-widest text-sky-200">Team trail</p>
              <AgentTeamTrailFeed limit={5} />
              <div className={finelyOsCatalogCard('rose')} data-fc-accent="rose">
                <p className="text-sm font-extrabold uppercase tracking-widest text-rose-200">Architect brief</p>
                <p className={`mt-2 text-base font-semibold text-white`}>{buildAgentArchitectBrief().headline}</p>
              </div>
            </div>
          </div>
        );
      case 'leads':
        return (
          <Suspense fallback={<HubFallback />}>
            <AdminLeadsOsPage embedded initialTab={searchParams.get('leadsTab') ?? 'inbound'} />
          </Suspense>
        );
      case 'content':
        return (
          <Suspense fallback={<HubFallback />}>
            <MediaStudioPremiumPage embedded />
          </Suspense>
        );
      case 'capture':
        return (
          <div className="space-y-6">
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
              Tracked links, QR codes, lead magnets, and syndication — Hannah Reed owns capture.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/lead-acquisition')}>
                Lead acquisition & links
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/lead-magnets')}>
                Lead magnets
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/capture-links')}>
                Open Hannah workspace
              </button>
            </div>
          </div>
        );
      case 'checklists':
        return (
          <Suspense fallback={<HubFallback />}>
            <AdminPlaybooksPage embedded />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <PageShell
      badge="Admin"
      title="Marketing Department"
      subtitle="Get leads · create content · follow up — one hub for the whole team."
    >
      <div className={FINELY_OS_COMPACT_PAGE}>
        <MarketingNavGuide />
        <MarketingCopilotStrip />
        <MarketingAutopilotStrip />

        <FinelyUnifiedHubLayout
          eyebrow="Marketing Department"
          title={simpleMode ? 'Start here' : 'Promote · nurture · communicate'}
          subtitle="Plain English jobs first — full-depth tools behind every tab."
          accent="emerald"
          kpis={kpis}
          tabs={visibleTabs}
          activeTab={tab}
          onTabChange={(id) => setTab(id as HubTab)}
          tabDensity="comfortable"
          tabStripVariant="marketing"
          primaryAction={{ label: 'Find new people', onClick: () => navigate('/admin/marketing?tab=desk&helper=find') }}
          secondaryAction={{ label: simpleMode ? 'Show all tabs' : 'Simple mode', onClick: toggleMode }}
          contentVariant="flush"
          detailSlot={
            <div className="space-y-4">
              <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
                Advanced tools stay one click away — checklists are delivery SOPs, not automation triggers.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {ADVANCED_LINKS.map((link, idx) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => navigate(link.href)}
                    className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} text-left`}
                    data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
                  >
                    <div className="text-xl font-extrabold text-white">{link.title}</div>
                    <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>{link.detail}</p>
                    {link.title.includes('preview') ? (
                      <span className={`mt-2 inline-block ${FINELY_OS_ENTITY_CHIP}`}>Simulation</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          }
          detailLabel="Advanced marketing tools"
        >
          {!isFeatureEnabled('marketingDesk') && tab === 'desk' ? (
            <p className={`mb-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Marketing Desk preview — enable in Settings → Features for production routing.
            </p>
          ) : null}
          {renderTab()}
        </FinelyUnifiedHubLayout>

        <MarketingColorLegend />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
