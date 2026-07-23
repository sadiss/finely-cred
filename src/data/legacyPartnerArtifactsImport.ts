import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { LegacyLetterMeta } from '../lib/legacyMigrationPhase2';
import { legacyLetterBodyPlain } from '../lib/legacyMigrationPhase2';
import { classifyLegacyFileName } from '../lib/classifyLegacyFileName';
import { legacyStableId } from '../lib/legacyStableId';
import { newId } from '../utils/ids';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from './evidenceRepo';
import { listReportsByPartner, upsertReport } from './reportsRepo';
import { listLettersByPartner, upsertLetter } from './lettersRepo';
import { upsertCreditAnalysisReport } from './creditAnalysisReportsRepo';
import { getBusinessCreditProfile, upsertBusinessCreditProfile } from './businessCreditRepo';
import { logAffiliateAttribution } from './affiliateRepo';
import type { EvidenceItem } from '../domain/evidence';
import type { CreditReportRecord } from '../domain/creditReports';
import type { Bureau } from '../domain/creditReports';
import type { DisputeLetterMeta, LetterRecord } from '../domain/letters';
import { parseLegacyPartnerNotesFromExport } from '../lib/legacyPartnerNotesIntel';
import { syncLegacyLetterStageFromNotes, type LegacyStageSyncResult } from '../lib/legacyLetterStageSync';

import { LEGACY_PENDING_BLOB_PREFIX } from '../lib/legacyPendingReport';

export type LegacyArtifactImportResult = {
  evidenceCreated: number;
  reportsCreated: number;
  lettersCreated: number;
  analysisReportsCreated: number;
  bureauResponsesCreated: number;
  businessProfilesUpdated: number;
  affiliateEventsCreated: number;
  skipped: string[];
  /** Files routed away from generic evidence based on filename heuristics. */
  reclassified: string[];
  /** Misclassified evidence rows removed and recreated in the correct hub. */
  migratedFromEvidence: number;
  /** Sum of all artifact rows touched (evidence + reports + letters). */
  totalArtifacts: number;
  stageSync?: LegacyStageSyncResult;
};

function nowIso() {
  return new Date().toISOString();
}

function legacyBlobRef(filename: string) {
  return `${LEGACY_PENDING_BLOB_PREFIX}${filename}`;
}

function hasLegacyImportTag(item: { tags?: string[]; filename?: string }, filename: string) {
  if (item.filename === filename) return true;
  return (item.tags ?? []).includes('legacy-import');
}

function hasLegacyReportFile(existingReports: CreditReportRecord[], fileName: string) {
  return existingReports.some(
    (r) => r.filename === fileName && r.rawBlobRef.startsWith(LEGACY_PENDING_BLOB_PREFIX),
  );
}

function hasLegacyLetterFile(existingLetters: LetterRecord[], fileName: string) {
  return existingLetters.some((l) => {
    const meta = l.meta as (DisputeLetterMeta & { legacyFileName?: string }) | undefined;
    return meta?.legacyFileName === fileName || meta?.introOverride?.includes(`legacy-file:${fileName}`);
  });
}

function hasLegacyAnalysisReport(existingEvidence: EvidenceItem[], fileName: string) {
  return existingEvidence.some(
    (e) => e.filename === fileName && (e.tags ?? []).includes('analysis_report'),
  );
}

function hasLegacyBureauResponse(existingEvidence: EvidenceItem[], fileName: string) {
  return existingEvidence.some(
    (e) => e.filename === fileName && (e.tags ?? []).includes('bureau-response'),
  );
}

function findMisclassifiedLegacyEvidence(existingEvidence: EvidenceItem[], fileName: string) {
  return existingEvidence.find(
    (e) => e.filename === fileName && (e.tags ?? []).includes('legacy-import'),
  );
}

function removeMisclassifiedEvidence(
  existingEvidence: EvidenceItem[],
  fileName: string,
  dryRun: boolean | undefined,
  result: LegacyArtifactImportResult,
) {
  const mis = findMisclassifiedLegacyEvidence(existingEvidence, fileName);
  if (!mis) return;
  if (!dryRun) deleteEvidence(mis.id);
  result.migratedFromEvidence += 1;
  const idx = existingEvidence.findIndex((e) => e.id === mis.id);
  if (idx >= 0) existingEvidence.splice(idx, 1);
}

function legacyLetterBodyFromFile(fileName: string, caption: string): string {
  return `${caption}\n\nOriginal filename: ${fileName}\n\n[Re-upload the PDF from the old server archive or regenerate the letter body in the portal.]`;
}

