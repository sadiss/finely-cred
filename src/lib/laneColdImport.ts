import type { LeadCapture, LeadOffer } from '../domain/leads';
import { findLeadCapturesByEmail, importColdLeadCapture, listLeadCaptures } from '../data/leadsRepo';

/**
 * Cold public-directory import.
 * Consent stays false. This module never sends email, SMS, or nurture.
 */
export const DIRECTORY_COLD_IMPORT_SOURCE = 'directory_cold_import' as const;

export const DISCOVERY_LANES = ['affiliates', 'specialists', 'jobs', 'haitian_orgs'] as const;
export type DiscoveryLane = (typeof DISCOVERY_LANES)[number];

export type LaneColdCsvRow = {
  fullName: string;
  email: string;
  phone?: string;
  state?: string;
  lanes: DiscoveryLane[];
  organization?: string;
  website?: string;
  sourceId?: string;
  sourceUrl?: string;
};

export type LaneColdImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  uniqueTotal: number;
  errors: string[];
  dryRun: boolean;
};

const HEADER_ALIASES: Record<string, string> = {
  full_name: 'fullName',
  fullname: 'fullName',
  name: 'fullName',
  organization: 'organization',
  org: 'organization',
  company: 'organization',
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
  lane: 'lanes',
  lanes: 'lanes',
  website: 'website',
  web: 'website',
  web_url: 'website',
  source: 'sourceId',
  source_id: 'sourceId',
  source_url: 'sourceUrl',
  sourceurl: 'sourceUrl',
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

function normalizeHeader(h: string): string | null {
  const key = h.trim().toLowerCase().replace(/\s+/g, '_');
  return HEADER_ALIASES[key] ?? null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function parseDiscoveryLanes(raw: string): DiscoveryLane[] {
  const parts = raw
    .split(/[|,;]/)
    .map((p) => p.trim().toLowerCase().replace(/\s+/g, '_'))
    .filter(Boolean);
  const lanes: DiscoveryLane[] = [];
  for (const part of parts) {
    if ((DISCOVERY_LANES as readonly string[]).includes(part) && !lanes.includes(part as DiscoveryLane)) {
      lanes.push(part as DiscoveryLane);
    }
  }
  return lanes;
}

function hostnameOf(website: string | undefined): string | undefined {
  if (!website) return undefined;
  try {
    const withProto = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    const host = new URL(withProto).hostname.replace(/^www\./, '');
    return host || undefined;
  } catch {
    return undefined;
  }
}

export function laneColdProfile(lanes: DiscoveryLane[]): {
  offer: LeadOffer;
  interest: string;
  funnelPath: string;
  funnelId?: string;
  tags: string[];
} {
  const set = new Set(lanes);
  const tags = [
    'temperature:cold',
    'source:directory_cold_import',
    'no-outreach',
    'consent:none',
    ...lanes.map((lane) => `lane:${lane}`),
  ];
  if (set.has('haitian_orgs')) tags.push('cold', 'haitian-community', 'audience:haitian_community');
  if (set.has('affiliates')) tags.push('affiliate-partner');
  if (set.has('specialists') || set.has('jobs')) tags.push('credit-specialist');

  if (set.has('affiliates')) {
    const bits = ['affiliate_referral'];
    if (set.has('haitian_orgs')) bits.push('haitian_community');
    if (set.has('specialists')) bits.push('credit_specialist');
    if (set.has('jobs')) bits.push('jobs_pipeline');
    return {
      offer: 'affiliate_application',
      interest: bits.join(','),
      funnelPath: '/affiliate',
      tags,
    };
  }

  if (set.has('jobs') && !set.has('haitian_orgs')) {
    return {
      offer: 'agent_application',
      interest: 'jobs_pipeline',
      funnelPath: '/credit-specialist',
      tags,
    };
  }

  if (set.has('specialists') && !set.has('haitian_orgs')) {
    return {
      offer: 'agent_application',
      interest: 'credit_specialist',
      funnelPath: '/credit-specialist',
      tags,
    };
  }

  return {
    offer: 'haitian_credit_kit',
    interest: 'haitian_community',
    funnelPath: '/free-kreyol-guide',
    funnelId: 'kreyol_companion',
    tags,
  };
}

/** Import payload for one row. Consent flags are hard-coded off — CSV consent columns are ignored. */
export function buildDirectoryColdImportArgs(row: LaneColdCsvRow, existingLeadId?: string) {
  const profile = laneColdProfile(row.lanes);
  const site = hostnameOf(row.website);
  const tags = site ? [...profile.tags, `site:${site}`] : profile.tags;
  return {
    fullName: (row.organization || row.fullName).trim(),
    email: row.email.trim(),
    phone: row.phone?.trim() ?? '',
    interest: profile.interest,
    offer: profile.offer,
    source: DIRECTORY_COLD_IMPORT_SOURCE,
    consentToContact: false as const,
    consentEmailMarketing: false as const,
    funnelPath: profile.funnelPath,
    funnelId: profile.funnelId,
    utmSource: row.sourceId?.trim() || DIRECTORY_COLD_IMPORT_SOURCE,
    utmMedium: 'cold_import',
    utmCampaign: row.lanes.join('|'),
    utmContent: row.state?.trim() || undefined,
    promoType: 'public_directory',
    promoAsset: row.website?.trim() || undefined,
    tags,
    existingLeadId,
  };
}

export function parseLaneColdCsv(text: string): { rows: LaneColdCsvRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: ['No rows found.'] };

  const firstCells = parseCsvLine(lines[0]!);
  const headerMap = firstCells.map(normalizeHeader);
  const hasHeader = headerMap.some(Boolean);
  if (!hasHeader) return { rows: [], errors: ['Header row required (Full name, Email, Lane, …).'] };
  const dataLines = lines.slice(1);
  const rows: LaneColdCsvRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i]!);
    const rec: Record<string, string> = {};
    for (let c = 0; c < headerMap.length; c++) {
      const field = headerMap[c];
      if (!field) continue;
      rec[field] = (cells[c] ?? '').trim();
    }
    const lineNo = i + 2;
    const lanes = parseDiscoveryLanes(rec.lanes ?? '');
    if (!lanes.length) {
      errors.push(`Row ${lineNo}: missing lane (affiliates, specialists, jobs, haitian_orgs)`);
      continue;
    }
    const email = (rec.email ?? '').trim();
    const phone = rec.phone ?? '';
    if (!email || !email.includes('@')) {
      if (normalizePhone(phone).length >= 10) {
        errors.push(`Row ${lineNo}: missing email — phone-only rows stay in the local directory JSON`);
      } else {
        errors.push(`Row ${lineNo}: invalid email`);
      }
      continue;
    }
    const fullName = (rec.fullName || [rec.firstName, rec.lastName].filter(Boolean).join(' ')).trim();
    const organization = (rec.organization || fullName).trim();
    rows.push({
      fullName: fullName || organization || email.split('@')[0] || 'Imported organization',
      email,
      phone: phone || undefined,
      state: rec.state || undefined,
      lanes,
      organization: organization || undefined,
      website: rec.website || undefined,
      sourceId: rec.sourceId || undefined,
      sourceUrl: rec.sourceUrl || undefined,
    });
  }

  return { rows, errors };
}

