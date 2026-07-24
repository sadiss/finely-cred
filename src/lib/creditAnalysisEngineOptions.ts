import type { CreditAnalysisReportEngine } from '../reports/generateCreditAnalysisReportPdf';

export type CreditAnalysisEngineOption = {
  id: CreditAnalysisReportEngine;
  label: string;
  shortLabel: string;
  recommended?: boolean;
  summary: string;
  bestFor: string;
  includes: string[];
  note: string;
};

/** Plain-English engine choices for portal/admin analysis UX. */
export const CREDIT_ANALYSIS_ENGINE_OPTIONS: CreditAnalysisEngineOption[] = [
  {
    id: 'structured_premium',
    label: 'Structured premium (recommended)',
    shortLabel: 'Structured premium',
    recommended: true,
    summary:
      'Full partner dossier built page-by-page: mindset, readiness, negatives by category, ranked actions, and a 90-day roadmap. Ivory/forest pages with amber-gold accents.',
    bestFor: 'Most partners — default deliverable after uploading a bureau report.',
    includes: [
      'Live bureau scores + readiness narrative',
      'Negative buckets with strategist framing',
      'Priority dispute sequence in plain English',
      'Restore → Build → Fundability path',
    ],
    note: 'Results vary · not legal advice · funding subject to underwriting.',
  },
  {
    id: 'premium_spreads',
    label: 'Premium spreads (visual)',
    shortLabel: 'Premium spreads',
    summary:
      'Ten designed visual spreads with dynamic overlays for scores, risk cards, and roadmap highlights. Stronger “presentation” look; less dense tradeline text than structured premium.',
    bestFor: 'Sessions and reviews where you want a visual storyboard first.',
    includes: [
      'Designed spread pack with live overlays',
      'Score and risk highlights',
      'Action roadmap panels',
    ],
    note: 'Regenerate after major file changes so overlays match the latest parse.',
  },
  {
    id: 'paginated_text',
    label: 'Legacy text + exhibits',
    shortLabel: 'Legacy',
    summary:
      'Older paginated text layout. Use only when you need to embed image exhibits in the appendix, or to regenerate a historical style.',
    bestFor: 'Exhibit-heavy appendix runs (screenshots attached to the PDF).',
    includes: ['Text sections', 'Optional image exhibits (up to 10)', 'Variant density controls'],
    note: 'Prefer structured premium for partner-facing strategy reports.',
  },
];

export function creditAnalysisEngineOption(id: CreditAnalysisReportEngine | undefined | null): CreditAnalysisEngineOption {
  return (
    CREDIT_ANALYSIS_ENGINE_OPTIONS.find((o) => o.id === id) ??
    CREDIT_ANALYSIS_ENGINE_OPTIONS.find((o) => o.id === 'structured_premium')!
  );
}
