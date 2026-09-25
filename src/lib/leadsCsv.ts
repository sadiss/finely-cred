import type { LeadOffer, LeadSource } from '../domain/leads';

export type BulkLeadRow = {
  fullName: string;
  email: string;
  phone?: string;
  interest?: string;
  offer?: LeadOffer;
  source?: LeadSource;
  funnelPath?: string;
  consentToContact?: boolean;
  consentEmailMarketing?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  firstName?: string;
  lastName?: string;
  areaCode?: string;
  stateGuess?: string;
};

export type ParseLeadsCsvOptions = {
  /** Accept rows that have a usable phone but no email (CRM-only imports). */
  allowPhoneOnly?: boolean;
};

const HEADER_ALIASES: Record<string, keyof BulkLeadRow> = {
  full_name: 'fullName',
  fullname: 'fullName',
  name: 'fullName',
  first_name: 'firstName',
  firstname: 'firstName',
  last_name: 'lastName',
  lastname: 'lastName',
  email: 'email',
  phone: 'phone',
  phone_number: 'phone',
  mobile: 'phone',
  interest: 'interest',
  offer: 'offer',
  source: 'source',
  funnel_path: 'funnelPath',
  funnelpath: 'funnelPath',
  consent: 'consentToContact',
  consent_to_contact: 'consentToContact',
  consent_email: 'consentEmailMarketing',
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  area_code: 'areaCode',
  state_guess: 'stateGuess',
  state: 'stateGuess',
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(h: string): keyof BulkLeadRow | null {
  const key = h.trim().toLowerCase().replace(/\s+/g, '_');
  return HEADER_ALIASES[key] ?? null;
}

function parseBool(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

function composeFullName(row: BulkLeadRow): string {
  const composed = [row.firstName, row.lastName].map((p) => String(p ?? '').trim()).filter(Boolean).join(' ');
  return (row.fullName || composed).trim();
}

/** Parse CSV text into lead rows. First row may be headers. */
export function parseLeadsCsv(text: string, options?: ParseLeadsCsvOptions): { rows: BulkLeadRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: ['No rows found.'] };

  const firstCells = parseCsvLine(lines[0]!);
  const headerMap = firstCells.map(normalizeHeader);
  const hasHeader = headerMap.some(Boolean);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: BulkLeadRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i]!);
    let fullName = '';
    let email = '';
    const row: BulkLeadRow = { fullName: '', email: '' };

    if (hasHeader) {
      for (let c = 0; c < headerMap.length; c++) {
        const field = headerMap[c];
        if (!field) continue;
        const val = cells[c] ?? '';
        if (field === 'consentToContact' || field === 'consentEmailMarketing') {
          (row as Record<string, unknown>)[field] = parseBool(val);
        } else {
          (row as Record<string, unknown>)[field] = val;
        }
      }
      fullName = composeFullName(row);
      email = String(row.email ?? '').trim();
    } else {
      fullName = (cells[0] ?? '').trim();
      email = (cells[1] ?? '').trim();
      row.phone = (cells[2] ?? '').trim() || undefined;
      row.interest = (cells[3] ?? '').trim() || undefined;
    }

    const phone = String(row.phone ?? '').trim();
    const emailOk = Boolean(email && email.includes('@'));
    if (!emailOk && !(options?.allowPhoneOnly && phone)) {
      errors.push(`Row ${i + (hasHeader ? 2 : 1)}: invalid email "${email || '(empty)'}"`);
      continue;
    }
    row.fullName = fullName || (emailOk ? email.split('@')[0] : phone) || 'Imported Lead';
    row.email = email;
    rows.push(row);
  }

  return { rows, errors };
}
