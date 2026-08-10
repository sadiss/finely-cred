/**
 * Extract full-page spread PNGs from the approved reference PDF (2× scale).
 * Run: node scripts/extract-premium-spread-pngs.mjs [pdfPath]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pdf } from 'pdf-to-img';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const NAMES = [
  '01_sophisticated_credit_analysis_spread.png',
  '02_credit_readiness_and_analysis_overview.png',
  '03_financial_report_analysis_spread_design.png',
  '04_credit_analysis_report_spread_4_of_10.png',
  '05_corporate_credit_action_plan_overview.png',
  '06_credit_analysis_report_overview.png',
  '07_credit_insights_for_a_brighter_future.png',
  '08_building_freedom_through_strategic_credit.png',
  '09_luxurious_financial_report_design_spread.png',
  '10_elite_credit_positioning_path_guide.png',
];

const defaultPdf = path.join(root, '_import_credit_analysis', 'finely_cred_premium_credit_analysis_report_all_spreads.pdf');
const altPdf = 'f:\\Content\\Finely Cred\\Onboard\\finely_cred_premium_credit_analysis_report_all_spreads.pdf';
const pdfPath = process.argv[2] || (fs.existsSync(defaultPdf) ? defaultPdf : altPdf);
const outDir = path.join(root, 'public', 'credit-analysis', 'premium-spreads', 'v1');

if (!fs.existsSync(pdfPath)) {
  console.error('Missing reference PDF:', pdfPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const doc = await pdf(pdfPath, { scale: 2 });
let page = 0;
for await (const image of doc) {
  if (page >= NAMES.length) break;
  const out = path.join(outDir, NAMES[page]);
  fs.writeFileSync(out, image);
  console.log('Wrote', out, image.length, 'bytes');
  page += 1;
}

if (page < NAMES.length) {
  console.error(`Expected ${NAMES.length} pages, got ${page}`);
  process.exit(1);
}

console.log('Done —', page, 'spreads at', outDir);
