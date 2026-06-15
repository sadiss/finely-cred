/** Unified platform cron tick — nurture + automations (admin autopilot / future server cron). */

import { processDueNurtureSteps } from './nurtureEngine';
import { runDueAutomations } from '../automation/agentRunner';
import { processTrialExpiryTick } from './trialExpiryEngine';
import { processBillingDunningTick } from './billingDunningEngine';
import { processInvoiceReminderTick } from './invoiceEngine';
import { processSupportSlaTick } from './supportInboxOs';
import { processTaskOverdueTick } from './workTaskOverdueEngine';
import { processWinBackTick } from './billingSubscriptionEngine';
import { processNotificationDigestTick } from './notificationDigestCron';
import type { NotificationDigestCronResult } from './notificationDigestCron';
import { processPartnerDigestTick } from './partnerDigestCron';
import type { PartnerDigestCronResult } from './partnerDigestCron';
import { processSocialAutopilotTick, publishDueSocialPosts } from './socialAutopilotEngine';
import { autonomousHireAll } from './coOwnerAutonomousHiring';
import { buildCoOwnerSuperhumanCronSnapshot, type CoOwnerSuperhumanCronSnapshot } from './coOwnerSuperhumanOps';
import { saveLastPlatformCronResult } from './platformCronStore';
import { listAllThreads } from '../data/supportRepo';
import type { AgentMode } from '../domain/automationStudio';
import { isFeatureEnabled } from '../data/settingsRepo';

export type PlatformCronResult = {
  at: string;
  nurture: Awaited<ReturnType<typeof processDueNurtureSteps>>;
  automations: Awaited<ReturnType<typeof runDueAutomations>>;
  trialExpiry: Awaited<ReturnType<typeof processTrialExpiryTick>>;
  billingDunning: ReturnType<typeof processBillingDunningTick>;
  invoiceReminders: Awaited<ReturnType<typeof processInvoiceReminderTick>>;
  supportSla: ReturnType<typeof processSupportSlaTick>;
  taskOverdue: ReturnType<typeof processTaskOverdueTick>;
  winBack: Awaited<ReturnType<typeof processWinBackTick>>;
  notificationDigest: NotificationDigestCronResult;
  partnerDigest: PartnerDigestCronResult;
  socialAutopilot: ReturnType<typeof processSocialAutopilotTick>;
  coOwnerHiring: {
    dryRun: boolean;
    summary: string;
    executiveHires: number;
    gapHires: number;
  };
  coOwnerSuperhuman: CoOwnerSuperhumanCronSnapshot;
};

export async function runPlatformCronTick(opts?: {
  mode?: AgentMode;
  dryRun?: boolean;
}): Promise<PlatformCronResult> {
  const mode = opts?.mode ?? 'dry_run';
  const automationsDryRun = opts?.dryRun ?? mode === 'dry_run';
  const nurtureDryRun =
    automationsDryRun || !isFeatureEnabled('commsDelivery');
  const nurture = await processDueNurtureSteps({ dryRun: nurtureDryRun });
  const automations = await runDueAutomations(mode);
  const trialExpiry = await processTrialExpiryTick({ dryRun: automationsDryRun });
  const billingDunning = processBillingDunningTick({ dryRun: automationsDryRun });
  const invoiceReminders = await processInvoiceReminderTick({ dryRun: automationsDryRun });
  const supportSla = processSupportSlaTick(listAllThreads());
  const taskOverdue = processTaskOverdueTick({ dryRun: automationsDryRun });
  const winBack = await processWinBackTick({ dryRun: automationsDryRun });
  const notificationDigest = await processNotificationDigestTick({ dryRun: automationsDryRun });
  const partnerDigest = await processPartnerDigestTick({ dryRun: automationsDryRun });
  const socialAutopilot = processSocialAutopilotTick({ dryRun: automationsDryRun });
  const coOwnerHiring = automationsDryRun
    ? { dryRun: true, summary: 'Skipped — cron dry-run', executiveHires: 0, gapHires: 0 }
    : (() => {
        const run = autonomousHireAll({ executiveMax: 1, gapMax: 1 });
        return {
          dryRun: false,
          summary: run.summary,
          executiveHires: run.executives.filter((r) => r.ok).length,
          gapHires: run.gaps.filter((r) => r.ok).length,
        };
      })();
  const coOwnerSuperhuman = buildCoOwnerSuperhumanCronSnapshot({ dryRun: automationsDryRun });
  if (!automationsDryRun) {
    publishDueSocialPosts({ dryRun: false });
  }
  const result = {
    at: new Date().toISOString(),
    nurture,
    automations,
    trialExpiry,
    billingDunning,
    invoiceReminders,
    supportSla,
    taskOverdue,
    winBack,
    notificationDigest,
    partnerDigest,
    socialAutopilot,
    coOwnerHiring,
    coOwnerSuperhuman,
  };
  saveLastPlatformCronResult(result);
  return result;
}

let intervalId: number | null = null;

/** Register background tick while admin page is open — production uses server cron. */
export function startPlatformCronAutopilot(opts: {
  mode: AgentMode;
  intervalMs?: number;
  onTick?: (result: PlatformCronResult) => void;
}): () => void {
  stopPlatformCronAutopilot();
  const ms = opts.intervalMs ?? 60_000;
  const tick = () => {
    void runPlatformCronTick({ mode: opts.mode, dryRun: opts.mode === 'dry_run' }).then((r) => opts.onTick?.(r));
  };
  tick();
  intervalId = window.setInterval(tick, ms);
  return stopPlatformCronAutopilot;
}

export function stopPlatformCronAutopilot() {
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}
