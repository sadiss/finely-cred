import { listLeadCaptures } from '../../data/leadsRepo';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listProspects } from '../../data/crmProspectsRepo';
import {
  countMarketingStagingPending,
  getMarketingFindLastRun,
} from '../marketingDesk/marketingDeskHunt';
import { getMarketingLanePerformanceChips } from '../marketingDesk/marketingDeskLanePerformance';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { getGrowthWeekFocus } from './growthWeekFocus';
import { LEAD_UTM_VIDEO_CONTENT_PREFIX } from '../../lib/leadAcquisitionCatalog';
import { getMarketingFindReadiness } from '../marketingDesk/marketingDeskHunt';
import { getDailyQuotaProgress, pickQuotaDeficitBucket } from './growthDailyQuota';

const BASELINE_KEY = 'finely.growth_results_baseline.v1';

function withinDays(iso: string, days: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 86400000;
}

export type GrowthResultsSnapshot = {
  booked7d: number;
  signups7d: number;
  /** Guide signups in 7d with utm_content containing `video:` (Content Studio promote). */
  videoSignups7d: number;
  foundSaved7d: number;
  /** CRM prospects in stage replied (7d) or with an email_sent touch in 7d. */
  replies7d: number;
  needsReview: number;
  lastFindAt?: string;
  lastFindSummary?: string;
  topLaneRatePct?: number;
  topLaneLabel?: string;
  todaySentence: string;
  weekFocusLabel: string;
};

export function captureGrowthBaselineIfEmpty() {
  const existing = loadJson<{ at?: string }>(BASELINE_KEY, {}, 1);
  if (existing.at) return;
  const snap = buildGrowthResultsSnapshot();
  saveJson(
    BASELINE_KEY,
    {
      at: new Date().toISOString(),
      booked7d: snap.booked7d,
      signups7d: snap.signups7d,
      foundSaved7d: snap.foundSaved7d,
    },
    1,
  );
}

export function buildGrowthResultsSnapshot(): GrowthResultsSnapshot {
  const booked7d = listCrmRecords({ kind: 'inbound_lead' }).filter(
    (r) => (r.stage === 'booked' || r.stage === 'won') && withinDays(r.updatedAt, 7),
  ).length;

  const signups7d = listLeadCaptures().filter((l) => withinDays(l.createdAt, 7)).length;

  const videoSignups7d = listLeadCaptures().filter(
    (l) => withinDays(l.createdAt, 7) && (l.utmContent ?? '').includes(LEAD_UTM_VIDEO_CONTENT_PREFIX),
  ).length;

  const foundSaved7d = listProspects().filter(
    (p) =>
      (p.tags ?? []).some((t) => ['lead-intel', 'lead-engine', 'marketing-desk'].includes(t)) &&
      withinDays(p.createdAt, 7),
  ).length;

  const replies7d = listProspects().filter((p) => {
    if (p.stage === 'replied' && withinDays(p.updatedAt, 7)) return true;
    return (p.touches ?? []).some((t) => t.kind === 'email_sent' && withinDays(t.createdAt, 7));
  }).length;

  const needsReview = countMarketingStagingPending();
  const last = getMarketingFindLastRun();
  const laneChips = getMarketingLanePerformanceChips(1)[0];
  const focus = getGrowthWeekFocus();

  let lastFindSummary: string | undefined;
  if (last?.at) {
    if (last.errors[0]) lastFindSummary = `Issue: ${last.errors[0]}`;
    else
      lastFindSummary = `${last.found} from search · ${last.autoSaved} saved · ${last.review} to review · ${last.skipped} skipped`;
  }

  let todaySentence = 'Start with Test search, then Find new people for your city.';
  if (needsReview > 0) todaySentence = `Review ${needsReview} people, then send Today's 10 to contact.`;
  else if (booked7d === 0 && foundSaved7d === 0) todaySentence = 'Run Find new people (restore lane) or copy a guide link from Hannah.';
  else if (booked7d > 0) todaySentence = `You have ${booked7d} booked this week — follow up on the Board.`;

  const weekFocusLabel = `${focus.laneLabel} · ${focus.city} · Book a session`;

  return {
    booked7d,
    signups7d,
    videoSignups7d,
    foundSaved7d,
    replies7d,
    needsReview,
    lastFindAt: last?.at,
    lastFindSummary,
    topLaneRatePct: laneChips?.ratePct,
    topLaneLabel: laneChips?.label,
    todaySentence,
    weekFocusLabel,
  };
}

/** Plain-English blocker for the shared results strip on every Growth Agent desk. */
export function resolveGrowthBlocker(): string {
  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) {
    const pending = readiness.steps.find((s) => !s.done);
    return pending?.detail || readiness.label || 'Find needs setup — turn on flags in Settings.';
  }
  const snap = buildGrowthResultsSnapshot();
  if (snap.needsReview > 0) {
    return `${snap.needsReview} people waiting in Review — approve or skip before more find.`;
  }
  const quota = getDailyQuotaProgress();
  const deficit = pickQuotaDeficitBucket(quota);
  const bucket = quota.buckets.find((b) => b.id === deficit);
  if (bucket && bucket.count < bucket.cap) {
    return `${bucket.label} behind today (${bucket.count}/${bucket.cap}).`;
  }
  if (snap.lastFindSummary?.startsWith('Issue:')) {
    return snap.lastFindSummary.replace(/^Issue:\s*/, '');
  }
  if (snap.booked7d === 0 && snap.signups7d === 0 && snap.foundSaved7d === 0) {
    return 'No pipeline movement this week — run today\'s mission or copy a guide link.';
  }
  return 'Clear — keep daily rhythm.';
}

export function compareToBaseline(): { bookedDelta: number; signupsDelta: number; foundDelta: number } | null {
  const base = loadJson<{ booked7d?: number; signups7d?: number; foundSaved7d?: number }>(BASELINE_KEY, {}, 1);
  if (base.booked7d == null) return null;
  const now = buildGrowthResultsSnapshot();
  return {
    bookedDelta: now.booked7d - (base.booked7d ?? 0),
    signupsDelta: now.signups7d - (base.signups7d ?? 0),
    foundDelta: now.foundSaved7d - (base.foundSaved7d ?? 0),
  };
}
