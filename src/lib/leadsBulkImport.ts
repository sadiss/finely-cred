import type { LeadCapture } from '../domain/leads';
import { submitLeadCapture } from '../data/leadsRepo';
import type { BulkLeadRow } from './leadsCsv';

export type { BulkLeadRow, ParseLeadsCsvOptions } from './leadsCsv';
export { parseLeadsCsv } from './leadsCsv';

export type BulkImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
  leadIds: string[];
};

export type BulkImportMode = 'full_pipeline' | 'crm_only';

const SAMPLE_CSV = `full_name,email,phone,interest,source,consent_to_contact
Jordan Lee,jordan@example.com,5551234567,credit restore,agent,true
Alex Kim,alex@example.com,,business funding,agent,true`;

const HAITIAN_SAMPLE_CSV = `First name,Last name,Phone number,Email,Area code,State guess
Marie,Example,3055550100,marie.example@example.com,305,FL
Jean,Example,9545550199,,954,FL`;

export function bulkImportSampleCsv() {
  return SAMPLE_CSV;
}

export function haitianColdImportSampleCsv() {
  return HAITIAN_SAMPLE_CSV;
}

export async function bulkImportLeads(rows: BulkLeadRow[]): Promise<BulkImportResult> {
  const result: BulkImportResult = { imported: 0, skipped: 0, failed: 0, errors: [], leadIds: [] };
  const seen = new Set<string>();

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (seen.has(email)) {
      result.skipped += 1;
      continue;
    }
    seen.add(email);

    try {
      const res = await submitLeadCapture({
        fullName: row.fullName.trim(),
        email: row.email.trim(),
        phone: row.phone?.trim() ?? '',
        interest: row.interest?.trim() || 'bulk_import',
        offer: row.offer ?? 'general_inquiry',
        source: row.source ?? 'agent',
        consentToContact: row.consentToContact ?? true,
        consentEmailMarketing: row.consentEmailMarketing ?? false,
        funnelPath: row.funnelPath ?? '/admin/leads-os?tab=inbound',
        utmSource: row.utmSource ?? 'bulk_csv',
        utmMedium: row.utmMedium ?? 'import',
        utmCampaign: row.utmCampaign ?? 'leads_os',
      });
      result.leadIds.push(res.lead.id);
      result.imported += 1;
    } catch (e: unknown) {
      result.failed += 1;
      result.errors.push(`${row.email}: ${(e as Error)?.message ?? 'import failed'}`);
    }
  }

  return result;
}

export function leadsToCsv(leads: LeadCapture[]): string {
  const header = 'full_name,email,phone,interest,source,offer,created_at';
  const lines = leads.map((l) =>
    [l.fullName, l.email, l.phone, l.interest ?? '', l.source, l.offer, l.createdAt]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header, ...lines].join('\n');
}
