import type { CreditReportRecord, DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import { sendAnalysisReportDeliveryEmail } from '../comms/analysisReportDeliveryEmail';
import { deriveDisputeCandidates } from '../creditReports/disputeCandidates';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';

function reportsUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/portal/reports`;
  }
  return '/portal/reports';
}

/** Send HTML analysis-ready email after PDF generation (best-effort, non-blocking). */
export async function notifyAnalysisReportReady(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates?: DisputeCandidate[];
}): Promise<{ sent: boolean; reason?: string }> {
  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }
  const parsed: ParsedCreditReport | null = args.report.parsed ?? null;
  const candidates = args.candidates ?? (parsed ? deriveDisputeCandidates(parsed, args.report.id) : []);

  return sendAnalysisReportDeliveryEmail({
    partner: args.partner,
    parsed,
    candidates,
    reportsUrl: reportsUrl(),
  });
}
