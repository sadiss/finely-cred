import { listCrmRecords } from '../data/crmRecordsRepo';
import { CRM_PIPELINES } from '../features/crm/pipelines';
import { buildPipelineForecast } from '../features/crm/forecast/buildPipelineForecast';
import { listNurtureEnrollments } from './nurtureEngine';
import { listTasks } from '../data/tasksRepo';
import { processTaskOverdueTick } from './workTaskOverdueEngine';
import { listMetaInboxThreadSummaries } from './socialHubCommsBridge';
import { listInboxMessages } from '../data/socialHubRepo';
import { buildRevenueIntelSnapshot } from './revenueAnalytics';
import { getRecentPlatformEvents } from '../domain/platformEvents';

export type PlatformUnifiedKpi = {
  at: string;
  crmWeightedForecastCents: number;
  crmOpenRecords: number;
  crmInboundRecords: number;
  nurtureActive: number;
  nurtureDueNow: number;
  workTasksOpen: number;
  workTasksOverdue: number;
  metaInboxThreads: number;
  metaInboxUnread: number;
  purchases30d: number;
  platformEventsRecent: number;
};

/** Cross-system KPI rollup for admin dashboard + monitoring (Phase 17). */
export function buildPlatformUnifiedKpi(): PlatformUnifiedKpi {
  const now = Date.now();
  const inboundPipeline = CRM_PIPELINES.find((p) => p.id === 'inbound') ?? CRM_PIPELINES[0]!;
  const inboundRecords = listCrmRecords({ target: inboundPipeline.target, kind: 'inbound_lead' });
  const forecast = buildPipelineForecast(inboundPipeline, inboundRecords);

  const allCrm = listCrmRecords();
  const openCrm = allCrm.filter((r) => r.stage !== 'converted' && r.stage !== 'disqualified' && r.stage !== 'lost');

  const enrollments = listNurtureEnrollments(500);
  const activeNurture = enrollments.filter((e) => e.status === 'active');
  const dueNurture = activeNurture.filter((e) => Date.parse(e.nextRunAt) <= now);

  const openTasks = listTasks().filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = openTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < now);
  processTaskOverdueTick({ dryRun: true });

  const metaThreads = listMetaInboxThreadSummaries();
  const metaUnread = listInboxMessages().filter((m) => m.direction === 'inbound').length;

  const revenue = buildRevenueIntelSnapshot();

  return {
    at: new Date().toISOString(),
    crmWeightedForecastCents: forecast.weightedForecastCents,
    crmOpenRecords: openCrm.length,
    crmInboundRecords: inboundRecords.length,
    nurtureActive: activeNurture.length,
    nurtureDueNow: dueNurture.length,
    workTasksOpen: openTasks.length,
    workTasksOverdue: overdueTasks.length,
    metaInboxThreads: metaThreads.length,
    metaInboxUnread: metaUnread,
    purchases30d: revenue.purchases30d,
    platformEventsRecent: getRecentPlatformEvents(30).length,
  };
}
