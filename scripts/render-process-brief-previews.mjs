/**
 * Build Business Credit Process Brief PDF and render page PNGs for QA.
 * Run: node --import tsx scripts/render-process-brief-previews.mjs
 *   or: npx tsx scripts/render-process-brief-previews.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pdf } from 'pdf-to-img';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.preview-onesheets');
const names = ['process-brief-p1.png', 'process-brief-p2.png', 'process-brief-p3.png'];

async function main() {
  process.chdir(root);
  const { buildBusinessCreditProcessBriefPdf } = await import(
    '../src/resources/buildBusinessCreditProcessBriefPdf.ts'
  );

  fs.mkdirSync(outDir, { recursive: true });

  const bytes = await buildBusinessCreditProcessBriefPdf();
  const pdfPath = path.join(outDir, 'process-brief.pdf');
  fs.writeFileSync(pdfPath, bytes);
  console.log('Wrote PDF', pdfPath, bytes.length, 'bytes');

  const doc = await pdf(pdfPath, { scale: 2 });
  let page = 0;
  for await (const image of doc) {
    if (page >= names.length) break;
    const out = path.join(outDir, names[page]);
    fs.writeFileSync(out, image);
    console.log('Wrote', out, image.length, 'bytes');
    page += 1;
  }

  if (page < names.length) {
    console.error(`Expected ${names.length} pages, got ${page}`);
    process.exit(1);
  }

  console.log('Done — previews at', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
