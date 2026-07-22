import type { CreditAnalysisReportTemplateConfig } from '../reports/generateCreditAnalysisReportPdf';

export const PREMIUM_CREDIT_ANALYSIS_TEMPLATE_ID = 'seed_tplv_premium_credit_analysis_v1';

/** Default premium deliverable uses the original ivory/white structured report engine. */
export function resolveCreditAnalysisEngine(
  template?: CreditAnalysisReportTemplateConfig | null,
): 'structured_premium' | 'paginated_text' | 'premium_spreads' {
  const engine = template?.engine;
  if (engine === 'paginated_text') return 'paginated_text';
  if (engine === 'structured_premium') return 'structured_premium';
  if (engine === 'premium_spreads') return 'premium_spreads';
  return 'structured_premium';
}

export function isPremiumCreditAnalysisEngine(template?: CreditAnalysisReportTemplateConfig | null): boolean {
  return resolveCreditAnalysisEngine(template) !== 'paginated_text';
}