/**
 * Smoke: IdentityIQ Creditor Contacts at bottom of Ashley Ann report.
 * Avoids browser DOMParser — regex-extracts the contacts table then runs extractContactsFromSections.
 */
import fs from 'node:fs';
import { extractContactsFromSections } from '../src/creditReports/creditorContactExtract.ts';

const path = process.argv[2] || `f:\\Ashley Ann's Report.html`;
const html = fs.readFileSync(path, 'utf8');

const blockMatch = html.match(
  /id=["']CreditorContacts["'][\s\S]*?(<table[^>]*class=["'][^"']*rpt_content_contacts[^"']*["'][\s\S]*?<\/table>)/i,
);
if (!blockMatch) {
  console.error('FAIL: could not find #CreditorContacts table.rpt_content_contacts');
  process.exit(1);
}

const tableHtml = blockMatch[1];
const rowMatches = [...tableHtml.matchAll(/<tr[^>]*ng-repeat=["']subsr in subscribers["'][\s\S]*?<\/tr>/gi)];
console.log('HTML subscriber rows:', rowMatches.length);

function cellText(tdHtml) {
  return tdHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const rows = rowMatches.map((m) => {
  const tds = [...m[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) =>
    x[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
  );
  return [tds[0] || '', tds[1] || '', tds[2] || ''];
});

const section = {
  key: 'creditor_contacts',
  title: 'Creditor Contacts',
  table: {
    columns: ['Creditor Name', 'Address', 'Phone Number'],
    rows,
  },
};

const contacts = extractContactsFromSections([section]);
const withAddr = contacts.filter((c) => c.address).length;

console.log(
  JSON.stringify(
    {
      htmlRows: rows.length,
      extracted: contacts.length,
      withAddress: withAddr,
      sample: contacts.slice(0, 4).map((c) => ({
        name: c.creditorName,
        address: (c.address || '').replace(/\s+/g, ' ').slice(0, 90),
        phone: c.phone,
      })),
      missingAddress: contacts.filter((c) => !c.address).map((c) => c.creditorName).slice(0, 8),
    },
    null,
    2,
  ),
);

if (rows.length < 30) {
  console.error(`FAIL: expected ~36 HTML rows, got ${rows.length}`);
  process.exit(1);
}
if (withAddr < 28) {
  console.error(`FAIL: expected 28+ addresses from structured table, got ${withAddr}`);
  process.exit(1);
}
console.log('OK: structured Creditor Contacts extract recovers IdentityIQ bottom table');
