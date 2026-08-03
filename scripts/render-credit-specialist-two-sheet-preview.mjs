/**
 * Build the Credit Specialist two-sheet playbook PDF and render both pages as PNGs.
 * Run: npx tsx scripts/render-credit-specialist-two-sheet-preview.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pdf } from 'pdf-to-img';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.preview-cs-two-sheet');

async function main() {
  process.chdir(root);
  const { buildCreditSpecialistTwoSheetPdf } = await import(
    '../src/resources/buildCreditSpecialistTwoSheetPdf.ts'
  );

  fs.mkdirSync(outDir, { recursive: true });

  const bytes = await buildCreditSpecialistTwoSheetPdf();
  const pdfPath = path.join(outDir, 'credit-specialist-two-sheet.pdf');
  fs.writeFileSync(pdfPath, bytes);
  console.log('Wrote PDF', pdfPath, bytes.length, 'bytes');

  const doc = await pdf(pdfPath, { scale: 2 });
  let page = 0;
  for await (const image of doc) {
    page += 1;
    const pngPath = path.join(outDir, `sheet-${page}.png`);
    fs.writeFileSync(pngPath, image);
    console.log('Wrote PNG', pngPath, image.length, 'bytes');
  }
  if (page !== 2) {
    console.error(`Expected 2 pages, rendered ${page}`);
    process.exit(1);
  }
  console.log('Done — previews at', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
