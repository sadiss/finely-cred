import type { DisputeLetterMeta, LetterRecord } from '../domain/letters';
import { computeBureauFollowUpAlert } from './bureauFollowUpAlert';

export type CreditRestorePrimaryAlert = {
  show: boolean;
  tone: 'info' | 'warning' | 'success' | 'blocking';
  message: string;
  ctaLabel?: string;
  ctaPath?: string;
};

function isDisputeMeta(meta: LetterRecord['meta']): meta is DisputeLetterMeta {
  return Boolean(meta && 'candidateIds' in meta && Array.isArray(meta.candidateIds));
}

function lettersMissingReasons(letters: LetterRecord[]): boolean {
  return letters.some((l) => {
    if (l.archivedAt) return false;
    const meta = l.meta;
    if (!isDisputeMeta(meta)) return false;
    const reasons = meta.reasonsByCandidateId ?? {};
    return meta.candidateIds.some((id: string) => !(reasons[id]?.filter(Boolean).length ?? 0));
  });
}

function lettersReadyToMail(letters: LetterRecord[]): LetterRecord[] {
  return letters.filter((l) => !l.archivedAt && (l.status === 'generated' || l.status === 'mail_pending'));
}

/** Single highest-priority restore alert for portal dashboard (report → reasons → mail → bureau SLA). */
export function computeCreditRestorePrimaryAlert(args: {
  reportsCount: number;
  hasParsedReport: boolean;
  letters: LetterRecord[];
}): CreditRestorePrimaryAlert {
  const { reportsCount, hasParsedReport, letters } = args;

  if (reportsCount === 0) {
    return {
      show: true,
      tone: 'blocking',
      message: 'Upload your first credit report — restoration cannot start until we have a bureau file to analyze.',
      ctaLabel: 'Upload report',
      ctaPath: '/portal/reports',
    };
  }

  const bureau = computeBureauFollowUpAlert(letters);
  if (bureau.show && bureau.tone === 'blocking') {
    return {
      show: true,
      tone: 'blocking',
      message: bureau.message,
      ctaLabel: 'Open letters vault',
      ctaPath: '/portal/letters',
    };
  }

  const ready = lettersReadyToMail(letters);
  if (ready.length > 0) {
    const n = ready.length;
    return {
      show: true,
      tone: 'success',
      message:
        n === 1
          ? `"${ready[0].title}" is ready to mail — print, sign, and send with your evidence packet.`
          : `${n} dispute letters are ready to mail — open Letter Studio to review and send.`,
      ctaLabel: 'Review letters',
      ctaPath: '/portal/letters',
    };
  }

  if (hasParsedReport && lettersMissingReasons(letters)) {
    return {
      show: true,
      tone: 'warning',
      message: 'One or more draft letters are missing factual dispute reasons — add screenshot-backed findings before mailing.',
      ctaLabel: 'Open dispute center',
      ctaPath: '/portal/disputes',
    };
  }

  if (hasParsedReport && letters.length === 0) {
    return {
      show: true,
      tone: 'warning',
      message: 'Report analyzed — open Dispute Center to select negatives and build your first letter.',
      ctaLabel: 'Start disputes',
      ctaPath: '/portal/disputes',
    };
  }

  if (bureau.show) {
    return {
      show: true,
      tone: bureau.tone === 'warning' ? 'warning' : 'info',
      message: bureau.message,
      ctaLabel: 'View letters',
      ctaPath: '/portal/letters',
    };
  }

  return { show: false, tone: 'info', message: '' };
}
