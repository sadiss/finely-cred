import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseLeadsCsv } from '../leadsCsv';
import {
  coldImportTags,
  dedupePreparedImportRows,
  importDedupeKey,
  listSlugFromFilename,
  normalizeImportEmail,
  normalizeImportPhone,
  parseCommunityContactCsv,
  phoneOnlyPlaceholderEmail,
  summarizeImportDryRun,
} from '../crmSilentLeadImportCore';

const SAMPLE = `First name,Last name,Phone number,Email,Area code,State guess
Marie,Example,3055550100,marie.example@example.com,305,FL
Jean,Example,9545550199,,954,FL
Marie,Example,3055550100,marie.example@example.com,305,FL
`;

describe('haitian community CSV parse', () => {
  it('maps First/Last name + Phone number headers', () => {
    const { rows, errors } = parseLeadsCsv(SAMPLE, { allowPhoneOnly: true });
    assert.equal(errors.length, 0);
    assert.equal(rows.length, 3);
    assert.equal(rows[0]?.fullName, 'Marie Example');
    assert.equal(rows[0]?.phone, '3055550100');
    assert.equal(rows[0]?.stateGuess, 'FL');
    assert.equal(rows[1]?.fullName, 'Jean Example');
    assert.equal(rows[1]?.email, '');
  });

  it('still rejects phone-only rows when allowPhoneOnly is off', () => {
    const { rows, errors } = parseLeadsCsv(SAMPLE);
    assert.equal(rows.length, 2);
    assert.ok(errors.some((e) => e.includes('invalid email')));
  });
});

describe('dedupe + tags', () => {
  it('dedupes by email then phone across files and merges list slugs', () => {
    const a = parseCommunityContactCsv(SAMPLE, { filename: 'finely-haitian-leads-cleaned.csv' });
    const b = parseCommunityContactCsv(
      `First name,Last name,Phone number,Email,Area code,State guess
Marie,Example,3055550100,marie.example@example.com,305,FL
`,
      { filename: 'finely-haitian-leads-FL-ready.csv' },
    );
    const { unique, duplicateCount } = dedupePreparedImportRows([a.rows, b.rows]);
    assert.equal(unique.length, 2);
    assert.ok(duplicateCount >= 2);
    const marie = unique.find((r) => r.email === 'marie.example@example.com');
    assert.ok(marie?.lists.includes('finely-haitian-leads-cleaned'));
    assert.ok(marie?.lists.includes('finely-haitian-leads-fl-ready'));
  });

  it('uses phone fallback when email is missing', () => {
    assert.equal(importDedupeKey({ phone: '1 (954) 555-0199' }), 'p:9545550199');
    assert.equal(normalizeImportPhone('+19545550199'), '9545550199');
    assert.equal(phoneOnlyPlaceholderEmail('9545550199'), 'phone.9545550199@imported.invalid');
    assert.equal(normalizeImportEmail('not-an-email'), '');
  });

  it('builds cold CRM tags without marketing language', () => {
    const tags = coldImportTags({ listNames: ['finely-haitian-leads-cleaned'] });
    assert.ok(tags.includes('source:haitian_csv_import'));
    assert.ok(tags.includes('temperature:cold'));
    assert.ok(tags.includes('audience:haitian_community'));
    assert.ok(tags.includes('list:finely-haitian-leads-cleaned'));
    assert.ok(tags.includes('haitian-community'));
  });

  it('summarizes counts only', () => {
    const { rows } = parseCommunityContactCsv(SAMPLE, { listName: 'unit' });
    const { unique } = dedupePreparedImportRows([rows]);
    const summary = summarizeImportDryRun(unique);
    assert.equal(summary.unique, 2);
    assert.equal(summary.withEmail, 1);
    assert.equal(summary.phoneOnly, 1);
    assert.equal(summary.byState.FL, 2);
  });

  it('strips upload hash suffixes from filenames', () => {
    assert.equal(listSlugFromFilename('finely-haitian-leads-cleaned_e601.csv'), 'finely-haitian-leads-cleaned');
  });
});
