import type { CreditReportRecord } from '../domain/creditReports';
import { isLegacyPendingReportBlob } from './legacyPendingReport';
import { parseWarningForReport, reparseStoredCreditReport } from './reportParsePipeline';
import { clearCachedParsedReport } from './reportParseCache';
import { listAllReports, upsertReport } from '../data/reportsRepo';

export function reportNeedsReparse(record: CreditReportRecord): boolean {
  if (!record.rawBlobRef || isLegacyPendingReportBlob(record.rawBlobRef)) return false;
  const tl = record.parsed?.tradelines?.length ?? 0;
  const scores = record.parsed?.scores?.length ?? 0;
  if (!record.parsed || tl === 0) return true;
  if (tl > 0 && scores === 0) return true;
  return Boolean(parseWarningForReport(record.parsed));
}

export function listReportsNeedingReparse(args?: { partnerId?: string }): CreditReportRecord[] {
  const partnerId = args?.partnerId?.trim();
  return listAllReports().filter((r) => {
    if (partnerId && r.partnerId !== partnerId) return false;
    return reportNeedsReparse(r);
  });
}

export type BulkReparseProgress = (msg: string) => void;

export type BulkReparseResult = {
  scanned: number;
  attempted: number;
  succeeded: number;
  failed: string[];
  skippedPending: number;
};

/** Re-run parse pipeline for stored reports that have file bytes but incomplete parses. */
export async function bulkReparseStoredReports(args?: {
  partnerId?: string;
  onProgress?: BulkReparseProgress;
}): Promise<BulkReparseResult> {
  const all = listAllReports();
  const partnerId = args?.partnerId?.trim();
  const skippedPending = all.filter(
    (r) => (!partnerId || r.partnerId === partnerId) && isLegacyPendingReportBlob(r.rawBlobRef),
  ).length;
  const targets = listReportsNeedingReparse({ partnerId });
  const result: BulkReparseResult = {
    scanned: all.length,
    attempted: 0,
    succeeded: 0,
    failed: [],
    skippedPending,
  };

  args?.onProgress?.(
    `Found ${targets.length} report(s) to re-parse` +
      (skippedPending ? ` (${skippedPending} still waiting for file re-upload from legacy import)` : '') +
      '.',
  );

  for (const record of targets) {
    result.attempted += 1;
    args?.onProgress?.(`Re-parsing ${record.filename || record.id}…`);
    try {
      clearCachedParsedReport(record.id);
      const updated = await reparseStoredCreditReport({
        record,
        onProgress: (s) => args?.onProgress?.(`  ${record.filename || record.id}: ${s}`),
      });
      upsertReport(updated);
      const tl = updated.parsed?.tradelines?.length ?? 0;
      if (tl > 0) {
        result.succeeded += 1;
        args?.onProgress?.(`  ✓ ${record.filename || record.id} — ${tl} tradelines`);
      } else {
        result.failed.push(`${record.filename || record.id}: parse still incomplete`);
        args?.onProgress?.(`  ⚠ ${record.filename || record.id} — still no tradelines`);
      }
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 're-parse failed';
      result.failed.push(`${record.filename || record.id}: ${msg}`);
      args?.onProgress?.(`  ✗ ${record.filename || record.id} — ${msg}`);
    }
  }

  args?.onProgress?.(
    `Done — ${result.succeeded}/${result.attempted} fully parsed` +
      (result.skippedPending ? `; ${result.skippedPending} legacy placeholder(s) need ZIP restore or manual re-upload` : '') +
      '.',
  );
  return result;
}