export async function importLegacyPartnerArtifacts(args: {
  partnerId: string;
  exportPartner: LegacyPartnerExportV1['partners'][0];
  dryRun?: boolean;
  /** Re-run classifier on already-imported legacy rows and migrate misroutes. */
  forceReclassify?: boolean;
  /** Apply note-derived letter events + stage advancement (default true). */
  applyStageSync?: boolean;
}): Promise<LegacyArtifactImportResult> {
  const result: LegacyArtifactImportResult = {
    evidenceCreated: 0,
    reportsCreated: 0,
    lettersCreated: 0,
    analysisReportsCreated: 0,
    bureauResponsesCreated: 0,
    businessProfilesUpdated: 0,
    affiliateEventsCreated: 0,
    skipped: [],
    reclassified: [],
    migratedFromEvidence: 0,
    totalArtifacts: 0,
  };

  const p = args.exportPartner;
  const partnerId = args.partnerId;
  const existingEvidence = listEvidenceByPartner(partnerId);
  const existingReports = listReportsByPartner(partnerId);
  const existingLetters = listLettersByPartner(partnerId);

  const newEvidence: EvidenceItem[] = [];
  const newReports: CreditReportRecord[] = [];
  const newLetters: LetterRecord[] = [];

  for (const doc of p.legacyDocuments ?? []) {
    const fileName = String(doc.fileName || '').trim();
    if (!fileName) continue;

    const classification = classifyLegacyFileName(fileName);
    const uploadedAt = doc.uploadedAt || nowIso();

    if (classification.kind === 'credit_report') {
      result.reclassified.push(`report:${fileName}`);
      if (hasLegacyReportFile(existingReports, fileName) && !args.forceReclassify) {
        result.skipped.push(`report:${fileName}`);
        continue;
      }
      removeMisclassifiedEvidence(existingEvidence, fileName, args.dryRun, result);
      if (args.dryRun) {
        result.reportsCreated += 1;
        continue;
      }
      newReports.push({
        id: legacyStableId('report', args.exportPartner.externalId, fileName),
        partnerId,
        provider: 'unknown',
        fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html',
        uploadedBy: 'admin',
        receivedAt: uploadedAt,
        filename: fileName,
        mimeType: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/html',
        sizeBytes: 0,
        rawBlobRef: legacyBlobRef(fileName),
      });
      result.reportsCreated += 1;
      continue;
    }

    if (classification.kind === 'analysis_report') {
      result.reclassified.push(`analysis:${fileName}`);
      if (hasLegacyAnalysisReport(existingEvidence, fileName) && !args.forceReclassify) {
        result.skipped.push(`analysis:${fileName}`);
        continue;
      }
      removeMisclassifiedEvidence(existingEvidence, fileName, args.dryRun, result);
      if (args.dryRun) {
        result.analysisReportsCreated += 1;
        continue;
      }
      const evidenceId = legacyStableId('analysis-evidence', args.exportPartner.externalId, fileName);
      const evidence: EvidenceItem = {
        id: evidenceId,
        partnerId,
        type: 'upload',
        source: 'upload',
        caption: classification.caption,
        filename: fileName,
        mimeType: 'application/pdf',
        sizeBytes: 0,
        blobRef: legacyBlobRef(fileName),
        tags: ['legacy-import', 'analysis_report', classification.tag],
        createdAt: uploadedAt,
      };
      newEvidence.push(evidence);
      upsertCreditAnalysisReport({
        id: legacyStableId('analysis', args.exportPartner.externalId, fileName),
        partnerId,
        title: fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(),
        filename: fileName,
        blobRef: legacyBlobRef(fileName),
        sizeBytes: 0,
        pages: 0,
        createdAt: uploadedAt,
      });
      result.analysisReportsCreated += 1;
      result.evidenceCreated += 1;
      continue;
    }

    if (classification.kind === 'bureau_response') {
      result.reclassified.push(`bureau-response:${fileName}`);
      if (hasLegacyBureauResponse(existingEvidence, fileName) && !args.forceReclassify) {
        result.skipped.push(`bureau-response:${fileName}`);
        continue;
      }
      removeMisclassifiedEvidence(existingEvidence, fileName, args.dryRun, result);
      if (args.dryRun) {
        result.bureauResponsesCreated += 1;
        continue;
      }
      newEvidence.push({
        id: legacyStableId('bureau-response', args.exportPartner.externalId, fileName),
        partnerId,
        type: 'upload',
        source: 'upload',
        caption: classification.caption,
        filename: fileName,
        mimeType: 'application/pdf',
        sizeBytes: 0,
        blobRef: legacyBlobRef(fileName),
        tags: ['legacy-import', 'bureau-response', classification.tag],
        createdAt: uploadedAt,
      });
      result.bureauResponsesCreated += 1;
      result.evidenceCreated += 1;
      continue;
    }

    if (
      classification.kind === 'dispute_letter' ||
      classification.kind === 'validation_letter' ||
      classification.kind === 'affidavit'
    ) {
      result.reclassified.push(`letter:${fileName}`);
      if (hasLegacyLetterFile(existingLetters, fileName) && !args.forceReclassify) {
        result.skipped.push(`letter:${fileName}`);
        continue;
      }
      removeMisclassifiedEvidence(existingEvidence, fileName, args.dryRun, result);
      if (args.dryRun) {
        result.lettersCreated += 1;
        continue;
      }
      const letterType = classification.letterType ?? 'dispute';
      newLetters.push({
        id: newId('letter'),
        partnerId,
        type: letterType,
        title: classification.letterTitle ?? 'Legacy letter',
        createdAt: uploadedAt,
        body: legacyLetterBodyFromFile(fileName, classification.caption),
        status: 'generated',
        meta: {
          bureau: inferBureauFromFileName(fileName),
          round: '1',
          tone: 'formal',
          candidateIds: [],
          evidenceByCandidateId: {},
          reasonsByCandidateId: {},
          introOverride: `[legacy-file:${fileName}]`,
          legacyFileName: fileName,
          legacyTag: classification.tag,
          legacyLetterSubkind: classification.letterSubkind,
        } as DisputeLetterMeta & { legacyFileName: string; legacyTag: string; legacyLetterSubkind?: string },
      });
      result.lettersCreated += 1;
      continue;
    }

    if (existingEvidence.some((e) => hasLegacyImportTag(e, fileName)) && !args.forceReclassify) {
      result.skipped.push(`evidence:${fileName}`);
      continue;
    }
    if (
      !args.forceReclassify &&
      (hasLegacyReportFile(existingReports, fileName) ||
        hasLegacyLetterFile(existingLetters, fileName) ||
        hasLegacyAnalysisReport(existingEvidence, fileName) ||
        hasLegacyBureauResponse(existingEvidence, fileName))
    ) {
      result.skipped.push(`evidence:${fileName}:already-routed`);
      continue;
    }
    if (args.forceReclassify) {
      removeMisclassifiedEvidence(existingEvidence, fileName, args.dryRun, result);
    }
    if (args.dryRun) {
      result.evidenceCreated += 1;
      continue;
    }
    newEvidence.push({
      id: newId('evidence'),
      partnerId,
      type: 'upload',
      source: 'upload',
      caption: classification.caption,
      filename: fileName,
      mimeType: 'application/octet-stream',
      sizeBytes: 0,
      blobRef: legacyBlobRef(fileName),
      tags: ['legacy-import', classification.tag],
      createdAt: uploadedAt,
    });
    result.evidenceCreated += 1;
  }

  for (const rep of p.legacyReports ?? []) {
    const fileName = String(rep.fileName || '').trim();
    if (!fileName) continue;
    if (hasLegacyReportFile(existingReports, fileName) && !args.forceReclassify) {
      result.skipped.push(`report:${fileName}`);
      continue;
    }
    if (args.dryRun) {
      result.reportsCreated += 1;
      continue;
    }
    newReports.push({
      id: legacyStableId('report', args.exportPartner.externalId, fileName),
      partnerId,
      provider: 'unknown',
      fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html',
      uploadedBy: 'admin',
      receivedAt: rep.uploadedAt || nowIso(),
      filename: fileName,
      mimeType: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/html',
      sizeBytes: 0,
      rawBlobRef: legacyBlobRef(fileName),
    });
    result.reportsCreated += 1;
  }

  for (const letter of (p.legacyLetters ?? []) as LegacyLetterMeta[]) {
    const extId = String(letter.externalId || '').trim();
    if (!extId) continue;
    if (
      existingLetters.some(
        (l) => l.meta && (l.meta as DisputeLetterMeta & { legacyExternalId?: string }).legacyExternalId === extId,
      ) &&
      !args.forceReclassify
    ) {
      result.skipped.push(`letter:${extId}`);
      continue;
    }
    if (args.dryRun) {
      result.lettersCreated += 1;
      continue;
    }
    newLetters.push({
      id: newId('letter'),
      partnerId,
      type: 'dispute',
      title: letter.title || 'Legacy dispute letter',
      createdAt: letter.createdAt || nowIso(),
      body: legacyLetterBodyPlain(letter),
      status: 'generated',
      meta: {
        bureau: mapLegacyBureau(letter.bureau),
        round: '1',
        tone: 'formal',
        candidateIds: [],
        evidenceByCandidateId: {},
        reasonsByCandidateId: {},
        introOverride: `[legacy-import:${extId}]`,
        legacyExternalId: extId,
      } as DisputeLetterMeta & { legacyExternalId: string },
    });
    result.lettersCreated += 1;
  }

  if (!args.dryRun) {
    for (const item of newEvidence) upsertEvidence(item);
    for (const report of newReports) upsertReport(report);
    for (const letter of newLetters) upsertLetter(letter);

    const biz = p.legacyBusiness;
    if (biz && (biz.businessName || biz.ein)) {
      const profile = getBusinessCreditProfile(partnerId);
      upsertBusinessCreditProfile({
        ...profile,
        partnerId,
        roadmap: {
          ...(profile.roadmap ?? {}),
          ein_entity: biz.ein ? { done: true, doneAt: nowIso() } : profile.roadmap?.ein_entity,
          foundation_identity: biz.businessName ? { done: true, doneAt: nowIso() } : profile.roadmap?.foundation_identity,
        },
      });
      result.businessProfilesUpdated = 1;
    }
  } else if (p.legacyBusiness && (p.legacyBusiness.businessName || p.legacyBusiness.ein)) {
    result.businessProfilesUpdated = 1;
  }

  result.totalArtifacts =
    result.evidenceCreated + result.reportsCreated + result.lettersCreated + result.analysisReportsCreated;

  if (args.applyStageSync !== false && (p.notes || (p.legacyNoteEntries?.length ?? 0))) {
    const intel = parseLegacyPartnerNotesFromExport(p);
    result.stageSync = syncLegacyLetterStageFromNotes({
      partnerId,
      exportPartner: p,
      intel,
      dryRun: args.dryRun,
    });
    result.lettersCreated += result.stageSync.lettersCreated;
    result.totalArtifacts += result.stageSync.lettersCreated;
  }

  return result;
}

