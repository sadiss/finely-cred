import { listPartnerNotesByPartner, upsertPartnerNote, deletePartnerNote } from './partnerNotesRepo';
import { nowIso } from '../domain/partnerNotes';
import type { LegacyPartnerExportV1 } from '../domain/imports';

const LEGACY_NOTE_PREFIX = 'legacy-notes:';

export function legacyPartnerNoteId(externalId: string, index = 0) {
  return index === 0 ? `${LEGACY_NOTE_PREFIX}${externalId}` : `${LEGACY_NOTE_PREFIX}${externalId}:${index}`;
}

function splitLegacyNotes(notesText: string): string[] {
  const chunks = notesText
    .split(/\n\n---\n\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return chunks.length ? chunks : [notesText.trim()].filter(Boolean);
}

/** Import apmessage / legacy notes into the manual notes timeline (idempotent + refreshable). */
export function seedLegacyPartnerNotes(args: {
  partnerId: string;
  notesText?: string;
  noteEntries?: LegacyPartnerExportV1['partners'][0]['legacyNoteEntries'];
  externalId: string;
  forceRefresh?: boolean;
}): number {
  const entries = (args.noteEntries ?? [])
    .map((n) => ({ message: String(n.message || '').trim(), createdAt: n.createdAt }))
    .filter((n) => n.message);

  const fallback = args.notesText ? splitLegacyNotes(String(args.notesText)) : [];
  const messages =
    entries.length > 0
      ? entries
      : fallback.map((message) => ({ message, createdAt: undefined as string | undefined }));

  if (!messages.length) return 0;

  const existing = listPartnerNotesByPartner(args.partnerId);
  const legacyExisting = existing.filter(
    (n) => n.id.startsWith(LEGACY_NOTE_PREFIX) || n.title?.includes('previous Finely Cred site'),
  );

  if (args.forceRefresh && legacyExisting.length) {
    for (const n of legacyExisting) deletePartnerNote(n.id);
  }

  let created = 0;
  messages.forEach((entry, index) => {
    const noteId = legacyPartnerNoteId(args.externalId, index);
    const already = listPartnerNotesByPartner(args.partnerId).find((n) => n.id === noteId);
    if (already && !args.forceRefresh) return;

    const stamp = entry.createdAt || nowIso();
    upsertPartnerNote({
      id: noteId,
      partnerId: args.partnerId,
      kind: 'manual',
      authorType: 'system',
      visibility: 'internal',
      title:
        messages.length === 1
          ? 'Imported from previous Finely Cred site'
          : `Legacy staff note ${index + 1} of ${messages.length}`,
      body: entry.message,
      pinned: index === 0,
      createdAt: stamp,
      updatedAt: nowIso(),
    });
    created += 1;
  });

  return created;
}
