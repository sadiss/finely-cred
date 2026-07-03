import type { CreditReportRecord, DisputeCandidate } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import type { CreditAnalysisReportTemplateConfig } from './generateCreditAnalysisReportPdf';
import { generateCreditAnalysisReportPdf, type AnalysisVariant } from './generateCreditAnalysisReportPdf';
import { generatePremiumCreditAnalysisReportPdf } from './generatePremiumCreditAnalysisReportPdf';
import { isPremiumCreditAnalysisEngine } from '../lib/resolveCreditAnalysisEngine';

type ExhibitImage = { blobRef: string; filename?: string; mimeType?: string; caption?: string };

export async function generatePartnerCreditAnalysisReport(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  variant?: AnalysisVariant;
  exhibits?: ExhibitImage[];
  template?: CreditAnalysisReportTemplateConfig | null;
  snapshots?: CreditScoreSnapshot[];
}) {
  if (isPremiumCreditAnalysisEngine(args.template)) {
    return generatePremiumCreditAnalysisReportPdf({
      partner: args.partner,
      report: args.report,
      candidates: args.candidates,
      snapshots: args.snapshots,
      templateTitle: args.template?.title,
    });
  }
  return generateCreditAnalysisReportPdf({
    partner: args.partner,
    report: args.report,
    candidates: args.candidates,
    variant: args.variant,
    exhibits: args.exhibits,
    template: args.template,
  });
}