export function formatLegacyArtifactImportSummary(result: {
  evidenceCreated: number;
  reportsCreated: number;
  lettersCreated: number;
  analysisReportsCreated?: number;
  bureauResponsesCreated?: number;
  businessProfilesUpdated?: number;
  migratedFromEvidence?: number;
  totalArtifacts?: number;
  stageSync?: LegacyStageSyncResult;
}): string {
  const total =
    result.totalArtifacts ??
    result.evidenceCreated + result.reportsCreated + result.lettersCreated + (result.analysisReportsCreated ?? 0);
  let msg = `${total} legacy files — ${result.reportsCreated} credit reports`;
  if ((result.analysisReportsCreated ?? 0) > 0) {
    msg += ` · ${result.analysisReportsCreated} analysis reports`;
  }
  if ((result.bureauResponsesCreated ?? 0) > 0) {
    msg += ` · ${result.bureauResponsesCreated} bureau responses`;
  }
  msg += ` · ${result.lettersCreated} letters · ${result.evidenceCreated} supporting docs (Documents vault)`;
  if ((result.migratedFromEvidence ?? 0) > 0) {
    msg += ` · ${result.migratedFromEvidence} re-routed from a prior misclassified import`;
  }
  if ((result.businessProfilesUpdated ?? 0) > 0) {
    msg += ` · ${result.businessProfilesUpdated} business profile(s)`;
  }
  if (result.stageSync) {
    const s = result.stageSync;
    if (s.lettersCreated || s.casesCreated || s.tasksCreated) {
      msg += ` · notes sync: +${s.lettersCreated} letters, +${s.casesCreated} cases, +${s.tasksCreated} tasks`;
    }
    if (s.journeyStageAdvanced) msg += ` · stage→${s.journeyStageAdvanced}`;
  }
  return msg;
}

