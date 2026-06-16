import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { LegacyLetterMeta } from '../lib/legacyMigrationPhase2';
import { legacyLetterBodyPlain } from '../lib/legacyMigrationPhase2';
import { newId } from '../utils/ids';
import { listEvidenceByPartner, upsertEvidence } from './evidenceRepo';
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
  };

  const p = args.exportPartner;
  const partnerId = args.partnerId;
  const existingEvidence = listEvidenceByPartner(partnerId);
  const existingReports = listReportsByPartner(partnerId);
  const existingLetters = listLettersByPartner(partnerId);

  const newEvidence: EvidenceItem[] = [];
  for (const doc of p.legacyDocuments ?? []) {
    const fileName = String(doc.fileName || '').trim();
    if (!fileName) continue;
    if (existingEvidence.some((e) => hasLegacyImportTag(e, fileName))) {
      result.skipped.push(`evidence:${fileName}`);
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
      caption: 'Legacy document — re-upload file from old server archive',
      filename: fileName,
      mimeType: 'application/octet-stream',
      sizeBytes: 0,
      blobRef: legacyBlobRef(fileName),
      tags: ['legacy-import'],
      createdAt: doc.uploadedAt || nowIso(),
    });
    result.evidenceCreated += 1;
  }

  const newReports: CreditReportRecord[] = [];
  for (const rep of p.legacyReports ?? []) {
    const fileName = String(rep.fileName || '').trim();
    if (!fileName) continue;
    if (existingReports.some((r) => r.filename === fileName && r.rawBlobRef.startsWith(LEGACY_BLOB_PREFIX))) {
      result.skipped.push(`report:${fileName}`);
      continue;
    }
    if (args.dryRun) {
      result.reportsCreated += 1;
      continue;
    }
    newReports.push({
      id: newId('report'),
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

  const newLetters: LetterRecord[] = [];
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

  return result;
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

function mapLegacyBureau(raw?: string): Bureau {
  const b = (raw || '').trim().toUpperCase();
  if (b.includes('EXP')) return 'EXP';
  if (b.includes('EQF') || b.includes('EQUIFAX')) return 'EQF';
  if (b.includes('TUC') || b.includes('TRANSUNION')) return 'TUC';
  return 'EXP';
}
