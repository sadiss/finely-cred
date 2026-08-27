import React, { useMemo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { WlAppShell } from '../components';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData';
import { useWorkspaceLightPreview } from '../useWorkspaceLightPreview';
import { AdminCommandCenterProduct } from '../product/admin/AdminCommandCenterProduct';
import { ADMIN_COMMAND_CENTER_DEMO } from '../product/data/workspacePreviewFixtures';
import type { AdminCommandCenterModel } from '../product/data/workspacePreviewModels';
import { ProductDashboardSkeleton } from '../product/components/ProductUi';

export function AdminDashboardProductBody({ dataMode }: { dataMode: 'demo' | 'real' }) {
  const {
    stats,
    statsError,
    statsLoading,
    retryStats,
    commsOps,
    goLiveBlocked,
  } = useAdminDashboardData();

  const realModel = useMemo<AdminCommandCenterModel>(() => {
    const reportCoverage =
      stats.partnersCount > 0
        ? Math.max(0, Math.round(((stats.partnersCount - stats.partnersMissingReport) / stats.partnersCount) * 100))
        : 0;

    const priorities: AdminCommandCenterModel['priorities'] = [];
    if (stats.slaBreaches > 0) {
      priorities.push({
        id: 'real-sla',
        title: `${stats.slaBreaches} work item${stats.slaBreaches === 1 ? '' : 's'} beyond the response target`,
        description: 'Review ownership and clear the oldest service-level exception first.',
        status: 'needs_action',
        statusLabel: 'Urgent',
        meta: 'Now',
        route: '/admin/workflow',
        kind: 'task',
      });
    }
    if (stats.partnersMissingReport > 0) {
      priorities.push({
        id: 'real-reports',
        title: `${stats.partnersMissingReport} partner${stats.partnersMissingReport === 1 ? '' : 's'} missing a credit report`,
        description: 'Open partner operations to request or upload the current report.',
        status: 'needs_action',
        meta: 'Today',
        route: '/admin/partners',
        kind: 'report',
      });
    }
    if (stats.openCasesCount > 0) {
      priorities.push({
        id: 'real-cases',
        title: `${stats.openCasesCount} open case${stats.openCasesCount === 1 ? '' : 's'} in progress`,
        description: 'Review active rounds, partner evidence, and the next required decision.',
        status: 'in_progress',
        meta: 'Open queue',
        route: '/admin/cases',
        kind: 'case',
      });
    }
    if (stats.adminUnread > 0) {
      priorities.push({
        id: 'real-messages',
        title: `${stats.adminUnread} unread admin notification${stats.adminUnread === 1 ? '' : 's'}`,
        description: 'Open communications and respond to partner or team needs.',
        status: 'waiting',
        meta: 'Unread',
        route: '/admin/notifications',
        kind: 'message',
      });
    }
    if (goLiveBlocked > 0) {
      priorities.push({
        id: 'real-go-live',
        title: `${goLiveBlocked} production readiness check${goLiveBlocked === 1 ? '' : 's'} blocked`,
        description: 'Use the production sequencer to resolve launch dependencies.',
        status: 'blocked',
        meta: 'Launch readiness',
        route: '/admin/launch-os#production-sequencer',
        kind: 'task',
      });
    }

    return {
      freshness: 'just now',
      overviewStatus:
        stats.slaBreaches > 0
          ? `${stats.slaBreaches} urgent item${stats.slaBreaches === 1 ? '' : 's'} · ${stats.openTasksCount} open team tasks`
          : `${stats.openTasksCount} open team tasks · ${stats.openCasesCount} active cases`,
      metrics: [
        { id: 'partners', label: 'Active partners', value: stats.partnersCount, hint: `${reportCoverage}% report coverage`, accent: 'emerald', route: '/admin/partners' },
        { id: 'cases', label: 'Open cases', value: stats.openCasesCount, hint: `${stats.casesCount} total cases`, accent: 'violet', route: '/admin/cases' },
        { id: 'tasks', label: 'Work due', value: stats.openTasksCount, hint: `${stats.slaBreaches} past service target`, accent: 'rose', route: '/admin/workflow' },
        { id: 'leads', label: 'Lead captures', value: stats.leadsCount, hint: 'Open lead pipeline', accent: 'sky', route: '/admin/crm' },
      ],
      priorities,
      pipeline: [
        { id: 'partners', label: 'Partner records', value: stats.partnersCount, detail: `${stats.partnersMissingReport} need a current report`, route: '/admin/partners', accent: 'emerald' },
        { id: 'cases', label: 'Open cases', value: stats.openCasesCount, detail: `${stats.casesCount} total across the portfolio`, route: '/admin/cases', accent: 'rose' },
        { id: 'leads', label: 'Lead pipeline', value: stats.leadsCount, detail: 'Captured leads ready for qualification', route: '/admin/crm', accent: 'violet' },
      ],
      health: [
        { id: 'reports', label: 'Bureau coverage', value: `${reportCoverage}%`, detail: `${stats.partnersMissingReport} missing reports`, status: reportCoverage >= 90 ? 'ready' : reportCoverage >= 70 ? 'in_progress' : 'needs_action' },
        { id: 'comms', label: 'Comms sent', value: String(commsOps.sendsWeek), detail: `${commsOps.failedWeek} failed this week`, status: commsOps.failedWeek > 0 ? 'needs_action' : 'complete' },
        { id: 'letters', label: 'Mail fulfillment', value: String(stats.lettersThisWeek), detail: 'Letters generated this week', status: stats.lettersThisWeek > 0 ? 'complete' : 'waiting' },
        { id: 'sla', label: 'Service-level risk', value: String(stats.slaBreaches), detail: 'Items beyond the response target', status: stats.slaBreaches > 0 ? 'needs_action' : 'ready' },
      ],
      activity: [
        { id: 'summary-reports', title: 'Credit-report coverage refreshed', description: `${reportCoverage}% of partner records have at least one report`, time: 'Just now', status: reportCoverage >= 90 ? 'ready' : 'in_progress', route: '/admin/partners' },
        { id: 'summary-mail', title: 'Weekly mail output refreshed', description: `${stats.lettersThisWeek} letters recorded this week`, time: 'Just now', status: stats.lettersThisWeek > 0 ? 'complete' : 'waiting', route: '/admin/mail' },
        { id: 'summary-comms', title: 'Communications health refreshed', description: `${commsOps.sendsWeek} sends · ${commsOps.failedWeek} failed`, time: 'Just now', status: commsOps.failedWeek > 0 ? 'needs_action' : 'complete', route: '/admin/comms' },
      ],
    };
  }, [stats, commsOps, goLiveBlocked]);

  const model = dataMode === 'demo' ? ADMIN_COMMAND_CENTER_DEMO : realModel;

  return (
    <>
      {statsError && dataMode === 'real' ? (
        <div className="fc-wlp-panel" data-accent="rose" style={{ marginBottom: 18 }}>
          <div className="fc-wlp-panel-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} style={{ color: 'var(--wlp-rose)' }} />
            <div style={{ flex: 1 }}>
              <div className="fc-wlp-panel-title">Some live metrics could not load</div>
              <div className="fc-wlp-panel-subtitle">{statsError}</div>
            </div>
            <button type="button" className="fc-wlp-btn-quiet" onClick={retryStats}>
              <RefreshCcw size={14} /> Retry
            </button>
          </div>
        </div>
      ) : null}
      {statsLoading && dataMode === 'real' ? (
        <ProductDashboardSkeleton label="Loading admin command center" />
      ) : (
        <AdminCommandCenterProduct model={model} dataMode={dataMode} />
      )}
    </>
  );
}

export function AdminDashboardProductSurface() {
  const preview = useWorkspaceLightPreview();
  return (
    <WlAppShell workspace="admin" livePath="/admin" pageTitle="Command center">
      <AdminDashboardProductBody dataMode={preview.dataMode} />
    </WlAppShell>
  );
}
