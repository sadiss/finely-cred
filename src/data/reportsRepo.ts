import type { CreditReportRecord } from '../domain/creditReports';
import { emitPlatformEvent } from '../domain/platformEvents';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

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
  const incoming = args.reports ?? [];
  const incomingIds = new Set(incoming.map((r) => r.id));
  const localOnly = store.reports.filter((r) => r.partnerId === args.partnerId && !incomingIds.has(r.id));
  store.reports = [
    ...store.reports.filter((r) => r.partnerId !== args.partnerId),
    ...incoming,
    ...localOnly,
  ];
  saveStore(store);
  for (const r of incoming) scheduleReportUpsert(r);
}

