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
import {
  processPartnerBirthdayNurtureTick,
  type BirthdayNurtureTickResult,
} from './partnerNurtureLifecycle';
import { processSocialAutopilotTick, publishDueSocialPosts } from './socialAutopilotEngine';
import { autonomousHireAll } from './coOwnerAutonomousHiring';
import { buildCoOwnerSuperhumanCronSnapshot, type CoOwnerSuperhumanCronSnapshot } from './coOwnerSuperhumanOps';
import { saveLastPlatformCronResult } from './platformCronStore';
import { listAllThreads } from '../data/supportRepo';
import type { AgentMode } from '../domain/automationStudio';
import { isFeatureEnabled } from '../data/settingsRepo';
import { runScheduledMarketingFind } from '../features/marketingDesk/marketingDeskHunt';
import { processPendingEmailWebhookStopOnReply } from '../features/marketingDesk/marketingDeskStopOnReply';

export type MarketingFindCronSummary = {
  ran: boolean;
  skipped: boolean;
  reason?: string;
  found?: number;
  autoSaved?: number;
  review?: number;
  error?: string;
};

export type PlatformCronResult = {
  at: string;
  nurture: Awaited<ReturnType<typeof processDueNurtureSteps>>;
  partnerBirthday: BirthdayNurtureTickResult;
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
  marketingFind: MarketingFindCronSummary;
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
  const partnerBirthday = await processPartnerBirthdayNurtureTick({ dryRun: automationsDryRun });
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

  let marketingFind: MarketingFindCronSummary = { ran: false, skipped: true, reason: 'dry_run' };
  if (!automationsDryRun && isFeatureEnabled('marketingDesk')) {
    try {
      // Drain any webhook events that landed via sync without an ingest hook.
      try {
        processPendingEmailWebhookStopOnReply(40);
      } catch {
        /* non-blocking */
      }
      const findRun = await runScheduledMarketingFind();
      if (!findRun) {
        marketingFind = { ran: false, skipped: true, reason: 'schedule_off_or_already_ran' };
      } else {
        marketingFind = {
          ran: true,
          skipped: false,
          found: findRun.found,
          autoSaved: findRun.autoSaved,
          review: findRun.review,
          error: findRun.error,
        };
      }
    } catch (e) {
      marketingFind = {
        ran: false,
        skipped: false,
        reason: 'error',
        error: e instanceof Error ? e.message : 'Find schedule failed',
      };
    }
  } else if (!isFeatureEnabled('marketingDesk')) {
    marketingFind = { ran: false, skipped: true, reason: 'marketingDesk_off' };
  }

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
    partnerBirthday,
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
    marketingFind,
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
