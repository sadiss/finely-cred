/**
 * Focused smoke check: creditor/collector contact extraction helpers.
 * Keeps imports free of Vite/supabase. Run: npx tsx scripts/verify-creditor-contact-extract.mjs
 */
import assert from 'node:assert/strict';
import {
  applyCreditorContactsToTradelines,
  buildCreditorContacts,
  creditorContactSectionHeading,
  groupFreeformContactLines,
  looksLikeMailingAddress,
  parseFreeformContactBlock,
} from '../src/creditReports/creditorContactExtract.ts';
import { enrichParsedTradeline } from '../src/creditReports/enrichParsedTradeline.ts';

function ok(label) {
  console.log(`  ✓ ${label}`);
}

assert.equal(Boolean(creditorContactSectionHeading('Creditor Contacts')), true);
assert.equal(Boolean(creditorContactSectionHeading('Contact Information')), true);
assert.equal(Boolean(creditorContactSectionHeading('Contactors')), true);
assert.equal(creditorContactSectionHeading('Personal Information'), null);
ok('section heading detection');

assert.equal(looksLikeMailingAddress('PO BOX 2121 WARREN MI 48090'), true);
assert.equal(looksLikeMailingAddress('MIDLAND CREDIT MANAGEMENT'), false);
ok('mailing address heuristic');

const blob = parseFreeformContactBlock(
  ['MIDLAND CREDIT MANAGEMENT', 'PO BOX 2121', 'WARREN MI 48090-2121', '(800) 265-8825'].join('\n'),
);
assert.ok(blob);
assert.match(blob.creditorName, /midland/i);
assert.ok(looksLikeMailingAddress(blob.address));
assert.ok(blob.phone);
ok('freeform contact block');

const groups = groupFreeformContactLines([
  'MIDLAND CREDIT MANAGEMENT',
  'PO BOX 2121',
  'WARREN MI 48090',
  '(800) 265-8825',
  'PORTFOLIO RECOVERY ASSOCIATES',
  '120 CORPORATE BLVD',
  'NORFOLK VA 23502',
  '800-772-1413',
]);
assert.equal(groups.length, 2);
ok('freeform contact grouping');

const enriched = enrichParsedTradeline({
  creditorName: 'LVNV Funding LLC',
  fields: [
    {
      label: 'Mailing Address',
      byBureau: { EXP: 'PO BOX 10481 GREENVILLE SC 29603', TUC: '', EQF: '' },
    },
    { label: 'Creditor Phone', byBureau: { EXP: '800-555-1212', TUC: '', EQF: '' } },
    { label: 'Account #', byBureau: { EXP: '123456789012', TUC: '', EQF: '' } },
  ],
});
assert.ok(enriched.creditorAddress?.includes('PO BOX'));
assert.ok(enriched.creditorPhone);
ok('enrichParsedTradeline address/phone');

// Reject "Original Creditor" name mistaken as address
const noFalseAddr = enrichParsedTradeline({
  creditorName: 'Portfolio Recovery',
  fields: [
    { label: 'Original Creditor', byBureau: { EXP: 'Capital One', TUC: 'Capital One', EQF: 'Capital One' } },
  ],
});
assert.equal(noFalseAddr.creditorAddress, undefined);
ok('does not treat Original Creditor as address');

const sections = [
  {
    key: 'creditor_contacts',
    title: 'Creditor Contacts',
    table: {
      columns: ['Creditor Name', 'Address', 'Phone'],
      rows: [
        ['MIDLAND CREDIT MANAGEMENT', 'PO BOX 2121 WARREN MI 48090', '(800) 265-8825'],
        ['PORTFOLIO RECOVERY ASSOCIATES', '120 CORPORATE BLVD NORFOLK VA 23502', '800-772-1413'],
      ],
    },
  },
];
const tradelines = [
  enrichParsedTradeline({
    creditorName: 'MIDLAND CREDIT MANAGEMENT',
    accountStatus: 'Collection',
    accountType: 'Collection',
    balance: 1094,
    fields: [
      { label: 'Account Status', byBureau: { EXP: 'Collection', TUC: 'Collection', EQF: 'Collection' } },
      { label: 'Balance', byBureau: { EXP: '$1,094', TUC: '$1,094', EQF: '$1,094' } },
    ],
  }),
];

const contacts = buildCreditorContacts(tradelines, sections);
assert.ok(contacts.length >= 2, `expected section contacts, got ${contacts.length}`);
const midland = contacts.find((c) => /midland/i.test(c.creditorName));
assert.ok(midland?.address && looksLikeMailingAddress(midland.address));
ok(`buildCreditorContacts from section (${contacts.length})`);

const tradelinesFilled = applyCreditorContactsToTradelines(tradelines, contacts);
assert.ok(tradelinesFilled[0]?.creditorAddress?.includes('2121'));
ok('section address applied onto tradeline');

const freeformContacts = buildCreditorContacts(
  [],
  [
    {
      key: 'creditor_contacts',
      title: 'Creditor Contacts',
      table: {
        columns: ['Details'],
        rows: [
          ['MIDLAND CREDIT MANAGEMENT'],
          ['PO BOX 2121'],
          ['WARREN MI 48090'],
          ['(800) 265-8825'],
        ],
      },
    },
  ],
);
assert.ok(freeformContacts.some((c) => /midland/i.test(c.creditorName) && c.address));
ok('freeform Details section extract');

// Letter path wiring (resolveLetterMailRecipient) is covered via typecheck + LettersCommandCenter;
// here we assert the data shape the letter layer consumes.
assert.ok(tradelinesFilled[0].creditorAddress);
assert.ok(contacts.some((c) => c.source === 'section' && c.address));
ok('report contact shape ready for letter TO autofill');

console.log('\nAll creditor-contact extract checks passed.');
