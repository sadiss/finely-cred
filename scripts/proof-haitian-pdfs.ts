/**
 * Fulfilment proof: every Haitian closet piece builds a PDF.
 * Writes qa-shots/haitian-pdfs/*.pdf for the four guest-proof objects.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { HAITIAN_METRO_DESKS } from '../src/lib/haitianMetroDesks.ts';
import { HAITIAN_PLACE_CARDS } from '../src/lib/haitianCompanionDesk.ts';
import { HAITIAN_PIECES } from '../src/lib/haitianPieceSpec.ts';
import { HAITIAN_DESK_KITS } from '../src/lib/haitianDeskKits.ts';
import { buildHaitianDeskKitPdf } from '../src/resources/buildHaitianDeskKitPdf.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qa-shots', 'haitian-pdfs');
const proofIds = ['letter-meaning', 'litigation', 'community-flyer', 'helper'] as const;

mkdirSync(outDir, { recursive: true });

const ids = HAITIAN_PIECES.map((piece) => piece.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (HAITIAN_PIECES.length !== 37) {
  throw new Error(`Expected 37 Haitian pieces, got ${HAITIAN_PIECES.length}.`);
}
if (dupes.length) throw new Error(`Duplicate piece ids: ${dupes.join(', ')}`);
if (HAITIAN_DESK_KITS.length !== HAITIAN_PIECES.length) {
  throw new Error(`Kit list (${HAITIAN_DESK_KITS.length}) does not match pieces (${HAITIAN_PIECES.length}).`);
}

for (const desk of HAITIAN_METRO_DESKS) {
  if (!haitianPieceByIdSafe(desk.pieceId)) {
    throw new Error(`Metro desk ${desk.slug} points at missing piece "${desk.pieceId}".`);
  }
  if (!HAITIAN_PLACE_CARDS.some((place) => place.key === desk.placeKey && place.cityPath === `/haitian/${desk.slug}`)) {
    throw new Error(`Metro desk ${desk.slug} has no matching place card.`);
  }
}

function haitianPieceByIdSafe(id: string) {
  return HAITIAN_PIECES.find((piece) => piece.id === id);
}

let failed = 0;
for (const piece of HAITIAN_PIECES) {
  try {
    const bytes = await buildHaitianDeskKitPdf(piece.id);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPageCount();
    if (pages < 1) throw new Error('zero pages');
    const latin = Buffer.from(bytes).toString('latin1');
    const dollarHits = [...latin.matchAll(/\$\d/g)].map((m) => m[0]);
    if (proofIds.includes(piece.id as (typeof proofIds)[number])) {
      writeFileSync(join(outDir, `${piece.id}.pdf`), bytes);
    }
    console.log(`${piece.id}\tpages=${pages}\tbytes=${bytes.byteLength}\tdollarHits=${dollarHits.length}`);
  } catch (error) {
    failed += 1;
    console.error(`${piece.id}\tFAIL\t${error instanceof Error ? error.message : error}`);
  }
}

if (failed) {
  throw new Error(`${failed} Haitian PDF(s) failed to build.`);
}
console.log(`ok\t${HAITIAN_PIECES.length} pieces`);
