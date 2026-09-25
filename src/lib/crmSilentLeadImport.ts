import { getCrmRecord } from '../data/crmRecordsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import { upsertLeadCaptureSilent } from '../data/leadsRepo';
import { syncCrmRecordToSupabase } from '../data/crmServerSync';
import type { BulkImportResult } from './leadsBulkImport';
import {
  HAITIAN_COLD_IMPORT,
  coldImportTags,
  interestForImportedRow,
  type ColdImportPreset,
  type PreparedImportRow,
} from './crmSilentLeadImportCore';

export * from './crmSilentLeadImportCore';

export type SilentImportResult = BulkImportResult & {
  updated: number;
  emailsSent: 0;
  sequencesEnrolled: 0;
};

/**
 * Writes inbound CRM leads without running the capture pipeline.
 * Safe to re-run: email then phone identity match updates tags/lists only.
 */
export async function importCrmOnlyLeads(
  rows: PreparedImportRow[],
  preset: ColdImportPreset = HAITIAN_COLD_IMPORT,
): Promise<SilentImportResult> {
  const result: SilentImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    leadIds: [],
    emailsSent: 0,
    sequencesEnrolled: 0,
  };
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.dedupeKey)) {
      result.skipped += 1;
      continue;
    }
    seen.add(row.dedupeKey);

    try {
      const tags = coldImportTags({ listNames: row.lists });
      const res = await upsertLeadCaptureSilent({
        id: `lead_hc_${row.dedupeKey.replace(/[^a-z0-9]/g, '_').slice(0, 40)}`,
        source: preset.source,
        offer: preset.offer,
        interest: row.interest?.trim() || interestForImportedRow(row),
        fullName: row.fullName.trim(),
        email: row.email.trim(),
        phone: row.phone?.trim() ?? '',
        consentToContact: false,
        consentEmailMarketing: false,
        consentSmsMarketing: false,
        funnelPath: preset.funnelPath,
        funnelId: preset.funnelId,
        utmSource: preset.utmSource,
        utmMedium: preset.utmMedium,
        utmCampaign: preset.utmCampaign,
      });

      addLeadTags(res.lead.id, tags);
      if (res.created !== false) {
        addLeadNote(
          res.lead.id,
          `Cold CRM import — no email sent. Funnel match later via ${preset.funnelPath} / seq_kreyol_funnel opt-in.`,
        );
      }

      const record = getCrmRecord(`crm_lead_${res.lead.id}`);
      void syncCrmRecordToSupabase(record);

      result.leadIds.push(res.lead.id);
      if (res.created === false) result.updated += 1;
      else result.imported += 1;
    } catch (e: unknown) {
      result.failed += 1;
      result.errors.push(`${row.email || row.phone}: ${(e as Error)?.message ?? 'import failed'}`);
    }
  }

  return result;
}
