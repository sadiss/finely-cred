import { buildGrowthResultsSnapshot, compareToBaseline } from '../features/growthAgents/growthResultsMetrics';
import { countGrowthMlLabels } from '../features/growthAgents/growthMlLabels';
import { getCalebMaturity } from '../features/growthAgents/growthAgentMaturity';
import { countMarketingStagingPending } from '../features/marketingDesk/marketingDeskHunt';
import { isSerperSearchMarkedOk } from '../features/growthAgents/growthFindTest';
import { buildNurtureOpsSnapshot } from './nurtureCadenceReport';

/** Ruth daily_ops hook — Growth OS snapshot (no second dashboard). */
export function summarizeGrowthForCoOwner(): string {
  const snap = buildGrowthResultsSnapshot();
  const delta = compareToBaseline();
  const ml = countGrowthMlLabels();
  const maturity = getCalebMaturity();
  const serper = isSerperSearchMarkedOk();
  const review = countMarketingStagingPending();
  const nurture = buildNurtureOpsSnapshot();

  const lines = [
    'Growth Agents (Wave 0)',
    `Focus: ${snap.weekFocusLabel}`,
    `7d — booked ${snap.booked7d} · signups ${snap.signups7d} · saved ${snap.foundSaved7d} · video signups ${snap.videoSignups7d ?? 0}`,
    `Review queue: ${review} · Serper tested: ${serper ? 'yes' : 'no'} · Caleb setup ${maturity.percent}%`,
    `ML labels: ${ml.total} (${ml.approve} good · ${ml.reject} wrong)`,
    `Nurture email (7d sent ${nurture.rollup.sent7d}, today ${nurture.rollup.sentToday})`,
    snap.todaySentence,
  ];
  if (delta) {
    lines.push(
      `Vs baseline — booked ${delta.bookedDelta >= 0 ? '+' : ''}${delta.bookedDelta}, signups ${delta.signupsDelta >= 0 ? '+' : ''}${delta.signupsDelta}, saved ${delta.foundDelta >= 0 ? '+' : ''}${delta.foundDelta}`,
    );
  }
  if (snap.lastFindSummary) lines.push(`Last find: ${snap.lastFindSummary}`);
  lines.push('Hub: /admin/growth-agents/results · Video import: /admin/content-studio?room=video');
  return lines.join('\n');
}
