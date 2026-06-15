import { getRecentPlatformEvents } from '../domain/platformEvents';
import { listLeadCaptures } from '../data/leadsRepo';
import { listAutomationRules } from '../data/automationStudioRepo';
import { listWebhookEndpoints } from '../data/webhooksRepo';
import { unreadCount } from '../data/notificationsRepo';
import { listAllThreads } from '../data/supportRepo';
import { processSupportSlaTick } from './supportInboxOs';
import { buildRevenueIntelSnapshot } from './revenueAnalytics';
import { buildPlatformUnifiedKpi } from './platformUnifiedKpi';
import { getLastPlatformCronResult } from './platformCronStore';
import { buildVoiceRenderHealthSnapshot } from './voiceRenderHealth';
import { listAgreementsByTenant } from '../data/billingRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type OpsHealthSnapshot = {
  at: string;
  automationsEnabled: number;
  automationsTotal: number;
  recentEvents: number;
  leads24h: number;
  adminUnread: number;
  supportSlaBreaches: number;
  webhooksActive: number;
  revenue30dCents: number;
  billingPastDue: number;
  lastCronAt: string | null;
  voiceRenderFailures24h: number;
  status: 'healthy' | 'degraded' | 'critical';
  unified: ReturnType<typeof buildPlatformUnifiedKpi>;
};

export function buildOpsHealthSnapshot(): OpsHealthSnapshot {
  const now = Date.now();
  const rules = listAutomationRules();
  const enabled = rules.filter((r) => r.enabled).length;
  const events = getRecentPlatformEvents(50);
  const leads24h = listLeadCaptures().filter((l) => Date.parse(l.createdAt) >= now - 24 * 60 * 60 * 1000).length;
  const sla = processSupportSlaTick(listAllThreads());
  const revenue = buildRevenueIntelSnapshot();
  const unified = buildPlatformUnifiedKpi();
  const billingPastDue = listAgreementsByTenant(FINELY_TENANT_ID).filter((a) => a.status === 'past_due').length;
  const lastCronAt = getLastPlatformCronResult()?.at ?? null;
  const voiceHealth = buildVoiceRenderHealthSnapshot();

  let status: OpsHealthSnapshot['status'] = 'healthy';
  if (sla.breaches > 3 || enabled === 0 || unified.workTasksOverdue > 5 || billingPastDue > 2) status = 'degraded';
  if (sla.breaches > 10 || unified.nurtureDueNow > 20 || voiceHealth.failures24h > 5) status = 'critical';

  return {
    at: new Date().toISOString(),
    automationsEnabled: enabled,
    automationsTotal: rules.length,
    recentEvents: events.length,
    leads24h,
    adminUnread: unreadCount({ audience: 'admin' }),
    supportSlaBreaches: sla.breaches,
    webhooksActive: listWebhookEndpoints().length,
    revenue30dCents: revenue.revenue30dCents,
    billingPastDue,
    lastCronAt,
    voiceRenderFailures24h: voiceHealth.failures24h,
    status,
    unified,
  };
}
