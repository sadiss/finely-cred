import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.nurture_send_log.v1';
const MAX = 500;

export type NurtureSendLogEntry = {
  id: string;
  at: string;
  sequenceId: string;
  stepId: string;
  templateId: string;
  channel: string;
  email?: string;
  leadId?: string;
  status: 'sent' | 'skipped' | 'queued';
  dryRun?: boolean;
};

type Store = { entries: NurtureSendLogEntry[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function appendNurtureSendLog(entry: Omit<NurtureSendLogEntry, 'id' | 'at'> & { at?: string }) {
  const store = loadStore();
  const row: NurtureSendLogEntry = {
    id: `nsl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: entry.at ?? new Date().toISOString(),
    ...entry,
  };
  store.entries.unshift(row);
  if (store.entries.length > MAX) store.entries.length = MAX;
  saveStore(store);
  return row;
}

export function listNurtureSendLog(sinceDays = 14): NurtureSendLogEntry[] {
  const cutoff = Date.now() - sinceDays * 86400000;
  return loadStore()
    .entries.filter((e) => Date.parse(e.at) >= cutoff)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export type NurtureSendRollup = {
  sentToday: number;
  sent7d: number;
  sent14d: number;
  skipped7d: number;
  bySequence: Array<{ sequenceId: string; sent: number }>;
  byCadenceBucket: { immediate: number; daily: number; weekly: number; biweekly: number; monthly: number };
};

function cadenceBucket(delayHours: number): keyof NurtureSendRollup['byCadenceBucket'] {
  if (delayHours <= 1) return 'immediate';
  if (delayHours <= 48) return 'daily';
  if (delayHours <= 168) return 'weekly';
  if (delayHours <= 336) return 'biweekly';
  return 'monthly';
}

export function rollupNurtureSends(
  entries: NurtureSendLogEntry[],
  stepDelayByKey: Map<string, number>,
): NurtureSendRollup {
  const now = Date.now();
  const day = 86400000;
  let sentToday = 0;
  let sent7d = 0;
  let sent14d = 0;
  let skipped7d = 0;
  const seqCount = new Map<string, number>();
  const buckets: NurtureSendRollup['byCadenceBucket'] = {
    immediate: 0,
    daily: 0,
    weekly: 0,
    biweekly: 0,
    monthly: 0,
  };

  for (const e of entries) {
    const age = now - Date.parse(e.at);
    if (e.status === 'skipped' && age <= 7 * day) skipped7d += 1;
    if (e.status !== 'sent' || e.dryRun) continue;
    if (age <= day) sentToday += 1;
    if (age <= 7 * day) sent7d += 1;
    if (age <= 14 * day) sent14d += 1;
    seqCount.set(e.sequenceId, (seqCount.get(e.sequenceId) ?? 0) + 1);
    const delay = stepDelayByKey.get(`${e.sequenceId}:${e.stepId}`) ?? 0;
    buckets[cadenceBucket(delay)] += 1;
  }

  return {
    sentToday,
    sent7d,
    sent14d,
    skipped7d,
    bySequence: [...seqCount.entries()]
      .map(([sequenceId, sent]) => ({ sequenceId, sent }))
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 8),
    byCadenceBucket: buckets,
  };
}
