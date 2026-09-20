import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addIdentity, emptyDedupeIndex, findDedupeHit, primaryDedupeKey } from './dedupe.ts';
import { prospectReferralPartners } from './engine.ts';
import { prospectsToCsv } from './exportCsv.ts';
import { normalizeDomain, normalizeEmail, normalizePhone } from './normalize.ts';
import { scoreCandidate } from './score.ts';
import { isCompetitorBusiness, isConsumerLeadDump, isThinRow, skipReasonFor } from './skip.ts';
import { BATCH_CSV_COLUMNS } from './types.ts';

test('normalize email / phone / domain', () => {
  assert.equal(normalizeEmail('  Info@Example.com '), '');
  assert.equal(normalizeEmail('desk@vdt-cpa.com'), 'desk@vdt-cpa.com');
  assert.equal(normalizePhone('(305) 555-0199'), '3055550199');
  assert.equal(normalizePhone('555-0199'), '');
  assert.equal(normalizeDomain('https://www.KaufmanRossin.com/contact'), 'kaufmanrossin.com');
});

test('skip competing credit-repair shops', () => {
  assert.equal(
    isCompetitorBusiness({ businessName: 'Skyline Credit Repair Miami', website: 'https://skylinecreditrepair.com' }),
    true,
  );
  assert.equal(
    isCompetitorBusiness({ businessName: 'Kaufman Rossin', website: 'https://kaufmanrossin.com', snippet: 'Miami CPA firm' }),
    false,
  );
  assert.equal(skipReasonFor({ businessName: '609 Letters Factory', vertical: 'tax', website: 'https://609letters.example' }), 'competitor');
});

test('skip thin rows and consumer PII dumps', () => {
  assert.equal(isThinRow({}), true);
  assert.equal(isThinRow({ website: 'https://www.yelp.com/biz/random' }), true);
  assert.equal(isThinRow({ website: 'https://kaufmanrossin.com' }), false);
  assert.equal(
    isConsumerLeadDump({
      businessName: 'Florida email dump 50k leads',
      vertical: 'tax',
      snippet: 'buy 50000 leads with SSN',
      consumerList: false,
    }),
    true,
  );
});

test('scoring: strong vs maybe vs skip', () => {
  const strong = scoreCandidate({
    businessName: 'Sant La Haitian Neighborhood Center',
    city: 'North Miami',
    vertical: 'immigration',
    website: 'https://www.santla.org',
    phone: '3057580500',
    email: 'info@santla.org',
    snippet: 'Haitian neighborhood center — immigration and family services',
  });
  assert.equal(strong.fit, 'strong');
  assert.ok(strong.score >= 62);
  assert.match(strong.whyFit, /credit restore/i);
  assert.doesNotMatch(strong.whyFit, /credit repair shop/i);

  const maybe = scoreCandidate({
    businessName: 'H&R Block Miami Gardens',
    city: 'Miami Gardens',
    vertical: 'tax',
    website: 'https://www.hrblock.com',
    snippet: 'Tax preparer Miami Gardens',
  });
  assert.equal(maybe.fit, 'maybe');

  const skip = scoreCandidate({
    businessName: 'Apex Credit Repair',
    city: 'Miami',
    vertical: 'tax',
    website: 'https://apexcreditrepair.com',
    phone: '3055550199',
  });
  assert.equal(skip.fit, 'skip');
});

test('dedupe keys normalize phone/email/domain/name+city', () => {
  const index = emptyDedupeIndex();
  addIdentity(index, {
    emails: ['Owner@Desk.com'],
    phones: ['+1 (786) 555-0144'],
    domains: ['https://www.desk.com/about'],
    names: ['acme tax::miami'],
  });
  assert.equal(findDedupeHit(index, { businessName: 'Other', vertical: 'tax', email: 'owner@desk.com' }), 'email:owner@desk.com');
  assert.equal(findDedupeHit(index, { businessName: 'Other', vertical: 'tax', phone: '7865550144' }), 'phone:7865550144');
  assert.equal(findDedupeHit(index, { businessName: 'Other', vertical: 'tax', website: 'https://desk.com' }), 'domain:desk.com');
  assert.equal(primaryDedupeKey({ businessName: 'Acme Tax', city: 'Miami', vertical: 'tax' }), 'name:acme tax::miami');
});

test('prospectReferralPartners balances verticals, never auto-sends, matches Batch CSV', async () => {
  const prior = emptyDedupeIndex();
  addIdentity(prior, { domains: ['hrblock.com'] });

  const run = await prospectReferralPartners(
    { metros: ['miami', 'miami_gardens', 'north_miami'], verticals: ['tax', 'bhph', 'realtor', 'mortgage', 'immigration'], limit: 25, dedupe: true },
    { loadDedupeIndex: async () => prior },
  );

  assert.equal(run.outreach.autoSend, false);
  assert.ok(run.prospects.length > 0);
  assert.ok(run.prospects.length <= 25);
  assert.ok(run.stats.deduped >= 1, 'H&R Block domain should dedupe');
  assert.ok(run.prospects.every((p) => p.icpFit !== 'skip'));
  assert.ok(run.prospects.every((p) => !p.email || p.email.includes('@')));
  assert.ok(run.prospects.every((p) => /credit restore/i.test(p.draftStub)));
  assert.ok(run.prospects.every((p) => !/^[\s\S]{0,40}credit repair/i.test(p.draftStub)));
  assert.match(run.prospects[0]!.draftStub, /\/haitian/);

  const verticals = new Set(run.prospects.map((p) => p.vertical));
  assert.ok(verticals.size >= 4, `expected a balanced mix, got ${[...verticals]}`);

  const csv = prospectsToCsv(run.prospects);
  const header = csv.split('\n')[0];
  assert.equal(header, BATCH_CSV_COLUMNS.join(','));
  assert.ok(csv.split('\n').length >= run.prospects.length);
});

test('engine does not invent contacts', async () => {
  const run = await prospectReferralPartners({ limit: 10, metros: ['miami'], verticals: ['tax'] });
  for (const p of run.prospects) {
    assert.equal(p.phone, '');
    assert.equal(p.email, '');
    assert.ok(p.website.startsWith('http'));
  }
});
