import type { Bureau, ParsedScore } from './creditReports';

export type CreditScoreSnapshot = {
  id: string;
  partnerId: string;
  reportId: string;
  capturedAt: string;
  reportDate?: string;
  provider?: string;
  scores: ParsedScore[];
  /** Best single score for trend charts (highest FICO-like). */
  headlineScore?: number;
  headlineBureau?: Bureau;
};
