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
  mergeCreditorContactLists,
  parseFreeformContactBlock,
  refreshCreditorContactsOnParsed,
} from '../src/creditReports/creditorContactExtract.ts';
import { enrichParsedTradeline } from '../src/creditReports/enrichParsedTradeline.ts';
import {
  autoPersistDebtPartyIfEmpty,
  contactsFromParsedReport,
  listReportCreditorTargets,
  resolveDebtPartyInfo,
} from '../src/lib/debtCreditorIntel.ts';
import { parseCreditReportText } from '../src/creditReports/parseTextReport.ts';

function ok(label) {
  console.log(`  ✓ ${label}`);
}

assert.equal(Boolean(creditorContactSectionHeading('Creditor Contacts')), true);
assert.equal(Boolean(creditorContactSectionHeading('Contact Information')), true);
assert.equal(Boolean(creditorContactSectionHeading('Contactors')), true);
assert.equal(Boolean(creditorContactSectionHeading('Contact Info for Creditors')), true);
assert.equal(Boolean(creditorContactSectionHeading('Furnisher Information')), true);
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

// Two-column Name/Address table must not invent junk creditors from street lines.
const twoColContacts = buildCreditorContacts(
  [],
  [
    {
      key: 'creditor_contacts',
      title: 'Creditor Contacts',
      table: {
        columns: ['Creditor Name', 'Address'],
        rows: [
          ['MIDLAND CREDIT MANAGEMENT', 'PO BOX 939069 SAN DIEGO CA 92193'],
          ['PORTFOLIO RECOVERY ASSOCIATES LLC', '120 CORPORATE BLVD NORFOLK VA 23502'],
        ],
      },
    },
  ],
);
assert.equal(twoColContacts.length, 2, `expected 2 contacts, got ${twoColContacts.length}: ${JSON.stringify(twoColContacts.map((c) => c.creditorName))}`);
assert.ok(!twoColContacts.some((c) => /^PO BOX/i.test(c.creditorName)), 'PO BOX must not become a creditor name');
assert.ok(!twoColContacts.some((c) => /NORFOLK/i.test(c.creditorName)), 'city line must not become a creditor name');
ok('two-column Creditor Contacts has no junk street-name rows');

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

const thinCached = {
  tradelines,
  sections,
  creditorContacts: [{ creditorName: 'MIDLAND CREDIT MANAGEMENT', source: 'section' }],
};
const refreshed = refreshCreditorContactsOnParsed(thinCached);
assert.ok(
  (refreshed.creditorContacts || []).some((c) => /midland/i.test(c.creditorName) && c.address),
  'refresh recovers address from sections',
);
ok('refreshCreditorContactsOnParsed recovers address');

const merged = mergeCreditorContactLists(
  [{ creditorName: 'MIDLAND CREDIT MANAGEMENT', source: 'section' }],
  [
    {
      creditorName: 'MIDLAND CREDIT MANAGEMENT',
      address: 'PO BOX 2121 WARREN MI 48090',
      phone: '800-265-8825',
      source: 'section',
    },
  ],
);
assert.ok(merged[0]?.address);
ok('mergeCreditorContactLists prefers address-bearing');

const fromParsed = contactsFromParsedReport(thinCached);
assert.ok(fromParsed.some((c) => c.address), 'contactsFromParsedReport rebuilds past thin cache');
ok('contactsFromParsedReport rebuilds past thin cache');

const textReport = [
  'IdentityIQ Credit Report',
  'Creditor Contacts',
  'MIDLAND CREDIT MANAGEMENT',
  'PO BOX 2121',
  'WARREN MI 48090',
  '(800) 265-8825',
  'PORTFOLIO RECOVERY ASSOCIATES',
  '120 CORPORATE BLVD',
  'NORFOLK VA 23502',
  '800-772-1413',
  'Account History',
  'Creditor Name Midland Credit Management',
  'Account Status Collection',
  'Balance $1,094',
].join('\n');
const parsedText = parseCreditReportText(textReport, 'identityiq');
assert.ok(
  (parsedText.creditorContacts || []).some((c) => /midland/i.test(c.creditorName) && c.address),
  `text parse should extract Midland address, got ${JSON.stringify(parsedText.creditorContacts)}`,
);
assert.ok(
  (parsedText.creditorContacts || []).some((c) => /portfolio/i.test(c.creditorName) && c.address),
  'text parse should extract PRA address',
);
ok(`parseCreditReportText Creditor Contacts (${parsedText.creditorContacts?.length || 0})`);

