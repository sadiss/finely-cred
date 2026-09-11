/**
 * Haitian community marketing pieces — unique PDF per architecture.
 * Kreyòl stays WinAnsi-safe (Latin-1). No generic accent-bar leftover page.
 */
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { HAITIAN_DESK_KITS } from '../lib/haitianDeskKits';
import { haitianPieceById } from '../lib/haitianPieceSpec';
import { drawHaitianPiecePages } from './haitianPdfLayouts';
import { downloadPdfBytes } from './sheetPdfKit';

export function canBuildHaitianDeskKitPdf(kitId: string): boolean {
  return Boolean(haitianPieceById(kitId)) || HAITIAN_DESK_KITS.some((kit) => kit.id === kitId);
}

export async function buildHaitianDeskKitPdf(kitId: string): Promise<Uint8Array> {
  const piece = haitianPieceById(kitId);
  if (!piece) {
    throw new Error(`No PDF for kit "${kitId}".`);
  }

  const doc = await PDFDocument.create();
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { times, timesBold, sans, sansBold, regular: times, bold: timesBold };

  doc.setTitle(`${piece.title} — Finely Cred`);
  doc.setSubject('Educational Haitian community marketing piece. Not legal advice.');
  doc.setProducer('Finely Cred');
  doc.setCreator('Finely Cred');

  await drawHaitianPiecePages(doc, fonts, piece);
  return doc.save();
}

export async function downloadHaitianDeskKitPdf(kitId: string) {
  const bytes = await buildHaitianDeskKitPdf(kitId);
  downloadPdfBytes(bytes, `finely-cred-haitian-${kitId}.pdf`);
}
