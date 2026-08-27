import type { ParsedTradeline } from './creditReports';
import type { ResponseOutcome } from './disputeRoundResponsePlaybook';

export type TradelineChange = 'deleted' | 'updated' | 'verified_unchanged' | 'new';

export type TradelineDiffEntry = {
  fingerprint: string;
  change: TradelineChange;
  beforeIndex?: number;
  afterIndex?: number;
  hint: string;
  /** Creditor display name for partner-facing vs-prior lines. */
  label?: string;
  /** Field names that changed on an `updated` entry (status, balance, …). */
  fields?: string[];
};

export type TradelineDiffSummary = {
  deleted: number;
  updated: number;
  added: number;
  unchanged: number;
  statusChanged: number;
  appearedLine?: string;
  droppedLine?: string;
  changedLine?: string;
};

function normalizeCreditorName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function last4FromMasked(accountNumberMasked?: string): string {
  const digits = (accountNumberMasked ?? '').replace(/\D/g, '');
  return digits.slice(-4) || '????';
}

/** Fingerprint = last-4 of accountNumberMasked + normalized creditorName. */
export function tradelineFingerprint(t: ParsedTradeline): string {
  return `${last4FromMasked(t.accountNumberMasked)}|${normalizeCreditorName(t.creditorName)}`;
}

function fingerprintFromAccountLabel(account: string): string | null {
  const trimmed = account.trim();
  if (!trimmed) return null;
  const last4Match = trimmed.match(/(\d{4})\b/);
  const last4 = last4Match?.[1] ?? '????';
  const creditor = trimmed
    .replace(/\*+\d{0,4}.*$/i, '')
    .replace(/•.*$/, '')
    .replace(/\(\s*\d{4}\s*\)\s*$/, '')
    .trim();
  if (!creditor) return null;
  return `${last4}|${normalizeCreditorName(creditor)}`;
}

function tradelineSnapshot(t: ParsedTradeline): string {
  return [
    t.accountStatus ?? '',
    t.balance ?? '',
    t.pastDue ?? '',
    t.dateClosed ?? '',
    t.dofd ?? '',
    t.creditLimit ?? '',
    t.highBalance ?? '',
  ].join('|');
}

function fieldDeltas(before: ParsedTradeline, after: ParsedTradeline): string[] {
  const fields: string[] = [];
  if ((before.accountStatus ?? '') !== (after.accountStatus ?? '')) fields.push('status');
  if ((before.balance ?? '') !== (after.balance ?? '')) fields.push('balance');
  if ((before.pastDue ?? '') !== (after.pastDue ?? '')) fields.push('past due');
  if ((before.dateClosed ?? '') !== (after.dateClosed ?? '')) fields.push('closed date');
  return fields;
}

function describeFieldDelta(before: ParsedTradeline, after: ParsedTradeline): string {
  const fields = fieldDeltas(before, after);
  return fields.length ? fields.join(', ') : 'details';
}

function joinCreditorNames(diffs: TradelineDiffEntry[], cap = 3): string {
  const names = [...new Set(diffs.map((d) => (d.label || '').trim()).filter(Boolean))];
  if (!names.length) return 'accounts on your file';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length <= cap) return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  return `${names.slice(0, cap).join(', ')}, and ${names.length - cap} more`;
}

export function summarizeTradelineDiff(diffs: TradelineDiffEntry[]): TradelineDiffSummary {
  const deleted = diffs.filter((d) => d.change === 'deleted');
  const updated = diffs.filter((d) => d.change === 'updated');
  const added = diffs.filter((d) => d.change === 'new');
  const unchanged = diffs.filter((d) => d.change === 'verified_unchanged');
  const statusChanged = updated.filter((d) => (d.fields ?? []).includes('status') || /\bstatus\b/.test(d.hint));
  const otherUpdated = updated.filter((d) => !statusChanged.includes(d));

  const appearedLine = added.length
    ? `Appeared on this report: ${joinCreditorNames(added)}.`
    : undefined;
  const droppedLine = deleted.length
    ? `Dropped since your prior report: ${joinCreditorNames(deleted)}.`
    : undefined;

  let changedLine: string | undefined;
  if (statusChanged.length && otherUpdated.length) {
    changedLine = `Status changed: ${joinCreditorNames(statusChanged)}. Other updates (balance or dates): ${joinCreditorNames(otherUpdated)}.`;
  } else if (statusChanged.length) {
    changedLine = `Status changed: ${joinCreditorNames(statusChanged)}.`;
  } else if (otherUpdated.length) {
    changedLine = `Updated on this report (balance or dates): ${joinCreditorNames(otherUpdated)}.`;
  }

  return {
    deleted: deleted.length,
    updated: updated.length,
    added: added.length,
    unchanged: unchanged.length,
    statusChanged: statusChanged.length,
    appearedLine,
    droppedLine,
    changedLine,
  };
}

