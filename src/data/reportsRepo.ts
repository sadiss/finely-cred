import type { CreditReportRecord } from '../domain/creditReports';
import { emitPlatformEvent } from '../domain/platformEvents';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { addTombstone, filterTombstoned } from './deleteTombstoneStore';
import { isLegacyPendingReportBlob, legacyPendingReportFilename } from '../lib/legacyPendingReport';

const KEY = 'finely.creditReports.v1';
const SYNC_DEBOUNCE_MS = 600;
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function dispatchReportSyncEvent(detail: { reportId: string; ok: boolean; error?: string }) {
  try {
    window.dispatchEvent(new CustomEvent('finely:report-sync', { detail }));
  } catch {
    // ignore (SSR/tests)
  }
}

function scheduleReportUpsert(report: CreditReportRecord) {
  if (!isSupabaseConfigured) return;
  const existing = syncTimers.get(report.id);
  if (existing) clearTimeout(existing);
  syncTimers.set(
    report.id,
    setTimeout(() => {
      syncTimers.delete(report.id);
      void supabase
        .from('credit_reports')
        .upsert(
          {
            id: report.id,
            partner_id: report.partnerId,
            received_at: report.receivedAt,
            filename: (report as any).filename ?? null,
            provider: (report as any).provider ?? null,
            data: report as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .then(({ error }) => {
          if (error) {
            console.warn('Failed to sync report to Supabase:', error.message);
            dispatchReportSyncEvent({ reportId: report.id, ok: false, error: error.message });
          } else {
            dispatchReportSyncEvent({ reportId: report.id, ok: true });
          }
        });
    }, SYNC_DEBOUNCE_MS),
  );
}

function scheduleReportDelete(id: string) {
  if (!isSupabaseConfigured) return;
  const existing = syncTimers.get(id);
  if (existing) clearTimeout(existing);
  syncTimers.set(
    id,
    setTimeout(() => {
      syncTimers.delete(id);
      void supabase
        .from('credit_reports')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.warn('Failed to delete report from Supabase:', error.message);
            dispatchReportSyncEvent({ reportId: id, ok: false, error: error.message });
          } else {
            dispatchReportSyncEvent({ reportId: id, ok: true });
          }
        });
    }, SYNC_DEBOUNCE_MS),
  );
}

type Store = {
  reports: CreditReportRecord[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { reports: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listReportsByPartner(partnerId: string): CreditReportRecord[] {
  return loadStore()
    .reports
    .filter((r) => r.partnerId === partnerId)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/** Re-use legacy placeholder or same-filename slot when re-uploading (avoids duplicate unparsed rows). */
export function findReportSlotForUpload(partnerId: string, filename: string): CreditReportRecord | null {
  const norm = filename.trim().toLowerCase();
  if (!norm) return null;
  const reports = listReportsByPartner(partnerId);
  const legacy = reports.find(
    (r) =>
      isLegacyPendingReportBlob(r.rawBlobRef) &&
      (legacyPendingReportFilename(r.rawBlobRef!).toLowerCase() === norm || (r.filename || '').toLowerCase() === norm),
  );
  if (legacy) return legacy;
  const sameName = reports.filter((r) => (r.filename || '').toLowerCase() === norm);
  if (sameName.length === 1) return sameName[0]!;
  return null;
}

function reportRichness(r: CreditReportRecord | null | undefined): number {
  if (!r?.parsed) return 0;
  const t = (r.parsed.tradelines ?? []).length;
  const s = (r.parsed.scores ?? []).length;
  return t * 10 + s;
}

function pickRicherReport(local: CreditReportRecord, incoming: CreditReportRecord): CreditReportRecord {
  const localScore = reportRichness(local);
  const incScore = reportRichness(incoming);
  if (localScore !== incScore) return localScore > incScore ? local : incoming;
  const localTs = Date.parse(local.receivedAt || '') || 0;
  const incTs = Date.parse(incoming.receivedAt || '') || 0;
  return localTs >= incTs ? local : incoming;
}

export function getReport(id: string): CreditReportRecord | null {
  return loadStore().reports.find((r) => r.id === id) ?? null;
}

export function upsertReport(report: CreditReportRecord): CreditReportRecord {
  const store = loadStore();
  const idx = store.reports.findIndex((r) => r.id === report.id);
  const prev = idx >= 0 ? store.reports[idx] : null;
  if (idx >= 0) store.reports[idx] = report;
  else store.reports.push(report);
  saveStore(store);
  scheduleReportUpsert(report);

  const parsedNow = Boolean(report.parsed);
  const parsedBefore = Boolean(prev?.parsed);
  if (parsedNow && (!parsedBefore || !prev)) {
    emitPlatformEvent({
      tenantId: 'finely_cred',
      type: 'automation.triggered',
      partnerId: report.partnerId,
      entityType: 'credit_report',
      entityId: report.id,
      payload: { kind: 'report_uploaded', reportId: report.id, provider: report.provider ?? null },
    });
  }

  return report;
}

export function deleteReport(id: string) {
  addTombstone(id, 'report');
  const store = loadStore();
  store.reports = store.reports.filter((r) => r.id !== id);
  saveStore(store);
  scheduleReportDelete(id);
}

export function replaceReportsSnapshotForPartner(args: { partnerId: string; reports: CreditReportRecord[] }) {
  const store = loadStore();
  store.reports = [...store.reports.filter((r) => r.partnerId !== args.partnerId), ...(args.reports ?? [])];
  saveStore(store);
}

export function mergeReportsSnapshotForPartner(args: { partnerId: string; reports: CreditReportRecord[] }) {
  const store = loadStore();
  const incoming = filterTombstoned(args.reports ?? [], 'report');
  const incomingIds = new Set(incoming.map((r) => r.id));
  const localById = new Map(
    store.reports.filter((r) => r.partnerId === args.partnerId).map((r) => [r.id, r] as const),
  );
  const mergedIncoming = incoming.map((inc) => {
    const local = localById.get(inc.id);
    if (!local) return inc;
    return pickRicherReport(local, inc);
  });
  const localOnly = store.reports.filter((r) => r.partnerId === args.partnerId && !incomingIds.has(r.id));
  store.reports = [
    ...store.reports.filter((r) => r.partnerId !== args.partnerId),
    ...mergedIncoming,
    ...localOnly,
  ];
  saveStore(store);
  for (const r of mergedIncoming) scheduleReportUpsert(r);
}

