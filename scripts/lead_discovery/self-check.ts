#!/usr/bin/env npx tsx
/**
 * Offline checks for the cold directory importer.
 * Uses the committed example CSV only — no network, no real contacts, no email send.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildDirectoryColdImportArgs,
  bulkImportDirectoryColdLeads,
  formatLaneColdImportReport,
  parseLaneColdCsv,
} from '../../src/lib/laneColdImport.ts';
import { scoreLead } from '../../src/lib/leadScoring.ts';

function assert(cond: unknown, message: string) {
  if (!cond) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${message}`);
  }
}

const examplePath = resolve('data/lead-discovery/cold-import.example.csv');
const example = readFileSync(examplePath, 'utf8');
const exampleEmails = example.match(/[^\s,]+@[^\s,]+/g) ?? [];
assert(exampleEmails.length > 0 && exampleEmails.every((e) => e.endsWith('@example.com')), 'example csv emails are @example.com only');
assert(!/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(example.replace(/5551234567/g, '')), 'example csv has no real-looking phones');

const parsed = parseLaneColdCsv(example);
assert(parsed.errors.length === 0, `example csv parses cleanly (${parsed.errors.join('; ')})`);
assert(parsed.rows.length === 2, `example csv has 2 rows (got ${parsed.rows.length})`);

const affiliate = parsed.rows.find((r) => r.lanes.includes('affiliates') && r.lanes.includes('haitian_orgs'));
assert(Boolean(affiliate), 'affiliate|haitian row present');
if (affiliate) {
  const args = buildDirectoryColdImportArgs(affiliate);
  assert(args.consentToContact === false, 'consentToContact forced false');
  assert(args.consentEmailMarketing === false, 'consentEmailMarketing forced false');
  assert(args.source === 'directory_cold_import', 'source is directory_cold_import');
  assert(args.offer === 'affiliate_application', 'mixed affiliate lane uses affiliate_application');
  assert(args.funnelPath === '/affiliate', 'affiliate funnel path');
  assert(args.tags.includes('no-outreach'), 'no-outreach tag');
  assert(args.tags.includes('cold'), 'haitian lane keeps cold tag for the Haitian filter');
  assert(args.promoAsset === 'https://example.org', 'public website stored on promoAsset');
  assert(!args.tags.some((t) => t.includes('@')), 'tags do not contain emails');
}

const specialist = parsed.rows.find((r) => r.lanes.includes('specialists') && !r.phone);
assert(Boolean(specialist), 'specialist row present');
if (specialist) {
  const args = buildDirectoryColdImportArgs(specialist);
  assert(args.offer === 'affiliate_application', 'specialist+affiliate stays a partner offer');
  assert(args.interest.includes('credit_specialist'), 'specialist interest recorded');
}

const consentTrap = parseLaneColdCsv(
  `${example.trim()}\nTrap Org,,trap.person@example.com,FL,jobs,Trap Org,https://example.org,manual,https://example.org,TRUE`,
);
assert(consentTrap.rows.length === 3, 'a jobs row parses even if an extra unmapped cell is present');
const trap = consentTrap.rows.find((r) => r.lanes.includes('jobs') && !r.lanes.includes('affiliates'));
assert(Boolean(trap), 'jobs row from the extra line is kept');
if (trap) {
  assert(buildDirectoryColdImportArgs(trap).consentToContact === false, 'unmapped TRUE cell cannot opt the row in');
}

const withConsentHeader = `Full name,Email,Lane,Consent
Consent Trap,consent.trap@example.com,jobs,TRUE`;
const trapped = parseLaneColdCsv(withConsentHeader);
assert(trapped.rows.length === 1, 'consent column does not drop the row');
if (trapped.rows[0]) {
  const args = buildDirectoryColdImportArgs(trapped.rows[0]);
  assert(args.consentToContact === false && args.consentEmailMarketing === false, 'Consent=TRUE in CSV is ignored');
  assert(args.offer === 'agent_application', 'jobs lane maps to agent_application');
  assert(args.interest === 'jobs_pipeline', 'jobs interest');
}

const phoneOnly = parseLaneColdCsv(`Full name,Phone number,Email,Lane
Phone Only,5551234567,,affiliates`);
assert(phoneOnly.rows.length === 0, 'phone-only row is not CRM-imported');
assert(phoneOnly.errors.some((e) => e.includes('phone-only')), 'phone-only explains it stays in the directory JSON');

if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  } as Storage;
}

const dry = await bulkImportDirectoryColdLeads(parsed.rows, { dryRun: true });
console.log(formatLaneColdImportReport(dry));
assert(dry.dryRun && dry.inserted === 2 && dry.failed === 0, 'dry-run counts example rows and sends nothing');
const coldScore = scoreLead({
  id: 'lead_example',
  createdAt: '2026-01-01T00:00:00.000Z',
  source: 'directory_cold_import',
  offer: 'agent_application',
  interest: 'credit_specialist',
  fullName: 'Example Counseling Office',
  email: 'office@example.com',
  phone: '5551234567',
  consentToContact: false,
  consentEmailMarketing: false,
  funnelPath: '/credit-specialist',
});
assert(coldScore.band === 'cold' && coldScore.score <= 39, 'directory cold score stays in the cold band');
assert(coldScore.suggestedSequenceId === '', 'directory cold has no nurture sequence suggestion');
assert(coldScore.suggestedAction.toLowerCase().includes('do not email'), 'directory cold action says do not email');
assert(formatLaneColdImportReport(dry).includes('email_sent=0'), 'report states email_sent=0');

if (process.exitCode) {
  console.error('self-check failed');
  process.exit(process.exitCode);
}
console.log('lane cold import self-check passed — NO EMAIL');
