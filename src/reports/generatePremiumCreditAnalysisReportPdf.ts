import type { CreditReportRecord, DisputeCandidate } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import { resolveCreditAnalysisEngine } from '../lib/resolveCreditAnalysisEngine';
import { generatePremiumSpreadCreditAnalysisReportPdf } from './composePremiumSpreadCreditAnalysis';
import { generateStructuredPremiumCreditAnalysisReportPdf } from './composeStructuredPremiumCreditAnalysis';

export { PREMIUM_CREDIT_ANALYSIS_SPREADS } from './spreadOverlayRegistry';

/** Premium credit analysis — approved spread artwork with dynamic partner overlays. */
export async function generatePremiumCreditAnalysisReportPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  templateTitle?: string;
  template?: import('./generateCreditAnalysisReportPdf').CreditAnalysisReportTemplateConfig | null;
}) {
  const engine = resolveCreditAnalysisEngine(args.template);
  if (engine === 'structured_premium') {
    return generateStructuredPremiumCreditAnalysisReportPdf({
      partner: args.partner,
      report: args.report,
      candidates: args.candidates,
      snapshots: args.snapshots,
      templateTitle: args.templateTitle,
      template: args.template ?? null,
    });
  }
  return generatePremiumSpreadCreditAnalysisReportPdf({
    partner: args.partner,
    report: args.report,
    candidates: args.candidates,
    snapshots: args.snapshots,
    templateTitle: args.templateTitle,
    template: args.template ?? null,
  });
}