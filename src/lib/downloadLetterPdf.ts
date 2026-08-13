import type { LetterRecord } from '../domain/letters';
import { getBlobUrl } from '../storage/getBlobUrl';
import { triggerBrowserDownload } from '../utils/download';

function letterPdfFilename(letter: LetterRecord): string {
  const named = (letter.pdfFilename || '').trim();
  if (named) return named.endsWith('.pdf') ? named : `${named}.pdf`;
  const slug = (letter.title || 'letter')
    .replace(/[^\w\s.-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${slug || 'letter'}.pdf`;
}

/** Save letter PDF to the partner's device (all letter types with a stored PDF). */
export async function downloadLetterPdf(letter: LetterRecord): Promise<{ ok: boolean; message?: string }> {
  if (!letter.pdfBlobRef) {
    return { ok: false, message: 'No PDF on this letter yet — generate or save a PDF first.' };
  }
  const res = await getBlobUrl(letter.pdfBlobRef);
  if (!res?.url) {
    return { ok: false, message: 'Download link unavailable.' };
  }
  triggerBrowserDownload({
    url: res.url,
    filename: letterPdfFilename(letter),
    targetBlank: true,
  });
  return { ok: true };
}
