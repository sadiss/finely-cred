import type { CreditAnalysisReportRecord } from '../domain/creditAnalysisReports';
import { listEvidenceByPartner } from './evidenceRepo';
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
  return listEvidenceByPartner(partnerId)
    .filter((e) => Array.isArray(e.tags) && e.tags.includes('analysis_report'))
    .filter((e) => String(e.mimeType || '').toLowerCase().includes('pdf'))
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
    });
}

export function listCreditAnalysisReportsByPartner(partnerId: string): CreditAnalysisReportRecord[] {
  const store = loadStore();
  const native = store.reports.filter((r) => r.partnerId === partnerId);
  const byRef = new Map<string, CreditAnalysisReportRecord>();
  for (const r of [...legacyFromEvidence(partnerId), ...native]) {
    if (!r.blobRef) continue;
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
  };
  const idx = store.reports.findIndex((x) => x.id === next.id || x.blobRef === next.blobRef);
  if (idx >= 0) store.reports[idx] = { ...store.reports[idx], ...next };
  else store.reports.push(next);
  saveStore(store);
  return next;
}

export function deleteCreditAnalysisReport(id: string) {
  const store = loadStore();
  store.reports = store.reports.filter((r) => r.id !== id);
  saveStore(store);
}
