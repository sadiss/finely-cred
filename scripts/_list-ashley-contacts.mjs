import fs from 'node:fs';

const path = process.argv[2] || `f:\\Ashley Ann's Report.html`;
const html = fs.readFileSync(path, 'utf8');
const block = html.match(
  /id=["']CreditorContacts["'][\s\S]*?(<table[^>]*class=["'][^"']*rpt_content_contacts[^"']*["'][\s\S]*?<\/table>)/i,
);
if (!block) {
  console.log('NO TABLE FOUND');
  process.exit(1);
}

const rows = [...block[1].matchAll(/<tr[^>]*ng-repeat=["']subsr in subscribers["'][\s\S]*?<\/tr>/gi)];
const list = rows.map((m, i) => {
  const tds = [...m[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) =>
    x[1]
      .replace(/<br\s*\/?>/gi, ', ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  return `${i + 1}. ${tds[0] || '?'} | ${tds[1] || '(no addr)'} | ${tds[2] || '—'}`;
});

console.log(`TOTAL: ${list.length}`);
console.log(list.join('\n'));
