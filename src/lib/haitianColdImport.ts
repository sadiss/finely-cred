import type { LeadCapture } from '../domain/leads';
import { findLeadCapturesByEmail, importColdLeadCapture, listLeadCaptures } from '../data/leadsRepo';
import { getLeadOp } from '../data/leadOpsRepo';
import {
  haitianCrmBucket,
  isColdHaitianCapture,
  isOptedInHaitianCapture,
  type HaitianCrmBucket,
} from './haitianLeadTags';

export const HAITIAN_COLD_IMPORT_SOURCE = 'haitian_csv_import' as const;
export const HAITIAN_COLD_AUDIENCE = 'haitian_community';
export const HAITIAN_COLD_FUNNEL_PATH = '/free-kreyol-guide';
export const HAITIAN_COLD_FUNNEL_ID = 'kreyol_companion';

export const HAITIAN_COLD_LEAD_TAGS = [
  'cold',
  'haitian-community',
  'audience:haitian_community',
  'source:haitian_csv_import',
  'temperature:cold',
] as const;

export type HaitianColdCsvRow = {
  fullName: string;
  email: string;
  phone?: string;
  state?: string;
};

export type HaitianColdImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  /** Consented rows left untouched so a re-import cannot demote a hot opt-in. */
  preserved: number;
  failed: number;
  uniqueTotal: number;
  errors: string[];
  dryRun: boolean;
};

const HEADER_ALIASES: Record<string, keyof HaitianColdCsvRow | 'firstName' | 'lastName'> = {
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
  state: 'state',
  state_guess: 'state',
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

function normalizeHeader(h: string): keyof HaitianColdCsvRow | 'firstName' | 'lastName' | null {
  const key = h.trim().toLowerCase().replace(/\s+/g, '_');
  return HEADER_ALIASES[key] ?? null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Parse Haitian outreach CSV (First name, Last name, Phone number, Email, …). */
export function parseHaitianColdCsv(text: string): { rows: HaitianColdCsvRow[]; errors: string[] } {
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

  const rows: HaitianColdCsvRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i]!);
    let fullName = '';
    let email = '';
    let phone = '';
    let state = '';

    if (hasHeader) {
      let firstName = '';
      let lastName = '';
      for (let c = 0; c < headerMap.length; c++) {
        const field = headerMap[c];
        if (!field) continue;
        const val = (cells[c] ?? '').trim();
        if (field === 'firstName') firstName = val;
        else if (field === 'lastName') lastName = val;
        else if (field === 'fullName') fullName = val;
        else if (field === 'email') email = val;
        else if (field === 'phone') phone = val;
        else if (field === 'state') state = val;
      }
      if (!fullName) fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    } else {
      fullName = (cells[0] ?? '').trim();
      email = (cells[1] ?? '').trim();
      phone = (cells[2] ?? '').trim();
    }

    if (!email || !email.includes('@')) {
      if (phone.replace(/\D/g, '').length >= 10) {
        errors.push(`Row ${i + (hasHeader ? 2 : 1)}: missing email — phone-only rows need manual review`);
      } else {
        errors.push(`Row ${i + (hasHeader ? 2 : 1)}: invalid email`);
      }
      continue;
    }

    rows.push({
      fullName: fullName || email.split('@')[0] || 'Imported Lead',
      email: email.trim(),
      phone: phone || undefined,
      state: state || undefined,
    });
  }

  return { rows, errors };
}

function findLeadByPhone(phone: string): LeadCapture | null {
  const norm = normalizePhone(phone);
  if (norm.length < 10) return null;
  return listLeadCaptures().find((l) => normalizePhone(l.phone || '') === norm) ?? null;
}

