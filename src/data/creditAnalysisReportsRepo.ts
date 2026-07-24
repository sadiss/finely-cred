import type { CreditAnalysisReportRecord } from '../domain/creditAnalysisReports';
import { deleteEvidence, listEvidenceByPartner } from './evidenceRepo';
import { addTombstone, filterTombstoned, isTombstoned } from './deleteTombstoneStore';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { buildCreditAnalysisFilename, buildCreditAnalysisTitle } from '../lib/creditAnalysisReportNaming';

const KEY = 'finely.creditAnalysisReports.v1';

type Store = { reports: CreditAnalysisReportRecord[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { reports: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  window.dispatchEvent(new CustomEvent('finely:store'));
}

function legacyFromEvidence(partnerId: string): CreditAnalysisReportRecord[] {
  return filterTombstoned(
    listEvidenceByPartner(partnerId)
      .filter((e) => Array.isArray(e.tags) && e.tags.includes('analysis_report'))
      .filter((e) => String(e.mimeType || '').toLowerCase().includes('pdf'))
      .filter((e) => !isTombstoned(e.id, 'analysis') && !isTombstoned(e.id, 'evidence'))
      .map((e) => {
        const createdAt = e.createdAt || new Date().toISOString();
        const created = new Date(createdAt);
        const title =
          e.caption && !e.caption.includes('_')
            ? e.caption.replace(/^Credit Analysis Report • /, 'Credit Analysis · ')
            : buildCreditAnalysisTitle({ partnerName: 'Partner', generatedAt: created });
        const filename =
          e.filename && !e.filename.includes('_Credit_Analysis')
            ? e.filename
            : buildCreditAnalysisFilename({ partnerName: 'Partner', generatedAt: created });
        return {
          id: e.id,
          partnerId: e.partnerId,
          reportId: e.reportId,
          title,
          filename,
          blobRef: e.blobRef,
          mimeType: 'application/pdf' as const,
          sizeBytes: e.sizeBytes ?? 0,
          pages: 0,
          createdAt,
          sourceReportFilename: e.caption?.includes('•') ? e.caption.split('•').pop()?.trim() : undefined,
        };
      }),
    'analysis',
  );
}

export function listCreditAnalysisReportsByPartner(partnerId: string): CreditAnalysisReportRecord[] {
  const store = loadStore();
  const native = filterTombstoned(
    store.reports.filter((r) => r.partnerId === partnerId),
    'analysis',
  );
  const byRef = new Map<string, CreditAnalysisReportRecord>();
  for (const r of [...legacyFromEvidence(partnerId), ...native]) {
    if (!r.blobRef) continue;
    if (isTombstoned(r.id, 'analysis') || isTombstoned(r.blobRef, 'analysis')) continue;
    const prev = byRef.get(r.blobRef);
    if (!prev || r.createdAt.localeCompare(prev.createdAt) > 0) byRef.set(r.blobRef, r);
  }
  return Array.from(byRef.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertCreditAnalysisReport(
  record: Omit<CreditAnalysisReportRecord, 'id' | 'createdAt' | 'mimeType'> & {
    id?: string;
    createdAt?: string;
    mimeType?: CreditAnalysisReportRecord['mimeType'];
  },
): CreditAnalysisReportRecord {
  const store = loadStore();
  const now = record.createdAt ?? new Date().toISOString();
  const next: CreditAnalysisReportRecord = {
    id: record.id ?? newId('analysis'),
    partnerId: record.partnerId,
    reportId: record.reportId,
    title: record.title,
    filename: record.filename,
    blobRef: record.blobRef,
    mimeType: record.mimeType ?? 'application/pdf',
    sizeBytes: record.sizeBytes,
    pages: record.pages,
    createdAt: now,
    sourceReportFilename: record.sourceReportFilename,
    engine: record.engine,
    payloadSnapshot: record.payloadSnapshot,
    sentAt: record.sentAt,
    sentByEmail: record.sentByEmail,
    sentByRole: record.sentByRole,
    deliveryChannel: record.deliveryChannel,
  };
  const idx = store.reports.findIndex((x) => x.id === next.id || x.blobRef === next.blobRef);
  if (idx >= 0) store.reports[idx] = { ...store.reports[idx], ...next };
  else store.reports.push(next);
  saveStore(store);
  return next;
}

/**
 * Remove a strategy report from the vault.
 * - Always tombstones analysis id (+ blobRef) so legacy evidence merge cannot resurrect it.
 * - If the id is an evidence-backed legacy report, also deletes the evidence row.
 * - Hard-deletes native store rows; partners should use UI archive confirm; admins hard-delete.
 */
export function deleteCreditAnalysisReport(id: string, opts?: { alsoDeleteEvidence?: boolean }) {
  const store = loadStore();
  const native = store.reports.find((r) => r.id === id);
  const blobRef = native?.blobRef;

  addTombstone(id, 'analysis');
  if (blobRef) addTombstone(blobRef, 'analysis');

  store.reports = store.reports.filter((r) => r.id !== id && r.blobRef !== blobRef);
  // Also drop any native rows that share blobRef with a legacy id delete
  if (!native) {
    store.reports = store.reports.filter((r) => r.id !== id);
  }
  saveStore(store);

  const deleteEv = opts?.alsoDeleteEvidence !== false;
  if (deleteEv) {
    try {
      // Legacy reports use evidence ids — this is the root-cause fix for "delete does nothing".
      deleteEvidence(id);
    } catch {
      // ignore when id is native-only
    }
  }
}

/** Partner-safe archive: tombstone only (undo window via tombstone expiry) without requiring hard blob wipe. */
export function archiveCreditAnalysisReport(id: string) {
  deleteCreditAnalysisReport(id, { alsoDeleteEvidence: true });
}
