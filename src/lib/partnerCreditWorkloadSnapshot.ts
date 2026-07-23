import type { DisputeCandidate } from '../domain/creditReports';
import { deriveDisputeCandidates } from '../creditReports/disputeCandidates';
import { classifyCandidateNegativeType, type NegativeType } from '../creditReports/negativePlaybooks';
import { listCasesByPartner } from '../data/casesRepo';
import { listEvidenceByPartner } from '../data/evidenceRepo';
import { listLettersByPartner } from '../data/lettersRepo';
import { listReportsByPartner } from '../data/reportsRepo';
import { summarizePartnerDisputeRounds } from './creditRestoreRoundRollup';
import { normCreditorName } from './debtCreditorIntel';

export type CreditNegativeCounts = Partial<Record<NegativeType, number>>;

export type PartnerCreditWorkloadSnapshot = {
  reportsCount: number;
  totalNegatives: number;
  negativeCounts: CreditNegativeCounts;
  openDisputeCases: number;
  lettersGenerated: number;
  disputeRoundsActive: number;
  screenshotCount: number;
  /** Selected in Letter Studio (when caller passes selection state). */
  selectedDisputes: number;
  pendingEvidence: number;
  pendingReasons: number;
};

function dedupeKey(c: DisputeCandidate): string {
  const acct = normCreditorName(c.account || '');
  const type = String(c.type || '').toLowerCase().trim();
  return `${acct}::${type}`;
}

function countNegativesFromReports(partnerId: string): { counts: CreditNegativeCounts; total: number } {
  const reports = listReportsByPartner(partnerId);
  const seen = new Set<string>();
  const counts: CreditNegativeCounts = {};

  for (const report of reports) {
    const parsed = report.parsed;
    if (!parsed) continue;
    for (const c of deriveDisputeCandidates(parsed, report.id)) {
      const key = dedupeKey(c);
      if (seen.has(key)) continue;
      seen.add(key);
      const nt = classifyCandidateNegativeType(c);
      if (nt === 'unknown' || nt === 'personal_info') continue;
      counts[nt] = (counts[nt] ?? 0) + 1;
    }
  }

  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  return { counts, total };
}

export function computePartnerCreditWorkloadSnapshot(
  partnerId: string,
  opts?: {
    selectedDisputes?: Array<{ key: string }>;
    evidenceByCandidateId?: Record<string, string>;
    reasonsByCandidateId?: Record<string, string[]>;
  },
): PartnerCreditWorkloadSnapshot {
  const reports = listReportsByPartner(partnerId);
  const cases = listCasesByPartner(partnerId);
  const letters = listLettersByPartner(partnerId);
  const evidence = listEvidenceByPartner(partnerId);
  const roundSummary = summarizePartnerDisputeRounds(partnerId, cases);
  const { counts, total } = countNegativesFromReports(partnerId);

  const selected = opts?.selectedDisputes ?? [];
  const evMap = opts?.evidenceByCandidateId ?? {};
  const reasonMap = opts?.reasonsByCandidateId ?? {};
  let pendingEvidence = 0;
  let pendingReasons = 0;
  for (const s of selected) {
    if (!evMap[s.key]) pendingEvidence += 1;
    const reasons = (reasonMap[s.key] ?? []).filter(Boolean);
    if (reasons.length === 0) pendingReasons += 1;
  }

  return {
    reportsCount: reports.length,
    totalNegatives: total,
    negativeCounts: counts,
    openDisputeCases: cases.filter((c) => c.status === 'open').length,
    lettersGenerated: letters.filter((l) => !l.archivedAt).length,
    disputeRoundsActive: roundSummary.awaitingResponse,
    screenshotCount: evidence.filter((e) => e.type === 'screenshot').length,
    selectedDisputes: selected.length,
    pendingEvidence,
    pendingReasons,
  };
}

export function formatCreditWorkloadSummary(s: PartnerCreditWorkloadSnapshot): string {
  const parts: string[] = [];
  if (s.totalNegatives > 0) parts.push(`${s.totalNegatives} negative${s.totalNegatives === 1 ? '' : 's'}`);
  if (s.selectedDisputes > 0) parts.push(`${s.selectedDisputes} selected`);
  if (s.pendingEvidence > 0) parts.push(`${s.pendingEvidence} need evidence`);
  if (s.pendingReasons > 0) parts.push(`${s.pendingReasons} need reasons`);
  if (s.openDisputeCases > 0) parts.push(`${s.openDisputeCases} open case${s.openDisputeCases === 1 ? '' : 's'}`);
  if (s.lettersGenerated > 0) parts.push(`${s.lettersGenerated} letter${s.lettersGenerated === 1 ? '' : 's'}`);
  return parts.length ? parts.join(' · ') : 'Upload a report to start';
}
