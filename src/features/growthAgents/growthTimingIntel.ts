/**
 * Best-time-to-act scoring (Phase 3) — derives which hour-of-day bucket to send
 * from historical outcomes, using the real logs already produced by the
 * nurture/CRM sequence engines (`nurtureSendLogRepo.ts`) correlated against
 * whether the same record's CRM stage progressed forward in the following 72h.
 * There is no dedicated open/click/reply event stream in this codebase today, so
 * stage-progression-after-send is used as the outcome proxy — documented here so
 * this is understood as a real, if approximate, signal rather than vanity output.
 */
import { listNurtureSendLog } from '../../data/nurtureSendLogRepo';
import { getCrmRecord } from '../../data/crmRecordsRepo';

export type TimingBucket = 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

const BUCKETS: Array<{ id: TimingBucket; label: string; startHour: number; endHour: number }> = [
  { id: 'early_morning', label: '6-9am', startHour: 6, endHour: 9 },
  { id: 'morning', label: '9am-12pm', startHour: 9, endHour: 12 },
  { id: 'midday', label: '12-2pm', startHour: 12, endHour: 14 },
  { id: 'afternoon', label: '2-5pm', startHour: 14, endHour: 17 },
  { id: 'evening', label: '5-8pm', startHour: 17, endHour: 20 },
  { id: 'night', label: '8pm-6am', startHour: 20, endHour: 6 },
];

function bucketForHour(hour: number): TimingBucket {
  const found = BUCKETS.find((b) =>
    b.startHour < b.endHour ? hour >= b.startHour && hour < b.endHour : hour >= b.startHour || hour < b.endHour,
  );
  return found?.id ?? 'morning';
}

export type TimingBucketScore = { bucket: TimingBucket; label: string; sends: number; progressed: number; score: number };

/** Progressed = the CRM record for this send moved forward in stage within 72h of the send. */
function didRecordProgressAfter(recordId: string | undefined, sentAtMs: number): boolean {
  if (!recordId) return false;
  const record = getCrmRecord(recordId);
  if (!record) return false;
  const updatedMs = Date.parse(record.updatedAt);
  return Number.isFinite(updatedMs) && updatedMs > sentAtMs && updatedMs - sentAtMs <= 72 * 3600_000;
}

/** Score every daypart bucket by proxy-outcome rate — best-time-to-act for future sends. */
export function scoreTimingBuckets(sinceDays = 30): TimingBucketScore[] {
  const entries = listNurtureSendLog(sinceDays).filter((e) => e.status === 'sent' && !e.dryRun);
  const tally = new Map<TimingBucket, { sends: number; progressed: number }>();
  for (const b of BUCKETS) tally.set(b.id, { sends: 0, progressed: 0 });

  for (const entry of entries) {
    const sentMs = Date.parse(entry.at);
    if (!Number.isFinite(sentMs)) continue;
    const bucket = bucketForHour(new Date(sentMs).getHours());
    const row = tally.get(bucket)!;
    row.sends += 1;
    if (didRecordProgressAfter(entry.leadId, sentMs)) row.progressed += 1;
  }

  return BUCKETS.map((b) => {
    const row = tally.get(b.id)!;
    return {
      bucket: b.id,
      label: b.label,
      sends: row.sends,
      progressed: row.progressed,
      score: row.sends >= 3 ? row.progressed / row.sends : 0,
    };
  }).sort((a, b) => b.score - a.score);
}

/** Recommended send hour right now — falls back to a sane business-hours default with too little data. */
export function recommendedSendHourNow(sinceDays = 30): { hour: number; bucketLabel: string; confidence: 'low' | 'medium' | 'high' } {
  const scores = scoreTimingBuckets(sinceDays);
  const best = scores.find((s) => s.sends >= 5);
  if (!best) return { hour: 10, bucketLabel: '9am-12pm (default — not enough data yet)', confidence: 'low' };
  const bucketDef = BUCKETS.find((b) => b.id === best.bucket)!;
  return {
    hour: bucketDef.startHour,
    bucketLabel: best.label,
    confidence: best.sends >= 20 ? 'high' : 'medium',
  };
}
