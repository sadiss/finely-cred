import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { PartnerJourneyStage } from '../domain/partners';
import {
  isTestEmail,
  mapLegacyApplicationStatus,
  LEGACY_APPLICATION_STATUS_LABELS,
  parseInsertRows,
  type LegacySqlRow,
} from './legacySqlParser';
import { enrichLegacyExportPhase2, buildLegacyLettersForPartner, summarizeLegacyPhase2FromSql, buildLegacyReferralSeedsFromSql, type LegacyPhase2Summary, type LegacyReferralSeed } from './legacyMigrationPhase2';

export type LegacyMigrationAuditRow = {
  partnersInfoId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  isReal: boolean;
  skipReason?: string;
  applicationStatus: number;
  applicationStatusLabel: string;
  journeyStage: string;
  docCount: number;
  reportCount: number;
  noteCount: number;
  letterCount: number;
  dateSignedUp: string;
};

export type LegacyMigrationAuditResult = {
  exportedAt: string;
  sourceFile: string;
  totalPartnersInfo: number;
  realPartners: number;
  skippedTest: number;
  rows: LegacyMigrationAuditRow[];
  export: LegacyPartnerExportV1;
  phase2?: LegacyPhase2Summary;
  referralSeeds?: LegacyReferralSeed[];
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function fullNameFromParts(first?: string, middle?: string, last?: string): string {
  return [first, middle, last].map((x) => str(x)).filter(Boolean).join(' ').trim();
}

export function buildLegacyMigrationFromSql(sql: string, sourceFile = 'finelyno_finelycred.sql'): LegacyMigrationAuditResult {
  const partnersInfo = parseInsertRows(sql, 'partners_info');
  const users = parseInsertRows(sql, 'users');
  const docFiles = parseInsertRows(sql, 'doc_files');
  const htmlFiles = parseInsertRows(sql, 'html_files');
  const apmessages = parseInsertRows(sql, 'apmessage');
  const generateLetters = parseInsertRows(sql, 'generate_letter');

  const usersById = new Map<string, LegacySqlRow>();
  for (const u of users) usersById.set(str(u.id), u);

  const docsByPartnerId = new Map<string, number>();
  for (const d of docFiles) {
    const pid = str(d.partner_id);
    docsByPartnerId.set(pid, (docsByPartnerId.get(pid) ?? 0) + 1);
  }

  const reportsByPartnerId = new Map<string, number>();
  for (const h of htmlFiles) {
    if (Number(h.is_deleted) === 1) continue;
    const pid = str(h.partner_id);
    reportsByPartnerId.set(pid, (reportsByPartnerId.get(pid) ?? 0) + 1);
  }

  const notesByUserId = new Map<string, Array<{ message: string; createdAt?: string }>>();
  for (const m of apmessages) {
    const uid = str(m.user_id);
    const msg = str(m.message);
    if (!uid || !msg) continue;
    const list = notesByUserId.get(uid) ?? [];
    list.push({ message: msg, createdAt: str(m.created_at) || str(m.date) || undefined });
    notesByUserId.set(uid, list);
  }

  const lettersByUserId = new Map<string, number>();
  for (const g of generateLetters) {
    const pid = str(g.partner_id) || str(g.file_id);
    if (!pid) continue;
    lettersByUserId.set(pid, (lettersByUserId.get(pid) ?? 0) + 1);
  }

  const rows: LegacyMigrationAuditRow[] = [];
  const exportPartners: LegacyPartnerExportV1['partners'] = [];
  let skippedTest = 0;

  for (const pi of partnersInfo) {
    const infoId = str(pi.id);
    const uid = str(pi.uid);
    const user = usersById.get(uid);
    const email = str(pi.email) || str(user?.email);
    const fullName =
      fullNameFromParts(str(pi.first_name), str(pi.middle_name), str(pi.last_name)) ||
      str(user?.name) ||
      'Unknown Partner';
    const phone = str(pi.phone_number);
    const real = !isTestEmail(email);
    let skipReason: string | undefined;
    if (!real) {
      skipReason = 'test/disposable email';
      skippedTest++;
    }
    if (!email) {
      skipReason = 'missing email';
    }

    const appStatus = Number(user?.applicationstatus ?? 1);
    const journeyStage = mapLegacyApplicationStatus(appStatus) as PartnerJourneyStage;
    const keys = partnerFileKeys(infoId, uid);
    const noteList = [...keys].flatMap((k) => notesByUserId.get(k) ?? []);
    // de-dupe identical messages from dual key lookup
    const seenNotes = new Set<string>();
    const uniqueNotes = noteList.filter((n) => {
      const key = `${n.createdAt}|${n.message}`;
      if (seenNotes.has(key)) return false;
      seenNotes.add(key);
      return true;
    });
    const docCount = [...keys].reduce((n, k) => n + (docsByPartnerId.get(k) ?? 0), 0);
    const reportCount = [...keys].reduce((n, k) => n + (reportsByPartnerId.get(k) ?? 0), 0);
    const letterCount = lettersByUserId.get(uid) ?? 0;
    const legacyLetters = buildLegacyLettersForPartner(uid, generateLetters);

    rows.push({
      partnersInfoId: infoId,
      userId: uid,
      fullName,
      email,
      phone,
      isReal: real && Boolean(email),
      skipReason: real && email ? undefined : skipReason,
      applicationStatus: appStatus,
      applicationStatusLabel: LEGACY_APPLICATION_STATUS_LABELS[appStatus] ?? `Status ${appStatus}`,
      journeyStage,
      docCount,
      reportCount,
      noteCount: uniqueNotes.length,
      letterCount,
      dateSignedUp: str(pi.date_signedup),
    });

    if (!real || !email) continue;

    const documents = filesForPartner(docFiles, keys).map((d) => ({
      fileName: str(d.file_name),
      uploadedAt: str(d.created_at),
    }));

    const reports = filesForPartner(htmlFiles, keys, (h) => Number(h.is_deleted) !== 1).map((h) => ({
      fileName: str(h.file_name),
      uploadedAt: str(h.created_at),
    }));

    const legacyNoteEntries = uniqueNotes.map((n) => ({
      message: n.message,
      createdAt: n.createdAt,
    }));

    const exportPartnerDraft: LegacyPartnerExportV1['partners'][0] = {
      externalId: `laravel:uid:${uid}`,
      fullName,
      email,
      phone: phone || null,
      primaryRoute: 'personal_restore',
      lane: 'funding_readiness',
      journeyStage,
      journeySignals: {
        legacyPartnersInfoId: infoId,
        legacyUserId: uid,
        legacyApplicationStatus: appStatus,
        legacyApplicationStatusLabel: LEGACY_APPLICATION_STATUS_LABELS[appStatus],
        legacyDateSignedUp: str(pi.date_signedup),
        legacyDocuments: documents,
        legacyReports: reports,
        legacyAddress: {
          street: str(pi.street),
          apartment: str(pi.apartment),
          city: str(pi.city),
          state: str(pi.state),
          postalCode: str(pi.zip_code),
          dob: str(pi.dob),
        },
        legacyDocCount: docCount,
        legacyReportCount: reportCount,
        legacyLetterCount: letterCount,
      },
      notes: uniqueNotes.length ? uniqueNotes.map((n) => n.message).join('\n\n---\n\n') : null,
      legacyNoteEntries,
      legacyDocuments: documents,
      legacyReports: reports,
      legacyLetters: legacyLetters.length ? legacyLetters : undefined,
      tasks: buildLegacyMigrationTasks(journeyStage, appStatus, undefined),
    };
    exportPartnerDraft.tasks = buildLegacyMigrationTasks(journeyStage, appStatus, exportPartnerDraft);
    exportPartners.push(exportPartnerDraft);
  }

  const baseExport: LegacyPartnerExportV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'laravel',
    partners: exportPartners,
  };

  const enriched = enrichLegacyExportPhase2(sql, baseExport);
  const phase2 = summarizeLegacyPhase2FromSql(sql);

  return {
    exportedAt: new Date().toISOString(),
    sourceFile,
    totalPartnersInfo: partnersInfo.length,
    realPartners: exportPartners.length,
    skippedTest,
    rows,
    export: enriched,
    phase2,
    referralSeeds: buildLegacyReferralSeedsFromSql(sql),
  };
}

