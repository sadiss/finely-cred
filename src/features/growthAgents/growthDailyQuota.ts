/**
 * Balanced daily pipeline targets (~100 events/day) for Growth / Marketing Desk.
 * Counts are pragmatic heuristics from local CRM + lead capture — not server cron totals.
 */
import { listLeadCaptures } from '../../data/leadsRepo';
import { listProspects } from '../../data/crmProspectsRepo';

export type GrowthDailyQuotaBucket = 'inbound' | 'discovered' | 'revival' | 'partner';

export type GrowthDailyQuotaCap = {
  id: GrowthDailyQuotaBucket;
  label: string;
  cap: number;
};

export const GROWTH_DAILY_QUOTA_CAPS: GrowthDailyQuotaCap[] = [
  { id: 'inbound', label: 'Inbound opt-in', cap: 40 },
  { id: 'discovered', label: 'Discovered contacts', cap: 35 },
  { id: 'revival', label: 'Revival / internal', cap: 15 },
  { id: 'partner', label: 'Partner / webhook', cap: 10 },
];

export const GROWTH_DAILY_QUOTA_TOTAL = GROWTH_DAILY_QUOTA_CAPS.reduce((n, b) => n + b.cap, 0);

function isToday(iso: string): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  const d = new Date(t);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function bucketForProspect(p: ReturnType<typeof listProspects>[number]): GrowthDailyQuotaBucket | null {
  const leadType = p.leadType;
  if (leadType === 'inbound' || p.consentBasis === 'inbound_form_opt_in' || p.consentBasis === 'lead_capture_opt_in') {
    return 'inbound';
  }
  if (leadType === 'referral' || p.source === 'referral') return 'partner';
  if ((p.tags ?? []).includes('dead_lead_revival')) return 'revival';
  if (leadType === 'discovered' || (p.tags ?? []).some((t) => ['lead-intel', 'marketing-desk', 'lead-engine'].includes(t))) {
    return 'discovered';
  }
  return null;
}

export type GrowthDailyQuotaProgress = {
  buckets: Array<GrowthDailyQuotaCap & { count: number; pct: number }>;
  totalCount: number;
  totalCap: number;
  totalPct: number;
  dayKey: string;
};

/** Bucket with the lowest fill ratio — drives Caleb's quota-balanced mission. */
export function pickQuotaDeficitBucket(progress = getDailyQuotaProgress()): GrowthDailyQuotaBucket {
  let worst: GrowthDailyQuotaBucket = 'discovered';
  let lowestRatio = 2;
  for (const b of progress.buckets) {
    const ratio = b.cap > 0 ? b.count / b.cap : 1;
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      worst = b.id;
    }
  }
  return worst;
}

export function quotaBucketMissionHint(bucket: GrowthDailyQuotaBucket): string {
  switch (bucket) {
    case 'inbound':
      return 'Share Hannah guide links where partners opt in — inbound fills from tracked magnets.';
    case 'discovered':
      return 'Run find for your city — discovered contacts fill from Caleb search.';
    case 'revival':
      return 'Revive stale CRM rows — tag dead_lead_revival and send link-first follow-up.';
    case 'partner':
      return 'Benjamin referral loop — copy partner magnets and webhook handoffs.';
    default:
      return 'Balance pipeline buckets toward 100/day.';
  }
}

export function getDailyQuotaProgress(now = new Date()): GrowthDailyQuotaProgress {
  const counts: Record<GrowthDailyQuotaBucket, number> = {
    inbound: 0,
    discovered: 0,
    revival: 0,
    partner: 0,
  };

  for (const lead of listLeadCaptures()) {
    if (!isToday(lead.createdAt)) continue;
    if (lead.consentEmailMarketing || lead.consentToContact) counts.inbound += 1;
  }

  for (const p of listProspects()) {
    if (!isToday(p.createdAt) && !isToday(p.updatedAt)) continue;
    const bucket = bucketForProspect(p);
    if (bucket) counts[bucket] += 1;
  }

  const buckets = GROWTH_DAILY_QUOTA_CAPS.map((b) => {
    const count = counts[b.id];
    const pct = b.cap > 0 ? Math.min(100, Math.round((count / b.cap) * 100)) : 0;
    return { ...b, count, pct };
  });

  const totalCount = buckets.reduce((n, b) => n + b.count, 0);
  const totalCap = GROWTH_DAILY_QUOTA_TOTAL;
  const totalPct = totalCap > 0 ? Math.min(100, Math.round((totalCount / totalCap) * 100)) : 0;

  return {
    buckets,
    totalCount,
    totalCap,
    totalPct,
    dayKey: now.toISOString().slice(0, 10),
  };
}
