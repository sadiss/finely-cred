import { CmoAccountHealthReport, CmoManagedAccount, CmoPublishJob, CmoWebhookEvent } from '../../domain/cmoPhase4';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function buildCmoAccountHealthReport(params: {
  account: CmoManagedAccount;
  recentJobs: CmoPublishJob[];
  recentEvents: CmoWebhookEvent[];
}): CmoAccountHealthReport {
  const { account, recentJobs, recentEvents } = params;
  const warnings: string[] = [];
  const recommendedActions: string[] = [];
  let score = 100;

  const authHealthy = account.status === 'connected' || account.platform === 'manual';
  if (!authHealthy) {
    score -= 30;
    warnings.push('Account authorization is not healthy.');
    recommendedActions.push('Reconnect account or keep it in manual mode.');
  }

  const lastWeekJobs = recentJobs.filter((job) => job.accountId === account.id);
  const publishedCount = lastWeekJobs.filter((job) => job.status === 'published').length;
  const failedCount = lastWeekJobs.filter((job) => job.status === 'failed' || job.status === 'blocked').length;
  const contentVelocityHealthy = publishedCount >= Math.max(1, account.dailyPostTarget ?? 1) || account.platform === 'manual';
  if (!contentVelocityHealthy) {
    score -= 12;
    warnings.push('Content velocity is below the daily target.');
    recommendedActions.push('Add approved posts to the queue for this account.');
  }
  if (failedCount > 0) {
    score -= Math.min(20, failedCount * 5);
    warnings.push(`${failedCount} queue item(s) failed or were blocked recently.`);
    recommendedActions.push('Review failed posts and account requirements.');
  }

  const engagementEvents = recentEvents.filter((event) => event.accountId === account.id && ['comment', 'dm', 'lead'].includes(event.eventType));
  const engagementHealthy = engagementEvents.length > 0 || publishedCount === 0;
  if (!engagementHealthy) {
    score -= 8;
    warnings.push('No engagement events are connected yet.');
    recommendedActions.push('Wire webhook/import events or manually log comments and DMs.');
  }

  const leadEvents = recentEvents.filter((event) => event.accountId === account.id && event.eventType === 'lead');
  const leadPathHealthy = leadEvents.length > 0 || (account.dailyLeadTarget ?? 0) === 0;
  if (!leadPathHealthy) {
    score -= 10;
    warnings.push('Lead attribution is not flowing from this account.');
    recommendedActions.push('Attach UTM links and campaign IDs to posts.');
  }

  const complianceHealthy = lastWeekJobs.every((job) => job.status !== 'blocked');
  if (!complianceHealthy) {
    score -= 15;
    warnings.push('Compliance gate blocked at least one item.');
    recommendedActions.push('Review risky claims before requeueing.');
  }

  const healthScore = Math.max(0, Math.min(100, score));
  return {
    id: id('health'),
    accountId: account.id,
    platform: account.platform,
    healthScore,
    authHealthy,
    contentVelocityHealthy,
    engagementHealthy,
    leadPathHealthy,
    complianceHealthy,
    warnings,
    recommendedActions,
    checkedAt: new Date().toISOString(),
  };
}

export function rankCmoAccountsByOpportunity(reports: CmoAccountHealthReport[]): CmoAccountHealthReport[] {
  return [...reports].sort((a, b) => a.healthScore - b.healthScore);
}
