import type { DisputeCandidate } from '../domain/creditReports';
import type { LetterRecord } from '../domain/letters';

function isDisputeMeta(meta: LetterRecord['meta']): meta is Extract<LetterRecord['meta'], { candidateIds: string[] }> {
  return Boolean(meta && 'candidateIds' in meta && Array.isArray(meta.candidateIds));
}

/** Count dispute candidates with at least one linked evidence id on a saved letter. */
export function countCandidatesWithLinkedEvidence(candidates: DisputeCandidate[], letters: LetterRecord[]): number {
  const candidateIds = new Set(candidates.map((c) => c.id));
  const linked = new Set<string>();
  for (const letter of letters) {
    if (letter.archivedAt) continue;
    const meta = letter.meta;
    if (!isDisputeMeta(meta)) continue;
    const evidenceMap = meta.evidenceByCandidateId ?? {};
    for (const id of meta.candidateIds) {
      if (!candidateIds.has(id)) continue;
      if (evidenceMap[id]?.trim()) linked.add(id);
    }
  }
  return linked.size;
}

export type EvidenceCoverageSnapshot = {
  totalCandidates: number;
  withProof: number;
  evidenceFiles: number;
  summary: string;
  tone: 'success' | 'warning' | 'blocking';
};

export function computeRestoreEvidenceCoverage(args: {
  candidates: DisputeCandidate[];
  evidenceCount: number;
  letters: LetterRecord[];
}): EvidenceCoverageSnapshot {
  const totalCandidates = args.candidates.length;
  const withProof = countCandidatesWithLinkedEvidence(args.candidates, args.letters);
  const evidenceFiles = args.evidenceCount;

  if (totalCandidates === 0) {
    return {
      totalCandidates: 0,
      withProof: 0,
      evidenceFiles,
      summary: evidenceFiles ? `${evidenceFiles} file(s) in vault — upload a report to map proof to tradelines.` : 'Upload ID, proof of address, and bureau screenshots to the Evidence Vault.',
      tone: evidenceFiles ? 'warning' : 'blocking',
    };
  }

  const summary =
    withProof >= totalCandidates
      ? `${withProof}/${totalCandidates} dispute items have linked proof · ${evidenceFiles} vault file(s)`
      : `${withProof}/${totalCandidates} dispute items have linked proof — attach exhibits before mailing.`;

  const tone: EvidenceCoverageSnapshot['tone'] =
    withProof === 0 && evidenceFiles === 0 ? 'blocking' : withProof < totalCandidates ? 'warning' : 'success';

  return { totalCandidates, withProof, evidenceFiles, summary, tone };
}
