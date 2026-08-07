/**
 * PartnerNotes from letter Save / Mail — both credit and debt studios share this stream.
 */

import { createPartnerNote } from '../data/partnerNotesRepo';
import type { NoteAuthorType, PartnerNote } from '../domain/partnerNotes';

export type LetterPartnerNoteSource = 'letter_save' | 'letter_mail';

export function recordLetterPartnerNote(args: {
  partnerId: string;
  body: string;
  title?: string;
  letterId?: string;
  debtCaseId?: string;
  source: LetterPartnerNoteSource;
  /** Specialist / admin acting on behalf of partner → authorType admin; else partner */
  authorType?: NoteAuthorType;
  authorEmail?: string;
  visibility?: 'internal' | 'partner';
}): PartnerNote | null {
  const body = String(args.body || '').trim();
  if (!body) return null;

  const metaBits = [
    args.source === 'letter_mail' ? 'Mail logged' : 'Letter saved',
    args.letterId ? `letter:${args.letterId}` : null,
    args.debtCaseId ? `debt:${args.debtCaseId}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return createPartnerNote({
    partnerId: args.partnerId,
    kind: 'manual',
    authorType: args.authorType ?? 'partner',
    authorEmail: args.authorEmail,
    visibility: args.visibility ?? 'partner',
    title: args.title?.trim() || (args.source === 'letter_mail' ? 'Letter mailed' : 'Letter saved'),
    body: metaBits ? `${body}\n\n— ${metaBits}` : body,
    meta: {
      letterId: args.letterId,
      debtCaseId: args.debtCaseId,
      source: args.source,
    },
  });
}
