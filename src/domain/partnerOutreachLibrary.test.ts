import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isOutreachHold,
  matchesPartnerOutreachFilters,
  partnerOutreachExportCsv,
  type PartnerOutreachRecord,
} from './partnerOutreachLibrary';
import { listPartnerOutreachLibrary, partnerOutreachLibraryStats } from '../data/partnerOutreachLibraryRepo';

const sample: PartnerOutreachRecord = {
  partnerId: 'FC-TEST',
  corridor: 'haitian',
  batch: 'H1',
  batchLabel: 'Haitian Batch H1',
  businessName: 'Test Mortgage',
  personName: 'Ada',
  title: 'LO',
  category: 'Mortgage',
  categoryRaw: 'mortgage',
  city: 'Miami, FL',
  metro: 'Miami',
  website: 'https://example.com',
  phone: '(305) 555-0100',
  email: 'ada@example.com',
  hasPhone: true,
  hasEmail: true,
  hasPhoneAndEmail: true,
  icpFit: 'strong',
  whyFit: 'Miami mortgage LO.',
  sourceUrls: ['https://example.com'],
  status: 'drafted',
  outreachStatus: 'HOLD — not sent',
};

describe('partnerOutreachLibrary', () => {
  it('loads the MASTER researched list', () => {
    const all = listPartnerOutreachLibrary();
    const stats = partnerOutreachLibraryStats(all);
    assert.equal(all.length, 719);
    assert.equal(stats.haitian + stats.general, 719);
    assert.ok(stats.haitian > stats.general);
    assert.equal(stats.outreachHold, 719);
  });

  it('filters corridor, metro, category, phone+email, and HOLD', () => {
    assert.equal(isOutreachHold(sample.outreachStatus), true);
    assert.equal(matchesPartnerOutreachFilters(sample, { corridor: 'haitian', hasPhoneAndEmail: true, outreachHold: true }), true);
    assert.equal(matchesPartnerOutreachFilters(sample, { corridor: 'general' }), false);
    assert.equal(matchesPartnerOutreachFilters({ ...sample, hasPhoneAndEmail: false }, { hasPhoneAndEmail: true }), false);
    const haitianMiami = listPartnerOutreachLibrary({ corridor: 'haitian', hasPhoneAndEmail: true, outreachHold: true });
    assert.ok(haitianMiami.length > 0);
    assert.ok(haitianMiami.every((r) => r.corridor === 'haitian' && r.hasPhoneAndEmail && isOutreachHold(r.outreachStatus)));
  });

  it('exports a CSV without sending email', () => {
    const csv = partnerOutreachExportCsv([sample]);
    assert.match(csv, /partner_id,corridor,metro/);
    assert.match(csv, /FC-TEST,haitian,Miami/);
    assert.doesNotMatch(csv, /mailto:/);
  });
});
