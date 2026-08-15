import type { LetterRecord } from '../domain/letters';

/** Letter was physically submitted to the mail provider — do not remail. */
export function isLetterPhysicallyMailed(letter: Pick<LetterRecord, 'status' | 'mailing'>): boolean {
  if (letter.status === 'mailed') return true;
  const pid = (letter.mailing?.providerId || '').trim();
  const st = String(letter.mailing?.status || '').toLowerCase();
  if (pid && (st === 'mailed' || st === 'submitted' || st === 'released')) return true;
  return false;
}

export function isLetterMailInFlight(letter: Pick<LetterRecord, 'status'>): boolean {
  return letter.status === 'mail_pending';
}

export function canOpenMailModal(letter: Pick<LetterRecord, 'status' | 'mailing' | 'pdfBlobRef'>): {
  ok: boolean;
  reason?: string;
} {
  if (!letter.pdfBlobRef) return { ok: false, reason: 'Generate and save a PDF before mailing.' };
  if (isLetterPhysicallyMailed(letter)) {
    return {
      ok: false,
      reason: `Already mailed${letter.mailing?.providerId ? ` (ref ${letter.mailing.providerId})` : ''}. Duplicate sends are blocked.`,
    };
  }
  if (isLetterMailInFlight(letter)) {
    return { ok: false, reason: 'Mail in progress — wait for the current send to finish.' };
  }
  return { ok: true };
}

/** LetterStream codes that mean the letter was released — not a preauth quote (-200). */
export function isLetterStreamReleaseCode(code?: number | null): boolean {
  if (code == null || !Number.isFinite(code)) return false;
  return [-100, -103, -104, -110, -150, -199].includes(code);
}

/** Provider response counts as a real release — not a preauth quote. */
export function isMailReleaseStatus(status?: string | null): boolean {
  const s = String(status || '').toLowerCase();
  return s === 'submitted' || s === 'released' || s === 'mailed';
}

export function mailProviderRef(args: {
  providerId?: string | null;
  job?: string | null;
  batch?: string | null;
}): string {
  return (args.providerId || args.job || args.batch || '').trim();
}

export function assertMailSendReleased(args: {
  providerId?: string | null;
  job?: string | null;
  batch?: string | null;
  status?: string | null;
  code?: number | null;
  preauth?: boolean;
  deduped?: boolean;
  reconciled?: boolean;
}): { providerId: string; releaseStatus: string } {
  if (args.preauth || args.code === -200) {
    throw new Error('Mail provider returned a price quote only — letter was not released. Try Send again.');
  }
  if (
    !args.deduped &&
    !args.reconciled &&
    args.code != null &&
    Number.isFinite(args.code) &&
    args.code < 0 &&
    !isLetterStreamReleaseCode(args.code)
  ) {
    throw new Error(
      `Mail provider did not confirm release (code ${args.code}). Do not resend; check mail status or contact admin.`,
    );
  }
  const ref = mailProviderRef(args);
  if (!ref) {
    throw new Error('Mail provider did not return a job reference — letter status unknown. Do not resend; check LetterStream or contact admin.');
  }
  const releaseStatus =
    args.status && isMailReleaseStatus(args.status)
      ? args.status
      : args.deduped
        ? 'submitted'
        : 'submitted';
  return { providerId: ref, releaseStatus };
}