function findLeadByPhone(phone: string): LeadCapture | null {
  const norm = normalizePhone(phone);
  if (norm.length < 10) return null;
  return listLeadCaptures().find((l) => normalizePhone(l.phone || '') === norm) ?? null;
}

function dedupeRows(rows: LaneColdCsvRow[]): { unique: LaneColdCsvRow[]; skipped: number } {
  const seenEmail = new Set<string>();
  const seenPhone = new Set<string>();
  const unique: LaneColdCsvRow[] = [];
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
 * Idempotent cold import — no consent, no nurture, no email send.
 */
export async function bulkImportDirectoryColdLeads(
  rows: LaneColdCsvRow[],
  opts?: { dryRun?: boolean },
): Promise<LaneColdImportResult> {
  const dryRun = Boolean(opts?.dryRun);
  const { unique, skipped } = dedupeRows(rows);
  const result: LaneColdImportResult = {
    inserted: 0,
    updated: 0,
    skipped,
    failed: 0,
    uniqueTotal: unique.length,
    errors: [],
    dryRun,
  };

  for (const row of unique) {
    try {
      const existing =
        findLeadCapturesByEmail(row.email)[0] ?? (row.phone ? findLeadByPhone(row.phone) : null);
      const isUpdate = Boolean(existing);
      if (dryRun) {
        if (isUpdate) result.updated += 1;
        else result.inserted += 1;
        continue;
      }
      const args = buildDirectoryColdImportArgs(row, existing?.id);
      if (args.consentToContact !== false || args.consentEmailMarketing !== false) {
        throw new Error('refusing import: consent flags must stay false');
      }
      await importColdLeadCapture(args);
      if (isUpdate) result.updated += 1;
      else result.inserted += 1;
    } catch (e: unknown) {
      result.failed += 1;
      result.errors.push(`${row.email}: ${(e as Error)?.message ?? 'import failed'}`);
    }
  }

  return result;
}

export function laneColdImportSampleCsv(): string {
  return `Full name,Phone number,Email,State guess,Lane,Organization,Website,Source,Source URL
Example Housing Agency,5551234567,example.agency@example.com,FL,affiliates|haitian_orgs,Example Housing Agency,https://example.org,hud_housing_counselor,https://data.hud.gov/Housing_Counselor
Example Credit Nonprofit,,example.credit@example.com,NY,specialists|affiliates,Example Credit Nonprofit,https://example.org,propublica_nonprofit,https://projects.propublica.org/nonprofits`;
}

export function formatLaneColdImportReport(result: LaneColdImportResult): string {
  const parts = [
    result.dryRun ? 'DRY RUN' : 'IMPORT',
    `unique=${result.uniqueTotal}`,
    `inserted=${result.inserted}`,
    `updated=${result.updated}`,
    `skipped=${result.skipped}`,
    `failed=${result.failed}`,
    'consent=false',
    'email_sent=0',
  ];
  return parts.join(' ');
}