export function diffTradelines(
  before: ParsedTradeline[],
  after: ParsedTradeline[],
): TradelineDiffEntry[] {
  const beforeByFp = new Map<string, Array<{ index: number; tl: ParsedTradeline }>>();
  const afterByFp = new Map<string, Array<{ index: number; tl: ParsedTradeline }>>();

  before.forEach((tl, index) => {
    const fp = tradelineFingerprint(tl);
    const bucket = beforeByFp.get(fp) ?? [];
    bucket.push({ index, tl });
    beforeByFp.set(fp, bucket);
  });

  after.forEach((tl, index) => {
    const fp = tradelineFingerprint(tl);
    const bucket = afterByFp.get(fp) ?? [];
    bucket.push({ index, tl });
    afterByFp.set(fp, bucket);
  });

  const results: TradelineDiffEntry[] = [];
  const allFingerprints = new Set([...beforeByFp.keys(), ...afterByFp.keys()]);

  for (const fingerprint of allFingerprints) {
    const beforeEntries = beforeByFp.get(fingerprint) ?? [];
    const afterEntries = afterByFp.get(fingerprint) ?? [];

    if (beforeEntries.length && !afterEntries.length) {
      for (const entry of beforeEntries) {
        results.push({
          fingerprint,
          change: 'deleted',
          beforeIndex: entry.index,
          hint: `${entry.tl.creditorName} removed from report`,
          label: entry.tl.creditorName,
        });
      }
      continue;
    }

    if (!beforeEntries.length && afterEntries.length) {
      for (const entry of afterEntries) {
        results.push({
          fingerprint,
          change: 'new',
          afterIndex: entry.index,
          hint: `${entry.tl.creditorName} newly reported`,
          label: entry.tl.creditorName,
        });
      }
      continue;
    }

    const pairCount = Math.max(beforeEntries.length, afterEntries.length);
    for (let i = 0; i < pairCount; i++) {
      const beforeEntry = beforeEntries[i];
      const afterEntry = afterEntries[i];
      if (!beforeEntry || !afterEntry) continue;

      const unchanged = tradelineSnapshot(beforeEntry.tl) === tradelineSnapshot(afterEntry.tl);
      const fields = unchanged ? undefined : fieldDeltas(beforeEntry.tl, afterEntry.tl);
      results.push({
        fingerprint,
        change: unchanged ? 'verified_unchanged' : 'updated',
        beforeIndex: beforeEntry.index,
        afterIndex: afterEntry.index,
        hint: unchanged
          ? `${afterEntry.tl.creditorName} unchanged on report`
          : `${afterEntry.tl.creditorName} updated (${describeFieldDelta(beforeEntry.tl, afterEntry.tl)})`,
        label: afterEntry.tl.creditorName || beforeEntry.tl.creditorName,
        fields,
      });
    }
  }

  return results;
}

export function aggregateOutcomeFromDiffs(
  diffs: TradelineDiffEntry[],
): Exclude<ResponseOutcome, 'no_response' | 'reinserted'> | 'partial' | null {
  if (!diffs.length) return null;

  const changes = new Set(diffs.map((d) => d.change));
  if (changes.size === 1) {
    const only = diffs[0]!.change;
    if (only === 'deleted') return 'deleted';
    if (only === 'updated') return 'updated';
    if (only === 'verified_unchanged') return 'verified_unchanged';
    if (only === 'new') return 'partial';
  }

  if (changes.has('deleted') && changes.size === 1) return 'deleted';
  if (changes.has('verified_unchanged') && !changes.has('deleted') && !changes.has('updated')) {
    return 'verified_unchanged';
  }
  if (changes.has('deleted') || changes.has('updated') || (changes.has('verified_unchanged') && changes.size > 1)) {
    return 'partial';
  }

  return 'partial';
}

export function suggestDisputeOutcomeFromReports(args: {
  before: ParsedTradeline[];
  after: ParsedTradeline[];
  disputedAccounts?: string[];
}): { outcome: ResponseOutcome; hint: string; diffs: TradelineDiffEntry[] } | null {
  const allDiffs = diffTradelines(args.before, args.after);
  if (!allDiffs.length) return null;

  const disputedFingerprints = new Set(
    (args.disputedAccounts ?? [])
      .map((account) => fingerprintFromAccountLabel(account))
      .filter((fp): fp is string => Boolean(fp)),
  );

  const relevantDiffs =
    disputedFingerprints.size > 0
      ? allDiffs.filter((d) => disputedFingerprints.has(d.fingerprint))
      : allDiffs;

  if (!relevantDiffs.length) return null;

  const aggregated = aggregateOutcomeFromDiffs(relevantDiffs);
  if (!aggregated) return null;

  const outcome: ResponseOutcome = aggregated === 'partial' ? 'partial' : aggregated;
  const deleted = relevantDiffs.filter((d) => d.change === 'deleted').length;
  const updated = relevantDiffs.filter((d) => d.change === 'updated').length;
  const unchanged = relevantDiffs.filter((d) => d.change === 'verified_unchanged').length;

  const hint =
    outcome === 'partial'
      ? `Mixed tradeline results — deleted: ${deleted}, updated: ${updated}, unchanged: ${unchanged}`
      : relevantDiffs[0]!.hint;

  return { outcome, hint, diffs: relevantDiffs };
}

export function resolveDisputeCaseReportPair(c: {
  items: Array<{ reportId?: string }>;
  latestReportId?: string;
}): { beforeReportId: string; afterReportId: string } | null {
  const itemReportIds = [...new Set(c.items.map((item) => item.reportId).filter(Boolean))] as string[];
  const beforeReportId = itemReportIds[0];
  const afterReportId = c.latestReportId;
  if (!beforeReportId || !afterReportId || beforeReportId === afterReportId) return null;
  return { beforeReportId, afterReportId };
}
