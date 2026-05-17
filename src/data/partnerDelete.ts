import { deletePartner as deletePartnerLocal } from './partnersRepo';
import { listPartnerNotesByPartner, deletePartnerNote } from './partnerNotesRepo';
import { listReportsByPartner, deleteReport } from './reportsRepo';
import { listLettersByPartner, deleteLetter } from './lettersRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

/**
 * Completely delete a partner and all related data
 */
export async function deletePartnerCompletely(partnerId: string): Promise<{ ok: boolean; error?: string }> {
  if (!partnerId?.trim()) {
    return { ok: false, error: 'Invalid partner ID' };
  }

  try {
    // Delete from local store
    const deleted = deletePartnerLocal(partnerId);
    if (!deleted) {
      return { ok: false, error: 'Partner not found' };
    }

    // Delete all related data locally
    try {
      const partnerNotes = listPartnerNotesByPartner(partnerId);
      partnerNotes.forEach((note) => deletePartnerNote(note.id));

      const reports = listReportsByPartner(partnerId);
      reports.forEach((report) => deleteReport(report.id));

      const letters = listLettersByPartner(partnerId);
      letters.forEach((letter) => deleteLetter({ letterId: letter.id }));
    } catch (e) {
      console.warn('Partial cleanup of local data:', e);
    }

    // Delete from Supabase asynchronously
    if (isSupabaseConfigured) {
      queueMicrotask(() => {
        Promise.resolve(supabase.from('partners').delete().eq('id', partnerId))
          .then(() => {
            // Success - deletion synced to Supabase
          })
          .catch((e: any) => {
            console.error('Error syncing deletion to Supabase:', e);
          });
      });
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error during deletion' };
  }
}
