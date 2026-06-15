import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { LegacyPhase2Summary } from './legacyMigrationPhase2';
import { listImportBatches } from '../data/importsRepo';

export type LegacyMigrationSignOffCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type LegacyMigrationSignOffReport = {
  ready: boolean;
  checks: LegacyMigrationSignOffCheck[];
};

export function assessLegacyMigrationSignOff(args: {
  exportData?: LegacyPartnerExportV1 | null;
  phase2?: LegacyPhase2Summary | null;
}): LegacyMigrationSignOffReport {
  const partners = args.exportData?.partners ?? [];
  const withDocs = partners.filter((p) => (p.legacyDocuments?.length ?? 0) > 0).length;
  const withReports = partners.filter((p) => (p.legacyReports?.length ?? 0) > 0).length;
  const withLetters = partners.filter((p) => (p.legacyLetters?.length ?? 0) > 0).length;
  const withBusiness = partners.filter((p) => p.legacyBusiness?.businessName || p.legacyBusiness?.ein).length;
  const batches = listImportBatches();
  const lastBatch = batches[0];

  const checks: LegacyMigrationSignOffCheck[] = [
    {
      id: 'partners',
      label: 'Real partners exported',
      ok: partners.length >= 1,
      detail: `${partners.length} partner row(s) in export JSON`,
    },
    {
      id: 'emails',
      label: 'Partner emails present',
      ok: partners.every((p) => Boolean(p.email)),
      detail: `${partners.filter((p) => p.email).length}/${partners.length} with email`,
    },
    {
      id: 'journey',
      label: 'Legacy journey stages mapped',
      ok: partners.every((p) => Boolean(p.journeyStage)),
      detail: 'applicationstatus → Finely journeyStage',
    },
    {
      id: 'docs',
      label: 'Document metadata staged',
      ok: withDocs > 0,
      detail: `${withDocs} partner(s) with legacyDocuments[]`,
    },
    {
      id: 'reports',
      label: 'Report metadata staged',
      ok: withReports > 0,
      detail: `${withReports} partner(s) with legacyReports[]`,
    },
    {
      id: 'letters',
      label: 'Legacy letters captured (Phase 2)',
      ok: withLetters > 0 || (args.phase2?.letterRows ?? 0) === 0,
      detail: `${withLetters} partner(s) with legacyLetters[] · SQL rows: ${args.phase2?.letterRows ?? '—'}`,
    },
    {
      id: 'business',
      label: 'Business lane rows (Phase 2)',
      ok: withBusiness > 0 || (args.phase2?.businessRows ?? 0) === 0,
      detail: `${withBusiness} partner(s) with business_info · SQL rows: ${args.phase2?.businessRows ?? '—'}`,
    },
    {
      id: 'import',
      label: 'At least one import batch recorded',
      ok: batches.length > 0,
      detail: lastBatch ? `Last batch ${lastBatch.createdAt.slice(0, 10)} · ${lastBatch.createdPartnerIds.length} created` : 'No import batches yet',
    },
    {
      id: 'idempotent',
      label: 'Import errors below threshold',
      ok: !lastBatch || lastBatch.errors.length <= Math.max(2, Math.floor(partners.length * 0.2)),
      detail: lastBatch ? `${lastBatch.errors.length} error(s) on last batch` : 'Run import to verify idempotency',
    },
  ];

  return {
    ready: checks.filter((c) => ['partners', 'emails', 'journey', 'docs', 'reports'].includes(c.id)).every((c) => c.ok),
    checks,
  };
}
