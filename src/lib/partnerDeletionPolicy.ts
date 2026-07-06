import type { Partner } from '../domain/partners';
import { listLettersByPartner } from '../data/lettersRepo';
import { listReportsByPartner } from '../data/reportsRepo';

export type PartnerDeletionTier = 'admin_approval_required' | 'self_service_with_confirm' | 'blocked';

export function partnerSensitiveArtifactCounts(partnerId: string) {
  const reports = listReportsByPartner(partnerId);
  const letters = listLettersByPartner(partnerId);
  const parsedReports = reports.filter((r) => Boolean(r.parsed?.tradelines?.length)).length;
  return {
    reports: reports.length,
    parsedReports,
    letters: letters.length,
  };
}

/** Classify how partner deletion may proceed. */
export function partnerDeletionTier(partner: Partner): PartnerDeletionTier {
  const counts = partnerSensitiveArtifactCounts(partner.id);
  const hasArtifacts = counts.reports > 0 || counts.letters > 0;
  const journeyStarted =
    Boolean(partner.claimedUserId) ||
    partner.status === 'active' ||
    Boolean(partner.journeyStage && partner.journeyStage !== 'intake');

  if (hasArtifacts || journeyStarted) return 'admin_approval_required';

  const isLeadMagnetOnly = partner.status === 'lead' && !partner.claimedUserId && !hasArtifacts;

  if (isLeadMagnetOnly) return 'self_service_with_confirm';
  return 'admin_approval_required';
}

export function partnerDeletionSummary(partner: Partner): string {
  const tier = partnerDeletionTier(partner);
  const counts = partnerSensitiveArtifactCounts(partner.id);
  if (tier === 'admin_approval_required') {
    return `This file has ${counts.reports} report(s), ${counts.letters} letter(s), and active journey data. Finely Cred staff must review and enter the security code before deletion.`;
  }
  if (tier === 'self_service_with_confirm') {
    return 'Lead-only profile with no uploaded reports or letters. You may request deletion with email confirmation.';
  }
  return 'Deletion is restricted. Contact support@finelycred.com.';
}
