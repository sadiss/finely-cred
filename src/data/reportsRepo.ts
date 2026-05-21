import type { CreditReportRecord } from '../domain/creditReports';
import { loadJson, saveJson } from './localJsonStore';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEY = 'finely.creditReports.v1';

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
  if (idx >= 0) store.reports[idx] = report;
  else store.reports.push(report);
  saveStore(store);

  // Disable Supabase sync for now to prevent infinite renders
  // if (isSupabaseConfigured) {
  //   queueMicrotask(() => {
  //     void supabase.from('credit_reports').upsert(
  //       {
  //         id: report.id,
  //         partner_id: report.partnerId,
  //         received_at: report.receivedAt,
  //         filename: (report as any).filename ?? null,
  //         provider: (report as any).provider ?? null,
  //         data: report as any,
  //         updated_at: new Date().toISOString(),
  //       },
  //       { onConflict: 'id' },
  //     ).catch((err) => {
  //       console.warn('Failed to sync report to Supabase:', err?.message);
  //     });
  //   });
  // }
  return report;
}

export function deleteReport(id: string) {
  const store = loadStore();
  store.reports = store.reports.filter((r) => r.id !== id);
  saveStore(store);

  // Disable Supabase sync for now to prevent infinite renders
  // if (isSupabaseConfigured) {
  //   queueMicrotask(() => {
  //     void supabase.from('credit_reports').delete().eq('id', id).catch((err) => {
  //       console.warn('Failed to delete report from Supabase:', err?.message);
  //     });
  //   });
  // }
}

export function replaceReportsSnapshotForPartner(args: { partnerId: string; reports: CreditReportRecord[] }) {
  const store = loadStore();
  store.reports = [...store.reports.filter((r) => r.partnerId !== args.partnerId), ...(args.reports ?? [])];
  saveStore(store);
}

