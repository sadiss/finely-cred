import type { PartnerOutreachFilters, PartnerOutreachRecord } from '../domain/partnerOutreachLibrary';
import { matchesPartnerOutreachFilters, uniqueSorted } from '../domain/partnerOutreachLibrary';
import master from './partnerOutreachLibrary.master.json';

const RECORDS = master as PartnerOutreachRecord[];

export function listPartnerOutreachLibrary(filters: PartnerOutreachFilters = {}): PartnerOutreachRecord[] {
  return RECORDS.filter((row) => matchesPartnerOutreachFilters(row, filters));
}

export function partnerOutreachLibraryStats(rows: PartnerOutreachRecord[] = RECORDS) {
  return {
    total: rows.length,
    haitian: rows.filter((r) => r.corridor === 'haitian').length,
    general: rows.filter((r) => r.corridor === 'general').length,
    contactReady: rows.filter((r) => r.hasPhoneAndEmail).length,
    outreachHold: rows.filter((r) => (r.outreachStatus || '').toUpperCase().includes('HOLD')).length,
  };
}

export function partnerOutreachLibraryFacets(rows: PartnerOutreachRecord[] = RECORDS) {
  return {
    metros: uniqueSorted(rows.map((r) => r.metro)),
    categories: uniqueSorted(rows.map((r) => r.category)),
  };
}

export function partnerOutreachLibraryMasterCount(): number {
  return RECORDS.length;
}
