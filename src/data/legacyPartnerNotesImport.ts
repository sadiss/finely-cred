import { listPartnerNotesByPartner, upsertPartnerNote } from './partnerNotesRepo';
import { nowIso } from '../domain/partnerNotes';

const LEGACY_NOTE_PREFIX = 'legacy-notes:';

export function legacyPartnerNoteId(externalId: string) {
  return `${LEGACY_NOTE_PREFIX}${externalId}`;
}

/** Import apmessage / legacy notes into the manual notes timeline (idempotent). */
export function seedLegacyPartnerNotes(args: {
  partnerId: string;
  notesText: string;
  externalId: string;
}): boolean {
  const body = String(args.notesText || '').trim();
  if (!body) return false;

  const noteId = legacyPartnerNoteId(args.externalId);
  const existing = listPartnerNotesByPartner(args.partnerId);
  if (existing.some((n) => n.id === noteId || n.title?.includes('previous Finely Cred site'))) {
    return false;
  }

  const now = nowIso();
  upsertPartnerNote({
    id: noteId,
    partnerId: args.partnerId,
    kind: 'manual',
    authorType: 'system',
    visibility: 'internal',
    title: 'Imported from previous Finely Cred site',
    body,
    pinned: true,
    createdAt: now,
    updatedAt: now,
  });

  return true;
}