function dedupeHaitianRows(rows: HaitianColdCsvRow[]): { unique: HaitianColdCsvRow[]; skipped: number } {
  const seenEmail = new Set<string>();
  const seenPhone = new Set<string>();
  const unique: HaitianColdCsvRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const emailKey = normalizeEmail(row.email);
    const phoneKey = normalizePhone(row.phone ?? '');
    if (seenEmail.has(emailKey) || (phoneKey.length >= 10 && seenPhone.has(phoneKey))) {
      skipped += 1;
      continue;
    }
    seenEmail.add(emailKey);
    if (phoneKey.length >= 10) seenPhone.add(phoneKey);
    unique.push(row);
  }

  return { unique, skipped };
}

/**
 * Idempotent cold import — no consent, no nurture pipeline, no welcome email.
 * Re-run updates metadata/tags on existing leads matched by email (phone fallback).
 */
export async function bulkImportHaitianColdLeads(
  rows: HaitianColdCsvRow[],
  opts?: { dryRun?: boolean },
): Promise<HaitianColdImportResult> {
  const dryRun = Boolean(opts?.dryRun);
  const { unique, skipped: dedupeSkipped } = dedupeHaitianRows(rows);
  const result: HaitianColdImportResult = {
    inserted: 0,
    updated: 0,
    skipped: dedupeSkipped,
    preserved: 0,
    failed: 0,
    uniqueTotal: unique.length,
    errors: [],
    dryRun,
  };

  for (const row of unique) {
    try {
      const email = row.email.trim();
      const existing =
        findLeadCapturesByEmail(email)[0] ?? (row.phone ? findLeadByPhone(row.phone) : null);
      const alreadyConsented = Boolean(
        existing && (existing.consentToContact || existing.consentEmailMarketing || existing.consentSmsMarketing),
      );
      if (alreadyConsented) {
        result.preserved += 1;
        continue;
      }
      const isUpdate = Boolean(existing);

      if (dryRun) {
        if (isUpdate) result.updated += 1;
        else result.inserted += 1;
        continue;
      }

      await importColdLeadCapture({
        fullName: row.fullName.trim(),
        email,
        phone: row.phone?.trim() ?? '',
        interest: HAITIAN_COLD_AUDIENCE,
        offer: 'haitian_credit_kit',
        source: HAITIAN_COLD_IMPORT_SOURCE,
        consentToContact: false,
        consentEmailMarketing: false,
        funnelPath: HAITIAN_COLD_FUNNEL_PATH,
        funnelId: HAITIAN_COLD_FUNNEL_ID,
        utmSource: HAITIAN_COLD_IMPORT_SOURCE,
        utmMedium: 'cold_import',
        utmCampaign: 'haitian_community',
        utmContent: row.state?.trim() || undefined,
        tags: [...HAITIAN_COLD_LEAD_TAGS],
        existingLeadId: existing?.id,
      });

      if (isUpdate) result.updated += 1;
      else result.inserted += 1;
    } catch (e: unknown) {
      result.failed += 1;
      result.errors.push(`${row.email}: ${(e as Error)?.message ?? 'import failed'}`);
    }
  }

  return result;
}

export function haitianColdImportSampleCsv(): string {
  return `First name,Last name,Phone number,Email,Area code,State guess
Example,Lead,5551234567,example.lead@example.com,555,FL`;
}

export function isHaitianColdImportedLead(lead: LeadCapture): boolean {
  return isColdHaitianCapture(lead, getLeadOp(lead.id).tags ?? []);
}

export function isHaitianOptedInLead(lead: LeadCapture): boolean {
  return isOptedInHaitianCapture(lead, getLeadOp(lead.id).tags ?? []);
}

export function haitianCrmBucketForLead(lead: LeadCapture): HaitianCrmBucket | null {
  return haitianCrmBucket(lead, getLeadOp(lead.id).tags ?? []);
}

export function formatHaitianColdImportReport(result: HaitianColdImportResult): string {
  const parts = [
    result.dryRun ? 'DRY RUN' : 'IMPORT',
    `unique ${result.uniqueTotal}`,
    `inserted ${result.inserted}`,
    `updated ${result.updated}`,
    result.skipped ? `deduped ${result.skipped}` : '',
    result.preserved ? `preserved ${result.preserved}` : '',
    result.failed ? `failed ${result.failed}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}
