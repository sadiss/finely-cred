import type { LetterRecord } from '../domain/letters';
import { isLetterDraft, letterDraftBadgeLabel } from './letterDraftLifecycle';
import { isLetterPhysicallyMailed } from './letterMailState';

export type LetterVaultStatusTone = 'draft' | 'ready' | 'mailed' | 'blocked';

/** One plain-English status line for vault cards — avoids duplicate FINAL / PDF / mailed chips. */
export function letterVaultPrimaryStatus(letter: LetterRecord): {
  label: string;
  detail?: string;
  tone: LetterVaultStatusTone;
} {
  const hasPdf = Boolean(letter.pdfBlobRef);
  const draft = isLetterDraft(letter);
  const mailed = isLetterPhysicallyMailed(letter);
  const mailRef = (letter.mailing?.providerId || '').trim();
  const status = String(letter.status || 'generated').toLowerCase();

  if (mailed) {
    return {
      label: 'Certified mail sent',
      detail: mailRef ? `Tracking ref ${mailRef.slice(0, 14)}` : 'Mailed — remail blocked',
      tone: 'mailed',
    };
  }
  if (status === 'mail_pending') {
    return {
      label: 'Mail in progress',
      detail: 'Wait for the current send to finish',
      tone: 'blocked',
    };
  }
  if (status === 'mail_failed') {
    return {
      label: 'Mail failed',
      detail: 'Open the letter to retry or contact support',
      tone: 'blocked',
    };
  }
  if (draft) {
    return {
      label: 'Draft — editable',
      detail: hasPdf ? 'PDF attached · not marked final' : 'Text saved · add PDF when ready',
      tone: 'draft',
    };
  }
  return {
    label: hasPdf ? 'Final · PDF ready to mail' : 'Final · text only',
    detail: hasPdf ? 'Download or mail from this card' : 'Save PDF before mailing',
    tone: 'ready',
  };
}

export function letterVaultDraftChip(letter: LetterRecord): string {
  return letterDraftBadgeLabel(letter);
}
