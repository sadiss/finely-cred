import { isSupabaseConfigured, supabase } from './supabaseClient';
import { newId } from '../utils/ids';

export type AcademyOutboxRow = {
  id: string;
  event: string;
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  dedupeKey?: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  error?: string;
};

/** Mirror send attempt to server outbox when admin is authenticated; never blocks sendEmail. */
export async function mirrorAcademyTraineeOutbox(row: AcademyOutboxRow): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.functions.invoke('academy-trainee-outbox', {
      body: {
        action: 'enqueue',
        id: row.id,
        event: row.event,
        toEmail: row.toEmail,
        toName: row.toName,
        subject: row.subject,
        body: row.body,
        dedupeKey: row.dedupeKey,
        status: row.status,
        error: row.error,
        meta: { client: 'academyTraineeEmailPipeline' },
      },
    });
  } catch {
    /* interim: localStorage outbox remains */
  }
}

export function newAcademyOutboxId() {
  return newId('ato');
}
