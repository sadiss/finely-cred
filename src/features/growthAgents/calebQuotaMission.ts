/**
 * Caleb — quota-balanced "Run today's mission" find pack.
 */
import {
  getMarketingFindGeo,
  getMarketingFindReadiness,
  runMarketingDailyPack,
  setMarketingFindGeo,
  type MarketingFindResult,
} from '../marketingDesk/marketingDeskHunt';
import { GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import {
  getDailyQuotaProgress,
  pickQuotaDeficitBucket,
  quotaBucketMissionHint,
  type GrowthDailyQuotaBucket,
} from './growthDailyQuota';
import { ensureCalebFeatureFlags } from './calebAutoFind';

export type CalebTodaysMissionResult = {
  bucket: GrowthDailyQuotaBucket;
  hint: string;
  findResult: MarketingFindResult | null;
  message: string;
  skippedFind: boolean;
};

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

/** Execute today's mission — find pack weighted to the quota bucket most behind today. */
export async function runCalebTodaysMission(city?: string): Promise<CalebTodaysMissionResult> {
  ensureCalebFeatureFlags();
  const quota = getDailyQuotaProgress();
  const bucket = pickQuotaDeficitBucket(quota);
  const hint = quotaBucketMissionHint(bucket);
  const location = (city || getMarketingFindGeo()).trim() || 'United States';
  setMarketingFindGeo(location);

  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) {
    return {
      bucket,
      hint,
      findResult: null,
      skippedFind: true,
      message: `Mission paused — ${readiness.steps.find((s) => !s.done)?.detail || readiness.label}. ${hint}`,
    };
  }

  if (bucket !== 'discovered' && bucket !== 'inbound') {
    const bucketRow = quota.buckets.find((b) => b.id === bucket)!;
    return {
      bucket,
      hint,
      findResult: null,
      skippedFind: true,
      message: `Today's focus: ${bucketRow.label} (${bucketRow.count}/${bucketRow.cap}). ${hint}`,
    };
  }

  const findResult = await runMarketingDailyPack({
    location,
    mode: 'daily_pack',
  });
  dispatchStore();

  let message: string;
  if (findResult.error && findResult.found === 0) {
    message = `${bucket} mission · ${findResult.error}. ${hint}`;
  } else {
    message =
      `${bucket} mission · ${findResult.found} from search · ${findResult.autoSaved} saved · ${findResult.review} to review` +
      (bucket === 'inbound' ? ` · ${hint}` : '');
  }

  return { bucket, hint, findResult, message, skippedFind: false };
}

/** One-line status before running — shows deficit bucket + wave-0 lane. */
export function calebTodaysMissionPreview(city?: string): string {
  const quota = getDailyQuotaProgress();
  const bucket = pickQuotaDeficitBucket(quota);
  const row = quota.buckets.find((b) => b.id === bucket);
  const loc = (city || getMarketingFindGeo()).trim() || 'United States';
  return `Focus ${row?.label ?? bucket} (${row?.count ?? 0}/${row?.cap ?? 0}) · ${GROWTH_AGENT_WAVE0_LANE} · ${loc}`;
}
