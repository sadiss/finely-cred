#!/usr/bin/env node
/**
 * Idempotent Haitian community CRM import.
 *
 * Default is dry-run (counts only, no writes, no email).
 * Never calls comms / nurture / welcome email.
 *
 * Usage:
 *   node scripts/import-haitian-community-leads.mjs --csv path/a.csv --csv path/b.csv
 *   node scripts/import-haitian-community-leads.mjs --csv path/a.csv --write
 *
 * --write requires SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
 * Do not commit the CSVs. They contain personal contact data.
 */
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const TENANT_ID = 'finely_cred';
const PRESET = {
  source: 'csv_import',
  offer: 'haitian_credit_kit',
  utmSource: 'haitian_csv_import',
  utmMedium: 'crm_import',
  utmCampaign: 'haitian_community_cold',
  funnelPath: '/haitian',
};

function parseArgs(argv) {
  const csvs = [];
  let write = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') write = true;
    else if (a === '--csv' && argv[i + 1]) {
      csvs.push(argv[++i]);
    } else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/import-haitian-community-leads.mjs --csv <file> [--csv <file> ...] [--write]`);
      process.exit(0);
    }
  }
  return { csvs, write };
}

function parseCsvLine(line) {
  const out = [];
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

const HEADER_ALIASES = {
  full_name: 'fullName',
  name: 'fullName',
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  phone: 'phone',
  phone_number: 'phone',
  mobile: 'phone',
  area_code: 'areaCode',
  state_guess: 'stateGuess',
  state: 'stateGuess',
};

function normalizeHeader(h) {
  return HEADER_ALIASES[h.trim().toLowerCase().replace(/\s+/g, '_')] ?? null;
}

function listSlugFromFilename(filename) {
  const stem = basename(filename).replace(/\.[^.]+$/, '').replace(/_[a-f0-9]{4,}$/i, '');
  return stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'imported-list';
}

function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e.includes('@') ? e : '';
}

function normalizePhone(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d.length >= 10 ? d : '';
}

function parseFile(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { rows: [], list: listSlugFromFilename(path) };
  const headerMap = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const row = {};
    for (let c = 0; c < headerMap.length; c++) {
      if (headerMap[c]) row[headerMap[c]] = cells[c] ?? '';
    }
    const fullName = [row.firstName, row.lastName].map((p) => String(p || '').trim()).filter(Boolean).join(' ') || String(row.fullName || '').trim();
    const email = normalizeEmail(row.email);
    const phone = normalizePhone(row.phone);
    const key = email ? `e:${email}` : phone ? `p:${phone}` : '';
    if (!key) continue;
    rows.push({
      fullName: fullName || (email ? email.split('@')[0] : phone),
      email: email || `phone.${phone}@imported.invalid`,
      phone,
      stateGuess: String(row.stateGuess || '').trim(),
      areaCode: String(row.areaCode || '').trim(),
      key,
    });
  }
  return { rows, list: listSlugFromFilename(path) };
}

function main() {
  const { csvs, write } = parseArgs(process.argv.slice(2));
  if (!csvs.length) {
    console.error('Pass at least one --csv <path>. Dry-run is the default. Never commit the CSVs.');
    process.exit(1);
  }

  const byKey = new Map();
  const fileCounts = [];
  for (const csv of csvs) {
    const path = resolve(csv);
    const { rows, list } = parseFile(path);
    fileCounts.push({ file: basename(path), rows: rows.length, list });
    for (const row of rows) {
      const existing = byKey.get(row.key);
      if (!existing) {
        byKey.set(row.key, { ...row, lists: [list] });
      } else {
        existing.lists = Array.from(new Set([...existing.lists, list]));
        if (!existing.phone && row.phone) existing.phone = row.phone;
        if (existing.fullName.length < row.fullName.length) existing.fullName = row.fullName;
        existing.stateGuess = existing.stateGuess || row.stateGuess;
      }
    }
  }

  const unique = Array.from(byKey.values());
  const withEmail = unique.filter((r) => !r.email.endsWith('@imported.invalid')).length;
  const phoneOnly = unique.length - withEmail;
  const byState = {};
  const byList = {};
  for (const row of unique) {
    const state = row.stateGuess || '(blank)';
    byState[state] = (byState[state] || 0) + 1;
    for (const list of row.lists) byList[list] = (byList[list] || 0) + 1;
  }

  const report = {
    emailsSent: 0,
    sequencesEnrolled: 0,
    mode: write ? 'write' : 'dry-run',
    files: fileCounts,
    unique: unique.length,
    withEmail,
    phoneOnly,
    byState,
    byList,
  };
  console.log(JSON.stringify(report, null, 2));

  if (!write) {
    console.log('\nDry-run only. Re-run with --write and service-role credentials to upsert lead_captures + crm_records.');
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY. Aborting with zero writes.');
    process.exit(2);
  }

  void writeRows(unique, url, key).catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
  });
}

async function writeRows(unique, url, key) {
  const supabaseJs = '@supabase/' + 'supabase-js';
  const { createClient } = await import(supabaseJs);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  for (const row of unique) {
    const id = `lead_hc_${row.key.replace(/[^a-z0-9]/g, '_').slice(0, 40)}`;
    const interest = [
      'haitian_community',
      'temperature=cold',
      'source=haitian_csv_import',
      `list=${row.lists.join(',')}`,
      row.stateGuess ? `state=${row.stateGuess}` : '',
      row.areaCode ? `area=${row.areaCode}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    const tags = Array.from(
      new Set([
        'source:haitian_csv_import',
        'temperature:cold',
        'audience:haitian_community',
        'haitian-community',
        'offer:haitian_credit_kit',
        ...row.lists.map((list) => `list:${list}`),
      ]),
    );
    const now = new Date().toISOString();
    const leadRow = {
      id,
      created_at: now,
      source: PRESET.source,
      offer: PRESET.offer,
      interest,
      full_name: row.fullName,
      email: row.email,
      phone: row.phone || null,
      consent_to_contact: false,
      utm_source: PRESET.utmSource,
      utm_medium: PRESET.utmMedium,
      utm_campaign: PRESET.utmCampaign,
      funnel_path: PRESET.funnelPath,
    };
    const crmRow = {
      id: `crm_lead_${id}`,
      tenant_id: TENANT_ID,
      kind: 'inbound_lead',
      target: 'clients',
      stage: 'new',
      source: PRESET.source,
      tags,
      contact: { fullName: row.fullName, email: row.email, phone: row.phone || undefined },
      package_interest: interest,
      attribution: {
        source: PRESET.source,
        offer: PRESET.offer,
        utmSource: PRESET.utmSource,
        utmMedium: PRESET.utmMedium,
        utmCampaign: PRESET.utmCampaign,
        funnelPath: PRESET.funnelPath,
      },
      source_ref: { type: 'lead', id },
      created_at: now,
      updated_at: now,
    };

    try {
      const existing = await admin.from('lead_captures').select('id, created_at').eq('id', id).maybeSingle();
      if (existing.data?.created_at) leadRow.created_at = existing.data.created_at;
      const { error: leadErr } = await admin.from('lead_captures').upsert(leadRow, { onConflict: 'id' });
      if (leadErr) throw new Error(leadErr.message);
      const { error: crmErr } = await admin.from('crm_records').upsert(crmRow, { onConflict: 'id' });
      if (crmErr) throw new Error(crmErr.message);
      if (existing.data?.id) updated += 1;
      else inserted += 1;
    } catch (err) {
      failed += 1;
      errors.push(err?.message || String(err));
    }
  }

  console.log(
    JSON.stringify(
      {
        write: true,
        inserted,
        updated,
        failed,
        emailsSent: 0,
        sequencesEnrolled: 0,
        errorCount: errors.length,
        errorSamples: errors.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main();
