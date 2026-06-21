import type { Partner } from '../domain/partners';

export type LegacyNoteEntry = { message: string; createdAt?: string };

function splitLegacyNotes(notesText: string): string[] {
  const chunks = notesText
    .split(/\n\n---\n\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return chunks.length ? chunks : [notesText.trim()].filter(Boolean);
}

/** Pull structured legacy notes from partner record (ZIP/SQL import + journeySignals). */
export function legacyNoteEntriesForPartner(partner: Pick<Partner, 'notes' | 'journeySignals'> | null | undefined): LegacyNoteEntry[] {
  if (!partner) return [];

  const signals = (partner.journeySignals ?? {}) as Record<string, unknown>;
  const fromSignals = signals.legacyNoteEntries;
  if (Array.isArray(fromSignals) && fromSignals.length) {
    return fromSignals
      .map((n: any) => ({
        message: String(n?.message ?? '').trim(),
        createdAt: n?.createdAt ? String(n.createdAt) : undefined,
      }))
      .filter((n) => n.message);
  }

  const notesText = String(partner.notes ?? '').trim();
  if (!notesText) return [];

  return splitLegacyNotes(notesText).map((message) => ({ message }));
}

export function legacyNotesExternalId(partner: Pick<Partner, 'id' | 'importExternalId'>): string {
  return String(partner.importExternalId || partner.id).trim();
}
