import type { LeadCapture, LeadOffer, LeadSource } from '../domain/leads';
import { parseLeadsCsv, type BulkLeadRow } from './leadsCsv';

export const HAITIAN_COLD_IMPORT = {
  source: 'csv_import' as LeadSource,
  offer: 'haitian_credit_kit' as LeadOffer,
  utmSource: 'haitian_csv_import',
  utmMedium: 'crm_import',
  utmCampaign: 'haitian_community_cold',
  audience: 'haitian_community',
  temperature: 'cold',
  funnelPath: '/haitian',
  funnelId: 'kreyol_companion',
} as const;

export type ColdImportPreset = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  audience: string;
  temperature: 'cold';
  source: LeadSource;
  offer: LeadOffer;
  funnelPath: string;
  funnelId?: string;
  listName?: string;
};

export type PreparedImportRow = BulkLeadRow & {
  dedupeKey: string;
  lists: string[];
  stateGuess?: string;
  areaCode?: string;
};

export function normalizeImportEmail(email?: string): string {
  const e = (email || '').trim().toLowerCase();
  return e.includes('@') ? e : '';
}

export function normalizeImportPhone(phone?: string): string {
  let d = (phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d.length >= 10 ? d : '';
}

export function importDedupeKey(row: { email?: string; phone?: string }): string {
  const email = normalizeImportEmail(row.email);
  if (email) return `e:${email}`;
  const phone = normalizeImportPhone(row.phone);
  if (phone) return `p:${phone}`;
  return '';
}

export function listSlugFromFilename(filename?: string): string {
  const base = (filename || '').split(/[/\\]/).pop() || '';
  const stem = base.replace(/\.[^.]+$/, '').replace(/_[a-f0-9]{4,}$/i, '');
  const slug = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || 'imported-list';
}

export function phoneOnlyPlaceholderEmail(phone: string): string {
  const digits = normalizeImportPhone(phone);
  return `phone.${digits || 'unknown'}@imported.invalid`;
}

export function coldImportTags(args: { listNames?: string[]; extra?: string[] }): string[] {
  const lists = (args.listNames ?? []).map((n) => `list:${n}`).filter((t) => t.length > 5);
  return Array.from(
    new Set([
      `source:${HAITIAN_COLD_IMPORT.utmSource}`,
      `temperature:${HAITIAN_COLD_IMPORT.temperature}`,
      `audience:${HAITIAN_COLD_IMPORT.audience}`,
      'haitian-community',
      `offer:${HAITIAN_COLD_IMPORT.offer}`,
      ...lists,
      ...(args.extra ?? []),
    ]),
  );
}

export function parseCommunityContactCsv(
  text: string,
  args?: { listName?: string; filename?: string },
): { rows: PreparedImportRow[]; errors: string[]; skippedNoKey: number } {
  const listName = args?.listName || listSlugFromFilename(args?.filename);
  const { rows, errors } = parseLeadsCsv(text, { allowPhoneOnly: true });
  const prepared: PreparedImportRow[] = [];
  let skippedNoKey = 0;
  for (const row of rows) {
    const email = normalizeImportEmail(row.email);
    const phone = normalizeImportPhone(row.phone);
    const key = importDedupeKey({ email, phone });
    if (!key) {
      skippedNoKey += 1;
      continue;
    }
    prepared.push({
      ...row,
      email: email || (phone ? phoneOnlyPlaceholderEmail(phone) : ''),
      phone: phone || row.phone,
      fullName: (row.fullName || '').trim() || (email ? email.split('@')[0]! : 'Imported contact'),
      areaCode: row.areaCode,
      stateGuess: row.stateGuess,
      lists: listName ? [listName] : [],
      dedupeKey: key,
    });
  }
  return { rows: prepared, errors, skippedNoKey };
}

export function dedupePreparedImportRows(batches: PreparedImportRow[][]): {
  unique: PreparedImportRow[];
  duplicateCount: number;
} {
  const byKey = new Map<string, PreparedImportRow>();
  let duplicateCount = 0;
  for (const batch of batches) {
    for (const row of batch) {
      const existing = byKey.get(row.dedupeKey);
      if (!existing) {
        byKey.set(row.dedupeKey, { ...row, lists: [...row.lists] });
        continue;
      }
      duplicateCount += 1;
      existing.lists = Array.from(new Set([...existing.lists, ...row.lists]));
      if (!existing.phone && row.phone) existing.phone = row.phone;
      if (!existing.email.includes('@imported.invalid') && row.email && !row.email.includes('@imported.invalid')) {
        existing.email = row.email;
      }
      if (existing.fullName.length < (row.fullName || '').length) existing.fullName = row.fullName;
      existing.stateGuess = existing.stateGuess || row.stateGuess;
      existing.areaCode = existing.areaCode || row.areaCode;
    }
  }
  return { unique: Array.from(byKey.values()), duplicateCount };
}

export function interestForImportedRow(row: PreparedImportRow): string {
  const parts = [
    'haitian_community',
    `temperature=${HAITIAN_COLD_IMPORT.temperature}`,
    `source=${HAITIAN_COLD_IMPORT.utmSource}`,
    row.lists.length ? `list=${row.lists.join(',')}` : '',
    row.stateGuess ? `state=${row.stateGuess}` : '',
    row.areaCode ? `area=${row.areaCode}` : '',
  ].filter(Boolean);
  return parts.join(' | ');
}

export function summarizeImportDryRun(rows: PreparedImportRow[]): {
  unique: number;
  withEmail: number;
  phoneOnly: number;
  byList: Record<string, number>;
  byState: Record<string, number>;
} {
  const byList: Record<string, number> = {};
  const byState: Record<string, number> = {};
  let withEmail = 0;
  let phoneOnly = 0;
  for (const row of rows) {
    if (normalizeImportEmail(row.email) && !row.email.endsWith('@imported.invalid')) withEmail += 1;
    else phoneOnly += 1;
    for (const list of row.lists) byList[list] = (byList[list] ?? 0) + 1;
    const state = row.stateGuess || '(blank)';
    byState[state] = (byState[state] ?? 0) + 1;
  }
  return { unique: rows.length, withEmail, phoneOnly, byList, byState };
}

export function leadIsColdHaitianImport(lead: Pick<LeadCapture, 'utmSource' | 'source' | 'interest'>): boolean {
  return (
    lead.utmSource === HAITIAN_COLD_IMPORT.utmSource ||
    lead.source === 'csv_import' ||
    (lead.interest ?? '').includes('source=haitian_csv_import')
  );
}