function partnerFileKeys(infoId: string, uid: string): Set<string> {
  return new Set([infoId, uid].filter(Boolean));
}

function filesForPartner<T extends { partner_id?: unknown }>(
  rows: T[],
  keys: Set<string>,
  extraFilter?: (row: T) => boolean,
): T[] {
  return rows.filter((row) => keys.has(str(row.partner_id)) && (extraFilter ? extraFilter(row) : true));
}

export function buildLegacyMigrationTasks(
  stage: PartnerJourneyStage | null | undefined,
  appStatus: number,
  partner?: LegacyPartnerExportV1['partners'][0],
): NonNullable<LegacyPartnerExportV1['partners'][0]['tasks']> {
  const tasks: NonNullable<LegacyPartnerExportV1['partners'][0]['tasks']> = [];
  const reportCount = partner?.legacyReports?.length ?? Number(partner?.journeySignals?.legacyReportCount ?? 0);
  const docCount = partner?.legacyDocuments?.length ?? Number(partner?.journeySignals?.legacyDocCount ?? 0);
  const letterCount = partner?.legacyLetters?.length ?? Number(partner?.journeySignals?.legacyLetterCount ?? 0);

  tasks.push({
    title: 'Review imported legacy client profile + notes',
    kind: 'general',
    stage: 'intake',
    priority: 'high',
    status: 'pending',
    tags: ['legacy-import'],
  });

  if (appStatus < 6 || docCount < 2) {
    tasks.push({
      title: 'Upload remaining identity documents',
      kind: 'upload_document',
      stage: 'evidence',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (reportCount === 0) {
    tasks.push({
      title: 'Re-upload credit reports from legacy archive (Experian / Equifax / TransUnion)',
      kind: 'upload_document',
      stage: 'reports',
      priority: 'urgent',
      status: 'pending',
      notes: 'Legacy HTML/PDF credit reports were indexed but files must be re-attached from the old server backup.',
      tags: ['legacy-import', 'credit-report'],
    });
  } else {
    tasks.push({
      title: `Re-attach ${reportCount} legacy credit report file(s) from archive`,
      kind: 'upload_document',
      stage: 'reports',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import', 'credit-report'],
    });
    tasks.push({
      title: 'Parse imported credit reports + refresh dispute candidates',
      kind: 'review_results',
      stage: 'reports',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (letterCount > 0 || stage === 'letters' || stage === 'mailing') {
    tasks.push({
      title: 'Review dispute letters imported from legacy system',
      kind: 'mail_letter',
      stage: 'disputes',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import', 'dispute-letter'],
    });
    tasks.push({
      title: 'Verify bureau + creditor on each legacy letter',
      kind: 'review_results',
      stage: 'disputes',
      priority: 'normal',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (docCount > 0) {
    tasks.push({
      title: `Classify ${docCount} legacy uploaded document(s) by type (report / letter / ID / collection)`,
      kind: 'review_results',
      stage: 'evidence',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (stage === 'analysis' || stage === 'evidence' || appStatus >= 4) {
    tasks.push({
      title: 'Build per-tradeline evidence checklist from legacy files',
      kind: 'review_results',
      stage: 'evidence',
      priority: 'normal',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (appStatus >= 8 || stage === 'mailing') {
    tasks.push({
      title: 'Log certified mail tracking from legacy round',
      kind: 'follow_up',
      stage: 'disputes',
      priority: 'normal',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (appStatus >= 10) {
    tasks.push({
      title: 'Follow up on bureau response (35-day reinvestigation window)',
      kind: 'follow_up',
      stage: 'disputes',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import', 'bureau_timer'],
    });
    tasks.push({
      title: 'Prepare round-2 disputes for unresolved tradelines',
      kind: 'mail_letter',
      stage: 'disputes',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  if (partner?.notes?.trim()) {
    tasks.push({
      title: 'Review staff notes imported from previous Finely Cred site',
      kind: 'general',
      stage: 'intake',
      priority: 'high',
      status: 'pending',
      notes: 'See pinned timeline notes from legacy apmessage import.',
      tags: ['legacy-import', 'legacy-notes'],
    });
  }

  if (partner?.lane === 'debt_kill') {
    tasks.push({
      title: 'Inventory collection accounts from legacy uploads',
      kind: 'review_results',
      stage: 'debt',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import', 'debt_os'],
    });
    tasks.push({
      title: 'Send validation requests for open collection items',
      kind: 'mail_letter',
      stage: 'debt',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }

  tasks.push({
    title: 'Legacy migration QA — confirm reports, letters, notes, and vault counts match export',
    kind: 'review_results',
    stage: 'complete',
    priority: 'normal',
    status: 'pending',
    tags: ['legacy-import', 'migration-qa'],
  });

  return tasks;
}

function buildRestoreTasks(stage: PartnerJourneyStage, appStatus: number, partner?: LegacyPartnerExportV1['partners'][0]) {
  return buildLegacyMigrationTasks(stage, appStatus, partner);
}

/** CSV for admin audit download */
export function auditRowsToCsv(rows: LegacyMigrationAuditRow[]): string {
  const headers = [
    'partnersInfoId',
    'userId',
    'fullName',
    'email',
    'phone',
    'isReal',
    'skipReason',
    'applicationStatus',
    'applicationStatusLabel',
    'journeyStage',
    'docCount',
    'reportCount',
    'noteCount',
    'letterCount',
    'dateSignedUp',
  ];
  const escape = (v: string | number | boolean) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as any)[h])).join(','));
  }
  return lines.join('\n');
}
