import { deletePartner } from './partnersRepo';
import { listPartnerNotesByPartner, deletePartnerNote } from './partnerNotesRepo';
import { listReportsByPartner, deleteReport } from './reportsRepo';
import { listLettersByPartner, deleteLetter } from './lettersRepo';

/**
 * Completely delete a partner and all related data
 */
export async function deletePartnerCompletely(partnerId: string): Promise<{ ok: boolean; error?: string }> {
  if (!partnerId?.trim()) {
    return { ok: false, error: 'Invalid partner ID' };
  }

  try {
    const deleted = await deletePartner(partnerId);
    if (!deleted) {
      return { ok: false, error: 'Partner not found or could not be deleted' };
    }

    // Best-effort cleanup of related local data
    try {
      const partnerNotes = listPartnerNotesByPartner(partnerId);
      partnerNotes.forEach((note) => deletePartnerNote(note.id));

      const reports = listReportsByPartner(partnerId);
      reports.forEach((report) => deleteReport(report.id));

      const letters = listLettersByPartner(partnerId);
      letters.forEach((letter) => deleteLetter({ letterId: letter.id }));
    } catch (e) {
      console.warn('Partial cleanup of related data:', e);
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error during deletion' };
  }
}
