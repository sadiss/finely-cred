/**
 * While you slept — morning brief from last Find run + KPI chips.
 * Plain English counts only; no BI wall.
 */
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listNurtureEnrollments } from '../../lib/nurtureEngine';
import {
  countMarketingStagingPending,
  getMarketingFindLastRun,
  getMarketingFindSchedule,
} from './marketingDeskHunt';

function withinDays(iso: string, days: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 86400000;
}

function isOvernightWindow(iso: string): boolean {
  const d = Date.parse(iso);
  if (!Number.isFinite(d)) return false;
  const ageH = (Date.now() - d) / 3600000;
  if (ageH > 36) return false;
  const hour = new Date(d).getHours();
  return hour < 8 || hour >= 20 || ageH >= 6;
}

export type MarketingMorningBrief = {
  found: number;
  autoSaved: number;
  exceptions: number;
  mailed: number;
  booked: number;
  at?: string;
  mode?: string;
  sleepOn: boolean;
  overnight: boolean;
  /** Last Find run failed hard — hire should open Fix setup. */
  findFailed: boolean;
  findFailDetail?: string;
  hasSignal: boolean;
  summaryLine: string;
};

/**
 * Home tile: N found · A auto-saved · R exceptions · M mailed · B booked.
 * `exceptions` always matches Find → Clear exceptions (live staging pending count).
 */
export function getMarketingMorningBrief(): MarketingMorningBrief {
  const last = getMarketingFindLastRun();
  const schedule = getMarketingFindSchedule();
  const exceptions = countMarketingStagingPending();

  const mailed = listNurtureEnrollments(200).filter((e) => {
    if (e.status === 'cancelled') return false;
    const sentHint = e.nextStepIndex > 0 || e.status === 'completed';
    return sentHint && withinDays(e.updatedAt ?? e.startedAt, 1);
  }).length;

  const booked = listCrmRecords({ kind: 'inbound_lead' }).filter(
    (r) => (r.stage === 'booked' || r.stage === 'won') && withinDays(r.updatedAt, 1),
  ).length;

  const recent = last && withinDays(last.at, 1.5);
  const found = recent ? last.found : 0;
  const autoSaved = recent ? last.autoSaved : 0;
  const overnight = Boolean(
    recent && (last.mode === 'scheduled' || last.mode === 'daily_pack' || isOvernightWindow(last.at)),
  );
  const findFailDetail = recent ? (last.errors?.[0] || '').trim() : '';
  const findFailed = Boolean(recent && findFailDetail && found === 0);

  const hasSignal =
    found > 0 ||
    autoSaved > 0 ||
    exceptions > 0 ||
    mailed > 0 ||
    booked > 0 ||
    overnight ||
    findFailed;

  const failHint =
    findFailDetail.length > 72 ? `${findFailDetail.slice(0, 69)}…` : findFailDetail;
  const summaryLine = findFailed
    ? `Find failed — Fix setup${failHint ? ` · ${failHint}` : ''}`
    : [
        `${found} found`,
        `${autoSaved} auto-saved`,
        `${exceptions} exceptions`,
        `${mailed} mailed`,
        `${booked} booked`,
      ].join(' · ');

  return {
    found,
    autoSaved,
    exceptions,
    mailed,
    booked,
    at: last?.at,
    mode: last?.mode,
    sleepOn: schedule.enabled,
    overnight,
    findFailed,
    findFailDetail: findFailDetail || undefined,
    hasSignal,
    summaryLine,
  };
}
