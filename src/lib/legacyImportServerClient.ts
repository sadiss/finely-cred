import type { LegacyPartnerExportV1 } from '../domain/imports';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type LegacyServerImportSummary = {
  partnersUpserted: number;
  reportsUpserted: number;
  evidenceUpserted: number;
  lettersUpserted: number;
  errors: Array<{ externalId?: string; message: string }>;
};

/** Push full legacy export to Supabase via admin edge function (service role). */
export async function pushLegacyExportToServer(exportData: LegacyPartnerExportV1): Promise<LegacyServerImportSummary> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured — cannot sync legacy data to the server.');
  }
  const { data, error } = await supabase.functions.invoke('admin-import-legacy', {
    body: { export: exportData },
  });
  if (error) throw new Error(error.message || 'Server legacy import failed.');
  const summary = (data as any)?.summary as LegacyServerImportSummary | undefined;
  if (!summary) throw new Error('Server legacy import returned an unexpected response.');
  return summary;
}
