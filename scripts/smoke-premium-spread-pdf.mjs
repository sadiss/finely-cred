/**
 * Smoke test: generate premium spread PDF with mock view model data.
 * Run: npm run smoke:premium-spread-pdf
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  process.chdir(root);
  const { composePremiumSpreadCreditAnalysisPdf } = await import('../src/reports/composePremiumSpreadCreditAnalysis.ts');
  const { TARGET_MIN_SPREAD_PAGES } = await import('../src/reports/spreadOverlayRegistry.ts');

  const partner = {
    id: 'p1',
    profile: { fullName: 'Jordan Sample', email: 'jordan@example.com' },
  };

  const tradelines = [
    { creditorName: 'Chase Sapphire', accountType: 'Revolving', accountStatus: 'Open', balance: 2400, creditLimit: 12000, dateOpened: '2019-03-01' },
    { creditorName: 'Capital One', accountType: 'Revolving', accountStatus: 'Open', balance: 890, creditLimit: 5000, dateOpened: '2020-08-15' },
    { creditorName: 'Amex Gold', accountType: 'Revolving', accountStatus: 'Open', balance: 120, creditLimit: 8000, dateOpened: '2018-01-10' },
    { creditorName: 'Toyota Financial', accountType: 'Installment', accountStatus: 'Open', balance: 14200, creditLimit: 22000, dateOpened: '2021-06-01' },
    { creditorName: 'Discover', accountType: 'Revolving', accountStatus: 'Open', balance: 3100, creditLimit: 7500, dateOpened: '2017-11-20' },
    { creditorName: 'Midland Credit', accountType: 'Collection', accountStatus: 'Collection', balance: 640 },
    { creditorName: 'LVNV Funding', accountType: 'Collection', accountStatus: 'Collection', balance: 412 },
    { creditorName: 'Synchrony', accountType: 'Revolving', accountStatus: 'Open', balance: 0, creditLimit: 3000, dateOpened: '2016-05-01' },
  ];

  const parsed = {
    provider: 'smartcredit',
    tradelines,
    scores: [
      { model: 'FICO 8', bureau: 'TUC', value: 682 },
      { model: 'FICO 8', bureau: 'EXP', value: 674 },
      { model: 'FICO 8', bureau: 'EQF', value: 689 },
    ],
    sections: [
      {
        key: 'inquiries',
        title: 'Inquiries',
        items: Array.from({ length: 6 }, (_, i) => ({ label: `Lender ${i + 1}`, value: '2024-01-01' })),
      },
    ],
  };

  const candidates = [
    { id: 'c1', account: 'Midland Credit', type: 'Collection', status: 'Open', bureau: 'EXP', code: 'COL' },
    { id: 'c2', account: 'LVNV Funding', type: 'Collection', status: 'Open', bureau: 'TUC', code: 'COL' },
    { id: 'c3', account: 'Capital One', type: 'Late Payment', status: '30 Days', bureau: 'EQF', code: '30' },
    { id: 'c4', account: 'Discover', type: 'High Utilization', status: 'Open', bureau: 'EXP', code: 'UTIL' },
    { id: 'c5', account: 'Chase Sapphire', type: 'Inquiry', status: 'Hard', bureau: 'TUC', code: 'INQ' },
  ];

  const report = { id: 'r1', parsed, filename: 'sample.html', provider: 'smartcredit' };
  const bytes = await composePremiumSpreadCreditAnalysisPdf({
    partner,
    report,
    candidates,
    generatedAt: new Date('2026-07-03'),
  });

  const out = path.join(root, '_import_credit_analysis', 'smoke_premium_spread_output.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, bytes);

  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPageCount();
  console.log('Wrote', out);
  console.log('Pages:', pages, `(target min ${TARGET_MIN_SPREAD_PAGES})`);
  if (pages < TARGET_MIN_SPREAD_PAGES) {
    console.error('Page count below target');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