export async function seedLegacyReferralAttributions(args: {
  seeds: Array<{ externalId: string; affiliateEmail?: string; referralCode?: string; partnerEmail?: string }>;
  affiliateId: string;
  dryRun?: boolean;
}): Promise<number> {
  let count = 0;
  for (const seed of args.seeds) {
    if (args.dryRun) {
      count += 1;
      continue;
    }
    await logAffiliateAttribution({
      affiliateId: args.affiliateId,
      eventType: 'lead',
      meta: {
        legacyExternalId: seed.externalId,
        partnerEmail: seed.partnerEmail,
        referralCode: seed.referralCode,
      },
    });
    count += 1;
  }
  return count;
}

function inferBureauFromFileName(fileName: string): Bureau {
  const n = fileName.toLowerCase();
  if (n.includes('exp') || n.includes('experian')) return 'EXP';
  if (n.includes('eqf') || n.includes('equifax')) return 'EQF';
  if (n.includes('tuc') || n.includes('transunion') || n.includes('trans union')) return 'TUC';
  return 'EXP';
}

function mapLegacyBureau(raw?: string): Bureau {
  const b = (raw || '').trim().toUpperCase();
  if (b.includes('EXP')) return 'EXP';
  if (b.includes('EQF') || b.includes('EQUIFAX')) return 'EQF';
  if (b.includes('TUC') || b.includes('TRANSUNION')) return 'TUC';
  return 'EXP';
}