const party = resolveDebtPartyInfo({
  debt: {
    id: 'debt_test',
    partnerId: 'p1',
    type: 'debt',
    name: 'MIDLAND CREDIT MANAGEMENT',
    amountCents: 109400,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  signals: [],
  contacts: parsedText.creditorContacts || [],
});
assert.ok(party.recipientAddress, `debt party should get report contact address, got ${party.recipientAddress}`);
assert.match(party.recipientName, /midland/i);
assert.equal(party.matchedFrom, 'report_contact');
ok('resolveDebtPartyInfo uses report Creditor Contacts for letter TO');

// Report contacts beat litigation document scrapes for the collector TO block.
const partyBeatsDoc = resolveDebtPartyInfo({
  debt: {
    id: 'debt_test2',
    partnerId: 'p1',
    type: 'debt',
    name: 'MIDLAND CREDIT MANAGEMENT',
    amountCents: 109400,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  signals: [],
  contacts: parsedText.creditorContacts || [],
  documents: [
    {
      id: 'doc1',
      partnerId: 'p1',
      kind: 'summons',
      createdAt: new Date().toISOString(),
      entities: {
        collectorName: 'MIDLAND CREDIT MANAGEMENT',
        address: '999 COURT HOUSE RD SOMEWHERE ST 00000',
        plaintiffLawFirmAddress: '1 LAW FIRM WAY ANYTOWN NY 10001',
      },
    },
  ],
});
assert.match(partyBeatsDoc?.recipientAddress || '', /2121/);
assert.equal(partyBeatsDoc?.matchedFrom, 'report_contact');
ok('report Creditor Contacts beat summons scrape for letter TO');

const emptyDebt = {
  id: 'debt_empty',
  partnerId: 'p1',
  type: 'debt',
  name: 'MIDLAND CREDIT MANAGEMENT',
  amountCents: 109400,
  status: 'open',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const persisted = autoPersistDebtPartyIfEmpty(emptyDebt, party);
assert.ok(persisted?.recipientAddress?.includes('2121'), 'autoPersist should write report address onto empty debt');
ok('autoPersistDebtPartyIfEmpty writes report contact onto debt');

assert.ok(tradelinesFilled[0].creditorAddress);
assert.ok(contacts.some((c) => c.source === 'section' && c.address));
ok('report contact shape ready for letter TO autofill');

// --- Validation / Affidavit panel surface -----------------------------------
// The chips those centers render come from listReportCreditorTargets, so a
// report with only a Creditor Contacts section (no tradelines) must still
// produce address-bearing targets.
const contactsOnlyTargets = listReportCreditorTargets([{ id: 'rep_contacts_only', parsed: parsedText }]);
assert.ok(contactsOnlyTargets.length >= 2, `expected report targets, got ${contactsOnlyTargets.length}`);
assert.ok(
  contactsOnlyTargets.some((t) => /midland/i.test(t.creditorName) && t.hasAddress && /2121/.test(t.address || '')),
  'Midland target should carry the report mailing address',
);
ok(`listReportCreditorTargets from Creditor Contacts (${contactsOnlyTargets.length})`);

const tradelineTargets = listReportCreditorTargets([{ id: 'rep_full', parsed: { tradelines, sections } }]);
assert.ok(
  tradelineTargets.some((t) => /midland/i.test(t.creditorName) && t.hasAddress),
  'tradeline target should inherit the section contact address',
);
assert.equal(
  tradelineTargets.filter((t) => /midland/i.test(t.creditorName)).length,
  1,
  'one Midland account must not render as two chips',
);
ok(`listReportCreditorTargets from tradelines + sections (${tradelineTargets.length})`);

// No debt case selected: the panel still needs a recipient preview so the
// fields are not blank before a case exists.
const noDebtParty = resolveDebtPartyInfo({
  debt: null,
  signals: [],
  contacts: parsedText.creditorContacts || [],
});
assert.ok(noDebtParty?.recipientAddress, 'no-debt preview should fall back to a report contact address');
assert.equal(noDebtParty?.matchedFrom, 'report_contact');
ok('resolveDebtPartyInfo previews report contact with no debt case');

// A negative tradeline with no mailing block of its own borrows the contact's.
const noDebtSignalParty = resolveDebtPartyInfo({
  debt: null,
  signals: [
    {
      signalId: 'r1:0',
      reportId: 'r1',
      tradelineIndex: 0,
      creditorName: 'MIDLAND CREDIT MANAGEMENT',
      negativeType: 'collection',
      classifiedNegative: 'collection',
      confidence: 'medium',
    },
  ],
  contacts: parsedText.creditorContacts || [],
});
assert.match(noDebtSignalParty?.recipientAddress || '', /2121/);
ok('no-debt tradeline preview borrows the Creditor Contact address');

// Summons scrape filled the firm block but the collector mailing block is still
// empty — the report contact must still land on the case.
const firmOnlyDebt = {
  id: 'debt_firm_only',
  partnerId: 'p1',
  type: 'summons',
  name: 'MIDLAND CREDIT MANAGEMENT',
  amountCents: 109400,
  status: 'open',
  plaintiffLawFirm: 'SOME COLLECTION LAW FIRM',
  plaintiffLawFirmAddress: '1 LAW FIRM WAY ANYTOWN NY 10001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const firmOnlyParty = resolveDebtPartyInfo({
  debt: firmOnlyDebt,
  signals: [],
  contacts: parsedText.creditorContacts || [],
});
assert.match(firmOnlyParty?.reportContactAddress || '', /2121/);
const firmOnlyPersisted = autoPersistDebtPartyIfEmpty(firmOnlyDebt, firmOnlyParty);
assert.match(
  firmOnlyPersisted?.recipientAddress || '',
  /2121/,
  'empty recipient address should fill from the report even when firm fields are set',
);
assert.equal(firmOnlyPersisted?.plaintiffLawFirmAddress, '1 LAW FIRM WAY ANYTOWN NY 10001');
ok('autoPersist fills empty recipient block behind a scraped firm block');

// Re-running must be a no-op once the case already carries name + address.
assert.equal(
  autoPersistDebtPartyIfEmpty(
    { ...firmOnlyDebt, recipientName: 'MIDLAND CREDIT MANAGEMENT', recipientAddress: 'PO BOX 2121\nWARREN MI 48090' },
    firmOnlyParty,
  ),
  null,
  'autoPersist should not rewrite a case that already has a recipient block',
);
ok('autoPersist is idempotent once the recipient block is filled');

console.log('\nAll creditor-contact extract checks passed.');
