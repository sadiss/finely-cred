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

  const notesByUserId = new Map<string, string[]>();
  for (const m of apmessages) {
    const uid = str(m.user_id);
    const msg = str(m.message);
    if (!uid || !msg) continue;
    const list = notesByUserId.get(uid) ?? [];
    list.push(msg);
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
    const noteList = notesByUserId.get(uid) ?? [];
    const docCount = docsByPartnerId.get(uid) ?? 0;
    const reportCount = reportsByPartnerId.get(uid) ?? 0;
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
      noteCount: noteList.length,
      letterCount,
      dateSignedUp: str(pi.date_signedup),
    });

    if (!real || !email) continue;

    const documents = docFiles
      .filter((d) => str(d.partner_id) === uid)
      .map((d) => ({
        fileName: str(d.file_name),
        uploadedAt: str(d.created_at),
      }));

    const reports = htmlFiles
      .filter((h) => str(h.partner_id) === uid && Number(h.is_deleted) !== 1)
      .map((h) => ({
        fileName: str(h.file_name),
        uploadedAt: str(h.created_at),
      }));

    exportPartners.push({
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
      notes: noteList.length ? noteList.join('\n\n---\n\n') : null,
      tasks: buildRestoreTasks(journeyStage, appStatus),
      legacyDocuments: documents,
      legacyReports: reports,
      legacyLetters: legacyLetters.length ? legacyLetters : undefined,
    });
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

function buildRestoreTasks(stage: PartnerJourneyStage, appStatus: number) {
  const tasks: NonNullable<LegacyPartnerExportV1['partners'][0]['tasks']> = [];
  if (appStatus < 6) {
    tasks.push({
      title: 'Upload remaining identity documents',
      kind: 'upload_document',
      stage: 'evidence',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }
  if (stage === 'letters' || stage === 'mailing') {
    tasks.push({
      title: 'Review dispute letters from legacy system',
      kind: 'mail_letter',
      stage: 'disputes',
      priority: 'normal',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }
  if (appStatus >= 10) {
    tasks.push({
      title: 'Follow up on bureau response (35-day window)',
      kind: 'follow_up',
      stage: 'disputes',
      priority: 'high',
      status: 'pending',
      tags: ['legacy-import'],
    });
  }
  return tasks;
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
