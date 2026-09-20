import { toCsv } from '../../utils/tabularExport.ts';
import { BATCH_CSV_COLUMNS, type PartnerProspect } from './types.ts';

export function prospectToCsvRow(p: PartnerProspect): Array<string> {
  return [
    p.businessName,
    p.personName,
    p.title,
    p.city,
    p.category,
    p.website,
    p.phone,
    p.email,
    p.icpFit,
    p.whyFit,
    p.sourceUrls.join(' | '),
    p.status,
  ];
}

export function prospectsToCsv(prospects: PartnerProspect[]): string {
  return toCsv({
    columns: [...BATCH_CSV_COLUMNS],
    rows: prospects.map(prospectToCsvRow),
  });
}

export function csvFilename(batchId: string, at = new Date()): string {
  const y = at.getUTCFullYear();
  const m = String(at.getUTCMonth() + 1).padStart(2, '0');
  const d = String(at.getUTCDate()).padStart(2, '0');
  return `partner-prospector-${batchId}-${y}${m}${d}.csv`;
}
