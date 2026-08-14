import type { LetterRecord, LetterStatus } from '../domain/letters';

/** Work-in-progress letter — not finalized, no partner email. */
export const LETTER_DRAFT_STATUS: LetterStatus = 'draft';

/** Finalized letter — ready to mail / track in vault. */
export const LETTER_FINAL_STATUS: LetterStatus = 'generated';

export function letterStatusOf(letter: Pick<LetterRecord, 'status'>): LetterStatus {
  return letter.status ?? LETTER_FINAL_STATUS;
}

export function isLetterDraft(letter: Pick<LetterRecord, 'status'>): boolean {
  return letterStatusOf(letter) === LETTER_DRAFT_STATUS;
}

export function isLetterFinal(letter: Pick<LetterRecord, 'status'>): boolean {
  return !isLetterDraft(letter);
}

export function letterDraftBadgeLabel(letter: Pick<LetterRecord, 'status' | 'pdfBlobRef'>): 'DRAFT' | 'FINAL' {
  return isLetterDraft(letter) ? 'DRAFT' : 'FINAL';
}

/** Partner-facing confirm before promoting draft → final (triggers optional email). */
export function confirmMarkLetterFinal(args: { title: string; withPdf?: boolean }): boolean {
  const action = args.withPdf ? 'save the PDF and mark this letter as final' : 'mark this letter as final';
  return window.confirm(
    `Mark "${args.title}" as final and ready to send?\n\nThis ${action}. ${
      args.withPdf ? 'The letter moves out of Drafts into your main vault.' : 'Partners can be notified by email if that option is on.'
    }\n\nDraft letters stay editable until you mark them final.`,
  );
}

/** Close draft editor: save as draft, discard, or keep editing. */
export function confirmCloseLetterDraft(args: { hasUnsavedEdits: boolean; hasVaultDraft: boolean }):
  | 'save_draft'
  | 'discard'
  | 'cancel' {
  if (!args.hasUnsavedEdits) return 'discard';

  const save = window.confirm(
    'You have unsaved edits.\n\nOK — Save as draft in Letters Vault\nCancel — choose discard or keep editing',
  );
  if (save) return 'save_draft';

  const discard = window.confirm(
    args.hasVaultDraft
      ? 'Discard unsaved edits and close? Your last saved draft text stays in the vault.'
      : 'Discard this letter and close without saving to the vault?',
  );
  return discard ? 'discard' : 'cancel';
}
