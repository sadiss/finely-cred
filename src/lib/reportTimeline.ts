import type { CreditReportRecord } from '../domain/creditReports';
import type { ParsedCreditReport } from '../domain/creditReports';
import { createTask } from '../data/tasksRepo';
import { listTasksByPartner } from '../data/tasksRepo';

export type ReportTimelineRole = 'latest' | 'previous' | 'historical';

export type ReportTimelineEntry = CreditReportRecord & {
  timelineRole: ReportTimelineRole;
  sequenceNumber: number;
};

export type ReportDeltaSummary = {
  latestId: string;
  previousId?: string;
  scoreChanges: { bureau: string; before?: number; after?: number; delta?: number }[];
  tradelinesAdded: number;
  tradelinesRemoved: number;
  inquiryDelta: number;
};

function sortKey(r: CreditReportRecord): string {
  return r.reportDate || r.receivedAt;
}

export function buildReportTimeline(reports: CreditReportRecord[]): ReportTimelineEntry[] {
  const sorted = [...reports].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return sorted.map((r, i) => ({
    ...r,
    timelineRole: i === 0 ? 'latest' : i === 1 ? 'previous' : 'historical',
    sequenceNumber: sorted.length - i,
  }));
}

export function getLatestAndPreviousReports(reports: CreditReportRecord[]): {
  latest: ReportTimelineEntry | null;
  previous: ReportTimelineEntry | null;
} {
  const timeline = buildReportTimeline(reports);
  return {
    latest: timeline[0] ?? null,
    previous: timeline[1] ?? null,
  };
}

export function computeReportDeltaSummary(latest: ParsedCreditReport, previous: ParsedCreditReport): Omit<ReportDeltaSummary, 'latestId' | 'previousId'> {
  const scoreKey = (s: { bureau?: string; model?: string }) => `${s.bureau || 'NA'}|${s.model || 'score'}`;
  const toMap = (parsed: ParsedCreditReport) => {
    const m = new Map<string, number>();
    for (const s of parsed.scores ?? []) {
      if (!Number.isFinite(s.value)) continue;
      m.set(scoreKey(s), s.value);
    }
    return m;
  };
  const nowM = toMap(latest);
  const prevM = toMap(previous);
  const scoreChanges: ReportDeltaSummary['scoreChanges'] = [];
  for (const k of new Set([...nowM.keys(), ...prevM.keys()])) {
    const before = prevM.get(k);
    const after = nowM.get(k);
    if (before == null && after == null) continue;
    const [bureau] = k.split('|');
    scoreChanges.push({
      bureau,
      before,
      after,
      delta: before != null && after != null ? after - before : undefined,
    });
  }

  const nowNames = new Set(latest.tradelines.map((t) => t.creditorName.trim().toLowerCase()).filter(Boolean));
  const prevNames = new Set(previous.tradelines.map((t) => t.creditorName.trim().toLowerCase()).filter(Boolean));
  const tradelinesAdded = [...nowNames].filter((x) => !prevNames.has(x)).length;
  const tradelinesRemoved = [...prevNames].filter((x) => !nowNames.has(x)).length;

  const countInquiries = (p: ParsedCreditReport) =>
    (p.sections ?? []).filter((s) => String(s.key || '').toLowerCase().includes('inquir')).reduce((n, s) => n + (s.rows?.length ?? 0), 0);
  const inquiryDelta = countInquiries(latest) - countInquiries(previous);

  return { scoreChanges, tradelinesAdded, tradelinesRemoved, inquiryDelta };
}

/** After a new upload, tag timeline roles and queue compare work when a prior report exists. */
export function handleReportUploadTimeline(args: {
  partnerId: string;
  newReportId: string;
  allReports: CreditReportRecord[];
}): ReportTimelineEntry[] {
  const timeline = buildReportTimeline(args.allReports);
  const latest = timeline.find((r) => r.id === args.newReportId) ?? timeline[0];
  const previous = timeline.find((r) => r.id !== args.newReportId && r.timelineRole === 'previous') ?? timeline[1];

  if (!latest || !previous?.parsed || !latest.parsed) return timeline;

  const tag = `report_compare:${latest.id}:${previous.id}`;
  const exists = listTasksByPartner(args.partnerId).some((t) => (t.tags ?? []).includes(tag));
  if (exists) return timeline;

  const delta = computeReportDeltaSummary(latest.parsed, previous.parsed);
  const scoreLine = delta.scoreChanges
    .filter((s) => s.delta != null && s.delta !== 0)
    .map((s) => `${s.bureau}: ${s.before} → ${s.after} (${s.delta! >= 0 ? '+' : ''}${s.delta})`)
    .join('\n');

  createTask({
    partnerId: args.partnerId,
    title: 'Review new credit report vs previous file',
    kind: 'review_results',
    stage: 'reports',
    status: 'pending',
    priority: 'high',
    tags: [tag, 'reports', 'compare', 'restore'],
    notes: [
      `Latest report: ${latest.filename || latest.id} (${latest.timelineRole})`,
      `Previous report: ${previous.filename || previous.id}`,
      scoreLine ? `Score movement:\n${scoreLine}` : 'Score movement: review manually',
      `Tradelines added: ${delta.tradelinesAdded} • removed: ${delta.tradelinesRemoved} • inquiry Δ: ${delta.inquiryDelta}`,
      'Categorization: newest file is your active baseline; prior file is archived for round-over-round comparison.',
    ].join('\n\n'),
    meta: { latestReportId: latest.id, previousReportId: previous.id, href: '/portal/reports' },
  });

  return timeline;
}
