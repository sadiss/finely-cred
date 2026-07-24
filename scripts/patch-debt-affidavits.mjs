import fs from 'fs';

const p = new URL('../src/legal/debtLetterTemplates.ts', import.meta.url);
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('export function getAffidavitOfDisputeBody');
const end = s.indexOf('export function getCeaseAndDesistBody');
if (start < 0 || end < 0) throw new Error('markers not found');
s = s.slice(0, start) + s.slice(end);
if (!s.includes("from './debtAffidavitBodies'")) {
  s = s.replace(
    "from './parker';",
    "from './parker';\nimport type { DebtLetterBuildArgs } from './debtLetterBuildArgs';\nimport { getAffidavitOfDisputeBody, getSummonsResponseAffidavitBody } from './debtAffidavitBodies';",
  );
}
if (!s.includes('export type { DebtLetterBuildArgs }')) {
  s = s.replace(
    'export function getTimeBarredResponseBody',
    "export type { DebtLetterBuildArgs } from './debtLetterBuildArgs';\n\nexport function getTimeBarredResponseBody",
  );
}
fs.writeFileSync(p, s);
console.log('patched debtLetterTemplates.ts');
