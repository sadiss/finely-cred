import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { LegacyLetterMeta } from '../lib/legacyMigrationPhase2';
import { legacyLetterBodyPlain } from '../lib/legacyMigrationPhase2';
import { classifyLegacyFileName } from '../lib/classifyLegacyFileName';
import { legacyStableId } from '../lib/legacyStableId';
import { newId } from '../utils/ids';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from './evidenceRepo';
import { listReportsByPartner, upsertReport } from './reportsRepo';
import { listLettersByPartner, upsertLetter } from './lettersRepo';
import { getBusinessCreditProfile, upsertBusinessCreditProfile } from './businessCreditRepo';
import { logAffiliateAttribution } from './affiliateRepo';
import type { EvidenceItem } from '../domain/evidence';
import type { CreditReportRecord } from '../domain/creditReports';
import type { Bureau } from '../domain/creditReports';
import type { DisputeLetterMeta, LetterRecord } from '../domain/letters';

const LEGACY_BLOB_PREFIX = 'legacy:pending-reupload:';

export type LegacyArtifactImportResult = {
  evidenceCreated: number;
  reportsCreated: number;
  lettersCreated: number;
  businessProfilesUpdated: number;
  affiliateEventsCreated: number;
  skipped: string[];
  /** Files routed away from generic evidence based on filename heuristics. */
  reclassified: string[];
  /** Misclassified evidence rows removed and recreated in the correct hub. */
  migratedFromEvidence: number;
  /** Sum of all artifact rows touched (evidence + reports + letters). */
  totalArtifacts: number;
};

function nowIso() {
  return new Date().toISOString();
}

function legacyBlobRef(filename: string) {
  return `${LEGACY_BLOB_PREFIX}${filename}`;
}

function hasLegacyImportTag(item: { tags?: string[]; filename?: string }, filename: string) {
  if (item.filename === filename) return true;
  return (item.tags ?? []).includes('legacy-import');
}

function hasLegacyReportFile(existingReports: CreditReportRecord[], fileName: string) {
  return existingReports.some(
    (r) => r.filename === fileName && r.rawBlobRef.startsWith(LEGACY_BLOB_PREFIX),
  );
}

function hasLegacyLetterFile(existingLetters: LetterRecord[], fileName: string) {
  return existingLetters.some((l) => {
    const meta = l.meta as (DisputeLetterMeta & { legacyFileName?: string }) | undefined;
    return meta?.legacyFileName === fileName || meta?.introOverride?.includes(`legacy-file:${fileName}`);
  });
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
}): Promise<LegacyArtifactImportResult> {
  const result: LegacyArtifactImportResult = {
    evidenceCreated: 0,
    reportsCreated: 0,
    lettersCreated: 0,
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
      if (hasLegacyReportFile(existingReports, fileName)) {
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

    if (
      classification.kind === 'dispute_letter' ||
      classification.kind === 'validation_letter' ||
      classification.kind === 'affidavit'
    ) {
      result.reclassified.push(`letter:${fileName}`);
      if (hasLegacyLetterFile(existingLetters, fileName)) {
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
        } as DisputeLetterMeta & { legacyFileName: string; legacyTag: string },
      });
      result.lettersCreated += 1;
      continue;
    }

    if (existingEvidence.some((e) => hasLegacyImportTag(e, fileName))) {
      result.skipped.push(`evidence:${fileName}`);
      continue;
    }
    if (hasLegacyReportFile(existingReports, fileName) || hasLegacyLetterFile(existingLetters, fileName)) {
      result.skipped.push(`evidence:${fileName}:already-routed`);
      continue;
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
    if (hasLegacyReportFile(existingReports, fileName)) {
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
    if (existingLetters.some((l) => l.meta && (l.meta as DisputeLetterMeta & { legacyExternalId?: string }).legacyExternalId === extId)) {
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

  result.totalArtifacts = result.evidenceCreated + result.reportsCreated + result.lettersCreated;

  return result;
}

export function formatLegacyArtifactImportSummary(result: {
  evidenceCreated: number;
  reportsCreated: number;
  lettersCreated: number;
  businessProfilesUpdated?: number;
  migratedFromEvidence?: number;
  totalArtifacts?: number;
}): string {
  const total = result.totalArtifacts ?? result.evidenceCreated + result.reportsCreated + result.lettersCreated;
  let msg = `${total} legacy files — ${result.reportsCreated} credit reports · ${result.lettersCreated} letters · ${result.evidenceCreated} supporting docs (Documents vault)`;
  if ((result.migratedFromEvidence ?? 0) > 0) {
    msg += ` · ${result.migratedFromEvidence} re-routed from a prior misclassified import`;
  }
  if ((result.businessProfilesUpdated ?? 0) > 0) {
    msg += ` · ${result.businessProfilesUpdated} business profile(s)`;
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
