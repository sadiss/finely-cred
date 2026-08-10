import type { DisputeLetterMeta, LetterRecord } from '../domain/letters';
import type { DebtCase } from '../domain/debt';
import { computeBureauFollowUpAlert } from './bureauFollowUpAlert';
import {
  getValidationAccountState,
  isValidationWaitActive,
  listValidationAccountStatesByPartner,
  validationWaitDaysElapsed,
} from './validationAccountState';

export type CreditRestorePrimaryAlert = {
  show: boolean;
  tone: 'info' | 'warning' | 'success' | 'blocking';
  message: string;
  ctaLabel?: string;
  ctaPath?: string;
  /** Always-available secondary path — bureau is never hard-locked */
  secondaryCtaLabel?: string;
  secondaryCtaPath?: string;
  /** Progress rail counts for HUD */
  rail?: {
    waiting: number;
    ready: number;
    court: number;
  };
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

function debtIdFromLetter(l: LetterRecord): string | undefined {
  const meta = l.meta as { debtId?: string; context?: string } | undefined;
  if (meta && 'debtId' in meta && meta.debtId) return meta.debtId;
  return undefined;
}

function buildRail(args: {
  partnerId?: string;
  debtCases: DebtCase[];
  letters: LetterRecord[];
}): CreditRestorePrimaryAlert['rail'] {
  const court = args.debtCases.filter((d) => d.type === 'summons' && d.status !== 'resolved').length;
  const states = args.partnerId ? listValidationAccountStatesByPartner(args.partnerId) : [];
  const waiting = states.filter((s) => isValidationWaitActive(s)).length;
  const ready = lettersReadyToMail(args.letters).length;
  return { waiting, ready, court };
}

/**
 * Guided restore ranking (never locked):
 * court/summons → validation unmailed → operational wait (after mail logged) → bureau ready.
 * Secondary “Bureau letter now (optional)” is always present when primary is debt-path.
 */
export function computeCreditRestorePrimaryAlert(args: {
  reportsCount: number;
  hasParsedReport: boolean;
  letters: LetterRecord[];
  debtCases?: DebtCase[];
  partnerId?: string;
}): CreditRestorePrimaryAlert {
  const { reportsCount, hasParsedReport, letters } = args;
  const debtCases = args.debtCases ?? [];
  const rail = buildRail({ partnerId: args.partnerId, debtCases, letters });
  const bureauSecondary = {
    secondaryCtaLabel: 'Bureau letter now (optional)',
    secondaryCtaPath: '/portal/letters',
  };

  if (reportsCount === 0 && debtCases.length === 0) {
    return {
      show: true,
      tone: 'blocking',
      message: 'Upload your first credit report — or add a debt/summons case — to start the guided restore path.',
      ctaLabel: 'Upload report',
      ctaPath: '/portal/reports',
      ...bureauSecondary,
      rail,
    };
  }

  const openSummons = debtCases.filter((d) => d.type === 'summons' && d.status !== 'resolved');
  if (openSummons.length > 0) {
    const first = openSummons[0]!;
    return {
      show: true,
      tone: 'blocking',
      message: `Summons primary: answer the court for "${first.name}" first. Validation is still suggested; bureau letters stay optional.`,
      ctaLabel: 'Open court / debt case',
      ctaPath: `/portal/debt/${first.id}`,
      ...bureauSecondary,
      rail,
    };
  }

  const openDebts = debtCases.filter((d) => d.type === 'debt' && d.status !== 'resolved');
  const validationLetters = letters.filter(
    (l) => !l.archivedAt && (l.type === 'validation' || (l.meta as { debtTrack?: string } | undefined)?.debtTrack === 'validation'),
  );
  const unmailedValidation = validationLetters.filter(
    (l) => l.status === 'generated' || l.status === 'mail_pending',
  );
  const debtsNeedingValidation = openDebts.filter((d) => {
    const st = getValidationAccountState(d.id);
    if (st?.mailedAt) return false;
    const hasMailedLetter = validationLetters.some(
      (l) => debtIdFromLetter(l) === d.id && (l.status === 'mailed' || l.status === 'waiting_response' || l.status === 'completed'),
    );
    return !hasMailedLetter;
  });

  if (debtsNeedingValidation.length > 0 || unmailedValidation.length > 0) {
    const focus = debtsNeedingValidation[0];
    return {
      show: true,
      tone: 'warning',
      message:
        unmailedValidation.length > 0
          ? `${unmailedValidation.length} validation letter(s) ready — mail them to start the wait clock. After mailing, collectors must cease collection including suit until properly validated (not a promise they never sue; outcomes never guaranteed).`
          : `Suggested next: send validation for "${focus?.name ?? 'open debt'}". Bureau letters stay optional anytime — never locked.`,
      ctaLabel: unmailedValidation.length > 0 ? 'Mail validation' : 'Open Debt Letters',
      ctaPath: focus ? `/portal/debt/${focus.id}` : '/portal/debt',
      ...bureauSecondary,
      rail,
    };
  }

  const waitingStates = args.partnerId
    ? listValidationAccountStatesByPartner(args.partnerId).filter((s) => isValidationWaitActive(s))
    : [];
  if (waitingStates.length > 0) {
    const days = validationWaitDaysElapsed(waitingStates[0]) ?? 0;
    return {
      show: true,
      tone: 'info',
      message: `Operational wait: ${waitingStates.length} validation letter(s) mailed (${days}d logged). Hold bureau pressure on those accounts unless you choose the optional bureau path.`,
      ctaLabel: 'Track debt cases',
      ctaPath: '/portal/debt',
      ...bureauSecondary,
      rail,
    };
  }

  const bureau = computeBureauFollowUpAlert(letters);
  if (bureau.show && bureau.tone === 'blocking') {
    return {
      show: true,
      tone: 'blocking',
      message: bureau.message,
      ctaLabel: 'Open letters vault',
      ctaPath: '/portal/letters/vault',
      ...bureauSecondary,
      rail,
    };
  }

  const ready = lettersReadyToMail(letters.filter((l) => l.type === 'dispute'));
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
      secondaryCtaLabel: 'Open Debt Letters',
      secondaryCtaPath: '/portal/debt',
      rail,
    };
  }

  if (hasParsedReport && lettersMissingReasons(letters)) {
    return {
      show: true,
      tone: 'warning',
      message: 'One or more draft letters are missing factual dispute reasons — add screenshot-backed findings before mailing.',
      ctaLabel: 'Open dispute center',
      ctaPath: '/portal/disputes',
      ...bureauSecondary,
      rail,
    };
  }

  if (hasParsedReport && letters.filter((l) => l.type === 'dispute').length === 0) {
    return {
      show: true,
      tone: 'warning',
      message: 'Bureau path ready — open Dispute Center to select negatives and build your first letter (optional if you are still on validation wait).',
      ctaLabel: 'Start disputes',
      ctaPath: '/portal/disputes',
      secondaryCtaLabel: 'Open Debt Letters',
      secondaryCtaPath: '/portal/debt',
      rail,
    };
  }

  if (bureau.show) {
    return {
      show: true,
      tone: bureau.tone === 'warning' ? 'warning' : 'info',
      message: bureau.message,
      ctaLabel: 'View letters',
      ctaPath: '/portal/letters',
      ...bureauSecondary,
      rail,
    };
  }

  return {
    show: false,
    tone: 'info',
    message: '',
    ...bureauSecondary,
    rail,
  };
}
