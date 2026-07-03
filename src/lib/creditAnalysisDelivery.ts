import type { CreditAnalysisReportRecord } from '../domain/creditAnalysisReports';
import type { CreditReportRecord, DisputeCandidate } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import { sendAnalysisReportDeliveryEmail } from '../comms/analysisReportDeliveryEmail';
import { deriveDisputeCandidates } from '../creditReports/disputeCandidates';
import { upsertCreditAnalysisReport } from '../data/creditAnalysisReportsRepo';
import { addAuditEvent } from '../data/auditRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';

function analysisVaultUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/portal/analysis`;
  }
  return '/portal/analysis';
}

export async function deliverCreditAnalysisReport(args: {
  partner: Partner;
  analysis: CreditAnalysisReportRecord;
  creditReport?: CreditReportRecord | null;
  candidates?: DisputeCandidate[];
  actorEmail?: string;
  actorRole?: 'admin' | 'partner' | 'credit_specialist';
}): Promise<{ sent: boolean; reason?: string; updated: CreditAnalysisReportRecord }> {
  const parsed = args.creditReport?.parsed ?? null;
  const candidates =
    args.candidates ??
    (parsed && args.creditReport ? deriveDisputeCandidates(parsed, args.creditReport.id) : []);

  let sent = false;
  let reason: string | undefined;

  if (isFeatureEnabled('commsDelivery') && isSupabaseConfigured) {
    const emailResult = await sendAnalysisReportDeliveryEmail({
      partner: args.partner,
      parsed,
      candidates,
      reportsUrl: analysisVaultUrl(),
      analysisTitle: args.analysis.title,
    });
    sent = emailResult.sent;
    reason = emailResult.reason;
  } else {
    reason = 'comms_not_configured';
  }

  const now = new Date().toISOString();
  const updated = upsertCreditAnalysisReport({
    ...args.analysis,
    sentAt: now,
    sentByEmail: args.actorEmail,
    sentByRole: args.actorRole ?? 'admin',
    deliveryChannel: sent ? 'email_and_portal' : 'portal',
  });

  addAuditEvent({
    partnerId: args.partner.id,
    actorType: args.actorRole === 'partner' ? 'partner' : 'admin',
    actorEmail: args.actorEmail,
    action: 'report.credit_analysis.delivered',
    entityType: 'credit_analysis_report',
    entityId: args.analysis.id,
    meta: {
      sent,
      reason,
      filename: args.analysis.filename,
      pages: args.analysis.pages,
      engine: args.analysis.engine,
    },
  });

  return { sent, reason, updated };
}

/** @deprecated use deliverCreditAnalysisReport */
export async function notifyAnalysisReportReady(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates?: DisputeCandidate[];
  analysis?: CreditAnalysisReportRecord;
  actorEmail?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (args.analysis) {
    const res = await deliverCreditAnalysisReport({
      partner: args.partner,
      analysis: args.analysis,
      creditReport: args.report,
      candidates: args.candidates,
      actorEmail: args.actorEmail,
      actorRole: 'partner',
    });
    return { sent: res.sent, reason: res.reason };
  }

  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }
  const parsed = args.report.parsed ?? null;
  const candidates = args.candidates ?? (parsed ? deriveDisputeCandidates(parsed, args.report.id) : []);
  return sendAnalysisReportDeliveryEmail({
    partner: args.partner,
    parsed,
    candidates,
    reportsUrl: analysisVaultUrl(),
  });
}
