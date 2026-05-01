import type { Bureau, DisputeCandidate } from './creditReports';
import { newId } from '../utils/ids';

export type CaseStatus = 'open' | 'closed';

export type DisputeCaseItem = {
  id: string;
  bureau: Bureau;
  account: string;
  type: string;
  status: string;
  code: string;
  reportId?: string;
  candidateId?: string;
  evidenceId?: string;
  reasons: string[];
};

export type DisputeCaseRound = {
  round: 'Round 1' | 'Round 2' | 'Round 3';
  tone: 'formal' | 'neutral' | 'conversational';
  createdAt: string;
  /**
   * Internal tracking only (DIY/DFY execution happens outside the app).
   * Due date used for reminders and follow-up workflows.
   */
  dueAt?: string;
  letterId?: string;
  notes?: string;
};

export type DisputeCase = {
  id: string;
  partnerId: string;
  /**
   * Optional: links the dispute case to a work project.
   * Used to group "credit restore" work into a single project board.
   */
  projectId?: string;
  bureau: Bureau;
  title: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  /**
   * Snapshot of items included in the case.
   * Items are per-bureau by design.
   */
  items: DisputeCaseItem[];
  rounds: DisputeCaseRound[];
  latestReportId?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function addDaysIso(fromIso: string, days: number) {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function candidateToCaseItem(candidate: DisputeCandidate, args?: { evidenceId?: string; reasons?: string[] }): DisputeCaseItem {
  return {
    id: newId('case_item'),
    bureau: candidate.bureau,
    account: candidate.account,
    type: candidate.type,
    status: candidate.status,
    code: candidate.code,
    reportId: candidate.reportId,
    candidateId: candidate.id,
    evidenceId: args?.evidenceId,
    reasons: (args?.reasons ?? []).map((x) => x.trim()).filter(Boolean),
  };
}

