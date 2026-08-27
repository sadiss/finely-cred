import type { Bureau, ParsedScore } from './creditReports';

export type CreditScoreSnapshot = {
  id: string;
  partnerId: string;
  reportId: string;
  capturedAt: string;
  reportDate?: string;
  provider?: string;
  scores: ParsedScore[];
  /** Middle bureau score (median of three, lower of two, or single). */
  headlineScore?: number;
  headlineBureau?: Bureau;
  middleLabel?: string;
  middleConfidence?: 'high' | 'low';
  middleMethod?: 'median3' | 'lower_of_2' | 'single' | 'none';
};
