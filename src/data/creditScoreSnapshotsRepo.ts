import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import type { Bureau, ParsedCreditReport, ParsedScore } from '../domain/creditReports';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { syncCreditIntelToProjectOutcomes } from '../lib/creditIntelProjectSync';

const KEY = 'finely.creditScoreSnapshots.v1';

type Store = { snapshots: CreditScoreSnapshot[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { snapshots: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function headlineFromScores(scores: ParsedScore[]): { score?: number; bureau?: CreditScoreSnapshot['headlineBureau'] } {
  const ficoLike = scores.filter((s) => /fico|vantage/i.test(s.model));
  const pool = ficoLike.length ? ficoLike : scores;
  if (!pool.length) return {};
  const best = pool.reduce((a, b) => (b.value > a.value ? b : a));
  return { score: best.value, bureau: best.bureau };
}

export function listCreditScoreSnapshots(partnerId: string, limit = 24): CreditScoreSnapshot[] {
  return loadStore()
    .snapshots.filter((s) => s.partnerId === partnerId)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, limit);
}

export function captureScoreSnapshotFromReport(args: {
  partnerId: string;
  reportId: string;
  parsed: ParsedCreditReport;
  provider?: string;
}): CreditScoreSnapshot | null {
  const scores = args.parsed.scores ?? [];
  if (!scores.length) return null;

  const store = loadStore();
  const existing = store.snapshots.find((s) => s.reportId === args.reportId);
  if (existing) return existing;

  const { score, bureau } = headlineFromScores(scores);
  const snap: CreditScoreSnapshot = {
    id: newId('css'),
    partnerId: args.partnerId,
    reportId: args.reportId,
    capturedAt: new Date().toISOString(),
    reportDate: args.parsed.reportDate,
    provider: args.provider,
    scores,
    headlineScore: score,
    headlineBureau: bureau,
  };
  store.snapshots.unshift(snap);
  saveStore(store);
  syncCreditIntelToProjectOutcomes({ partnerId: args.partnerId, snapshot: snap, parsed: args.parsed });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finely:store'));
  return snap;
}
