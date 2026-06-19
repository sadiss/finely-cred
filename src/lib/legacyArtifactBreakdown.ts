import type { LegacyPartnerExportV1 } from '../domain/imports';
import { classifyLegacyFileName, type LegacyFileKind } from './classifyLegacyFileName';

export type LegacyArtifactBreakdown = {
  creditReports: number;
  disputeLetters: number;
  validationLetters: number;
  affidavits: number;
  governmentIds: number;
  proofOfAddress: number;
  ssnCards: number;
  otherEvidence: number;
  structuredLetters: number;
  htmlReports: number;
  totalLegacyFiles: number;
};

function bump(counts: LegacyArtifactBreakdown, kind: LegacyFileKind) {
  if (kind === 'credit_report') counts.creditReports += 1;
  else if (kind === 'dispute_letter') counts.disputeLetters += 1;
  else if (kind === 'validation_letter') counts.validationLetters += 1;
  else if (kind === 'affidavit') counts.affidavits += 1;
  else if (kind === 'government_id') counts.governmentIds += 1;
  else if (kind === 'proof_of_address') counts.proofOfAddress += 1;
  else if (kind === 'ssn_card') counts.ssnCards += 1;
  else counts.otherEvidence += 1;
}

export function emptyLegacyArtifactBreakdown(): LegacyArtifactBreakdown {
  return {
    creditReports: 0,
    disputeLetters: 0,
    validationLetters: 0,
    affidavits: 0,
    governmentIds: 0,
    proofOfAddress: 0,
    ssnCards: 0,
    otherEvidence: 0,
    structuredLetters: 0,
    htmlReports: 0,
    totalLegacyFiles: 0,
  };
}

export function summarizeLegacyPartnerArtifacts(
  partner: LegacyPartnerExportV1['partners'][0],
): LegacyArtifactBreakdown {
  const counts = emptyLegacyArtifactBreakdown();

  for (const doc of partner.legacyDocuments ?? []) {
    const fileName = String(doc.fileName || '').trim();
    if (!fileName) continue;
    bump(counts, classifyLegacyFileName(fileName).kind);
    counts.totalLegacyFiles += 1;
  }

  for (const rep of partner.legacyReports ?? []) {
    const fileName = String(rep.fileName || '').trim();
    if (!fileName) continue;
    counts.htmlReports += 1;
    counts.totalLegacyFiles += 1;
  }

  counts.structuredLetters += (partner.legacyLetters ?? []).length;
  counts.totalLegacyFiles += (partner.legacyLetters ?? []).length;

  return counts;
}

export function summarizeLegacyExportArtifacts(
  partners: LegacyPartnerExportV1['partners'],
): LegacyArtifactBreakdown {
  const totals = emptyLegacyArtifactBreakdown();
  for (const p of partners) {
    const row = summarizeLegacyPartnerArtifacts(p);
    totals.creditReports += row.creditReports;
    totals.disputeLetters += row.disputeLetters;
    totals.validationLetters += row.validationLetters;
    totals.affidavits += row.affidavits;
    totals.governmentIds += row.governmentIds;
    totals.proofOfAddress += row.proofOfAddress;
    totals.ssnCards += row.ssnCards;
    totals.otherEvidence += row.otherEvidence;
    totals.structuredLetters += row.structuredLetters;
    totals.htmlReports += row.htmlReports;
    totals.totalLegacyFiles += row.totalLegacyFiles;
  }
  return totals;
}

export function formatLegacyArtifactBreakdown(b: LegacyArtifactBreakdown): string {
  const letterTotal = b.disputeLetters + b.validationLetters + b.affidavits + b.structuredLetters;
  const reportTotal = b.creditReports + b.htmlReports;
  const evidenceTotal = b.governmentIds + b.proofOfAddress + b.ssnCards + b.otherEvidence;
  return `${b.totalLegacyFiles} legacy files → ${reportTotal} credit reports · ${letterTotal} letters · ${evidenceTotal} supporting docs/IDs`;
}
