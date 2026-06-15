import type { CrmRecord } from '../../../domain/crmRecords';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { createCrmInboundLead } from '../../../data/crmRecordsRepo';
import { createProspect } from '../../../data/crmProspectsRepo';
import type { LeadSource } from '../../../domain/leads';
import type { ProspectTarget } from '../../../domain/crmProspects';

export type CrmExportRow = {
  id: string;
  kind: string;
  stage: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  dealValueCents: number | '';
  referralCode: string;
  consentToContact: string;
  updatedAt: string;
};

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function crmRecordsToExportRows(records: CrmRecord[]): CrmExportRow[] {
  return records.map((r) => ({
    id: r.id,
    kind: r.kind,
    stage: r.stage,
    fullName: r.contact.fullName ?? '',
    email: r.contact.email ?? '',
    phone: r.contact.phone ?? '',
    company: r.contact.company ?? '',
    dealValueCents: r.dealValueCents ?? '',
    referralCode: r.attribution?.referralCode ?? '',
    consentToContact: r.attribution?.consentToContact === false ? 'no' : 'yes',
    updatedAt: r.updatedAt,
  }));
}

export function exportCrmRecordsCsv(records: CrmRecord[]): string {
  const rows = crmRecordsToExportRows(records);
  const headers = Object.keys(rows[0] ?? ({} as CrmExportRow));
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(String((row as Record<string, string | number>)[h] ?? ''))).join(','));
  }
  return lines.join('\n');
}

export function exportCrmRecordsJson(records: CrmRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type CrmImportRow = {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  interest?: string;
  consentToContact?: boolean;
  referralCode?: string;
  target?: ProspectTarget;
  kind?: 'lead' | 'prospect';
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseBool(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no') return false;
  return true;
}

export function parseCrmImportCsv(text: string): CrmImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name);

  const rows: CrmImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const get = (name: string) => {
      const j = idx(name);
      return j >= 0 ? cols[j] : '';
    };
    const fullName = get('fullname') || get('full_name') || get('name');
    const email = get('email');
    if (!fullName && !email) continue;
    rows.push({
      fullName: fullName || email.split('@')[0],
      email,
      phone: get('phone') || undefined,
      company: get('company') || undefined,
      interest: get('interest') || undefined,
      consentToContact: parseBool(get('consenttocontact') || get('consent')),
      referralCode: get('referralcode') || get('referral_code') || undefined,
      target: (get('target') as ProspectTarget) || 'clients',
      kind: get('kind') === 'prospect' ? 'prospect' : 'lead',
    });
  }
  return rows;
}

export type CrmBulkImportResult = {
  created: number;
  skipped: number;
  errors: string[];
  recordIds: string[];
};

export function importCrmRows(rows: CrmImportRow[]): CrmBulkImportResult {
  const result: CrmBulkImportResult = { created: 0, skipped: 0, errors: [], recordIds: [] };

  for (const row of rows) {
    if (!row.email?.trim()) {
      result.skipped += 1;
      result.errors.push(`Skipped row — missing email for ${row.fullName || 'unnamed'}`);
      continue;
    }
    try {
      if (row.kind === 'prospect') {
        const p = createProspect({
          target: row.target ?? 'clients',
          source: 'import',
          contact: {
            name: row.fullName,
            emails: [row.email],
            phones: row.phone ? [row.phone] : [],
          },
          company: row.company ? { name: row.company } : {},
          tags: row.referralCode ? [`ref:${row.referralCode}`] : [],
        });
        result.recordIds.push(`crm_prospect_${p.id}`);
      } else {
        const rec = createCrmInboundLead({
          fullName: row.fullName,
          email: row.email,
          phone: row.phone,
          interest: row.interest,
          consentToContact: row.consentToContact !== false,
          referralCode: row.referralCode,
          source: 'contact' as LeadSource,
        });
        result.recordIds.push(rec.id);
      }
      result.created += 1;
    } catch (e) {
      result.skipped += 1;
      result.errors.push((e as Error)?.message || `Failed: ${row.email}`);
    }
  }

  return result;
}

export function summarizeExport(records: CrmRecord[]) {
  return `${records.length} records — ${records.filter((r) => r.kind === 'inbound_lead').length} leads, ${records.filter((r) => r.kind === 'prospect').length} prospects`;
}

export function exportFilename(prefix: string, ext: string) {
  const d = new Date().toISOString().slice(0, 10);
  return `${prefix}-${d}.${ext}`;
}

export { crmRecordDisplayName };
