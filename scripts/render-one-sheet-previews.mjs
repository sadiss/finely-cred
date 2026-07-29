/**
 * Build Business Credit one-sheet PDFs and render preview PNGs.
 * Run: node --import tsx scripts/render-one-sheet-previews.mjs
 *   or: npx tsx scripts/render-one-sheet-previews.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pdf } from 'pdf-to-img';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.preview-onesheets');

const SHEETS = ['fundability_roadmap', 'overview', 'builder', 'empire'];

async function main() {
  process.chdir(root);
  const { buildBusinessCreditOneSheetPdf } = await import('../src/resources/buildBusinessCreditOneSheetPdf.ts');

  fs.mkdirSync(outDir, { recursive: true });

  for (const id of SHEETS) {
    const bytes = await buildBusinessCreditOneSheetPdf(id);
    const pdfPath = path.join(outDir, `${id}.pdf`);
    fs.writeFileSync(pdfPath, bytes);
    console.log('Wrote PDF', pdfPath, bytes.length, 'bytes');

    const doc = await pdf(pdfPath, { scale: 2 });
    let page = 0;
    for await (const image of doc) {
      if (page > 0) break;
      const pngPath = path.join(outDir, `${id}.png`);
      fs.writeFileSync(pngPath, image);
      console.log('Wrote PNG', pngPath, image.length, 'bytes');
      page += 1;
    }
    if (page < 1) {
      console.error(`No pages rendered for ${id}`);
      process.exit(1);
    }
  }

  console.log('Done — previews at', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
