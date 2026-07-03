import type { CreditAnalysisReportTemplateConfig } from '../reports/generateCreditAnalysisReportPdf';

export const PREMIUM_CREDIT_ANALYSIS_TEMPLATE_ID = 'seed_tplv_premium_credit_analysis_v1';

/** Approved 10-spread package is the default unless a template explicitly requests paginated_text. */
export function resolveCreditAnalysisEngine(
  template?: CreditAnalysisReportTemplateConfig | null,
): 'premium_spreads' | 'paginated_text' {
  const engine = template?.engine;
  if (engine === 'paginated_text') return 'paginated_text';
  return 'premium_spreads';
}

export function isPremiumCreditAnalysisEngine(template?: CreditAnalysisReportTemplateConfig | null): boolean {
  return resolveCreditAnalysisEngine(template) === 'premium_spreads';
}
