import type { LeadCapture, LeadOffer, LeadSource } from '../domain/leads';
import { submitLeadCapture } from '../data/leadsRepo';

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
};

export type BulkImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
  leadIds: string[];
};

const HEADER_ALIASES: Record<string, keyof BulkLeadRow> = {
  full_name: 'fullName',
  fullname: 'fullName',
  name: 'fullName',
  email: 'email',
  phone: 'phone',
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

/** Parse CSV text into lead rows. First row may be headers. */
export function parseLeadsCsv(text: string): { rows: BulkLeadRow[]; errors: string[] } {
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
      fullName = String(row.fullName ?? '').trim();
      email = String(row.email ?? '').trim();
    } else {
      fullName = (cells[0] ?? '').trim();
      email = (cells[1] ?? '').trim();
      row.phone = (cells[2] ?? '').trim() || undefined;
      row.interest = (cells[3] ?? '').trim() || undefined;
    }

    if (!email || !email.includes('@')) {
      errors.push(`Row ${i + (hasHeader ? 2 : 1)}: invalid email "${email || '(empty)'}"`);
      continue;
    }
    row.fullName = fullName || email.split('@')[0] || 'Imported Lead';
    row.email = email;
    rows.push(row);
  }

  return { rows, errors };
}

const SAMPLE_CSV = `full_name,email,phone,interest,source,consent_to_contact
Jordan Lee,jordan@example.com,5551234567,credit restore,agent,true
Alex Kim,alex@example.com,,business funding,agent,true`;

export function bulkImportSampleCsv() {
  return SAMPLE_CSV;
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
