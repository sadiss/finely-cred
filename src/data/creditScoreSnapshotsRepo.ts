import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import type { ParsedCreditReport, ParsedScore } from '../domain/creditReports';
import { computeMiddleScore } from '../domain/creditScoreMiddle';
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

function headlineFromScores(scores: ParsedScore[]): {
  score?: number;
  bureau?: CreditScoreSnapshot['headlineBureau'];
  middleLabel?: string;
  middleConfidence?: CreditScoreSnapshot['middleConfidence'];
  middleMethod?: CreditScoreSnapshot['middleMethod'];
} {
  const middle = computeMiddleScore(scores);
  if (middle.value == null) return {};
  const medianBureau = middle.bureaus.find((b) => b.value === middle.value)?.bureau;
  return {
    score: middle.value,
    bureau: medianBureau as CreditScoreSnapshot['headlineBureau'] | undefined,
    middleLabel: middle.label,
    middleConfidence: middle.confidence,
    middleMethod: middle.method,
  };
}

function withLiveMiddle(snapshot: CreditScoreSnapshot): CreditScoreSnapshot {
  const next = headlineFromScores(snapshot.scores ?? []);
  if (next.score == null) return snapshot;
  return {
    ...snapshot,
    headlineScore: next.score,
    headlineBureau: next.bureau,
    middleLabel: next.middleLabel,
    middleConfidence: next.middleConfidence,
    middleMethod: next.middleMethod,
  };
}

export function listCreditScoreSnapshots(partnerId: string, limit = 24): CreditScoreSnapshot[] {
  return loadStore()
    .snapshots.filter((s) => s.partnerId === partnerId)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, limit)
    .map(withLiveMiddle);
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

  const { score, bureau, middleLabel, middleConfidence, middleMethod } = headlineFromScores(scores);
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
    middleLabel,
    middleConfidence,
    middleMethod,
  };
  store.snapshots.unshift(snap);
  saveStore(store);
  syncCreditIntelToProjectOutcomes({ partnerId: args.partnerId, snapshot: snap, parsed: args.parsed });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finely:store'));
  return snap;
}
