/**
 * Smoke test: generate the original ivory structured premium PDF.
 * Run: npx tsx scripts/smoke-structured-premium-pdf.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  process.chdir(root);
  const { composeStructuredPremiumCreditAnalysisPdf } = await import('../src/reports/composeStructuredPremiumCreditAnalysis.ts');

  const partner = {
    id: 'p1',
    profile: { fullName: 'Yolie Jean Benoit', email: 'yolie@example.com' },
  };

  const tradelines = [
    { creditorName: 'Chase Sapphire', accountType: 'Revolving', accountStatus: 'Open', balance: 2400, creditLimit: 12000, dateOpened: '2019-03-01' },
    { creditorName: 'Capital One', accountType: 'Revolving', accountStatus: 'Open', balance: 890, creditLimit: 5000, dateOpened: '2020-08-15' },
    { creditorName: 'Amex Gold', accountType: 'Revolving', accountStatus: 'Open', balance: 120, creditLimit: 8000, dateOpened: '2018-01-10' },
    { creditorName: 'Toyota Financial', accountType: 'Installment', accountStatus: 'Open', balance: 14200, creditLimit: 22000, dateOpened: '2021-06-01' },
    { creditorName: 'Midland Credit', accountType: 'Collection', accountStatus: 'Collection', balance: 640 },
    { creditorName: 'LVNV Funding', accountType: 'Collection', accountStatus: 'Collection', balance: 412 },
    { creditorName: 'Synchrony', accountType: 'Revolving', accountStatus: 'Open', balance: 0, creditLimit: 3000, dateOpened: '2016-05-01' },
  ];

  const parsed = {
    provider: 'smartcredit',
    reportDate: '2025-07-16',
    tradelines,
    scores: [
      { model: 'FICO 8', bureau: 'TUC', value: 850 },
      { model: 'FICO 8', bureau: 'EXP', value: 850 },
      { model: 'FICO 8', bureau: 'EQF', value: 577 },
    ],
    sections: [
      {
        key: 'inquiries',
        title: 'Inquiries',
        items: Array.from({ length: 3 }, (_, i) => ({ label: `Lender ${i + 1}`, value: '2024-01-01' })),
      },
    ],
  };

  const candidates = [
    { id: 'c1', account: 'Midland Credit', type: 'Collection', status: 'Open', bureau: 'EXP', code: 'COL', severity: 80 },
    { id: 'c2', account: 'LVNV Funding', type: 'Collection', status: 'Open', bureau: 'TUC', code: 'COL', severity: 74 },
    { id: 'c3', account: 'Capital One', type: 'Late Payment', status: '30 Days', bureau: 'EQF', code: '30', severity: 66 },
  ];

  const report = {
    id: 'r1',
    parsed,
    filename: 'yolie.html',
    provider: 'smartcredit',
    reportDate: '2025-07-16',
  };

  const bytes = await composeStructuredPremiumCreditAnalysisPdf({
    partner,
    report,
    candidates,
    generatedAt: new Date('2026-07-06'),
  });

  const out = path.join(root, '_import_credit_analysis', 'smoke_structured_premium_output.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, bytes);

  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes);
  console.log('Wrote', out);
  console.log('Pages:', doc.getPageCount());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
