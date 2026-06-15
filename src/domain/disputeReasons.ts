import type { Bureau } from './creditReports';

export type DisputeReasonSuggestion = {
  id: string;
  text: string;
};

export type DisputeReasonsRecord = {
  /**
   * Stable unique id derived from partner + report + bureau + candidate.
   * Use `computeDisputeReasonsId` to generate.
   */
  id: string;
  partnerId: string;
  reportId?: string;
  bureau: Bureau;
  candidateId: string;

  /**
   * Suggestions shown to the user at generation time.
   * Stored as a snapshot so previously generated letters can be understood later.
   */
  suggestions: DisputeReasonSuggestion[];

  /** Which suggestion ids the user selected. */
  selectedSuggestionIds: string[];

  /** Free-form reasons typed by the user. */
  customReasons: string[];

  updatedAt: string;
};

export function computeDisputeReasonsId(args: {
  partnerId: string;
  reportId?: string;
  bureau: Bureau;
  candidateId: string;
}) {
  const r = args.reportId || 'report';
  return `reasons_${args.partnerId}_${r}_${args.bureau}_${args.candidateId}`.replace(/\s+/g, '_');
}

